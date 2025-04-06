import { GameConfig } from './GameConfig';

/**
 * 游戏全局配置
 */
export const GAME_CONFIG: GameConfig = {
    // Phaser 核心配置
    type: Phaser.AUTO,       // 自动选择渲染器
    width: window.innerWidth,  // 窗口宽度
    height: window.innerHeight, // 窗口高度
    backgroundColor: '#000', // 背景颜色
    pixelArt: true,         // 像素艺术模式
    parent: 'game',          // 父容器ID
    
    // 缩放配置
    scale: {
        mode: Phaser.Scale.RESIZE,  // 自动调整大小
        autoCenter: Phaser.Scale.CENTER_BOTH  // 居中显示
    },
    
    // 物理引擎配置
    physics: {
        default: 'arcade',   // 使用 Arcade 物理引擎
        arcade: {
            debug: true,     // 启用物理引擎调试
            gravity: {       // 重力设置
                x: 0,       // X轴无重力
                y: 0        // Y轴无重力
            }
        }
    },

    // 自定义配置
    // 相机配置
    camera: {
        zoom: 2,            // 默认缩放比例
        lerp: 0.1          // 相机跟随插值
    },

    // 地图配置
    map: {
        tilesetKey: 'tiles',
        tilesetPath: 'assets/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetInterior.png',
        mapKey: 'map',
        mapPath: 'assets/maps/dojo.json'
    },
    
    // 玩家角色配置
    player: {
        scale: 1,           // 角色缩放比例
        hitbox: {
            width: 16,      // 碰撞箱宽度
            height: 16,     // 碰撞箱高度
            offsetX: 0,     // X轴偏移
            offsetY: 0      // Y轴偏移
        },
        
        // 初始属性配置
        initialStats: {
            maxHealth: 100, // 最大生命值
            currentHealth: 100, // 当前生命值
            maxMp: 100,    // 最大魔法值
            mp: 100,       // 当前魔法值
            attackDamage: 20, // 攻击力
            defense: 5,     // 防御力
            level: 1,       // 初始等级
            exp: 0,         // 经验值
            moveSpeed: 80,    // 玩家移动速度
            attackRange: 32    // 玩家攻击距离
        }
    },
  
  // 调试配置
  debug: {
    showInfo: true,
    fontSize: '12px',
    color: '#00ff00',
    backgroundColor: 'rgba(0,0,0,0.8)'
  }
}; 