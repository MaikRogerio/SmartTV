// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { verifiedChannel } from './helpers';

vi.mock('hls.js', () => ({ default: class { static isSupported() { return false; } } }));

import App from '../src/App';

const GOOD = [
  verifiedChannel({ id: 'g1', name: 'Verified US News', country: 'US' }),
  verifiedChannel({ id: 'g2', name: 'Verified Mexico Sports', country: 'MX', countryName: 'Mexico', categories: ['Sports'] }),
  verifiedChannel({ id: 'g3', name: 'Verified Russia News', country: 'RU', countryName: 'Russia' }),
];
const BAD_NAMES = ['Plain HTTP TV', 'Never Checked TV', 'Needs Headers TV', 'Bad Date TV'];
const RAW = {
  generatedAt: new Date().toISOString(),
  source: 'test',
  total: 9,
  online: 7,
  channels: [
    ...GOOD,
    verifiedChannel({ id: 'b1', name: 'Plain HTTP TV', url: 'http://plain.example/x.m3u8' }),
    { ...verifiedChannel({ id: 'b2', name: 'Never Checked TV' }), checkedAt: undefined },
    verifiedChannel({ id: 'b3', name: 'Needs Headers TV', requiresHeaders: true }),
    verifiedChannel({ id: 'b4', name: 'Bad Date TV', checkedAt: 'not-a-date' }),
    'garbage',
  ],
};

const serve = (body: unknown) => vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => body })));
const renderedIds = () => [...document.querySelectorAll('[data-channel-id]')].map((el) => el.getAttribute('data-channel-id'));
const tab = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }));

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe('Rule 1: no unverified channel is ever rendered', () => {
  it('Explore renders only channels that passed the gate', async () => {
    serve(RAW);
    render(<App />);
    expect((await screen.findAllByText('Verified US News')).length).toBeGreaterThan(0);
    const ids = renderedIds();
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(['g1', 'g2', 'g3']).toContain(id);
    for (const name of BAD_NAMES) expect(screen.queryAllByText(name)).toHaveLength(0);
  });

  it('no tab can surface a rejected channel (recent + favorites seeded with bad ids)', async () => {
    localStorage.setItem('smarttv.favorites', JSON.stringify(['b1', 'g2', 'b3']));
    localStorage.setItem('smarttv.recent', JSON.stringify(['b2', 'g1', 'b4']));
    serve(RAW);
    render(<App />);
    await screen.findAllByText('Verified US News');
    for (const t of [/^Explore/, /^Categories/, /^Favorites/, /^TV Remote/, /^Devices/]) {
      tab(t);
      for (const id of renderedIds()) expect(['g1', 'g2', 'g3']).toContain(id);
      for (const name of BAD_NAMES) expect(screen.queryAllByText(name)).toHaveLength(0);
    }
  });

  it('search cannot surface a rejected channel', async () => {
    serve(RAW);
    render(<App />);
    await screen.findAllByText('Verified US News');
    fireEvent.change(screen.getByLabelText('Search channels'), { target: { value: 'Plain HTTP' } });
    expect(await screen.findByText('No live channel matches your search.')).toBeTruthy();
    expect(renderedIds()).toEqual([]);
  });

  it('hides a channel that failed on this device and flags its country as having 0 live channels', async () => {
    localStorage.setItem('smarttv.failed', JSON.stringify({ g3: Date.now() }));
    serve(RAW);
    render(<App />);
    await screen.findAllByText('Verified US News');
    expect(screen.queryAllByText('Verified Russia News')).toHaveLength(0);
    expect(renderedIds()).not.toContain('g3');
    expect(screen.getByText(/No live channels right now for:.*RU/)).toBeTruthy();
  });

  it('shows no channels at all (no fallback list) when the catalog cannot be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
    render(<App />);
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(renderedIds()).toEqual([]);
  });

  it('shows no channels when the catalog file is malformed', async () => {
    serve({ channels: GOOD }); // no generatedAt -> rejected as a whole
    render(<App />);
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(renderedIds()).toEqual([]);
  });
});
