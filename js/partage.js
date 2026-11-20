// Fenêtre de partage : le QR code et le lien sont écrits à la construction
// (scripts/partage.js) ; ici, seulement l'ouverture, la copie et le partage.
export const DEFAULT_COLORS = { background: '#fff', color: '#05131d' };
export const TRANSPARENT = 'rgba(0, 0, 0, 0)';
export const DARK_TEXT = '#05131d';
export const LIGHT_TEXT = '#fff';

// Couleurs du ticket : le fond de la page, avec un texte sombre ou clair choisi
// pour rester lisible (la couleur du titre, aléatoire, peut être trop proche
// du fond). Style sobre du site quand le fond est transparent (dégradé du
// Konami code) ou illisible pour le script.
export function ticketColors(background) {
  const channels = background.match(/\d+(\.\d+)?/g);
  if (background === TRANSPARENT || !channels) {
    return DEFAULT_COLORS;
  }
  const [red, green, blue] = channels.map(Number);
  const luma = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return { background, color: luma > 0.5 ? DARK_TEXT : LIGHT_TEXT };
}

export function init(win, doc) {
  const open = doc.querySelector('.partage-ouvrir');
  if (!open) {
    return;
  }
  const dialog = doc.querySelector('.partage');
  const input = dialog.querySelector('.partage-url');
  const status = dialog.querySelector('.partage-etat');
  const share = dialog.querySelector('.partage-partager');

  open.addEventListener('click', () => {
    const { background, color } = ticketColors(
      win.getComputedStyle(doc.body).backgroundColor,
    );
    dialog.style.setProperty('--partage-fond', background);
    dialog.style.setProperty('--partage-texte', color);
    status.textContent = '';
    dialog.showModal();
  });

  // Le contenu couvre tout le ticket : un clic sur le dialog lui-même est un
  // clic sur le fond assombri.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  input.addEventListener('focus', () => input.select());

  dialog.querySelector('.partage-copier').addEventListener('click', async () => {
    try {
      await win.navigator.clipboard.writeText(input.value);
      status.textContent = 'Lien copié.';
    } catch {
      input.select();
      status.textContent = 'Lien sélectionné : copiez-le avec Ctrl+C.';
    }
  });

  if (win.navigator.share) {
    share.hidden = false;
    share.addEventListener('click', async () => {
      try {
        await win.navigator.share({ title: doc.title, url: input.value });
      } catch (error) {
        if (error.name !== 'AbortError') {
          status.textContent = 'Le partage a échoué : copiez le lien.';
        }
      }
    });
  }
}
