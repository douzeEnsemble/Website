import { expect, it, vi } from 'vitest';

it('active la fenêtre de partage au chargement de la page', async () => {
  document.body.innerHTML = `<h1>Titre</h1>
    <button class="partage-ouvrir">Partager</button>
    <dialog class="partage">
      <input class="partage-url" value="https://www.douzeensemble.fr/">
      <button class="partage-copier">Copier</button>
      <button class="partage-partager" hidden>Partager</button>
      <p class="partage-etat"></p>
    </dialog>`;
  const dialog = document.querySelector('dialog');
  dialog.showModal = vi.fn();
  await import('../js/partage-main.js');
  document.querySelector('.partage-ouvrir').click();
  expect(dialog.showModal).toHaveBeenCalledTimes(1);
});
