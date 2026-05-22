// Threads to Obsidian - Options Page Script

// English default prompt template (used when language = en or auto-resolved to en)
const DEFAULT_PROMPT_TEMPLATE_EN = `Below is a Threads SNS post. Analyze it and transform it into the format below.
Write all content in English.

---
Author: {author}
Original:
{content}
---

**[Required] The very first line of your response MUST be the title in this exact format:**
<<TITLE>>A concise summary title within 15 characters<</TITLE>>

(Do not add anything besides the title on that line. Start the body on the next line.)

## 1. Executive Summary

(1) The core message in one sentence
(2) Three main points as a numbered list
(3) Description of the target audience

---

## 2. Key Concepts

| Term | Description | Context |
|------|-------------|---------|
(Extract major concepts from the post into a table)

---

## 3. Detailed Notes

(Explain the content paragraph by paragraph in detail, including background, main arguments, and supporting evidence)

---

## 4. Action Items

- [ ] (Actionable items derived from the post as a checkbox list)

---

## 5. Feynman Explanation

(Use the Feynman technique to explain the core content so even a child can understand)

Follow the format above exactly. Keep section headers and dividers intact.`;

// Korean default prompt template
const DEFAULT_PROMPT_TEMPLATE_KO = `다음은 Threads SNS 게시글입니다. 이 게시글을 분석하여 아래 형식으로 변환해주세요.
모든 내용은 한국어로 작성하세요.

---
게시자: {author}
원문:
{content}
---

**[필수] 응답의 맨 첫 줄은 반드시 아래 형식으로 제목을 출력해야 합니다:**
<<TITLE>>15자 내외의 핵심 요약 제목<</TITLE>>

(제목 외에 어떤 말도 덧붙이지 마세요. 바로 다음 줄부터 본문을 시작하세요)

## 1. 핵심 요약 (Executive Summary)

(1) 핵심 메시지 한 문장으로 요약
(2) 주요 포인트 3개를 번호 목록으로
(3) 대상 독자 설명

---

## 2. 주요 개념 (Key Concepts)

| 개념/용어 | 설명 | 맥락 |
|----------|------|------|
(게시글에서 추출한 주요 개념들을 테이블로 정리)

---

## 3. 상세 노트 (Detailed Notes)

(게시글의 내용을 단락별로 상세하게 풀어서 설명. 배경 맥락, 주요 논점, 근거 등 포함)

---

## 4. 실행 아이템 (Action Items)

- [ ] (게시글에서 도출한 실행 가능한 항목들을 체크박스 목록으로)

---

## 5. 쉬운 설명 (Feynman Explanation)

(Feynman 기법으로 게시글의 핵심 내용을 초등학생도 이해할 수 있게 쉽게 설명)

위 형식을 정확히 따라서 출력하세요. 섹션 헤더와 구분선을 유지하세요.`;

function getDefaultPromptTemplate() {
    return i18n.getCurrentLanguage() === 'ko' ? DEFAULT_PROMPT_TEMPLATE_KO : DEFAULT_PROMPT_TEMPLATE_EN;
}

// AI Provider configurations
const AI_PROVIDERS = {
    openai: { defaultModel: 'gpt-4o', showEndpoint: false },
    gemini: { defaultModel: 'gemini-2.0-flash', showEndpoint: false },
    anthropic: { defaultModel: 'claude-3-5-sonnet-latest', showEndpoint: false },
    grok: { defaultModel: 'grok-3', showEndpoint: false },
    zai: {
        defaultModel: 'GLM-4.5',
        showEndpoint: true,
        defaultEndpoint: 'https://api.z.ai/api/coding/paas/v4/chat/completions'
    },
    custom: { defaultModel: '', showEndpoint: true }
};

// Default settings (AI transformation OFF by default)
const DEFAULT_SETTINGS = {
    language: 'auto',
    triggerOnLike: true,
    triggerOnSave: true,
    saveMethod: 'rest',
    uriVaultMode: 'specified',
    protocol: 'http',
    host: 'localhost',
    port: '27123',
    apiKey: '',
    vaultName: '',
    notesFolder: 'Threads',
    useYearMonthFolders: false,
    imageFolder: 'Threads_img',
    imageFolderMode: 'fixed',
    fileNameType: 'postDate',
    downloadImages: false,
    showNotification: true,
    // Comment collection
    collectComments: false,
    commentMaxCount: 20,
    commentScope: 'all',
    commentMinLength: 0,
    // AI Settings (disabled by default)
    aiEnabled: false,
    aiActiveProvider: 'openai',
    aiMaxTokens: 64000,
    aiPromptTemplate: '',
    providerSettings: {
        openai: { apiKey: '', model: 'gpt-4o-mini', endpoint: '' },
        gemini: { apiKey: '', model: 'gemini-2.0-flash', endpoint: '' },
        anthropic: { apiKey: '', model: 'claude-3-5-sonnet-latest', endpoint: '' },
        grok: { apiKey: '', model: 'grok-3', endpoint: '' },
        zai: { apiKey: '', model: 'GLM-4.5', endpoint: 'https://api.z.ai/api/coding/paas/v4/chat/completions' },
        custom: { apiKey: '', model: '', endpoint: '' }
    },
    aiProvider: 'openai',
    aiApiKey: '',
    aiEndpoint: '',
    aiModel: 'gpt-4o-mini',
    aiApiKeys: {}
};

const elements = {
    language: document.getElementById('language'),
    triggerOnLike: document.getElementById('triggerOnLike'),
    triggerOnSave: document.getElementById('triggerOnSave'),
    saveMethod: document.getElementById('saveMethod'),
    restApiSettings: document.getElementById('restApiSettings'),
    uriSettings: document.getElementById('uriSettings'),
    saveMethodHint: document.getElementById('saveMethodHint'),
    uriVaultMode: document.getElementById('uriVaultMode'),
    uriVaultModeContainer: document.getElementById('uriVaultModeContainer'),
    vaultNameHint: document.getElementById('vaultNameHint'),
    protocol: document.getElementById('protocol'),
    host: document.getElementById('host'),
    port: document.getElementById('port'),
    apiKey: document.getElementById('apiKey'),
    vaultName: document.getElementById('vaultName'),
    notesFolder: document.getElementById('notesFolder'),
    useYearMonthFolders: document.getElementById('useYearMonthFolders'),
    imageFolder: document.getElementById('imageFolder'),
    imageFolderMode: document.getElementById('imageFolderMode'),
    imageFolderModeContainer: document.getElementById('imageFolderModeContainer'),
    fileNameType: document.getElementById('fileNameType'),
    downloadImages: document.getElementById('downloadImages'),
    showNotification: document.getElementById('showNotification'),
    collectComments: document.getElementById('collectComments'),
    commentMaxCount: document.getElementById('commentMaxCount'),
    commentScope: document.getElementById('commentScope'),
    commentMinLength: document.getElementById('commentMinLength'),
    commentOptions: document.getElementById('commentOptions'),
    testConnection: document.getElementById('testConnection'),
    connectionStatus: document.getElementById('connectionStatus'),
    saveSettings: document.getElementById('saveSettings'),
    resetSettings: document.getElementById('resetSettings'),
    saveStatus: document.getElementById('saveStatus'),
    aiEnabled: document.getElementById('aiEnabled'),
    aiActiveProvider: document.getElementById('aiActiveProvider'),
    aiMaxTokens: document.getElementById('aiMaxTokens'),
    aiPromptTemplate: document.getElementById('aiPromptTemplate'),
    resetPromptTemplate: document.getElementById('resetPromptTemplate')
};

const PROVIDER_LIST = ['openai', 'gemini', 'anthropic', 'grok', 'zai', 'custom'];

function updateProviderStatus(provider, configured) {
    const statusEl = document.getElementById(`status-${provider}`);
    if (statusEl) {
        statusEl.textContent = configured ? `✅ ${i18n.getMessage('configured')}` : '';
        statusEl.className = 'provider-status ' + (configured ? 'configured' : 'not-configured');
    }
}

function initializeProviderModels() {
    // All providers use text input — no initialization needed.
}

async function loadSettings() {
    const stored = await chrome.storage.sync.get('settings');
    const settings = { ...DEFAULT_SETTINGS, ...stored.settings };
    const providerSettings = { ...DEFAULT_SETTINGS.providerSettings, ...(settings.providerSettings || {}) };

    elements.language.value = settings.language || 'auto';
    elements.triggerOnLike.checked = settings.triggerOnLike;
    elements.triggerOnSave.checked = settings.triggerOnSave;
    elements.saveMethod.value = settings.saveMethod || 'rest';
    elements.uriVaultMode.value = settings.uriVaultMode || 'specified';
    updateSaveMethodVisibility();
    elements.protocol.value = settings.protocol;
    elements.host.value = settings.host;
    elements.port.value = settings.port;
    elements.apiKey.value = settings.apiKey;
    elements.vaultName.value = settings.vaultName;
    elements.notesFolder.value = settings.notesFolder;
    elements.useYearMonthFolders.checked = settings.useYearMonthFolders;
    elements.imageFolder.value = settings.imageFolder;
    elements.imageFolderMode.value = settings.imageFolderMode || 'fixed';
    elements.fileNameType.value = settings.fileNameType;
    elements.downloadImages.checked = settings.downloadImages;
    elements.showNotification.checked = settings.showNotification;

    elements.collectComments.checked = !!settings.collectComments;
    elements.commentMaxCount.value = settings.commentMaxCount ?? 20;
    elements.commentScope.value = settings.commentScope || 'all';
    elements.commentMinLength.value = settings.commentMinLength ?? 0;
    updateCommentOptionsVisibility();

    updateImageFolderModeVisibility();

    elements.aiEnabled.checked = settings.aiEnabled;
    elements.aiActiveProvider.value = settings.aiActiveProvider || settings.aiProvider || 'openai';
    elements.aiMaxTokens.value = settings.aiMaxTokens || 64000;
    elements.aiPromptTemplate.value = settings.aiPromptTemplate || getDefaultPromptTemplate();

    initializeProviderModels();

    PROVIDER_LIST.forEach(provider => {
        const ps = providerSettings[provider] || {};
        const apiKeyEl = document.getElementById(`apiKey-${provider}`);
        if (apiKeyEl) {
            const legacyKey = settings.aiApiKeys?.[provider] || '';
            apiKeyEl.value = ps.apiKey || legacyKey || '';
        }
        const modelEl = document.getElementById(`model-${provider}`);
        if (modelEl) {
            modelEl.value = ps.model || AI_PROVIDERS[provider]?.defaultModel || '';
        }
        const endpointEl = document.getElementById(`endpoint-${provider}`);
        if (endpointEl) {
            endpointEl.value = ps.endpoint || AI_PROVIDERS[provider]?.defaultEndpoint || '';
        }
        updateProviderStatus(provider, !!apiKeyEl?.value);
    });

    updateActiveProviderCard(settings.aiActiveProvider || settings.aiProvider || 'openai');
}

function updateActiveProviderCard(activeProvider) {
    PROVIDER_LIST.forEach(provider => {
        const card = document.querySelector(`.provider-card[data-provider="${provider}"]`);
        if (card) {
            card.dataset.active = (provider === activeProvider).toString();
        }
    });
}

function collectProviderSettings() {
    const providerSettings = {};
    PROVIDER_LIST.forEach(provider => {
        providerSettings[provider] = {
            apiKey: document.getElementById(`apiKey-${provider}`)?.value.trim() || '',
            model: document.getElementById(`model-${provider}`)?.value || '',
            endpoint: document.getElementById(`endpoint-${provider}`)?.value.trim() || ''
        };
    });
    return providerSettings;
}

function buildSettingsObject() {
    const providerSettings = collectProviderSettings();
    const activeProvider = elements.aiActiveProvider.value;
    const activePs = providerSettings[activeProvider];

    return {
        settings: {
            language: elements.language.value,
            triggerOnLike: elements.triggerOnLike.checked,
            triggerOnSave: elements.triggerOnSave.checked,
            saveMethod: elements.saveMethod.value,
            uriVaultMode: elements.uriVaultMode.value,
            protocol: elements.protocol.value,
            host: elements.host.value.trim(),
            port: elements.port.value.trim(),
            apiKey: elements.apiKey.value.trim(),
            vaultName: elements.vaultName.value.trim(),
            notesFolder: elements.notesFolder.value.trim() || 'Threads',
            useYearMonthFolders: elements.useYearMonthFolders.checked,
            imageFolder: elements.imageFolder.value.trim() || 'Threads_img',
            imageFolderMode: elements.imageFolderMode.value,
            fileNameType: elements.fileNameType.value,
            downloadImages: elements.downloadImages.checked,
            showNotification: elements.showNotification.checked,
            collectComments: elements.collectComments.checked,
            commentMaxCount: clampInt(elements.commentMaxCount.value, 1, 100, 20),
            commentScope: elements.commentScope.value,
            commentMinLength: clampInt(elements.commentMinLength.value, 0, 500, 0),
            aiEnabled: elements.aiEnabled.checked,
            aiActiveProvider: activeProvider,
            aiMaxTokens: parseInt(elements.aiMaxTokens.value) || 64000,
            aiPromptTemplate: elements.aiPromptTemplate.value || getDefaultPromptTemplate(),
            providerSettings,
            aiProvider: activeProvider,
            aiApiKey: activePs.apiKey,
            aiModel: activePs.model,
            aiEndpoint: activePs.endpoint,
            aiApiKeys: Object.fromEntries(PROVIDER_LIST.map(p => [p, providerSettings[p].apiKey]))
        },
        providerSettings,
        activeProvider
    };
}

async function saveSettings() {
    const previousLanguage = (await chrome.storage.sync.get('settings'))?.settings?.language || 'auto';
    const { settings, providerSettings, activeProvider } = buildSettingsObject();

    // Request host permission for custom endpoints
    const customEndpoints = [];
    if (providerSettings.custom?.endpoint) customEndpoints.push(providerSettings.custom.endpoint);
    if (
        providerSettings.zai?.endpoint &&
        providerSettings.zai.endpoint !== 'https://api.z.ai/api/coding/paas/v4/chat/completions'
    ) {
        customEndpoints.push(providerSettings.zai.endpoint);
    }

    for (const endpoint of customEndpoints) {
        try {
            const url = new URL(endpoint);
            const origin = `${url.protocol}//${url.hostname}/*`;
            const granted = await chrome.permissions.request({ origins: [origin] });
            if (!granted) {
                showStatus(elements.saveStatus, `⚠️ ${i18n.getMessage('permissionDenied', url.hostname)}`, 'error');
                return;
            }
        } catch (e) {
            console.warn('Permission request failed for endpoint:', endpoint, e);
        }
    }

    await chrome.storage.sync.set({ settings });
    showStatus(elements.saveStatus, `✅ ${i18n.getMessage('settingsSaved')}`, 'success');
    updateActiveProviderCard(activeProvider);

    // Reload page if language changed so all i18n applies.
    if (settings.language !== previousLanguage) {
        setTimeout(() => location.reload(), 600);
    }
}

async function saveSettingsQuietly() {
    const { settings } = buildSettingsObject();
    await chrome.storage.sync.set({ settings });
}

async function resetSettings() {
    await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
    await loadSettings();
    showStatus(elements.saveStatus, `🔄 ${i18n.getMessage('settingsReset')}`, 'success');
}

async function testConnection() {
    elements.testConnection.disabled = true;
    elements.testConnection.textContent = `🔄 ${i18n.getMessage('connecting')}`;

    try {
        await saveSettingsQuietly();
        const result = await chrome.runtime.sendMessage({ type: 'TEST_CONNECTION' });
        if (result.success) {
            showStatus(elements.connectionStatus, '✅ ' + result.message, 'success');
        } else {
            showStatus(elements.connectionStatus, '❌ ' + result.message, 'error');
        }
    } catch (error) {
        showStatus(elements.connectionStatus, `❌ ${i18n.getMessage('errConnError', error.message)}`, 'error');
    }

    elements.testConnection.disabled = false;
    elements.testConnection.textContent = `🔍 ${i18n.getMessage('testConnection')}`;
}

function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `connection-status show ${type}`;
    setTimeout(() => element.classList.remove('show'), 3000);
}

function clampInt(value, min, max, fallback) {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.max(min, Math.min(max, n));
}

function updateCommentOptionsVisibility() {
    elements.commentOptions.style.display = elements.collectComments.checked ? 'block' : 'none';
}

function updateImageFolderModeVisibility() {
    elements.imageFolderModeContainer.style.display = elements.useYearMonthFolders.checked ? 'block' : 'none';
}

function updateSaveMethodVisibility() {
    const isRest = elements.saveMethod.value === 'rest';
    elements.restApiSettings.style.display = isRest ? 'block' : 'none';
    elements.uriSettings.style.display = isRest ? 'none' : 'block';
    elements.saveMethodHint.textContent = isRest
        ? i18n.getMessage('saveMethodRestHint')
        : i18n.getMessage('saveMethodUriHint');

    elements.uriVaultModeContainer.style.display = isRest ? 'none' : 'block';
    if (!isRest) {
        elements.downloadImages.checked = false;
        elements.downloadImages.disabled = true;
    } else {
        elements.downloadImages.disabled = false;
    }
}

elements.saveSettings.addEventListener('click', saveSettings);
elements.resetSettings.addEventListener('click', resetSettings);
elements.testConnection.addEventListener('click', testConnection);
elements.saveMethod.addEventListener('change', updateSaveMethodVisibility);
elements.useYearMonthFolders.addEventListener('change', updateImageFolderModeVisibility);
elements.collectComments.addEventListener('change', updateCommentOptionsVisibility);

elements.aiActiveProvider.addEventListener('change', (e) => {
    updateActiveProviderCard(e.target.value);
});

elements.resetPromptTemplate.addEventListener('click', () => {
    elements.aiPromptTemplate.value = getDefaultPromptTemplate();
    showStatus(elements.saveStatus, `🔄 ${i18n.getMessage('templateReset')}`, 'success');
});

document.querySelectorAll('.provider-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const provider = e.target.dataset.provider;
        if (provider) toggleProviderCard(provider);
    });
});

document.querySelectorAll('.provider-header').forEach(header => {
    header.addEventListener('click', (e) => {
        if (e.target.classList.contains('provider-toggle-btn')) return;
        const card = header.closest('.provider-card');
        const provider = card?.dataset.provider;
        if (provider) toggleProviderCard(provider);
    });
});

document.querySelectorAll('.test-provider-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const provider = e.target.dataset.provider;
        if (provider) testProviderConnection(provider);
    });
});

function toggleProviderCard(provider) {
    const body = document.getElementById(`body-${provider}`);
    const btn = document.querySelector(`.provider-card[data-provider="${provider}"] .provider-toggle-btn`);

    if (body.style.display === 'none') {
        body.style.display = 'block';
        if (btn) btn.classList.add('open');
    } else {
        body.style.display = 'none';
        if (btn) btn.classList.remove('open');
    }
}

async function testProviderConnection(provider) {
    const resultEl = document.getElementById(`result-${provider}`);
    resultEl.textContent = i18n.getMessage('testing');
    resultEl.className = 'test-result';

    try {
        await saveSettingsQuietly();

        const apiKey = document.getElementById(`apiKey-${provider}`)?.value.trim();
        const model = document.getElementById(`model-${provider}`)?.value.trim();
        const endpoint = document.getElementById(`endpoint-${provider}`)?.value.trim() || '';

        if (!apiKey) {
            resultEl.textContent = `❌ ${i18n.getMessage('enterApiKey')}`;
            resultEl.className = 'test-result error';
            return;
        }

        const result = await chrome.runtime.sendMessage({
            type: 'TEST_AI_CONNECTION',
            provider,
            apiKey,
            model,
            endpoint
        });

        if (result.success) {
            resultEl.textContent = `✅ ${i18n.getMessage('connSuccess')}`;
            resultEl.className = 'test-result success';
            updateProviderStatus(provider, true);
        } else {
            resultEl.textContent = '❌ ' + (result.message || i18n.getMessage('connFailed'));
            resultEl.className = 'test-result error';
        }
    } catch (error) {
        resultEl.textContent = '❌ ' + error.message;
        resultEl.className = 'test-result error';
    }
}

const versionEl = document.getElementById('versionText');
if (versionEl) {
    versionEl.textContent = `v${chrome.runtime.getManifest().version}`;
}

async function init() {
    await i18n.init();
    i18n.applyTranslations(document);
    await loadSettings();
}

init();
