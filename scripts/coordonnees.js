import { escapeHtml } from './mentions.js';

export const EMAIL_MARKER = '<!--EMAIL-->';
export const TELEPHONE_MARKER = '<!--TELEPHONE-->';
export const WHATSAPP_MARKER = '<!--WHATSAPP-->';
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
    // Forme « 06… » d'un numéro saisi en +33, celle qu'on tape souvent dans un
    // moteur de recherche.
    national: telephone.replace(/^\+33\s*/, '0'),
  };
}

const icone = (traces) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${traces}</svg>`;

// Enveloppe, combiné, et combiné dans une bulle pour WhatsApp.
export const ICONES = {
  email: icone(
    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  ),
  telephone: icone(
    '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  ),
  whatsapp: icone(
    '<path d="M3 21l1.7-5A9 9 0 1 1 8 19.3z"/><path d="M9 10a5 5 0 0 0 5 5l1-1.5-2-1-1 1a4 4 0 0 1-1.5-1.5l1-1-1-2z"/>',
  ),
};

// L'icône est décorative : le texte du lien le nomme.
const lien = (href, texte, dessin) =>
  texte
    ? `<a class="contact-lien" href="${escapeHtml(href)}">${dessin}<span>${escapeHtml(texte)}</span></a>`
    : '';

// Écrit les coordonnées en clair, pour les visiteurs comme pour les moteurs de
// recherche ; une variable vide laisse sa place vide.
export function injectCoordonnees(html, env) {
  const { email, telephone, international, national } = coordonnees(env);
  const rappel = [...new Set([email, telephone, national])]
    .filter(Boolean)
    .map(escapeHtml);
  // Le nom d'utilisateur (CONTACT_WHATSAPP) passe avant le numéro, que wa.me
  // attend au format international sans le « + ».
  const compte =
    (env.CONTACT_WHATSAPP ?? '').trim() || international.replace('+', '');
  const whatsapp = compte ? 'WhatsApp' : '';
  return html
    .replaceAll(EMAIL_MARKER, () => lien(`mailto:${email}`, email, ICONES.email))
    .replaceAll(TELEPHONE_MARKER, () =>
      lien(`tel:${international}`, telephone, ICONES.telephone),
    )
    .replaceAll(WHATSAPP_MARKER, () =>
      lien(`https://wa.me/${compte}`, whatsapp, ICONES.whatsapp),
    )
    .replaceAll(COORDONNEES_MARKER, () =>
      rappel.map((valeur) => ` · ${valeur}`).join(''),
    );
}
