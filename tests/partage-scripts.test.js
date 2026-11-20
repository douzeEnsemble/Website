import { describe, expect, it } from 'vitest';
import {
  PARTAGE_MARKER,
  QR_ACCUEIL_MARKER,
  SITE_URL,
  injectPartage,
  pageUrl,
  partageHtml,
  qrAccueilHtml,
  qrSvg,
} from '../scripts/partage.js';

describe('pageUrl', () => {
  it('donne l’adresse publique de la page d’accueil', () => {
    expect(SITE_URL).toBe('https://www.douzeensemble.fr/');
    expect(pageUrl('index.html')).toBe('https://www.douzeensemble.fr/');
  });

  it('donne l’adresse publique d’une sous-page', () => {
    expect(pageUrl('contact/index.html')).toBe(
      'https://www.douzeensemble.fr/contact/',
    );
  });
});

describe('qrSvg', () => {
  const svg = qrSvg('https://www.douzeensemble.fr/', 'Mon QR');
  const modules = (svg.match(/M\d+ \d+h1v1h-1z/g) ?? []).length;

  it('dessine un carré avec marge, fond blanc et modules sombres', () => {
    // 29 modules (version 3) + 2 x 2 de marge
    expect(svg).toMatch(
      /^<svg viewBox="0 0 33 33" shape-rendering="crispEdges" role="img" aria-label="Mon QR">/,
    );
    expect(svg).toContain('<rect width="33" height="33" fill="#fff"/>');
    expect(svg).toContain('fill="#05131d"/></svg>');
  });

  it('commence par le coin du motif de repérage, décalé de la marge', () => {
    expect(svg).toContain('<path d="M2 2h1v1h-1z');
    expect(svg).toContain('M30 2h1v1h-1z');
    expect(svg).toContain('M2 30h1v1h-1z');
  });

  it('ne dessine que des modules dans la grille', () => {
    expect(modules).toBeGreaterThan(300);
    expect(modules).toBeLessThan(29 * 29);
    for (const [, col, row] of svg.matchAll(/M(\d+) (\d+)h1v1h-1z/g)) {
      expect(Number(col)).toBeGreaterThanOrEqual(2);
      expect(Number(col)).toBeLessThanOrEqual(30);
      expect(Number(row)).toBeGreaterThanOrEqual(2);
      expect(Number(row)).toBeLessThanOrEqual(30);
    }
  });

  it('est déterministe et dépend du texte', () => {
    expect(qrSvg('https://www.douzeensemble.fr/', 'Mon QR')).toBe(svg);
    expect(qrSvg('https://www.douzeensemble.fr/contact/', 'Mon QR')).not.toBe(
      svg,
    );
  });
});

describe('partageHtml', () => {
  const html = partageHtml('https://www.douzeensemble.fr/contact/');

  it('contient le bouton, la fenêtre native et le lien à copier', () => {
    expect(html).toContain('class="partage-ouvrir" aria-label="Partager cette page"');
    expect(html).toContain('<dialog class="partage" aria-labelledby="partage-titre">');
    expect(html).toContain('<h2 id="partage-titre" class="invisible">Partager cette page</h2>');
    expect(html).toContain(
      'value="https://www.douzeensemble.fr/contact/" aria-label="Adresse de la page"',
    );
    expect(html).toContain('<form method="dialog"><button class="partage-fermer" aria-label="Fermer">×</button></form>');
    expect(html).toContain('<p class="partage-etat" role="status"></p>');
  });

  it('dessine l’icône de partage : trois points reliés', () => {
    expect(html).toContain(
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
    );
    expect(html).toContain(
      '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>',
    );
    expect(html).toContain('<path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>');
  });

  it('cache le bouton Partager tant que le script ne l’active pas', () => {
    expect(html).toContain('partage-partager" hidden>Partager</button>');
  });

  it('porte le QR code de la page', () => {
    expect(html).toContain(
      'aria-label="QR code de https://www.douzeensemble.fr/contact/"',
    );
  });
});

describe('qrAccueilHtml', () => {
  it('enveloppe le QR code de l’accueil', () => {
    const html = qrAccueilHtml();
    expect(html).toMatch(/^<div class="carte-qr"><svg /);
    expect(html).toContain('aria-label="QR code vers la page d’accueil"');
    expect(html.endsWith('</svg></div>')).toBe(true);
  });
});

describe('injectPartage', () => {
  it('remplace les marqueurs par le partage de la page et le QR d’accueil', () => {
    const out = injectPartage(
      `a ${PARTAGE_MARKER} b ${QR_ACCUEIL_MARKER} c`,
      'carte/index.html',
    );
    expect(out).toBe(
      `a ${partageHtml('https://www.douzeensemble.fr/carte/')} b ${qrAccueilHtml()} c`,
    );
  });

  it('laisse intacte une page sans marqueur', () => {
    expect(injectPartage('<p>x $& y</p>', 'index.html')).toBe('<p>x $& y</p>');
  });
});
