import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ARROW_KICK,
  cardTransform,
  dragSpin,
  flipFace,
  init,
  nearestFace,
  sheenPosition,
  shadowTransform,
  stepSpin,
  tiltFor,
} from '../js/carte.js';

describe('nearestFace', () => {
  it('arrondit au multiple de 180° le plus proche', () => {
    expect(nearestFace(0)).toBe(0);
    expect(nearestFace(89)).toBe(0);
    expect(nearestFace(91)).toBe(180);
    expect(nearestFace(-100)).toBe(-180);
    expect(nearestFace(300)).toBe(360);
  });
});

describe('flipFace', () => {
  it('vise la face opposée à la plus proche', () => {
    expect(flipFace(10)).toBe(180);
    expect(flipFace(170)).toBe(360);
    expect(flipFace(-170)).toBe(0);
  });
});

describe('stepSpin', () => {
  it('fait glisser la carte lancée en ralentissant', () => {
    const next = stepSpin({ ry: 100, vy: 10, face: 0 });
    expect(next.ry).toBe(110);
    expect(next.vy).toBeCloseTo(9.65);
    expect(next.face).toBe(180);
  });

  it('glisse aussi dans le sens négatif', () => {
    expect(stepSpin({ ry: 0, vy: -10, face: 0 })).toEqual({
      ry: -10,
      vy: -9.65,
      face: -0,
    });
  });

  it('se cale sur sa face quand elle est presque arrêtée', () => {
    expect(stepSpin({ ry: 100, vy: 0.4, face: 180 })).toEqual({
      ry: 108,
      vy: 0,
      face: 180,
    });
  });

  it('continue de glisser juste au-dessus du seuil', () => {
    expect(stepSpin({ ry: 0, vy: 0.41, face: 0 }).ry).toBe(0.41);
  });
});

describe('dragSpin', () => {
  it('convertit un déplacement en angle et en vitesse', () => {
    const { angle, vy } = dragSpin(10, 32);
    expect(angle).toBe(6);
    expect(vy).toBe(3);
  });

  it('borne la durée à 1 ms', () => {
    expect(dragSpin(10, 0).vy).toBe(96);
    expect(dragSpin(10, -5).vy).toBe(96);
  });
});

describe('tiltFor', () => {
  it('penche la carte selon la hauteur du pointeur', () => {
    expect(tiltFor(0.5)).toBe(-0);
    expect(tiltFor(0)).toBe(15);
    expect(tiltFor(1)).toBe(-15);
  });
});

describe('sheenPosition', () => {
  it('suit le pointeur', () => {
    expect(sheenPosition(0.5, 0.25, 0)).toEqual({ x: 50, y: 25 });
  });

  it('se décale avec l’angle de la carte', () => {
    expect(sheenPosition(0.5, 0.5, 90).x).toBeCloseTo(85);
    expect(sheenPosition(0.5, 0.5, -90).x).toBeCloseTo(15);
  });

  it('reste dans la carte', () => {
    expect(sheenPosition(1, 0.5, 90).x).toBe(100);
    expect(sheenPosition(0, 0.5, -90).x).toBe(0);
  });
});

describe('transforms', () => {
  it('compose la rotation de la carte', () => {
    expect(cardTransform(3, 40)).toBe('rotateX(3deg) rotateY(40deg)');
  });

  it('garde l’ombre au sol, pleine de face et fine de chant', () => {
    expect(shadowTransform(3, 0)).toBe(
      'rotateX(-3deg) rotateY(0deg) translateZ(-60px) scaleX(1)',
    );
    expect(shadowTransform(0, 90)).toBe(
      'rotateX(0deg) rotateY(-90deg) translateZ(-60px) scaleX(0.35000000000000003)',
    );
    expect(shadowTransform(0, 180)).toMatch(/scaleX\(1\)$/);
  });
});

describe('init', () => {
  let frames;
  let now;
  const win = () => ({
    matchMedia: (query) => ({
      matches: reduce && query === '(prefers-reduced-motion: reduce)',
    }),
    performance: { now: () => now },
    requestAnimationFrame: (cb) => frames.push(cb),
  });
  let reduce;

  const pointer = (type, init = {}) =>
    new MouseEvent(type, { bubbles: true, cancelable: true, ...init });
  const stage = () => document.querySelector('.carte-stage');
  const card = () => document.querySelector('.carte-objet');
  const tick = (n = 1) => {
    for (let i = 0; i < n; i += 1) {
      frames.shift()();
    }
  };
  const rotation = () =>
    Number(/rotateY\((.*?)deg\)/.exec(card().style.transform)[1]);

  const mount = () => {
    frames = [];
    document.body.innerHTML = `
      <div class="carte-stage"><div class="carte-objet">
        <span class="carte-ombre"></span>
        <div class="carte-recto"><button>b</button><a href="#x">a</a><span class="carte-reflet"></span></div>
        <div class="carte-verso"><span class="carte-reflet"></span></div>
      </div></div>
      <button class="carte-retourner">Retourner</button>`;
    stage().setPointerCapture = vi.fn();
    stage().getBoundingClientRect = () => ({
      left: 100,
      top: 50,
      width: 200,
      height: 100,
    });
    init(win(), document);
  };

  beforeEach(() => {
    reduce = false;
    now = 0;
    mount();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('ajoute neuf couches de tranche, de -4 à +4 px', () => {
    const slices = [...document.querySelectorAll('.carte-tranche')];
    expect(slices).toHaveLength(9);
    expect(slices.map((s) => s.style.transform)).toEqual(
      [4, 3, 2, 1, 0, -1, -2, -3, -4].map((z) => `translateZ(${z}px)`),
    );
    expect(card().firstElementChild).toBe(slices[0]);
  });

  it('peint la carte à plat au départ et relance l’animation', () => {
    expect(frames).toHaveLength(1);
    tick();
    expect(card().style.transform).toBe('rotateX(0deg) rotateY(0deg)');
    expect(document.querySelector('.carte-ombre').style.transform).toBe(
      'rotateX(0deg) rotateY(0deg) translateZ(-60px) scaleX(1)',
    );
    const [recto, verso] = document.querySelectorAll('.carte-reflet');
    expect(recto.style.getPropertyValue('--gx')).toBe('50%');
    expect(recto.style.getPropertyValue('--gy')).toBe('30%');
    expect(verso.style.getPropertyValue('--gx')).toBe('50%');
    expect(verso.style.getPropertyValue('--gy')).toBe('30%');
    expect(frames).toHaveLength(1);
  });

  it('incline la carte et déplace le reflet au survol', () => {
    stage().dispatchEvent(pointer('pointermove', { clientX: 150, clientY: 75 }));
    tick(200);
    const [recto, verso] = document.querySelectorAll('.carte-reflet');
    expect(recto.style.getPropertyValue('--gx')).toBe('25%');
    expect(recto.style.getPropertyValue('--gy')).toBe('25%');
    expect(verso.style.getPropertyValue('--gx')).toBe('75%');
    expect(verso.style.getPropertyValue('--gy')).toBe('25%');
    expect(card().style.transform).toMatch(/^rotateX\(7\.5/);
  });

  it('remet la carte à plat quand le pointeur sort', () => {
    stage().dispatchEvent(pointer('pointermove', { clientX: 150, clientY: 75 }));
    tick(200);
    stage().dispatchEvent(pointer('pointerleave'));
    tick(200);
    expect(Number(/rotateX\((.*?)deg\)/.exec(card().style.transform)[1])).toBeCloseTo(0, 3);
    const [recto] = document.querySelectorAll('.carte-reflet');
    expect(recto.style.getPropertyValue('--gx')).toBe('50%');
    expect(recto.style.getPropertyValue('--gy')).toBe('30%');
  });

  it('garde l’inclinaison quand le pointeur sort pendant un glissé', () => {
    stage().dispatchEvent(pointer('pointerdown', { clientX: 150 }));
    stage().dispatchEvent(pointer('pointermove', { clientX: 150, clientY: 75 }));
    stage().dispatchEvent(pointer('pointerleave'));
    tick(200);
    expect(card().style.transform).toMatch(/^rotateX\(7\.5/);
  });

  it('fait tourner la carte sous le doigt et mémorise le pointeur', () => {
    now = 0;
    stage().dispatchEvent(pointer('pointerdown', { clientX: 100 }));
    expect(stage().setPointerCapture).toHaveBeenCalledTimes(1);
    now = 16;
    stage().dispatchEvent(pointer('pointermove', { clientX: 110, clientY: 50 }));
    tick();
    expect(rotation()).toBe(6);
  });

  it('mesure la vitesse sur la durée écoulée depuis le dernier mouvement', () => {
    now = 100;
    stage().dispatchEvent(pointer('pointerdown', { clientX: 100 }));
    now = 132;
    stage().dispatchEvent(pointer('pointermove', { clientX: 110, clientY: 50 }));
    stage().dispatchEvent(pointer('pointerup'));
    tick();
    expect(rotation()).toBe(9);
  });

  it('lance la carte au relâchement puis la cale sur une face', () => {
    stage().dispatchEvent(pointer('pointerdown', { clientX: 100 }));
    now = 16;
    stage().dispatchEvent(pointer('pointermove', { clientX: 200, clientY: 50 }));
    stage().dispatchEvent(pointer('pointerup'));
    tick();
    const first = rotation();
    expect(first).toBe(120);
    tick();
    expect(rotation()).toBeGreaterThan(first);
    tick(2000);
    expect(rotation()).toBeCloseTo(1800, 3);
  });

  it('ne compte pas un déplacement de moins de 5 px comme un glissé', () => {
    stage().dispatchEvent(pointer('pointerdown', { clientX: 100 }));
    now = 16;
    stage().dispatchEvent(pointer('pointermove', { clientX: 102, clientY: 50 }));
    stage().dispatchEvent(pointer('pointermove', { clientX: 104, clientY: 50 }));
    stage().dispatchEvent(pointer('pointerup'));
    tick(2000);
    expect(rotation()).toBeCloseTo(180, 3);
  });

  it('traite 5 px de déplacement comme un glissé', () => {
    stage().dispatchEvent(pointer('pointerdown', { clientX: 100 }));
    now = 16;
    stage().dispatchEvent(pointer('pointermove', { clientX: 105, clientY: 50 }));
    stage().dispatchEvent(pointer('pointerup'));
    tick(2000);
    expect(rotation()).toBeCloseTo(0, 3);
  });

  it('retourne la carte au clic', () => {
    stage().dispatchEvent(pointer('pointerdown', { clientX: 100 }));
    stage().dispatchEvent(pointer('pointerup'));
    tick(2000);
    expect(rotation()).toBeCloseTo(180, 3);
    stage().dispatchEvent(pointer('pointerdown', { clientX: 100 }));
    stage().dispatchEvent(pointer('pointercancel'));
    tick(2000);
    expect(rotation()).toBeCloseTo(360, 3);
  });

  it('ignore un relâchement sans appui', () => {
    stage().dispatchEvent(pointer('pointerup'));
    tick(2000);
    expect(rotation()).toBe(0);
  });

  it('ignore les appuis sur les boutons et les liens', () => {
    for (const el of document.querySelectorAll('.carte-stage button, .carte-stage a')) {
      el.dispatchEvent(pointer('pointerdown', { clientX: 100 }));
      el.dispatchEvent(pointer('pointerup'));
    }
    tick(2000);
    expect(rotation()).toBe(0);
    expect(stage().setPointerCapture).not.toHaveBeenCalled();
  });

  it('ne tourne pas sans appui', () => {
    stage().dispatchEvent(pointer('pointermove', { clientX: 300, clientY: 50 }));
    tick(5);
    expect(rotation()).toBe(0);
  });

  it('suspend le calage pendant le glissé', () => {
    stage().dispatchEvent(pointer('pointerdown', { clientX: 100 }));
    now = 16;
    stage().dispatchEvent(pointer('pointermove', { clientX: 150, clientY: 50 }));
    tick(50);
    expect(rotation()).toBe(30);
  });

  it('retourne la carte avec Entrée et Espace', () => {
    const enter = pointer('keydown');
    Object.defineProperty(enter, 'key', { value: 'Enter' });
    stage().dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(true);
    tick(2000);
    expect(rotation()).toBeCloseTo(180, 3);
    const space = pointer('keydown');
    Object.defineProperty(space, 'key', { value: ' ' });
    stage().dispatchEvent(space);
    expect(space.defaultPrevented).toBe(true);
    tick(2000);
    expect(rotation()).toBeCloseTo(360, 3);
  });

  it.each([
    ['ArrowRight', ARROW_KICK],
    ['ArrowLeft', -ARROW_KICK],
  ])('lance la carte avec la flèche %s', (key, kick) => {
    const event = pointer('keydown');
    Object.defineProperty(event, 'key', { value: key });
    stage().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    tick();
    expect(rotation()).toBe(kick);
    tick(2000);
    expect(rotation() % 180).toBeCloseTo(0, 3);
  });

  it('ignore les autres touches', () => {
    const other = pointer('keydown');
    Object.defineProperty(other, 'key', { value: 'a' });
    stage().dispatchEvent(other);
    expect(other.defaultPrevented).toBe(false);
    tick(5);
    expect(rotation()).toBe(0);
  });

  it('retourne la carte avec le bouton', () => {
    document.querySelector('.carte-retourner').click();
    tick();
    expect(rotation()).toBeGreaterThan(0);
    expect(rotation()).toBeLessThan(180);
    tick(2000);
    expect(rotation()).toBeCloseTo(180, 3);
  });

  it('retourne d’un coup si l’animation est réduite', () => {
    reduce = true;
    mount();
    document.querySelector('.carte-retourner').click();
    tick();
    expect(rotation()).toBe(180);
  });
});
