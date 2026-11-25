// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PAGES } from '../scripts/build-site.js';
import { LANGUES } from '../scripts/langues.js';
import {
  IMAGE_ALT,
  IMAGE_URL,
  SEO,
  SEO_MARKER,
  injectSeo,
  jsonLd,
  seoHtml,
  sitemapXml,
} from '../scripts/seo.js';

describe('constantes', () => {
  it('définit le marqueur et l’image d’aperçu', () => {
    expect(SEO_MARKER).toBe('<!--SEO-->');
    expect(IMAGE_URL).toBe('https://www.douzeensemble.fr/og.png');
    expect(IMAGE_ALT).toBe(
      'douzeEnsemble : sites, applications et accompagnement numérique',
    );
  });

  it('référence toutes les pages sauf la page introuvable', () => {
    expect(Object.keys(SEO).sort()).toEqual(
      PAGES.filter((p) => p !== '404.html').sort(),
    );
  });

  it.each(Object.entries(SEO))(
    '%s : titre identique à la page, marqueur présent, description de 50 à 160 caractères',
    (file, { title, description }) => {
      const html = readFileSync(file, 'utf8');
      expect(html).toContain(`<title>${title}</title>`);
      expect(html).toContain(SEO_MARKER);
      expect(description.length).toBeGreaterThanOrEqual(50);
      expect(description.length).toBeLessThanOrEqual(160);
      expect(description).not.toMatch(/["<>]/);
    },
  );
});

describe('seoHtml', () => {
  it('écrit les balises de l’accueil', () => {
    expect(seoHtml('index.html')).toBe(`<meta name="description" content="${SEO['index.html'].description}">
    <link rel="canonical" href="https://www.douzeensemble.fr/">
    <link rel="alternate" hreflang="fr" href="https://www.douzeensemble.fr/">
    <link rel="alternate" hreflang="en" href="https://www.douzeensemble.fr/en/">
    <link rel="alternate" hreflang="fr-FR-x-mrs" href="https://www.douzeensemble.fr/mrs/">
    <link rel="alternate" hreflang="x-default" href="https://www.douzeensemble.fr/">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="fr_FR">
    <meta property="og:site_name" content="douzeEnsemble">
    <meta property="og:title" content="douzeEnsemble · Sites et applications sur mesure">
    <meta property="og:description" content="${SEO['index.html'].description}">
    <meta property="og:url" content="https://www.douzeensemble.fr/">
    <meta property="og:image" content="https://www.douzeensemble.fr/og.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${IMAGE_ALT}">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <script type="application/ld+json">${JSON.stringify(jsonLd('index.html'))}</script>`);
  });

  it('écrit l’adresse, la langue et les versions de la page dans chaque langue', () => {
    const html = seoHtml(join('contact', 'index.html'), LANGUES[1]);
    expect(html).toContain(
      '<link rel="canonical" href="https://www.douzeensemble.fr/en/contact/">',
    );
    expect(html).toContain('<meta property="og:locale" content="en_GB">');
    expect(html).toContain(
      '<meta property="og:url" content="https://www.douzeensemble.fr/en/contact/">',
    );
    expect(html).toContain(
      '<link rel="alternate" hreflang="fr" href="https://www.douzeensemble.fr/contact/">',
    );
    expect(html).toContain(
      '<link rel="alternate" hreflang="fr-FR-x-mrs" href="https://www.douzeensemble.fr/mrs/contact/">',
    );
    expect(html).toContain(
      '<link rel="alternate" hreflang="x-default" href="https://www.douzeensemble.fr/contact/">',
    );
    expect(html).toContain('"item":"https://www.douzeensemble.fr/en/"');
  });

  it('utilise l’adresse et le titre de la page', () => {
    const html = seoHtml(join('contact', 'index.html'));
    expect(html).toContain(
      '<link rel="canonical" href="https://www.douzeensemble.fr/contact/">',
    );
    expect(html).toContain(
      '<meta property="og:title" content="Contact · douzeEnsemble">',
    );
  });
});

describe('jsonLd', () => {
  it('décrit le site et l’entreprise, reliés par @id, pour l’accueil', () => {
    const [site, entreprise] = jsonLd('index.html')['@graph'];
    expect(site).toEqual({
      '@type': 'WebSite',
      '@id': 'https://www.douzeensemble.fr/#site',
      name: 'douzeEnsemble',
      url: 'https://www.douzeensemble.fr/',
      inLanguage: 'fr',
      publisher: { '@id': 'https://www.douzeensemble.fr/#organisation' },
    });
    expect(entreprise).toEqual({
      '@type': 'ProfessionalService',
      '@id': 'https://www.douzeensemble.fr/#organisation',
      name: 'douzeEnsemble',
      url: 'https://www.douzeensemble.fr/',
      logo: 'https://www.douzeensemble.fr/apple-touch-icon.png',
      image: 'https://www.douzeensemble.fr/og.png',
      description:
        'Conception de sites internet et d’applications sur mesure, conseil en communication numérique, maintenance et gestion de sites.',
      founder: {
        '@type': 'Person',
        name: 'Renaud',
        url: 'https://www.douzeensemble.fr/qui-suis-je/',
      },
      areaServed: [
        { '@type': 'City', name: 'Aix-en-Provence' },
        { '@type': 'City', name: 'Lambesc' },
      ],
      sameAs: ['https://github.com/douzeEnsemble'],
    });
  });

  it('écrit la langue et les adresses de la langue demandée', () => {
    const [site, entreprise] = jsonLd('index.html', LANGUES[2])['@graph'];
    expect(site.url).toBe('https://www.douzeensemble.fr/mrs/');
    expect(site.inLanguage).toBe('fr-FR-x-mrs');
    expect(entreprise.founder.url).toBe('https://www.douzeensemble.fr/mrs/qui-suis-je/');
    const [accueil, page] = jsonLd(join('contact', 'index.html'), LANGUES[1]).itemListElement;
    expect(accueil.item).toBe('https://www.douzeensemble.fr/en/');
    expect(page.item).toBe('https://www.douzeensemble.fr/en/contact/');
  });

  it('écrit un fil d’Ariane pour les autres pages', () => {
    expect(jsonLd(join('contact', 'index.html'))).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Accueil',
          item: 'https://www.douzeensemble.fr/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Contact',
          item: 'https://www.douzeensemble.fr/contact/',
        },
      ],
    });
  });
});

describe('injectSeo', () => {
  it('remplace le marqueur par les balises de la page', () => {
    const file = join('prestations', 'index.html');
    expect(injectSeo(`<head>${SEO_MARKER}</head>`, file)).toBe(
      `<head>${seoHtml(file)}</head>`,
    );
  });

  it('laisse intacte une page sans marqueur', () => {
    expect(injectSeo('<head></head>', 'inconnue.html')).toBe('<head></head>');
  });
});

describe('sitemapXml', () => {
  const xml = sitemapXml();

  it('écrit une entrée par ligne, sans séparateur entre elles', () => {
    const lignes = xml.split('\n');
    expect(lignes).toHaveLength(Object.keys(SEO).length * LANGUES.length + 4);
    expect(lignes.slice(2, -3).every((l) => /^ {2}<url>.*<\/url>$/.test(l))).toBe(true);
    expect(xml.endsWith('</url>\n</urlset>\n')).toBe(true);
  });

  it('déclare l’espace de noms des liens alternatifs', () => {
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    );
  });

  it('liste chaque page référencée dans chaque langue', () => {
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toHaveLength(Object.keys(SEO).length * LANGUES.length);
    expect(locs.slice(0, 4)).toEqual([
      'https://www.douzeensemble.fr/',
      'https://www.douzeensemble.fr/en/',
      'https://www.douzeensemble.fr/mrs/',
      'https://www.douzeensemble.fr/prestations/',
    ]);
    expect(locs).toContain('https://www.douzeensemble.fr/mrs/apropos/');
  });

  it('relie chaque page à ses versions dans les autres langues', () => {
    expect(xml).toContain(
      '<url><loc>https://www.douzeensemble.fr/en/contact/</loc><xhtml:link rel="alternate" hreflang="fr" href="https://www.douzeensemble.fr/contact/"/><xhtml:link rel="alternate" hreflang="en" href="https://www.douzeensemble.fr/en/contact/"/><xhtml:link rel="alternate" hreflang="fr-FR-x-mrs" href="https://www.douzeensemble.fr/mrs/contact/"/><xhtml:link rel="alternate" hreflang="x-default" href="https://www.douzeensemble.fr/contact/"/></url>',
    );
  });
});

describe('sitemapXml avec dates', () => {
  it('ajoute la date de dernière modification des pages datées, dans chaque langue', () => {
    const xml = sitemapXml({ 'index.html': '2026-11-24' });
    expect(xml).toContain(
      '<url><loc>https://www.douzeensemble.fr/</loc><lastmod>2026-11-24</lastmod><xhtml:link',
    );
    expect(xml).toContain(
      '<url><loc>https://www.douzeensemble.fr/mrs/</loc><lastmod>2026-11-24</lastmod><xhtml:link',
    );
    expect(xml).toContain(
      '<url><loc>https://www.douzeensemble.fr/contact/</loc><xhtml:link',
    );
  });
});
