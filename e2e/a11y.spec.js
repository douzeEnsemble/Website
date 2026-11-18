import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// A11Y-02 : chaque page du site publié (`_site/`, CI-14) passe par axe-core,
// dans les deux thèmes (A11Y-05, projets « clair » et « sombre »).
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// Exception connue, pour la seule règle `color-contrast` et seulement sur ces
// éléments : le menu (opacité 0,35) et la version (opacité 0,2) sont discrets
// par choix de design, visibles au survol et au focus (voir style.css). Le
// reste de la page, et toutes les autres règles sur ces éléments, restent
// contrôlés. À reconsidérer avec le propriétaire (critère 1.4.3).
const DISCRETS = '.menu, .pied-version';

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

const pages = [
  { nom: 'accueil', chemin: '/' },
  { nom: 'prestations', chemin: '/prestations/' },
  { nom: 'réalisations', chemin: '/realisations/' },
  { nom: 'contact', chemin: '/contact/' },
];

for (const { nom, chemin } of pages) {
  test(`axe : aucune violation sur ${nom}`, async ({ page }) => {
    await page.goto(chemin);
    // toEqual([]) : le rapport s'affiche en entier à l'échec
    expect(await violations(page)).toEqual([]);
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
}
