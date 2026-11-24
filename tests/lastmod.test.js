// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { lastModified } from '../scripts/lastmod.js';

describe('lastModified', () => {
  it('lit la date du dernier commit du fichier', () => {
    const run = vi.fn().mockReturnValue('2026-11-24\n');
    expect(lastModified('contact/index.html', run)).toBe('2026-11-24');
    expect(run).toHaveBeenCalledWith(
      'git',
      ['log', '-1', '--format=%cs', '--', 'contact/index.html'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
  });

  it('renvoie undefined sans historique', () => {
    expect(lastModified('x', () => '\n')).toBeUndefined();
  });

  it('renvoie undefined hors dépôt git', () => {
    expect(
      lastModified('x', () => {
        throw new Error('pas un dépôt');
      }),
    ).toBeUndefined();
  });

  it('interroge git par défaut', () => {
    expect(lastModified('index.html')).toMatch(/^(\d{4}-\d{2}-\d{2})?$/);
  });
});
