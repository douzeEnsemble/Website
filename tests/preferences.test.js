import { beforeEach, describe, expect, it } from 'vitest';
import {
  FLAG_ATTRIBUTES,
  REDUCE_MOTION_ATTRIBUTE,
  STORAGE_KEY,
  THEMES,
  THEME_LABELS,
  applyPreferences,
  init,
  nextTheme,
  readPreferences,
  savePreferences,
} from '../js/preferences.js';
import { preferencesHtml } from '../scripts/preferences.js';

const DEFAULTS = {
  theme: 'auto',
  largeText: false,
  highContrast: false,
  reduceMotion: false,
};

const storageWith = (value) => ({ getItem: () => value });

describe('constantes', () => {
  it('liste les thèmes, leurs libellés et les attributs', () => {
    expect(STORAGE_KEY).toBe('douzeensemble:preferences');
    expect(THEMES).toEqual(['auto', 'light', 'dark']);
    expect(THEME_LABELS).toEqual({
      auto: 'Thème : automatique',
      light: 'Thème : clair',
      dark: 'Thème : sombre',
    });
    expect(REDUCE_MOTION_ATTRIBUTE).toBe('data-reduce-motion');
    expect(FLAG_ATTRIBUTES).toEqual({
      largeText: 'data-large-text',
      highContrast: 'data-high-contrast',
      reduceMotion: 'data-reduce-motion',
    });
  });
});

describe('readPreferences', () => {
  it('relit ce qui a été enregistré', () => {
    const stored = {
      theme: 'dark',
      largeText: true,
      highContrast: true,
      reduceMotion: true,
    };
    expect(readPreferences(storageWith(JSON.stringify(stored)))).toEqual(stored);
  });

  it('relit un thème clair', () => {
    expect(
      readPreferences(storageWith('{"theme":"light"}')).theme,
    ).toBe('light');
  });

  it('prend les valeurs par défaut sans rien de stocké', () => {
    expect(readPreferences(storageWith(null))).toEqual(DEFAULTS);
  });

  it('prend les valeurs par défaut si le stockage est invalide ou indisponible', () => {
    expect(readPreferences(storageWith('pas du json'))).toEqual(DEFAULTS);
    expect(
      readPreferences({
        getItem: () => {
          throw new Error('indisponible');
        },
      }),
    ).toEqual(DEFAULTS);
  });

  it('ignore un thème inconnu et les réglages qui ne valent pas true', () => {
    expect(
      readPreferences(
        storageWith(
          '{"theme":"rose","largeText":"oui","highContrast":1,"reduceMotion":null}',
        ),
      ),
    ).toEqual(DEFAULTS);
  });
});

describe('savePreferences', () => {
  it('enregistre en JSON sous la clé du site', () => {
    const calls = [];
    savePreferences(
      { setItem: (...args) => calls.push(args) },
      { theme: 'dark' },
    );
    expect(calls).toEqual([[STORAGE_KEY, '{"theme":"dark"}']]);
  });

  it('ne plante pas si le stockage est indisponible', () => {
    expect(() =>
      savePreferences(
        {
          setItem: () => {
            throw new Error('plein');
          },
        },
        DEFAULTS,
      ),
    ).not.toThrow();
  });
});

describe('nextTheme', () => {
  it('passe d’Auto à Clair, à Sombre, puis revient à Auto', () => {
    expect(nextTheme('auto')).toBe('light');
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('auto');
  });
});

describe('applyPreferences', () => {
  it('écrit le thème et les réglages actifs sur la racine', () => {
    const root = document.createElement('html');
    applyPreferences(root, {
      theme: 'dark',
      largeText: true,
      highContrast: false,
      reduceMotion: true,
    });
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(root.hasAttribute('data-large-text')).toBe(true);
    expect(root.hasAttribute('data-high-contrast')).toBe(false);
    expect(root.hasAttribute('data-reduce-motion')).toBe(true);
  });

  it('retire le thème en mode Auto et les réglages désactivés', () => {
    const root = document.createElement('html');
    root.setAttribute('data-theme', 'light');
    root.setAttribute('data-large-text', '');
    applyPreferences(root, DEFAULTS);
    expect(root.hasAttribute('data-theme')).toBe(false);
    expect(root.hasAttribute('data-large-text')).toBe(false);
  });

  it('pose le thème clair', () => {
    const root = document.createElement('html');
    applyPreferences(root, { ...DEFAULTS, theme: 'light' });
    expect(root.getAttribute('data-theme')).toBe('light');
  });
});

describe('init', () => {
  let store;
  let win;
  const stored = () => JSON.parse(store[STORAGE_KEY]);
  const themeButton = () => document.querySelector('.preferences-theme');
  const dialog = () => document.querySelector('.preferences-dialogue');
  const box = (name) => document.querySelector(`[data-preference="${name}"]`);

  const mount = (saved) => {
    store = saved ? { [STORAGE_KEY]: JSON.stringify(saved) } : {};
    win = {
      localStorage: {
        getItem: (key) => store[key] ?? null,
        setItem: (key, value) => {
          store[key] = value;
        },
      },
    };
    document.body.innerHTML = preferencesHtml();
    dialog().showModal = () => dialog().setAttribute('open', '');
    dialog().close = () => dialog().removeAttribute('open');
    init(win, document);
  };

  beforeEach(() => {
    const root = document.documentElement;
    for (const name of [
      'data-theme',
      'data-large-text',
      'data-high-contrast',
      'data-reduce-motion',
    ]) {
      root.removeAttribute(name);
    }
  });

  it('ne fait rien sur une page sans préférences', () => {
    document.body.innerHTML = '<main></main>';
    expect(() => init({}, document)).not.toThrow();
  });

  it('démarre en Auto sans rien appliquer', () => {
    mount();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(themeButton().dataset.theme).toBe('auto');
    expect(themeButton().getAttribute('aria-label')).toBe('Thème : automatique');
    expect(box('largeText').checked).toBe(false);
    expect(store).toEqual({});
  });

  it('applique les préférences enregistrées', () => {
    mount({
      theme: 'dark',
      largeText: true,
      highContrast: false,
      reduceMotion: true,
    });
    const root = document.documentElement;
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(root.hasAttribute('data-large-text')).toBe(true);
    expect(root.hasAttribute('data-reduce-motion')).toBe(true);
    expect(themeButton().getAttribute('aria-label')).toBe('Thème : sombre');
    expect(box('largeText').checked).toBe(true);
    expect(box('highContrast').checked).toBe(false);
    expect(box('reduceMotion').checked).toBe(true);
  });

  it('fait tourner le thème à chaque clic et le mémorise', () => {
    mount();
    themeButton().click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(themeButton().getAttribute('aria-label')).toBe('Thème : clair');
    expect(stored().theme).toBe('light');
    themeButton().click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    themeButton().click();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(stored().theme).toBe('auto');
  });

  it('ouvre le dialogue d’accessibilité', () => {
    mount();
    expect(dialog().hasAttribute('open')).toBe(false);
    document.querySelector('.preferences-accessibilite').click();
    expect(dialog().hasAttribute('open')).toBe(true);
  });

  it('applique et mémorise chaque case cochée ou décochée', () => {
    mount();
    for (const [name, attribute] of Object.entries(FLAG_ATTRIBUTES)) {
      box(name).checked = true;
      box(name).dispatchEvent(new Event('change'));
      expect(document.documentElement.hasAttribute(attribute)).toBe(true);
      expect(stored()[name]).toBe(true);
      box(name).checked = false;
      box(name).dispatchEvent(new Event('change'));
      expect(document.documentElement.hasAttribute(attribute)).toBe(false);
      expect(stored()[name]).toBe(false);
    }
  });

  it('ferme le dialogue sur un clic au fond, pas sur son contenu', () => {
    mount();
    dialog().setAttribute('open', '');
    document.querySelector('.preferences-contenu').click();
    expect(dialog().hasAttribute('open')).toBe(true);
    dialog().click();
    expect(dialog().hasAttribute('open')).toBe(false);
  });
});
