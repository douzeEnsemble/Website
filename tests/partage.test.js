import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DARK_TEXT,
  DEFAULT_COLORS,
  LIGHT_TEXT,
  TRANSPARENT,
  init,
  ticketColors,
} from '../js/partage.js';

describe('ticketColors', () => {
  it('garde le fond de la page', () => {
    expect(ticketColors('rgb(1, 2, 3)').background).toBe('rgb(1, 2, 3)');
  });

  it('choisit un texte sombre sur un fond clair', () => {
    expect(ticketColors('rgb(255, 255, 255)').color).toBe(DARK_TEXT);
    expect(ticketColors('rgb(234, 203, 246)').color).toBe(DARK_TEXT);
    expect(ticketColors('rgb(0, 255, 0)').color).toBe(DARK_TEXT);
  });

  it('choisit un texte clair sur un fond sombre', () => {
    expect(ticketColors('rgb(0, 0, 0)').color).toBe(LIGHT_TEXT);
    expect(ticketColors('rgb(48, 20, 60)').color).toBe(LIGHT_TEXT);
    expect(ticketColors('rgb(255, 0, 0)').color).toBe(LIGHT_TEXT);
    expect(ticketColors('rgb(0, 0, 255)').color).toBe(LIGHT_TEXT);
  });

  it('bascule à la moitié de la luminosité', () => {
    expect(ticketColors('rgb(128, 128, 128)').color).toBe(DARK_TEXT);
    expect(ticketColors('rgb(127, 127, 127)').color).toBe(LIGHT_TEXT);
  });

  it('reste sombre sur la moitié exacte de la luminosité', () => {
    expect(ticketColors('rgb(127.5, 127.5, 127.5)').color).toBe(LIGHT_TEXT);
  });

  it('lit les décimales sur plusieurs chiffres', () => {
    expect(ticketColors('rgb(200.25, 200.25, 200.25)').color).toBe(DARK_TEXT);
  });

  it('fixe les deux couleurs de texte', () => {
    expect(DARK_TEXT).toBe('#05131d');
    expect(LIGHT_TEXT).toBe('#fff');
  });

  it('accepte une opacité et des composantes décimales', () => {
    expect(ticketColors('rgba(255, 255, 255, 0.5)').color).toBe(DARK_TEXT);
    expect(ticketColors('rgb(128.5, 128.5, 128.5)').color).toBe(DARK_TEXT);
  });

  it('revient au style sobre du site quand le fond est transparent ou inconnu', () => {
    expect(ticketColors(TRANSPARENT)).toBe(DEFAULT_COLORS);
    expect(ticketColors('')).toBe(DEFAULT_COLORS);
    expect(DEFAULT_COLORS).toEqual({ background: '#fff', color: '#05131d' });
  });
});

describe('init', () => {
  const URL = 'https://www.douzeensemble.fr/contact/';
  let nav;
  let win;

  const mount = ({ built = true } = {}) => {
    document.body.style.background = 'rgb(10, 20, 30)';
    document.body.innerHTML =
      (built
        ? `<button class="partage-ouvrir">Partager</button>
           <dialog class="partage">
             <input class="partage-url" value="${URL}">
             <button class="partage-copier">Copier</button>
             <button class="partage-partager" hidden>Partager</button>
             <p class="partage-etat">ancien</p>
           </dialog>`
        : '');
    document.title = 'Contact · douzeEnsemble';
    const dialog = document.querySelector('dialog');
    if (dialog) {
      dialog.showModal = vi.fn();
      dialog.close = vi.fn();
    }
    win = { getComputedStyle: window.getComputedStyle.bind(window), navigator: nav };
    init(win, document);
    return dialog;
  };
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
  const $ = (selector) => document.querySelector(selector);

  beforeEach(() => {
    nav = { clipboard: { writeText: vi.fn().mockResolvedValue() } };
  });

  afterEach(() => {
    document.body.removeAttribute('style');
    document.body.innerHTML = '';
  });

  it('ne fait rien sur une page sans bouton de partage', () => {
    expect(() => mount({ built: false })).not.toThrow();
  });

  it('ouvre la fenêtre aux couleurs de la page', () => {
    const dialog = mount();
    $('.partage-ouvrir').click();
    expect(dialog.showModal).toHaveBeenCalledTimes(1);
    expect(dialog.style.getPropertyValue('--partage-fond')).toBe(
      'rgb(10, 20, 30)',
    );
    expect(dialog.style.getPropertyValue('--partage-texte')).toBe('#fff');
    expect($('.partage-etat').textContent).toBe('');
  });

  it('prend le style sobre quand le fond est transparent', () => {
    const dialog = mount();
    document.body.style.background = 'transparent';
    $('.partage-ouvrir').click();
    expect(dialog.style.getPropertyValue('--partage-fond')).toBe('#fff');
    expect(dialog.style.getPropertyValue('--partage-texte')).toBe('#05131d');
  });

  it('se ferme au clic sur le fond, pas sur le contenu', () => {
    const dialog = mount();
    $('.partage-url').click();
    expect(dialog.close).not.toHaveBeenCalled();
    dialog.click();
    expect(dialog.close).toHaveBeenCalledTimes(1);
  });

  it('sélectionne le lien quand il prend le focus', () => {
    mount();
    const input = $('.partage-url');
    const select = vi.spyOn(input, 'select');
    input.dispatchEvent(new FocusEvent('focus'));
    expect(select).toHaveBeenCalledTimes(1);
  });

  it('copie le lien et le dit', async () => {
    mount();
    $('.partage-copier').click();
    await flush();
    expect(nav.clipboard.writeText).toHaveBeenCalledWith(URL);
    expect($('.partage-etat').textContent).toBe('Lien copié.');
  });

  it('sélectionne le lien quand la copie est refusée', async () => {
    nav.clipboard.writeText.mockRejectedValue(new Error('refusé'));
    mount();
    const select = vi.spyOn($('.partage-url'), 'select');
    $('.partage-copier').click();
    await flush();
    expect(select).toHaveBeenCalledTimes(1);
    expect($('.partage-etat').textContent).toBe(
      'Lien sélectionné : copiez-le avec Ctrl+C.',
    );
  });

  it('sélectionne le lien quand le presse-papiers n’existe pas', async () => {
    nav = {};
    mount();
    $('.partage-copier').click();
    await flush();
    expect($('.partage-etat').textContent).toMatch(/^Lien sélectionné/);
  });

  it('garde le bouton Partager caché sans partage natif', () => {
    mount();
    expect($('.partage-partager').hidden).toBe(true);
  });

  describe('avec le partage natif', () => {
    beforeEach(() => {
      nav.share = vi.fn().mockResolvedValue();
    });

    it('affiche le bouton Partager', () => {
      mount();
      expect($('.partage-partager').hidden).toBe(false);
    });

    it('partage le titre et l’adresse de la page', async () => {
      mount();
      $('.partage-partager').click();
      await flush();
      expect(nav.share).toHaveBeenCalledWith({
        title: 'Contact · douzeEnsemble',
        url: URL,
      });
      expect($('.partage-etat').textContent).toBe('ancien');
    });

    it('ne dit rien quand l’utilisateur annule', async () => {
      nav.share.mockRejectedValue(
        Object.assign(new Error('annulé'), { name: 'AbortError' }),
      );
      mount();
      $('.partage-partager').click();
      await flush();
      expect($('.partage-etat').textContent).toBe('ancien');
    });

    it('signale un échec du partage', async () => {
      nav.share.mockRejectedValue(new Error('boom'));
      mount();
      $('.partage-partager').click();
      await flush();
      expect($('.partage-etat').textContent).toBe(
        'Le partage a échoué : copiez le lien.',
      );
    });
  });
});
