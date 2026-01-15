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
    let enemyTypeId, enemyLevel;
    if (isBoss) {
        enemyTypeId = zone.boss.type;
        enemyLevel = zone.boss.level;
    } else {
        enemyTypeId = zone.enemies[randomInt(0, zone.enemies.length - 1)];
        enemyLevel = zone.enemyLevel;
    }

    const enemyType = ENEMY_TYPES[enemyTypeId];

    let scaledHp, enemyDamage, goldMin, goldMax, xpMin, xpMax;

    // Check if zone has fixed stage stats
    if (zone.stageStats) {
        const stats = zone.stageStats[battle.stageIndex];
        scaledHp = randomInt(stats.hp[0], stats.hp[1]);
        enemyDamage = randomInt(stats.damage[0], stats.damage[1]);
        goldMin = stats.gold[0];
        goldMax = stats.gold[1];
        xpMin = stats.xp[0];
        xpMax = stats.xp[1];
    } else {
        // Formula-based calculation
        const levelMultiplier = 1 + 0.25 * (enemyLevel - 1);
        scaledHp = Math.floor(enemyType.baseHp * levelMultiplier);
        const scaledXp = Math.floor(enemyType.baseXp * levelMultiplier);

        const baseDamage = GAME_CONFIG.BASE_ENEMY_DAMAGE;
        const tierMultiplier = zone.tier || 1;

        if (isBoss) {
            // Boss HP and damage based on stage 4 enemies
            const stage4Stats = zone.stageStats ? zone.stageStats[3] : null;
            if (stage4Stats) {
                // Use stage 4 stats to calculate boss
                const avgStage4Hp = (stage4Stats.hp[0] + stage4Stats.hp[1]) / 2;
                const avgStage4Dmg = (stage4Stats.damage[0] + stage4Stats.damage[1]) / 2;
                scaledHp = Math.floor(avgStage4Hp * 6 * 1.2);
                enemyDamage = Math.floor(avgStage4Dmg * 1.5);
            } else {
                const stage4EnemyDamage = baseDamage + (tierMultiplier - 1) * 2 + enemyLevel + 3 + 2;
                let avgEnemyHp = 0;
                zone.enemies.forEach(eId => {
                    avgEnemyHp += ENEMY_TYPES[eId].baseHp;
                });
                avgEnemyHp = Math.floor((avgEnemyHp / zone.enemies.length) * levelMultiplier);
                scaledHp = Math.floor(avgEnemyHp * 6 * 1.2);
                enemyDamage = Math.floor(stage4EnemyDamage * 1.5);
            }
        } else {
            enemyDamage = baseDamage + (tierMultiplier - 1) * 2 + enemyLevel + battle.stageIndex + (battle.currentWave - 1);
        }

        const baseGold = 1 + tierMultiplier;
        goldMin = isBoss ? baseGold * 5 : baseGold;
        goldMax = isBoss ? baseGold * 8 : baseGold + 1;

        const reducedXp = Math.max(1, Math.floor(scaledXp * 0.33));
        xpMin = isBoss ? reducedXp * 3 : reducedXp;
        xpMax = isBoss ? reducedXp * 4 : reducedXp + 1;
    }

    // Build enemy name with level indicator (bosses always show Lv.1)
    const displayName = isBoss ? `${enemyType.name} Lv.1` : `${enemyType.name} Lv.${battle.stageIndex + 1}`;

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

    // Roll for ingredient drops (common and uncommon)
    const drops = rollIngredientDrops(['common', 'uncommon']);
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

    // Grant rewards
    gameState.hero.gold += battle.goldEarned;
    gameState.hero.xp += battle.xpEarned;
    checkLevelUp();

    // Mark stage as completed
    gameState.questProgress[battle.questId][battle.stageIndex] = true;

    // Check if entire quest is complete
    const questComplete = gameState.questProgress[battle.questId].every(s => s);

    // For regular quests, add to pending rewards
    if (questComplete && !gameState.completedQuests.includes(battle.questId)) {
        if (!gameState.pendingRewards.includes(battle.questId)) {
            gameState.pendingRewards.push(battle.questId);
        }
    }

    // Check if this is a replay (quest reward already claimed)
    const isReplay = gameState.completedQuests.includes(battle.questId);

    // Show victory screen
    document.getElementById('victory-title').textContent = 'Victory';
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

    // Show quest complete message (only on first completion)
    if (questComplete && !isReplay) {
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
        nextStageBtn.onclick = null; // Reset any custom onclick
    }

    // Update back button text
    const backBtn = document.getElementById('btn-back-job-board');
    backBtn.textContent = 'Back to Job Board';

    // Auto-replay: restart same stage after short delay
    if (gameState.autoReplay) {
        setTimeout(() => {
            startBattle(battle.questId, battle.stageIndex);
        }, 300);
        return;
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
