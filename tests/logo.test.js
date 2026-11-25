import { describe, expect, it } from 'vitest';
import { LANGUES } from '../scripts/langues.js';
import { LOGO_MARKER, injectLogo, logoHtml } from '../scripts/logo.js';

describe('logoHtml', () => {
  const html = logoHtml('contact/index.html');
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const lien = doc.querySelector('a.logo');

  it('mène à l’accueil, avec un nom accessible', () => {
    expect(lien.getAttribute('href')).toBe('/');
    expect(lien.getAttribute('aria-label')).toBe('douzeEnsemble, accueil');
    expect(lien.hasAttribute('aria-current')).toBe(false);
    expect(html).toMatch(/^<a class="logo" href="\/" aria-label="douzeEnsemble, accueil"><svg /);
  });

  it('dessine le monogramme du favicon, masqué aux lecteurs d’écran', () => {
    expect(html).toContain(
      '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#14110f"/>',
    );
    expect(html).toContain(
      '<text x="32" y="44" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" letter-spacing="-1.5" text-anchor="middle" fill="#fffdf9">d<tspan fill="#fe8a18">E</tspan></text></svg></a>',
    );
  });

  it('marque l’accueil comme page courante', () => {
    expect(logoHtml('index.html')).toContain(
      '<a class="logo" href="/" aria-current="page" aria-label="douzeEnsemble, accueil">',
    );
  });

  it('mène à l’accueil de la langue de la page', () => {
    expect(logoHtml('contact/index.html', LANGUES[1])).toContain('href="/en/"');
    expect(logoHtml('index.html', LANGUES[2])).toContain('href="/mrs/" aria-current="page"');
  });
});

describe('injectLogo', () => {
  it('remplace le marqueur', () => {
    expect(LOGO_MARKER).toBe('<!--LOGO-->');
    expect(injectLogo(`a ${LOGO_MARKER} $& b`, 'index.html')).toBe(
      `a ${logoHtml('index.html')} $& b`,
    );
    expect(injectLogo('<p></p>', 'index.html')).toBe('<p></p>');
  });
});
