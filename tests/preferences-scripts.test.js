import { describe, expect, it } from 'vitest';
import { PARTAGE_BOUTON_MARKER } from '../scripts/partage.js';
import {
  PREFERENCES_MARKER,
  injectPreferences,
  preferencesHtml,
} from '../scripts/preferences.js';

const ACCESSIBILITY_END = '</svg></button>';

describe('preferencesHtml', () => {
  const html = preferencesHtml();
  const doc = new DOMParser().parseFromString(html, 'text/html');

  it('groupe les boutons sous une étiquette', () => {
    const group = doc.querySelector('div[role="group"].preferences');
    expect(group.getAttribute('aria-label')).toBe('Préférences d’affichage');
    expect(group.querySelectorAll('button')).toHaveLength(2);
  });

  it('garde la place du bouton de partage en fin de groupe', () => {
    expect(html).toContain(`${ACCESSIBILITY_END}\n      ${PARTAGE_BOUTON_MARKER}\n    </div>`);
  });

  it('donne un nom à chaque bouton d’icône', () => {
    expect(
      doc.querySelector('.preferences-theme').getAttribute('aria-label'),
    ).toBe('Thème : automatique');
    expect(
      doc
        .querySelector('.preferences-accessibilite')
        .getAttribute('aria-label'),
    ).toBe('Accessibilité');
    expect(doc.querySelectorAll('.preferences-bouton svg[aria-hidden="true"]'))
      .toHaveLength(4);
  });

  it('porte une icône par état du thème', () => {
    for (const name of ['icone-auto', 'icone-clair', 'icone-sombre']) {
      expect(doc.querySelectorAll(`.preferences-theme svg.${name}`)).toHaveLength(1);
    }
    expect(doc.querySelector('.preferences-accessibilite svg').hasAttribute('class')).toBe(false);
  });

  it('propose les trois réglages dans un dialogue natif nommé', () => {
    const dialog = doc.querySelector('dialog.preferences-dialogue');
    expect(dialog.getAttribute('aria-labelledby')).toBe('preferences-titre');
    expect(doc.querySelector('#preferences-titre').textContent).toBe(
      'Accessibilité',
    );
    const labels = [...dialog.querySelectorAll('label')].map((l) => [
      l.querySelector('input').dataset.preference,
      l.textContent.trim(),
    ]);
    expect(labels).toEqual([
      ['largeText', 'Texte plus grand'],
      ['highContrast', 'Contraste élevé'],
      ['reduceMotion', 'Animations réduites'],
    ]);
    expect(dialog.querySelector('form[method="dialog"] button').getAttribute('aria-label')).toBe('Fermer');
  });
});

describe('injectPreferences', () => {
  it('remplace le marqueur', () => {
    const out = injectPreferences(`a ${PREFERENCES_MARKER} b`);
    expect(PREFERENCES_MARKER).toBe('<!--PREFERENCES-->');
    expect(out).not.toContain(PREFERENCES_MARKER);
    expect(out).toContain('class="preferences"');
  });

  it('laisse une page sans marqueur intacte', () => {
    expect(injectPreferences('rien')).toBe('rien');
  });
});

describe('libellés du bouton de thème', () => {
  it('porte un libellé par thème, pour le script', () => {
    const button = new DOMParser()
      .parseFromString(preferencesHtml(), 'text/html')
      .querySelector('.preferences-theme');
    expect(button.getAttribute('data-label-auto')).toBe('Thème : automatique');
    expect(button.getAttribute('data-label-light')).toBe('Thème : clair');
    expect(button.getAttribute('data-label-dark')).toBe('Thème : sombre');
  });
});
