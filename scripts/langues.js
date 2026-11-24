import { dirname } from 'node:path';
import { TEXTES_EN } from './textes-en.js';
import { TEXTES_MRS } from './textes-mrs.js';

export const LANGUES_MARKER = '<!--LANGUES-->';

// Le français est la langue source des pages HTML ; les autres langues sont
// produites à la construction dans leur sous-dossier (`dir`) à partir d'un
// dictionnaire `textes` : texte français → texte traduit.
export const LANGUES = [
  { code: 'fr', dir: '', htmlLang: 'fr', locale: 'fr_FR', nom: 'Français', textes: {} },
  { code: 'en', dir: 'en/', htmlLang: 'en', locale: 'en_GB', nom: 'English', textes: TEXTES_EN },
  {
    code: 'mrs',
    dir: 'mrs/',
    htmlLang: 'fr-FR-x-mrs',
    locale: 'fr_FR',
    nom: 'Marseillais',
    textes: TEXTES_MRS,
  },
];
export const LANGUE_PAR_DEFAUT = LANGUES[0];

// Texte traduit pour les chaînes que les scripts de construction assemblent
// eux-mêmes ; un texte sans traduction reste en français.
export function traduire(texte, langue) {
  return langue.textes[texte] ?? texte;
}

const echapper = (texte) => texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Traduit une page : un texte du dictionnaire est remplacé s'il forme tout un
// contenu d'élément (`>texte<`) ou toute une valeur d'attribut (`"texte"`). Une
// clé peut commencer après un guillemet pour se limiter à un élément précis
// (`etape-acteur">Ensemble`, qui ne touche pas le mot de la marque). Règle
// aussi la langue de la page et les chemins des fichiers partagés (style, js),
// qui restent à la racine du site.
export function translateHtml(html, langue) {
  const cles = Object.keys(langue.textes);
  const traduit =
    cles.length === 0
      ? html
      : html.replace(
          new RegExp(`(?<=[>"])(?:${cles.map(echapper).join('|')})(?=[<"])`, 'g'),
          (texte) => langue.textes[texte],
        );
  return traduit
    .replace('<html lang="fr">', `<html lang="${langue.htmlLang}">`)
    .replace('"inLanguage": "fr"', `"inLanguage": "${langue.htmlLang}"`)
    .replace(
      /(?<=(?:href|src)=")(?=(?:\.\.\/)*(?:style\.css|js\/))/g,
      langue.dir ? '../' : '',
    );
}

// Chemin d'une page dans une langue : `/en/contact/` pour `contact/index.html`.
export function pagePath(file, langue) {
  const dir = dirname(file);
  return `/${langue.dir}${dir === '.' ? '' : `${dir}/`}`;
}

// Sélecteur de langue du pied de page : la même page dans chaque langue.
export function languesHtml(file, langue) {
  const items = LANGUES.map(
    (autre) =>
      `<li><a href="${pagePath(file, autre)}" lang="${autre.htmlLang}" hreflang="${autre.htmlLang}"${autre === langue ? ' aria-current="true"' : ''}>${autre.nom}</a></li>`,
  ).join('');
  return `<nav class="langues" aria-label="Langue"><ul>${items}</ul></nav>`;
}

export function injectLangues(html, file, langue) {
  return html.replace(LANGUES_MARKER, () => languesHtml(file, langue));
}
