// @vitest-environment node
import { LANGUES_MARKER } from '../scripts/langues.js';
import { MENTIONS_MARKER } from '../scripts/mentions.js';
import { PARTAGE_MARKER } from '../scripts/partage.js';
import { PREFERENCES_MARKER } from '../scripts/preferences.js';
import { SEO_MARKER, sitemapXml } from '../scripts/seo.js';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  DETAILS,
  DETAIL_PAGES,
  PAGES,
  REALISATIONS_PAGE,
  SITE_FILES,
  VERSION_PLACEHOLDER,
  buildSite,
  injectVersion,
} from '../scripts/build-site.js';

function fakeRepo() {
  const root = mkdtempSync(join(tmpdir(), 'site-'));
  for (const dir of ['js', 'polices', 'contact', 'prestations', 'points-forts', 'points-faibles', 'deroule', 'realisations', 'qui-suis-je', 'carte', 'apropos', 'tests']) {
    mkdirSync(join(root, dir));
  }
  writeFileSync(join(root, 'CNAME'), 'www.douzeensemble.fr');
  writeFileSync(
    join(root, 'index.html'),
    `<head>${SEO_MARKER}</head>${LANGUES_MARKER}accueil ${VERSION_PLACEHOLDER}`,
  );
  writeFileSync(join(root, '404.html'), `introuvable ${VERSION_PLACEHOLDER}`);
  for (const file of ['robots.txt', 'favicon.svg', 'apple-touch-icon.png', 'og.png']) {
    writeFileSync(join(root, file), file);
  }
  writeFileSync(join(root, 'style.css'), 'css');
  writeFileSync(join(root, 'js', 'main.js'), 'js');
  writeFileSync(
    join(root, 'contact', 'index.html'),
    `contact ${PREFERENCES_MARKER} ${PARTAGE_MARKER} ${LANGUES_MARKER} ${VERSION_PLACEHOLDER}`,
  );
  writeFileSync(
    join(root, 'prestations', 'index.html'),
    `prestations ${VERSION_PLACEHOLDER}`,
  );
  writeFileSync(
    join(root, 'points-forts', 'index.html'),
    `points-forts ${VERSION_PLACEHOLDER}`,
  );
  writeFileSync(
    join(root, 'points-faibles', 'index.html'),
    `points-faibles ${VERSION_PLACEHOLDER}`,
  );
  writeFileSync(
    join(root, 'deroule', 'index.html'),
    `deroule ${VERSION_PLACEHOLDER}`,
  );
  writeFileSync(
    join(root, 'qui-suis-je', 'index.html'),
    `qui-suis-je ${VERSION_PLACEHOLDER}`,
  );
  writeFileSync(
    join(root, 'carte', 'index.html'),
    `carte ${VERSION_PLACEHOLDER}`,
  );
  writeFileSync(
    join(root, 'apropos', 'index.html'),
    `<dl>${MENTIONS_MARKER}</dl>${VERSION_PLACEHOLDER}`,
  );
  writeFileSync(join(root, 'tests', 'x.test.js'), 'test');
  writeFileSync(join(root, 'package.json'), '{}');
  for (const page of DETAIL_PAGES) {
    mkdirSync(join(root, dirname(page)), { recursive: true });
    writeFileSync(join(root, page), `détail ${VERSION_PLACEHOLDER}`);
  }
  writeFileSync(
    join(root, REALISATIONS_PAGE),
    `realisations ${VERSION_PLACEHOLDER}`,
  );
  return root;
}

describe('SITE_FILES', () => {
  it('liste les fichiers publiés', () => {
    expect(SITE_FILES).toEqual([
      'CNAME',
      'index.html',
      '404.html',
      'robots.txt',
      'favicon.svg',
      'apple-touch-icon.png',
      'og.png',
      'style.css',
      'polices',
      'js',
      'contact',
      'prestations',
      'points-forts',
      'points-faibles',
      'deroule',
      'realisations',
      'qui-suis-je',
      'carte',
      'apropos',
    ]);
    expect(REALISATIONS_PAGE).toBe(join('realisations', 'index.html'));
  });
});

describe('PAGES', () => {
  it('liste les pages qui affichent la version', () => {
    expect(PAGES).toEqual([
      'index.html',
      join('contact', 'index.html'),
      join('prestations', 'index.html'),
      join('points-forts', 'index.html'),
      join('points-faibles', 'index.html'),
      join('deroule', 'index.html'),
      REALISATIONS_PAGE,
      join('realisations', 'koikimanke', 'index.html'),
      join('realisations', 'keskejevoeux', 'index.html'),
      join('realisations', 'onmangequoi', 'index.html'),
      join('realisations', 'minecarte', 'index.html'),
      join('realisations', 'plusun', 'index.html'),
      join('realisations', 'dansmahotte', 'index.html'),
      join('realisations', 'moremobsheadschecklist', 'index.html'),
      join('realisations', 'pokenini', 'index.html'),
      join('realisations', 'quine', 'index.html'),
      join('qui-suis-je', 'index.html'),
      join('carte', 'index.html'),
      join('apropos', 'index.html'),
      '404.html',
    ]);
  });

  it('a une page de fonctionnalités par réalisation, avec ses captures', () => {
    expect(DETAILS).toEqual([
      'koikimanke',
      'keskejevoeux',
      'onmangequoi',
      'minecarte',
      'plusun',
      'dansmahotte',
      'moremobsheadschecklist',
      'pokenini',
      'quine',
    ]);
    const liste = readFileSync(REALISATIONS_PAGE, 'utf8');
    for (const nom of DETAILS) {
      expect(liste).toContain(`<a class="lien-fleche" href="${nom}/">Détails et captures<`);
    }
    for (const page of DETAIL_PAGES) {
      const html = readFileSync(page, 'utf8');
      const images = [...html.matchAll(/src="(\/realisations\/[^"]+)"/g)].map((m) => m[1]);
      expect(images.length).toBeGreaterThan(0);
      for (const image of images) {
        expect(existsSync(join('.', image))).toBe(true);
      }
    }
  });
});

describe('injectVersion', () => {
  it('remplace le marqueur par le numéro de version', () => {
    expect(injectVersion(`a ${VERSION_PLACEHOLDER} b`, 'v2.0.1')).toBe(
      'a <span class="app-version">v2.0.1</span> b',
    );
  });

  it('laisse intact un texte sans marqueur', () => {
    expect(injectVersion('rien', 'v2.0.1')).toBe('rien');
  });
});

describe('buildSite', () => {
  let root;
  let out;

  beforeEach(() => {
    root = fakeRepo();
    out = join(root, '_site');
  });

  it('écrit la date de modification des pages dans le plan du site', async () => {
    await buildSite({
      root,
      out,
      version: 'v1',
      dates: { 'index.html': '2026-11-24' },
    });
    expect(readFileSync(join(out, 'sitemap.xml'), 'utf8')).toBe(
      sitemapXml({ 'index.html': '2026-11-24' }),
    );
  });

  it('copie le site et y écrit les pages', async () => {
    await buildSite({
      root,
      out,
      version: 'v1.2.3',
    });
    expect(readFileSync(join(out, 'CNAME'), 'utf8')).toBe('www.douzeensemble.fr');
    const accueil = readFileSync(join(out, 'index.html'), 'utf8');
    expect(accueil).toContain(
      '<link rel="canonical" href="https://www.douzeensemble.fr/">',
    );
    expect(accueil).not.toContain(SEO_MARKER);
    expect(accueil.endsWith('accueil <span class="app-version">v1.2.3</span>')).toBe(true);
    expect(readFileSync(join(out, '404.html'), 'utf8')).toBe(
      'introuvable <span class="app-version">v1.2.3</span>',
    );
    for (const file of ['robots.txt', 'favicon.svg', 'apple-touch-icon.png', 'og.png']) {
      expect(readFileSync(join(out, file), 'utf8')).toBe(file);
    }
    expect(readFileSync(join(out, 'sitemap.xml'), 'utf8')).toBe(sitemapXml());
    expect(readFileSync(join(out, 'style.css'), 'utf8')).toBe('css');
    expect(readFileSync(join(out, 'js', 'main.js'), 'utf8')).toBe('js');
    const contact = readFileSync(join(out, 'contact', 'index.html'), 'utf8');
    expect(contact).toContain('<dialog class="partage"');
    expect(contact).toContain('https://www.douzeensemble.fr/contact/');
    expect(contact).not.toContain(PARTAGE_MARKER);
    expect(contact).toContain('<dialog class="preferences-dialogue"');
    expect(contact).not.toContain(PREFERENCES_MARKER);
    expect(contact.endsWith(' <span class="app-version">v1.2.3</span>')).toBe(true);
    expect(readFileSync(join(out, 'prestations', 'index.html'), 'utf8')).toBe(
      'prestations <span class="app-version">v1.2.3</span>',
    );
    expect(readFileSync(join(out, REALISATIONS_PAGE), 'utf8')).toBe(
      'realisations <span class="app-version">v1.2.3</span>',
    );
    expect(existsSync(join(out, 'tests'))).toBe(false);
    expect(existsSync(join(out, 'package.json'))).toBe(false);
  });

  it('écrit les mentions légales dans la page À propos', async () => {
    await buildSite({
      root,
      out,
      env: { SIREN: '123456789', ADRESSE: '1 rue <A>' },
    });
    const page = readFileSync(join(out, 'apropos', 'index.html'), 'utf8');
    expect(page).toContain('<dd>1 rue &lt;A&gt;</dd>');
    expect(page).toContain('/entreprise/123456789"');
    expect(page).not.toContain(MENTIONS_MARKER);
  });

  it('écrit chaque page dans chaque langue, sauf la page introuvable', async () => {
    await buildSite({
      root,
      out,
      version: 'v1.2.3',
      env: { SIREN: '123456789' },
    });
    for (const dossier of ['en', 'mrs']) {
      for (const file of PAGES.filter((p) => p !== '404.html')) {
        expect(existsSync(join(out, dossier, file))).toBe(true);
      }
      expect(existsSync(join(out, dossier, '404.html'))).toBe(false);
    }
    const accueil = readFileSync(join(out, 'en', 'index.html'), 'utf8');
    expect(accueil).toContain(
      '<link rel="canonical" href="https://www.douzeensemble.fr/en/">',
    );
    expect(accueil).toContain('<nav class="langues" aria-label="Language">');
    expect(accueil.endsWith('accueil <span class="app-version">v1.2.3</span>')).toBe(true);
    const contact = readFileSync(join(out, 'mrs', 'contact', 'index.html'), 'utf8');
    expect(contact).toContain('https://www.douzeensemble.fr/mrs/contact/');
    expect(contact).toContain('data-copie="Lien copié, c’est bon."');
    expect(contact).not.toContain(LANGUES_MARKER);
  });

  it('traduit les mentions légales', async () => {
    await buildSite({
      root,
      out,
      env: { SIREN: '123456789', ADRESSE: '1 rue' },
    });
    const apropos = readFileSync(join(out, 'en', 'apropos', 'index.html'), 'utf8');
    expect(apropos).toContain('<dt>Address</dt><dd>1 rue</dd>');
    expect(apropos).toContain('Entry in the Annuaire des Entreprises');
  });

  it('publie les pages de fonctionnalités des réalisations dans chaque langue', async () => {
    await buildSite({ root, out, version: 'v1.2.3' });
    for (const page of DETAIL_PAGES) {
      for (const dossier of ['', 'en', 'mrs']) {
        expect(readFileSync(join(out, dossier, page), 'utf8')).toBe(
          'détail <span class="app-version">v1.2.3</span>',
        );
      }
    }
  });

  it('vide le dossier de sortie avant de construire', async () => {
    mkdirSync(join(out, 'ancien'), { recursive: true });
    await buildSite({ root, out });
    expect(existsSync(join(out, 'ancien'))).toBe(false);
  });

  it('place une sortie relative dans la racine', async () => {
    await buildSite({ root, out: 'sortie' });
    expect(existsSync(join(root, 'sortie', 'index.html'))).toBe(true);
  });

  it('crée les dossiers parents de la sortie', async () => {
    out = join(root, 'a', 'b');
    await buildSite({ root, out });
    expect(existsSync(join(out, 'index.html'))).toBe(true);
  });

});
