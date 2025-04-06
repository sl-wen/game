import { CharacterStats, HitboxConfig } from './GameConfig';

/**
 * 敌人AI配置接口
 */
export interface EnemyAIConfig {
    patrolRadius: number;     // 巡逻范围半径
    patrolWaitTime: number;   // 巡逻等待时间
    chaseSpeed: number;       // 追击速度倍率
    attackCooldown: number;   // 攻击冷却时间
    respawnTime: number;      // 重生时间（毫秒）
}

/**
 * 敌人属性接口，继承自角色属性
 */
export interface EnemyStats extends CharacterStats {
    detectionRange: number;   // 检测范围
    attackRange: number;      // 攻击范围
}

/**
 * 敌人配置接口
 */
export interface EnemyConfig {
    scale: number;            // 敌人缩放比例
    hitbox: HitboxConfig;     // 碰撞箱配置
    stats: EnemyStats;        // 敌人属性
    ai: EnemyAIConfig;        // AI配置
}

/**
 * 土匪配置
 */
export const BANDIT_CONFIG: EnemyConfig = {
    // 外观配置
    scale: 1,
    hitbox: {
        width: 32,
        height: 32,
        offsetX: 16,
        offsetY: 16
    },
    
    // 属性配置
    stats: {
        level: 1,
        maxHealth: 100,
        currentHealth: 100,
        maxMp: 50,
        mp: 50,
        attackDamage: 10,
        defense: 5,
        moveSpeed: 50,        // 移动速度
        detectionRange: 100,  // 检测范围
        attackRange: 20,      // 攻击范围
        exp: 50              // 击杀获得经验值
    },
    
    // AI行为配置
    ai: {
        patrolRadius: 100,     // 巡逻半径
        patrolWaitTime: 2000,  // 巡逻间隔时间（毫秒）
        chaseSpeed: 1.5,       // 追击速度倍率
        attackCooldown: 1000,  // 攻击冷却时间（毫秒）
        respawnTime: 5000      // 重生时间（5秒）
    }
};

export const ENEMY_CONFIG: EnemyConfig = {
    scale: 1,
    hitbox: {
        width: 16,
        height: 16,
        offsetX: 0,
        offsetY: 0
    },
    stats: {
        maxHealth: 100,
        currentHealth: 100,
        maxMp: 50,
        mp: 50,
        attackDamage: 10,
        defense: 5,
        level: 1,
        exp: 30,             // 击杀获得经验值
        moveSpeed: 50,       // 敌人移动速度
        attackRange: 32,     // 敌人攻击距离
        detectionRange: 150  // 敌人检测范围
    },
    ai: {
        patrolRadius: 100,
        patrolWaitTime: 2000,
        attackCooldown: 1000,
        chaseSpeed: 1.2,    // 追击时的速度倍率
        respawnTime: 5000   // 重生时间（5秒）
    }
}; 