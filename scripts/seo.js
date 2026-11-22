import { join } from 'node:path';
import { SITE_URL, pageUrl } from './partage.js';

export const SEO_MARKER = '<!--SEO-->';
export const IMAGE_URL = `${SITE_URL}og.png`;
export const IMAGE_ALT = 'douzeEnsemble : sites, applications et accompagnement numérique';

// Titre et description de chaque page référencée. Le titre reprend la balise
// <title> de la page (vérifié par les tests) ; la description s'affiche dans
// les résultats des moteurs de recherche et dans l'aperçu des liens partagés.
export const SEO = {
  'index.html': {
    title: 'douzeEnsemble',
    description:
      'douzeEnsemble conçoit des sites internet et des applications sur mesure, et vous accompagne au quotidien dans votre présence numérique.',
  },
  [join('prestations', 'index.html')]: {
    title: 'Prestations · douzeEnsemble',
    description:
      'Sites et applications sur mesure, conseil en communication numérique, maintenance et gestion de sites : les prestations de douzeEnsemble.',
  },
  [join('points-forts', 'index.html')]: {
    title: 'Points forts · douzeEnsemble',
    description:
      'Analyse, adaptivité, sécurité numérique, maintenance et qualité du code : les points forts de douzeEnsemble.',
  },
  [join('realisations', 'index.html')]: {
    title: 'Réalisations · douzeEnsemble',
    description:
      'Les derniers projets en ligne de douzeEnsemble, avec leur code source sur GitHub.',
  },
  [join('contact', 'index.html')]: {
    title: 'Contact · douzeEnsemble',
    description:
      'Contactez Renaud, de douzeEnsemble, pour parler de votre projet de site internet ou d’application.',
  },
  [join('carte', 'index.html')]: {
    title: 'Carte de visite · douzeEnsemble',
    description:
      'La carte de visite de douzeEnsemble : les coordonnées de Renaud et un QR code vers le site.',
  },
  [join('apropos', 'index.html')]: {
    title: 'À propos · douzeEnsemble',
    description:
      'Mentions légales et informations sur le site douzeEnsemble.',
  },
};

// Balises d'en-tête d'une page : description, adresse canonique, aperçu Open
// Graph (LinkedIn, WhatsApp, Facebook…) et carte Twitter, icônes.
export function seoHtml(file) {
  const { title, description } = SEO[file];
  const url = pageUrl(file);
  return `<meta name="description" content="${description}">
    <link rel="canonical" href="${url}">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="fr_FR">
    <meta property="og:site_name" content="douzeEnsemble">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${IMAGE_URL}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${IMAGE_ALT}">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">`;
}

export function injectSeo(html, file) {
  return html.replace(SEO_MARKER, () => seoHtml(file));
}

// Plan du site pour les moteurs de recherche : une entrée par page référencée.
export function sitemapXml() {
  const urls = Object.keys(SEO)
    .map((file) => `  <url><loc>${pageUrl(file)}</loc></url>\n`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}</urlset>
`;
}
