export interface EnemyStats {
    hp: number;
    maxHp: number;
    speed: number;
    damage: number;
    detectionRange: number;  // 检测玩家的范围
    attackRange: number;     // 攻击范围
}

export interface EnemyConfig {
    scale: number;
    hitbox: {
        width: number;
        height: number;
        offsetX: number;
        offsetY: number;
    };
    stats: EnemyStats;
    ai: {
        patrolRadius: number;    // 巡逻半径
        patrolWaitTime: number;  // 巡逻点等待时间
        chaseSpeed: number;      // 追击速度倍率
        attackCooldown: number;  // 攻击冷却时间
    };
}

export const BANDIT_CONFIG: EnemyConfig = {
    scale: 1,
    hitbox: {
        width: 12,
        height: 14,
        offsetX: 2,
        offsetY: 2
    },
    stats: {
        hp: 50,
        maxHp: 50,
        speed: 50,
        damage: 10,
        detectionRange: 150,
        attackRange: 20
    },
    ai: {
        patrolRadius: 100,
        patrolWaitTime: 2000,
        chaseSpeed: 1.5,
        attackCooldown: 1000
    }
}; 