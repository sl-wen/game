import { Scene } from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { CharacterPanel } from '../ui/CharacterPanel';
import { BANDIT_CONFIG } from '../config/enemy';
import { CharacterStats } from '../config/GameConfig';
import { ANIMATION_CONFIG } from '../config/animations';

/**
 * 主场景类
 * 负责游戏场景的初始化、资源加载和游戏逻辑
 */
export class MainScene extends Scene {
    private player?: Player;
    private enemies: Enemy[] = [];
    private debugText?: Phaser.GameObjects.Text;
    private floorLayer?: Phaser.Tilemaps.TilemapLayer;
    private wallLayer?: Phaser.Tilemaps.TilemapLayer;
    private decorationLayer?: Phaser.Tilemaps.TilemapLayer;
    private floorTileset!: Phaser.Tilemaps.Tileset;
    private wallTileset!: Phaser.Tilemaps.Tileset;
    private interiorTileset!: Phaser.Tilemaps.Tileset;
    private characterPanel?: CharacterPanel;
    private menuKey?: Phaser.Input.Keyboard.Key;
    private decorations: Phaser.Physics.Arcade.StaticGroup;

    constructor() {
        super({ key: 'MainScene' });
    }

    /**
     * 预加载资源
     */
    preload(): void {
        // 添加加载事件监听器
        this.load.on('complete', () => {
            console.log('所有资源加载完成');
        });
        
        this.load.on('load', (file: any) => {
            console.log('成功加载资源:', file.key);
        });
        
        this.load.on('loaderror', (file: any) => {
            console.error('资源加载失败:', file.key);
        });

        try {
            // 加载角色动画
            this.load.spritesheet('samurai_idle', 
                'assets/Ninja Adventure - Asset Pack/Actor/Characters/Samurai/SeparateAnim/Idle.png',
                { frameWidth: 16, frameHeight: 16 }
            );
            
            this.load.spritesheet('samurai_walk',
                'assets/Ninja Adventure - Asset Pack/Actor/Characters/Samurai/SeparateAnim/Walk.png',
                { frameWidth: 16, frameHeight: 16 }
            );
            
            this.load.spritesheet('samurai_attack',
                'assets/Ninja Adventure - Asset Pack/Actor/Characters/Samurai/SeparateAnim/Attack.png',
                { frameWidth: 16, frameHeight: 16 }
            );
            
            this.load.spritesheet('samurai_defend',
                'assets/Ninja Adventure - Asset Pack/Actor/Characters/Samurai/SeparateAnim/Special1.png',
                { frameWidth: 16, frameHeight: 16 }
            );

            // 加载地图资源
            this.load.image('tiles_floor', 
                'assets/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetFloor.png'
            );
            
            this.load.image('tiles_wall',
                'assets/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/Interior/TilesetWallSimple.png'
            );
            
            this.load.image('tiles_interior',
                'assets/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/Interior/TilesetInterior.png'
            );

            // 加载敌人资源
            this.load.spritesheet('bandit_idle',
                'assets/Ninja Adventure - Asset Pack/Actor/Characters/Villager/SeparateAnim/Idle.png',
                { frameWidth: 16, frameHeight: 16 }
            );

            this.load.spritesheet('bandit_walk',
                'assets/Ninja Adventure - Asset Pack/Actor/Characters/Villager/SeparateAnim/Walk.png',
                { frameWidth: 16, frameHeight: 16 }
            );

            this.load.spritesheet('bandit_attack',
                'assets/Ninja Adventure - Asset Pack/Actor/Characters/Villager/SeparateAnim/Attack.png',
                { frameWidth: 16, frameHeight: 16 }
            );

            this.load.spritesheet('bandit_die',
                'assets/Ninja Adventure - Asset Pack/Actor/Characters/Villager/SeparateAnim/Dead.png',
                { frameWidth: 16, frameHeight: 16 }
            );

        } catch (error) {
            console.error('资源加载过程中发生错误:', error);
        }
    }

    /**
     * 创建场景
     */
    create(): void {
        this.createAnimations();
        this.createTilemap();
        this.createDebugText();
        this.createCharacterPanel();
        this.createEnemies();

        // 设置相机跟随
        this.cameras.main.startFollow(this.player!);
        this.cameras.main.setZoom(2);

        // 添加M键监听
        this.menuKey = this.input.keyboard.addKey('M');
        this.menuKey.on('down', () => {
            this.characterPanel?.toggle();
        });
    }

    /**
     * 创建地图
     */
    private createTilemap(): void {
        // 创建地图
        const map = this.make.tilemap({
            tileWidth: 16,
            tileHeight: 16,
            width: 40,
            height: 30
        });

        // 添加图块集
        this.floorTileset = map.addTilesetImage('tiles_floor', 'tiles_floor')!;
        this.wallTileset = map.addTilesetImage('tiles_wall', 'tiles_wall')!;
        this.interiorTileset = map.addTilesetImage('tiles_interior', 'tiles_interior')!;

        // 创建图层
        this.floorLayer = map.createBlankLayer('floor', this.floorTileset)!;
        this.wallLayer = map.createBlankLayer('wall', this.wallTileset)!;
        this.decorationLayer = map.createBlankLayer('decoration', this.interiorTileset)!;

        // 填充地板
        this.floorLayer.fill(24);

        // 创建墙壁
        for (let x = 0; x < map.width; x++) {
            this.wallLayer?.putTileAt(176, x, 0); // 上墙
            this.wallLayer?.putTileAt(192, x, map.height - 1); // 下墙
        }
        for (let y = 0; y < map.height; y++) {
            this.wallLayer?.putTileAt(176, 0, y); // 左墙
            this.wallLayer?.putTileAt(176, map.width - 1, y); // 右墙
        }

        // 添加装饰物
        // 木人桩区域 (左上)
        for (let x = 5; x < 10; x++) {
            for (let y = 5; y < 8; y++) {
                this.decorationLayer?.putTileAt(45, x, y);
            }
        }

        // 武器架区域 (右上)
        for (let x = map.width - 10; x < map.width - 5; x++) {
            for (let y = 5; y < 8; y++) {
                this.decorationLayer?.putTileAt(46, x, y);
            }
        }

        // 训练区域 (左下)
        for (let x = 5; x < 10; x++) {
            for (let y = map.height - 8; y < map.height - 5; y++) {
                this.decorationLayer?.putTileAt(47, x, y);
            }
        }

        // 休息区域 (右下)
        for (let x = map.width - 10; x < map.width - 5; x++) {
            for (let y = map.height - 8; y < map.height - 5; y++) {
                this.decorationLayer?.putTileAt(48, x, y);
            }
        }

        // 设置碰撞
        this.wallLayer?.setCollisionByExclusion([-1]);
        this.decorationLayer?.setCollisionByExclusion([-1]);

        // 启用物理世界边界
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // 创建玩家
        this.createPlayer();

        // 添加物理碰撞
        if (this.player) {
            // 添加与墙壁的碰撞
            this.physics.add.collider(this.player, this.wallLayer, undefined, undefined, this);
            
            // 添加与装饰物的碰撞
            this.physics.add.collider(this.player, this.decorationLayer, undefined, undefined, this);
        }

        // 开启调试显示
        const debugGraphics = this.add.graphics().setAlpha(0.7);
        this.wallLayer.renderDebug(debugGraphics, {
            tileColor: null,
            collidingTileColor: new Phaser.Display.Color(243, 134, 48, 128),
            faceColor: new Phaser.Display.Color(40, 39, 37, 255)
        });
        this.decorationLayer.renderDebug(debugGraphics, {
            tileColor: null,
            collidingTileColor: new Phaser.Display.Color(243, 48, 48, 128),
            faceColor: new Phaser.Display.Color(40, 39, 37, 255)
        });
    }

    /**
     * 创建玩家角色
     */
    private createPlayer(): void {
        const startPosition = { x: 200, y: 200 };
        this.player = new Player(this, startPosition.x, startPosition.y);
        this.add.existing(this.player);
    }

    /**
     * 创建调试文本
     */
    private createDebugText(): void {
        const style = {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000'
        };
        
        this.debugText = this.add.text(10, 10, '', style);
        this.debugText.setScrollFactor(0);
    }

    /**
     * 创建角色面板
     */
    private createCharacterPanel(): void {
        this.characterPanel = new CharacterPanel(this);
        if (this.player) {
            this.characterPanel.updateStats(this.player.getStats());
        }
    }

    /**
     * 创建敌人
     */
    private createEnemies(): void {
        // 创建几个敌人在不同位置
        const enemyPositions = [
            { x: 300, y: 150 },
            { x: 500, y: 300 },
            { x: 250, y: 400 }
        ];

        enemyPositions.forEach(pos => {
            const enemy = new Enemy(this, pos.x, pos.y, BANDIT_CONFIG, this.player!);
            this.enemies.push(enemy);

            // 添加与墙壁和装饰物的碰撞
            if (this.wallLayer) {
                this.physics.add.collider(enemy, this.wallLayer);
            }
            if (this.decorationLayer) {
                this.physics.add.collider(enemy, this.decorationLayer);
            }

            // 添加与玩家的碰撞
            if (this.player) {
                this.physics.add.collider(enemy, this.player);
            }

            // 添加与其他敌人的碰撞
            this.enemies.forEach(otherEnemy => {
                if (enemy !== otherEnemy) {
                    this.physics.add.collider(enemy, otherEnemy);
                }
            });
        });
    }

    /**
     * 创建动画
     */
    private createAnimations(): void {
        // 创建玩家动画
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('samurai_idle', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('samurai_walk', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'attack',
            frames: this.anims.generateFrameNumbers('samurai_attack', { start: 0, end: 3 }),
            frameRate: 12,
            repeat: 0
        });

        this.anims.create({
            key: 'defend',
            frames: this.anims.generateFrameNumbers('samurai_defend', { start: 0, end: 0 }),
            frameRate: 8,
            repeat: -1
        });

        // 创建敌人动画
        this.anims.create({
            key: 'bandit_idle',
            frames: this.anims.generateFrameNumbers('bandit_idle', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'bandit_walk',
            frames: this.anims.generateFrameNumbers('bandit_walk', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'bandit_attack',
            frames: this.anims.generateFrameNumbers('bandit_attack', { start: 0, end: 3 }),
            frameRate: 12,
            repeat: 0
        });

        this.anims.create({
            key: 'bandit_die',
            frames: this.anims.generateFrameNumbers('bandit_die', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: 0
        });
    }

    /**
     * 场景更新
     */
    update(): void {
        if (this.player && this.debugText) {
            this.player.update();
            this.debugText.setText(this.player.getDebugInfo());
            
            // 更新角色面板
            if (this.characterPanel?.isVisible()) {
                this.characterPanel.updateStats(this.player.getStats());
                this.characterPanel.updatePosition(this.player.x, this.player.y);
            }
        }

        // 更新敌人
        this.enemies.forEach(enemy => enemy.update());
    }
} 