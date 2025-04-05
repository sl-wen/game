export interface CharacterStats {
    level: number;
    maxHealth: number;
    currentHealth: number;
    maxMp: number;
    mp: number;
    exp: number;
    attackDamage: number;
    defense: number;
}

export const GAME_CONFIG = {
    player: {
        speed: 160,
        initialStats: {
            level: 1,
            maxHealth: 100,
            currentHealth: 100,
            maxMp: 100,
            mp: 100,
            exp: 0,
            attackDamage: 20,
            defense: 5
        }
    }
};

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  backgroundColor: '#1a1a2d'
}; 