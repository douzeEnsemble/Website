// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  COORDONNEES_MARKER,
  EMAIL_MARKER,
  ICONES,
  TELEPHONE_MARKER,
  WHATSAPP_MARKER,
  coordonnees,
  injectCoordonnees,
} from '../scripts/coordonnees.js';

const env = { CONTACT_EMAIL: ' a@b.fr ', CONTACT_TELEPHONE: ' 06 12.34-56 70 ' };

describe('coordonnees', () => {
  it('nettoie les valeurs et donne le format international', () => {
    expect(coordonnees(env)).toEqual({
      email: 'a@b.fr',
      telephone: '06 12.34-56 70',
      international: '+33612345670',
      national: '06 12.34-56 70',
    });
  });

  it('ne remplace que le zéro initial', () => {
    expect(coordonnees({ CONTACT_TELEPHONE: '+33 6 10' }).international).toBe('+33610');
  });

  it('reste vide sans variables', () => {
    expect(coordonnees({})).toEqual({
      email: '',
      telephone: '',
      international: '',
      national: '',
    });
  });
});

describe('ICONES', () => {
  it('sont des dessins distincts et décoratifs', () => {
    for (const dessin of Object.values(ICONES)) {
      expect(dessin).toMatch(/^<svg [^>]*aria-hidden="true"><(path|rect) .+<\/svg>$/);
    }
    expect(new Set(Object.values(ICONES)).size).toBe(3);
  });
});

describe('injectCoordonnees', () => {
  const html = [EMAIL_MARKER, TELEPHONE_MARKER, COORDONNEES_MARKER].join('|');

  it('écrit les liens et le rappel en clair', () => {
    expect(injectCoordonnees(html, env)).toBe(
      `<a class="contact-lien" href="mailto:a@b.fr">${ICONES.email}<span>a@b.fr</span></a>|` +
        `<a class="contact-lien" href="tel:+33612345670">${ICONES.telephone}<span>06 12.34-56 70</span></a>|` +
        ' · a@b.fr · 06 12.34-56 70',
    );
  });

  it.each(['+33 6 12 34 56 70', '+336 12 34 56 70'])('rappelle aussi la forme nationale de %s', (numero) => {
    const { national } = coordonnees({ CONTACT_TELEPHONE: numero });
    expect(national).toMatch(/^06 ?12 34 56 70$/);
    expect(injectCoordonnees(COORDONNEES_MARKER, { CONTACT_TELEPHONE: numero })).toBe(` · ${numero} · ${national}`);
  });

  it('ne touche pas un +33 en milieu de valeur', () => {
    expect(coordonnees({ CONTACT_TELEPHONE: 'x +33 6' }).national).toBe('x +33 6');
  });

  it('lie WhatsApp au numéro, avec le même libellé partout', () => {
    expect(injectCoordonnees(WHATSAPP_MARKER + WHATSAPP_MARKER, env)).toBe(
      `<a class="contact-lien" href="https://wa.me/33612345670">${ICONES.whatsapp}<span>WhatsApp</span></a>`.repeat(2),
    );
    expect(injectCoordonnees(WHATSAPP_MARKER, {})).toBe('');
  });

  it('préfère le nom d’utilisateur WhatsApp au numéro', () => {
    for (const variables of [env, {}]) {
      expect(
        injectCoordonnees(WHATSAPP_MARKER, { ...variables, CONTACT_WHATSAPP: ' monNom ' }),
      ).toContain('href="https://wa.me/monNom"');
    }
  });

  it('revient au numéro si le nom est vide', () => {
    expect(
      injectCoordonnees(WHATSAPP_MARKER, { ...env, CONTACT_WHATSAPP: ' ' }),
    ).toContain('href="https://wa.me/33612345670"');
  });

  it('remplace chaque occurrence', () => {
    for (const marker of [EMAIL_MARKER, TELEPHONE_MARKER, COORDONNEES_MARKER]) {
      expect(injectCoordonnees(marker + marker, env)).not.toContain(marker);
    }
  });

  it('laisse les places vides sans variables', () => {
    expect(injectCoordonnees(html, {})).toBe('||');
  });

  it('échappe les valeurs', () => {
    const resultat = injectCoordonnees(html, { CONTACT_EMAIL: '<$&"', CONTACT_TELEPHONE: '<' });
    expect(resultat).toBe(
      `<a class="contact-lien" href="mailto:&lt;$&amp;&quot;">${ICONES.email}<span>&lt;$&amp;&quot;</span></a>|` +
        `<a class="contact-lien" href="tel:&lt;">${ICONES.telephone}<span>&lt;</span></a>|` +
        ' · &lt;$&amp;&quot; · &lt;',
    );
  });
});
