import { EnemyConfig, EnemyStats } from '../config/enemy';
import { Player } from './Player';

// 敌人状态类型定义
type EnemyState = 'idle' | 'patrol' | 'chase' | 'attack' | 'return';

/**
 * 敌人类
 * 实现了基本的 AI 行为，包括巡逻、追击、攻击等状态
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
    public state: EnemyState = 'idle';              // 当前状态
    private config: EnemyConfig;                    // 敌人配置
    private stats: EnemyStats;                      // 敌人属性
    private spawnPoint: Phaser.Math.Vector2;        // 出生点
    private targetPoint?: Phaser.Math.Vector2;      // 目标点
    private lastAttackTime: number = 0;             // 上次攻击时间
    private lastStateChangeTime: number = 0;         // 上次状态改变时间
    private player?: Player;                        // 玩家引用
    private healthBar: Phaser.GameObjects.Graphics; // 血条
    private stateText: Phaser.GameObjects.Text;     // 状态文本
    private isDead: boolean = false;                // 死亡标志
    private updateTimer?: Phaser.Time.TimerEvent;   // AI更新计时器
    private debugGraphics: Phaser.GameObjects.Graphics;
    private patrolTarget?: Phaser.Math.Vector2;      // 巡逻目标点
    private isAttacking: boolean = false;
    private lastPosition: Phaser.Math.Vector2;
    private stuckCheckTimer: number = 0;
    private readonly STUCK_CHECK_INTERVAL: number = 500; // 检查卡住的时间间隔（毫秒）
    private readonly STUCK_DISTANCE_THRESHOLD: number = 2; // 判定为卡住的距离阈值

    // 添加状态中文映射
    private readonly stateMap: Record<EnemyState, string> = {
        'idle': '待',
        'patrol': '巡',
        'chase': '追',
        'attack': '攻',
        'return': '返'
    };

    constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig, player: Player) {
        super(scene, x, y, 'bandit_idle', 0);
        
        // 初始化属性
        this.config = config;
        this.stats = { ...config.stats };
        this.spawnPoint = new Phaser.Math.Vector2(x, y);
        this.player = player;
        
        // 初始化物理属性
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // 设置精灵原点为中心点
        this.setOrigin(0.5, 0.5);
        
        // 设置大小和碰撞箱
        this.setScale(config.scale);
        // 设置碰撞箱大小为16x16（一个瓦片的大小）
        this.setSize(16, 16);
        // 将碰撞箱居中
        this.setOffset(0, 0);
        
        // 配置物理属性
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);  // 设置世界边界碰撞
        body.setBounce(0);                 // 设置弹性为0
        body.setDrag(500);                 // 设置阻力
        body.setAllowGravity(false);       // 禁用重力
        
        // 创建血条
        this.healthBar = scene.add.graphics();
        this.updateHealthBar();
        
        // 创建状态文本（用于调试）
        this.stateText = scene.add.text(0, 0, '', {
            fontSize: '10px',
            fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 3, y: 1 },
            align: 'center'
        });
        this.stateText.setOrigin(0.5, 0.5); // 设置文本原点为中心
        
        // 初始化调试图形
        this.debugGraphics = scene.add.graphics();
        
        // 开始AI循环
        this.updateTimer = scene.time.addEvent({
            delay: 100,
            callback: this.updateAI,
            callbackScope: this,
            loop: true
        });

        // 初始化位置记录
        this.lastPosition = new Phaser.Math.Vector2(x, y);
    }

    // AI更新循环
    private updateAI(): void {
        if (this.isDead || !this.player) return;

        // 计算与玩家的距离
        const distanceToPlayer = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.player.x, this.player.y
        );

        // 根据当前状态执行相应的处理
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

        // 更新状态文本和血条位置
        this.updateStateText();
        this.updateHealthBar();

        // 更新调试显示
        if (this.debugGraphics) {
            this.updateDebugDisplay();
        }
    }

    // 处理待机状态
    private handleIdleState(distanceToPlayer: number): void {
        if (this.isDead) return;

        // 如果玩家进入检测范围，切换到追击状态
        if (distanceToPlayer <= this.stats.detectionRange) {
            this.setEnemyState('chase');
        } 
        // 超过等待时间后开始巡逻
        else if (Date.now() - this.lastStateChangeTime > this.config.ai.patrolWaitTime) {
            this.setEnemyState('patrol');
            this.generatePatrolTarget();
        }
    }

    // 处理巡逻状态
    private handlePatrolState(distanceToPlayer: number): void {
        if (this.isDead) return;

        // 如果发现玩家，切换到追击状态
        if (distanceToPlayer <= this.stats.detectionRange) {
            this.setEnemyState('chase');
            return;
        }

        // 检查是否离开出生点太远
        const distanceToSpawn = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.spawnPoint.x, this.spawnPoint.y
        );

        if (distanceToSpawn > this.config.ai.patrolRadius) {
            this.setEnemyState('return');
            return;
        }

        // 如果没有巡逻目标，生成新的目标点
        if (!this.patrolTarget) {
            this.generatePatrolTarget();
            return;
        }

        // 检查是否到达巡逻点
        const distanceToTarget = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.patrolTarget.x, this.patrolTarget.y
        );

        if (distanceToTarget < 5) {
            // 到达目标点后，等待一段时间再生成新的目标点
            this.patrolTarget = undefined;
            this.setVelocity(0, 0);
            
            this.scene.time.delayedCall(
                this.config.ai.patrolWaitTime,
                () => {
                    if (this.state === 'patrol') {
                        this.generatePatrolTarget();
                    }
                },
                [],
                this
            );
            return;
        }

        // 移动到巡逻点
        this.moveToPosition(this.patrolTarget.x, this.patrolTarget.y, this.stats.moveSpeed * 0.8);
    }

    // 处理追击状态
    private handleChaseState(distanceToPlayer: number): void {
        if (this.isDead || !this.player) return;

        // 如果玩家超出追击范围，返回出生点
        if (distanceToPlayer > this.stats.detectionRange * 1.3) {
            this.setEnemyState('return');
            return;
        }

        // 如果在攻击范围内，切换到攻击状态
        if (distanceToPlayer <= this.stats.attackRange) {
            this.setEnemyState('attack');
            return;
        }

        // 追击玩家
        this.moveToPosition(this.player.x, this.player.y, this.stats.moveSpeed);
    }

    // 处理攻击状态
    private handleAttackState(distanceToPlayer: number): void {
        if (this.isDead) return;

        // 如果玩家超出攻击范围，恢复追击
        if (distanceToPlayer > this.stats.attackRange) {
            this.setEnemyState('chase');
            return;
        }

        // 检查攻击冷却
        if (Date.now() - this.lastAttackTime > this.config.ai.attackCooldown) {
            this.lastAttackTime = Date.now();
            
            // 播放攻击动画
            this.play('bandit_attack', true);
            
            // 创建攻击判定区域
            const attackBox = new Phaser.Geom.Rectangle(
                this.flipX ? this.x - 16 : this.x,
                this.y - 6,
                16,
                16
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

    // 处理返回状态
    private handleReturnState(): void {
        if (this.isDead) return;

        // 计算与出生点的距离
        const distanceToSpawn = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.spawnPoint.x, this.spawnPoint.y
        );

        // 如果已经接近出生点，恢复巡逻
        if (distanceToSpawn < 5) {
            this.setVelocity(0, 0);
            this.setEnemyState('patrol');
            return;
        }

        // 向出生点移动
        this.moveToPosition(this.spawnPoint.x, this.spawnPoint.y, this.stats.moveSpeed);
    }

    // 追击玩家
    private chasePlayer(): void {
        if (!this.player || this.isDead) return;

        // 计算到玩家的方向
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y);
        
        // 计算追击速度（基础速度 * 追击速度倍率）
        const chaseSpeed = this.stats.moveSpeed * this.config.ai.chaseSpeed;
        
        // 设置速度
        this.body.velocity.x = Math.cos(angle) * chaseSpeed;
        this.body.velocity.y = Math.sin(angle) * chaseSpeed;
        
        // 更新朝向
        this.setFlipX(this.body.velocity.x < 0);
    }

    // 巡逻
    private patrol(): void {
        if (this.isDead) return;

        // 如果没有目标点，生成新的目标点
        if (!this.patrolTarget) {
            this.generatePatrolTarget();
            return;
        }

        // 计算到目标点的方向
        const angle = Phaser.Math.Angle.Between(
            this.x, this.y,
            this.patrolTarget.x, this.patrolTarget.y
        );

        // 设置移动速度
        this.body.velocity.x = Math.cos(angle) * this.stats.moveSpeed;
        this.body.velocity.y = Math.sin(angle) * this.stats.moveSpeed;

        // 更新朝向
        this.setFlipX(this.body.velocity.x < 0);

        // 检查是否到达目标点
        if (Phaser.Math.Distance.Between(
            this.x, this.y,
            this.patrolTarget.x, this.patrolTarget.y
        ) < 5) {
            this.body.velocity.x = 0;
            this.body.velocity.y = 0;
            this.patrolTarget = null;
            
            // 等待一段时间后继续巡逻
            this.scene.time.delayedCall(
                this.config.ai.patrolWaitTime,
                () => this.generatePatrolTarget(),
                [],
                this
            );
        }
    }

    // 生成巡逻目标点
    private generatePatrolTarget(): void {
        if (this.isDead) return;

        let attempts = 0;
        const maxAttempts = 5;
        let validTarget = false;

        while (!validTarget && attempts < maxAttempts) {
            // 在出生点周围随机生成目标点
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.config.ai.patrolRadius;
            
            const newTarget = new Phaser.Math.Vector2(
                this.spawnPoint.x + Math.cos(angle) * distance,
                this.spawnPoint.y + Math.sin(angle) * distance
            );

            // 确保目标点在地图范围内
            const scene = this.scene as Phaser.Scene;
            if (scene.physics.world.bounds) {
                const bounds = scene.physics.world.bounds;
                newTarget.x = Phaser.Math.Clamp(newTarget.x, bounds.x, bounds.x + bounds.width);
                newTarget.y = Phaser.Math.Clamp(newTarget.y, bounds.y, bounds.y + bounds.height);
            }

            // 检查新目标点是否可达
            const ray = new Phaser.Geom.Line(this.x, this.y, newTarget.x, newTarget.y);
            validTarget = true; // 假设目标点有效

            // 如果目标点看起来可达，则使用它
            if (validTarget) {
                this.patrolTarget = newTarget;
                break;
            }

            attempts++;
        }

        // 如果无法找到有效的目标点，暂时进入待机状态
        if (!validTarget) {
            this.setEnemyState('idle');
        }
    }

    // 受到伤害
    takeDamage(damage: number): void {
        if (this.isDead) return;

        // 计算实际伤害
        const actualDamage = Math.max(1, damage - this.stats.defense);
        this.stats.currentHealth = Math.max(0, this.stats.currentHealth - actualDamage);
        
        // 更新血条
        this.updateHealthBar();
        
        // 检查是否死亡
        if (this.stats.currentHealth <= 0) {
            this.die();
            return;
        }
        
        // 受到攻击时切换到追击状态
        this.setEnemyState('chase');
    }

    // 更新血条显示
    private updateHealthBar(): void {
        if (this.isDead) {
            if (this.healthBar) {
                this.healthBar.clear();
            }
            return;
        }

        if (!this.healthBar) {
            this.healthBar = this.scene.add.graphics();
        }

        this.healthBar.clear();
        
        // 计算血条位置（在敌人头顶）
        const barWidth = 32;  // 血条宽度
        const barHeight = 4;  // 血条高度
        const barX = this.x - barWidth / 2;  // 居中对齐
        const barY = this.y - 15;  // 敌人头顶上方
        
        // 绘制血条背景（黑色半透明）
        this.healthBar.fillStyle(0x000000, 0.5);
        this.healthBar.fillRect(barX, barY, barWidth, barHeight);
        
        // 绘制当前血量（红色）
        const healthPercentage = this.stats.currentHealth / this.stats.maxHealth;
        this.healthBar.fillStyle(0xff0000, 1);
        this.healthBar.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
    }

    // 更新状态文本显示
    private updateStateText(): void {
        if (this.isDead) {
            this.stateText.setVisible(false);
            return;
        }

        // 更新状态文本位置（在血条上方）
        this.stateText.setPosition(this.x, this.y - 24);
        // 使用中文状态显示
        this.stateText.setText(this.stateMap[this.state]);
        this.stateText.setVisible(true);
    }

    // 设置敌人状态
    private setEnemyState(newState: EnemyState): void {
        if (this.isDead) return;

        if (this.state !== newState) {
            this.state = newState;
            this.lastStateChangeTime = Date.now();
            // 立即更新状态文本
            this.updateStateText();
        }
    }

    // 处理死亡
    private die(): void {
        this.isDead = true;
        this.state = 'idle';
        
        // 给玩家奖励经验值
        if (this.player) {
            this.player.gainExp(this.stats.exp);
        }
        
        // 停止所有移动
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        
        // 清除UI元素
        this.healthBar.clear();
        this.stateText.setVisible(false);
        
        // 播放死亡动画
        this.play('bandit_die', true).once('animationcomplete', () => {
            // 隐藏敌人
            this.setVisible(false);
            this.body.enable = false;
            
            // 设置重生计时器
            this.scene.time.delayedCall(
                this.config.ai.respawnTime,
                () => this.respawn(),
                [],
                this
            );
        });
    }

    // 添加重生方法
    private respawn(): void {
        // 重置状态
        this.isDead = false;
        this.isAttacking = false;
        this.stats.currentHealth = this.stats.maxHealth;
        
        // 重置位置到出生点
        this.setPosition(this.spawnPoint.x, this.spawnPoint.y);
        
        // 重新显示敌人
        this.setVisible(true);
        this.body.enable = true;
        
        // 重置动画
        this.play('bandit_idle', true);
        
        // 重置状态
        this.setEnemyState('idle');
        
        // 重新显示UI元素
        this.updateHealthBar();
        this.updateStateText();
        
        // 重新启动AI
        if (!this.updateTimer) {
            this.updateTimer = this.scene.time.addEvent({
                delay: 100,
                callback: this.updateAI,
                callbackScope: this,
                loop: true
            });
        }
    }

    // 重写基类的setState方法以满足类型要求
    setState(value: string | number): this {
        super.setState(value);
        return this;
    }

    private updateDebugDisplay() {
        // 清除之前的图形
        this.debugGraphics.clear();
        
        // 如果开启了调试模式
        if (this.scene.game.config.physics.arcade?.debug) {
            // 绘制攻击范围圆圈
            this.debugGraphics.lineStyle(2, 0xff0000, 0.5);
            this.debugGraphics.strokeCircle(this.x, this.y, this.stats.attackRange);
            
            // 绘制检测范围圆圈
            this.debugGraphics.lineStyle(2, 0x00ff00, 0.3);
            this.debugGraphics.strokeCircle(this.x, this.y, this.stats.detectionRange);
        }
    }

    destroy() {
        if (this.healthBar) {
            this.healthBar.destroy();
        }
        if (this.debugGraphics) {
            this.debugGraphics.destroy();
        }
        if (this.stateText) {
            this.stateText.destroy();
        }
        super.destroy();
    }

    // 检查玩家是否在指定范围内
    private isPlayerInRange(range: number): boolean {
        if (!this.player) return false;
        
        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.player.x, this.player.y
        );
        
        return distance <= range;
    }

    // 攻击玩家
    private attack(): void {
        if (this.isAttacking || Date.now() - this.lastAttackTime < this.config.ai.attackCooldown) {
            return;
        }

        this.isAttacking = true;
        this.lastAttackTime = Date.now();

        // 播放攻击动画
        this.play('bandit_attack', true);

        // 检查是否击中玩家
        if (this.isPlayerInRange(this.stats.attackRange)) {
            this.player.takeDamage(this.stats.attackDamage);
        }

        // 攻击动画结束后重置状态
        this.once('animationcomplete', () => {
            this.isAttacking = false;
        });
    }

    // 移动到指定位置
    private moveToPosition(x: number, y: number, speed: number): void {
        if (this.isDead) return;

        const currentTime = Date.now();

        // 检查是否卡住
        if (currentTime - this.stuckCheckTimer >= this.STUCK_CHECK_INTERVAL) {
            const distanceMoved = Phaser.Math.Distance.Between(
                this.x, this.y,
                this.lastPosition.x, this.lastPosition.y
            );

            // 如果移动距离小于阈值，认为可能卡住了
            if (distanceMoved < this.STUCK_DISTANCE_THRESHOLD) {
                // 尝试避障
                this.handleStuck(x, y, speed);
                return;
            }

            // 更新位置记录和计时器
            this.lastPosition.set(this.x, this.y);
            this.stuckCheckTimer = currentTime;
        }

        // 计算到目标的方向
        const angle = Phaser.Math.Angle.Between(this.x, this.y, x, y);
        
        // 设置速度
        this.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        
        // 更新朝向
        this.setFlipX(this.body.velocity.x < 0);
    }

    // 处理卡住的情况
    private handleStuck(targetX: number, targetY: number, speed: number): void {
        // 计算当前位置到目标的向量
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        
        // 尝试沿着x轴或y轴移动
        if (Math.abs(dx) > Math.abs(dy)) {
            // 优先水平移动
            this.setVelocity(
                Math.sign(dx) * speed,
                0
            );
        } else {
            // 优先垂直移动
            this.setVelocity(
                0,
                Math.sign(dy) * speed
            );
        }

        // 如果在巡逻状态下卡住，可以考虑重新生成巡逻点
        if (this.state === 'patrol') {
            this.generatePatrolTarget();
        }
    }

    update(): void {
        if (this.isDead) return;

        // ... existing movement and AI code ...

        // 更新血条位置
        this.updateHealthBar();
        
        // 更新调试显示
        if (this.debugGraphics) {
            this.updateDebugDisplay();
        }
    }
} 