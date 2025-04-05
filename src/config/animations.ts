export const ANIMATION_CONFIG = {
  samurai: {
    idle: {
      key: 'idle',
      spritesheet: 'samurai_idle',
      frameRate: 8,
      repeat: -1,
      frames: {
        start: 0,
        end: 3
      }
    },
    walk: {
      key: 'walk',
      spritesheet: 'samurai_walk',
      frameRate: 8,
      repeat: -1,
      frames: {
        start: 0,
        end: 3
      }
    },
    walkUp: {
      key: 'walkUp',
      spritesheet: 'samurai_walk',
      frameRate: 8,
      repeat: -1,
      frames: {
        start: 4,
        end: 7
      }
    },
    walkDown: {
      key: 'walkDown',
      spritesheet: 'samurai_walk',
      frameRate: 8,
      repeat: -1,
      frames: {
        start: 8,
        end: 11
      }
    },
    attack: {
      key: 'attack',
      spritesheet: 'samurai_attack',
      frameRate: 12,
      repeat: 0,
      frames: {
        start: 0,
        end: 3
      }
    },
    attackUp: {
      key: 'attackUp',
      spritesheet: 'samurai_attack',
      frameRate: 12,
      repeat: 0,
      frames: {
        start: 4,
        end: 7
      }
    },
    attackDown: {
      key: 'attackDown',
      spritesheet: 'samurai_attack',
      frameRate: 12,
      repeat: 0,
      frames: {
        start: 8,
        end: 11
      }
    },
    defend: {
      key: 'defend',
      spritesheet: 'samurai_defend',
      frameRate: 10,
      repeat: 0,
      frames: {
        start: 0,
        end: 3
      }
    }
  }
};

export const ANIMATION_COOLDOWN = 100; // 动画切换冷却时间（毫秒）

export type PlayerState = 'idle' | 'walk' | 'walkUp' | 'walkDown' | 'attack' | 'attackUp' | 'attackDown' | 'defend';
export type Direction = 'up' | 'down' | 'left' | 'right' | 'upLeft' | 'upRight' | 'downLeft' | 'downRight'; 