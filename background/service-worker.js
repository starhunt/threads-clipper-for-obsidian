// Threads Clipper for Obsidian - URI release service worker

const DEFAULT_SETTINGS = {
  triggerOnLike: true,
  triggerOnSave: true,
  vaultName: '',
  uriVaultMode: 'lastActive',
  notesFolder: 'Threads Clipper',
  useYearMonthFolders: true,
  imageFolder: 'Threads Clipper_media',
  imageFolderMode: 'relative',
  fileNameType: 'postDate',
  downloadImages: false,
  showNotification: true
};

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.sync.get('settings');
  if (!stored.settings) {
    await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
  }
});

async function getSettings() {
  const stored = await chrome.storage.sync.get('settings');
  return { ...DEFAULT_SETTINGS, ...(stored.settings || {}) };
}

async function updateStats() {
  const stored = await chrome.storage.local.get(['savedPosts', 'todayPosts', 'lastDate']);
  const today = new Date().toDateString();
  const savedPosts = (stored.savedPosts || 0) + 1;
  const todayPosts = stored.lastDate !== today ? 1 : (stored.todayPosts || 0) + 1;

  await chrome.storage.local.set({ savedPosts, todayPosts, lastDate: today });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SETTINGS') {
    getSettings().then((settings) => sendResponse(settings));
    return true;
  }

  if (message.type === 'GET_URI_STATUS') {
    sendResponse({ success: true, message: 'Obsidian URI mode ready' });
    return true;
  }

  if (message.type === 'RECORD_URI_SAVE') {
    (async () => {
      try {
        await updateStats();
        const settings = await getSettings();
        if (settings.showNotification) {
          chrome.notifications?.create({
            type: 'basic',
            iconUrl: 'assets/icons/icon48.png',
            title: 'Threads Clipper for Obsidian',
            message: `Prepared in Obsidian: ${message.data.filename}`
          });
        }
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }
});

