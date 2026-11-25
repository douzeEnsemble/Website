# CLAUDE.md

Site statique de présentation (www.douzeensemble.fr), servi par GitHub Pages. Pages HTML à la racine (`index.html`, `contact/`, `prestations/`, `realisations/`, `carte/`, `apropos/`, `404.html` en chemins absolus), style dans `style.css` (police des titres Bricolage Grotesque auto-hébergée dans `polices/` (licence OFL), couleurs en variables `light-dark()` qui suivent `color-scheme` : système ou choix du visiteur, échelle typographique `--t-*` en `clamp()`, la page défile normalement (pas de `main` à défilement interne), animations coupées sous `prefers-reduced-motion`), comportement en modules ES dans `js/`. Fichiers statiques publiés : `robots.txt`, `favicon.svg`, `apple-touch-icon.png`, `og.png` (aperçu 1200 × 630 des liens partagés).

## Commandes

- `npm run lint` : ESLint (`lint:js`), Stylelint (`lint:css`), html-validate (`lint:html`) et contrôle d'architecture dependency-cruiser (`lint:arch`).
- `npm test` : Vitest sous jsdom avec couverture (seuil 100 % sur `js/` et `scripts/`).
- `npm run test:mutation` : Stryker, seuil 100 %.
- `npm run build` : `scripts/build.js` génère `_site/` (fichiers publiés, pages traduites).
- `npm run test:e2e` : Playwright (axe-core, reflow à 320 px) contre le site construit `_site/`, servi par `python3 -m http.server` (CI-14) ; lancer `npm run build` avant. Le menu et la version, discrets par choix de design, sont exemptés du contraste (voir `e2e/a11y.spec.js`).
- Lancer un seul test : `npx vitest run tests/site.test.js -t "<nom du test>"`.

## Architecture

- `js/` : modules ES chargés par les pages (`main.js`, `contact-main.js`, `carte-main.js`, `partage-main.js` sont les points d'entrée) ; `site.js`, `carte.js` (rotation 3D de la carte de visite) et `partage.js` (fenêtre de partage) portent la logique.
- `scripts/partage.js` génère à la construction le QR code (SVG, dépendance `qrcode-generator`) et la fenêtre de partage de chaque page, aux marqueurs `<!--PARTAGE-->` et `<!--QR-ACCUEIL-->` des pages HTML ; son bouton se range en fin du groupe des préférences (marqueur `<!--PARTAGE-BOUTON-->` posé par `scripts/preferences.js`, vidé sur une page sans partage comme la 404).
- `scripts/couleurs.js` pose au build `data-page="<section>"` sur le `<body>` de chaque page (une couleur par section : prestations bleu, réalisations vert, à propos violet (avec points forts/faibles, déroulé, qui suis-je), contact rose, carte turquoise ; accueil et 404 gardent l'orange de la marque) ; `style.css` y redéfinit `--accent` et `--accent-texte` (avec une variante en contraste élevé). Une sous-page hérite de sa section ; une nouvelle section s'ajoute à `SECTIONS` et à `style.css`.
- `scripts/logo.js` pose au marqueur `<!--LOGO-->` (juste après `<!--PREFERENCES-->`, sur chaque page) le logo fixé en haut à gauche : le monogramme du favicon, lien vers l'accueil de la langue de la page.
- `scripts/preferences.js` génère au build, au marqueur `<!--PREFERENCES-->` (premier élément du `<body>` de chaque page, 404 comprise), le groupe de boutons thème Auto/Clair/Sombre + accessibilité + partage (bas à droite) et son dialogue (A11Y-11) ; `js/preferences.js` applique les choix (`data-theme`, `data-large-text`, `data-high-contrast`, `data-reduce-motion` sur `<html>`, lus par `style.css`) et les garde dans `localStorage`.
- `scripts/seo.js` remplit au build le marqueur `<!--SEO-->` de chaque page (description, adresse canonique, Open Graph, icônes) depuis la table `SEO`, dont le titre doit rester identique à la balise `<title>` de la page (vérifié par les tests), et écrit `sitemap.xml` (avec `lastmod` tiré du dernier commit de chaque page, `scripts/lastmod.js`) ; elle ajoute aussi le JSON-LD (WebSite sur l’accueil, fil d’Ariane ailleurs). Une nouvelle page s'ajoute à `SEO`, à `PAGES`, à `lint:html`, à `e2e/a11y.spec.js` et aux dictionnaires de langue.
- `scripts/langues.js` porte le multilingue : le français est la langue source des pages, `build-site.js` écrit chaque page en français (racine), en anglais (`en/`) et en marseillais (`mrs/`) en traduisant le HTML à partir des dictionnaires `scripts/textes-en.js` et `scripts/textes-mrs.js` (texte français exact → texte traduit ; une clé peut commencer après un guillemet pour viser un seul élément, voir `etape-acteur">Ensemble`). Un texte ajouté à une page doit l'être dans les deux dictionnaires, sinon `tests/langues.test.js` échoue (texte non traduit, clé inutile, clés différentes) ; les dictionnaires sont exclus de la mutation (données). Les chaînes assemblées par les scripts passent par `traduire()`, celles que lit `js/` sont posées en `data-*` sur le HTML (`data-copie`, `data-label-*`), jamais écrites en dur dans `js/`. Le sélecteur de langue est au marqueur `<!--LANGUES-->` du pied de page ; la page 404 n'est pas traduite par les dictionnaires (GitHub Pages n'en sert qu'une) : elle est écrite en dur en français et en anglais (`lang` sur chaque bloc). `seo.js` écrit canonique, `hreflang` et plan du site par langue.
- `scripts/mentions.js` remplit au build le marqueur `<!--MENTIONS-->` de `apropos/` depuis les variables GitHub `SIREN` (9 chiffres, sinon omis), `RAISON_SOCIALE`, `FORME_JURIDIQUE`, `ADRESSE`, `DIRECTEUR_PUBLICATION` (variables du dépôt, pas des secrets : ces données sont publiques ; une variable vide masque sa ligne). Les valeurs sont échappées.
- `realisations/<nom>/index.html` : page de fonctionnalités d'une réalisation (texte français, captures `.webp` à côté, référencées en chemin absolu `/realisations/<nom>/x.webp` avec `width`/`height`), `<nom>` étant le nom du dépôt GitHub en minuscules. Une nouvelle page s'ajoute à `DETAILS` (`scripts/build-site.js`, d'où `PAGES`), à un lien « Détails et captures » dans la carte de `realisations/index.html`, à `SEO`, à `lint:html`, à `e2e/a11y.spec.js` et aux dictionnaires de langue. Les captures sont prises à la main sur l'application publiée (listes de démonstration), mobile 390 px ou bureau.
- `scripts/build-site.js` copie les fichiers publiés (`SITE_FILES`) et écrit les pages dans chaque langue ; la liste des réalisations est écrite en dur dans `realisations/index.html`, rangée par catégorie (un projet ajouté s'y écrit et se traduit dans les deux dictionnaires) ; `scripts/build.js` le lance.
- Détail des règles de dépendances : `doc/architecture.md`.

## Philosophie de test

Tout `js/` et `scripts/` est couvert à 100 % et muté à 100 % ; un mutant équivalent se traite en simplifiant le code, pas en baissant le seuil.

## CI/CD

- `ci.yml` : Linter, Tests unitaires + couverture, Mutation testing, Audit des dépendances, Build de production ; `codeql.yml` et `audit.yml` en complément.
- La mutation (un seul job) ne tourne que la nuit (2 h UTC) et en `workflow_dispatch` ; elle est sautée sur PR et push, le check requis passe donc sans elle (MUT-10). Si elle échoue la nuit, corriger dans la PR suivante (GIT-04). `build` garde `if: !failure() && !cancelled()` sans quoi il serait sauté avec elle.
- `pages.yml` déploie sur GitHub Pages quand la CI réussit sur `main`.
- Ruleset de `main` : `.github/rulesets/main.json`.

## Documentation, versioning and architecture rules

- `doc/` : `architecture.md` (règles de dépendances vérifiées), `codage.md` (conventions), `improvement.md` (backlog).
- Commits au format conventionnel (`type(portée): sujet`) ; hook : `git config core.hooksPath .githooks`. La version se déduit des commits (semantic-release, `release.yml`) : ne jamais éditer un numéro de version ni un changelog à la main.
- Audit (CI-13) : le niveau `high` complet passe par `.github/scripts/audit-check.mjs` ; un avis sans correctif se déclare dans `.github/audit-exceptions.json` (raison + expiration, 30 jours au plus), jamais en baissant le seuil.
- Version affichée (VER-09) : dernier tag `v*`, lu à la construction par `.github/scripts/app-version.mjs` (identique dans tous les dépôts, ne pas le modifier ici) ; `scripts/build-site.js` (`injectVersion`) remplace le marqueur du pied de page de chaque page publiée ; affichée en pied de page. Les workflows de build (`pages.yml`) font un checkout en `fetch-depth: 0`, sans quoi la page affiche `dev`. Avant de construire, ces workflows attendent la fin du run Release du commit (`.github/scripts/wait-release.sh`, droit `actions: read`) : sans cela, une CI courte déploie avant la création du tag. Les tests figent la valeur : jamais de dépendance aux tags git.
