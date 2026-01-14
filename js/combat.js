// ============================================================
// COMBAT SYSTEM
// ============================================================

function startBattle(questId, stageIndex) {
    const quest = getQuestById(questId);
    const zone = getZoneById(quest.zoneId);
    const isBoss = stageIndex === 4;
    const totalWaves = isBoss ? 1 : GAME_CONFIG.ENEMIES_PER_STAGE[stageIndex];

    // Initialize battle state
    gameState.battle = {
        active: true,
        questId: questId,
        zoneId: quest.zoneId,
        stageIndex: stageIndex,
        currentWave: 1,
        totalWaves: totalWaves,
        enemy: null,
        goldEarned: 0,
        xpEarned: 0,
        ingredientsEarned: []
    };

    // Heal hero to full
    const derived = getDerivedStats();
    gameState.hero.hp = derived.maxHp;
    gameState.hero.maxHp = derived.maxHp;
    gameState.autoAttackInterval = derived.attackInterval;

    // Clear combat log
    document.getElementById('log-content').innerHTML = '';

    // Spawn first enemy
    spawnEnemy();

    // Update battle UI
    document.getElementById('battle-zone').textContent = zone.name;
    document.getElementById('battle-stage').textContent = isBoss ? 'Boss Fight' : `Stage ${stageIndex + 1}`;

    // Show battle screen
    showScreen('battle');
    logCombat(`Entering ${zone.name}${isBoss ? ' - Boss Fight!' : ` Stage ${stageIndex + 1}`}`);

    // Start game loop
    gameState.lastAutoAttack = performance.now();
    gameState.gameLoopId = requestAnimationFrame(gameLoop);
}

function spawnEnemy() {
    const battle = gameState.battle;
    const zone = getZoneById(battle.zoneId);
    const zoneIndex = ZONES.findIndex(z => z.id === battle.zoneId);
    const isBoss = battle.stageIndex === 4;

    let enemyTemplate;
    if (isBoss) {
        enemyTemplate = zone.boss;
    } else {
        enemyTemplate = zone.enemies[randomInt(0, zone.enemies.length - 1)];
    }

    // Calculate progressive damage scaling
    const baseDamage = GAME_CONFIG.BASE_ENEMY_DAMAGE;
    const areaProgressMax = GAME_CONFIG.AREA_PROGRESS_MAX;
    const areaBonus = GAME_CONFIG.AREA_DAMAGE_BONUS;
    let enemyDamage;

    // Use zone tier for scaling
    const tierMultiplier = zone.tier || 1;

    if (isBoss) {
        const lastNormalDamage = baseDamage + (tierMultiplier - 1) * (areaProgressMax + areaBonus) + 3 + 5;
        const bossBonus = GAME_CONFIG.BOSS_DAMAGE_BONUS + (tierMultiplier - 1) * 2;
        enemyDamage = lastNormalDamage + bossBonus;
    } else {
        enemyDamage = baseDamage + (tierMultiplier - 1) * (areaProgressMax + areaBonus) + battle.stageIndex + (battle.currentWave - 1);
    }

    // Calculate gold drop based on tier and boss status
    const baseGold = 5 + tierMultiplier * 3;
    const goldMin = isBoss ? baseGold * 4 : baseGold;
    const goldMax = isBoss ? baseGold * 6 : Math.floor(baseGold * 1.5);

    battle.enemy = {
        name: enemyTemplate.name,
        hp: enemyTemplate.baseHp,
        maxHp: enemyTemplate.baseHp,
        damage: enemyDamage,
        xpDrop: enemyTemplate.xpDrop,
        goldDrop: [goldMin, goldMax],
        isBoss: isBoss
    };

    updateBattleUI();

    const nameEl = document.getElementById('enemy-name');
    nameEl.classList.toggle('boss', isBoss);
}

function dealDamageToEnemy(isClick = false) {
    const battle = gameState.battle;
    if (!battle.active || !battle.enemy || battle.enemy.hp <= 0) return;

    const derived = getDerivedStats();
    let damage;
    let isCrit = false;

    if (isClick) {
        damage = gameState.hero.clickDamage;
    } else {
        damage = derived.damage;
        if (Math.random() * 100 < derived.critChance) {
            damage = Math.floor(damage * 2);
            isCrit = true;
        }
    }

    battle.enemy.hp -= damage;

    showDamagePopup(damage, isCrit, true);
    if (!isClick) {
        logCombat(`You deal <span class="log-damage${isCrit ? ' log-crit' : ''}">${damage}${isCrit ? ' CRIT!' : ''}</span> damage`);
    }

    if (battle.enemy.hp <= 0) {
        onEnemyDefeated();
    }

    updateBattleUI();
}

function enemyAttack() {
    const battle = gameState.battle;
    if (!battle.active || !battle.enemy || battle.enemy.hp <= 0) return;

    const damage = battle.enemy.damage;
    gameState.hero.hp -= damage;

    showDamagePopup(damage, false, false);
    logCombat(`${battle.enemy.name} deals <span class="log-damage">${damage}</span> damage`);

    if (gameState.hero.hp <= 0) {
        onHeroDefeated();
    }

    updateBattleUI();
}

function onEnemyDefeated() {
    const battle = gameState.battle;
    const enemy = battle.enemy;
    const derived = getDerivedStats();

    // Gold reward
    const goldBase = randomInt(enemy.goldDrop[0], enemy.goldDrop[1]);
    const gold = Math.floor(goldBase * derived.goldBonus);
    battle.goldEarned += gold;

    // XP reward
    const xp = randomInt(enemy.xpDrop[0], enemy.xpDrop[1]);
    battle.xpEarned += xp;

    // Roll for ingredient drops
    const drops = rollIngredientDrops();
    drops.forEach(drop => {
        addIngredient(drop.tier, drop.type);
        battle.ingredientsEarned.push(drop);
    });

    // Build log message
    let logMsg = `${enemy.name} defeated! <span class="log-gold">+${gold}g</span> <span class="log-xp">+${xp}xp</span>`;
    drops.forEach(drop => {
        logMsg += ` <span class="log-ingredient" style="color:${drop.tierData.color}">+1 ${drop.tierData.name} ${drop.type}</span>`;
    });
    logCombat(logMsg);

    // Check if more waves
    if (battle.currentWave < battle.totalWaves) {
        battle.currentWave++;
        setTimeout(() => {
            if (battle.active) {
                spawnEnemy();
                logCombat(`Enemy ${battle.currentWave} / ${battle.totalWaves} appears!`);
            }
        }, 500);
    } else {
        onStageComplete();
    }
}

function onStageComplete() {
    const battle = gameState.battle;

    battle.active = false;
    if (gameState.gameLoopId) {
        cancelAnimationFrame(gameState.gameLoopId);
        gameState.gameLoopId = null;
    }

    // Mark stage as completed
    gameState.questProgress[battle.questId][battle.stageIndex] = true;

    // Grant rewards
    gameState.hero.gold += battle.goldEarned;
    gameState.hero.xp += battle.xpEarned;
    checkLevelUp();

    // Check if entire quest is complete
    const questComplete = gameState.questProgress[battle.questId].every(s => s);
    if (questComplete && !gameState.completedQuests.includes(battle.questId)) {
        // Add to pending rewards (collect from job board)
        if (!gameState.pendingRewards.includes(battle.questId)) {
            gameState.pendingRewards.push(battle.questId);
        }
    }

    // Show victory screen
    const isBoss = battle.stageIndex === 4;
    document.getElementById('victory-title').textContent = isBoss ? 'Boss Defeated!' : 'Stage Complete!';
    document.getElementById('reward-gold').textContent = `+${battle.goldEarned}`;
    document.getElementById('reward-xp').textContent = `+${battle.xpEarned}`;

    // Show gold row
    const goldRow = document.querySelector('#victory-rewards .reward-row:first-child');
    if (goldRow) goldRow.style.display = 'flex';

    // Update reward display for ingredients
    const ingredientDiv = document.getElementById('reward-ingredients');
    if (ingredientDiv) {
        if (battle.ingredientsEarned.length > 0) {
            const ingredientList = battle.ingredientsEarned.map(d =>
                `<span style="color:${d.tierData.color}">${d.tierData.name} ${d.type}</span>`
            ).join(', ');
            ingredientDiv.innerHTML = ingredientList;
            ingredientDiv.parentElement.style.display = 'flex';
        } else {
            ingredientDiv.parentElement.style.display = 'none';
        }
    }

    // Show quest complete message if applicable
    if (questComplete) {
        const quest = getQuestById(battle.questId);
        logCombat(`<span class="log-level">QUEST COMPLETE: ${quest.name}! Return to the job board to collect your reward.</span>`);
    }

    showScreen('victory');
}

function onHeroDefeated() {
    const battle = gameState.battle;

    battle.active = false;
    if (gameState.gameLoopId) {
        cancelAnimationFrame(gameState.gameLoopId);
        gameState.gameLoopId = null;
    }

    logCombat(`<span class="log-damage">Defeated!</span>`);

    // Give partial XP (50%)
    const xpSalvaged = Math.floor(battle.xpEarned * 0.5);
    gameState.hero.xp += xpSalvaged;
    checkLevelUp();

    // Show defeat screen
    document.getElementById('defeat-xp').textContent = `+${xpSalvaged}`;

    // Hide gold display
    const defeatGoldRow = document.querySelector('#defeat-rewards .reward-row:first-child');
    if (defeatGoldRow) defeatGoldRow.style.display = 'none';

    setTimeout(() => {
        showScreen('defeat');
    }, 1000);
}

function retreat() {
    const battle = gameState.battle;

    battle.active = false;
    if (gameState.gameLoopId) {
        cancelAnimationFrame(gameState.gameLoopId);
        gameState.gameLoopId = null;
    }

    // Keep XP earned so far
    gameState.hero.xp += battle.xpEarned;
    checkLevelUp();

    showScreen('dashboard');
}

function checkLevelUp() {
    while (gameState.hero.xp >= gameState.hero.xpToLevel) {
        gameState.hero.xp -= gameState.hero.xpToLevel;
        gameState.hero.level++;
        gameState.hero.statPoints += GAME_CONFIG.STAT_POINTS_PER_LEVEL;
        gameState.hero.xpToLevel = getXpToLevel(gameState.hero.level);

        const derived = getDerivedStats();
        gameState.hero.maxHp = derived.maxHp;
        gameState.hero.hp = derived.maxHp;

        logCombat(`<span class="log-level">LEVEL UP! Level ${gameState.hero.level}! +${GAME_CONFIG.STAT_POINTS_PER_LEVEL} stat points</span>`);

        // Check for building unlocks
        const newUnlocks = checkBuildingUnlocks();
        newUnlocks.forEach(building => {
            logCombat(`<span class="log-level">NEW BUILDING UNLOCKED: ${building.name}!</span>`);
        });
    }
}

// ------------------------------------------------------------
// GAME LOOP
// ------------------------------------------------------------
function gameLoop(timestamp) {
    const battle = gameState.battle;
    if (!battle.active) return;

    const derived = getDerivedStats();
    const speedMultiplier = gameState.combatSpeed;
    const adjustedInterval = derived.attackInterval / speedMultiplier;

    if (timestamp - gameState.lastAutoAttack >= adjustedInterval) {
        dealDamageToEnemy(false);

        if (battle.enemy && battle.enemy.hp > 0) {
            setTimeout(() => {
                if (battle.active && battle.enemy && battle.enemy.hp > 0) {
                    enemyAttack();
                }
            }, adjustedInterval / 2);
        }

        gameState.lastAutoAttack = timestamp;
    }

    gameState.gameLoopId = requestAnimationFrame(gameLoop);
}
