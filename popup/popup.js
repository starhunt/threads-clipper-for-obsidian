const elements = {
    statusIndicator: document.getElementById('statusIndicator'),
    statusMessage: document.getElementById('statusMessage'),
    savedCount: document.getElementById('savedCount'),
    todayCount: document.getElementById('todayCount'),
    quickLike: document.getElementById('quickLike'),
    quickSave: document.getElementById('quickSave'),
    openOptions: document.getElementById('openOptions'),
    howItWorks: document.getElementById('howItWorks'),
    helpLink: document.getElementById('helpLink')
};

async function init() {
    await loadSettings();
    await loadStats();
}

async function loadSettings() {
    const stored = await chrome.storage.sync.get('settings');
    const settings = stored.settings || {};
    elements.quickLike.checked = settings.triggerOnLike !== false;
    elements.quickSave.checked = settings.triggerOnSave !== false;
    elements.statusIndicator.className = 'status-indicator connected';
    elements.statusMessage.textContent = 'Obsidian URI 모드 준비 완료';
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
elements.openOptions.addEventListener('click', () => chrome.runtime.openOptionsPage());
elements.howItWorks.addEventListener('click', () => chrome.tabs.create({ url: 'https://help.obsidian.md/Extending+Obsidian/Obsidian+URI' }));
elements.helpLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/starhunt/sns_to_obsidian#readme' });
});

const versionEl = document.getElementById('versionText');
if (versionEl) {
    versionEl.textContent = `v${chrome.runtime.getManifest().version}`;
}

init();

