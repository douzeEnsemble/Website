// Une couleur par page : le build pose `data-page="<section>"` sur le `<body>`,
// et style.css redéfinit l'accent (`--accent`, `--accent-texte`) de la section.
// Les sous-pages héritent de la couleur de leur section ; l'accueil et la page
// d'erreur gardent l'orange de la marque.
export const BODY_OUVRANT = '<body>';

const ACCUEIL = 'accueil';

// Dossier de la page → section dont elle prend la couleur. Les pages de
// présentation de la personne (points forts et faibles, parcours) suivent « À propos ».
const SECTIONS = {
  prestations: 'prestations',
  realisations: 'realisations',
  contact: 'contact',
  carte: 'carte',
  apropos: 'apropos',
  'points-forts': 'apropos',
  'points-faibles': 'apropos',
  deroule: 'apropos',
  'qui-suis-je': 'apropos',
};

export function sectionDe(file) {
  return SECTIONS[file.split(/[\\/]/)[0]] ?? ACCUEIL;
}

export function injectCouleur(html, file) {
  return html.replace(
    BODY_OUVRANT,
    () => `<body data-page="${sectionDe(file)}">`,
  );
}
