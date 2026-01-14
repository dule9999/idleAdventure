// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getEffectiveStats() {
    const base = gameState.hero.baseStats;
    const equip = gameState.hero.equipment;
    const stats = { ...base };

    if (equip.accessory) {
        const s = equip.accessory.stat;
        if (s === 'all') {
            stats.str += equip.accessory.value;
            stats.vit += equip.accessory.value;
            stats.agi += equip.accessory.value;
            stats.luk += equip.accessory.value;
        } else if (s in stats) {
            stats[s] += equip.accessory.value;
        }
    }

    return stats;
}

function getDerivedStats() {
    const stats = getEffectiveStats();
    const equip = gameState.hero.equipment;
    const equipLevel = gameState.hero.equipmentLevel;

    let damage = 3 + stats.str;
    if (equip.weapon) {
        damage += equip.weapon.value;
        damage += equipLevel.weapon * GAME_CONFIG.IMPROVE_BONUS.weapon;
    }

    let maxHp = 50 + stats.vit * 10;
    if (equip.armor) {
        maxHp += equip.armor.value;
        maxHp += equipLevel.armor * GAME_CONFIG.IMPROVE_BONUS.armor;
    }

    const critChance = Math.min(50, 2 + stats.luk * 0.8);
    const attackInterval = Math.max(600, 2000 - stats.agi * 60);
    const goldBonus = 1 + stats.luk * 0.02;

    return { damage, maxHp, critChance, attackInterval, goldBonus };
}

function getXpToLevel(level) {
    return Math.floor(100 * Math.pow(GAME_CONFIG.XP_LEVEL_MULTIPLIER, level - 1));
}

function getClickUpgradeCost() {
    const currentLevel = gameState.hero.clickDamage;
    return Math.floor(20 + (currentLevel - 1) * 15 + Math.pow(currentLevel - 1, 1.5) * 5);
}

function getHeroTrainingCost(heroLevel) {
    return Math.floor(50 * Math.pow(1.5, heroLevel - 1));
}

function rollIngredientDrops() {
    const drops = [];
    const type = INGREDIENT_TYPES[randomInt(0, INGREDIENT_TYPES.length - 1)];

    INGREDIENT_TIERS.forEach(tier => {
        if (Math.random() < tier.dropRate) {
            drops.push({ tier: tier.id, type: type, tierData: tier });
        }
    });

    return drops;
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function getZoneById(zoneId) {
    return ZONES.find(z => z.id === zoneId);
}

function getQuestById(questId) {
    return QUESTS.find(q => q.id === questId);
}

function getCityById(cityId) {
    return CITIES.find(c => c.id === cityId);
}
