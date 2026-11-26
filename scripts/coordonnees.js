import { escapeHtml } from './mentions.js';

export const EMAIL_MARKER = '<!--EMAIL-->';
export const TELEPHONE_MARKER = '<!--TELEPHONE-->';
// Rappel des coordonnées à la fin d'une description (scripts/seo.js).
export const COORDONNEES_MARKER = '<!--COORDONNEES-->';

// Variables GitHub CONTACT_EMAIL et CONTACT_TELEPHONE, lues au build ; le
// téléphone français est aussi donné au format international, pour les liens
// et les données structurées.
export function coordonnees(env) {
  const email = (env.CONTACT_EMAIL ?? '').trim();
  const telephone = (env.CONTACT_TELEPHONE ?? '').trim();
  return {
    email,
    telephone,
    international: telephone.replaceAll(/[\s.-]/g, '').replace(/^0/, '+33'),
  };
}

const lien = (href, texte) =>
  texte
    ? `<a class="contact-lien" href="${escapeHtml(href)}">${escapeHtml(texte)}</a>`
    : '';

// Écrit les coordonnées en clair, pour les visiteurs comme pour les moteurs de
// recherche ; une variable vide laisse sa place vide.
export function injectCoordonnees(html, env) {
  const { email, telephone, international } = coordonnees(env);
  const rappel = [email, telephone].filter(Boolean).map(escapeHtml);
  return html
    .replaceAll(EMAIL_MARKER, () => lien(`mailto:${email}`, email))
    .replaceAll(TELEPHONE_MARKER, () => lien(`tel:${international}`, telephone))
    .replaceAll(COORDONNEES_MARKER, () =>
      rappel.map((valeur) => ` · ${valeur}`).join(''),
    );
}
