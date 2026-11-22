import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fetchProjects, injectProjects } from '../js/realisations.js';
import { injectMentions } from './mentions.js';
import { injectPartage } from './partage.js';
import { injectPreferences } from './preferences.js';
import { injectSeo, sitemapXml } from './seo.js';

// Fichiers publiés sur GitHub Pages.
export const SITE_FILES = [
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
];

export const REALISATIONS_PAGE = join('realisations', 'index.html');

// Pages qui affichent la version du projet (VER-09) : leur pied de page porte
// VERSION_PLACEHOLDER, remplacé à la construction par le dernier tag v*.
export const PAGES = [
  'index.html',
  join('contact', 'index.html'),
  join('prestations', 'index.html'),
  join('points-forts', 'index.html'),
  REALISATIONS_PAGE,
  join('carte', 'index.html'),
  join('apropos', 'index.html'),
  '404.html',
];
export const VERSION_PLACEHOLDER = '<span class="app-version">dev</span>';

export function injectVersion(html, version) {
  return html.replace(
    VERSION_PLACEHOLDER,
    `<span class="app-version">${version}</span>`,
  );
}

// Copie le site dans `output` (relatif à `root`), y écrit les cartes des
// réalisations, les balises de référencement, le plan du site et le numéro de
// version.
export async function buildSite({
  root,
  out: output,
  fetchFn,
  token,
  version,
  env = {},
}) {
  const projects = await fetchProjects(fetchFn, token);
  const out = resolve(root, output);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const file of SITE_FILES) {
    cpSync(join(root, file), join(out, file), { recursive: true });
  }
  const page = join(out, REALISATIONS_PAGE);
  writeFileSync(page, injectProjects(String(readFileSync(page)), projects));
  for (const file of PAGES) {
    const path = join(out, file);
    const html = injectMentions(
      injectPartage(
        injectPreferences(injectSeo(String(readFileSync(path)), file)),
        file,
      ),
      env,
    );
    writeFileSync(path, injectVersion(html, version));
  }
  writeFileSync(join(out, 'sitemap.xml'), sitemapXml());
  return projects;
}
