import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LANGUES } from '../scripts/langues.js';
import {
  PARTAGE_BOUTON,
  PARTAGE_BOUTON_MARKER,
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

  it('contient la fenêtre native et le lien à copier, sans le bouton', () => {
    expect(html).not.toContain('partage-ouvrir');
    expect(html).toContain(
      '<dialog class="partage" aria-labelledby="partage-titre" data-copie="Lien copié." data-selection="Lien sélectionné : copiez-le avec Ctrl+C." data-echec="Le partage a échoué : copiez le lien.">',
    );
    expect(html).toContain('<h2 id="partage-titre" class="invisible">Partager cette page</h2>');
    expect(html).toContain(
      'value="https://www.douzeensemble.fr/contact/" aria-label="Adresse de la page"',
    );
    expect(html).toContain('<form method="dialog"><button class="partage-fermer" aria-label="Fermer">×</button></form>');
    expect(html).toContain('<p class="partage-etat" role="status"></p>');
  });

  it('dessine l’icône de partage : trois points reliés', () => {
    expect(PARTAGE_BOUTON).toMatch(
      /^<button type="button" class="preferences-bouton partage-ouvrir" aria-label="Partager cette page"><svg /,
    );
    expect(PARTAGE_BOUTON.endsWith('</svg></button>')).toBe(true);
    expect(PARTAGE_BOUTON).toContain(
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
    );
    expect(PARTAGE_BOUTON).toContain(
      '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>',
    );
    expect(PARTAGE_BOUTON).toContain('<path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>');
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

  it('pose le bouton dans le groupe des préférences d’une page à partager', () => {
    expect(PARTAGE_BOUTON_MARKER).toBe('<!--PARTAGE-BOUTON-->');
    expect(injectPartage(`a ${PARTAGE_BOUTON_MARKER} b ${PARTAGE_MARKER}`, 'index.html')).toBe(
      `a ${PARTAGE_BOUTON} b ${partageHtml('https://www.douzeensemble.fr/')}`,
    );
  });

  it('retire la place du bouton d’une page sans partage (404)', () => {
    expect(injectPartage(`a ${PARTAGE_BOUTON_MARKER} b`, '404.html')).toBe('a  b');
  });

  it('laisse intacte une page sans marqueur', () => {
    expect(injectPartage('<p>x $& y</p>', 'index.html')).toBe('<p>x $& y</p>');
  });
});

describe('partage dans une autre langue', () => {
  const contact = join('contact', 'index.html');

  it('donne l’adresse de la page dans sa langue', () => {
    expect(pageUrl(contact, LANGUES[1])).toBe('https://www.douzeensemble.fr/en/contact/');
    expect(pageUrl('index.html', LANGUES[2])).toBe('https://www.douzeensemble.fr/mrs/');
    expect(pageUrl(contact, LANGUES[0])).toBe('https://www.douzeensemble.fr/contact/');
  });

  it('traduit l’étiquette du QR code, sans toucher à l’adresse', () => {
    const html = partageHtml('https://www.douzeensemble.fr/en/contact/', LANGUES[1]);
    expect(html).toContain('aria-label="QR code of https://www.douzeensemble.fr/en/contact/"');
    expect(html).toContain('value="https://www.douzeensemble.fr/en/contact/"');
  });

  it('pointe le QR de la carte vers l’accueil de la langue', () => {
    expect(qrAccueilHtml(LANGUES[1])).toBe(
      `<div class="carte-qr">${qrSvg('https://www.douzeensemble.fr/en/', 'QR code vers la page d’accueil')}</div>`,
    );
    expect(qrAccueilHtml()).toBe(qrAccueilHtml(LANGUES[0]));
  });

  it('injecte la page dans la langue demandée', () => {
    const html = injectPartage(`${PARTAGE_MARKER}${QR_ACCUEIL_MARKER}`, contact, LANGUES[2]);
    expect(html).toContain('value="https://www.douzeensemble.fr/mrs/contact/"');
    expect(html).toContain(qrAccueilHtml(LANGUES[2]));
    expect(html).toContain('aria-label="QR code de https://www.douzeensemble.fr/mrs/contact/"');
  });
});
