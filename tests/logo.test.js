import { describe, expect, it } from 'vitest';
import { LANGUES } from '../scripts/langues.js';
import { LOGO_MARKER, injectLogo, logoHtml } from '../scripts/logo.js';

describe('logoHtml', () => {
  const html = logoHtml('contact/index.html');
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const lien = doc.querySelector('a.logo');

  it('mène à l’accueil, avec un nom accessible', () => {
    expect(lien.getAttribute('href')).toBe('/');
    expect(lien.hasAttribute('aria-current')).toBe(false);
    expect(html).toBe(
      '<a class="logo" href="/"><img src="/favicon.svg" width="64" height="64" alt="douzeEnsemble, accueil"></a>',
    );
  });

  it('marque l’accueil comme page courante', () => {
    expect(logoHtml('index.html')).toContain(
      '<a class="logo" href="/" aria-current="page"><img ',
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
