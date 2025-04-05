import { EnemyConfig, EnemyStats } from '../config/enemy';
import { Player } from './Player';

type EnemyState = 'idle' | 'patrol' | 'chase' | 'attack' | 'return';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
    public state: EnemyState = 'idle';
    private config: EnemyConfig;
    private stats: EnemyStats;
    private spawnPoint: Phaser.Math.Vector2;
    private targetPoint?: Phaser.Math.Vector2;
    private lastAttackTime: number = 0;
    private lastStateChangeTime: number = 0;
    private player?: Player;
    private healthBar: Phaser.GameObjects.Graphics;
    private stateText: Phaser.GameObjects.Text;
    private isDead: boolean = false;
    private updateTimer?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig, player: Player) {
        super(scene, x, y, 'bandit_idle', 0);
        
        this.config = config;
        this.stats = { ...config.stats };
        this.spawnPoint = new Phaser.Math.Vector2(x, y);
        this.player = player;
        
        // 初始化物理属性
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // 设置大小和碰撞箱
        this.setScale(config.scale);
        this.setSize(config.hitbox.width, config.hitbox.height);
        this.setOffset(config.hitbox.offsetX, config.hitbox.offsetY);
        
        // 配置物理属性
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        body.setBounce(0);
        body.setDrag(500);
        body.setAllowGravity(false);
        
        // 创建血条
        this.healthBar = scene.add.graphics();
        this.updateHealthBar();
        
        // 创建状态文本（用于调试）
        this.stateText = scene.add.text(0, 0, '', {
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#000000'
        });
        
        // 开始AI循环
        this.updateTimer = scene.time.addEvent({
            delay: 100,
            callback: this.updateAI,
            callbackScope: this,
            loop: true
        });
    }

    private updateAI(): void {
        if (this.isDead || !this.player) return;

        const distanceToPlayer = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.player.x, this.player.y
        );

        switch (this.state) {
            case 'idle':
                this.handleIdleState(distanceToPlayer);
                break;
            case 'patrol':
                this.handlePatrolState(distanceToPlayer);
                break;
            case 'chase':
                this.handleChaseState(distanceToPlayer);
                break;
            case 'attack':
                this.handleAttackState(distanceToPlayer);
                break;
            case 'return':
                this.handleReturnState();
                break;
        }

        // 更新UI元素
        this.updateHealthBar();
        this.updateStateText();
    }

    private handleIdleState(distanceToPlayer: number): void {
        if (this.isDead) return;

        if (distanceToPlayer <= this.stats.detectionRange) {
            this.setEnemyState('chase');
        } else if (Date.now() - this.lastStateChangeTime > this.config.ai.patrolWaitTime) {
            this.setEnemyState('patrol');
            this.setNewPatrolTarget();
        }
    }

    private handlePatrolState(distanceToPlayer: number): void {
        if (this.isDead) return;

        if (distanceToPlayer <= this.stats.detectionRange) {
            this.setEnemyState('chase');
            return;
        }

        if (!this.targetPoint) {
            this.setNewPatrolTarget();
            return;
        }

        const distanceToTarget = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.targetPoint.x, this.targetPoint.y
        );

        if (distanceToTarget < 5) {
            this.setEnemyState('idle');
            this.targetPoint = undefined;
            return;
        }

        this.moveToTarget(this.targetPoint, this.stats.speed);
    }

    private handleChaseState(distanceToPlayer: number): void {
        if (this.isDead || !this.player) return;

        if (distanceToPlayer > this.stats.detectionRange * 1.5) {
            const distanceToSpawn = Phaser.Math.Distance.Between(
                this.x, this.y,
                this.spawnPoint.x, this.spawnPoint.y
            );
            
            if (distanceToSpawn > this.config.ai.patrolRadius) {
                this.setEnemyState('return');
                return;
            }
        }

        if (distanceToPlayer <= this.stats.attackRange) {
            this.setEnemyState('attack');
            return;
        }

        this.moveToTarget(
            new Phaser.Math.Vector2(this.player.x, this.player.y),
            this.stats.speed * this.config.ai.chaseSpeed
        );
    }

    private handleAttackState(distanceToPlayer: number): void {
        if (this.isDead) return;

        if (distanceToPlayer > this.stats.attackRange) {
            this.setEnemyState('chase');
            return;
        }

        // 如果可以攻击
        if (Date.now() - this.lastAttackTime > this.config.ai.attackCooldown) {
            this.lastAttackTime = Date.now();
            
            // 播放攻击动画
            this.play('bandit_attack', true);
            
            // 创建攻击判定区域
            const attackBox = new Phaser.Geom.Rectangle(
                this.flipX ? this.x - 32 : this.x,
                this.y - 8,
                32,
                32
            );
            
            // 检查是否击中玩家
            if (this.player) {
                const playerBounds = this.player.getBounds();
                if (Phaser.Geom.Rectangle.Overlaps(attackBox, playerBounds)) {
                    this.player.takeDamage(this.stats.attackDamage);
                }
            }
        }
    }

    private handleReturnState(): void {
        if (this.isDead) return;

        // 首先检查是否发现玩家
        if (this.player) {
            const distanceToPlayer = Phaser.Math.Distance.Between(
                this.x, this.y,
                this.player.x, this.player.y
            );
            
            // 如果玩家在检测范围内，立即切换到追击状态
            if (distanceToPlayer <= this.stats.detectionRange) {
                this.setEnemyState('chase');
                return;
            }
        }

        const distanceToSpawn = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.spawnPoint.x, this.spawnPoint.y
        );

        if (distanceToSpawn < 5) {
            this.setEnemyState('idle');
            return;
        }

        this.moveToTarget(this.spawnPoint, this.stats.speed);
    }

    private moveToTarget(target: Phaser.Math.Vector2, speed: number): void {
        if (this.isDead) return;

        const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(velocityX, velocityY);

        // 更新朝向
        this.setFlipX(velocityX < 0);

        // 播放移动动画
        this.play('bandit_walk', true);
    }

    private setNewPatrolTarget(): void {
        if (this.isDead) return;

        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.config.ai.patrolRadius;
        
        this.targetPoint = new Phaser.Math.Vector2(
            this.spawnPoint.x + Math.cos(angle) * distance,
            this.spawnPoint.y + Math.sin(angle) * distance
        );
    }

    takeDamage(damage: number): void {
        if (this.isDead) return;

        const actualDamage = Math.max(1, damage - this.stats.defense);
        this.stats.currentHealth = Math.max(0, this.stats.currentHealth - actualDamage);
        
        // 更新血条
        this.updateHealthBar();
        
        // 如果生命值为0，处理死亡
        if (this.stats.currentHealth <= 0) {
            this.die();
            return;
        }
        
        // 受到攻击时切换到追击状态
        this.setEnemyState('chase');
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

    private updateStateText(): void {
        if (this.isDead) {
            this.stateText.setVisible(false);
            return;
        }

        // 更新状态文本位置（在血条上方）
        this.stateText.setPosition(this.x - 20, this.y - 35);
        this.stateText.setText(this.state);
    }

    private setEnemyState(newState: EnemyState): void {
        if (this.isDead) return;

        if (this.state !== newState) {
            this.state = newState;
            this.lastStateChangeTime = Date.now();
        }
    }

    private die(): void {
        this.isDead = true;
        this.state = 'idle';
        
        // 停止AI更新
        if (this.updateTimer) {
            this.updateTimer.destroy();
        }
        
        // 停止所有移动
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        
        // 清除血条和状态文本
        this.healthBar.clear();
        this.stateText.setVisible(false);
        
        // 播放死亡动画
        this.play('bandit_die', true).once('animationcomplete', () => {
            // 从敌人数组中移除
            const scene = this.scene as any;
            if (scene.enemies) {
                const index = scene.enemies.indexOf(this);
                if (index > -1) {
                    scene.enemies.splice(index, 1);
                }
            }
            
            // 销毁对象
            this.destroy();
        });
    }

    // 重写基类的setState方法以满足类型要求
    setState(value: string | number): this {
        super.setState(value);
        return this;
    }
} 