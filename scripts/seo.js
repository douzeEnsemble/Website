import { join } from 'node:path';
import { LANGUES, LANGUE_PAR_DEFAUT } from './langues.js';
import { SITE_URL, pageUrl } from './partage.js';

export const SEO_MARKER = '<!--SEO-->';
export const IMAGE_URL = `${SITE_URL}og.png`;
export const IMAGE_ALT = 'douzeEnsemble : sites, applications et accompagnement numérique';

// Titre et description de chaque page référencée. Le titre reprend la balise
// <title> de la page (vérifié par les tests) ; la description s'affiche dans
// les résultats des moteurs de recherche et dans l'aperçu des liens partagés.
export const SEO = {
  'index.html': {
    title: 'douzeEnsemble · Sites et applications sur mesure',
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
      'Analyse, adaptivité, accessibilité, sécurité, respect des données, temps réel, hébergement, maintenance et qualité du code : les points forts de douzeEnsemble.',
  },
  [join('deroule', 'index.html')]: {
    title: 'Déroulé d’un projet · douzeEnsemble',
    description:
      'De l’écoute de votre besoin à la mise en ligne, puis aux mises à jour et aux évolutions : le déroulé d’un projet avec douzeEnsemble.',
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

// Données structurées (JSON-LD) d'une page : le site pour l'accueil, un fil
// d'Ariane (Accueil > page) pour les autres.
export function jsonLd(file, langue = LANGUE_PAR_DEFAUT) {
  const url = pageUrl(file, langue);
  if (file === 'index.html') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'douzeEnsemble',
      url,
      inLanguage: langue.htmlLang,
    };
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: `${SITE_URL}${langue.dir}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: SEO[file].title.split(' · ')[0],
        item: url,
      },
    ],
  };
}

// Balises d'en-tête d'une page : description, adresse canonique, aperçu Open
// Graph (LinkedIn, WhatsApp, Facebook…) et carte Twitter, icônes, données
// structurées.
// Les textes sont en français : la traduction de la page les remplace ensuite.
export function seoHtml(file, langue = LANGUE_PAR_DEFAUT) {
  const { title, description } = SEO[file];
  const url = pageUrl(file, langue);
  const alternates = [
    ...LANGUES.map(
      (autre) =>
        `<link rel="alternate" hreflang="${autre.htmlLang}" href="${pageUrl(file, autre)}">`,
    ),
    `<link rel="alternate" hreflang="x-default" href="${pageUrl(file)}">`,
  ].join('\n    ');
  return `<meta name="description" content="${description}">
    <link rel="canonical" href="${url}">
    ${alternates}
    <meta property="og:type" content="website">
    <meta property="og:locale" content="${langue.locale}">
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
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <script type="application/ld+json">${JSON.stringify(jsonLd(file, langue))}</script>`;
}

export function injectSeo(html, file, langue = LANGUE_PAR_DEFAUT) {
  return html.replace(SEO_MARKER, () => seoHtml(file, langue));
}

// Plan du site pour les moteurs de recherche : une entrée par page référencée
// et par langue, avec la date de dernière modification quand elle est connue
// (`dates`) et les versions de la page dans les autres langues.
export function sitemapXml(dates = {}) {
  const urls = Object.keys(SEO)
    .flatMap((file) =>
      LANGUES.map((langue) => {
        const lastmod = dates[file] ? `<lastmod>${dates[file]}</lastmod>` : '';
        const links = LANGUES.map(
          (autre) =>
            `<xhtml:link rel="alternate" hreflang="${autre.htmlLang}" href="${pageUrl(file, autre)}"/>`,
        ).join('');
        return `  <url><loc>${pageUrl(file, langue)}</loc>${lastmod}${links}</url>\n`;
      }),
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}</urlset>
`;
}
