// ============================================================
// GAME STATE MANAGEMENT
// ============================================================

const gameState = {
    // Meta
    introSeen: false,
    currentScreen: 'intro',
    currentTab: 'world',

    // Hero
    hero: {
        level: 1,
        xp: 0,
        xpToLevel: 100,
        gold: 0,
        hp: 100,
        maxHp: 100,
        baseStats: { str: 5, vit: 5, agi: 5, luk: 5 },
        statPoints: 0,
        clickDamage: 1,
        equipment: {
            weapon: { name: 'Rusty Sword', stat: 'damage', value: 2 },
            armor: { name: 'Cloth Shirt', stat: 'maxHp', value: 10 },
            accessory: null
        },
        equipmentTier: {
            weapon: 0,
            armor: 0,
            accessory: 0
        },
        equipmentLevel: {
            weapon: 0,
            armor: 0
        }
    },

    // City reputation
    cityReputation: {},

    // Completed quests
    completedQuests: [],

    // Current active quest (for job board collection)
    pendingRewards: [], // Quest IDs ready to collect rewards

    // Quest progress (stages within a quest's zone)
    questProgress: {}, // { questId: [false, false, false, false, false] }

    // Inventory - Monster ingredients
    ingredients: {},

    // Buildings
    unlockedBuildings: ['tent'],
    builtBuildings: ['tent'],

    // Guild Heroes
    heroes: [],
    nextHeroId: 1,
    commissionedHeroes: {}, // { cityId: heroId }

    // Current battle state
    battle: {
        active: false,
        questId: null,
        zoneId: null,
        stageIndex: 0,
        currentWave: 0,
        totalWaves: 0,
        enemy: null,
        xpEarned: 0,
        ingredientsEarned: []
    },

    // Game loop
    lastAutoAttack: 0,
    autoAttackInterval: 1000,
    gameLoopId: null,
    combatSpeed: 1,

    // Passive income tracking
    lastIncomeCollection: Date.now()
};

// Initialize city reputation
function initializeGameState() {
    CITIES.forEach(city => {
        gameState.cityReputation[city.id] = 0;
        gameState.commissionedHeroes[city.id] = null;
    });

    // Initialize quest progress
    QUESTS.forEach(quest => {
        gameState.questProgress[quest.id] = [false, false, false, false, false];
    });

    // Initialize ingredients inventory
    INGREDIENT_TIERS.forEach(tier => {
        INGREDIENT_TYPES.forEach(type => {
            const key = `${tier.id}_${type.toLowerCase()}`;
            gameState.ingredients[key] = 0;
        });
    });
}

// Call initialization
initializeGameState();

// ------------------------------------------------------------
// STATE HELPER FUNCTIONS
// ------------------------------------------------------------

function isQuestAvailable(questId) {
    const quest = QUESTS.find(q => q.id === questId);
    if (!quest) return false;

    // Already completed?
    if (gameState.completedQuests.includes(questId)) return false;

    // Check unlock conditions (previous quests that must be completed)
    for (const reqQuestId of quest.unlockConditions) {
        if (!gameState.completedQuests.includes(reqQuestId)) {
            return false;
        }
    }

    return true;
}

function isQuestInProgress(questId) {
    const progress = gameState.questProgress[questId];
    if (!progress) return false;

    // Quest is in progress if at least one stage is complete but not all
    const completedCount = progress.filter(s => s).length;
    return completedCount > 0 && completedCount < 5;
}

function isQuestComplete(questId) {
    const progress = gameState.questProgress[questId];
    return progress && progress.every(s => s);
}

function getAvailableQuestsForCity(cityId) {
    return QUESTS.filter(q =>
        q.cityId === cityId &&
        (isQuestAvailable(q.id) || isQuestInProgress(q.id) ||
         (isQuestComplete(q.id) && !gameState.completedQuests.includes(q.id)))
    );
}

function getCityMaxReputation(cityId) {
    const city = CITIES.find(c => c.id === cityId);
    return city ? city.maxReputation : 0;
}

function canCommissionHero(cityId) {
    const rep = gameState.cityReputation[cityId] || 0;
    const maxRep = getCityMaxReputation(cityId);
    return rep >= maxRep && !gameState.commissionedHeroes[cityId];
}

function getPassiveIncome() {
    let totalIncome = 0;

    Object.entries(gameState.commissionedHeroes).forEach(([cityId, heroId]) => {
        if (heroId !== null) {
            const hero = gameState.heroes.find(h => h.id === heroId);
            if (hero) {
                // Base income + level bonus
                totalIncome += 5 + hero.level * 2;
            }
        }
    });

    return totalIncome;
}

function collectPassiveIncome() {
    const now = Date.now();
    const elapsed = now - gameState.lastIncomeCollection;
    const minutes = elapsed / 60000;

    const incomePerMinute = getPassiveIncome();
    const earned = Math.floor(incomePerMinute * minutes);

    if (earned > 0) {
        gameState.hero.gold += earned;
        gameState.lastIncomeCollection = now;
    }

    return earned;
}

function addIngredient(tierId, type) {
    const key = `${tierId}_${type.toLowerCase()}`;
    if (gameState.ingredients[key] !== undefined) {
        gameState.ingredients[key]++;
        return true;
    }
    return false;
}

function checkBuildingUnlocks() {
    const newUnlocks = [];

    BUILDINGS.forEach(building => {
        if (gameState.hero.level >= building.unlockLevel &&
            !gameState.unlockedBuildings.includes(building.id)) {
            gameState.unlockedBuildings.push(building.id);
            newUnlocks.push(building);
        }
    });

    return newUnlocks;
}

function generateHeroName() {
    const firstName = HERO_FIRST_NAMES[Math.floor(Math.random() * HERO_FIRST_NAMES.length)];
    const title = HERO_TITLES[Math.floor(Math.random() * HERO_TITLES.length)];
    return `${firstName} ${title}`;
}
