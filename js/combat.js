// ============================================================
// COMBAT SYSTEM
// ============================================================

function startBattle(questId, stageIndex) {
    const quest = getQuestById(questId);
    const zone = getZoneById(quest.zoneId);
    const isFinalQuest = quest.isFinalQuest || false;
    const enemiesPerStage = isFinalQuest ? GAME_CONFIG.ENEMIES_PER_STAGE_FINAL : GAME_CONFIG.ENEMIES_PER_STAGE;
    const totalWaves = enemiesPerStage[stageIndex];

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
        ingredientsEarned: [],
        isWilderness: quest.isWilderness || false,
        isFinalQuest: isFinalQuest
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
    const isBossStage = isFinalQuest && stageIndex === 4;
    document.getElementById('battle-zone').textContent = zone.name;
    document.getElementById('battle-stage').textContent = isBossStage ? 'Boss Fight' : `Stage ${stageIndex + 1}`;

    // Show battle screen
    showScreen('battle');
    logCombat(`Entering ${zone.name}${isBossStage ? ' - Boss Fight!' : ` Stage ${stageIndex + 1}`}`);

    // Start game loop
    gameState.lastAutoAttack = performance.now();
    gameState.gameLoopId = requestAnimationFrame(gameLoop);
}

function spawnEnemy() {
    const battle = gameState.battle;
    const zone = getZoneById(battle.zoneId);
    // Boss only spawns on final quest, stage 5
    const isBoss = battle.isFinalQuest && battle.stageIndex === 4;

    // Handle wilderness differently - all level 1, fixed low damage, no boss
    if (battle.isWilderness) {
        // Random enemy from wilderness pool
        const enemyTypeId = zone.enemies[randomInt(0, zone.enemies.length - 1)];
        const enemyType = ENEMY_TYPES[enemyTypeId];

        // Wilderness: fixed stats, no scaling
        const hp = enemyType.baseHp;
        const damage = 1;

        // Stage-based rewards per enemy for wilderness
        const stageRewards = [
            { gold: [1, 2], xp: [1, 2] },     // Stage 1 (2 enemies)
            { gold: [2, 3], xp: [2, 3] },     // Stage 2 (3 enemies)
            { gold: [3, 4], xp: [3, 4] },     // Stage 3 (4 enemies)
            { gold: [4, 5], xp: [4, 5] },     // Stage 4 (5 enemies)
            { gold: [5, 6], xp: [5, 6] }      // Stage 5 (6 enemies)
        ];
        const rewards = stageRewards[battle.stageIndex];

        const displayName = `${enemyType.name} Lv.1`;

        battle.enemy = {
            name: displayName,
            hp: hp,
            maxHp: hp,
            damage: damage,
            xpDrop: rewards.xp,
            goldDrop: rewards.gold,
            isBoss: false
        };

        updateBattleUI();
        const nameEl = document.getElementById('enemy-name');
        nameEl.classList.remove('boss');
        return;
    }

    // Regular quest enemies
    let enemyTypeId, enemyLevel;
    if (isBoss) {
        enemyTypeId = zone.boss.type;
        enemyLevel = zone.boss.level;
    } else {
        enemyTypeId = zone.enemies[randomInt(0, zone.enemies.length - 1)];
        enemyLevel = zone.enemyLevel;
    }

    const enemyType = ENEMY_TYPES[enemyTypeId];

    // Scale stats based on level: stat = base * (1 + 0.25 * (level - 1))
    const levelMultiplier = 1 + 0.25 * (enemyLevel - 1);
    let scaledHp = Math.floor(enemyType.baseHp * levelMultiplier);
    const scaledXp = Math.floor(enemyType.baseXp * levelMultiplier);

    // Calculate damage based on zone tier and stage progression
    const baseDamage = GAME_CONFIG.BASE_ENEMY_DAMAGE;
    const tierMultiplier = zone.tier || 1;
    let enemyDamage;

    if (isBoss) {
        // Boss HP and damage should be greater than 6 stage-4 enemies combined
        // Calculate what a stage-4 enemy would have
        const stage4EnemyDamage = baseDamage + (tierMultiplier - 1) * 2 + enemyLevel + 3 + 2; // stageIndex=3, avg wave=3

        // Calculate average HP of zone's regular enemies
        let avgEnemyHp = 0;
        zone.enemies.forEach(eId => {
            avgEnemyHp += ENEMY_TYPES[eId].baseHp;
        });
        avgEnemyHp = Math.floor((avgEnemyHp / zone.enemies.length) * levelMultiplier);

        // Boss gets HP slightly more than 6 enemies combined
        scaledHp = Math.floor(avgEnemyHp * 6 * 1.2);

        // Boss damage slightly more than a single stage-4 enemy (but attacks once per round)
        enemyDamage = Math.floor(stage4EnemyDamage * 1.5);
    } else {
        enemyDamage = baseDamage + (tierMultiplier - 1) * 2 + enemyLevel + battle.stageIndex + (battle.currentWave - 1);
    }

    // Calculate gold drop based on tier (reduced for balance)
    const baseGold = 1 + tierMultiplier;
    const goldMin = isBoss ? baseGold * 5 : baseGold;
    const goldMax = isBoss ? baseGold * 8 : baseGold + 1;

    // Calculate XP drop (reduced for balance - target ~level 5 after all Millbrook)
    const reducedXp = Math.max(1, Math.floor(scaledXp * 0.33));
    const xpMin = isBoss ? reducedXp * 3 : reducedXp;
    const xpMax = isBoss ? reducedXp * 4 : reducedXp + 1;

    // Build enemy name with level indicator (bosses always show Lv.1)
    const displayName = isBoss ? `${enemyType.name} Lv.1` : `${enemyType.name} Lv.${enemyLevel}`;

    battle.enemy = {
        name: displayName,
        hp: scaledHp,
        maxHp: scaledHp,
        damage: enemyDamage,
        xpDrop: [xpMin, xpMax],
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

    // Roll for ingredient drops based on zone
    // Wilderness: common only, Millbrook: common + uncommon
    let allowedTiers = null;
    if (battle.isWilderness) {
        allowedTiers = ['common'];
    } else {
        // Regular quests (Millbrook) get common and uncommon
        allowedTiers = ['common', 'uncommon'];
    }
    const drops = rollIngredientDrops(allowedTiers);
    drops.forEach(drop => {
        addIngredient(drop.tier, drop.type);
        battle.ingredientsEarned.push(drop);
    });

    // Build log message
    let logMsg = `${enemy.name} defeated! <span class="log-gold">+${gold}g</span> <span class="log-xp">+${xp}xp</span>`;
    drops.forEach(drop => {
        logMsg += ` <span class="log-ingredient" style="color:${drop.tierData.color}">+1 ${drop.tierData.name}</span>`;
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

    // For wilderness, reset progress after completion so it's replayable
    if (questComplete && battle.isWilderness) {
        gameState.questProgress[battle.questId] = [false, false, false, false, false];
    }

    // For regular quests (not wilderness), add to pending rewards
    if (questComplete && !battle.isWilderness && !gameState.completedQuests.includes(battle.questId)) {
        if (!gameState.pendingRewards.includes(battle.questId)) {
            gameState.pendingRewards.push(battle.questId);
        }
    }

    // Show victory screen
    const isBossStage = battle.isFinalQuest && battle.stageIndex === 4;
    let victoryTitle = 'Stage Complete!';
    if (questComplete && !battle.isWilderness) {
        victoryTitle = 'Quest Complete!';
    } else if (isBossStage) {
        victoryTitle = 'Boss Defeated!';
    }
    document.getElementById('victory-title').textContent = victoryTitle;
    document.getElementById('reward-gold').textContent = `+${battle.goldEarned}`;
    document.getElementById('reward-xp').textContent = `+${battle.xpEarned}`;

    // Show gold row
    const goldRow = document.querySelector('#victory-rewards .reward-row:first-child');
    if (goldRow) goldRow.style.display = 'flex';

    // Update reward display for ingredients (grouped by tier with counts)
    const ingredientDiv = document.getElementById('reward-ingredients');
    if (ingredientDiv) {
        if (battle.ingredientsEarned.length > 0) {
            // Group ingredients by tier and count
            const tierCounts = {};
            battle.ingredientsEarned.forEach(d => {
                if (!tierCounts[d.tier]) {
                    tierCounts[d.tier] = { count: 0, tierData: d.tierData };
                }
                tierCounts[d.tier].count++;
            });
            // Build vertical list
            const ingredientList = Object.values(tierCounts).map(t =>
                `<span style="color:${t.tierData.color}">${t.tierData.name} x${t.count}</span>`
            ).join('');
            ingredientDiv.innerHTML = ingredientList;
            ingredientDiv.parentElement.style.display = 'flex';
        } else {
            ingredientDiv.parentElement.style.display = 'none';
        }
    }

    // Show quest complete message if applicable (not for wilderness)
    if (questComplete && !battle.isWilderness) {
        const quest = getQuestById(battle.questId);
        logCombat(`<span class="log-level">QUEST COMPLETE: ${quest.name}! Return to the job board to collect your reward.</span>`);
    }

    // Show/hide next stage button
    const nextStageBtn = document.getElementById('btn-next-stage');
    if (questComplete) {
        nextStageBtn.style.display = 'none';
    } else {
        nextStageBtn.style.display = '';
        nextStageBtn.textContent = 'Next Stage';
    }

    // Update back button text for wilderness
    const backBtn = document.getElementById('btn-back-job-board');
    backBtn.textContent = battle.isWilderness ? 'Return' : 'Back to Job Board';

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
