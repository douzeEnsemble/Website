# CLAUDE.md

Site statique de présentation (www.douzeensemble.fr), servi par GitHub Pages. Pages HTML à la racine (`index.html`, `contact/`, `prestations/`, `realisations/`), style dans `style.css`, comportement en modules ES dans `js/`.

## Commandes

- `npm run lint` : ESLint (`lint:js`), Stylelint (`lint:css`), html-validate (`lint:html`) et contrôle d'architecture dependency-cruiser (`lint:arch`).
- `npm test` : Vitest sous jsdom avec couverture (seuil 100 % sur `js/` et `scripts/`).
- `npm run test:mutation` : Stryker, seuil 100 %.
- `npm run build` : `scripts/build.js` génère `_site/` (fichiers publiés + liste des réalisations).
- `npm run test:e2e` : Playwright (axe-core, reflow à 320 px) contre le site construit `_site/`, servi par `python3 -m http.server` (CI-14) ; lancer `GITHUB_TOKEN=$(gh auth token) npm run build` avant. Le menu et la version, discrets par choix de design, sont exemptés du contraste (voir `e2e/a11y.spec.js`).
- Lancer un seul test : `npx vitest run tests/site.test.js -t "<nom du test>"`.

## Architecture

- `js/` : modules ES chargés par les pages (`main.js`, `contact-main.js` sont les points d'entrée) ; `site.js` et `realisations.js` portent la logique.
- `scripts/build-site.js` copie les fichiers publiés (`SITE_FILES`) et injecte les réalisations récupérées via l'API GitHub au moment du build ; `scripts/build.js` le lance.
- Détail des règles de dépendances : `doc/architecture.md`.

## Philosophie de test

Tout `js/` et `scripts/` est couvert à 100 % et muté à 100 % ; un mutant équivalent se traite en simplifiant le code, pas en baissant le seuil.

## CI/CD

- `ci.yml` : Linter, Tests unitaires + couverture, Mutation testing, Audit des dépendances, Build de production ; `codeql.yml` et `audit.yml` en complément.
- La mutation (un seul job) ne tourne que la nuit (2 h UTC) et en `workflow_dispatch` ; elle est sautée sur PR et push, le check requis passe donc sans elle (MUT-10). Si elle échoue la nuit, corriger dans la PR suivante (GIT-04). `build` garde `if: !failure() && !cancelled()` sans quoi il serait sauté avec elle.
- `pages.yml` déploie sur GitHub Pages quand la CI réussit sur `main`, et chaque jour (les réalisations viennent de l'API GitHub).
- Ruleset de `main` : `.github/rulesets/main.json`.

## Documentation, versioning and architecture rules

- `doc/` : `architecture.md` (règles de dépendances vérifiées), `codage.md` (conventions), `improvement.md` (backlog).
- Commits au format conventionnel (`type(portée): sujet`) ; hook : `git config core.hooksPath .githooks`. La version se déduit des commits (semantic-release, `release.yml`) : ne jamais éditer un numéro de version ni un changelog à la main.
- Audit (CI-13) : le niveau `high` complet passe par `.github/scripts/audit-check.mjs` ; un avis sans correctif se déclare dans `.github/audit-exceptions.json` (raison + expiration, 30 jours au plus), jamais en baissant le seuil.
- Version affichée (VER-09) : dernier tag `v*`, lu à la construction par `.github/scripts/app-version.mjs` (identique dans tous les dépôts, ne pas le modifier ici) ; `scripts/build-site.js` (`injectVersion`) remplace le marqueur du pied de page de chaque page publiée ; affichée en pied de page. Les workflows de build (`pages.yml`) font un checkout en `fetch-depth: 0`, sans quoi la page affiche `dev`. Avant de construire, ces workflows attendent la fin du run Release du commit (`.github/scripts/wait-release.sh`, droit `actions: read`) : sans cela, une CI courte déploie avant la création du tag. Les tests figent la valeur : jamais de dépendance aux tags git.
