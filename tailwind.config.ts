import type { Config } from 'tailwindcss';

/** Colours are CSS variables (src/index.css) so every class works in light AND dark mode. */
const v = (name: string) => `rgb(var(--tv-${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './hooks/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tv: {
          bg: v('bg'),
          surface: v('surface'),
          card: v('card'),
          line: v('line'),
          fg: v('fg'),
          muted: v('muted'),
          accent: v('accent'),
          'accent-fg': v('accent-fg'),
          soft: v('soft'),
          purple: v('purple'),
          ink: v('ink'),
          'ink-fg': v('ink-fg'),
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
