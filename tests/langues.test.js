import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REALISATIONS_PAGE, PAGES } from '../scripts/build-site.js';
import {
  LANGUES,
  LANGUES_MARKER,
  LANGUE_PAR_DEFAUT,
  injectLangues,
  languesHtml,
  pagePath,
  traduire,
  translateHtml,
} from '../scripts/langues.js';
import { injectCoordonnees } from '../scripts/coordonnees.js';
import { injectMentions, MENTIONS_FIELDS } from '../scripts/mentions.js';
import { injectLogo } from '../scripts/logo.js';
import { injectPartage } from '../scripts/partage.js';
import { injectPreferences } from '../scripts/preferences.js';
import { injectSeo } from '../scripts/seo.js';
import { TEXTES_EN } from '../scripts/textes-en.js';
import { TEXTES_MRS } from '../scripts/textes-mrs.js';

const [FR, EN, MRS] = LANGUES;

describe('LANGUES', () => {
  it('décrit le français, l’anglais et le marseillais', () => {
    expect(LANGUES.map(({ code, dir, htmlLang, locale, nom }) => ({ code, dir, htmlLang, locale, nom }))).toEqual([
      { code: 'fr', dir: '', htmlLang: 'fr', locale: 'fr_FR', nom: 'Français' },
      { code: 'en', dir: 'en/', htmlLang: 'en', locale: 'en_GB', nom: 'English' },
      { code: 'mrs', dir: 'mrs/', htmlLang: 'fr-FR-x-mrs', locale: 'fr_FR', nom: 'Marseillais' },
    ]);
    expect(LANGUE_PAR_DEFAUT).toBe(FR);
    expect(FR.textes).toEqual({});
    expect(EN.textes).toBe(TEXTES_EN);
    expect(MRS.textes).toBe(TEXTES_MRS);
    expect(LANGUES_MARKER).toBe('<!--LANGUES-->');
  });
});

describe('traduire', () => {
  it('donne le texte traduit, ou le texte français sans traduction', () => {
    expect(traduire('Accueil', EN)).toBe('Home');
    expect(traduire('Accueil', FR)).toBe('Accueil');
    expect(traduire('Texte inconnu', EN)).toBe('Texte inconnu');
  });
});

describe('translateHtml', () => {
  const fake = { code: 'xx', dir: 'xx/', htmlLang: 'xx', textes: { 'Un (test)': 'A test', 'a.c': 'ok', Lien: 'Link' } };

  it('remplace un contenu d’élément entier', () => {
    expect(translateHtml('<p>Un (test)</p><p>Un (test) de plus</p>', fake)).toBe(
      '<p>A test</p><p>Un (test) de plus</p>',
    );
  });

  it('remplace une valeur d’attribut entière', () => {
    expect(translateHtml('<a title="Un (test)" alt="Un (test) !">', fake)).toBe(
      '<a title="A test" alt="Un (test) !">',
    );
  });

  it('traite les caractères spéciaux d’expression régulière comme du texte', () => {
    expect(translateHtml('<b>a.c</b><b>abc</b>', fake)).toBe('<b>ok</b><b>abc</b>');
  });

  it('ne retraduit pas un texte déjà traduit', () => {
    const boucle = { ...fake, textes: { A: 'B', B: 'C' } };
    expect(translateHtml('<i>A</i><i>B</i>', boucle)).toBe('<i>B</i><i>C</i>');
  });

  it('peut cibler un seul élément par le début de sa clé', () => {
    const cible = { ...fake, textes: { 'acteur">Ensemble': 'acteur">Together' } };
    expect(
      translateHtml('<span class="acteur">Ensemble</span> douze<span>Ensemble</span>', cible),
    ).toBe('<span class="acteur">Together</span> douze<span>Ensemble</span>');
  });

  it('laisse le français intact', () => {
    const html = '<html lang="fr"><link href="style.css"><p>Accueil</p>';
    expect(translateHtml(html, FR)).toBe(html);
  });

  it('règle la langue de la page', () => {
    expect(translateHtml('<html lang="fr">', fake)).toBe('<html lang="xx">');
    expect(translateHtml('"inLanguage": "fr"', fake)).toBe('"inLanguage": "xx"');
    expect(translateHtml('<html lang="fr">', MRS)).toBe('<html lang="fr-FR-x-mrs">');
  });

  it('remonte d’un dossier les chemins du style et des scripts', () => {
    expect(
      translateHtml(
        '<link href="style.css"><script src="js/main.js"></script><link href="../style.css"><script src="../../js/a.js"></script>',
        fake,
      ),
    ).toBe(
      '<link href="../style.css"><script src="../js/main.js"></script><link href="../../style.css"><script src="../../../js/a.js"></script>',
    );
  });

  it('ne touche ni aux autres liens ni aux chemins absolus', () => {
    const html =
      '<a href="prestations/">p</a><a href="../">a</a><link href="/style.css"><script src="/js/x.js"></script><a href="mystyle.css">s</a>';
    expect(translateHtml(html, fake)).toBe(html);
  });
});

describe('pagePath', () => {
  it('donne le chemin d’une page dans une langue', () => {
    expect(pagePath('index.html', FR)).toBe('/');
    expect(pagePath('404.html', EN)).toBe('/en/');
    expect(pagePath(join('contact', 'index.html'), FR)).toBe('/contact/');
    expect(pagePath(join('contact', 'index.html'), MRS)).toBe('/mrs/contact/');
  });
});

describe('languesHtml', () => {
  it('propose la même page dans chaque langue et marque la langue courante', () => {
    expect(languesHtml(join('contact', 'index.html'), EN)).toBe(
      '<nav class="langues" aria-label="Langue"><ul>' +
        '<li><a href="/contact/" lang="fr" hreflang="fr">Français</a></li>' +
        '<li><a href="/en/contact/" lang="en" hreflang="en" aria-current="true">English</a></li>' +
        '<li><a href="/mrs/contact/" lang="fr-FR-x-mrs" hreflang="fr-FR-x-mrs">Marseillais</a></li>' +
        '</ul></nav>',
    );
  });

  it('remplace le marqueur', () => {
    expect(injectLangues(`<p>${LANGUES_MARKER}</p>`, 'index.html', FR)).toBe(
      `<p>${languesHtml('index.html', FR)}</p>`,
    );
    expect(injectLangues('<p></p>', 'index.html', FR)).toBe('<p></p>');
  });
});

// Les pages et les scripts de construction, tels qu’ils sortent en français.
const ENV = Object.fromEntries([
  ...MENTIONS_FIELDS.map(([nom]) => [nom, 'valeur']),
  ['SIREN', '123456789'],
  ['CONTACT_EMAIL', 'valeur'],
  ['CONTACT_TELEPHONE', 'valeur'],
]);
const frenchPage = (file) =>
  injectCoordonnees(injectMentions(
    injectLangues(
      injectPartage(
        injectLogo(injectPreferences(injectSeo(readFileSync(file, 'utf8'), file, FR)), file, FR),
        file,
        FR,
      ),
      file,
      FR,
    ),
    ENV,
    FR,
  ), ENV, FR);
const pages = PAGES.map((file) => [file, frenchPage(file)]);
const allFrench = pages.map(([, html]) => html).join('\n');

// Noms des projets : les mêmes dans les trois langues (aussi dans le texte masqué des liens).
const NOMS_PROJETS = ['KoiKiManke', 'OnMangeQuoi', 'PlusUn', 'DansMaHotte', 'KesKeJeVoeux', 'Pokenini', 'MineCarte', 'Quine', 'Demo', 'Démo', 'MoreMobsHeadsChecklist'];

// Textes que les trois langues écrivent pareil.
const INVARIANT = new Set([
  ...NOMS_PROJETS,
  ...NOMS_PROJETS.map((nom) => ` ${nom}`),
  ...NOMS_PROJETS.map((nom) => `${nom} · douzeEnsemble`),
  'douzeEnsemble', 'Renaud', '×', '404', 'SIREN', 'valeur',
  'GitHub, Inc. (GitHub Pages)', '01', '02', '03', '04', '05', '06', '07', '08', '09',
  '123456789 · ', ' ↗', '↗', '← ', '→', 'dev',
  // Marque coupée en deux sur la carte de visite (douze<span>Ensemble</span>).
  'douze',
  'Français', 'English', 'Marseillais', 'www.douzeensemble.fr',
]);

// Texte des éléments (hors scripts et styles) d'une page, lu dans le DOM.
const textNodes = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const texts = [];
  const walk = (node) => {
    for (const child of node.childNodes) {
      if (child.nodeType === 3 && child.textContent.trim()) {
        texts.push(child.textContent);
      } else if (!['SCRIPT', 'STYLE'].includes(child.nodeName)) {
        walk(child);
      }
    }
  };
  walk(doc);
  return texts;
};

describe('dictionnaires', () => {
  it('ont les mêmes clés en anglais et en marseillais', () => {
    expect(Object.keys(TEXTES_MRS).sort()).toEqual(Object.keys(TEXTES_EN).sort());
  });

  it.each([
    ['anglais', TEXTES_EN],
    ['marseillais', TEXTES_MRS],
  ])('%s : chaque clé sert dans une page ou un script', (_nom, textes) => {
    const inutiles = Object.keys(textes).filter(
      (cle) => !allFrench.includes(cle.replace('etape-acteur">', '')),
    );
    expect(inutiles).toEqual([]);
  });
});

describe.each([['anglais', EN], ['marseillais', MRS]])('pages en %s', (_nom, langue) => {
  it.each(pages.filter(([file]) => file !== '404.html'))('%s : tous les textes sont traduits', (file, html) => {
    const traduite = translateHtml(html, langue);
    const manquants = textNodes(html).filter(
      (texte) =>
        !INVARIANT.has(texte) &&
        !Object.hasOwn(langue.textes, texte) &&
        !Object.hasOwn(langue.textes, `etape-acteur">${texte}`) &&
        !Object.keys(langue.textes).some((cle) => cle.includes('<') && cle.includes(texte)),
    );
    expect(manquants).toEqual([]);
    expect(traduite).toContain(`<html lang="${langue.htmlLang}">`);
    expect(traduite).not.toContain('"style.css"');
    expect(traduite).not.toContain('"js/');
  });

  it('la page d’accueil est traduite et garde ses liens relatifs', () => {
    const html = translateHtml(frenchPage('index.html'), langue);
    expect(html).toContain(`<title>${traduire('douzeEnsemble · Sites et applications sur mesure, Aix-en-Provence', langue)}</title>`);
    expect(html).toContain('<h1>douzeEnsemble</h1>');
    expect(html).toContain('href="prestations/"');
  });

  it('la carte de visite garde le nom de la marque et garde douzeEnsemble comme acteur du déroulé', () => {
    expect(translateHtml(frenchPage(join('carte', 'index.html')), langue)).toContain(
      '<p class="carte-marque">douze<span>Ensemble</span></p>',
    );
    expect(translateHtml(frenchPage(join('deroule', 'index.html')), langue)).toContain(
      '<span class="etape-acteur">douzeEnsemble</span>',
    );
  });
});

describe('anglais', () => {
  it('traduit la page de réalisations', () => {
    expect(translateHtml(frenchPage(REALISATIONS_PAGE), EN)).toContain('<h1>Projects</h1>');
  });
});
