import { Scene } from 'phaser';
import { CharacterStats } from '../config/GameConfig';

/**
 * 角色面板类
 * 显示角色的属性信息和状态
 */
export class CharacterPanel {
    private scene: Scene;          // 场景引用
    private container: Phaser.GameObjects.Container;  // 容器对象
    private background: Phaser.GameObjects.Rectangle; // 背景
    private panelBorder: Phaser.GameObjects.Rectangle;
    private statsText: Phaser.GameObjects.Text;      // 属性文本
    private visible: boolean = false;      // 显示状态
    private stats?: CharacterStats;        // 角色属性

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
        this.hide();
    }

    /**
     * 更新角色属性
     * @param stats 角色属性对象
     */
    updateStats(stats: CharacterStats): void {
        this.stats = stats;
        if (this.visible) {
            this.updateDisplay();
        }
    }

    /**
     * 更新显示内容
     */
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

    /**
     * 显示面板
     */
    show(): void {
        this.visible = true;
        this.container.setVisible(true);
        if (this.visible) {
            this.updateDisplay();
        }
    }

    /**
     * 隐藏面板
     */
    hide(): void {
        this.visible = false;
        this.container.setVisible(false);
    }

    /**
     * 切换显示状态
     */
    toggle(): void {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * 获取当前显示状态
     */
    isVisible(): boolean {
        return this.visible;
    }

    /**
     * 设置面板位置
     * @param x X坐标
     * @param y Y坐标
     */
    updatePosition(x: number, y: number): void {
        // 跟随玩家位置，但保持固定偏移
        this.container.setPosition(x, y);
    }

    /**
     * 销毁面板
     */
    destroy(): void {
        this.container.destroy();
    }
} 