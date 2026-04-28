// Threads to Obsidian - Background Service Worker
// Handles communication between content script and Obsidian REST API

// Import AI service
importScripts('ai-service.js');

// fetch with timeout using AbortController
function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id));
}

// YAML 문자열 이스케이프 (쌍따옴표 내부용)
function escapeYaml(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// 파일명에 안전하지 않은 문자 제거
function sanitizeFilename(name) {
  return name
    .replace(/[\/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .replace(/\.+$/g, '')
    .replace(/^\.+/g, '')
    .trim()
    .substring(0, 200);
}

// HTTP 상태 코드별 사용자 친화적 에러 메시지
function getHttpErrorMessage(status, context) {
  switch (status) {
    case 401: return `인증 실패 (${context}): API 키를 확인하세요`;
    case 403: return `접근 거부 (${context}): 권한을 확인하세요`;
    case 404: return `경로를 찾을 수 없음 (${context}): 폴더가 존재하는지 확인하세요`;
    case 429: return `요청 한도 초과 (${context}): 잠시 후 다시 시도하세요`;
    default:
      if (status >= 500) return `서버 오류 (${context}): Obsidian을 확인하세요 (${status})`;
      return `${context} 실패: HTTP ${status}`;
  }
}

// Default settings
const DEFAULT_SETTINGS = {
  // Trigger settings
  triggerOnLike: true,
  triggerOnSave: true,

  // Save method: 'rest' or 'uri'
  saveMethod: 'rest',

  // REST API settings
  protocol: 'http',
  host: 'localhost',
  port: '27123',
  apiKey: '',

  // Path settings
  vaultName: '',
  notesFolder: 'Threads',
  useYearMonthFolders: false,
  imageFolder: 'Threads_img',
  imageFolderMode: 'fixed', // 'fixed' or 'relative'

  // File naming
  fileNameType: 'postDate', // 'postDate' or 'saveDate'

  // Media settings
  downloadImages: false,

  // Notification
  showNotification: true,

  // AI Settings
  aiEnabled: false,
  aiProvider: 'openai',
  aiApiKey: '',
  aiEndpoint: '',
  aiModel: 'gpt-4o-mini',
  aiMaxTokens: 64000,
  aiApiKeys: {
    openai: '',
    gemini: '',
    anthropic: '',
    grok: '',
    zai: '',
    custom: ''
  }
};

// Initialize settings on install
chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.sync.get('settings');
  if (!stored.settings) {
    await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
  }
  console.log('Threads to Obsidian extension installed');
});

// Get current settings
async function getSettings() {
  const stored = await chrome.storage.sync.get('settings');
  return { ...DEFAULT_SETTINGS, ...stored.settings };
}

// Build REST API URL
function buildApiUrl(settings, endpoint) {
  const baseUrl = `${settings.protocol}://${settings.host}:${settings.port}`;
  return `${baseUrl}${endpoint}`;
}

// Get year/month path string (e.g., "2026/01")
function getYearMonthPath(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}/${month}`;
}

// Calculate note folder path based on settings
function getNoteFolderPath(settings, date) {
  if (settings.useYearMonthFolders) {
    return `${settings.notesFolder}/${getYearMonthPath(date)}`;
  }
  return settings.notesFolder;
}

// Calculate image folder path based on settings
function getImageFolderPath(settings, date) {
  if (settings.useYearMonthFolders && settings.imageFolderMode === 'relative') {
    // Use note folder + _img suffix (e.g., "Threads/2026/01_img")
    const yearMonth = getYearMonthPath(date);
    const yearMonthParts = yearMonth.split('/');
    const year = yearMonthParts[0];
    const month = yearMonthParts[1];
    return `${settings.notesFolder}/${year}/${month}_img`;
  }
  return settings.imageFolder;
}

// Save note to Obsidian via REST API
async function saveToObsidian(noteData) {
  const settings = await getSettings();

  const { filename, content, images, postDate } = noteData;

  // Use post date if provided, otherwise current date
  const date = postDate ? new Date(postDate) : new Date();

  // Calculate folder paths
  const notesFolderPath = getNoteFolderPath(settings, date);
  const imageFolderPath = getImageFolderPath(settings, date);
  const notePath = `${notesFolderPath}/${filename}`;

  const headers = {
    'Content-Type': 'text/markdown',
  };

  if (settings.apiKey) {
    headers['Authorization'] = `Bearer ${settings.apiKey}`;
  }

  try {
    // Save the markdown note
    const noteUrl = buildApiUrl(settings, `/vault/${encodeURIComponent(notePath)}`);
    const noteResponse = await fetchWithTimeout(noteUrl, {
      method: 'PUT',
      headers,
      body: content
    });

    if (!noteResponse.ok) {
      throw new Error(getHttpErrorMessage(noteResponse.status, '노트 저장'));
    }

    // Download and save images if enabled
    const imageErrors = [];
    if (settings.downloadImages && images && images.length > 0) {
      for (const image of images) {
        try {
          await saveImageToObsidian(settings, image, imageFolderPath);
        } catch (imgError) {
          console.error('Failed to save image:', imgError);
          imageErrors.push(imgError.message);
        }
      }
    }

    // Update stats
    await updateStats();

    return { success: true, path: notePath, vaultName: settings.vaultName, imageErrors };
  } catch (error) {
    console.error('Failed to save to Obsidian:', error);
    return { success: false, error: error.message };
  }
}

// Save image to Obsidian
async function saveImageToObsidian(settings, imageData, imageFolderPath) {
  const { url, filename } = imageData;
  // Use provided imageFolderPath or fall back to settings.imageFolder
  const folderPath = imageFolderPath || settings.imageFolder;
  const imagePath = `${folderPath}/${filename}`;

  // Fetch the image
  const imageResponse = await fetchWithTimeout(url, {}, 30000);
  if (!imageResponse.ok) {
    throw new Error(getHttpErrorMessage(imageResponse.status, '이미지 다운로드'));
  }

  const imageBlob = await imageResponse.blob();
  const arrayBuffer = await imageBlob.arrayBuffer();

  const headers = {
    'Content-Type': imageBlob.type || 'image/jpeg',
  };

  if (settings.apiKey) {
    headers['Authorization'] = `Bearer ${settings.apiKey}`;
  }

  const imageUrl = buildApiUrl(settings, `/vault/${encodeURIComponent(imagePath)}`);
  const response = await fetchWithTimeout(imageUrl, {
    method: 'PUT',
    headers,
    body: arrayBuffer
  });

  if (!response.ok) {
    throw new Error(getHttpErrorMessage(response.status, '이미지 저장'));
  }

  return { success: true, path: imagePath };
}

// Save with AI transformation
async function saveWithAI(data, sender) {
  const settings = await getSettings();
  const { postData, images } = data;
  const postId = data.postId || '';

  let title = null;
  let transformedContent = null;
  let aiUsed = false;
  let failureReason = null;

  // Helper to send progress to content script
  const sendProgress = (stage, detail = '') => {
    if (sender?.tab?.id) {
      chrome.tabs.sendMessage(sender.tab.id, {
        type: 'AI_PROGRESS',
        stage,
        detail,
        model: settings.aiModel,
        provider: settings.aiProvider,
        postId
      }).catch(() => { }); // Ignore if tab closed
    }
  };

  // Try AI transformation if enabled
  if (settings.aiEnabled && settings.aiApiKey && self.aiService) {
    console.log('[Threads to Obsidian] AI transformation starting...', {
      provider: settings.aiProvider,
      model: settings.aiModel,
      hasApiKey: !!settings.aiApiKey
    });

    try {
      // Single API call for both title and content
      sendProgress('content', 'AI 변환 중...');
      console.log('[Threads to Obsidian] Calling AI for transformation...');

      const result = await self.aiService.transformWithTitle(postData, settings);

      if (result.error) {
        failureReason = result.error;
        console.error('[Threads to Obsidian] AI transformation error:', result.error);
      } else if (result.content) {
        title = result.title;
        transformedContent = result.content;
        console.log('[Threads to Obsidian] AI transformation successful:', {
          titleGenerated: !!title,
          title: title,
          contentLength: transformedContent.length
        });
        aiUsed = true;
      } else {
        failureReason = 'AI가 빈 응답을 반환했습니다.';
        console.warn('[Threads to Obsidian] AI returned empty content');
      }
    } catch (error) {
      failureReason = error.message;
      console.error('[Threads to Obsidian] AI transformation failed:', {
        error: error.message,
        provider: settings.aiProvider,
        model: settings.aiModel
      });
    }
  } else {
    // Log why AI was not used
    if (!settings.aiEnabled) {
      failureReason = 'AI 변환이 비활성화되어 있습니다.';
    } else if (!settings.aiApiKey) {
      failureReason = 'API 키가 설정되지 않았습니다.';
    } else if (!self.aiService) {
      failureReason = 'AI 서비스를 로드할 수 없습니다.';
    }
    console.log('[Threads to Obsidian] AI not used:', failureReason);
  }

  // Step 2: Save to Obsidian
  sendProgress('saving', 'Obsidian에 저장 중...');

  // Build filename
  const username = sanitizeFilename(postData.author.username.replace('@', ''));
  const titlePart = title ? `_${sanitizeFilename(title)}` : '';
  const date = new Date(postData.timestamp || Date.now());
  const dateStr = formatDateForFilename(date);
  const filename = `@${username}${titlePart}_${dateStr}.md`;

  // Build final content
  let finalContent;
  if (transformedContent) {
    // Use AI transformed content with frontmatter
    finalContent = buildAIMarkdown(postData, transformedContent, settings, date);
  } else {
    // Fallback to original markdown
    console.log('[Threads to Obsidian] Using original markdown (AI transformation failed or disabled)');
    finalContent = data.originalMarkdown;
  }

  // Save to Obsidian
  const result = await saveToObsidian({
    filename,
    content: finalContent,
    images: settings.downloadImages ? images : [],
    postDate: postData.timestamp || Date.now()
  });

  // Add AI usage info to result
  result.aiUsed = aiUsed;
  result.failureReason = failureReason;

  return result;
}

// AI 변환만 수행 (URI 모드용 - Obsidian에 저장하지 않고 콘텐츠만 반환)
async function transformOnly(data, sender) {
  const settings = await getSettings();
  const { postData } = data;
  const postId = data.postId || '';

  let title = null;
  let transformedContent = null;
  let aiUsed = false;
  let failureReason = null;

  const sendProgress = (stage, detail = '') => {
    if (sender?.tab?.id) {
      chrome.tabs.sendMessage(sender.tab.id, {
        type: 'AI_PROGRESS', stage, detail,
        model: settings.aiModel, provider: settings.aiProvider, postId
      }).catch(() => {});
    }
  };

  if (settings.aiEnabled && settings.aiApiKey && self.aiService) {
    try {
      sendProgress('content', 'AI 변환 중...');
      const result = await self.aiService.transformWithTitle(postData, settings);
      if (result.error) {
        failureReason = result.error;
      } else if (result.content) {
        title = result.title;
        transformedContent = result.content;
        aiUsed = true;
      } else {
        failureReason = 'AI가 빈 응답을 반환했습니다.';
      }
    } catch (error) {
      failureReason = error.message;
    }
  } else {
    failureReason = !settings.aiEnabled ? 'AI 비활성화' : !settings.aiApiKey ? 'API 키 없음' : 'AI 서비스 미로드';
  }

  // 파일명 생성
  const username = sanitizeFilename(postData.author.username.replace('@', ''));
  const titlePart = title ? `_${sanitizeFilename(title)}` : '';
  const date = new Date(postData.timestamp || Date.now());
  const dateStr = formatDateForFilename(date);
  const filename = `@${username}${titlePart}_${dateStr}.md`;

  // 최종 콘텐츠 생성
  let finalContent;
  if (transformedContent) {
    // URI 모드에서는 이미지 다운로드 불가 → downloadImages 강제 false
    const uriSettings = { ...settings, downloadImages: false };
    finalContent = buildAIMarkdown(postData, transformedContent, uriSettings, date);
  } else {
    finalContent = data.originalMarkdown;
  }

  // 폴더 경로 계산
  const notesFolderPath = getNoteFolderPath(settings, date);
  const filePath = `${notesFolderPath}/${filename}`;

  return {
    success: true,
    content: finalContent,
    filename,
    filePath,
    vaultName: settings.vaultName,
    aiUsed,
    failureReason
  };
}

// Format date for filename
function formatDateForFilename(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}`;
}

// Build markdown with AI content
function buildAIMarkdown(postData, aiContent, settings, date) {
  const now = new Date();
  const formatSeoulDate = (d) => d.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
  });

  const savedDate = formatSeoulDate(now);
  const postDate = postData.timestamp ? formatSeoulDate(new Date(postData.timestamp)) : '알 수 없음';

  // Extract topic from post
  const topic = postData.content.topic || null;

  let md = '---\n';
  md += 'source: threads\n';
  md += `type: ${postData.type}\n`;
  md += `author: "${escapeYaml(postData.author.username)}"\n`;
  md += `author_name: "${escapeYaml(postData.author.displayName)}"\n`;
  if (topic) {
    md += `topic: "${escapeYaml(topic)}"\n`;
  }
  md += `post_url: "${escapeYaml(postData.url)}"\n`;
  md += `saved_at: "${savedDate}"\n`;
  md += `post_date: "${postDate}"\n`;

  if (postData.type === 'thread' && postData.chainedPosts?.length > 0) {
    md += `thread_count: ${postData.chainedPosts.length + 1}\n`;
  }

  md += 'tags:\n  - threads\n';
  if (topic) {
    md += `  - ${topic.replace(/^#/, '')}\n`;
  }
  if (postData.content.tag) {
    md += `  - ${postData.content.tag.replace(/^#/, '')}\n`;
  }
  md += '---\n\n';

  // Post info section
  md += '## 📋 게시글 정보\n\n';
  md += '| 항목 | 내용 |\n';
  md += '|------|------|\n';
  md += `| 게시자 | [${postData.author.displayName} (${postData.author.username})](https://www.threads.com/${postData.author.username}) |\n`;
  md += `| 게시URL | [Threads에서 보기](${postData.url}) |\n`;
  md += `| 게시일 | ${postDate} |\n`;
  md += `| 저장일 | ${savedDate} |\n`;
  if (topic) {
    md += `| 주제 | ${topic} |\n`;
  }
  md += '\n---\n\n';

  // AI transformed content
  md += aiContent;

  // Generate base filename and image folder path for inline media
  const username = postData.author.username.replace('@', '');
  const postDateForPath = date || new Date(postData.timestamp || Date.now());
  const dateStr = formatDateForFilename(postDateForPath);
  const baseFilename = `@${username}_${dateStr}`;
  const imageFolderPath = getImageFolderPath(settings, postDateForPath);

  // Helper: render media items inline
  function renderMedia(mediaItems, source, postIndex) {
    let result = '';
    let imageIndex = 0;
    mediaItems.forEach((m) => {
      if (m.type === 'image') {
        imageIndex++;
        if (settings.downloadImages) {
          let localPath;
          if (source === 'master') {
            localPath = `${imageFolderPath}/${baseFilename}_${imageIndex}.jpg`;
          } else {
            localPath = `${imageFolderPath}/${baseFilename}_p${postIndex + 2}_${imageIndex}.jpg`;
          }
          result += `![[${localPath}]]\n\n`;
        } else {
          const label = source === 'master' ? '마스터글' : `연관글 ${postIndex + 2}`;
          result += `<iframe width="100%" height="400" src="${m.url}" title="${label} 이미지 ${imageIndex}" frameborder="0"></iframe>\n\n`;
        }
      } else if (m.type === 'video') {
        const ytMatch = m.url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (ytMatch) {
          result += `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allowfullscreen></iframe>\n\n`;
        } else {
          const label = source === 'master' ? '마스터글' : `연관글 ${postIndex + 2}`;
          result += `<iframe width="100%" height="315" src="${m.url}" title="${label} 동영상" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>\n\n`;
        }
      }
    });
    return result;
  }

  // Original content section with inline media
  md += '\n\n---\n\n## 6. 원문\n\n';
  md += `> ${postData.content.text.split('\n').join('\n> ')}\n\n`;

  // Master post media (inline, right after master text)
  if (postData.content.media?.length > 0) {
    md += renderMedia(postData.content.media, 'master', -1);
  }

  // Chained posts with inline media
  if (postData.chainedPosts?.length > 0) {
    postData.chainedPosts.forEach((post, i) => {
      md += `> ---\n> [${i + 2}/${postData.chainedPosts.length + 1}]\n`;
      md += `> ${post.text.split('\n').join('\n> ')}\n\n`;

      // Chained post media (inline, right after this post's text)
      if (post.media?.length > 0) {
        md += renderMedia(post.media.filter(m => m.type === 'image' || m.type === 'video'), 'chained', i);
      }
    });
  }

  // My Notes section
  md += '\n---\n\n## 7. My Notes\n\n';
  md += '### 관련 지식\n- \n\n';
  md += '### 아이디어\n- \n\n';
  md += '### 메모\n- \n\n';
  md += '---\n\n';
  md += `*Clipped: ${savedDate}*\n`;

  return md;
}

// Message listener for content script communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_TO_OBSIDIAN') {
    saveToObsidian(message.data)
      .then(result => {
        sendResponse(result);

        // Show notification if enabled
        if (result.success) {
          getSettings().then(settings => {
            if (settings.showNotification) {
              chrome.notifications?.create({
                type: 'basic',
                iconUrl: 'assets/icons/icon48.png',
                title: 'Threads to Obsidian',
                message: `Saved: ${message.data.filename}`
              });
            }
          });
        }
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep message channel open for async response
  }

  // Save with AI transformation
  if (message.type === 'SAVE_WITH_AI') {
    (async () => {
      try {
        const result = await saveWithAI(message.data, sender);
        sendResponse(result);
      } catch (error) {
        console.error('SAVE_WITH_AI error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  // AI 변환만 수행하고 콘텐츠 반환 (URI 모드용)
  if (message.type === 'TRANSFORM_WITH_AI') {
    (async () => {
      try {
        const result = await transformOnly(message.data, sender);
        sendResponse(result);
      } catch (error) {
        console.error('TRANSFORM_WITH_AI error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.type === 'GET_SETTINGS') {
    getSettings().then(settings => sendResponse(settings));
    return true;
  }

  if (message.type === 'TEST_CONNECTION') {
    testConnection().then(result => sendResponse(result));
    return true;
  }

  if (message.type === 'TEST_AI_CONNECTION') {
    getSettings().then(settings => {
      if (self.aiService) {
        self.aiService.testAIConnection(settings).then(result => sendResponse(result));
      } else {
        sendResponse({ success: false, message: 'AI 서비스를 로드할 수 없습니다.' });
      }
    });
    return true;
  }
});

// Test connection to Obsidian REST API
async function testConnection() {
  const settings = await getSettings();
  const url = buildApiUrl(settings, '/');

  const headers = {};
  if (settings.apiKey) {
    headers['Authorization'] = `Bearer ${settings.apiKey}`;
  }

  try {
    const response = await fetchWithTimeout(url, { headers }, 10000);
    if (response.ok) {
      return { success: true, message: 'Connected to Obsidian REST API' };
    } else {
      return { success: false, message: getHttpErrorMessage(response.status, '연결 테스트') };
    }
  } catch (error) {
    const msg = error.name === 'AbortError' ? '연결 시간 초과 (10초)' : error.message;
    return { success: false, message: `연결 오류: ${msg}` };
  }
}

// Update stats for saved posts
async function updateStats() {
  const stored = await chrome.storage.local.get(['savedPosts', 'todayPosts', 'lastDate']);
  const today = new Date().toDateString();

  let savedPosts = (stored.savedPosts || 0) + 1;
  let todayPosts = stored.todayPosts || 0;

  // Reset today count if it's a new day
  if (stored.lastDate !== today) {
    todayPosts = 1;
  } else {
    todayPosts += 1;
  }

  await chrome.storage.local.set({
    savedPosts,
    todayPosts,
    lastDate: today
  });
}
