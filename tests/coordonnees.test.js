// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  COORDONNEES_MARKER,
  EMAIL_MARKER,
  TELEPHONE_MARKER,
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
    });
  });

  it('ne remplace que le zéro initial', () => {
    expect(coordonnees({ CONTACT_TELEPHONE: '+33 6 10' }).international).toBe('+33610');
  });

  it('reste vide sans variables', () => {
    expect(coordonnees({})).toEqual({ email: '', telephone: '', international: '' });
  });
});

describe('injectCoordonnees', () => {
  const html = [EMAIL_MARKER, TELEPHONE_MARKER, COORDONNEES_MARKER].join('|');

  it('écrit les liens et le rappel en clair', () => {
    expect(injectCoordonnees(html, env)).toBe(
      '<a class="contact-lien" href="mailto:a@b.fr">a@b.fr</a>|' +
        '<a class="contact-lien" href="tel:+33612345670">06 12.34-56 70</a>|' +
        ' · a@b.fr · 06 12.34-56 70',
    );
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
      '<a class="contact-lien" href="mailto:&lt;$&amp;&quot;">&lt;$&amp;&quot;</a>|' +
        '<a class="contact-lien" href="tel:&lt;">&lt;</a>|' +
        ' · &lt;$&amp;&quot; · &lt;',
    );
  });
});
