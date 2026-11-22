import { beforeEach, describe, expect, it } from 'vitest';
import { init } from '../js/menu.js';

const bouton = () => document.querySelector('.menu-bouton');
const ouvert = () => bouton().getAttribute('aria-expanded');
const echap = () =>
  document.querySelector('.menu a').dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  );

describe('menu des petits écrans', () => {
  beforeEach(() => {
    document.body.innerHTML = `<nav class="menu"><ul>
      <li><a href="/">Accueil</a></li></ul></nav>`;
    init(document);
  });

  it('ajoute un bouton fermé, relié à la liste, avant la liste', () => {
    expect(bouton().tagName).toBe('BUTTON');
    expect(bouton().type).toBe('button');
    expect(bouton().textContent).toBe('Menu');
    expect(bouton().getAttribute('aria-controls')).toBe('menu-liens');
    expect(document.querySelector('ul').id).toBe('menu-liens');
    expect(ouvert()).toBe('false');
    expect(document.querySelector('.menu').firstElementChild).toBe(bouton());
  });

  it('ouvre puis referme la liste au clic', () => {
    bouton().click();
    expect(ouvert()).toBe('true');
    bouton().click();
    expect(ouvert()).toBe('false');
  });

  it('referme avec Échap et rend le focus au bouton', () => {
    bouton().click();
    echap();
    expect(ouvert()).toBe('false');
    expect(document.activeElement).toBe(bouton());
  });

  it('ignore Échap quand la liste est fermée et les autres touches', () => {
    echap();
    expect(ouvert()).toBe('false');
    expect(document.activeElement).not.toBe(bouton());
    bouton().click();
    document.querySelector('.menu a').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'a', bubbles: true }),
    );
    expect(ouvert()).toBe('true');
  });
});
