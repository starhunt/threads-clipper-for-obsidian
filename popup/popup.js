// Threads to Obsidian - Popup Script

// DOM Elements
const elements = {
    statusCard: document.getElementById('statusCard'),
    statusIndicator: document.getElementById('statusIndicator'),
    statusMessage: document.getElementById('statusMessage'),
    savedCount: document.getElementById('savedCount'),
    todayCount: document.getElementById('todayCount'),
    quickLike: document.getElementById('quickLike'),
    quickSave: document.getElementById('quickSave'),
    openOptions: document.getElementById('openOptions'),
    testConnection: document.getElementById('testConnection'),
    helpLink: document.getElementById('helpLink')
};

// Initialize popup
async function init() {
    await loadSettings();
    await checkConnection();
    await loadStats();
}

// Load settings
async function loadSettings() {
    const stored = await chrome.storage.sync.get('settings');
    const settings = stored.settings || {};

    elements.quickLike.checked = settings.triggerOnLike !== false;
    elements.quickSave.checked = settings.triggerOnSave !== false;
}

// Check connection to Obsidian
async function checkConnection() {
    try {
        const result = await chrome.runtime.sendMessage({ type: 'TEST_CONNECTION' });

        if (result.success) {
            elements.statusIndicator.className = 'status-indicator connected';
            elements.statusMessage.textContent = 'Obsidian 연결됨';
        } else {
            elements.statusIndicator.className = 'status-indicator error';
            elements.statusMessage.textContent = '연결 실패';
        }
    } catch (error) {
        elements.statusIndicator.className = 'status-indicator error';
        elements.statusMessage.textContent = '연결 오류';
    }
}

// Load stats from storage
async function loadStats() {
    const stored = await chrome.storage.local.get(['savedPosts', 'todayPosts', 'lastDate']);

    const today = new Date().toDateString();
    let todayPosts = stored.todayPosts || 0;

    // Reset today count if it's a new day
    if (stored.lastDate !== today) {
        todayPosts = 0;
        await chrome.storage.local.set({ todayPosts: 0, lastDate: today });
    }

    elements.savedCount.textContent = stored.savedPosts || 0;
    elements.todayCount.textContent = todayPosts;
}

// Save quick settings
async function saveQuickSettings() {
    const stored = await chrome.storage.sync.get('settings');
    const settings = stored.settings || {};

    settings.triggerOnLike = elements.quickLike.checked;
    settings.triggerOnSave = elements.quickSave.checked;

    await chrome.storage.sync.set({ settings });
}

// Event listeners
elements.quickLike.addEventListener('change', saveQuickSettings);
elements.quickSave.addEventListener('change', saveQuickSettings);

elements.openOptions.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});

elements.testConnection.addEventListener('click', async () => {
    elements.statusIndicator.className = 'status-indicator';
    elements.statusMessage.textContent = '연결 확인 중...';
    await checkConnection();
});

elements.helpLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/starhunt/sns_to_obsidian#readme' });
});

// Set version from manifest
const versionEl = document.getElementById('versionText');
if (versionEl) {
    versionEl.textContent = `v${chrome.runtime.getManifest().version}`;
}

// Initialize
init();
