// Carte de visite en 3D : la logique de rotation est pure (testée à l'exacte
// valeur), la coque `init` ne fait que relier le DOM et les événements.
export const DRAG_FACTOR = 0.6;
export const FLING_MIN = 0.4;
export const FLING_FRICTION = 0.965;
export const SETTLE_RATE = 0.1;
export const TILT_RATE = 0.12;
export const TILT_MAX = 30;
export const SHEEN_SHIFT = 35;
export const ARROW_KICK = 9;
export const CLICK_MAX_MOVE = 5;
export const THICKNESS = 4;

// Angle (multiple de 180°) de la face la plus proche : le recto ou le verso.
export function nearestFace(ry) {
  return Math.round(ry / 180) * 180;
}

// Face visée par un retournement : l'autre face que celle la plus proche.
export function flipFace(ry) {
  return nearestFace(ry) + 180;
}

// Un pas d'animation : la carte lancée glisse en ralentissant puis, quand elle
// est presque arrêtée, se cale sur sa face.
export function stepSpin({ ry, vy, face }) {
  if (Math.abs(vy) > FLING_MIN) {
    const next = ry + vy;
    return { ry: next, vy: vy * FLING_FRICTION, face: nearestFace(next) };
  }
  return { ry: ry + (face - ry) * SETTLE_RATE, vy: 0, face };
}

// Rotation et vitesse données par un déplacement de `dx` pixels en `dt` ms.
export function dragSpin(dx, dt) {
  const angle = dx * DRAG_FACTOR;
  return { angle, vy: (angle / Math.max(1, dt)) * 16 };
}

// Inclinaison verticale : le haut de la carte recule quand le pointeur monte.
export function tiltFor(py) {
  return -(py - 0.5) * TILT_MAX;
}

// Position du reflet en % : suit le pointeur, décalée par l'angle de la carte.
export function sheenPosition(px, py, ry) {
  const x = px * 100 + Math.sin((ry * Math.PI) / 180) * SHEEN_SHIFT;
  return { x: Math.min(100, Math.max(0, x)), y: py * 100 };
}

export function cardTransform(rx, ry) {
  return `rotateX(${rx}deg) rotateY(${ry}deg)`;
}

// L'ombre reste au sol : elle annule la rotation et s'amincit de chant.
export function shadowTransform(rx, ry) {
  const scale = 0.35 + 0.65 * Math.abs(Math.cos((ry * Math.PI) / 180));
  return `rotateX(${-rx}deg) rotateY(${-ry}deg) translateZ(-60px) scaleX(${scale})`;
}

export function init(win, doc) {
  const stage = doc.querySelector('.carte-stage');
  const card = doc.querySelector('.carte-objet');
  const shadow = doc.querySelector('.carte-ombre');
  const [rectoSheen, versoSheen] = doc.querySelectorAll('.carte-reflet');
  const reduceMotion = win.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Tranche : des couches fines empilées de -THICKNESS à +THICKNESS px.
  for (let z = -THICKNESS; z <= THICKNESS; z += 1) {
    const slice = doc.createElement('span');
    slice.className = 'carte-tranche';
    slice.style.transform = `translateZ(${z}px)`;
    card.prepend(slice);
  }

  const s = {
    ry: 0, rx: 0, trx: 0, vy: 0, face: 0,
    px: 0.5, py: 0.3,
    drag: false, moved: 0, lastX: 0, lastT: 0,
  };

  const flip = () => {
    s.vy = 0;
    s.face = flipFace(s.ry);
    if (reduceMotion) {
      s.ry = s.face;
    }
  };

  const paint = () => {
    card.style.transform = cardTransform(s.rx, s.ry);
    shadow.style.transform = shadowTransform(s.rx, s.ry);
    const { x, y } = sheenPosition(s.px, s.py, s.ry);
    rectoSheen.style.setProperty('--gx', `${x}%`);
    rectoSheen.style.setProperty('--gy', `${y}%`);
    versoSheen.style.setProperty('--gx', `${100 - x}%`);
    versoSheen.style.setProperty('--gy', `${y}%`);
  };

  const frame = () => {
    if (!s.drag) {
      Object.assign(s, stepSpin(s));
    }
    s.rx += (s.trx - s.rx) * TILT_RATE;
    paint();
    win.requestAnimationFrame(frame);
  };

  const track = (event) => {
    const rect = stage.getBoundingClientRect();
    s.px = (event.clientX - rect.left) / rect.width;
    s.py = (event.clientY - rect.top) / rect.height;
    s.trx = tiltFor(s.py);
  };

  stage.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button, a')) {
      return;
    }
    s.drag = true;
    s.moved = 0;
    s.vy = 0;
    s.lastX = event.clientX;
    s.lastT = win.performance.now();
    stage.setPointerCapture(event.pointerId);
  });

  stage.addEventListener('pointermove', (event) => {
    track(event);
    if (!s.drag) {
      return;
    }
    const now = win.performance.now();
    const { angle, vy } = dragSpin(event.clientX - s.lastX, now - s.lastT);
    s.moved += Math.abs(event.clientX - s.lastX);
    s.ry += angle;
    s.vy = vy;
    s.lastX = event.clientX;
    s.lastT = now;
  });

  const release = () => {
    if (!s.drag) {
      return;
    }
    s.drag = false;
    if (s.moved < CLICK_MAX_MOVE) {
      flip();
    }
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);

  stage.addEventListener('pointerleave', () => {
    if (!s.drag) {
      s.trx = 0;
      s.px = 0.5;
      s.py = 0.3;
    }
  });

  stage.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      flip();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      s.vy += event.key === 'ArrowRight' ? ARROW_KICK : -ARROW_KICK;
    }
  });

  doc.querySelector('.carte-retourner').addEventListener('click', flip);
  frame();
}
