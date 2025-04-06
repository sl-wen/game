// 玩家状态类型定义
export type PlayerState = 'idle' | 'walk' | 'walkUp' | 'walkDown' | 'attack' | 'attackUp' | 'attackDown' | 'defend';

// 角色朝向类型定义
export type Direction = 'up' | 'down' | 'left' | 'right' | 'upLeft' | 'upRight' | 'downLeft' | 'downRight';

// 动画冷却时间配置
export const ANIMATION_COOLDOWN = {
    ATTACK: 500,  // 攻击动画冷却时间（毫秒）
    DEFEND: 300   // 防御动画冷却时间（毫秒）
};

// 动画配置对象
export const ANIMATION_CONFIG = {
    // 玩家角色动画配置
    player: {
        // 待机动画
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
        // 行走动画
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
        // 攻击动画
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
        // 防御动画
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
    },
    
    // 敌人动画配置
    bandit: {
        // 待机动画
        idle: {
            key: 'bandit_idle',
            frames: 'bandit_idle',
            frameRate: 8,
            repeat: -1
        },
        // 行走动画
        walk: {
            key: 'bandit_walk',
            frames: 'bandit_walk',
            frameRate: 8,
            repeat: -1
        },
        // 攻击动画
        attack: {
            key: 'bandit_attack',
            frames: 'bandit_attack',
            frameRate: 12,
            repeat: 0
        },
        // 死亡动画
        die: {
            key: 'bandit_die',
            frames: 'bandit_die',
            frameRate: 10,
            repeat: 0
        }
    }
}; 