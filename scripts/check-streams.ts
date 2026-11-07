/**
 * Stream health check — writes public/data/channels.verified.json (the only data the app shows).
 *
 *   npm run check:streams:quick                         # 13 featured countries, max 60 streams each
 *   npm run check:streams -- --countries US,MX --per-country 150
 *   npm run check:streams -- --featured --fail-on-zero  # exit 2 if a featured country has 0 live channels
 *
 * Guards (so a bad run can never wipe the published list):
 *   - 0 playable streams            -> exit 1, file not written
 *   - online < --min-ratio x previous (default 0.5) -> exit 1, file not written (use --force to override)
 * In GitHub Actions it also writes a summary table and ::warning annotations.
 */
import { appendFileSync, existsSync, readFileSync } from 'fs';
import path from 'path';
import { buildVerifiedCatalog, DEFAULT_CATALOG_PATH, readCatalog, writeCatalog } from '../lib/catalog';
import { FEATURED_COUNTRIES } from '../lib/featured-countries';
import { countryName } from '../lib/countries';

function loadDotEnv() {
  const file = path.join(process.cwd(), '.env');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

const argv = process.argv.slice(2);
const arg = (name: string) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const has = (name: string) => argv.includes(`--${name}`);
const csv = (v?: string) => v?.split(',').map((s) => s.trim()).filter(Boolean);
const num = (v?: string) => (v !== undefined ? Number(v) : undefined);
const inCI = process.env.GITHUB_ACTIONS === 'true';
const warn = (title: string, msg: string) => console.log(inCI ? `::warning title=${title}::${msg}` : `  ⚠️  ${msg}`);
const fail = (title: string, msg: string) => console.log(inCI ? `::error title=${title}::${msg}` : `  ❌ ${msg}`);

async function main() {
  loadDotEnv();
  const started = Date.now();
  const out = arg('out') ?? DEFAULT_CATALOG_PATH;
  const countries = has('featured') ? [...FEATURED_COUNTRIES] : csv(arg('countries'));
  const perCountry = num(arg('per-country'));
  const minRatio = num(arg('min-ratio')) ?? 0.5;

  console.log('SmartTV+ stream health check');
  console.log(`  countries: ${countries?.join(',') ?? 'ALL'} · per country: ${perCountry ?? 'no cap'} · output: ${out}`);

  const { catalog, reasons } = await buildVerifiedCatalog({
    countries,
    categories: csv(arg('categories')),
    perCountry,
    limit: num(arg('limit')),
    concurrency: num(arg('concurrency')),
    check: {
      ...(arg('timeout') ? { timeoutMs: Number(arg('timeout')) } : {}),
      ...(has('no-deep') ? { deep: false } : {}),
    },
    onProgress: (done, total, online) => {
      if (!inCI && (done % 25 === 0 || done === total)) process.stdout.write(`\r  checked ${done}/${total} · online ${online}   `);
    },
  });

  const secs = Math.round((Date.now() - started) / 1000);
  const pct = catalog.total ? ((catalog.online / catalog.total) * 100).toFixed(1) : '0';
  console.log(`\n\n  ✅ ${catalog.online} of ${catalog.total} streams playable (${pct}%) in ${secs}s\n`);

  // ---- per-country table (Rule 2 coverage) ----
  const coverage = catalog.coverage ?? {};
  const zero: string[] = [];
  const rows = FEATURED_COUNTRIES.map((cc) => {
    const r = coverage[cc] ?? { checked: 0, online: 0 };
    if (r.online === 0) zero.push(cc);
    return { cc, name: countryName(cc), ...r };
  });
  console.log('  Featured countries (online / checked):');
  rows.forEach((r) => console.log(`   ${r.cc}  ${r.name.padEnd(16)} ${String(r.online).padStart(4)} / ${r.checked}${r.online === 0 ? '  ⚠️ none live' : ''}`));

  const topReasons = Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 12);
  console.log('\n  Removed, by reason:');
  topReasons.forEach(([reason, n]) => console.log(`   ${String(n).padStart(6)}  ${reason}`));
  console.log('');

  if (process.env.GITHUB_STEP_SUMMARY) {
    const md = [
      `## SmartTV+ stream check — ${catalog.online} of ${catalog.total} playable (${pct}%)`,
      '',
      '| Country | Online | Checked | Flag |',
      '|---|---:|---:|---|',
      ...rows.map((r) => `| ${r.cc} ${r.name} | ${r.online} | ${r.checked} | ${r.online === 0 ? '⚠️ none live' : ''} |`),
      '',
      '### Removed, by reason',
      '| Count | Reason |',
      '|---:|---|',
      ...topReasons.map(([reason, n]) => `| ${n} | ${reason} |`),
      '',
    ].join('\n');
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
  }

  // ---- guards ----
  if (catalog.online === 0) {
    fail('No playable streams', 'The check found 0 playable streams. Keeping the previous list (file not written).');
    process.exit(1);
  }
  const previous = await readCatalog(out);
  if (!has('force') && previous && previous.online > 0 && catalog.online < previous.online * minRatio) {
    fail(
      'Sharp drop',
      `Only ${catalog.online} playable vs ${previous.online} last time (< ${minRatio * 100}%). Keeping the previous list. Re-run with --force if this is real.`,
    );
    process.exit(1);
  }

  await writeCatalog(catalog, out);
  console.log(`  Written to ${out}`);

  if (zero.length) {
    warn('Countries with no live channels', `No live channels for: ${zero.join(', ')}`);
    if (has('fail-on-zero')) process.exit(2);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
