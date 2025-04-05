export interface CharacterStats {
    level: number;
    exp: number;
    maxExp: number;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    strength: number;    // 力量
    agility: number;     // 敏捷
    vitality: number;    // 体力
    spirit: number;      // 精神
    innerPower: number;  // 内力
}

export const DEFAULT_STATS: CharacterStats = {
    level: 1,
    exp: 0,
    maxExp: 100,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    strength: 10,
    agility: 10,
    vitality: 10,
    spirit: 10,
    innerPower: 0
};

export const STAT_LABELS = {
    level: '等级',
    exp: '经验',
    hp: '生命',
    mp: '内力值',
    strength: '力量',
    agility: '敏捷',
    vitality: '体力',
    spirit: '精神',
    innerPower: '内功'
}; 