// ============================================================
// MAIN - INITIALIZATION & EVENT LISTENERS
// ============================================================

// ------------------------------------------------------------
// EVENT LISTENERS
// ------------------------------------------------------------

// Tab navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
});

// Stat allocation
document.querySelectorAll('#tab-character .stat-btn').forEach(btn => {
    btn.addEventListener('click', () => allocateStat(btn.dataset.stat));
});

// Attack button
document.getElementById('attack-button').addEventListener('click', () => {
    if (gameState.battle.active) {
        dealDamageToEnemy(true);
    }
});

// Retreat button
document.getElementById('btn-retreat').addEventListener('click', retreat);

// Speed control buttons
document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const speed = parseInt(btn.dataset.speed);
        gameState.combatSpeed = speed;

        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Victory screen buttons
document.getElementById('btn-next-stage').addEventListener('click', () => {
    const questId = gameState.battle.questId;
    const progress = gameState.questProgress[questId];
    const nextStage = progress.findIndex(s => !s);

    if (nextStage !== -1) {
        startBattle(questId, nextStage);
    }
});

document.getElementById('btn-back-job-board').addEventListener('click', () => {
    const questId = gameState.battle.questId;
    const quest = getQuestById(questId);
    showScreen('dashboard');
    openJobBoard(quest.cityId);
});

// Continue button (defeat screen)
document.getElementById('btn-defeat-continue').addEventListener('click', () => {
    const questId = gameState.battle.questId;
    const quest = getQuestById(questId);
    showScreen('dashboard');
    openJobBoard(quest.cityId);
});

// Combat log toggle
document.getElementById('log-header').addEventListener('click', () => {
    const log = document.getElementById('combat-log');
    const icon = document.getElementById('log-toggle-icon');
    log.classList.toggle('collapsed');
    icon.textContent = log.classList.contains('collapsed') ? '+' : '-';

    if (!log.classList.contains('collapsed')) {
        const content = document.getElementById('log-content');
        setTimeout(() => {
            content.scrollTop = content.scrollHeight;
        }, 50);
    }
});

// ------------------------------------------------------------
// PASSIVE INCOME TICKER
// ------------------------------------------------------------
setInterval(() => {
    if (gameState.introSeen) {
        const earned = collectPassiveIncome();
        // Could show a notification for income if desired
    }
}, 60000); // Check every minute

// ------------------------------------------------------------
// INITIALIZATION
// ------------------------------------------------------------
function init() {
    const derived = getDerivedStats();
    gameState.hero.maxHp = derived.maxHp;
    gameState.hero.hp = derived.maxHp;
    gameState.autoAttackInterval = derived.attackInterval;

    // Check initial building unlocks
    checkBuildingUnlocks();

    // Render intro or go to dashboard
    if (!gameState.introSeen) {
        renderIntroScreen();
        showScreen('intro');
    } else {
        showScreen('dashboard');
    }
}

// Start the game
init();
