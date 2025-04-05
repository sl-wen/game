import { Scene } from 'phaser';
import { CharacterStats } from '../config/GameConfig';

export class CharacterPanel {
    private scene: Scene;
    private container: Phaser.GameObjects.Container;
    private background: Phaser.GameObjects.Rectangle;
    private panelBorder: Phaser.GameObjects.Rectangle;
    private statsText: Phaser.GameObjects.Text;
    private visible: boolean = false;
    private stats?: CharacterStats;

    constructor(scene: Scene) {
        this.scene = scene;
        this.container = scene.add.container(0, 0);
        this.container.setDepth(100);

        // 获取面板尺寸
        const panelWidth = 180;
        const panelHeight = 280;
        const offsetX = 100;
        const offsetY = 0;

        // 创建像素风格背景
        this.background = scene.add.rectangle(
            offsetX,
            offsetY,
            panelWidth,
            panelHeight,
            0x2a2a2a,
            0.85
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

        // 创建标题
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

        // 创建装饰线
        const decorLine = scene.add.rectangle(
            offsetX,
            title.y + 15,
            panelWidth - 20,
            2,
            0x6a6a6a
        );

        // 创建状态文本
        this.statsText = scene.add.text(
            offsetX - panelWidth * 0.35,
            offsetY - panelHeight * 0.35,
            '',
            {
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: 'monospace',
                stroke: '#000000',
                strokeThickness: 1,
                lineSpacing: 8
            }
        );

        // 添加所有元素到容器
        this.container.add([
            this.background,
            innerBorder,
            this.panelBorder,
            title,
            decorLine,
            this.statsText
        ]);

        // 默认隐藏
        this.container.setVisible(false);
    }

    updateStats(stats: CharacterStats): void {
        this.stats = stats;
        if (this.visible) {
            this.updateDisplay();
        }
    }

    private updateDisplay(): void {
        if (!this.stats) return;

        const text = [
            `等级: ${this.stats.level}`,
            `生命: ${this.stats.currentHealth}/${this.stats.maxHealth}`,
            `魔法: ${this.stats.mp}/${this.stats.maxMp}`,
            `经验: ${this.stats.exp}`,
            `攻击力: ${this.stats.attackDamage}`,
            `防御力: ${this.stats.defense}`
        ].join('\n');

        this.statsText.setText(text);
    }

    toggle(): void {
        this.visible = !this.visible;
        this.container.setVisible(this.visible);
        if (this.visible) {
            this.updateDisplay();
        }
    }

    isVisible(): boolean {
        return this.visible;
    }

    updatePosition(x: number, y: number): void {
        // 跟随玩家位置，但保持固定偏移
        this.container.setPosition(x, y);
    }
} 