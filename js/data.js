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
    { id: 'rare', name: 'Rare', dropRate: 0.10, color: '#3b82f6' },
    { id: 'epic', name: 'Epic', dropRate: 0.02, color: '#a855f7' },
    { id: 'legendary', name: 'Legendary', dropRate: 0.004, color: '#f97316' }
];

const INGREDIENT_TYPES = ['Fangs', 'Hide', 'Bones', 'Essence', 'Claws'];

// ------------------------------------------------------------
// CITIES & SETTLEMENTS
// ------------------------------------------------------------
const CITIES = [
    {
        id: 'millbrook',
        name: 'Millbrook',
        description: 'A peaceful farming village troubled by creatures from nearby woods.',
        maxReputation: 1000
    },
    {
        id: 'ironhold',
        name: 'Ironhold',
        description: 'A fortified mining town built into the mountainside.',
        maxReputation: 1500
    },
    {
        id: 'ravenshire',
        name: 'Ravenshire',
        description: 'An ancient city shrouded in mystery and dark history.',
        maxReputation: 2000
    }
];

// ------------------------------------------------------------
// QUESTS (Jobs from city boards)
// Each quest references a zone and has unlock conditions
// ------------------------------------------------------------
const QUESTS = [
    // Millbrook Quests
    {
        id: 'millbrook_1',
        cityId: 'millbrook',
        name: 'Clear the Whispering Woods',
        description: 'Goblins have been raiding farms. Drive them out.',
        zoneId: 'whispering_woods',
        reputationRequired: 0,
        reputationReward: 150,
        goldReward: 80,
        unlockConditions: []
    },
    {
        id: 'millbrook_2',
        cityId: 'millbrook',
        name: 'Wolves at the Gate',
        description: 'A wolf pack has grown too bold. Thin their numbers.',
        zoneId: 'moonhowl_den',
        reputationRequired: 0,
        reputationReward: 200,
        goldReward: 120,
        unlockConditions: []
    },
    {
        id: 'millbrook_3',
        cityId: 'millbrook',
        name: 'The Bandit Camp',
        description: 'Bandits have set up camp near the trade road.',
        zoneId: 'thornback_camp',
        reputationRequired: 300,
        reputationReward: 300,
        goldReward: 200,
        unlockConditions: ['ironhold_1']
    },
    {
        id: 'millbrook_4',
        cityId: 'millbrook',
        name: 'The Ancient Grove',
        description: 'Something dark has awakened in the sacred grove.',
        zoneId: 'ancient_grove',
        reputationRequired: 600,
        reputationReward: 350,
        goldReward: 300,
        unlockConditions: ['ironhold_2', 'ravenshire_1']
    },

    // Ironhold Quests
    {
        id: 'ironhold_1',
        cityId: 'ironhold',
        name: 'Clear the Mine Shaft',
        description: 'Creatures have infested the lower mine levels.',
        zoneId: 'crystal_mines',
        reputationRequired: 0,
        reputationReward: 200,
        goldReward: 150,
        unlockConditions: ['millbrook_1']
    },
    {
        id: 'ironhold_2',
        cityId: 'ironhold',
        name: 'The Spider Nest',
        description: 'Giant spiders block access to valuable ore deposits.',
        zoneId: 'webbed_caverns',
        reputationRequired: 200,
        reputationReward: 300,
        goldReward: 220,
        unlockConditions: ['millbrook_2']
    },
    {
        id: 'ironhold_3',
        cityId: 'ironhold',
        name: 'Troll Trouble',
        description: 'A cave troll clan threatens the miners.',
        zoneId: 'troll_warrens',
        reputationRequired: 500,
        reputationReward: 400,
        goldReward: 350,
        unlockConditions: ['ravenshire_2']
    },
    {
        id: 'ironhold_4',
        cityId: 'ironhold',
        name: 'The Deep Tunnels',
        description: 'Ancient horrors lurk in tunnels beneath the mountain.',
        zoneId: 'abyssal_depths',
        reputationRequired: 900,
        reputationReward: 500,
        goldReward: 500,
        unlockConditions: ['millbrook_4', 'ravenshire_3']
    },

    // Ravenshire Quests
    {
        id: 'ravenshire_1',
        cityId: 'ravenshire',
        name: 'The Haunted Cemetery',
        description: 'The dead no longer rest in peace.',
        zoneId: 'restless_cemetery',
        reputationRequired: 0,
        reputationReward: 250,
        goldReward: 180,
        unlockConditions: ['millbrook_2', 'ironhold_1']
    },
    {
        id: 'ravenshire_2',
        cityId: 'ravenshire',
        name: 'Cursed Manor',
        description: 'Lord Blackwood\'s manor has become a den of evil.',
        zoneId: 'blackwood_manor',
        reputationRequired: 250,
        reputationReward: 350,
        goldReward: 280,
        unlockConditions: ['millbrook_3']
    },
    {
        id: 'ravenshire_3',
        cityId: 'ravenshire',
        name: 'The Necropolis',
        description: 'An ancient burial ground where dark magic festers.',
        zoneId: 'forgotten_necropolis',
        reputationRequired: 700,
        reputationReward: 500,
        goldReward: 450,
        unlockConditions: ['ironhold_3']
    },
    {
        id: 'ravenshire_4',
        cityId: 'ravenshire',
        name: 'The Lich\'s Tower',
        description: 'End the undead menace at its source.',
        zoneId: 'tower_of_shadows',
        reputationRequired: 1200,
        reputationReward: 600,
        goldReward: 600,
        unlockConditions: ['ironhold_4']
    }
];

// ------------------------------------------------------------
// ZONES (Combat areas tied to quests)
// ------------------------------------------------------------
const ZONES = [
    // Millbrook Zones (Forest themed)
    {
        id: 'whispering_woods',
        name: 'Whispering Woods',
        tier: 1,
        enemies: [
            { name: 'Goblin Scout', baseHp: 35, xpDrop: [8, 12] },
            { name: 'Goblin Warrior', baseHp: 45, xpDrop: [10, 15] },
            { name: 'Goblin Shaman', baseHp: 30, xpDrop: [12, 18] }
        ],
        boss: { name: 'Goblin Chieftain', baseHp: 180, xpDrop: [60, 90] }
    },
    {
        id: 'moonhowl_den',
        name: 'Moonhowl Den',
        tier: 1,
        enemies: [
            { name: 'Grey Wolf', baseHp: 50, xpDrop: [10, 15] },
            { name: 'Dire Wolf', baseHp: 65, xpDrop: [14, 20] },
            { name: 'Shadow Wolf', baseHp: 55, xpDrop: [12, 18] }
        ],
        boss: { name: 'Alpha Werewolf', baseHp: 220, xpDrop: [80, 120] }
    },
    {
        id: 'thornback_camp',
        name: 'Thornback Camp',
        tier: 2,
        enemies: [
            { name: 'Bandit Thug', baseHp: 70, xpDrop: [18, 25] },
            { name: 'Bandit Archer', baseHp: 55, xpDrop: [20, 28] },
            { name: 'Bandit Enforcer', baseHp: 90, xpDrop: [22, 32] }
        ],
        boss: { name: 'Bandit Lord', baseHp: 300, xpDrop: [100, 150] }
    },
    {
        id: 'ancient_grove',
        name: 'Ancient Grove',
        tier: 3,
        enemies: [
            { name: 'Corrupted Treant', baseHp: 120, xpDrop: [35, 50] },
            { name: 'Blight Sprite', baseHp: 80, xpDrop: [30, 45] },
            { name: 'Fungal Horror', baseHp: 100, xpDrop: [32, 48] }
        ],
        boss: { name: 'Elder Corruption', baseHp: 450, xpDrop: [180, 250] }
    },

    // Ironhold Zones (Cave/Mine themed)
    {
        id: 'crystal_mines',
        name: 'Crystal Mines',
        tier: 1,
        enemies: [
            { name: 'Cave Bat', baseHp: 40, xpDrop: [10, 14] },
            { name: 'Mine Crawler', baseHp: 55, xpDrop: [12, 18] },
            { name: 'Crystal Beetle', baseHp: 60, xpDrop: [14, 20] }
        ],
        boss: { name: 'Gem Guardian', baseHp: 200, xpDrop: [70, 100] }
    },
    {
        id: 'webbed_caverns',
        name: 'Webbed Caverns',
        tier: 2,
        enemies: [
            { name: 'Giant Spider', baseHp: 75, xpDrop: [20, 28] },
            { name: 'Venomous Lurker', baseHp: 65, xpDrop: [22, 30] },
            { name: 'Brood Mother', baseHp: 90, xpDrop: [25, 35] }
        ],
        boss: { name: 'Spider Queen', baseHp: 320, xpDrop: [120, 170] }
    },
    {
        id: 'troll_warrens',
        name: 'Troll Warrens',
        tier: 3,
        enemies: [
            { name: 'Cave Troll', baseHp: 130, xpDrop: [38, 55] },
            { name: 'Rock Troll', baseHp: 150, xpDrop: [42, 60] },
            { name: 'Troll Berserker', baseHp: 110, xpDrop: [40, 58] }
        ],
        boss: { name: 'Troll King', baseHp: 500, xpDrop: [200, 280] }
    },
    {
        id: 'abyssal_depths',
        name: 'Abyssal Depths',
        tier: 4,
        enemies: [
            { name: 'Deep Dweller', baseHp: 160, xpDrop: [55, 80] },
            { name: 'Void Crawler', baseHp: 140, xpDrop: [50, 75] },
            { name: 'Abyssal Horror', baseHp: 180, xpDrop: [60, 90] }
        ],
        boss: { name: 'The Nameless One', baseHp: 700, xpDrop: [300, 420] }
    },

    // Ravenshire Zones (Undead/Dark themed)
    {
        id: 'restless_cemetery',
        name: 'Restless Cemetery',
        tier: 2,
        enemies: [
            { name: 'Shambling Zombie', baseHp: 80, xpDrop: [18, 26] },
            { name: 'Skeletal Warrior', baseHp: 60, xpDrop: [16, 24] },
            { name: 'Restless Spirit', baseHp: 50, xpDrop: [20, 28] }
        ],
        boss: { name: 'Grave Warden', baseHp: 280, xpDrop: [100, 140] }
    },
    {
        id: 'blackwood_manor',
        name: 'Blackwood Manor',
        tier: 2,
        enemies: [
            { name: 'Possessed Servant', baseHp: 70, xpDrop: [22, 32] },
            { name: 'Wailing Banshee', baseHp: 55, xpDrop: [25, 36] },
            { name: 'Shadow Wraith', baseHp: 65, xpDrop: [24, 34] }
        ],
        boss: { name: 'Lord Blackwood', baseHp: 350, xpDrop: [140, 200] }
    },
    {
        id: 'forgotten_necropolis',
        name: 'Forgotten Necropolis',
        tier: 3,
        enemies: [
            { name: 'Bone Golem', baseHp: 140, xpDrop: [45, 65] },
            { name: 'Death Knight', baseHp: 120, xpDrop: [50, 70] },
            { name: 'Spectral Mage', baseHp: 90, xpDrop: [48, 68] }
        ],
        boss: { name: 'Necromancer Prime', baseHp: 480, xpDrop: [220, 300] }
    },
    {
        id: 'tower_of_shadows',
        name: 'Tower of Shadows',
        tier: 4,
        enemies: [
            { name: 'Lich Acolyte', baseHp: 150, xpDrop: [60, 85] },
            { name: 'Soul Devourer', baseHp: 170, xpDrop: [65, 95] },
            { name: 'Shadow Demon', baseHp: 160, xpDrop: [62, 90] }
        ],
        boss: { name: 'Lich Lord Malachar', baseHp: 800, xpDrop: [400, 550] }
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
