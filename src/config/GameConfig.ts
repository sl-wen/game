/**
 * 相机配置接口
 */
export interface CameraConfig {
    zoom: number;          // 相机缩放比例
    lerp: number;          // 相机跟随插值
}

/**
 * 地图配置接口
 */
export interface MapConfig {
    tilesetKey: string;    // 图块集键名
    tilesetPath: string;   // 图块集路径
    mapKey: string;        // 地图键名
    mapPath: string;       // 地图路径
}

/**
 * 调试配置接口
 */
export interface DebugConfig {
    showInfo: boolean;     // 是否显示调试信息
    fontSize: string;      // 字体大小
    color: string;         // 文字颜色
    backgroundColor: string; // 背景颜色
}

/**
 * 角色属性接口定义
 */
export interface CharacterStats {
    level: number;           // 等级
    maxHealth: number;       // 最大生命值
    currentHealth: number;   // 当前生命值
    maxMp: number;          // 最大魔法值
    mp: number;             // 当前魔法值
    exp: number;            // 经验值
    attackDamage: number;   // 攻击力
    defense: number;        // 防御力
    moveSpeed: number;     // 移动速度
    attackRange: number;   // 攻击距离
}

/**
 * 碰撞箱配置接口
 */
export interface HitboxConfig {
    width: number;          // 碰撞箱宽度
    height: number;         // 碰撞箱高度
    offsetX: number;        // X轴偏移
    offsetY: number;        // Y轴偏移
}

/**
 * 角色配置接口
 */
export interface CharacterConfig {
    scale: number;          // 角色缩放比例
    hitbox: HitboxConfig;   // 碰撞箱配置
    initialStats: CharacterStats;  // 初始属性
}

/**
 * 自定义游戏配置接口
 */
export interface CustomGameConfig {
    camera: CameraConfig;   // 相机配置
    map: MapConfig;         // 地图配置
    player: CharacterConfig; // 玩家配置
    debug: DebugConfig;     // 调试配置
}

/**
 * 游戏配置接口
 * 合并 Phaser 游戏配置和自定义配置
 */
export type GameConfig = Omit<Phaser.Types.Core.GameConfig, 'physics'> & CustomGameConfig & {
    physics: {
        default: 'arcade';
        arcade: {
            debug?: boolean;
            gravity: {
                x: number;
                y: number;
            }
        }
    }
};

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
            defense: 5,
            moveSpeed: 160,
            attackRange: 100
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