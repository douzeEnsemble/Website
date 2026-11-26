import { expect, it, vi } from 'vitest';

it('anime la carte au chargement', async () => {
  window.matchMedia = () => ({ matches: false });
  window.requestAnimationFrame = vi.fn();
  document.body.innerHTML = `
    <div class="carte-stage"><div class="carte-objet">
      <span class="carte-ombre"></span>
      <span class="carte-reflet"></span><span class="carte-reflet"></span>
    </div></div>
    <button class="carte-retourner">Retourner</button>`;
  await import('../js/carte-main.js');
  expect(document.querySelectorAll('.carte-tranche')).toHaveLength(9);
  expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
});
