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

const elements = {
  triggerOnLike: document.getElementById('triggerOnLike'),
  triggerOnSave: document.getElementById('triggerOnSave'),
  vaultName: document.getElementById('vaultName'),
  uriVaultMode: document.getElementById('uriVaultMode'),
  notesFolder: document.getElementById('notesFolder'),
  useYearMonthFolders: document.getElementById('useYearMonthFolders'),
  imageFolder: document.getElementById('imageFolder'),
  imageFolderMode: document.getElementById('imageFolderMode'),
  imageFolderModeContainer: document.getElementById('imageFolderModeContainer'),
  fileNameType: document.getElementById('fileNameType'),
  downloadImages: document.getElementById('downloadImages'),
  showNotification: document.getElementById('showNotification'),
  saveSettings: document.getElementById('saveSettings'),
  resetSettings: document.getElementById('resetSettings'),
  saveStatus: document.getElementById('saveStatus')
};

function showStatus(message, kind) {
  elements.saveStatus.textContent = message;
  elements.saveStatus.className = `save-status show ${kind}`;
}

function updateImageFolderModeVisibility() {
  elements.imageFolderModeContainer.style.display = elements.useYearMonthFolders.checked ? 'block' : 'none';
}

async function loadSettings() {
  const stored = await chrome.storage.sync.get('settings');
  const settings = { ...DEFAULT_SETTINGS, ...(stored.settings || {}) };

  elements.triggerOnLike.checked = settings.triggerOnLike;
  elements.triggerOnSave.checked = settings.triggerOnSave;
  elements.vaultName.value = settings.vaultName;
  elements.uriVaultMode.value = settings.uriVaultMode;
  elements.notesFolder.value = settings.notesFolder;
  elements.useYearMonthFolders.checked = settings.useYearMonthFolders;
  elements.imageFolder.value = settings.imageFolder;
  elements.imageFolderMode.value = settings.imageFolderMode;
  elements.fileNameType.value = settings.fileNameType;
  elements.downloadImages.checked = false;
  elements.showNotification.checked = settings.showNotification;
  updateImageFolderModeVisibility();
}

async function saveSettings() {
  const settings = {
    triggerOnLike: elements.triggerOnLike.checked,
    triggerOnSave: elements.triggerOnSave.checked,
    vaultName: elements.vaultName.value.trim(),
    uriVaultMode: elements.uriVaultMode.value,
    notesFolder: elements.notesFolder.value.trim() || 'Threads Clipper',
    useYearMonthFolders: elements.useYearMonthFolders.checked,
    imageFolder: elements.imageFolder.value.trim() || 'Threads Clipper_media',
    imageFolderMode: elements.imageFolderMode.value,
    fileNameType: elements.fileNameType.value,
    downloadImages: false,
    showNotification: elements.showNotification.checked
  };

  await chrome.storage.sync.set({ settings });
  showStatus('✅ 설정이 저장되었습니다.', 'success');
}

async function resetSettings() {
  await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
  await loadSettings();
  showStatus('🔄 기본 설정으로 복원되었습니다.', 'success');
}

elements.saveSettings.addEventListener('click', saveSettings);
elements.resetSettings.addEventListener('click', resetSettings);
elements.useYearMonthFolders.addEventListener('change', updateImageFolderModeVisibility);

const versionEl = document.getElementById('versionText');
if (versionEl) {
  versionEl.textContent = `v${chrome.runtime.getManifest().version}`;
}

loadSettings();

