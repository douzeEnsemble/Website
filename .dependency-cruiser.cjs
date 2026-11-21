/** @type {import('dependency-cruiser').IConfiguration} */
// Règles d'architecture exécutables (ARCH-01…03). Adapter les dossiers au projet ;
// retirer les règles dont le dossier n'existe pas. Lancé par `npm run lint` (ARCH-02).
// Un helper de test importé seulement par un alias Vitest se déclare dans `pathNot` de no-orphans, avec sa raison.
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      comment: "Un cycle empêche de raisonner sur un module isolé et fausse la mutation ciblée (MUT-04).",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      comment: "Un fichier que rien n'importe est du code mort : le supprimer (COV-05).",
      severity: "error",
      // Exceptions : js/main.js, js/contact-main.js, js/carte-main.js, js/partage-main.js et js/preferences-main.js sont chargés par les balises <script type="module"> des pages HTML ; scripts/build.js est lancé par `npm run build`.
      from: { orphan: true, pathNot: ["\\.d\\.ts$", "(^|/)\\.[^/]+\\.(js|cjs|mjs|ts)$", "\\.config\\.(js|cjs|mjs|ts)$", "^js/(main|contact-main|carte-main|partage-main|preferences-main)\\.js$", "^scripts/build\\.js$"] },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
  },
};
