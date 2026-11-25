import { describe, expect, it } from 'vitest';
import { PAGES } from '../scripts/build-site.js';
import { BODY_OUVRANT, injectCouleur, sectionDe } from '../scripts/couleurs.js';

describe('sectionDe', () => {
  it('garde l’orange pour l’accueil et la page d’erreur', () => {
    expect(sectionDe('index.html')).toBe('accueil');
    expect(sectionDe('404.html')).toBe('accueil');
  });

  it('donne à chaque section sa couleur', () => {
    for (const section of [
      'prestations',
      'realisations',
      'contact',
      'carte',
      'apropos',
    ]) {
      expect(sectionDe(`${section}/index.html`)).toBe(section);
    }
  });

  it('fait hériter les sous-pages de leur section', () => {
    expect(sectionDe('realisations/quine/index.html')).toBe('realisations');
    for (const dossier of [
      'points-forts',
      'points-faibles',
      'deroule',
      'qui-suis-je',
    ]) {
      expect(sectionDe(`${dossier}/index.html`)).toBe('apropos');
    }
  });

  it('accepte les séparateurs Windows', () => {
    expect(sectionDe('realisations\\quine\\index.html')).toBe('realisations');
  });
});

describe('injectCouleur', () => {
  it('pose data-page sur le body', () => {
    expect(BODY_OUVRANT).toBe('<body>');
    expect(injectCouleur('<body>a $& b</body>', 'contact/index.html')).toBe(
      '<body data-page="contact">a $& b</body>',
    );
    expect(injectCouleur('<p></p>', 'index.html')).toBe('<p></p>');
  });

  it('s’applique à chaque page du site', () => {
    for (const file of PAGES) {
      expect(injectCouleur('<body>', file)).toMatch(
        /^<body data-page="[a-z]+">$/,
      );
    }
  });
});
