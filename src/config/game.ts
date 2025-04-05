export const GAME_CONFIG = {
  // 游戏基础配置
  width: 800,
  height: 600,
  backgroundColor: '#2c2c2c',
  
  // 玩家配置
  player: {
    speed: 160,
    scale: 1,
    hitbox: {
      width: 12,
      height: 14,
      offsetX: 2,
      offsetY: 2
    },
    startPosition: {
      x: 200,
      y: 200
    }
  },
  
  // 相机配置
  camera: {
    zoom: 2,
    lerp: 0.1
  },
  
  // 地图配置
  map: {
    tileSize: 16,
    width: 40,
    height: 30
  },
  
  // 调试配置
  debug: {
    showInfo: true,
    fontSize: '18px',
    color: '#ffffff',
    backgroundColor: '#000000'
  }
}; 