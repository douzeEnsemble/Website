// @vitest-environment node
import { MENTIONS_MARKER } from '../scripts/mentions.js';
import { PARTAGE_MARKER } from '../scripts/partage.js';
import { PREFERENCES_MARKER } from '../scripts/preferences.js';
import { SEO_MARKER, sitemapXml } from '../scripts/seo.js';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MARKER_END, MARKER_START } from '../js/realisations.js';
import {
  PAGES,
  REALISATIONS_PAGE,
  SITE_FILES,
  VERSION_PLACEHOLDER,
  buildSite,
  injectVersion,
} from '../scripts/build-site.js';

const project = {
  name: 'site',
  homepage: 'https://site.example',
  fork: false,
  archived: false,
};

const respond = (body, ok = true) =>
  vi.fn().mockResolvedValue({ ok, status: 500, json: async () => body });

function fakeRepo() {
  const root = mkdtempSync(join(tmpdir(), 'site-'));
  for (const dir of ['js', 'contact', 'prestations', 'points-forts', 'realisations', 'carte', 'apropos', 'tests']) {
    mkdirSync(join(root, dir));
  }
  writeFileSync(join(root, 'CNAME'), 'www.douzeensemble.fr');
  writeFileSync(
    join(root, 'index.html'),
    `<head>${SEO_MARKER}</head>accueil ${VERSION_PLACEHOLDER}`,
  );
  writeFileSync(join(root, '404.html'), `introuvable ${VERSION_PLACEHOLDER}`);
  for (const file of ['robots.txt', 'favicon.svg', 'apple-touch-icon.png', 'og.png']) {
    writeFileSync(join(root, file), file);
  }
  writeFileSync(join(root, 'style.css'), 'css');
  writeFileSync(join(root, 'js', 'main.js'), 'js');
  writeFileSync(
    join(root, 'contact', 'index.html'),
    `contact ${PREFERENCES_MARKER} ${PARTAGE_MARKER} ${VERSION_PLACEHOLDER}`,
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
    join(root, 'carte', 'index.html'),
    `carte ${VERSION_PLACEHOLDER}`,
  );
  writeFileSync(
    join(root, 'apropos', 'index.html'),
    `<dl>${MENTIONS_MARKER}</dl>${VERSION_PLACEHOLDER}`,
  );
  writeFileSync(join(root, 'tests', 'x.test.js'), 'test');
  writeFileSync(join(root, 'package.json'), '{}');
  writeFileSync(
    join(root, REALISATIONS_PAGE),
    `<ul>${MARKER_START}<li>repli</li>${MARKER_END}</ul>${VERSION_PLACEHOLDER}`,
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
      'js',
      'contact',
      'prestations',
      'points-forts',
      'realisations',
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
      REALISATIONS_PAGE,
      join('carte', 'index.html'),
      join('apropos', 'index.html'),
      '404.html',
    ]);
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

  it('copie le site et y écrit les cartes', async () => {
    const fetchFn = respond([project]);
    const projects = await buildSite({
      root,
      out,
      fetchFn,
      token: 'jeton',
      version: 'v1.2.3',
    });
    expect(projects).toEqual([project]);
    expect(fetchFn.mock.calls[0][1].headers.Authorization).toBe('Bearer jeton');
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
    const page = readFileSync(join(out, REALISATIONS_PAGE), 'utf8');
    expect(page).toContain('<span class="app-version">v1.2.3</span>');
    expect(page).toContain('<strong class="carte-nom">site</strong>');
    expect(page).not.toContain('repli');
    expect(existsSync(join(out, 'tests'))).toBe(false);
    expect(existsSync(join(out, 'package.json'))).toBe(false);
    expect(readFileSync(join(root, REALISATIONS_PAGE), 'utf8')).toContain(
      'repli',
    );
  });

  it('écrit les mentions légales dans la page À propos', async () => {
    await buildSite({
      root,
      out,
      fetchFn: respond([project]),
      env: { SIREN: '123456789', ADRESSE: '1 rue <A>' },
    });
    const page = readFileSync(join(out, 'apropos', 'index.html'), 'utf8');
    expect(page).toContain('<dd>1 rue &lt;A&gt;</dd>');
    expect(page).toContain('/entreprise/123456789"');
    expect(page).not.toContain(MENTIONS_MARKER);
  });

  it('vide le dossier de sortie avant de construire', async () => {
    mkdirSync(join(out, 'ancien'), { recursive: true });
    await buildSite({ root, out, fetchFn: respond([project]) });
    expect(existsSync(join(out, 'ancien'))).toBe(false);
  });

  it('place une sortie relative dans la racine', async () => {
    await buildSite({ root, out: 'sortie', fetchFn: respond([project]) });
    expect(existsSync(join(root, 'sortie', 'index.html'))).toBe(true);
  });

  it('crée les dossiers parents de la sortie', async () => {
    out = join(root, 'a', 'b');
    await buildSite({ root, out, fetchFn: respond([project]) });
    expect(existsSync(join(out, 'index.html'))).toBe(true);
  });

  it('n’écrit rien si GitHub ne répond pas', async () => {
    await expect(
      buildSite({ root, out, fetchFn: respond([], false) }),
    ).rejects.toThrow('API GitHub : 500');
    expect(existsSync(out)).toBe(false);
  });
});
