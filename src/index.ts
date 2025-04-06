import 'phaser';
import { GAME_CONFIG } from './config/game';
import { MainScene } from './scenes/MainScene';

/**
 * 游戏入口文件
 * 初始化游戏配置并启动游戏
 */

// 创建游戏实例
const game = new Phaser.Game({
    ...GAME_CONFIG,          // 基础配置
    type: Phaser.AUTO,       // 自动选择渲染器
    parent: 'game',          // 父容器ID
    scene: MainScene,        // 主场景
    pixelArt: true,         // 像素艺术模式
    backgroundColor: '#000', // 背景颜色
    scale: {
        mode: Phaser.Scale.FIT,  // 自适应缩放
        autoCenter: Phaser.Scale.CENTER_BOTH  // 居中显示
    }
});

// 当页面加载完成时启动游戏
window.onload = () => {
    // 游戏已经在创建实例时自动启动
    console.log('游戏启动完成');
}; 