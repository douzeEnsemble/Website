import { expect, it, vi } from 'vitest';
import { preferencesHtml } from '../scripts/preferences.js';

it('active les préférences d’affichage au chargement de la page', async () => {
  document.body.innerHTML = preferencesHtml();
  const dialog = document.querySelector('dialog');
  dialog.showModal = vi.fn();
  await import('../js/preferences-main.js');
  document.querySelector('.preferences-accessibilite').click();
  expect(dialog.showModal).toHaveBeenCalledTimes(1);
});
