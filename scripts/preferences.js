import { PARTAGE_BOUTON_MARKER } from './partage.js';

export const PREFERENCES_MARKER = '<!--PREFERENCES-->';

const icon = (paths, className = '') =>
  `<svg${className && ` class="${className}"`} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

// Personne debout, bras écartés : le pictogramme d'accessibilité.
const ACCESSIBILITY_ICON = icon(
  '<circle cx="12" cy="4.5" r="1.5"/><path d="M5 8.5l7 1.5 7-1.5M12 10v4.5M9 21l3-6.5 3 6.5"/>',
);

// Trois icônes, une seule visible selon l'état du bouton (style.css) :
// automatique (moitié soleil, moitié lune), clair (soleil), sombre (lune).
const THEME_ICONS =
  icon(
    '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
    'icone-auto',
  ) +
  icon(
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    'icone-clair',
  ) +
  icon(
    '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    'icone-sombre',
  );

const REGLAGES = [
  ['largeText', 'Texte plus grand'],
  ['highContrast', 'Contraste élevé'],
  ['reduceMotion', 'Animations réduites'],
];

// Groupe de boutons fixé en bas à droite (thème, accessibilité, puis partage,
// posé par scripts/partage.js) et dialogue natif des réglages d'accessibilité
// (A11Y-11).
export function preferencesHtml() {
  const cases = REGLAGES.map(
    ([name, label]) =>
      `<label class="preferences-case"><input type="checkbox" data-preference="${name}"> ${label}</label>`,
  ).join('\n          ');
  return `<div class="preferences" role="group" aria-label="Préférences d’affichage">
      <button type="button" class="preferences-bouton preferences-theme" aria-label="Thème : automatique" data-label-auto="Thème : automatique" data-label-light="Thème : clair" data-label-dark="Thème : sombre">${THEME_ICONS}</button>
      <button type="button" class="preferences-bouton preferences-accessibilite" aria-label="Accessibilité">${ACCESSIBILITY_ICON}</button>
      ${PARTAGE_BOUTON_MARKER}
    </div>
    <dialog class="preferences-dialogue" aria-labelledby="preferences-titre">
      <div class="preferences-contenu">
        <form method="dialog"><button class="preferences-fermer" aria-label="Fermer">×</button></form>
        <h2 id="preferences-titre">Accessibilité</h2>
        <fieldset class="preferences-reglages">
          <legend class="invisible">Réglages d’accessibilité</legend>
          ${cases}
        </fieldset>
      </div>
    </dialog>`;
}

export function injectPreferences(html) {
  return html.replace(PREFERENCES_MARKER, () => preferencesHtml());
}
