import { LANGUE_PAR_DEFAUT, pagePath } from './langues.js';

export const LOGO_MARKER = '<!--LOGO-->';

const ACCUEIL = 'index.html';

// Logo fixé en haut à gauche de chaque page : le monogramme du favicon
// (favicon.svg, « d » blanc et « E » orange sur une tuile sombre), lien vers
// l'accueil de la langue de la page, marqué comme page courante sur l'accueil.
// Une image et son `alt` plutôt qu'un SVG en ligne : le texte « dE » du dessin
// ne doit pas entrer en conflit avec le nom accessible du lien.
export function logoHtml(file, langue = LANGUE_PAR_DEFAUT) {
  const courant = file === ACCUEIL ? ' aria-current="page"' : '';
  return `<a class="logo" href="${pagePath(ACCUEIL, langue)}"${courant}><img src="/favicon.svg" width="64" height="64" alt="douzeEnsemble, accueil"></a>`;
}

export function injectLogo(html, file, langue = LANGUE_PAR_DEFAUT) {
  return html.replace(LOGO_MARKER, () => logoHtml(file, langue));
}
