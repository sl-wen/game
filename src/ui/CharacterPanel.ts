import { CharacterStats, STAT_LABELS } from '../config/character';

export class CharacterPanel {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private background: Phaser.GameObjects.Rectangle;
    private panelBorder: Phaser.GameObjects.Rectangle;
    private statTexts: Phaser.GameObjects.Text[] = [];
    private visible: boolean = false;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.container = scene.add.container(0, 0);
        this.container.setDepth(100);
        
        // 获取相机视口大小
        const camera = scene.cameras.main;
        const panelWidth = 180; // 固定宽度
        const panelHeight = 280; // 固定高度
        const offsetX = 100; // 与角色的水平偏移
        const offsetY =     0; // 与角色的垂直偏移
        
        // 创建像素风格背景
        this.background = scene.add.rectangle(
            offsetX,
            offsetY,
            panelWidth,
            panelHeight,
            0x2a2a2a,
            0.85 // 稍微透明
        );
        
        // 创建内边框
        const innerBorder = scene.add.rectangle(
            offsetX,
            offsetY,
            panelWidth - 4,
            panelHeight - 4,
            0x3a3a3a,
            0.9
        );
        
        // 创建外边框
        this.panelBorder = scene.add.rectangle(
            offsetX,
            offsetY,
            panelWidth,
            panelHeight,
            0x4a4a4a,
            0
        );
        this.panelBorder.setStrokeStyle(2, 0x6a6a6a);
        
        // 添加到容器
        this.container.add([this.background, innerBorder, this.panelBorder]);

        // 添加标题
        const title = scene.add.text(
            offsetX,
            offsetY - panelHeight * 0.45,
            '角色属性',
            {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: 'monospace',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        
        // 添加像素风格装饰线
        const decorLine = scene.add.rectangle(
            offsetX,
            title.y + 15,
            panelWidth - 20,
            2,
            0x6a6a6a
        );

        this.container.add([title, decorLine]);

        // 初始化属性文本
        this.initializeStatTexts(offsetX, offsetY, panelWidth, panelHeight);
        
        // 默认隐藏
        this.container.setVisible(false);
    }

    private initializeStatTexts(offsetX: number, offsetY: number, panelWidth: number, panelHeight: number): void {
        const startY = offsetY - panelHeight * 0.35;
        const spacing = 22;
        const startX = offsetX - panelWidth * 0.35;

        Object.entries(STAT_LABELS).forEach(([key, label], index) => {
            const text = this.scene.add.text(
                startX,
                startY + spacing * index,
                `${label}: 0`,
                {
                    fontSize: '14px',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    stroke: '#000000',
                    strokeThickness: 1
                }
            );
            this.statTexts.push(text);
            this.container.add(text);
        });
    }

    public updatePosition(x: number, y: number): void {
        this.container.setPosition(x, y);
    }

    public updateStats(stats: CharacterStats): void {
        const texts = [
            `${STAT_LABELS.level}: ${stats.level}`,
            `${STAT_LABELS.exp}: ${stats.exp}/${stats.maxExp}`,
            `${STAT_LABELS.hp}: ${stats.hp}/${stats.maxHp}`,
            `${STAT_LABELS.mp}: ${stats.mp}/${stats.maxMp}`,
            `${STAT_LABELS.strength}: ${stats.strength}`,
            `${STAT_LABELS.agility}: ${stats.agility}`,
            `${STAT_LABELS.vitality}: ${stats.vitality}`,
            `${STAT_LABELS.spirit}: ${stats.spirit}`,
            `${STAT_LABELS.innerPower}: ${stats.innerPower}`
        ];

        texts.forEach((text, index) => {
            if (this.statTexts[index]) {
                this.statTexts[index].setText(text);
            }
        });
    }

    public toggle(): void {
        this.visible = !this.visible;
        this.container.setVisible(this.visible);
    }

    public isVisible(): boolean {
        return this.visible;
    }

    public destroy(): void {
        this.container.destroy();
    }
} 