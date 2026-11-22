// Menu des petits écrans : un bouton « Menu » ouvre et ferme la liste des
// pages. Le bouton est créé ici (sans script, la liste reste visible) ; la
// feuille de style le masque et garde la liste affichée sur grand écran.
const LISTE_ID = 'menu-liens';

export function init(doc) {
  const menu = doc.querySelector('.menu');
  const liste = menu.querySelector('ul');
  liste.id = LISTE_ID;

  const bouton = doc.createElement('button');
  bouton.type = 'button';
  bouton.className = 'menu-bouton';
  bouton.textContent = 'Menu';
  bouton.setAttribute('aria-controls', LISTE_ID);
  bouton.setAttribute('aria-expanded', 'false');
  menu.prepend(bouton);

  const basculer = (ouvert) => bouton.setAttribute('aria-expanded', String(ouvert));

  bouton.addEventListener('click', () => {
    basculer(bouton.getAttribute('aria-expanded') !== 'true');
  });

  // Échap referme la liste et rend le focus au bouton.
  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && bouton.getAttribute('aria-expanded') === 'true') {
      basculer(false);
      bouton.focus();
    }
  });
}
