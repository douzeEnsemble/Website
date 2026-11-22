# Architecture

La description des couches (rôle de chaque dossier, flux de requêtes, ce qui est pur et ce qui est coque) est dans `CLAUDE.md`, section *Architecture*. Ce fichier garde ce qui s'**exécute** : les règles d'architecture vérifiées à chaque `npm run lint`.

## Règles vérifiées (`.dependency-cruiser.cjs`)

Dossiers analysés : `js/`, `scripts/`.

| Règle | Raison |
|---|---|
| `no-circular` | Un cycle empêche de raisonner sur un module isolé et fausse la mutation ciblée (MUT-04). |
| `no-orphans` | Un fichier que rien n'importe est du code mort : le supprimer (COV-05). |

Une exception se documente à côté de la règle (`pathNot` + raison), jamais par un assouplissement global.

## Pièges

- `js/main.js`, `js/contact-main.js`, `js/carte-main.js`, `js/partage-main.js`, `js/menu-main.js` et `js/preferences-main.js` sont les points d'entrée chargés par les pages HTML : ils sont déclarés comme exceptions de `no-orphans`, jamais supprimés par erreur.
