import { LANGUE_PAR_DEFAUT, pagePath } from './langues.js';

export const LOGO_MARKER = '<!--LOGO-->';

const ACCUEIL = 'index.html';

// Le monogramme du favicon (favicon.svg) : « d » blanc et « E » orange sur
// une tuile sombre, la même dans les deux thèmes.
const LOGO_SVG =
  '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#14110f"/>' +
  '<text x="32" y="44" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" letter-spacing="-1.5" text-anchor="middle" fill="#fffdf9">d<tspan fill="#fe8a18">E</tspan></text></svg>';

// Logo fixé en haut à gauche de chaque page : un lien vers l'accueil de la
// langue de la page, marqué comme page courante sur l'accueil.
export function logoHtml(file, langue = LANGUE_PAR_DEFAUT) {
  const courant = file === ACCUEIL ? ' aria-current="page"' : '';
  return `<a class="logo" href="${pagePath(ACCUEIL, langue)}"${courant} aria-label="douzeEnsemble, accueil">${LOGO_SVG}</a>`;
}

export function injectLogo(html, file, langue = LANGUE_PAR_DEFAUT) {
  return html.replace(LOGO_MARKER, () => logoHtml(file, langue));
}
