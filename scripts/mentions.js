import { LANGUE_PAR_DEFAUT, traduire } from './langues.js';

export const MENTIONS_MARKER = '<!--MENTIONS-->';

const ANNUAIRE_URL = 'https://annuaire-entreprises.data.gouv.fr/entreprise/';
const SIREN_FORMAT = /^\d{9}$/;

// Variables GitHub lues au build (Settings → Secrets and variables → Actions →
// Variables) : une ligne n'apparaît que si sa variable est renseignée.
export const MENTIONS_FIELDS = [
  ['RAISON_SOCIALE', 'Raison sociale'],
  ['FORME_JURIDIQUE', 'Forme juridique'],
  ['ADRESSE', 'Adresse'],
  ['DIRECTEUR_PUBLICATION', 'Directeur de la publication'],
];

// Les valeurs viennent de l'environnement : elles sont échappées avant d'entrer
// dans le HTML.
export function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const row = (label, value) => `<dt>${label}</dt><dd>${value}</dd>`;

// Les intitulés sont traduits ; les valeurs, qui viennent de l'environnement,
// restent telles quelles.
export function mentionsHtml(env, langue = LANGUE_PAR_DEFAUT) {
  const rows = [];
  for (const [name, label] of MENTIONS_FIELDS) {
    const value = (env[name] ?? '').trim();
    if (value) rows.push(row(traduire(label, langue), escapeHtml(value)));
  }
  const siren = env.SIREN?.trim();
  if (SIREN_FORMAT.test(siren)) {
    rows.push(
      row(
        'SIREN',
        `${siren} · <a class="mentions-lien" href="${ANNUAIRE_URL}${siren}" target="_blank" rel="noopener noreferrer">${traduire('Fiche sur l’Annuaire des Entreprises', langue)}<span class="invisible">${traduire(' (nouvel onglet)', langue)}</span> ↗</a>`,
      ),
    );
  }
  return rows.join('\n        ');
}

export function injectMentions(html, env, langue = LANGUE_PAR_DEFAUT) {
  return html.replace(MENTIONS_MARKER, () => mentionsHtml(env, langue));
}
