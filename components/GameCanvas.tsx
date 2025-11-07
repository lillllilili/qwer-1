import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Player, Projectile, Enemy, Vector2D, Particle } from '../types';

interface GameCanvasProps {
  onGameOver: (score: number) => void;
}

// --- Game Constants ---
const PLAYER_RADIUS = 15;
const PLAYER_COLOR = 'cyan';
const PLAYER_SPEED = 4;

const PROJECTILE_RADIUS = 5;
const PROJECTILE_COLOR = 'yellow';
const PROJECTILE_SPEED = 8;

const ENEMY_MIN_RADIUS = 10;
const ENEMY_MAX_RADIUS = 30;
const ENEMY_COLOR = 'tomato';
const ENEMY_SPEED_MULTIPLIER = 0.5;

const SQUARE_ENEMY_MIN_SIZE = 15;
const SQUARE_ENEMY_MAX_SIZE = 35;
const SQUARE_ENEMY_HEALTH = 3;

const PARTICLE_COUNT = 15;
const PARTICLE_DECAY = 0.01;

const GameCanvas: React.FC<GameCanvasProps> = ({ onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // FIX: Initialize useRef with null and update type to `number | null` to provide the required initial value.
  const animationFrameId = useRef<number | null>(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(score);
  scoreRef.current = score;

  // Game state refs
  const playerRef = useRef<Player | null>(null);
  const projectilesRef = useRef<Projectile[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const mousePositionRef = useRef<Vector2D>({ x: 0, y: 0 });
  const keysPressedRef = useRef<Record<string, boolean>>({});
  // FIX: Initialize useRef with null and update type to `number | null` to provide the required initial value.
  const triangleSpawnInterval = useRef<number | null>(null);
  // FIX: Initialize useRef with null and update type to `number | null` to provide the required initial value.
  const squareSpawnInterval = useRef<number | null>(null);

  const createParticles = (position: Vector2D, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        position: { ...position },
        velocity: {
          x: (Math.random() - 0.5) * (Math.random() * 6),
          y: (Math.random() - 0.5) * (Math.random() * 6),
        },
        radius: Math.random() * 3 + 1,
        color,
        alpha: 1,
        decay: PARTICLE_DECAY + Math.random() * 0.01
      });
    }
  };
  
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(17, 24, 39, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particlesRef.current = particlesRef.current.filter(particle => {
      particle.position.x += particle.velocity.x;
      particle.position.y += particle.velocity.y;
      particle.alpha -= particle.decay;

      if (particle.alpha > 0) {
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.beginPath();
        ctx.arc(particle.position.x, particle.position.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
        ctx.restore();
        return true;
      }
      return false;
    });

    const player = playerRef.current;
    if (player) {
      if (keysPressedRef.current['w'] && player.position.y - player.radius > 0) player.position.y -= PLAYER_SPEED;
      if (keysPressedRef.current['s'] && player.position.y + player.radius < canvas.height) player.position.y += PLAYER_SPEED;
      if (keysPressedRef.current['a'] && player.position.x - player.radius > 0) player.position.x -= PLAYER_SPEED;
      if (keysPressedRef.current['d'] && player.position.x + player.radius < canvas.width) player.position.x += PLAYER_SPEED;

      ctx.beginPath();
      ctx.arc(player.position.x, player.position.y, player.radius, 0, Math.PI * 2);
      ctx.fillStyle = player.color;
      ctx.shadowColor = player.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    projectilesRef.current.forEach((proj) => {
      proj.position.x += proj.velocity.x;
      proj.position.y += proj.velocity.y;
      
      ctx.beginPath();
      ctx.arc(proj.position.x, proj.position.y, proj.radius, 0, Math.PI * 2);
      ctx.fillStyle = proj.color;
      ctx.shadowColor = proj.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    const enemyIndicesToRemove = new Set<number>();
    const projectileIndicesToRemove = new Set<number>();

    enemiesRef.current.forEach((enemy, enemyIndex) => {
      let angle = 0;
      if (player) {
        angle = Math.atan2(player.position.y - enemy.position.y, player.position.x - enemy.position.x);
        enemy.velocity.x = Math.cos(angle) * ENEMY_SPEED_MULTIPLIER;
        enemy.velocity.y = Math.sin(angle) * ENEMY_SPEED_MULTIPLIER;
      }

      enemy.position.x += enemy.velocity.x;
      enemy.position.y += enemy.velocity.y;
      
      ctx.save();
      ctx.translate(enemy.position.x, enemy.position.y);
      ctx.rotate(angle);
      
      ctx.beginPath();
      if (enemy.type === 'square') {
        ctx.rect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
      } else {
        ctx.moveTo(enemy.radius, 0);
        ctx.lineTo(-enemy.radius / 2, -enemy.radius * 0.8);
        ctx.lineTo(-enemy.radius / 2, enemy.radius * 0.8);
      }
      ctx.closePath();
      
      ctx.fillStyle = enemy.color;
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.restore();

      if (player) {
        const dist = Math.hypot(player.position.x - enemy.position.x, player.position.y - enemy.position.y);
        if (dist - enemy.radius - player.radius < 1) {
            onGameOver(scoreRef.current);
            return;
        }
      }

      projectilesRef.current.forEach((proj, projIndex) => {
        if (projectileIndicesToRemove.has(projIndex) || enemyIndicesToRemove.has(enemyIndex)) {
            return;
        }
        const dist = Math.hypot(proj.position.x - enemy.position.x, proj.position.y - enemy.position.y);
        if (dist - enemy.radius - proj.radius < 1) {
          projectileIndicesToRemove.add(projIndex);
          enemy.health -= 1;

          if (enemy.health <= 0) {
            createParticles(enemy.position, enemy.color, PARTICLE_COUNT * (enemy.type === 'square' ? 2.5 : 1));
            setScore(prev => prev + (enemy.type === 'square' ? 50 : 10));
            enemyIndicesToRemove.add(enemyIndex);
          }
        }
      });
    });

    projectilesRef.current.forEach((proj, projIndex) => {
        if (proj.position.x + proj.radius < 0 || proj.position.x - proj.radius > canvas.width ||
            proj.position.y + proj.radius < 0 || proj.position.y - proj.radius > canvas.height) {
          projectileIndicesToRemove.add(projIndex);
        }
    });

    if (enemyIndicesToRemove.size > 0) {
        enemiesRef.current = enemiesRef.current.filter((_, index) => !enemyIndicesToRemove.has(index));
    }
    if (projectileIndicesToRemove.size > 0) {
        projectilesRef.current = projectilesRef.current.filter((_, index) => !projectileIndicesToRemove.has(index));
    }

    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [onGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    projectilesRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    setScore(0);

    playerRef.current = {
      position: { x: canvas.width / 2, y: canvas.height / 2 },
      radius: PLAYER_RADIUS,
      color: PLAYER_COLOR,
    };

    const handleKeyDown = (e: KeyboardEvent) => { keysPressedRef.current[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressedRef.current[e.key.toLowerCase()] = false; };
    const handleMouseMove = (e: MouseEvent) => { mousePositionRef.current = { x: e.clientX, y: e.clientY }; };
    const handleMouseDown = (e: MouseEvent) => {
      const player = playerRef.current;
      if (!player) return;
      const angle = Math.atan2(e.clientY - player.position.y, e.clientX - player.position.x);
      const velocity = {
        x: Math.cos(angle) * PROJECTILE_SPEED,
        y: Math.sin(angle) * PROJECTILE_SPEED,
      };
      projectilesRef.current.push({
        position: { ...player.position },
        velocity,
        radius: PROJECTILE_RADIUS,
        color: PROJECTILE_COLOR,
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);

    const spawnEnemy = (type: 'triangle' | 'square') => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const isTriangle = type === 'triangle';
        const minSize = isTriangle ? ENEMY_MIN_RADIUS : SQUARE_ENEMY_MIN_SIZE;
        const maxSize = isTriangle ? ENEMY_MAX_RADIUS : SQUARE_ENEMY_MAX_SIZE;
        const radius = Math.random() * (maxSize - minSize) + minSize;
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }
        
        const player = playerRef.current;
        if(!player) return;

        const angle = Math.atan2(player.position.y - y, player.position.x - x);
        const velocity = {
            x: Math.cos(angle) * ENEMY_SPEED_MULTIPLIER,
            y: Math.sin(angle) * ENEMY_SPEED_MULTIPLIER,
        };

        enemiesRef.current.push({
            position: { x, y },
            velocity,
            radius,
            color: ENEMY_COLOR,
            type: type,
            health: isTriangle ? 1 : SQUARE_ENEMY_HEALTH,
        });
    }

    triangleSpawnInterval.current = window.setInterval(() => spawnEnemy('triangle'), 2000);
    squareSpawnInterval.current = window.setInterval(() => spawnEnemy('square'), 4000);

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (triangleSpawnInterval.current) {
        clearInterval(triangleSpawnInterval.current);
      }
       if (squareSpawnInterval.current) {
        clearInterval(squareSpawnInterval.current);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [gameLoop]);

  return (
    <>
      <div className="absolute top-4 left-4 text-2xl font-bold text-yellow-400 z-20">
        Score: {score}
      </div>
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
    </>
  );
};

export default GameCanvas;
