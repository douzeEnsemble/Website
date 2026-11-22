// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PAGES } from '../scripts/build-site.js';
import {
  IMAGE_ALT,
  IMAGE_URL,
  SEO,
  SEO_MARKER,
  injectSeo,
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
    <meta property="og:type" content="website">
    <meta property="og:locale" content="fr_FR">
    <meta property="og:site_name" content="douzeEnsemble">
    <meta property="og:title" content="douzeEnsemble">
    <meta property="og:description" content="${SEO['index.html'].description}">
    <meta property="og:url" content="https://www.douzeensemble.fr/">
    <meta property="og:image" content="https://www.douzeensemble.fr/og.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${IMAGE_ALT}">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">`);
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
  it('liste l’adresse de chaque page référencée', () => {
    expect(sitemapXml()).toBe(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.douzeensemble.fr/</loc></url>
  <url><loc>https://www.douzeensemble.fr/prestations/</loc></url>
  <url><loc>https://www.douzeensemble.fr/points-forts/</loc></url>
  <url><loc>https://www.douzeensemble.fr/realisations/</loc></url>
  <url><loc>https://www.douzeensemble.fr/contact/</loc></url>
  <url><loc>https://www.douzeensemble.fr/carte/</loc></url>
  <url><loc>https://www.douzeensemble.fr/apropos/</loc></url>
</urlset>
`);
  });
});
