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
        this.updateAI();
    }

    private updateAI(): void {
        // 每100ms更新一次AI状态
        this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                const distanceToPlayer = this.player ? 
                    Phaser.Math.Distance.Between(
                        this.x, this.y,
                        this.player.x, this.player.y
                    ) : Infinity;

                // 状态机逻辑
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

                this.updateStateText();
            },
            loop: true
        });
    }

    private handleIdleState(distanceToPlayer: number): void {
        if (distanceToPlayer <= this.stats.detectionRange) {
            this.setEnemyState('chase');
        } else if (Date.now() - this.lastStateChangeTime > this.config.ai.patrolWaitTime) {
            this.setEnemyState('patrol');
            this.setNewPatrolTarget();
        }
    }

    private handlePatrolState(distanceToPlayer: number): void {
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
        if (!this.player) return;

        // 只有当距离超过检测范围的1.5倍，并且距离出生点超过巡逻半径时才返回
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
        if (distanceToPlayer > this.stats.attackRange) {
            this.setEnemyState('chase');
            return;
        }

        const currentTime = Date.now();
        if (currentTime - this.lastAttackTime >= this.config.ai.attackCooldown) {
            this.attack();
            this.lastAttackTime = currentTime;
        }
    }

    private handleReturnState(): void {
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
        const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(velocityX, velocityY);

        // 更新朝向
        this.flipX = velocityX < 0;
    }

    private setNewPatrolTarget(): void {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.config.ai.patrolRadius;
        
        this.targetPoint = new Phaser.Math.Vector2(
            this.spawnPoint.x + Math.cos(angle) * distance,
            this.spawnPoint.y + Math.sin(angle) * distance
        );
    }

    private setEnemyState(newState: EnemyState): void {
        if (this.state !== newState) {
            this.state = newState;
            this.lastStateChangeTime = Date.now();
        }
    }

    private attack(): void {
        if (!this.player) return;
        
        // 播放攻击动画
        this.play('bandit_attack', true);
        
        // 造成伤害
        // TODO: 实现玩家受伤逻辑
    }

    public takeDamage(damage: number): void {
        this.stats.hp = Math.max(0, this.stats.hp - damage);
        this.updateHealthBar();
        
        if (this.stats.hp <= 0) {
            this.die();
        }
    }

    private die(): void {
        // 播放死亡动画
        this.play('bandit_die', true);
        this.once('animationcomplete', () => {
            this.destroy();
        });
    }

    private updateHealthBar(): void {
        this.healthBar.clear();
        
        // 血条背景
        this.healthBar.fillStyle(0x000000, 0.5);
        this.healthBar.fillRect(-20, -25, 40, 5);
        
        // 血条
        const healthPercentage = this.stats.hp / this.stats.maxHp;
        this.healthBar.fillStyle(0xff0000, 1);
        this.healthBar.fillRect(-20, -25, 40 * healthPercentage, 5);
    }

    private updateStateText(): void {
        this.stateText.setText(this.state);
        this.stateText.setPosition(this.x - 15, this.y - 35);
    }

    update(): void {
        // 更新血条位置
        this.healthBar.setPosition(this.x, this.y);
        
        // 根据移动更新动画
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (Math.abs(body.velocity.x) > 10 || Math.abs(body.velocity.y) > 10) {
            this.play('bandit_walk', true);
        } else if (this.state !== 'attack') {
            this.play('bandit_idle', true);
        }
    }

    destroy(): void {
        this.healthBar.destroy();
        this.stateText.destroy();
        super.destroy();
    }

    // 重写基类的setState方法以满足类型要求
    setState(value: string | number): this {
        super.setState(value);
        return this;
    }
} 