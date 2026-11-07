import { describe, expect, it } from 'vitest';
import { resolveTheme } from '../lib/theme';

describe('theme', () => {
  it('explicit choice wins over the phone setting', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
  });
  it('"system" follows the phone setting', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });
});

import { initials } from '../lib/utils';
describe('channel initials', () => {
  it('builds short tile labels', () => {
    expect(initials('24 Horas')).toBe('24h');
    expect(initials('Antena 3')).toBe('A3');
    expect(initials('Telefe')).toBe('TEL');
    expect(initials('')).toBe('TV');
  });
});
