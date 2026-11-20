// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  MENTIONS_FIELDS,
  MENTIONS_MARKER,
  escapeHtml,
  injectMentions,
  mentionsHtml,
} from '../scripts/mentions.js';

describe('MENTIONS_FIELDS', () => {
  it('liste les variables et leur libellé', () => {
    expect(MENTIONS_FIELDS).toEqual([
      ['RAISON_SOCIALE', 'Raison sociale'],
      ['FORME_JURIDIQUE', 'Forme juridique'],
      ['ADRESSE', 'Adresse'],
      ['DIRECTEUR_PUBLICATION', 'Directeur de la publication'],
    ]);
  });
});

describe('escapeHtml', () => {
  it('échappe les caractères HTML', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
  });
});

describe('mentionsHtml', () => {
  it('ne produit rien sans variable', () => {
    expect(mentionsHtml({})).toBe('');
  });

  it('affiche chaque valeur renseignée, échappée et rognée', () => {
    expect(
      mentionsHtml({
        RAISON_SOCIALE: '  Dupont & Fils ',
        FORME_JURIDIQUE: 'SASU',
        ADRESSE: '',
        DIRECTEUR_PUBLICATION: 'Renaud',
      }),
    ).toBe(
      '<dt>Raison sociale</dt><dd>Dupont &amp; Fils</dd>\n        <dt>Forme juridique</dt><dd>SASU</dd>\n        <dt>Directeur de la publication</dt><dd>Renaud</dd>',
    );
  });

  it('ajoute le lien vers l’Annuaire des Entreprises pour un SIREN valide', () => {
    const html = mentionsHtml({ SIREN: ' 123456789 ' });
    expect(html).toContain('<dt>SIREN</dt><dd>123456789 · ');
    expect(html).toContain(
      'href="https://annuaire-entreprises.data.gouv.fr/entreprise/123456789"',
    );
    expect(html).toContain('target="_blank" rel="noopener noreferrer"');
    expect(html).toContain('(nouvel onglet)');
  });

  it.each(['12345678', '1234567890', 'abcdefghi', '123456789\n1', ''])(
    'omet le SIREN invalide %j',
    (siren) => {
      expect(mentionsHtml({ SIREN: siren })).toBe('');
    },
  );
});

describe('injectMentions', () => {
  it('remplace le marqueur', () => {
    expect(injectMentions(`a ${MENTIONS_MARKER} b`, { ADRESSE: 'ici' })).toBe(
      'a <dt>Adresse</dt><dd>ici</dd> b',
    );
  });

  it('ne traite pas $& de la valeur comme un motif de remplacement', () => {
    expect(injectMentions(MENTIONS_MARKER, { ADRESSE: '$&' })).toBe(
      '<dt>Adresse</dt><dd>$&amp;</dd>',
    );
  });
});
