// Threads to Obsidian - Options Page Script

// Default prompt template for AI transformation (includes title generation)
const DEFAULT_PROMPT_TEMPLATE = `다음은 Threads SNS 게시글입니다. 이 게시글을 분석하여 아래 형식으로 변환해주세요.
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

// AI Provider configurations
const AI_PROVIDERS = {
    openai: {
        defaultModel: 'gpt-4o',
        showEndpoint: false
    },
    gemini: {
        defaultModel: 'gemini-2.0-flash',
        showEndpoint: false
    },
    anthropic: {
        defaultModel: 'claude-3-5-sonnet-latest',
        showEndpoint: false
    },
    grok: {
        defaultModel: 'grok-3',
        showEndpoint: false
    },
    zai: {
        defaultModel: 'GLM-4.5',
        showEndpoint: true,
        defaultEndpoint: 'https://api.z.ai/api/coding/paas/v4/chat/completions'
    },
    custom: {
        defaultModel: '',
        showEndpoint: true
    }
};

// Default settings with per-provider configuration
const DEFAULT_SETTINGS = {
    triggerOnLike: true,
    triggerOnSave: true,
    saveMethod: 'rest', // 'rest' or 'uri'
    uriVaultMode: 'specified', // 'specified' or 'lastActive'
    protocol: 'http',
    host: 'localhost',
    port: '27123',
    apiKey: '',
    vaultName: '',
    notesFolder: 'Threads',
    useYearMonthFolders: false,
    imageFolder: 'Threads_img',
    imageFolderMode: 'fixed', // 'fixed' or 'relative'
    fileNameType: 'postDate',
    downloadImages: false,
    showNotification: true,
    // AI Settings
    aiEnabled: false,
    aiActiveProvider: 'openai', // New: which provider is currently active
    aiMaxTokens: 64000,
    aiPromptTemplate: DEFAULT_PROMPT_TEMPLATE,
    // Per-provider settings
    providerSettings: {
        openai: { apiKey: '', model: 'gpt-4o-mini', endpoint: '' },
        gemini: { apiKey: '', model: 'gemini-2.0-flash', endpoint: '' },
        anthropic: { apiKey: '', model: 'claude-3-5-sonnet-latest', endpoint: '' },
        grok: { apiKey: '', model: 'grok-3', endpoint: '' },
        zai: { apiKey: '', model: 'GLM-4.5', endpoint: 'https://api.z.ai/api/coding/paas/v4/chat/completions' },
        custom: { apiKey: '', model: '', endpoint: '' }
    },
    // Legacy compatibility
    aiProvider: 'openai',
    aiApiKey: '',
    aiEndpoint: '',
    aiModel: 'gpt-4o-mini',
    aiApiKeys: {}
};

// DOM Elements (basic settings)
const elements = {
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
    testConnection: document.getElementById('testConnection'),
    connectionStatus: document.getElementById('connectionStatus'),
    saveSettings: document.getElementById('saveSettings'),
    resetSettings: document.getElementById('resetSettings'),
    saveStatus: document.getElementById('saveStatus'),
    // AI Elements
    aiEnabled: document.getElementById('aiEnabled'),
    aiActiveProvider: document.getElementById('aiActiveProvider'),
    aiMaxTokens: document.getElementById('aiMaxTokens'),
    aiPromptTemplate: document.getElementById('aiPromptTemplate'),
    resetPromptTemplate: document.getElementById('resetPromptTemplate')
};

// Provider list
const PROVIDER_LIST = ['openai', 'gemini', 'anthropic', 'grok', 'zai', 'custom'];

// Update provider status indicator
function updateProviderStatus(provider, configured) {
    const statusEl = document.getElementById(`status-${provider}`);
    if (statusEl) {
        statusEl.textContent = configured ? '✅ 설정됨' : '';
        statusEl.className = 'provider-status ' + (configured ? 'configured' : 'not-configured');
    }
}

// Initialize model fields (no-op, all providers use text input now)
function initializeProviderModels() {
    // All providers now use text input - no initialization needed
}

// Load settings from storage
async function loadSettings() {
    const stored = await chrome.storage.sync.get('settings');
    const settings = { ...DEFAULT_SETTINGS, ...stored.settings };

    // Merge providerSettings
    const providerSettings = { ...DEFAULT_SETTINGS.providerSettings, ...(settings.providerSettings || {}) };

    // Basic settings
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

    // Show/hide image folder mode based on year/month setting
    updateImageFolderModeVisibility();

    // AI Settings
    elements.aiEnabled.checked = settings.aiEnabled;
    elements.aiActiveProvider.value = settings.aiActiveProvider || settings.aiProvider || 'openai';
    elements.aiMaxTokens.value = settings.aiMaxTokens || 64000;
    elements.aiPromptTemplate.value = settings.aiPromptTemplate || DEFAULT_PROMPT_TEMPLATE;

    // Initialize provider model dropdowns
    initializeProviderModels();

    // Load per-provider settings into cards
    PROVIDER_LIST.forEach(provider => {
        const ps = providerSettings[provider] || {};

        // API Key
        const apiKeyEl = document.getElementById(`apiKey-${provider}`);
        if (apiKeyEl) {
            // Legacy migration: check old aiApiKeys
            const legacyKey = settings.aiApiKeys?.[provider] || '';
            apiKeyEl.value = ps.apiKey || legacyKey || '';
        }

        // Model
        const modelEl = document.getElementById(`model-${provider}`);
        if (modelEl) {
            modelEl.value = ps.model || AI_PROVIDERS[provider]?.defaultModel || '';
        }

        // Endpoint (for zai and custom)
        const endpointEl = document.getElementById(`endpoint-${provider}`);
        if (endpointEl) {
            endpointEl.value = ps.endpoint || AI_PROVIDERS[provider]?.defaultEndpoint || '';
        }

        // Update status
        updateProviderStatus(provider, !!apiKeyEl?.value);
    });

    // Highlight active provider card
    updateActiveProviderCard(settings.aiActiveProvider || settings.aiProvider || 'openai');
}

// Update active provider card highlight
function updateActiveProviderCard(activeProvider) {
    PROVIDER_LIST.forEach(provider => {
        const card = document.querySelector(`.provider-card[data-provider="${provider}"]`);
        if (card) {
            card.dataset.active = (provider === activeProvider).toString();
        }
    });
}

// Save settings to storage
async function saveSettings() {
    // Collect per-provider settings from cards
    const providerSettings = {};
    PROVIDER_LIST.forEach(provider => {
        providerSettings[provider] = {
            apiKey: document.getElementById(`apiKey-${provider}`)?.value.trim() || '',
            model: document.getElementById(`model-${provider}`)?.value || '',
            endpoint: document.getElementById(`endpoint-${provider}`)?.value.trim() || ''
        };
    });

    const activeProvider = elements.aiActiveProvider.value;
    const activePs = providerSettings[activeProvider];

    const settings = {
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
        // AI Settings
        aiEnabled: elements.aiEnabled.checked,
        aiActiveProvider: activeProvider,
        aiMaxTokens: parseInt(elements.aiMaxTokens.value) || 64000,
        aiPromptTemplate: elements.aiPromptTemplate.value || DEFAULT_PROMPT_TEMPLATE,
        providerSettings: providerSettings,
        // Legacy compatibility fields (for service-worker)
        aiProvider: activeProvider,
        aiApiKey: activePs.apiKey,
        aiModel: activePs.model,
        aiEndpoint: activePs.endpoint,
        aiApiKeys: Object.fromEntries(PROVIDER_LIST.map(p => [p, providerSettings[p].apiKey]))
    };

    // 커스텀 엔드포인트에 대한 호스트 권한 요청
    const customEndpoints = [];
    if (providerSettings.custom?.endpoint) customEndpoints.push(providerSettings.custom.endpoint);
    if (providerSettings.zai?.endpoint && providerSettings.zai.endpoint !== 'https://api.z.ai/api/coding/paas/v4/chat/completions') {
        customEndpoints.push(providerSettings.zai.endpoint);
    }

    for (const endpoint of customEndpoints) {
        try {
            const url = new URL(endpoint);
            const origin = `${url.protocol}//${url.hostname}/*`;
            const granted = await chrome.permissions.request({ origins: [origin] });
            if (!granted) {
                showStatus(elements.saveStatus, `⚠️ ${url.hostname} 접근 권한이 거부되었습니다. 해당 엔드포인트가 작동하지 않을 수 있습니다.`, 'error');
                return;
            }
        } catch (e) {
            console.warn('Permission request failed for endpoint:', endpoint, e);
        }
    }

    await chrome.storage.sync.set({ settings });
    showStatus(elements.saveStatus, '✅ 설정이 저장되었습니다.', 'success');

    // Update active card highlight
    updateActiveProviderCard(activeProvider);
}

// Save settings without showing notification
async function saveSettingsQuietly() {
    const providerSettings = {};
    PROVIDER_LIST.forEach(provider => {
        providerSettings[provider] = {
            apiKey: document.getElementById(`apiKey-${provider}`)?.value.trim() || '',
            model: document.getElementById(`model-${provider}`)?.value || '',
            endpoint: document.getElementById(`endpoint-${provider}`)?.value.trim() || ''
        };
    });

    const activeProvider = elements.aiActiveProvider.value;
    const activePs = providerSettings[activeProvider];

    const settings = {
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
        aiEnabled: elements.aiEnabled.checked,
        aiActiveProvider: activeProvider,
        aiMaxTokens: parseInt(elements.aiMaxTokens.value) || 64000,
        aiPromptTemplate: elements.aiPromptTemplate.value || DEFAULT_PROMPT_TEMPLATE,
        providerSettings: providerSettings,
        aiProvider: activeProvider,
        aiApiKey: activePs.apiKey,
        aiModel: activePs.model,
        aiEndpoint: activePs.endpoint,
        aiApiKeys: Object.fromEntries(PROVIDER_LIST.map(p => [p, providerSettings[p].apiKey]))
    };

    await chrome.storage.sync.set({ settings });
}

// Reset to default settings
async function resetSettings() {
    await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
    await loadSettings();
    showStatus(elements.saveStatus, '🔄 기본 설정으로 복원되었습니다.', 'success');
}

// Test REST API connection
async function testConnection() {
    elements.testConnection.disabled = true;
    elements.testConnection.textContent = '🔄 연결 중...';

    try {
        await saveSettingsQuietly();
        const result = await chrome.runtime.sendMessage({ type: 'TEST_CONNECTION' });

        if (result.success) {
            showStatus(elements.connectionStatus, '✅ ' + result.message, 'success');
        } else {
            showStatus(elements.connectionStatus, '❌ ' + result.message, 'error');
        }
    } catch (error) {
        showStatus(elements.connectionStatus, '❌ 연결 테스트 실패: ' + error.message, 'error');
    }

    elements.testConnection.disabled = false;
    elements.testConnection.textContent = '🔍 연결 테스트';
}

// Show status message
function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `connection-status show ${type}`;

    setTimeout(() => {
        element.classList.remove('show');
    }, 3000);
}

// Update image folder mode visibility based on year/month setting
function updateImageFolderModeVisibility() {
    if (elements.useYearMonthFolders.checked) {
        elements.imageFolderModeContainer.style.display = 'block';
    } else {
        elements.imageFolderModeContainer.style.display = 'none';
    }
}

// 저장 방식에 따른 UI 토글
function updateSaveMethodVisibility() {
    const isRest = elements.saveMethod.value === 'rest';
    elements.restApiSettings.style.display = isRest ? 'block' : 'none';
    elements.uriSettings.style.display = isRest ? 'none' : 'block';
    elements.saveMethodHint.textContent = isRest
        ? 'REST API: 이미지 로컬 저장 가능, Local REST API 플러그인 필요'
        : 'URI: 클립보드 경유, 추가 플러그인 불필요, 이미지 로컬 저장 불가';

    // URI 모드: 볼트 선택 옵션 표시, 이미지 다운로드 비활성화
    elements.uriVaultModeContainer.style.display = isRest ? 'none' : 'block';
    if (!isRest) {
        elements.downloadImages.checked = false;
        elements.downloadImages.disabled = true;
    } else {
        elements.downloadImages.disabled = false;
    }
}

// Event listeners
elements.saveSettings.addEventListener('click', saveSettings);
elements.resetSettings.addEventListener('click', resetSettings);
elements.testConnection.addEventListener('click', testConnection);

// 저장 방식 변경 핸들러
elements.saveMethod.addEventListener('change', updateSaveMethodVisibility);

// Year/month folder toggle handler
elements.useYearMonthFolders.addEventListener('change', updateImageFolderModeVisibility);

// Active provider change handler
elements.aiActiveProvider.addEventListener('change', (e) => {
    updateActiveProviderCard(e.target.value);
});

// Reset prompt template handler
elements.resetPromptTemplate.addEventListener('click', () => {
    elements.aiPromptTemplate.value = DEFAULT_PROMPT_TEMPLATE;
    showStatus(elements.saveStatus, '🔄 기본 템플릿으로 복원되었습니다.', 'success');
});

// Provider card toggle buttons
document.querySelectorAll('.provider-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const provider = e.target.dataset.provider;
        if (provider) {
            toggleProviderCard(provider);
        }
    });
});

// Provider card header click (entire header toggles)
document.querySelectorAll('.provider-header').forEach(header => {
    header.addEventListener('click', (e) => {
        // Don't toggle if clicking on the button itself (it has its own handler)
        if (e.target.classList.contains('provider-toggle-btn')) return;
        const card = header.closest('.provider-card');
        const provider = card?.dataset.provider;
        if (provider) {
            toggleProviderCard(provider);
        }
    });
});

// Provider test connection buttons
document.querySelectorAll('.test-provider-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const provider = e.target.dataset.provider;
        if (provider) {
            testProviderConnection(provider);
        }
    });
});

// Toggle provider card function (used by event listeners)
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

// Test provider connection function
async function testProviderConnection(provider) {
    const resultEl = document.getElementById(`result-${provider}`);
    resultEl.textContent = '테스트 중...';
    resultEl.className = 'test-result';

    try {
        await saveSettingsQuietly();

        const apiKey = document.getElementById(`apiKey-${provider}`)?.value.trim();
        const model = document.getElementById(`model-${provider}`)?.value.trim();
        const endpoint = document.getElementById(`endpoint-${provider}`)?.value.trim() || '';

        if (!apiKey) {
            resultEl.textContent = '❌ API Key를 입력하세요';
            resultEl.className = 'test-result error';
            return;
        }

        const result = await chrome.runtime.sendMessage({
            type: 'TEST_AI_CONNECTION',
            provider: provider,
            apiKey: apiKey,
            model: model,
            endpoint: endpoint
        });

        if (result.success) {
            resultEl.textContent = '✅ 연결 성공';
            resultEl.className = 'test-result success';
            updateProviderStatus(provider, true);
        } else {
            resultEl.textContent = '❌ ' + (result.message || '연결 실패');
            resultEl.className = 'test-result error';
        }
    } catch (error) {
        resultEl.textContent = '❌ ' + error.message;
        resultEl.className = 'test-result error';
    }
}

// Set version from manifest
const versionEl = document.getElementById('versionText');
if (versionEl) {
    versionEl.textContent = `v${chrome.runtime.getManifest().version}`;
}

// Initialize
loadSettings();
