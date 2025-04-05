import { ANIMATION_CONFIG, ANIMATION_COOLDOWN, PlayerState, Direction } from '../config/animations';
import { GAME_CONFIG } from '../config/game';
import { CharacterStats } from '../config/GameConfig';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private playerState: PlayerState = 'idle';
  private facing: Direction = 'down';
  private lastAnimationTime: number = 0;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private defendKey: Phaser.Input.Keyboard.Key;
  private stats: CharacterStats;
  private attackKey: Phaser.Input.Keyboard.Key;
  private lastAttackTime: number = 0;
  private attackCooldown: number = 500; // 攻击冷却时间（毫秒）
  private healthBar: Phaser.GameObjects.Graphics;
  private isDead: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'samurai_idle', 0);
    
    // 初始化角色属性
    this.stats = { ...GAME_CONFIG.player.initialStats };
    
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
    this.attackKey = scene.input.keyboard.addKey('X');
    
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

    // 创建血条
    this.healthBar = scene.add.graphics();
    this.updateHealthBar();
  }

  private isAttacking(): boolean {
    return this.playerState === 'attack';
  }

  private isDefending(): boolean {
    return this.playerState === 'defend';
  }

  private attack(): void {
    if (this.isDead) return;

    if (this.isAttacking() || Date.now() - this.lastAttackTime <= this.attackCooldown) return;
    
    this.lastAttackTime = Date.now();
    this.playerState = 'attack';
    
    // 播放攻击动画
    this.play('attack', true);
    
    // 创建攻击判定区域
    const attackBox = new Phaser.Geom.Rectangle(
      this.flipX ? this.x - 32 : this.x,
      this.y - 8,
      32,
      32
    );
    
    // 获取场景中的所有敌人
    const enemies = (this.scene as any).enemies || [];
    
    // 检查攻击判定
    enemies.forEach((enemy: any) => {
      const enemyBounds = enemy.getBounds();
      if (Phaser.Geom.Rectangle.Overlaps(attackBox, enemyBounds)) {
        enemy.takeDamage(this.stats.attackDamage);
      }
    });

    // 动画完成后重置攻击状态
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
    if (this.isDead) return;

    if (this.isAttacking()) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    
    // 处理移动输入
    if (this.cursors.left.isDown) {
      body.setVelocityX(-160);
      this.setFlipX(true);
      this.play('walk', true);
    } else if (this.cursors.right.isDown) {
      body.setVelocityX(160);
      this.setFlipX(false);
      this.play('walk', true);
    } else {
      body.setVelocityX(0);
    }

    if (this.cursors.up.isDown) {
      body.setVelocityY(-160);
      this.play('walk', true);
    } else if (this.cursors.down.isDown) {
      body.setVelocityY(160);
      this.play('walk', true);
    } else {
      body.setVelocityY(0);
    }

    // 如果没有移动，播放待机动画
    if (body.velocity.x === 0 && body.velocity.y === 0) {
      this.play('idle', true);
    }

    // 处理攻击输入
    if (this.attackKey.isDown && !this.isAttacking() && Date.now() - this.lastAttackTime > this.attackCooldown) {
      this.attack();
    }

    // 更新血条位置
    this.updateHealthBar();
  }

  public getStats(): CharacterStats {
    return this.stats;
  }

  public updateStats(newStats: Partial<CharacterStats>): void {
    this.stats = { ...this.stats, ...newStats };
  }

  takeDamage(damage: number): void {
    if (this.isDead) return;

    const actualDamage = Math.max(1, damage - this.stats.defense);
    this.stats.currentHealth = Math.max(0, this.stats.currentHealth - actualDamage);
    this.updateHealthBar();
    
    // 如果生命值为0，处理死亡
    if (this.stats.currentHealth <= 0) {
      this.die();
    }
  }

  private updateHealthBar(): void {
    if (this.isDead) return;

    this.healthBar.clear();
    
    // 计算血条位置（在角色头顶）
    const barX = this.x - 20;
    const barY = this.y - 25;
    
    // 血条背景
    this.healthBar.fillStyle(0x000000, 0.5);
    this.healthBar.fillRect(barX, barY, 40, 5);
    
    // 当前血量
    const healthPercentage = this.stats.currentHealth / this.stats.maxHealth;
    this.healthBar.fillStyle(0xff0000, 1);
    this.healthBar.fillRect(barX, barY, 40 * healthPercentage, 5);
  }

  private die(): void {
    this.isDead = true;
    this.playerState = 'idle';
    
    // 停止所有移动
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    
    // 清除血条
    this.healthBar.clear();
    
    // 播放死亡动画（如果有的话）
    // this.play('die', true);
    
    // 设置为半透明
    this.setAlpha(0.5);
  }

  getDebugInfo(): string[] {
    if (this.isDead) {
      return [
        `Position: (${Math.floor(this.x)}, ${Math.floor(this.y)})`,
        'Status: Dead',
        `Level: ${this.stats.level}`,
        `HP: 0/${this.stats.maxHealth}`,
        `MP: ${this.stats.mp}/${this.stats.maxMp}`
      ];
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    return [
      `Position: (${Math.floor(this.x)}, ${Math.floor(this.y)})`,
      `Velocity: (${Math.floor(body.velocity.x)}, ${Math.floor(body.velocity.y)})`,
      `Level: ${this.stats.level}`,
      `HP: ${this.stats.currentHealth}/${this.stats.maxHealth}`,
      `MP: ${this.stats.mp}/${this.stats.maxMp}`
    ];
  }
} 