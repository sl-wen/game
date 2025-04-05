import { ANIMATION_CONFIG, ANIMATION_COOLDOWN, PlayerState, Direction } from '../config/animations';
import { GAME_CONFIG } from '../config/game';
import { CharacterStats, DEFAULT_STATS } from '../config/character';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private playerState: PlayerState = 'idle';
  private facing: Direction = 'down';
  private lastAnimationTime: number = 0;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private defendKey: Phaser.Input.Keyboard.Key;
  private stats: CharacterStats;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'samurai_idle', 0);
    
    // 初始化角色属性
    this.stats = { ...DEFAULT_STATS };
    
    // 初始化物理属性
    scene.physics.add.existing(this);
    
    // 设置玩家大小和碰撞箱
    const { scale, hitbox } = GAME_CONFIG.player;
    this.setScale(scale);
    this.setSize(hitbox.width, hitbox.height);
    this.setOffset(hitbox.offsetX, hitbox.offsetY);
    
    // 启用物理碰撞
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setImmovable(false);
    body.setBounce(0);
    body.setDrag(500);
    body.setAllowGravity(false);
    body.setFriction(1, 1);
    body.setMaxVelocity(GAME_CONFIG.player.speed, GAME_CONFIG.player.speed);
    
    // 初始化键盘控制
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.defendKey = scene.input.keyboard.addKey('D');
    
    // 添加攻击键监听
    scene.input.keyboard.on('keydown-SPACE', () => {
      if (!this.isAttacking() && !this.isDefending()) {
        this.attack();
      }
    });

    // 添加防御键监听
    this.defendKey.on('down', () => {
      if (!this.isAttacking() && this.playerState !== 'defend') {
        this.defend();
      }
    });

    this.defendKey.on('up', () => {
      if (this.playerState === 'defend') {
        this.playerState = 'idle';
        this.play('idle', true);
      }
    });
  }

  private isAttacking(): boolean {
    return this.playerState.startsWith('attack');
  }

  private isDefending(): boolean {
    return this.playerState === 'defend';
  }

  private attack(): void {
    // 执行攻击动画
    this.playerState = 'attack';
    this.play('attack', true);
    this.once('animationcomplete', () => {
      this.playerState = 'idle';
      this.play('idle', true);
    });
  }

  private defend(): void {
    this.playerState = 'defend';
    this.play('defend', true);
  }

  private updateFacing(velocityX: number, velocityY: number): void {
    if (velocityX === 0 && velocityY === 0) return;

    if (velocityX < 0) {
      if (velocityY < 0) this.facing = 'upLeft';
      else if (velocityY > 0) this.facing = 'downLeft';
      else this.facing = 'left';
      this.flipX = true;
    } else if (velocityX > 0) {
      if (velocityY < 0) this.facing = 'upRight';
      else if (velocityY > 0) this.facing = 'downRight';
      else this.facing = 'right';
      this.flipX = false;
    } else {
      if (velocityY < 0) this.facing = 'up';
      else if (velocityY > 0) this.facing = 'down';
    }
  }

  update(): void {
    if (this.isAttacking() || this.isDefending()) return;

    const { speed } = GAME_CONFIG.player;
    const currentTime = Date.now();
    let velocityX = 0;
    let velocityY = 0;
    
    // 计算移动速度
    if (this.cursors.left?.isDown) velocityX = -speed;
    else if (this.cursors.right?.isDown) velocityX = speed;
    
    if (this.cursors.up?.isDown) velocityY = -speed;
    else if (this.cursors.down?.isDown) velocityY = speed;

    // 对角线移动时减小速度
    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= 0.707; // Math.cos(45°)
      velocityY *= 0.707; // Math.sin(45°)
    }

    // 使用加速度而不是直接设置速度
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAcceleration(velocityX * 4, velocityY * 4);

    // 如果没有按下方向键，让玩家逐渐停下
    if (velocityX === 0 && velocityY === 0) {
      body.setAcceleration(0, 0);
    }

    this.updateFacing(body.velocity.x, body.velocity.y);

    // 更新动画状态
    if (Math.abs(body.velocity.x) > 10 || Math.abs(body.velocity.y) > 10) {
      if (this.playerState !== 'walk' && 
          currentTime - this.lastAnimationTime > ANIMATION_COOLDOWN) {
        this.playerState = 'walk';
        this.play('walk', true);
        this.lastAnimationTime = currentTime;
      }
    } else {
      if (this.playerState !== 'idle' && 
          currentTime - this.lastAnimationTime > ANIMATION_COOLDOWN) {
        this.playerState = 'idle';
        this.play('idle', true);
        this.lastAnimationTime = currentTime;
      }
    }
  }

  public getStats(): CharacterStats {
    return this.stats;
  }

  public updateStats(newStats: Partial<CharacterStats>): void {
    this.stats = { ...this.stats, ...newStats };
  }

  getDebugInfo(): string[] {
    return [
      `Player State: ${this.playerState}`,
      `Facing: ${this.facing}`,
      `Position: (${Math.floor(this.x)}, ${Math.floor(this.y)})`,
      `Velocity: (${Math.floor(this.body.velocity.x)}, ${Math.floor(this.body.velocity.y)})`,
      `Level: ${this.stats.level}`,
      `HP: ${this.stats.hp}/${this.stats.maxHp}`,
      `MP: ${this.stats.mp}/${this.stats.maxMp}`
    ];
  }
} 