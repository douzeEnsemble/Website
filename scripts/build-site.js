import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { LANGUES, injectLangues, translateHtml } from './langues.js';
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
];

export const REALISATIONS_PAGE = join('realisations', 'index.html');

// Réalisations qui ont leur page de fonctionnalités (`realisations/<nom>/`),
// nommées d'après leur dépôt GitHub en minuscules.
export const DETAILS = [
  'koikimanke',
  'keskejevoeux',
  'onmangequoi',
  'minecarte',
  'plusun',
  'dansmahotte',
  'moremobsheadschecklist',
  'pokenini',
  'quine',
];
export const DETAIL_PAGES = DETAILS.map((nom) =>
  join('realisations', nom, 'index.html'),
);
export const NOT_FOUND_PAGE = '404.html';

// Pages qui affichent la version du projet (VER-09) : leur pied de page porte
// VERSION_PLACEHOLDER, remplacé à la construction par le dernier tag v*.
export const PAGES = [
  'index.html',
  join('contact', 'index.html'),
  join('prestations', 'index.html'),
  join('points-forts', 'index.html'),
  join('points-faibles', 'index.html'),
  join('deroule', 'index.html'),
  REALISATIONS_PAGE,
  ...DETAIL_PAGES,
  join('qui-suis-je', 'index.html'),
  join('carte', 'index.html'),
  join('apropos', 'index.html'),
  NOT_FOUND_PAGE,
];
export const VERSION_PLACEHOLDER = '<span class="app-version">dev</span>';

export function injectVersion(html, version) {
  return html.replace(
    VERSION_PLACEHOLDER,
    `<span class="app-version">${version}</span>`,
  );
}

// Copie le site dans `output` (relatif à `root`), puis écrit chaque page dans
// chaque langue (français à la racine, autres langues dans leur dossier) avec
// les balises de référencement, le plan du site et le numéro de version.
export async function buildSite({
  root,
  out: output,
  version,
  env = {},
  dates = {},
}) {
  const out = resolve(root, output);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const file of SITE_FILES) {
    cpSync(join(root, file), join(out, file), { recursive: true });
  }
  for (const langue of LANGUES) {
    for (const file of PAGES) {
      // La page d'erreur n'existe qu'en français : GitHub Pages n'en sert qu'une.
      if (file === NOT_FOUND_PAGE && langue.dir) continue;
      const target = join(out, langue.dir, file);
      let html = translateHtml(
        injectLangues(
          injectPartage(
            injectPreferences(
              injectSeo(String(readFileSync(join(root, file))), file, langue),
            ),
            file,
            langue,
          ),
          file,
          langue,
        ),
        langue,
      );
      html = injectMentions(html, env, langue);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, injectVersion(html, version));
    }
  }
  writeFileSync(join(out, 'sitemap.xml'), sitemapXml(dates));
}
