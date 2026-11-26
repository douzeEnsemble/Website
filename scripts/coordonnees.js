import { LANGUE_PAR_DEFAUT, traduire } from './langues.js';
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

const lien = (href, texte) =>
  texte
    ? `<a class="contact-lien" href="${escapeHtml(href)}">${escapeHtml(texte)}</a>`
    : '';

// Écrit les coordonnées en clair, pour les visiteurs comme pour les moteurs de
// recherche ; une variable vide laisse sa place vide.
export function injectCoordonnees(html, env, langue = LANGUE_PAR_DEFAUT) {
  const { email, telephone, international, national } = coordonnees(env);
  const rappel = [...new Set([email, telephone, national])]
    .filter(Boolean)
    .map(escapeHtml);
  // Le nom d'utilisateur (CONTACT_WHATSAPP) passe avant le numéro, que wa.me
  // attend au format international sans le « + ».
  const compte =
    (env.CONTACT_WHATSAPP ?? '').trim() || international.replace('+', '');
  const whatsapp = compte
    ? traduire('Écrire sur WhatsApp', langue)
    : '';
  return html
    .replaceAll(EMAIL_MARKER, () => lien(`mailto:${email}`, email))
    .replaceAll(TELEPHONE_MARKER, () => lien(`tel:${international}`, telephone))
    .replaceAll(WHATSAPP_MARKER, () =>
      lien(`https://wa.me/${compte}`, whatsapp),
    )
    .replaceAll(COORDONNEES_MARKER, () =>
      rappel.map((valeur) => ` · ${valeur}`).join(''),
    );
}
