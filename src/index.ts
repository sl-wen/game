import 'phaser';
import { GameConfig } from './config/GameConfig';
import { MainScene } from './scenes/MainScene';

class Game extends Phaser.Game {
  constructor() {
    super(GameConfig);
    this.scene.add('MainScene', MainScene);
    this.scene.start('MainScene');
  }
}

window.onload = () => {
  new Game();
}; 