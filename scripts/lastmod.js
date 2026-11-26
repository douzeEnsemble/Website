import { execFileSync } from 'node:child_process';

// Date (AAAA-MM-JJ) du dernier commit qui a touché `file`, pour le plan du
// site ; `undefined` hors dépôt git ou pour un fichier sans historique.
export function lastModified(file, run = execFileSync) {
  try {
    const date = String(
      run('git', ['log', '-1', '--format=%cs', '--', file], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }),
    ).trim();
    return date || undefined;
  } catch {
    // hors dépôt git : pas de date
  }
}
