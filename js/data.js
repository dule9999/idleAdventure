// ============================================================
// GAME DATA & CONSTANTS
// ============================================================

// ------------------------------------------------------------
// GAME CONFIGURATION
// ------------------------------------------------------------
const GAME_CONFIG = {
    ENEMIES_PER_STAGE: [3, 4, 5, 6],
    BASE_ENEMY_DAMAGE: 5,
    AREA_PROGRESS_MAX: 8,
    AREA_DAMAGE_BONUS: 1,
    BOSS_DAMAGE_BONUS: 5,
    XP_LEVEL_MULTIPLIER: 1.5,
    STAT_POINTS_PER_LEVEL: 3,
    // Forge improvement settings
    MAX_IMPROVEMENT_LEVEL: 3,
    IMPROVE_COST_PERCENT: 0.25, // 25% of item cost per improvement
    IMPROVE_BONUS: {
        weapon: 2,  // +2 damage per improvement level
        armor: 10   // +10 HP per improvement level
    }
};

// ------------------------------------------------------------
// INGREDIENT TIERS (drop rates for monster parts)
// ------------------------------------------------------------
const INGREDIENT_TIERS = [
    { id: 'common', name: 'Common', dropRate: 0.50, color: '#9ca3af' },
    { id: 'uncommon', name: 'Uncommon', dropRate: 0.15, color: '#22c55e' },
    { id: 'rare', name: 'Rare', dropRate: 0.05, color: '#3b82f6' },
    { id: 'epic', name: 'Epic', dropRate: 0.015, color: '#a855f7' },
    { id: 'legendary', name: 'Legendary', dropRate: 0.005, color: '#f97316' }
];

const INGREDIENT_TYPES = ['Fangs', 'Hide', 'Bones', 'Essence', 'Claws'];

// ------------------------------------------------------------
// REPUTATION TIERS
// ------------------------------------------------------------
const REPUTATION_TIERS = [
    { id: 'unknown', name: 'Unknown', threshold: 0, required: 100 },
    { id: 'neutral', name: 'Neutral', threshold: 100, required: 500 },
    { id: 'friendly', name: 'Friendly', threshold: 600, required: 1000 },
    { id: 'respected', name: 'Respected', threshold: 1600, required: 2500 },
    { id: 'honored', name: 'Honored', threshold: 4100, required: 5000 },
    { id: 'exalted', name: 'Exalted', threshold: 9100, required: 0 }  // Max tier
];

// ------------------------------------------------------------
// CITIES & SETTLEMENTS
// ------------------------------------------------------------
const CITIES = [
    {
        id: 'wilderness',
        name: 'Wilderness',
        description: 'The untamed lands outside civilization. A place to hunt and gather resources.',
        hasReputation: false
    },
    {
        id: 'millbrook',
        name: 'Millbrook',
        description: 'A peaceful farming village besieged by goblin raiders from the nearby woods.',
        hasReputation: true
    }
];

// ------------------------------------------------------------
// ENEMY TYPES (Base stats for each creature type)
// HP and XP scale with level: base * (1 + 0.2 * (level - 1))
// ------------------------------------------------------------
const ENEMY_TYPES = {
    // Wilderness creatures (weak, fixed stats - no scaling)
    wild_rat: { name: 'Wild Rat', baseHp: 12, baseXp: 2, baseGold: 1 },
    wild_boar: { name: 'Wild Boar', baseHp: 18, baseXp: 3, baseGold: 2 },
    snake: { name: 'Snake', baseHp: 10, baseXp: 2, baseGold: 1 },
    viper: { name: 'Viper', baseHp: 14, baseXp: 2, baseGold: 1 },
    wolf: { name: 'Wolf', baseHp: 20, baseXp: 3, baseGold: 2 },
    fox: { name: 'Fox', baseHp: 12, baseXp: 2, baseGold: 1 },
    wild_cat: { name: 'Wild Cat', baseHp: 15, baseXp: 2, baseGold: 1 },
    tiger: { name: 'Tiger', baseHp: 25, baseXp: 4, baseGold: 3 },
    bear: { name: 'Bear', baseHp: 30, baseXp: 5, baseGold: 3 },
    badger: { name: 'Badger', baseHp: 16, baseXp: 2, baseGold: 1 },

    // Goblin hierarchy (Millbrook)
    goblin_runt: { name: 'Goblin Runt', baseHp: 20, baseXp: 6 },
    goblin_scout: { name: 'Goblin Scout', baseHp: 28, baseXp: 8 },
    goblin_warrior: { name: 'Goblin Warrior', baseHp: 38, baseXp: 12 },
    goblin_archer: { name: 'Goblin Archer', baseHp: 30, baseXp: 10 },
    goblin_shaman: { name: 'Goblin Shaman', baseHp: 32, baseXp: 14 },
    goblin_berserker: { name: 'Goblin Berserker', baseHp: 45, baseXp: 16 },
    goblin_enforcer: { name: 'Goblin Enforcer', baseHp: 55, baseXp: 18 },
    goblin_marauder: { name: 'Goblin Marauder', baseHp: 50, baseXp: 17 },
    warg: { name: 'Warg', baseHp: 42, baseXp: 14 },
    warg_alpha: { name: 'Alpha Warg', baseHp: 60, baseXp: 20 },
    goblin_captain: { name: 'Goblin Captain', baseHp: 70, baseXp: 25 },
    goblin_warlord: { name: 'Goblin Warlord', baseHp: 90, baseXp: 35 },
    goblin_chieftain: { name: 'Goblin Chieftain', baseHp: 120, baseXp: 50 },
    goblin_king: { name: 'Goblin King', baseHp: 200, baseXp: 100 }
};

// ------------------------------------------------------------
// QUESTS (Jobs from city boards)
// Sequential unlock: quest N requires quest N-1 to be completed
// ------------------------------------------------------------
const QUESTS = [
    // Wilderness - infinite farming area (not a real quest)
    {
        id: 'wilderness_1',
        cityId: 'wilderness',
        name: 'Explore',
        description: 'Hunt wild creatures for gold and experience.',
        zoneId: 'wilderness_plains',
        reputationReward: 0,
        goldReward: 0,
        unlockConditions: [],
        isWilderness: true
    },

    // Millbrook - 10 sequential goblin quests
    // Reputation: 70 base, +20% each quest (total: 1817)
    {
        id: 'millbrook_1',
        cityId: 'millbrook',
        name: 'Goblin Scouts',
        description: 'Goblin scouts have been spotted near the farms. Drive them off.',
        zoneId: 'millbrook_zone_1',
        reputationReward: 70,
        goldReward: 30,
        unlockConditions: []
    },
    {
        id: 'millbrook_2',
        cityId: 'millbrook',
        name: 'Raiding Party',
        description: 'A small raiding party is targeting the outer farms.',
        zoneId: 'millbrook_zone_2',
        reputationReward: 84,
        goldReward: 50,
        unlockConditions: ['millbrook_1']
    },
    {
        id: 'millbrook_3',
        cityId: 'millbrook',
        name: 'The Archer Threat',
        description: 'Goblin archers are harassing travelers on the road.',
        zoneId: 'millbrook_zone_3',
        reputationReward: 101,
        goldReward: 75,
        unlockConditions: ['millbrook_2']
    },
    {
        id: 'millbrook_4',
        cityId: 'millbrook',
        name: 'Warg Riders',
        description: 'Goblins riding wargs have been attacking caravans.',
        zoneId: 'millbrook_zone_4',
        reputationReward: 121,
        goldReward: 100,
        unlockConditions: ['millbrook_3']
    },
    {
        id: 'millbrook_5',
        cityId: 'millbrook',
        name: 'The Shaman Circle',
        description: 'Goblin shamans are performing dark rituals in the woods.',
        zoneId: 'millbrook_zone_5',
        reputationReward: 145,
        goldReward: 150,
        unlockConditions: ['millbrook_4']
    },
    {
        id: 'millbrook_6',
        cityId: 'millbrook',
        name: 'Berserker Assault',
        description: 'Crazed goblin berserkers are launching attacks on the village.',
        zoneId: 'millbrook_zone_6',
        reputationReward: 174,
        goldReward: 200,
        unlockConditions: ['millbrook_5']
    },
    {
        id: 'millbrook_7',
        cityId: 'millbrook',
        name: 'The War Camp',
        description: 'A goblin war camp has been established nearby. It must be destroyed.',
        zoneId: 'millbrook_zone_7',
        reputationReward: 209,
        goldReward: 275,
        unlockConditions: ['millbrook_6']
    },
    {
        id: 'millbrook_8',
        cityId: 'millbrook',
        name: 'Captain\'s Guard',
        description: 'A goblin captain commands a formidable guard. Take them out.',
        zoneId: 'millbrook_zone_8',
        reputationReward: 251,
        goldReward: 375,
        unlockConditions: ['millbrook_7']
    },
    {
        id: 'millbrook_9',
        cityId: 'millbrook',
        name: 'The Warlord\'s Elite',
        description: 'The goblin warlord\'s elite troops are preparing a major assault.',
        zoneId: 'millbrook_zone_9',
        reputationReward: 301,
        goldReward: 500,
        unlockConditions: ['millbrook_8']
    },
    {
        id: 'millbrook_10',
        cityId: 'millbrook',
        name: 'Slay the Goblin King',
        description: 'End the goblin threat once and for all. Storm the king\'s stronghold.',
        zoneId: 'millbrook_zone_10',
        reputationReward: 361,
        goldReward: 750,
        unlockConditions: ['millbrook_9']
    }
];

// ------------------------------------------------------------
// ZONES (Combat areas tied to quests)
// enemyLevel scales enemy stats: hp = baseHp * (1 + 0.25 * (level - 1))
// ------------------------------------------------------------
const ZONES = [
    // Wilderness - easy farming zone (all level 1, randomized enemies)
    {
        id: 'wilderness_plains',
        name: 'Wilderness',
        tier: 1,
        enemyLevel: 1,
        enemies: ['wild_rat', 'wild_boar', 'snake', 'viper', 'wolf', 'fox', 'wild_cat', 'tiger', 'bear', 'badger'],
        boss: { type: 'bear', level: 1 }  // Boss type ignored for wilderness (random), but needed for structure
    },

    // Millbrook zones (1-10)
    {
        id: 'millbrook_zone_1',
        name: 'Farm Outskirts',
        tier: 1,
        enemyLevel: 1,
        enemies: ['goblin_runt', 'goblin_scout'],
        boss: { type: 'goblin_scout', level: 2 }
    },
    {
        id: 'millbrook_zone_2',
        name: 'Wheat Fields',
        tier: 1,
        enemyLevel: 2,
        enemies: ['goblin_scout', 'goblin_warrior'],
        boss: { type: 'goblin_warrior', level: 2 }
    },
    {
        id: 'millbrook_zone_3',
        name: 'Forest Road',
        tier: 1,
        enemyLevel: 2,
        enemies: ['goblin_scout', 'goblin_archer', 'goblin_warrior'],
        boss: { type: 'goblin_archer', level: 3 }
    },
    {
        id: 'millbrook_zone_4',
        name: 'Warg Den',
        tier: 2,
        enemyLevel: 3,
        enemies: ['warg', 'goblin_marauder'],
        boss: { type: 'warg_alpha', level: 3 }
    },
    {
        id: 'millbrook_zone_5',
        name: 'Dark Grove',
        tier: 2,
        enemyLevel: 3,
        enemies: ['goblin_shaman', 'goblin_warrior', 'goblin_archer'],
        boss: { type: 'goblin_shaman', level: 4 }
    },
    {
        id: 'millbrook_zone_6',
        name: 'Ravaged Farms',
        tier: 2,
        enemyLevel: 4,
        enemies: ['goblin_berserker', 'goblin_enforcer', 'goblin_marauder'],
        boss: { type: 'goblin_berserker', level: 4 }
    },
    {
        id: 'millbrook_zone_7',
        name: 'Goblin War Camp',
        tier: 3,
        enemyLevel: 4,
        enemies: ['goblin_enforcer', 'goblin_berserker', 'warg'],
        boss: { type: 'goblin_captain', level: 4 }
    },
    {
        id: 'millbrook_zone_8',
        name: 'Captain\'s Stronghold',
        tier: 3,
        enemyLevel: 5,
        enemies: ['goblin_captain', 'goblin_enforcer', 'warg_alpha'],
        boss: { type: 'goblin_captain', level: 5 }
    },
    {
        id: 'millbrook_zone_9',
        name: 'Warlord\'s Domain',
        tier: 3,
        enemyLevel: 5,
        enemies: ['goblin_enforcer', 'goblin_berserker', 'goblin_captain'],
        boss: { type: 'goblin_warlord', level: 5 }
    },
    {
        id: 'millbrook_zone_10',
        name: 'Goblin Throne',
        tier: 4,
        enemyLevel: 6,
        enemies: ['goblin_warlord', 'goblin_chieftain', 'warg_alpha'],
        boss: { type: 'goblin_king', level: 6 }
    }
];

// ------------------------------------------------------------
// SHOP ITEMS (Equipment tiers)
// ------------------------------------------------------------
const SHOP_TIERS = {
    weapon: [
        { name: 'Iron Sword', stat: 'damage', value: 5, cost: 50 },
        { name: 'Steel Blade', stat: 'damage', value: 12, cost: 200 },
        { name: "Knight's Sword", stat: 'damage', value: 25, cost: 600 },
        { name: 'Dragon Slayer', stat: 'damage', value: 50, cost: 1800 }
    ],
    armor: [
        { name: 'Leather Armor', stat: 'maxHp', value: 30, cost: 40 },
        { name: 'Chain Mail', stat: 'maxHp', value: 70, cost: 180 },
        { name: 'Plate Armor', stat: 'maxHp', value: 150, cost: 550 },
        { name: 'Dragon Scale', stat: 'maxHp', value: 300, cost: 1600 }
    ],
    accessory: [
        { name: 'Bronze Trinket', stat: 'all', value: 1, cost: 75 },
        { name: 'Silver Charm', stat: 'all', value: 2, cost: 200 },
        { name: 'Gold Amulet', stat: 'all', value: 3, cost: 450 },
        { name: 'Enchanted Relic', stat: 'all', value: 4, cost: 900 }
    ]
};

// ------------------------------------------------------------
// BUILDINGS (Unlock at certain levels)
// ------------------------------------------------------------
const BUILDINGS = [
    { id: 'forge', name: 'Forge', unlockLevel: 2, cost: 50, description: 'Craft weapons and armor.' },
    { id: 'alchemy_lab', name: 'Alchemy Lab', unlockLevel: 5, cost: 100, description: 'Brew potions for combat.' },
    { id: 'librarium', name: 'Librarium', unlockLevel: 8, cost: 250, description: 'Store lore about locations and monsters.' },
    { id: 'skill_shrine', name: 'Shrine of Skills', unlockLevel: 10, cost: 500, description: 'Learn combat skills and magic.' },
    { id: 'enchanting_table', name: 'Enchanting Table', unlockLevel: 20, cost: 2000, description: 'Imbue items with magic.' },
    { id: 'recruitment_center', name: 'Recruitment Center', unlockLevel: 30, cost: 5000, description: 'Hire heroes for your guild.' },
    { id: 'training_grounds', name: 'Training Grounds', unlockLevel: 40, cost: 10000, description: 'Train and level up guild heroes.' },
    { id: 'temple', name: 'Temple', unlockLevel: 50, cost: 50000, description: 'Perform rituals for temporary buffs.' },
];

// ------------------------------------------------------------
// HERO NAMES (For guild members)
// ------------------------------------------------------------
const HERO_FIRST_NAMES = [
    'Will', 'Ann', 'Marcus', 'Elena', 'Theron', 'Lyra', 'Gareth', 'Sera',
    'Roland', 'Ivy', 'Cedric', 'Mira', 'Aldric', 'Nora', 'Bran', 'Freya'
];

const HERO_TITLES = [
    'the Conqueror', 'the Slayer', 'the Bold', 'the Brave', 'the Swift',
    'the Mighty', 'the Fearless', 'the Unyielding', 'the Relentless',
    'the Valiant', 'the Unbroken', 'the Fierce', 'the Dauntless',
    'Dragonbane', 'Trollslayer', 'Shadowbane', 'the Undying'
];

// ------------------------------------------------------------
// STORY TEXT
// ------------------------------------------------------------
const STORY = {
    intro: {
        title: 'The Guild of Thornmere',
        paragraphs: [
            'You were once a renowned adventurer, feared by monsters and respected by kings.',
            'After years of battles, you decided to retire. You sold all your equipment and bought a piece of land in the kingdom of Thornmere to build an adventurer\'s guild - a place where others would do the fighting while you collected the profits.',
            'But fate had other plans. The night before the grand opening, a thief stole every last gold coin you had.',
            'Now, with nothing but a rusty sword and worn clothes, you must return to the adventuring life. Clear the lands, build your reputation, and perhaps one day, your guild will rise again.'
        ],
        buttonText: 'Begin Your Journey'
    }
};
