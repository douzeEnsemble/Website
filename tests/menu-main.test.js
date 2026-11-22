import { expect, it } from 'vitest';

it('active le menu au chargement de la page', async () => {
  document.body.innerHTML = '<nav class="menu"><ul><li><a href="/">Accueil</a></li></ul></nav>';
  await import('../js/menu-main.js');
  expect(document.querySelector('.menu-bouton')).not.toBeNull();
});
