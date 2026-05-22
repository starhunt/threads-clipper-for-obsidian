// Threads to Obsidian - Popup Script

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

async function init() {
    await i18n.init();
    i18n.applyTranslations(document);
    await loadSettings();
    await checkConnection();
    await loadStats();
}

async function loadSettings() {
    const stored = await chrome.storage.sync.get('settings');
    const settings = stored.settings || {};

    elements.quickLike.checked = settings.triggerOnLike !== false;
    elements.quickSave.checked = settings.triggerOnSave !== false;
}

async function checkConnection() {
    try {
        const result = await chrome.runtime.sendMessage({ type: 'TEST_CONNECTION' });

        if (result.success) {
            elements.statusIndicator.className = 'status-indicator connected';
            elements.statusMessage.textContent = i18n.getMessage('statusConnected');
        } else {
            elements.statusIndicator.className = 'status-indicator error';
            elements.statusMessage.textContent = i18n.getMessage('statusFailed');
        }
    } catch (error) {
        elements.statusIndicator.className = 'status-indicator error';
        elements.statusMessage.textContent = i18n.getMessage('statusError');
    }
}

async function loadStats() {
    const stored = await chrome.storage.local.get(['savedPosts', 'todayPosts', 'lastDate']);

    const today = new Date().toDateString();
    let todayPosts = stored.todayPosts || 0;

    if (stored.lastDate !== today) {
        todayPosts = 0;
        await chrome.storage.local.set({ todayPosts: 0, lastDate: today });
    }

    elements.savedCount.textContent = stored.savedPosts || 0;
    elements.todayCount.textContent = todayPosts;
}

async function saveQuickSettings() {
    const stored = await chrome.storage.sync.get('settings');
    const settings = stored.settings || {};

    settings.triggerOnLike = elements.quickLike.checked;
    settings.triggerOnSave = elements.quickSave.checked;

    await chrome.storage.sync.set({ settings });
}

elements.quickLike.addEventListener('change', saveQuickSettings);
elements.quickSave.addEventListener('change', saveQuickSettings);

elements.openOptions.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});

elements.testConnection.addEventListener('click', async () => {
    elements.statusIndicator.className = 'status-indicator';
    elements.statusMessage.textContent = i18n.getMessage('statusChecking');
    await checkConnection();
});

elements.helpLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/starhunt/threads-clipper-for-obsidian#readme' });
});

const versionEl = document.getElementById('versionText');
if (versionEl) {
    versionEl.textContent = `v${chrome.runtime.getManifest().version}`;
}

init();
