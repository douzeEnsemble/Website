import { dirname } from 'node:path';
import qrcode from 'qrcode-generator';
import { LANGUE_PAR_DEFAUT, traduire } from './langues.js';

export const SITE_URL = 'https://www.douzeensemble.fr/';
export const PARTAGE_MARKER = '<!--PARTAGE-->';
export const QR_ACCUEIL_MARKER = '<!--QR-ACCUEIL-->';
// Place du bouton de partage dans le groupe des préférences (scripts/preferences.js).
export const PARTAGE_BOUTON_MARKER = '<!--PARTAGE-BOUTON-->';

const QUIET_ZONE = 2;

// Adresse publique d'une page du site, d'après son chemin (`contact/index.html`)
// et sa langue.
export function pageUrl(file, langue = LANGUE_PAR_DEFAUT) {
  const dir = dirname(file);
  return `${SITE_URL}${langue.dir}${dir === '.' ? '' : `${dir}/`}`;
}

// QR code (correction d'erreur M) en SVG : un carré par module sombre, sur
// fond blanc avec une marge de QUIET_ZONE modules.
export function qrSvg(text, label) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const size = count + QUIET_ZONE * 2;
  let path = '';
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (qr.isDark(row, col)) {
        path += `M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`;
      }
    }
  }
  return (
    `<svg viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="${label}">` +
    `<rect width="${size}" height="${size}" fill="#fff"/>` +
    `<path d="${path}" fill="#05131d"/></svg>`
  );
}

const SHARE_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>' +
  '<path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>';

// Bouton de partage, rangé avec les boutons de préférences (bas à droite).
export const PARTAGE_BOUTON = `<button type="button" class="preferences-bouton partage-ouvrir" aria-label="Partager cette page">${SHARE_ICON}</button>`;

// Fenêtre native (<dialog>) de partage d'une page : QR code, lien à copier,
// bouton Partager (masqué tant que js/partage.js ne l'active pas).
export function partageHtml(url, langue = LANGUE_PAR_DEFAUT) {
  return `<dialog class="partage" aria-labelledby="partage-titre" data-copie="Lien copié." data-selection="Lien sélectionné : copiez-le avec Ctrl+C." data-echec="Le partage a échoué : copiez le lien.">
      <div class="partage-contenu">
        <form method="dialog"><button class="partage-fermer" aria-label="Fermer">×</button></form>
        <p class="partage-marque">douzeEnsemble</p>
        <h2 id="partage-titre" class="invisible">Partager cette page</h2>
        <div class="partage-qr">${qrSvg(url, `${traduire('QR code de', langue)} ${url}`)}</div>
        <input class="partage-url" type="text" readonly value="${url}" aria-label="Adresse de la page">
        <div class="partage-actions">
          <button type="button" class="partage-bouton partage-copier">Copier le lien</button>
          <button type="button" class="partage-bouton partage-partager" hidden>Partager</button>
        </div>
        <p class="partage-etat" role="status"></p>
        <p class="partage-aide">Scannez pour garder cette page dans votre poche.</p>
      </div>
    </dialog>`;
}

// QR de l'accueil, affiché au verso de la carte de visite.
export function qrAccueilHtml(langue = LANGUE_PAR_DEFAUT) {
  return `<div class="carte-qr">${qrSvg(`${SITE_URL}${langue.dir}`, 'QR code vers la page d’accueil')}</div>`;
}

// Le bouton n'apparaît que sur les pages qui ont une fenêtre de partage (pas la 404).
export function injectPartage(html, file, langue = LANGUE_PAR_DEFAUT) {
  const bouton = html.includes(PARTAGE_MARKER) ? PARTAGE_BOUTON : '';
  return html
    .replace(PARTAGE_BOUTON_MARKER, bouton)
    .replace(PARTAGE_MARKER, () => partageHtml(pageUrl(file, langue), langue))
    .replace(QR_ACCUEIL_MARKER, () => qrAccueilHtml(langue));
}
