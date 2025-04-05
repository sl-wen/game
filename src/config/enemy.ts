export interface EnemyStats {
    maxHealth: number;
    currentHealth: number;
    attackDamage: number;
    defense: number;
    speed: number;
    detectionRange: number;
    attackRange: number;
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
        patrolRadius: number;
        patrolWaitTime: number;
        attackCooldown: number;
        chaseSpeed: number;
    };
}

export const BANDIT_CONFIG: EnemyConfig = {
    scale: 1,
    hitbox: {
        width: 12,
        height: 16,
        offsetX: 2,
        offsetY: 0
    },
    stats: {
        maxHealth: 50,
        currentHealth: 50,
        attackDamage: 10,
        defense: 2,
        speed: 100,
        detectionRange: 150,
        attackRange: 30
    },
    ai: {
        patrolRadius: 100,
        patrolWaitTime: 2000,
        attackCooldown: 1000,
        chaseSpeed: 1.5
    }
}; 