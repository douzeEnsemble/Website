import { expect, it } from 'vitest';
import { KONAMI } from '../js/site.js';

it('initialise la page au chargement', async () => {
  document.body.innerHTML = '<h1>douzeEnsemble</h1>';
  await import('../js/main.js');
  expect(document.body.getAttribute('style')).toBeNull();
  KONAMI.forEach((key) =>
    document.dispatchEvent(new KeyboardEvent('keydown', { key })),
  );
  expect(document.body.classList.contains('awesome')).toBe(true);
});
