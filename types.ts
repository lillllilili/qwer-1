export interface Vector2D {
  x: number;
  y: number;
}

export interface Player {
  position: Vector2D;
  radius: number;
  color: string;
}

export interface Projectile {
  position: Vector2D;
  velocity: Vector2D;
  radius: number;
  color: string;
}

export interface Enemy {
  position: Vector2D;
  velocity: Vector2D;
  radius: number;
  color: string;
  type: 'triangle' | 'square';
  health: number;
}

export interface Particle {
  position: Vector2D;
  velocity: Vector2D;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

export type GameStatus = 'start' | 'playing' | 'gameOver';