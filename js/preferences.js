// Préférences d'affichage (A11Y-11) : thème Auto / Clair / Sombre et trois
// réglages d'accessibilité, mémorisés dans le navigateur et appliqués par des
// attributs sur <html> que lit style.css. Le HTML (groupe de boutons et
// dialogue) est écrit à la construction par scripts/preferences.js, qui porte
// aussi, traduits, les libellés du bouton de thème (`data-label-*`).
export const STORAGE_KEY = 'douzeensemble:preferences';
export const THEMES = ['auto', 'light', 'dark'];
export const REDUCE_MOTION_ATTRIBUTE = 'data-reduce-motion';
export const FLAG_ATTRIBUTES = {
  largeText: 'data-large-text',
  highContrast: 'data-high-contrast',
  reduceMotion: REDUCE_MOTION_ATTRIBUTE,
};

// Lit les préférences ; toute valeur absente, invalide ou un stockage
// indisponible redonne les valeurs par défaut (thème du système, rien d'actif).
export function readPreferences(storage) {
  let stored;
  try {
    stored = JSON.parse(storage.getItem(STORAGE_KEY));
  } catch {
    stored = null;
  }
  return {
    theme: THEMES.includes(stored?.theme) ? stored.theme : 'auto',
    largeText: stored?.largeText === true,
    highContrast: stored?.highContrast === true,
    reduceMotion: stored?.reduceMotion === true,
  };
}

export function savePreferences(storage, preferences) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // stockage indisponible : le réglage vaut pour la page, sans être gardé
  }
}

export function nextTheme(theme) {
  return THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
}

// « Auto » n'écrit aucun attribut : le thème du système s'applique.
export function applyPreferences(root, preferences) {
  if (preferences.theme === 'auto') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', preferences.theme);
  }
  for (const [name, attribute] of Object.entries(FLAG_ATTRIBUTES)) {
    root.toggleAttribute(attribute, preferences[name]);
  }
}

export function init(win, doc) {
  const group = doc.querySelector('.preferences');
  if (!group) {
    return;
  }
  const root = doc.documentElement;
  const themeButton = group.querySelector('.preferences-theme');
  const dialog = doc.querySelector('.preferences-dialogue');
  const preferences = readPreferences(win.localStorage);

  const showTheme = () => {
    themeButton.dataset.theme = preferences.theme;
    themeButton.setAttribute(
      'aria-label',
      themeButton.getAttribute(`data-label-${preferences.theme}`),
    );
  };
  const update = () => {
    applyPreferences(root, preferences);
    savePreferences(win.localStorage, preferences);
  };

  applyPreferences(root, preferences);
  showTheme();

  themeButton.addEventListener('click', () => {
    preferences.theme = nextTheme(preferences.theme);
    showTheme();
    update();
  });

  group
    .querySelector('.preferences-accessibilite')
    .addEventListener('click', () => dialog.showModal());

  for (const box of dialog.querySelectorAll('input[data-preference]')) {
    box.checked = preferences[box.dataset.preference];
    box.addEventListener('change', () => {
      preferences[box.dataset.preference] = box.checked;
      update();
    });
  }

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
}
