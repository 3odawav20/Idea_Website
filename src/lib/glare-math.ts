export interface GlareState {
  glare: {
    x: number;
    y: number;
  };
  background: {
    x: number;
    y: number;
  };
  rotate: {
    x: number;
    y: number;
  };
}

export interface GlareRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const INITIAL_GLARE_STATE: GlareState = {
  glare: { x: 50, y: 50 },
  background: { x: 50, y: 50 },
  rotate: { x: 0, y: 0 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function computeGlareState(
  clientX: number,
  clientY: number,
  rect: GlareRect,
  rotateFactor = 0.4,
): GlareState {
  if (rect.width <= 0 || rect.height <= 0) {
    return {
      glare: { ...INITIAL_GLARE_STATE.glare },
      background: { ...INITIAL_GLARE_STATE.background },
      rotate: { ...INITIAL_GLARE_STATE.rotate },
    };
  }

  const position = {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
  const percentage = {
    x: clamp((100 / rect.width) * position.x, 0, 100),
    y: clamp((100 / rect.height) * position.y, 0, 100),
  };
  const delta = {
    x: percentage.x - 50,
    y: percentage.y - 50,
  };

  return {
    background: {
      x: 50 + percentage.x / 4 - 12.5,
      y: 50 + percentage.y / 3 - 16.67,
    },
    rotate: {
      x: -(delta.x / 3.5) * rotateFactor,
      y: (delta.y / 2) * rotateFactor,
    },
    glare: {
      x: percentage.x,
      y: percentage.y,
    },
  };
}
