import { ANIMATION_CONFIG, ANIMATION_COOLDOWN, PlayerState, Direction } from '../config/animations';
import { GAME_CONFIG } from '../config/game';
import { CharacterStats } from '../config/GameConfig';
import { Enemy } from './Enemy';

/**
 * 玩家角色类
 * 继承自 Phaser 的 Arcade 物理精灵
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private playerState: PlayerState = 'idle';      // 玩家当前状态
  private facing: Direction = 'right';            // 朝向
  private lastAnimationTime: number = 0;          // 上次动画播放时间
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;  // 键盘控制器
  private defendKey: Phaser.Input.Keyboard.Key;   // 防御键
  private stats: CharacterStats = {
    maxHealth: 100,
    currentHealth: 100,
    maxMp: 100,
    mp: 100,
    attackDamage: 20,
    defense: 10,
    moveSpeed: 100,
    attackRange: 32,
    level: 1,
    exp: 0
  };
  private attackKey: Phaser.Input.Keyboard.Key;   // 攻击键
  private lastAttackTime: number = 0;             // 上次攻击时间
  private attackCooldown: number = 500;           // 攻击冷却时间（毫秒）
  private healthBar: Phaser.GameObjects.Graphics; // 血条图形对象
  private isDead: boolean = false;                // 死亡状态标志
  private debugGraphics: Phaser.GameObjects.Graphics;
  private _isAttacking: boolean = false;          // 攻击状态
  private lastDirectionChangeTime: number = 0;  // 添加方向改变的冷却时间
  private directionChangeCooldown: number = 100; // 方向改变的冷却时间（毫秒）
  private currentAnimation: string = 'idle';     // 当前播放的动画
  private lastMovementDirection: Direction | null = null;  // 记录最后的移动方向

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'samurai_idle');
    
    // 初始化键盘控制
    this.cursors = scene.input.keyboard.createCursorKeys();
    
    // 设置物理属性
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    
    // 设置动画
    this.setupAnimations();
    
    // 初始化血条
    this.healthBar = scene.add.graphics();
    this.updateHealthBar();
    
    // 初始化调试图形
    this.debugGraphics = scene.add.graphics();
  }

  private setupAnimations() {
    // 向下走动画（第一列，0,4,8,12）
    if (!this.scene.anims.exists('walkDown')) {
        this.scene.anims.create({
            key: 'walkDown',
            frames: this.scene.anims.generateFrameNumbers('samurai_walk', { 
                frames: [0, 4, 8, 12]
            }),
            frameRate: 8,
            repeat: -1
        });
    }

    // 向上走动画（第二列，1,5,9,13）
    if (!this.scene.anims.exists('walkUp')) {
        this.scene.anims.create({
            key: 'walkUp',
            frames: this.scene.anims.generateFrameNumbers('samurai_walk', { 
                frames: [1, 5, 9, 13]
            }),
            frameRate: 8,
            repeat: -1
        });
    }

    // 向左走动画（第三列，2,6,10,14）
    if (!this.scene.anims.exists('walkLeft')) {
        this.scene.anims.create({
            key: 'walkLeft',
            frames: this.scene.anims.generateFrameNumbers('samurai_walk', { 
                frames: [2, 6, 10, 14]
            }),
            frameRate: 8,
            repeat: -1
        });
    }

    // 向右走动画（第四列，3,7,11,15）
    if (!this.scene.anims.exists('walkRight')) {
        this.scene.anims.create({
            key: 'walkRight',
            frames: this.scene.anims.generateFrameNumbers('samurai_walk', { 
                frames: [3, 7, 11, 15]
            }),
            frameRate: 8,
            repeat: -1
        });
    }

    // 创建各个方向的待机动画
    if (!this.scene.anims.exists('idleDown')) {
        this.scene.anims.create({
            key: 'idleDown',
            frames: [{ key: 'samurai_walk', frame: 0 }],
            frameRate: 1,
            repeat: 0
        });
    }

    if (!this.scene.anims.exists('idleUp')) {
        this.scene.anims.create({
            key: 'idleUp',
            frames: [{ key: 'samurai_walk', frame: 1 }],
            frameRate: 1,
            repeat: 0
        });
    }

    if (!this.scene.anims.exists('idleLeft')) {
        this.scene.anims.create({
            key: 'idleLeft',
            frames: [{ key: 'samurai_walk', frame: 2 }],
            frameRate: 1,
            repeat: 0
        });
    }

    if (!this.scene.anims.exists('idleRight')) {
        this.scene.anims.create({
            key: 'idleRight',
            frames: [{ key: 'samurai_walk', frame: 3 }],
            frameRate: 1,
            repeat: 0
        });
    }

    // 创建各个方向的攻击动画
    if (!this.scene.anims.exists('attackDown')) {
        this.scene.anims.create({
            key: 'attackDown',
            frames: this.scene.anims.generateFrameNumbers('samurai_attack', { 
                frames: [0, 4, 8, 12]
            }),
            frameRate: 12,
            repeat: 0
        });
    }

    if (!this.scene.anims.exists('attackUp')) {
        this.scene.anims.create({
            key: 'attackUp',
            frames: this.scene.anims.generateFrameNumbers('samurai_attack', { 
                frames: [1, 5, 9, 13]
            }),
            frameRate: 12,
            repeat: 0
        });
    }

    if (!this.scene.anims.exists('attackLeft')) {
        this.scene.anims.create({
            key: 'attackLeft',
            frames: this.scene.anims.generateFrameNumbers('samurai_attack', { 
                frames: [2, 6, 10, 14]
            }),
            frameRate: 12,
            repeat: 0
        });
    }

    if (!this.scene.anims.exists('attackRight')) {
        this.scene.anims.create({
            key: 'attackRight',
            frames: this.scene.anims.generateFrameNumbers('samurai_attack', { 
                frames: [3, 7, 11, 15]
            }),
            frameRate: 12,
            repeat: 0
        });
    }
  }

  get isAttacking(): boolean {
    return this._isAttacking;
  }

  // 检查是否在防御状态
  private isDefending(): boolean {
    return this.playerState === 'defend';
  }

  // 执行攻击动作
  private attack(): void {
    if (this._isAttacking || this.isDead) return;

    const currentTime = this.scene.time.now;
    if (currentTime - this.lastAttackTime < this.attackCooldown) return;

    this._isAttacking = true;
    this.lastAttackTime = currentTime;
    this.playerState = 'attack';

    // 根据当前朝向播放对应的攻击动画
    const attackAnim = 'attack' + this.facing.charAt(0).toUpperCase() + this.facing.slice(1);
    this.play(attackAnim, true).once('animationcomplete', () => {
        this._isAttacking = false;
        this.playerState = 'idle';
        // 攻击结束后播放对应方向的待机动画
        const idleAnim = 'idle' + this.facing.charAt(0).toUpperCase() + this.facing.slice(1);
        this.play(idleAnim, true);
    });

    // 获取攻击范围内的敌人
    const enemies = this.scene.children.list.filter(child => {
        if (child instanceof Enemy) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, child.x, child.y);
            if (distance <= this.stats.attackRange) {
                // 检查敌人是否在攻击角度范围内
                const angle = Phaser.Math.Angle.Between(this.x, this.y, child.x, child.y);
                let isInRange = false;
                
                switch (this.facing) {
                    case 'right':
                        isInRange = angle >= -Math.PI/4 && angle <= Math.PI/4;
                        break;
                    case 'left':
                        isInRange = angle >= 3*Math.PI/4 || angle <= -3*Math.PI/4;
                        break;
                    case 'up':
                        isInRange = angle >= -3*Math.PI/4 && angle <= -Math.PI/4;
                        break;
                    case 'down':
                        isInRange = angle >= Math.PI/4 && angle <= 3*Math.PI/4;
                        break;
                }
                
                return isInRange;
            }
        }
        return false;
    });

    // 对范围内的敌人造成伤害
    enemies.forEach(enemy => {
        if (enemy instanceof Enemy) {
            enemy.takeDamage(this.stats.attackDamage);
        }
    });
  }

  // 执行防御动作
  private defend(): void {
    this.playerState = 'defend';
    this.play('defend', true);
  }

  // 更新角色朝向
  private updateFacing(newDirection: Direction): void {
    const currentTime = this.scene.time.now;
    
    // 检查是否可以改变方向
    if (currentTime - this.lastDirectionChangeTime < this.directionChangeCooldown) {
        return;
    }
    
    // 只在方向确实改变时更新
    if (this.facing !== newDirection) {
        this.facing = newDirection;
        this.lastDirectionChangeTime = currentTime;
    }
  }

  // 每帧更新
  update(): void {
    if (this.isDead) return;

    // 处理攻击输入
    if (this.scene.input.keyboard.addKey('SPACE').isDown && !this._isAttacking) {
        this.attack();
    }

    // 如果正在攻击，不处理移动
    if (this._isAttacking) {
        this.setVelocity(0, 0);
        return;
    }

    // 处理移动输入
    const moveSpeed = this.stats.moveSpeed;
    let velocityX = 0;
    let velocityY = 0;
    let newDirection = this.facing; // 保持当前朝向作为默认值

    // 水平移动
    if (this.cursors.left.isDown) {
        velocityX = -moveSpeed;
        newDirection = 'left';
    } else if (this.cursors.right.isDown) {
        velocityX = moveSpeed;
        newDirection = 'right';
    }

    // 垂直移动
    if (this.cursors.up.isDown) {
        velocityY = -moveSpeed;
        if (velocityX === 0) { // 只在没有水平移动时改变朝向
            newDirection = 'up';
        }
    } else if (this.cursors.down.isDown) {
        velocityY = moveSpeed;
        if (velocityX === 0) { // 只在没有水平移动时改变朝向
            newDirection = 'down';
        }
    }

    // 设置速度
    this.setVelocity(velocityX, velocityY);

    // 只在实际移动时更新朝向
    if (velocityX !== 0 || velocityY !== 0) {
        this.updateFacing(newDirection);
    }

    // 更新动画状态
    this.updateAnimation(velocityX, velocityY);

    // 更新血条位置
    this.updateHealthBar();
    
    // 更新调试显示
    this.updateDebugDisplay();
  }

  private updateAnimation(velocityX: number, velocityY: number): void {
    if (this.playerState === 'attack') {
        return; // 如果正在攻击，不更新动画
    }

    const isMoving = velocityX !== 0 || velocityY !== 0;
    let newAnimation = 'idle' + this.facing.charAt(0).toUpperCase() + this.facing.slice(1);

    if (isMoving) {
        // 根据移动方向选择对应的动画
        if (Math.abs(velocityX) > Math.abs(velocityY)) {
            // 水平移动优先
            newAnimation = velocityX > 0 ? 'walkRight' : 'walkLeft';
        } else {
            // 垂直移动
            newAnimation = velocityY > 0 ? 'walkDown' : 'walkUp';
        }
    }

    // 只有当需要播放新的动画时才切换
    if (this.currentAnimation !== newAnimation) {
        this.currentAnimation = newAnimation;
        this.play(newAnimation, true);
    }
  }

  // 获取角色属性
  public getStats(): CharacterStats {
    return this.stats;
  }

  // 更新角色属性
  public updateStats(newStats: Partial<CharacterStats>): void {
    this.stats = { ...this.stats, ...newStats };
  }

  // 受到伤害
  takeDamage(damage: number): void {
    if (this.isDead) return;

    // 计算实际伤害（考虑防御力）
    const actualDamage = Math.max(1, damage - this.stats.defense);
    this.stats.currentHealth = Math.max(0, this.stats.currentHealth - actualDamage);
    this.updateHealthBar();
    
    // 如果生命值为0，处理死亡
    if (this.stats.currentHealth <= 0) {
      this.die();
    }
  }

  // 更新血条显示
  private updateHealthBar(): void {
    if (this.isDead) return;

    this.healthBar.clear();
    
    // 计算血条位置（在角色头顶）
    const barWidth = 32;  // 血条宽度
    const barHeight = 4;  // 血条高度
    const barX = this.x - barWidth / 2;  // 居中对齐
    const barY = this.y - 15;  // 角色头顶上方
    
    // 绘制血条背景（黑色半透明）
    this.healthBar.fillStyle(0x000000, 0.5);
    this.healthBar.fillRect(barX, barY, barWidth, barHeight);
    
    // 绘制当前血量（红色）
    const healthPercentage = this.stats.currentHealth / this.stats.maxHealth;
    this.healthBar.fillStyle(0xff0000, 1);
    this.healthBar.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
  }

  // 处理死亡
  private die(): void {
    this.isDead = true;
    this.playerState = 'idle';
    
    // 停止所有移动
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    
    // 清除血条
    this.healthBar.clear();
    
    // 设置为半透明表示死亡状态
    this.setAlpha(0.5);
  }

  // 添加升级所需经验值计算方法
  private calculateExpToNextLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  // 添加获得经验值的方法
  public gainExp(exp: number): void {
    if (this.isDead) return;
    
    this.stats.exp += exp;
    const expToNextLevel = this.calculateExpToNextLevel(this.stats.level);
    
    // 检查是否可以升级
    while (this.stats.exp >= expToNextLevel) {
        this.levelUp();
    }
  }

  // 添加升级方法
  private levelUp(): void {
    const expToNextLevel = this.calculateExpToNextLevel(this.stats.level);
    this.stats.exp -= expToNextLevel;
    this.stats.level++;
    
    // 提升属性
    this.stats.maxHealth += 20;
    this.stats.currentHealth = this.stats.maxHealth;  // 升级时恢复满血
    this.stats.maxMp += 10;
    this.stats.mp = this.stats.maxMp;  // 升级时恢复满蓝
    this.stats.attackDamage += 5;
    this.stats.defense += 2;
    this.stats.moveSpeed += 5;
    
    // 创建升级特效
    const particles = this.scene.add.particles(this.x, this.y, 'level_up_effect', {
        speed: 100,
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 1000,  // 特效持续3秒
        blendMode: 'ADD',
        quantity: 30,     // 每次发射1个粒子
        frequency: 200   // 每200毫秒发射一次
    });
    
    // 3秒后销毁粒子系统
    this.scene.time.delayedCall(3000, () => {
        particles.destroy();
    });
    
    // 显示升级文本
    const levelUpText = this.scene.add.text(this.x, this.y - 20, '升级!', {
        fontSize: '16px',
        fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4
    });
    levelUpText.setOrigin(0.5);
    
    // 文本动画持续3秒
    this.scene.tweens.add({
        targets: levelUpText,
        y: levelUpText.y - 30,
        alpha: 0,
        duration: 3000,
        ease: 'Power2',
        onComplete: () => levelUpText.destroy()
    });
  }

  // 修改获取调试信息的方法，添加经验值信息
  public getDebugInfo(): string {
    const expToNextLevel = this.calculateExpToNextLevel(this.stats.level);
    return `
        生命: ${this.stats.currentHealth}/${this.stats.maxHealth}
        魔法: ${this.stats.mp}/${this.stats.maxMp}
        等级: ${this.stats.level}
        经验: ${this.stats.exp}/${expToNextLevel} (${Math.floor((this.stats.exp / expToNextLevel) * 100)}%)
        攻击: ${this.stats.attackDamage}
        防御: ${this.stats.defense}
        速度: ${this.stats.moveSpeed}
    `.trim();
  }

  private updateDebugDisplay(): void {
    if (!this.debugGraphics) return;

    this.debugGraphics.clear();
    
    // 只在开启了调试模式时显示攻击范围
    if (this.scene.game.config.physics.arcade?.debug) {
        // 绘制攻击范围
        this.debugGraphics.lineStyle(2, 0xff0000, 0.5);
        
        const range = this.stats.attackRange;
        let startAngle = 0;
        let endAngle = 0;
        
        switch (this.facing) {
            case 'right':
                startAngle = -Math.PI / 4;
                endAngle = Math.PI / 4;
                break;
            case 'left':
                startAngle = 3 * Math.PI / 4;
                endAngle = 5 * Math.PI / 4;
                break;
            case 'up':
                startAngle = 5 * Math.PI / 4;
                endAngle = 7 * Math.PI / 4;
                break;
            case 'down':
                startAngle = Math.PI / 4;
                endAngle = 3 * Math.PI / 4;
                break;
        }
        
        this.debugGraphics.beginPath();
        this.debugGraphics.arc(this.x, this.y, range, startAngle, endAngle);
        this.debugGraphics.strokePath();
    }
  }

  destroy() {
    // 销毁调试图形
    if (this.debugGraphics) {
      this.debugGraphics.destroy();
    }
    super.destroy();
  }
} 