import { expect, it, vi } from 'vitest';

it('anime la carte et active les boutons de contact au chargement', async () => {
  window.matchMedia = () => ({ matches: false });
  window.requestAnimationFrame = vi.fn();
  document.body.innerHTML = `
    <div class="carte-stage"><div class="carte-objet">
      <span class="carte-ombre"></span>
      <button data-contact="email">Afficher l’email</button>
      <span class="carte-reflet"></span><span class="carte-reflet"></span>
    </div></div>
    <button class="carte-retourner">Retourner</button>`;
  await import('../js/carte-main.js');
  expect(document.querySelectorAll('.carte-tranche')).toHaveLength(9);
  expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
  document.querySelector('[data-contact]').click();
  expect(document.querySelector('a').href).toBe(
    'mailto:contact@douzeensemble.fr',
  );
});
