// ============================================================
// UI MANAGEMENT
// ============================================================

// ------------------------------------------------------------
// SCREEN MANAGEMENT
// ------------------------------------------------------------
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${screenId}`).classList.add('active');
    gameState.currentScreen = screenId;

    if (screenId === 'dashboard') {
        updateDashboard();
    }
}

function showTab(tabId) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.toggle('active', tab.id === `tab-${tabId}`);
    });

    gameState.currentTab = tabId;

    if (tabId === 'world') renderWorldMap();
    if (tabId === 'character') updateCharacterTab();
    if (tabId === 'shop') updateShopTab();
    if (tabId === 'base') renderBaseTab();
    if (tabId === 'guild') renderGuildTab();
}

// ------------------------------------------------------------
// INTRO SCREEN
// ------------------------------------------------------------
function renderIntroScreen() {
    const container = document.getElementById('intro-content');
    container.innerHTML = `
        <h1 class="intro-title">${STORY.intro.title}</h1>
        <div class="intro-text">
            ${STORY.intro.paragraphs.map(p => `<p>${p}</p>`).join('')}
        </div>
        <button id="btn-start-game" class="start-btn">${STORY.intro.buttonText}</button>
    `;

    document.getElementById('btn-start-game').addEventListener('click', () => {
        gameState.introSeen = true;
        showScreen('dashboard');
    });
}

// ------------------------------------------------------------
// DASHBOARD
// ------------------------------------------------------------
function updateDashboard() {
    document.getElementById('dash-gold').textContent = `${formatNumber(gameState.hero.gold)} Gold`;
    document.getElementById('dash-level').textContent = `Level ${gameState.hero.level}`;
    showTab(gameState.currentTab);
}

// ------------------------------------------------------------
// WORLD MAP TAB
// ------------------------------------------------------------
function renderWorldMap() {
    const container = document.getElementById('world-map');
    container.innerHTML = '';

    CITIES.forEach(city => {
        const rep = gameState.cityReputation[city.id] || 0;
        const maxRep = city.maxReputation;
        const availableQuests = getAvailableQuestsForCity(city.id);
        const pendingCount = availableQuests.filter(q =>
            gameState.pendingRewards.includes(q.id)
        ).length;

        const card = document.createElement('div');
        card.className = 'city-card';

        // Only show reputation for cities that have it
        const repSection = maxRep > 0 ? `
            <div class="city-rep">
                <span>Reputation: ${rep} / ${maxRep}</span>
                <div class="rep-bar-container">
                    <div class="rep-bar" style="width: ${Math.min(100, (rep / maxRep) * 100)}%"></div>
                </div>
            </div>
        ` : '';

        const buttonText = city.id === 'wilderness' ? 'Explore' : 'Visit Job Board';

        card.innerHTML = `
            <div class="city-header">
                <span class="city-name">${city.name}</span>
                ${pendingCount > 0 ? `<span class="quest-notification">${pendingCount} rewards!</span>` : ''}
            </div>
            <p class="city-description">${city.description}</p>
            ${repSection}
            <button class="city-btn" data-city="${city.id}">${buttonText}</button>
        `;

        card.querySelector('.city-btn').addEventListener('click', () => {
            openJobBoard(city.id);
        });

        container.appendChild(card);
    });
}

// ------------------------------------------------------------
// JOB BOARD (Modal/Screen)
// ------------------------------------------------------------
function openJobBoard(cityId) {
    const city = getCityById(cityId);
    // Get ALL quests for this city (not just available ones)
    const allQuests = QUESTS.filter(q => q.cityId === cityId);

    const container = document.getElementById('job-board-content');
    container.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.className = 'job-board-header';
    header.innerHTML = `
        <h2>${city.name} Job Board</h2>
        <button class="close-btn" id="close-job-board">&times;</button>
    `;
    container.appendChild(header);

    // Quest list
    const questList = document.createElement('div');
    questList.className = 'quest-list';

    allQuests.forEach(quest => {
        const progress = gameState.questProgress[quest.id];
        const completedStages = progress ? progress.filter(s => s).length : 0;
        const isComplete = completedStages === 5;
        const canCollect = gameState.pendingRewards.includes(quest.id);
        const isAvailable = isQuestAvailable(quest.id);
        const inProgress = isQuestInProgress(quest.id);
        const isLocked = !isAvailable && !inProgress && !isComplete;

        const questCard = document.createElement('div');
        questCard.className = `quest-card${isComplete ? ' complete' : ''}${canCollect ? ' can-collect' : ''}${isLocked ? ' locked' : ''}`;

        if (isLocked) {
            // Show locked quest with minimal info
            questCard.innerHTML = `
                <div class="quest-header">
                    <span class="quest-name">${quest.name}</span>
                    <span class="quest-reward locked-reward">???</span>
                </div>
                <p class="quest-description locked-text">Complete previous quests to unlock.</p>
                <div class="quest-actions">
                    <button class="fight-btn" disabled>Locked</button>
                </div>
            `;
        } else {
            questCard.innerHTML = `
                <div class="quest-header">
                    <span class="quest-name">${quest.name}</span>
                    <span class="quest-reward">${quest.goldReward}g</span>
                </div>
                <p class="quest-description">${quest.description}</p>
                <div class="quest-progress">
                    <span>Progress: ${completedStages} / 5</span>
                    <div class="quest-stages">
                        ${[0, 1, 2, 3, 4].map(i => {
                            const done = progress && progress[i];
                            const isBoss = i === 4;
                            return `<span class="quest-stage${done ? ' done' : ''}${isBoss ? ' boss' : ''}">${isBoss ? 'B' : i + 1}</span>`;
                        }).join('')}
                    </div>
                </div>
                <div class="quest-actions">
                    ${canCollect ? `
                        <button class="collect-btn" data-quest="${quest.id}">Collect Reward</button>
                    ` : `
                        <button class="fight-btn" data-quest="${quest.id}" ${isComplete ? 'disabled' : ''}>
                            ${isComplete ? 'Completed' : 'Fight'}
                        </button>
                    `}
                </div>
            `;
        }

        questList.appendChild(questCard);
    });

    container.appendChild(questList);

    // Event listeners
    document.getElementById('close-job-board').addEventListener('click', closeJobBoard);

    container.querySelectorAll('.fight-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
            const questId = btn.dataset.quest;
            const progress = gameState.questProgress[questId];
            const nextStage = progress.findIndex(s => !s);
            if (nextStage !== -1) {
                closeJobBoard();
                startBattle(questId, nextStage);
            }
        });
    });

    container.querySelectorAll('.collect-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            collectQuestReward(btn.dataset.quest);
            openJobBoard(cityId); // Refresh
        });
    });

    // Show job board
    document.getElementById('screen-job-board').classList.add('active');
}

function closeJobBoard() {
    document.getElementById('screen-job-board').classList.remove('active');
}

function collectQuestReward(questId) {
    const quest = getQuestById(questId);
    if (!quest) return;

    // Remove from pending
    const idx = gameState.pendingRewards.indexOf(questId);
    if (idx > -1) {
        gameState.pendingRewards.splice(idx, 1);
    }

    // Grant rewards
    gameState.hero.gold += quest.goldReward;
    gameState.cityReputation[quest.cityId] += quest.reputationReward;

    // Mark as completed
    if (!gameState.completedQuests.includes(questId)) {
        gameState.completedQuests.push(questId);
    }

    updateDashboard();
}

// ------------------------------------------------------------
// CHARACTER TAB
// ------------------------------------------------------------
function updateCharacterTab() {
    const hero = gameState.hero;
    const derived = getDerivedStats();
    const stats = getEffectiveStats();

    document.getElementById('char-level').textContent = `Lv. ${hero.level}`;
    document.getElementById('char-xp-text').textContent = `${hero.xp} / ${hero.xpToLevel} XP`;
    document.getElementById('char-xp-bar').style.width = `${(hero.xp / hero.xpToLevel) * 100}%`;

    document.getElementById('char-stat-points').textContent = `(${hero.statPoints} points)`;

    document.getElementById('char-str').textContent = stats.str;
    document.getElementById('char-vit').textContent = stats.vit;
    document.getElementById('char-agi').textContent = stats.agi;
    document.getElementById('char-luk').textContent = stats.luk;

    document.getElementById('char-damage').textContent = derived.damage;
    document.getElementById('char-maxhp').textContent = derived.maxHp;
    document.getElementById('char-speed').textContent = `${(1000 / derived.attackInterval).toFixed(1)}/s`;
    document.getElementById('char-crit').textContent = `${derived.critChance.toFixed(1)}%`;

    const equip = hero.equipment;
    const equipLevel = hero.equipmentLevel;

    // Weapon with improvement level
    if (equip.weapon) {
        const weaponBonus = equip.weapon.value + (equipLevel.weapon * GAME_CONFIG.IMPROVE_BONUS.weapon);
        const levelSuffix = equipLevel.weapon > 0 ? ` +${equipLevel.weapon}` : '';
        document.getElementById('char-weapon').textContent = `${equip.weapon.name}${levelSuffix} (+${weaponBonus} DMG)`;
    } else {
        document.getElementById('char-weapon').textContent = 'None';
    }

    // Armor with improvement level
    if (equip.armor) {
        const armorBonus = equip.armor.value + (equipLevel.armor * GAME_CONFIG.IMPROVE_BONUS.armor);
        const levelSuffix = equipLevel.armor > 0 ? ` +${equipLevel.armor}` : '';
        document.getElementById('char-armor').textContent = `${equip.armor.name}${levelSuffix} (+${armorBonus} HP)`;
    } else {
        document.getElementById('char-armor').textContent = 'None';
    }

    document.getElementById('char-accessory').textContent = equip.accessory ?
        `${equip.accessory.name} (+${equip.accessory.value} ${equip.accessory.stat === 'all' ? 'All Stats' : equip.accessory.stat.toUpperCase()})` : 'None';

    document.querySelectorAll('#tab-character .stat-btn').forEach(btn => {
        btn.disabled = hero.statPoints <= 0;
    });
}

function allocateStat(stat) {
    if (gameState.hero.statPoints <= 0) return;

    gameState.hero.baseStats[stat]++;
    gameState.hero.statPoints--;

    const derived = getDerivedStats();
    if (stat === 'vit') {
        const hpPercent = gameState.hero.hp / gameState.hero.maxHp;
        gameState.hero.maxHp = derived.maxHp;
        gameState.hero.hp = Math.floor(derived.maxHp * hpPercent);
    }

    if (stat === 'agi') {
        gameState.autoAttackInterval = derived.attackInterval;
    }

    updateCharacterTab();
}

// ------------------------------------------------------------
// SHOP TAB
// ------------------------------------------------------------
function updateShopTab() {
    const container = document.getElementById('shop-grid');
    container.innerHTML = '';

    // Click Damage Upgrade
    const clickCost = getClickUpgradeCost();
    const canAffordClick = gameState.hero.gold >= clickCost;

    const clickDiv = document.createElement('div');
    clickDiv.className = 'shop-item upgrade';
    clickDiv.innerHTML = `
        <div class="shop-item-header">
            <span class="shop-item-name">Click Power</span>
            <span class="shop-item-slot">upgrade</span>
        </div>
        <span class="shop-item-stat">Current: ${gameState.hero.clickDamage} DMG → ${gameState.hero.clickDamage + 1} DMG</span>
        <button ${canAffordClick ? '' : 'disabled'}>${clickCost} Gold</button>
    `;
    clickDiv.querySelector('button').addEventListener('click', buyClickUpgrade);
    container.appendChild(clickDiv);

    // Accessory only (weapons/armor moved to Forge)
    const slot = 'accessory';
    const currentTier = gameState.hero.equipmentTier[slot];
    const tiers = SHOP_TIERS[slot];

    const getStatLabel = (item) => {
        if (item.stat === 'damage') return 'DMG';
        if (item.stat === 'maxHp') return 'HP';
        if (item.stat === 'all') return 'All Stats';
        return item.stat.toUpperCase();
    };

    if (currentTier >= tiers.length) {
        const maxItem = tiers[tiers.length - 1];
        const div = document.createElement('div');
        div.className = 'shop-item purchased';
        div.innerHTML = `
            <div class="shop-item-header">
                <span class="shop-item-name">${maxItem.name}</span>
                <span class="shop-item-slot">${slot}</span>
            </div>
            <span class="shop-item-stat">+${maxItem.value} ${getStatLabel(maxItem)}</span>
            <button disabled>Max Tier</button>
        `;
        container.appendChild(div);
    } else {
        const nextItem = tiers[currentTier];
        const canAfford = gameState.hero.gold >= nextItem.cost;

        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
            <div class="shop-item-header">
                <span class="shop-item-name">${nextItem.name}</span>
                <span class="shop-item-slot">${slot} tier ${currentTier + 1}</span>
            </div>
            <span class="shop-item-stat">+${nextItem.value} ${getStatLabel(nextItem)}</span>
            <button ${canAfford ? '' : 'disabled'}>${nextItem.cost} Gold</button>
        `;
        div.querySelector('button').addEventListener('click', () => buyEquipment(slot));
        container.appendChild(div);
    }
}

function buyClickUpgrade() {
    const cost = getClickUpgradeCost();
    if (gameState.hero.gold < cost) return;

    gameState.hero.gold -= cost;
    gameState.hero.clickDamage++;

    updateShopTab();
    updateDashboard();
}

function buyEquipment(slot) {
    const currentTier = gameState.hero.equipmentTier[slot];
    const tiers = SHOP_TIERS[slot];

    if (currentTier >= tiers.length) return;

    const item = tiers[currentTier];
    if (gameState.hero.gold < item.cost) return;

    gameState.hero.gold -= item.cost;
    gameState.hero.equipmentTier[slot]++;

    gameState.hero.equipment[slot] = {
        name: item.name,
        stat: item.stat,
        value: item.value
    };

    const derived = getDerivedStats();
    if (slot === 'armor') {
        gameState.hero.maxHp = derived.maxHp;
        gameState.hero.hp = Math.min(gameState.hero.hp + item.value, derived.maxHp);
    }

    updateShopTab();
    updateCharacterTab();
    updateDashboard();
}

// ------------------------------------------------------------
// BASE TAB
// ------------------------------------------------------------
function renderBaseTab() {
    const container = document.getElementById('base-content');
    container.innerHTML = '';

    // Header with gold
    const header = document.createElement('div');
    header.className = 'base-header';
    header.innerHTML = `<h2>Your Guild Grounds</h2>`;
    container.appendChild(header);

    // Buildings grid
    const buildingsGrid = document.createElement('div');
    buildingsGrid.className = 'buildings-grid';

    BUILDINGS.forEach(building => {
        // Skip tent - it's just flavor, not interactive
        if (building.id === 'tent') return;

        const isUnlocked = gameState.unlockedBuildings.includes(building.id);
        const isBuilt = gameState.builtBuildings.includes(building.id);
        const canAfford = gameState.hero.gold >= building.cost;

        const card = document.createElement('div');
        card.className = `building-card${!isUnlocked ? ' locked' : ''}${isBuilt ? ' built' : ''}`;

        if (!isUnlocked) {
            card.innerHTML = `
                <div class="building-name">???</div>
                <div class="building-unlock">Unlocks at Level ${building.unlockLevel}</div>
            `;
        } else {
            card.innerHTML = `
                <div class="building-name">${building.name}</div>
                <div class="building-description">${building.description}</div>
                ${isBuilt ? `
                    <button class="building-btn enter-btn" data-building="${building.id}">Enter</button>
                ` : `
                    <button class="building-btn build-btn" data-building="${building.id}" ${!canAfford ? 'disabled' : ''}>
                        Build (${building.cost}g)
                    </button>
                `}
            `;
        }

        buildingsGrid.appendChild(card);
    });

    container.appendChild(buildingsGrid);

    // Build button listeners
    container.querySelectorAll('.build-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            buildBuilding(btn.dataset.building);
        });
    });

    // Enter button listeners
    container.querySelectorAll('.enter-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
            enterBuilding(btn.dataset.building);
        });
    });
}

function enterBuilding(buildingId) {
    switch (buildingId) {
        case 'forge':
            openForge();
            break;
        // Add more buildings here as they're implemented
        default:
            console.log(`Building ${buildingId} not yet implemented`);
    }
}

function buildBuilding(buildingId) {
    const building = BUILDINGS.find(b => b.id === buildingId);
    if (!building) return;
    if (gameState.hero.gold < building.cost) return;
    if (gameState.builtBuildings.includes(buildingId)) return;

    gameState.hero.gold -= building.cost;
    gameState.builtBuildings.push(buildingId);

    renderBaseTab();
    updateDashboard();
}

// ------------------------------------------------------------
// GUILD TAB
// ------------------------------------------------------------
function renderGuildTab() {
    const container = document.getElementById('guild-content');
    container.innerHTML = '';

    // Hero roster
    const rosterSection = document.createElement('div');
    rosterSection.className = 'guild-section';
    rosterSection.innerHTML = `<h3>Guild Heroes</h3>`;

    if (gameState.heroes.length === 0) {
        rosterSection.innerHTML += `<p class="no-heroes">No heroes recruited yet. Build a Recruitment Center to hire heroes.</p>`;
    } else {
        const heroList = document.createElement('div');
        heroList.className = 'hero-list';

        gameState.heroes.forEach(hero => {
            const isCommissioned = Object.values(gameState.commissionedHeroes).includes(hero.id);
            const commissionedCity = Object.entries(gameState.commissionedHeroes)
                .find(([_, hId]) => hId === hero.id);

            const heroCard = document.createElement('div');
            heroCard.className = `hero-card${isCommissioned ? ' commissioned' : ''}`;
            heroCard.innerHTML = `
                <div class="hero-name">${hero.name}</div>
                <div class="hero-level">Level ${hero.level}</div>
                ${isCommissioned ? `
                    <div class="hero-status">Guarding ${getCityById(commissionedCity[0]).name}</div>
                ` : `
                    <button class="train-btn" data-hero="${hero.id}">
                        Train (${getHeroTrainingCost(hero.level)}g)
                    </button>
                `}
            `;
            heroList.appendChild(heroCard);
        });

        rosterSection.appendChild(heroList);
    }

    container.appendChild(rosterSection);

    // Passive income display
    const incomeSection = document.createElement('div');
    incomeSection.className = 'guild-section';
    incomeSection.innerHTML = `
        <h3>Passive Income</h3>
        <p>Income per minute: ${getPassiveIncome()}g</p>
    `;
    container.appendChild(incomeSection);

    // Train button listeners
    container.querySelectorAll('.train-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            trainHero(parseInt(btn.dataset.hero));
        });
    });
}

function trainHero(heroId) {
    const hero = gameState.heroes.find(h => h.id === heroId);
    if (!hero) return;

    const cost = getHeroTrainingCost(hero.level);
    if (gameState.hero.gold < cost) return;

    gameState.hero.gold -= cost;
    hero.level++;

    renderGuildTab();
    updateDashboard();
}

// ------------------------------------------------------------
// BATTLE UI
// ------------------------------------------------------------
function updateBattleUI() {
    const battle = gameState.battle;
    const hero = gameState.hero;
    const derived = getDerivedStats();

    document.getElementById('wave-display').textContent =
        `Enemy ${battle.currentWave} / ${battle.totalWaves}`;

    if (battle.enemy) {
        document.getElementById('enemy-name').textContent = battle.enemy.name;
        const enemyHpPercent = Math.max(0, (battle.enemy.hp / battle.enemy.maxHp) * 100);
        document.getElementById('enemy-health-bar').style.width = `${enemyHpPercent}%`;
        document.getElementById('enemy-health-text').textContent =
            `${Math.max(0, battle.enemy.hp)} / ${battle.enemy.maxHp}`;
    }

    document.getElementById('hero-level').textContent = `Lv. ${hero.level}`;
    const heroHpPercent = Math.max(0, (hero.hp / derived.maxHp) * 100);
    document.getElementById('hero-health-bar').style.width = `${heroHpPercent}%`;
    document.getElementById('hero-health-text').textContent =
        `${Math.max(0, Math.ceil(hero.hp))} / ${derived.maxHp}`;
}

// ------------------------------------------------------------
// VISUAL EFFECTS
// ------------------------------------------------------------
function showDamagePopup(damage, isCrit, isPlayerDamage) {
    const popup = document.createElement('div');
    popup.className = `damage-popup${isCrit ? ' crit' : ''}${isPlayerDamage ? ' player-damage' : ''}`;
    popup.textContent = damage;

    const targetSection = isPlayerDamage ?
        document.getElementById('enemy-section') :
        document.getElementById('hero-section');
    const rect = targetSection.getBoundingClientRect();

    popup.style.left = `${rect.left + rect.width / 2 + randomInt(-30, 30)}px`;
    popup.style.top = `${rect.top + randomInt(-10, 20)}px`;

    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
}

function logCombat(message) {
    const log = document.getElementById('log-content');
    const entry = document.createElement('div');
    entry.innerHTML = message;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;

    while (log.children.length > 50) {
        log.removeChild(log.firstChild);
    }
}

// ------------------------------------------------------------
// FORGE
// ------------------------------------------------------------
function openForge() {
    renderForge();
    document.getElementById('screen-forge').classList.add('active');
}

function closeForge() {
    document.getElementById('screen-forge').classList.remove('active');
}

function getImproveCost(slot) {
    const currentTier = gameState.hero.equipmentTier[slot];
    const currentLevel = gameState.hero.equipmentLevel[slot];
    const tiers = SHOP_TIERS[slot];

    // Base cost on current tier's item cost (or starter item cost)
    let baseCost;
    if (currentTier === 0) {
        // Starter item - use first tier cost as reference
        baseCost = tiers[0].cost * 0.5;
    } else {
        baseCost = tiers[currentTier - 1].cost;
    }

    // Cost increases with each improvement level
    return Math.floor(baseCost * GAME_CONFIG.IMPROVE_COST_PERCENT * (currentLevel + 1));
}

function renderForge() {
    const container = document.getElementById('forge-content');
    container.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.className = 'forge-header';
    header.innerHTML = `
        <h2>Forge</h2>
        <div>
            <span class="forge-gold">${formatNumber(gameState.hero.gold)} Gold</span>
            <button class="close-btn" id="close-forge">&times;</button>
        </div>
    `;
    container.appendChild(header);

    // === SECTION 1: Currently Equipped ===
    const equippedSection = document.createElement('div');
    equippedSection.className = 'forge-section forge-equipped';
    equippedSection.innerHTML = `<h3>Currently Equipped</h3>`;

    const equippedGrid = document.createElement('div');
    equippedGrid.className = 'forge-equipped-grid';

    ['weapon', 'armor'].forEach(slot => {
        const equip = gameState.hero.equipment[slot];
        const currentLevel = gameState.hero.equipmentLevel[slot];
        const improveBonus = GAME_CONFIG.IMPROVE_BONUS[slot];
        const statLabel = slot === 'weapon' ? 'DMG' : 'HP';
        const totalBonus = equip.value + (currentLevel * improveBonus);
        const levelDisplay = currentLevel > 0 ? ` +${currentLevel}` : '';
        const slotIcon = slot === 'weapon' ? '⚔' : '🛡';

        const itemCard = document.createElement('div');
        itemCard.className = 'forge-equipped-item';
        itemCard.innerHTML = `
            <span class="equipped-icon">${slotIcon}</span>
            <div class="equipped-info">
                <span class="equipped-name">${equip.name}${levelDisplay}</span>
                <span class="equipped-stat">+${totalBonus} ${statLabel}</span>
            </div>
        `;
        equippedGrid.appendChild(itemCard);
    });

    equippedSection.appendChild(equippedGrid);
    container.appendChild(equippedSection);

    // === SECTION 2: Crafting Recipes ===
    const craftSection = document.createElement('div');
    craftSection.className = 'forge-section forge-recipes';
    craftSection.innerHTML = `<h3>Crafting Recipes</h3>`;

    const recipesGrid = document.createElement('div');
    recipesGrid.className = 'forge-recipes-grid';

    ['weapon', 'armor'].forEach(slot => {
        const currentTier = gameState.hero.equipmentTier[slot];
        const tiers = SHOP_TIERS[slot];
        const isMaxTier = currentTier >= tiers.length;
        const statLabel = slot === 'weapon' ? 'DMG' : 'HP';
        const slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1);

        const recipeCard = document.createElement('div');
        recipeCard.className = `forge-recipe-card${isMaxTier ? ' maxed' : ''}`;

        if (isMaxTier) {
            const maxItem = tiers[tiers.length - 1];
            recipeCard.innerHTML = `
                <div class="recipe-header">
                    <span class="recipe-slot">${slotLabel}</span>
                    <span class="recipe-tier">Max Tier</span>
                </div>
                <div class="recipe-name">${maxItem.name}</div>
                <div class="recipe-stat">+${maxItem.value} ${statLabel}</div>
                <button class="forge-btn craft-btn" disabled>Fully Crafted</button>
            `;
        } else {
            const nextItem = tiers[currentTier];
            const canAfford = gameState.hero.gold >= nextItem.cost;
            recipeCard.innerHTML = `
                <div class="recipe-header">
                    <span class="recipe-slot">${slotLabel}</span>
                    <span class="recipe-tier">Tier ${currentTier + 1}</span>
                </div>
                <div class="recipe-name">${nextItem.name}</div>
                <div class="recipe-stat">+${nextItem.value} ${statLabel}</div>
                <button class="forge-btn craft-btn" data-slot="${slot}" ${!canAfford ? 'disabled' : ''}>
                    Craft (${nextItem.cost}g)
                </button>
            `;
        }

        recipesGrid.appendChild(recipeCard);
    });

    craftSection.appendChild(recipesGrid);
    container.appendChild(craftSection);

    // === SECTION 3: Upgrade Station ===
    const upgradeSection = document.createElement('div');
    upgradeSection.className = 'forge-section forge-upgrades';
    upgradeSection.innerHTML = `<h3>Upgrade Station</h3>`;

    const upgradesGrid = document.createElement('div');
    upgradesGrid.className = 'forge-upgrades-grid';

    ['weapon', 'armor'].forEach(slot => {
        const equip = gameState.hero.equipment[slot];
        const currentLevel = gameState.hero.equipmentLevel[slot];
        const maxLevel = GAME_CONFIG.MAX_IMPROVEMENT_LEVEL;
        const improveBonus = GAME_CONFIG.IMPROVE_BONUS[slot];
        const isMaxLevel = currentLevel >= maxLevel;
        const statLabel = slot === 'weapon' ? 'DMG' : 'HP';
        const slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1);
        const improveCost = getImproveCost(slot);
        const canAfford = gameState.hero.gold >= improveCost;

        const upgradeCard = document.createElement('div');
        upgradeCard.className = `forge-upgrade-card${isMaxLevel ? ' maxed' : ''}`;

        // Level indicator dots
        let levelDots = '';
        for (let i = 0; i < maxLevel; i++) {
            levelDots += `<span class="level-dot${i < currentLevel ? ' filled' : ''}"></span>`;
        }

        if (isMaxLevel) {
            upgradeCard.innerHTML = `
                <div class="upgrade-header">
                    <span class="upgrade-slot">${slotLabel}</span>
                    <div class="upgrade-level">${levelDots}</div>
                </div>
                <div class="upgrade-name">${equip.name} +${currentLevel}</div>
                <div class="upgrade-status">Maximum Level</div>
                <button class="forge-btn improve-btn" disabled>Fully Upgraded</button>
            `;
        } else {
            upgradeCard.innerHTML = `
                <div class="upgrade-header">
                    <span class="upgrade-slot">${slotLabel}</span>
                    <div class="upgrade-level">${levelDots}</div>
                </div>
                <div class="upgrade-name">${equip.name}${currentLevel > 0 ? ` +${currentLevel}` : ''}</div>
                <div class="upgrade-preview">+${improveBonus} ${statLabel} per level</div>
                <button class="forge-btn improve-btn" data-slot="${slot}" ${!canAfford ? 'disabled' : ''}>
                    Upgrade to +${currentLevel + 1} (${improveCost}g)
                </button>
            `;
        }

        upgradesGrid.appendChild(upgradeCard);
    });

    upgradeSection.appendChild(upgradesGrid);
    container.appendChild(upgradeSection);

    // Event listeners
    document.getElementById('close-forge').addEventListener('click', closeForge);

    container.querySelectorAll('.improve-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
            improveEquipment(btn.dataset.slot);
        });
    });

    container.querySelectorAll('.craft-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
            craftEquipment(btn.dataset.slot);
        });
    });
}

function improveEquipment(slot) {
    const cost = getImproveCost(slot);
    const currentLevel = gameState.hero.equipmentLevel[slot];
    const maxLevel = GAME_CONFIG.MAX_IMPROVEMENT_LEVEL;

    if (gameState.hero.gold < cost) return;
    if (currentLevel >= maxLevel) return;

    gameState.hero.gold -= cost;
    gameState.hero.equipmentLevel[slot]++;

    // Update max HP if armor was improved
    if (slot === 'armor') {
        const derived = getDerivedStats();
        gameState.hero.maxHp = derived.maxHp;
        gameState.hero.hp = Math.min(gameState.hero.hp + GAME_CONFIG.IMPROVE_BONUS.armor, derived.maxHp);
    }

    renderForge();
    updateDashboard();
}

function craftEquipment(slot) {
    const currentTier = gameState.hero.equipmentTier[slot];
    const tiers = SHOP_TIERS[slot];

    if (currentTier >= tiers.length) return;

    const item = tiers[currentTier];
    if (gameState.hero.gold < item.cost) return;

    gameState.hero.gold -= item.cost;
    gameState.hero.equipmentTier[slot]++;
    gameState.hero.equipmentLevel[slot] = 0; // Reset improvement level

    gameState.hero.equipment[slot] = {
        name: item.name,
        stat: item.stat,
        value: item.value
    };

    // Update max HP if armor was crafted
    if (slot === 'armor') {
        const derived = getDerivedStats();
        gameState.hero.maxHp = derived.maxHp;
        gameState.hero.hp = Math.min(gameState.hero.hp + item.value, derived.maxHp);
    }

    renderForge();
    updateCharacterTab();
    updateDashboard();
}
