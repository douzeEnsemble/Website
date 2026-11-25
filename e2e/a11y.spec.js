import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// A11Y-02 : chaque page du site publié (`_site/`, CI-14) passe par axe-core,
// dans les deux thèmes (A11Y-05, projets « clair » et « sombre »).
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// Exception connue, pour la seule règle `color-contrast` et seulement sur ces
// éléments : le menu et le bouton de partage (opacité 0,35) et la version (opacité 0,2) sont discrets
// par choix de design, visibles au survol et au focus (voir style.css). Le
// reste de la page, et toutes les autres règles sur ces éléments, restent
// contrôlés. À reconsidérer avec le propriétaire (critère 1.4.3).
const DISCRETS = '.menu, .pied-version, .partage-ouvrir';

async function violations(page) {
  const resultats = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const cibles = resultats.violations
    .filter((v) => v.id === 'color-contrast')
    .flatMap((v) => v.nodes.map((n) => n.target[0]));
  const discrets = new Set(
    await page.evaluate(
      ([selecteurs, sel]) => selecteurs.filter((c) => document.querySelector(c)?.closest(sel)),
      [cibles, DISCRETS],
    ),
  );
  return resultats.violations.filter(
    (v) => v.id !== 'color-contrast' || v.nodes.some((n) => !discrets.has(n.target[0])),
  );
}

const pagesFrancaises = [
  { nom: 'accueil', chemin: '/' },
  { nom: 'prestations', chemin: '/prestations/' },
  { nom: 'points forts', chemin: '/points-forts/' },
  { nom: 'déroulé d’un projet', chemin: '/deroule/' },
  { nom: 'réalisations', chemin: '/realisations/' },
  { nom: 'KoiKiManke', chemin: '/realisations/koikimanke/' },
  { nom: 'KesKeJeVoeux', chemin: '/realisations/keskejevoeux/' },
  { nom: 'OnMangeQuoi', chemin: '/realisations/onmangequoi/' },
  { nom: 'MineCarte', chemin: '/realisations/minecarte/' },
  { nom: 'PlusUn', chemin: '/realisations/plusun/' },
  { nom: 'DansMaHotte', chemin: '/realisations/dansmahotte/' },
  { nom: 'MoreMobsHeadsChecklist', chemin: '/realisations/moremobsheadschecklist/' },
  { nom: 'Pokenini', chemin: '/realisations/pokenini/' },
  { nom: 'Quine', chemin: '/realisations/quine/' },
  { nom: 'Demo', chemin: '/realisations/demo/' },
  { nom: 'contact', chemin: '/contact/' },
  { nom: 'carte de visite', chemin: '/carte/' },
  { nom: 'à propos', chemin: '/apropos/' },
];

// Chaque page passe aussi en anglais et en marseillais (`/en/`, `/mrs/`).
const LANGUES = [
  { prefixe: '', suffixe: '' },
  { prefixe: '/en', suffixe: ' (anglais)' },
  { prefixe: '/mrs', suffixe: ' (marseillais)' },
];
const pages = LANGUES.flatMap(({ prefixe, suffixe }) =>
  pagesFrancaises.map(({ nom, chemin }) => ({
    nom: `${nom}${suffixe}`,
    chemin: `${prefixe}${chemin}`,
  })),
);

for (const { nom, chemin } of pages) {
  test(`axe : aucune violation sur ${nom}`, async ({ page }) => {
    await page.goto(chemin);
    // toEqual([]) : le rapport s'affiche en entier à l'échec
    expect(await violations(page)).toEqual([]);
  });

  // La fenêtre de partage ouverte passe aussi par axe, avec ses couleurs de page.
  test(`axe : fenêtre de partage ouverte sur ${nom}`, async ({ page }) => {
    await page.goto(chemin);
    await page.click('.partage-ouvrir');
    await expect(page.locator('dialog.partage')).toBeVisible();
    expect(await violations(page)).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog.partage')).toBeHidden();
    await expect(page.locator('.partage-ouvrir')).toBeFocused();
  });

  // A11Y-06 : reflow à 320 px, sans défilement horizontal (critère 1.4.10).
  test(`reflow à 320 px sur ${nom}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(chemin);
    const debordement = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(debordement).toBeLessThanOrEqual(0);
  });

  // Petit écran : une barre avec un bouton « Menu » qui ouvre la liste. La
  // barre reste entière, à droite du bouton de partage, et la liste fermée
  // n'occupe aucune place.
  test(`menu replié en barre à 320 px sur ${nom}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(chemin);
    const bouton = page.locator('.menu-bouton');
    const partage = await page.locator('.partage-ouvrir').boundingBox();
    const box = await bouton.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(partage.x + partage.width);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
    expect(box.height).toBeGreaterThanOrEqual(44);
    await expect(bouton).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.menu a').first()).toBeHidden();
    await bouton.click();
    await expect(bouton).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.menu a').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.menu a').first()).toBeHidden();
  });
}

// Pages longues : le contenu commence et défile sous le menu fixe, jamais
// dessous, sur ordinateur comme sur mobile, avec ou sans texte agrandi.
const PAGES_LONGUES = [
  '/prestations/',
  '/points-forts/',
  '/deroule/',
  '/realisations/',
  '/realisations/koikimanke/',
  '/apropos/',
];
const LARGEURS = [320, 375, 900, 1280];

for (const chemin of PAGES_LONGUES) {
  for (const largeur of LARGEURS) {
    for (const agrandi of [false, true]) {
      test(`titre et contenu sous le menu à ${largeur} px${agrandi ? ' (texte agrandi)' : ''} sur ${chemin}`, async ({ page }) => {
        await page.setViewportSize({ width: largeur, height: 700 });
        await page.goto(chemin);
        if (agrandi) {
          await page.evaluate(() => document.documentElement.setAttribute('data-large-text', ''));
        }
        const menu = await page.locator('.menu').boundingBox();
        const titre = await page.locator('main h1').boundingBox();
        const contenu = await page.locator('main').boundingBox();
        expect(titre.y).toBeGreaterThanOrEqual(menu.y + menu.height);
        // la zone qui défile démarre sous le menu
        expect(contenu.y).toBeGreaterThanOrEqual(menu.y + menu.height);
      });
    }
  }
}

// Page introuvable : servie par GitHub Pages à toute adresse inconnue. Elle n'a
// pas de bouton de partage (une adresse inconnue n'a rien à partager).
test('axe : aucune violation sur la page introuvable', async ({ page }) => {
  await page.goto('/404.html');
  expect(await violations(page)).toEqual([]);
});

test('reflow à 320 px sur la page introuvable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/404.html');
  const debordement = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(debordement).toBeLessThanOrEqual(0);
});

// A11Y-11 : préférences d'affichage (thème et réglages d'accessibilité).
const REGLAGES = [
  ['Texte plus grand', 'data-large-text'],
  ['Contraste élevé', 'data-high-contrast'],
  ['Animations réduites', 'data-reduce-motion'],
];

test.describe('préférences d’affichage', () => {
  test('le groupe précède le menu, en bas à droite, avec des cibles de 44 px', async ({ page }) => {
    await page.goto('/');
    const premier = await page.evaluate(() => document.body.firstElementChild.className);
    expect(premier).toBe('preferences');
    const boutons = page.getByRole('group', { name: 'Préférences d’affichage' }).getByRole('button');
    await expect(boutons).toHaveCount(2);
    const { width, height } = page.viewportSize();
    for (const bouton of await boutons.all()) {
      const box = await bouton.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x + box.width).toBeGreaterThan(width / 2);
      expect(box.y + box.height).toBeGreaterThan(height / 2);
    }
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /^Thème/ })).toBeFocused();
  });

  test('le thème tourne Auto, Clair, Sombre et se garde au rechargement', async ({ page }) => {
    await page.goto('/');
    const racine = page.locator('html');
    const bouton = page.getByRole('button', { name: /^Thème/ });
    await expect(bouton).toHaveAccessibleName('Thème : automatique');
    await bouton.click();
    await expect(racine).toHaveAttribute('data-theme', 'light');
    await expect(bouton).toHaveAccessibleName('Thème : clair');
    expect(await violations(page)).toEqual([]);
    await bouton.click();
    await expect(racine).toHaveAttribute('data-theme', 'dark');
    expect(await violations(page)).toEqual([]);
    await page.reload();
    await expect(racine).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: /^Thème/ }).click();
    await expect(racine).not.toHaveAttribute('data-theme');
  });

  for (const { nom, chemin } of pages) {
    // Les libellés de ce test sont français : les autres langues passent par
    // axe et le reflow ci-dessous.
    const francais = !/^\/(en|mrs)\//.test(chemin);
    (francais ? test : test.skip)(`chaque réglage passe axe sur ${nom}`, async ({ page }) => {
      await page.goto(chemin);
      await page.getByRole('button', { name: 'Accessibilité' }).click();
      const dialogue = page.getByRole('dialog', { name: 'Accessibilité' });
      await expect(dialogue).toBeVisible();
      for (const [libelle, attribut] of REGLAGES) {
        await dialogue.getByLabel(libelle).check();
        await expect(page.locator('html')).toHaveAttribute(attribut, '');
        expect(await violations(page)).toEqual([]);
      }
      await page.keyboard.press('Escape');
      await expect(dialogue).toBeHidden();
      await expect(page.getByRole('button', { name: 'Accessibilité' })).toBeFocused();
      // réglages mémorisés
      await page.reload();
      for (const [, attribut] of REGLAGES) {
        await expect(page.locator('html')).toHaveAttribute(attribut, '');
      }
    });

    // Texte agrandi (A11Y-06) avec le contraste élevé, thème sombre forcé.
    test(`reflow à 320 px avec texte agrandi sur ${nom}`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(chemin);
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-large-text', '');
        document.documentElement.setAttribute('data-high-contrast', '');
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      const debordement = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(debordement).toBeLessThanOrEqual(0);
      expect(await violations(page)).toEqual([]);
    });
  }
});

// Sélecteur de langue : la même page dans chaque langue, feuille de style et
// textes compris.
test('le sélecteur de langue ouvre la même page en anglais, avec son style', async ({ page }) => {
  await page.goto('/contact/');
  await page.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en\/contact\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('main h1')).toHaveText('Contact');
  await expect(page.getByRole('button', { name: 'Show email' })).toBeVisible();
  await expect(page.locator('.langues a[aria-current="true"]')).toHaveText('English');
  // style.css est chargé : la liste des langues est en ligne (flex)
  await expect(page.locator('.langues ul')).toHaveCSS('display', 'flex');
});
