// Threads to Obsidian - Content Script
// Detects like/save button clicks and extracts post data from Threads

(function () {
    'use strict';

    // State tracking for button clicks
    const processedPosts = new Set();
    const MAX_PROCESSED_POSTS = 500;
    let settings = null;

    // AI progress tracking (per-post)
    const aiProgressTimers = new Map();

    // MutationObserver 참조 (cleanup용)
    let domObserver = null;

    // YAML 문자열 이스케이프
    function escapeYaml(str) {
        if (!str) return '';
        return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    // processedPosts 크기 제한
    function addProcessedPost(key) {
        if (processedPosts.size >= MAX_PROCESSED_POSTS) {
            const oldest = processedPosts.values().next().value;
            processedPosts.delete(oldest);
        }
        processedPosts.add(key);
    }

    // Initialize
    async function init() {

        try {
            settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
        } catch (error) {
            console.error('Threads to Obsidian: Failed to get settings', error);
            // Use default settings if message fails
            settings = {
                triggerOnLike: true,
                triggerOnSave: true,
                downloadImages: false,
                notesFolder: 'Threads',
                imageFolder: 'Threads_img',
                fileNameType: 'postDate'
            };
        }

        observeDOM();
        setupSaveButtonDelegation();
        setupProgressListener();
    }

    // Listen for AI progress updates from service worker
    function setupProgressListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'AI_PROGRESS') {
                updateProgressToast(message);
            }
        });
    }

    // Update progress toast with current stage and timer
    function updateProgressToast(progress) {
        const { stage, detail, model, provider, postId } = progress;
        if (!postId) return;

        // Start per-post timer if not already running
        if (!aiProgressTimers.has(postId)) {
            const startTime = Date.now();
            const timerId = setInterval(() => {
                updateToastTimer(postId);
            }, 1000);
            aiProgressTimers.set(postId, { startTime, timerId });
        }

        const timerInfo = aiProgressTimers.get(postId);
        const elapsed = Math.floor((Date.now() - timerInfo.startTime) / 1000);
        const stageText = getStageText(stage);

        // Update existing toast for this postId
        const toast = document.querySelector(`.threads-obsidian-toast[data-post-id="${postId}"]`);
        if (toast && toast.dataset.processing === 'true') {
            const titleEl = toast.querySelector('.toast-title');
            const subtitleEl = toast.querySelector('.toast-subtitle');
            if (titleEl) titleEl.textContent = stageText;
            if (subtitleEl) subtitleEl.textContent = `${provider}/${model} • ${elapsed}초`;
        }
    }

    // Update timer display in toast for a specific post
    function updateToastTimer(postId) {
        const timerInfo = aiProgressTimers.get(postId);
        if (!timerInfo) return;

        const toast = document.querySelector(`.threads-obsidian-toast[data-post-id="${postId}"]`);
        if (toast && toast.dataset.processing === 'true') {
            const subtitleEl = toast.querySelector('.toast-subtitle');
            if (subtitleEl) {
                const elapsed = Math.floor((Date.now() - timerInfo.startTime) / 1000);
                const currentText = subtitleEl.textContent;
                const parts = currentText.split(' • ');
                if (parts.length >= 1) {
                    subtitleEl.textContent = `${parts[0]} • ${elapsed}초`;
                }
            }
        }
    }

    // Get readable stage text
    function getStageText(stage) {
        switch (stage) {
            case 'title': return '📝 제목 생성 중...';
            case 'content': return '📄 본문 변환 중...';
            case 'saving': return '💾 저장 중...';
            default: return '⏳ 처리 중...';
        }
    }

    // Stop progress timer for a specific post
    function stopProgressTimer(postId) {
        if (postId) {
            const timerInfo = aiProgressTimers.get(postId);
            if (timerInfo) {
                clearInterval(timerInfo.timerId);
                aiProgressTimers.delete(postId);
            }
        } else {
            // Stop all timers
            aiProgressTimers.forEach(info => clearInterval(info.timerId));
            aiProgressTimers.clear();
        }
    }

    // Observe DOM for dynamically loaded content
    function observeDOM() {
        domObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    attachButtonListeners();
                }
            }
        });

        domObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Initial attachment
        attachButtonListeners();

        // 페이지 언로드 시 observer 정리
        window.addEventListener('beforeunload', () => {
            if (domObserver) {
                domObserver.disconnect();
                domObserver = null;
            }
            stopProgressTimer();
        });
    }

    // Attach click listeners to like/save buttons
    function attachButtonListeners() {
        if (!settings) {
            console.warn('Threads to Obsidian: Settings not loaded yet');
            return;
        }

        // Like buttons - Find div[role="button"] that contains svg[aria-label="좋아요"] or svg[aria-label="Like"]
        if (settings.triggerOnLike) {
            // Select SVGs with like aria-label
            const likeSvgs = document.querySelectorAll('svg[aria-label="좋아요"], svg[aria-label="Like"]');
            likeSvgs.forEach(svg => {
                // Find the parent button (div with role="button")
                const button = svg.closest('div[role="button"]');
                if (button && !button.dataset.threadsObsidianListening) {
                    button.dataset.threadsObsidianListening = 'true';
                    button.addEventListener('click', handleLikeClick);
                }
            });
        }

        // Save buttons - use event delegation since they're in dynamic menus
        // This is set up once in init(), not here
    }

    // Set up global event delegation for save button (in dynamic menus)
    function setupSaveButtonDelegation() {
        if (!settings?.triggerOnSave) return;

        // Use event delegation on document to catch dynamically added save buttons
        document.addEventListener('click', (event) => {
            // Check if clicked element or its parent is a save button
            const target = event.target;
            const button = target.closest('div[role="button"], div[role="menuitem"]');

            if (!button) return;

            // Check if the button text is "저장" or "Save"
            const buttonText = button.textContent?.trim();
            if (buttonText === '저장' || buttonText === 'Save') {
                handleSaveButtonClick(button);
            }
        }, true); // Use capture phase to catch before other handlers
    }

    // Handle save button click from menu
    function handleSaveButtonClick(button) {
        // Find the post that this save action relates to
        // On detail page, we can use the main post
        // On feed, we need to track which post the menu was opened for

        setTimeout(() => {
            // On detail page, get the main post
            if (window.location.pathname.includes('/post/')) {
                const mainPost = document.querySelector('div[data-pressable-container="true"]');
                if (mainPost) {
                    processPost(mainPost, 'save');
                }
            } else {
                // On feed, try to find the post from the menu context
                // The menu is often a sibling or near the post container
                // For now, show a message that feed save is not yet supported
                showToast('ℹ️ 상세 페이지에서 저장 버튼을 사용해주세요.');
            }
        }, 200);
    }

    // Handle like button click
    function handleLikeClick(event) {
        const button = event.currentTarget;

        // Check if this is an activation (like) not a deactivation (unlike)
        // We need to wait briefly for the UI to update
        setTimeout(() => {
            const isNowLiked = isButtonActive(button, 'like');
            if (isNowLiked) {
                const postElement = findPostElement(button);
                if (postElement) {
                    processPost(postElement, 'like');
                }
            }
        }, 100);
    }

    // Handle save button click
    function handleSaveClick(event) {
        const button = event.currentTarget;

        // Check if this is an activation (save) not a deactivation (unsave)
        setTimeout(() => {
            const isNowSaved = isButtonActive(button, 'save');
            if (isNowSaved) {
                const postElement = findPostElement(button);
                if (postElement) {
                    processPost(postElement, 'save');
                }
            }
        }, 100);
    }

    // Check if button is in active state
    function isButtonActive(button, type) {
        // Check for filled heart (liked) or filled bookmark (saved)
        // Threads uses SVG icons that change when active
        const svg = button.querySelector('svg');
        if (!svg) {
            return false;
        }

        const ariaLabel = svg.getAttribute('aria-label');

        // For likes: Check if aria-label changed to "좋아요 취소" (Unlike) meaning it's now liked
        // Or check for filled state
        if (type === 'like') {
            // If label is "좋아요 취소" or "Unlike", it means currently liked
            if (ariaLabel && (ariaLabel.includes('취소') || ariaLabel.toLowerCase().includes('unlike'))) {
                return true;
            }

            // Also check for fill color or style changes
            const fill = svg.getAttribute('fill');
            const computedStyle = window.getComputedStyle(svg);
            const color = computedStyle.color;

            if (color.includes('rgb(255') || fill === 'red' || fill === '#ff0000') {
                return true;
            }
        }

        // For saves: similar logic
        if (type === 'save') {
            if (ariaLabel && (ariaLabel.includes('취소') || ariaLabel.toLowerCase().includes('unsave'))) {
                return true;
            }

            const hasFilledPath = svg.querySelector('path[fill]:not([fill="none"])');
            if (hasFilledPath) {
                return true;
            }
        }

        return false;
    }

    // Find the parent post element
    function findPostElement(button) {
        // Use data-pressable-container="true" as the post container
        const container = button.closest('div[data-pressable-container="true"]');
        if (container) {
            return container;
        }

        // Fallback: Navigate up to find the post container
        let element = button;
        for (let i = 0; i < 20; i++) {
            element = element.parentElement;
            if (!element) break;

            // Look for article or div with post-like structure
            if (element.tagName === 'ARTICLE') {
                return element;
            }
        }
        return null;
    }

    // Process and save the post
    async function processPost(postElement, trigger) {

        try {
            const postData = extractPostData(postElement);
            if (!postData) {
                console.error('Threads to Obsidian: Failed to extract post data');
                return;
            }

            // Create unique ID for deduplication
            const postId = `${postData.author.username}_${postData.timestamp || Date.now()}`;
            if (processedPosts.has(postId)) {
                return;
            }
            addProcessedPost(postId);

            // Convert to markdown
            const markdown = convertToMarkdown(postData);
            const filename = generateFilename(postData);

            // Prepare images for download
            const images = postData.content.media
                .filter(m => m.type === 'image')
                .map((m, i) => ({
                    url: m.url,
                    filename: `${filename.replace('.md', '')}_${i + 1}.jpg`
                }));

            // Also add chained post images
            if (postData.type === 'thread' && postData.chainedPosts.length > 0) {
                postData.chainedPosts.forEach((post, pIdx) => {
                    if (post.media) {
                        post.media.filter(m => m.type === 'image').forEach((m, mIdx) => {
                            images.push({
                                url: m.url,
                                filename: `${filename.replace('.md', '')}_p${pIdx + 2}_${mIdx + 1}.jpg`
                            });
                        });
                    }
                });
            }

            // Check if extension context is still valid
            if (!chrome.runtime?.id) {
                console.error('Threads to Obsidian: Extension context invalidated, please reload the page');
                showToast('⚠️ 확장 프로그램이 갱신되었습니다. 페이지를 새로고침해주세요.');
                return;
            }

            // URI 모드 vs REST 모드 분기
            const isUriMode = settings.saveMethod === 'uri';
            let result;

            if (isUriMode) {
                // === URI 모드: AI 변환 후 clipboard → obsidian:// URI ===
                if (settings.aiEnabled) {
                    // AI 진행 타이머 시작
                    const startTime = Date.now();
                    const timerId = setInterval(() => {
                        updateToastTimer(postId);
                    }, 1000);
                    aiProgressTimers.set(postId, { startTime, timerId });

                    showToast('', {
                        isProcessing: true,
                        stage: '⏳ AI 처리 시작...',
                        model: `${settings.aiProvider}/${settings.aiModel}`,
                        elapsed: 0,
                        postId,
                        authorId: postData.author.username
                    });

                    result = await chrome.runtime.sendMessage({
                        type: 'TRANSFORM_WITH_AI',
                        data: { postData, originalMarkdown: markdown, postId }
                    });

                    stopProgressTimer(postId);
                } else {
                    // AI 없이 원본 마크다운 사용
                    const postDateForPath = postData.timestamp ? new Date(postData.timestamp) : new Date();
                    let folderPath = settings.notesFolder;
                    if (settings.useYearMonthFolders) {
                        const y = postDateForPath.getFullYear();
                        const m = String(postDateForPath.getMonth() + 1).padStart(2, '0');
                        folderPath = `${settings.notesFolder}/${y}/${m}`;
                    }
                    result = {
                        success: true,
                        content: markdown,
                        filename,
                        filePath: `${folderPath}/${filename}`,
                        vaultName: settings.vaultName,
                        aiUsed: false
                    };
                }

                if (result && result.success) {
                    // 클립보드에 콘텐츠 복사 (유저 제스처 만료 대비 fallback 포함)
                    let clipboardOk = false;
                    try {
                        await navigator.clipboard.writeText(result.content);
                        clipboardOk = true;
                    } catch (clipErr) {
                        console.warn('[Threads to Obsidian] Clipboard API failed, using fallback:', clipErr);
                        // execCommand fallback (유저 제스처 만료 시)
                        const ta = document.createElement('textarea');
                        ta.value = result.content;
                        ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
                        document.body.appendChild(ta);
                        ta.select();
                        clipboardOk = document.execCommand('copy');
                        ta.remove();
                    }

                    if (!clipboardOk) {
                        showToast('❌ 클립보드 복사 실패. 브라우저 권한을 확인해주세요.');
                        return;
                    }

                    // obsidian://new URI 생성 (.md 확장자 제거)
                    const filePathNoExt = result.filePath.replace(/\.md$/, '');
                    const params = new URLSearchParams();
                    // 지정 볼트 모드일 때만 vault 파라미터 추가 (lastActive면 생략 → 마지막 활성 볼트)
                    if (settings.uriVaultMode !== 'lastActive' && result.vaultName) {
                        params.set('vault', result.vaultName);
                    }
                    params.set('file', filePathNoExt);
                    params.set('clipboard', 'true');
                    params.set('overwrite', 'true');

                    const obsidianUri = `obsidian://new?${params.toString()}`;
                    console.log('[Threads to Obsidian] Opening URI:', obsidianUri);
                    // _blank 사용: _self는 현재 페이지를 떠나 content script가 죽음
                    window.open(obsidianUri, '_blank');

                    const aiInfo = result.aiUsed ? ' (AI 변환)' : (result.failureReason ? ' (원본 저장)' : '');
                    showToast('✅ Saved to Obsidian via URI' + aiInfo, {
                        isSuccess: true,
                        filePath: result.filePath,
                        vaultName: result.vaultName,
                        imageErrors: [],
                        postId,
                        authorId: postData.author.username
                    });
                } else {
                    showToast('❌ Failed: ' + (result?.error || 'Unknown error'));
                }
            } else {
                // === REST 모드: 기존 로직 유지 ===
                if (settings.aiEnabled) {
                    // Start per-post progress timer
                    const startTime = Date.now();
                    const timerId = setInterval(() => {
                        updateToastTimer(postId);
                    }, 1000);
                    aiProgressTimers.set(postId, { startTime, timerId });

                    showToast('', {
                        isProcessing: true,
                        stage: '⏳ AI 처리 시작...',
                        model: `${settings.aiProvider}/${settings.aiModel}`,
                        elapsed: 0,
                        postId,
                        authorId: postData.author.username
                    });

                    result = await chrome.runtime.sendMessage({
                        type: 'SAVE_WITH_AI',
                        data: {
                            postData,
                            images: settings.downloadImages ? images : [],
                            originalMarkdown: markdown,
                            postId
                        }
                    });

                    stopProgressTimer(postId);

                    if (result) {
                        if (result.aiUsed) {
                            console.log('[Threads to Obsidian] AI transformation successful');
                        } else if (result.failureReason) {
                            console.warn('[Threads to Obsidian] AI not used:', result.failureReason);
                        }
                    }
                } else {
                    result = await chrome.runtime.sendMessage({
                        type: 'SAVE_TO_OBSIDIAN',
                        data: {
                            filename,
                            content: markdown,
                            images: settings.downloadImages ? images : []
                        }
                    });
                }

                if (result && result.success) {
                    const aiInfo = result.aiUsed ? ' (AI 변환)' : (result.failureReason ? ' (원본 저장)' : '');
                    showToast('✅ Saved to Obsidian' + aiInfo, {
                        isSuccess: true,
                        filePath: result.path,
                        vaultName: result.vaultName,
                        imageErrors: result.imageErrors || [],
                        postId,
                        authorId: postData.author.username
                    });

                    if (settings.aiEnabled && !result.aiUsed && result.failureReason) {
                        console.warn('[Threads to Obsidian] 원본으로 저장됨. 이유:', result.failureReason);
                    }
                } else {
                    showToast('❌ Failed to save: ' + (result?.error || 'Unknown error'));
                }
            }
        } catch (error) {
            // Stop timer on error
            stopProgressTimer(postId);

            console.error('Threads to Obsidian: Error in processPost:', error);

            // Specific handling for extension context invalidated
            if (error.message.includes('Extension context invalidated') ||
                error.message.includes('Receiving end does not exist')) {
                showToast('⚠️ 확장 프로그램이 갱신되었습니다. 페이지를 새로고침하세요.');
            } else if (error.message.includes('message channel closed')) {
                // AI processing timeout - may have still succeeded
                showToast('⏳ AI 처리가 지연되고 있습니다. Obsidian에서 확인해주세요.');
            } else {
                showToast('❌ Error: ' + error.message);
            }
        }
    }

    // Extract post data from DOM
    function extractPostData(postElement) {
        try {
            // Extract topic first to exclude it from text body
            const topic = extractTopic(postElement);

            const data = {
                type: 'single',
                author: extractAuthor(postElement),
                content: {
                    text: extractText(postElement, topic),
                    media: extractMedia(postElement),
                    links: extractLinks(postElement),
                    tag: extractTag(postElement),
                    topic: topic
                },
                timestamp: extractTimestamp(postElement),
                url: extractPostUrl(postElement),
                chainedPosts: [],
                quotedPost: null,
                reposter: null,
                _topic: topic // Store for chained posts extraction
            };

            // Detect post type
            data.type = detectPostType(postElement, data);

            // If it's a thread, extract chained posts (pass topic for filtering)
            if (data.type === 'thread') {
                data.chainedPosts = extractChainedPosts(postElement, topic);
            }

            // If it's a quote, extract quoted post
            if (data.type === 'quote') {
                data.quotedPost = extractQuotedPost(postElement);
            }

            // If it's a repost, extract reposter info
            if (data.type === 'repost') {
                data.reposter = extractReposter(postElement);
            }

            return data;
        } catch (error) {
            console.error('Threads to Obsidian: Error extracting post data', error);
            return null;
        }
    }

    // Extract author information
    function extractAuthor(element) {
        // Look for username link
        const usernameLink = element.querySelector('a[href^="/@"]');
        const username = usernameLink ? usernameLink.getAttribute('href').replace('/@', '').split('/')[0] : 'unknown';

        // Look for display name
        const displayNameEl = element.querySelector('span[dir="auto"]');
        const displayName = displayNameEl ? displayNameEl.textContent.trim() : username;

        return {
            username: `@${username}`,
            displayName,
            profileUrl: `https://www.threads.net/@${username}`
        };
    }

    // Extract post text content (optionally exclude topic text)
    function extractText(element, topicToRemove = null) {
        // Find the main text container
        const textContainers = element.querySelectorAll('[dir="auto"]');
        let text = '';

        // Patterns to exclude (engagement metrics, UI elements, relative time)
        const excludePatterns = [
            /^\d+$/, // Pure numbers (like counts, etc.)
            /^(\d+)\s*(likes?|replies|reposts?|좋아요|답글|리포스트|조회)/i,
            /^인기순$/,
            /^최신순$/,
            /^활동\s*보기/,
            /^더\s*보기/,
            /^\d+\s*\/\s*\d+$/, // Thread indicators like 1/2 or 1 / 2 - we'll handle this separately
            /^\d+\s*(시간|분|초|일|주|개월|년)\s*(전)?$/i, // Relative time: 2시간, 3일 전, etc.
            /^(방금|어제|그저께)$/i, // Korean relative time words
            /^\d+[hmdwys]\s*(ago)?$/i, // English: 2h, 3d ago, etc.
        ];

        // First, extract additional content from "See More" area (a[href$="/media"])
        // This content is present in DOM but visually truncated
        const additionalContentLink = element.querySelector('a[href$="/media"]');
        let additionalContent = '';
        if (additionalContentLink) {
            const rawContent = additionalContentLink.innerText || '';
            // Remove "더 보기" or "See More" text
            additionalContent = rawContent
                .replace(/더\s*보기/g, '')
                .replace(/See\s*More/gi, '')
                .trim();

            // Handle text duplication in DOM (Threads sometimes duplicates content)
            additionalContent = deduplicateText(additionalContent);
        }

        textContainers.forEach(container => {
            // Skip if it's inside the additional content link (we handle it separately)
            if (container.closest('a[href$="/media"]')) return;

            // Skip if it's likely a username or metadata
            if (container.closest('a[href^="/@"]')) return;
            if (container.closest('[role="button"]')) return; // Skip button text

            const content = container.textContent.trim();

            // Skip if matches exclude patterns
            if (excludePatterns.some(pattern => pattern.test(content))) return;

            // Skip topic text to avoid duplication in body
            if (topicToRemove && content === topicToRemove) return;

            // Skip very short content that's likely UI text
            if (content.length < 2) return;

            // Skip if already included
            if (content.length > 0 && !text.includes(content)) {
                text += content + '\n';
            }
        });

        // Combine main text with additional content
        let finalText = text.trim();
        if (additionalContent) {
            // Add separator if both exist
            if (finalText) {
                finalText += '\n\n---\n\n' + additionalContent;
            } else {
                finalText = additionalContent;
            }
        }

        return finalText;
    }

    // Helper function to remove duplicated text (Threads sometimes duplicates content in DOM)
    function deduplicateText(text) {
        if (!text || text.length < 20) return text;

        const halfLength = Math.floor(text.length / 2);
        const firstHalf = text.substring(0, halfLength);
        const secondHalf = text.substring(halfLength);

        // Check if second half starts with the beginning of first half
        // This handles cases where text is exactly duplicated
        if (secondHalf.startsWith(firstHalf.substring(0, Math.min(50, firstHalf.length)))) {
            return firstHalf.trim();
        }

        // Check for paragraph-level duplication
        const paragraphs = text.split(/\n\s*\n/);
        if (paragraphs.length >= 2) {
            const uniqueParagraphs = [];
            const seen = new Set();

            for (const para of paragraphs) {
                const trimmed = para.trim();
                // Use first 100 chars as key to detect duplicates
                const key = trimmed.substring(0, 100);
                if (key && !seen.has(key)) {
                    seen.add(key);
                    uniqueParagraphs.push(trimmed);
                }
            }

            if (uniqueParagraphs.length < paragraphs.length) {
                return uniqueParagraphs.join('\n\n');
            }
        }

        return text;
    }


    // Extract media (images/videos) - excludes profile/avatar images
    function extractMedia(element) {
        const media = [];

        // Images - exclude profile pictures and avatars
        const images = element.querySelectorAll('img[src*="cdninstagram"], img[src*="fbcdn"]');
        images.forEach(img => {
            const src = img.src || '';
            const alt = img.alt || '';

            // Skip images inside pure profile links (/@username only, not /@username/post/...)
            const profileLink = img.closest('a[href^="/@"]');
            if (profileLink) {
                const href = profileLink.getAttribute('href') || '';
                // Only exclude if it's a pure profile link (no /post/ or /media in path)
                if (!href.includes('/post/') && !href.includes('/media')) {
                    return;
                }
            }

            // Skip images inside video player containers (these are thumbnails)
            if (img.closest('div[aria-label="Video player"]') ||
                img.closest('video') ||
                img.closest('[data-video-player]')) {
                return;
            }

            // Skip profile pictures and avatars based on URL patterns
            if (src.includes('profile') ||
                src.includes('avatar') ||
                src.includes('_s.jpg') || // Small thumbnails often avatars
                src.includes('/s150x150/') || // 150x150 are usually profile pics
                src.includes('/s320x320/') ||
                src.includes('/s44x44/') || // Very small, definitely avatar
                src.includes('/s56x56/') ||
                src.includes('/s64x64/') ||
                alt.toLowerCase().includes('profile') ||
                alt.toLowerCase().includes('avatar')) {
                return;
            }

            // Check image dimensions - profile pics are usually small squares
            const width = img.naturalWidth || img.width || 0;
            const height = img.naturalHeight || img.height || 0;
            // Only skip if both dimensions are available AND small
            if (width > 0 && height > 0 && width <= 150 && height <= 150) {
                return; // Skip small images (likely avatars)
            }

            media.push({
                type: 'image',
                url: src,
                altText: alt
            });
        });

        // Videos - check both video.src and source tags
        const videos = element.querySelectorAll('video');
        videos.forEach(video => {
            let videoUrl = video.src;

            // If video.src is empty, check for source tags inside
            if (!videoUrl) {
                const sourceEl = video.querySelector('source[src]');
                if (sourceEl) {
                    videoUrl = sourceEl.src;
                }
            }

            // Also check poster attribute as fallback indicator
            const poster = video.poster || '';

            if (videoUrl) {
                media.push({
                    type: 'video',
                    url: videoUrl,
                    altText: '',
                    poster: poster
                });
            }
        });

        return media;
    }

    // Extract links from post
    function extractLinks(element) {
        const links = [];
        const anchors = element.querySelectorAll('a[href^="http"]');
        anchors.forEach(a => {
            const href = a.href;
            if (!href.includes('threads.net') && !href.includes('instagram.com')) {
                links.push(href);
            }
        });
        return links;
    }

    // Extract topic tag
    function extractTag(element) {
        const tagLink = element.querySelector('a[href*="/tag/"]');
        if (tagLink) {
            return tagLink.textContent.trim();
        }
        return null;
    }

    // Extract topic (주제) - usually displayed at the top of the post
    function extractTopic(element) {
        // Look for topic links (format: /topic/topicname)
        const topicLink = element.querySelector('a[href*="/topic/"]');
        if (topicLink) {
            return topicLink.textContent.trim();
        }

        // Look for topic indicator in parent elements (feed view)
        const parent = element.closest('article') || element.closest('[role="article"]') || element;
        const allLinks = parent.querySelectorAll('a[href*="/topic/"]');
        if (allLinks.length > 0) {
            return allLinks[0].textContent.trim();
        }

        return null;
    }

    // Extract timestamp
    function extractTimestamp(element) {
        const timeEl = element.querySelector('time');
        if (timeEl) {
            return timeEl.getAttribute('datetime') || timeEl.textContent;
        }
        return null;
    }

    // Extract post URL (specific post link, not feed URL)
    function extractPostUrl(element) {
        // Try to find the post link from the time element's parent anchor
        const timeEl = element.querySelector('time');
        if (timeEl) {
            const timeLink = timeEl.closest('a');
            if (timeLink && timeLink.href.includes('/post/')) {
                return timeLink.href;
            }
        }

        // Try to find any link with /post/ in the element
        const postLinks = element.querySelectorAll('a[href*="/post/"]');
        if (postLinks.length > 0) {
            // Get the first post link that looks like a direct post link
            for (const link of postLinks) {
                if (link.href.match(/\/@[\w.]+\/post\/[\w]+/)) {
                    return link.href;
                }
            }
        }

        // If on a post detail page, use current URL
        if (window.location.pathname.includes('/post/')) {
            return window.location.href;
        }

        // Fallback: try to construct URL from author and any post ID found
        return window.location.href;
    }

    // Detect post type
    function detectPostType(element, data) {
        const isDetailPage = window.location.pathname.includes('/post/');

        // Check for thread indicator (1/2, 2/3, 1 / 7, etc.) in the main text
        // Look for pattern like "1/2" or "1 / 7" at the end of text content
        const textContent = element.innerText || '';
        const threadMatch = textContent.match(/(\d+)\s*\/\s*(\d+)/);
        if (threadMatch) {
            const current = parseInt(threadMatch[1]);
            const total = parseInt(threadMatch[2]);
            // Only consider it a thread if it looks like a valid thread indicator
            if (current <= total && total <= 20) {
                return 'thread';
            }
        }

        // On detail page, check if there are multiple posts by same author
        if (isDetailPage) {
            const author = data.author.username;
            const allPosts = document.querySelectorAll('div[data-pressable-container="true"]');
            let sameAuthorCount = 0;

            allPosts.forEach(post => {
                const postAuthorLink = post.querySelector('a[href^="/@"]');
                if (postAuthorLink) {
                    const postAuthor = '@' + postAuthorLink.getAttribute('href').replace('/@', '').split('/')[0];
                    if (postAuthor === author) {
                        sameAuthorCount++;
                    }
                }
            });

            if (sameAuthorCount > 1) {
                return 'thread';
            }
        }

        // Check for consecutive posts by same author (thread chain) in feed
        const author = data.author.username;
        const nextSibling = element.nextElementSibling;
        if (nextSibling && nextSibling.getAttribute('data-pressable-container') === 'true') {
            const nextAuthorLink = nextSibling.querySelector('a[href^="/@"]');
            if (nextAuthorLink) {
                const nextAuthor = '@' + nextAuthorLink.getAttribute('href').replace('/@', '').split('/')[0];
                if (nextAuthor === author) {
                    return 'thread';
                }
            }
        }

        // Check for repost indicator - be more specific to avoid false positives
        // Look for repost header at the TOP of the post (not repost button)
        const postHeader = element.querySelector('div:first-child');
        const headerText = postHeader ? postHeader.textContent : '';
        if (headerText.includes('님이 리포스트') || headerText.includes('reposted')) {
            return 'repost';
        }

        // Check for quoted post (embedded post)
        const nestedContainers = element.querySelectorAll('[data-pressable-container="true"]');
        if (nestedContainers.length > 0) {
            return 'quote';
        }

        return 'single';
    }

    // Extract chained posts for threads (pass topic to filter from text)
    function extractChainedPosts(element, topicToRemove = null) {
        const chainedPosts = [];
        const author = extractAuthor(element).username;
        const isDetailPage = window.location.pathname.includes('/post/');


        // On detail page, collect consecutive posts by same author
        // Stop when encountering a different author (that's where comments begin)
        if (isDetailPage) {
            const allPosts = Array.from(document.querySelectorAll('div[data-pressable-container="true"]'));
            let foundCurrentPost = false;

            // Use for...of so we can break out of the loop
            for (const post of allPosts) {
                // Skip until we find the current post
                if (post === element) {
                    foundCurrentPost = true;
                    continue;
                }

                // Only look at posts AFTER the current one
                if (!foundCurrentPost) continue;

                // Check if same author
                const postAuthorLink = post.querySelector('a[href^="/@"]');
                if (!postAuthorLink) {
                    break;
                }

                const postAuthor = '@' + postAuthorLink.getAttribute('href').replace('/@', '').split('/')[0];

                // STOP when we encounter a different author (comments section begins)
                if (postAuthor !== author) {
                    break;
                }

                // Check for thread indicator (p/n or p / n format)
                // Posts without this indicator are author's replies to comments, not part of thread
                const postText = post.innerText || '';
                const hasThreadIndicator = /\d+\s*\/\s*\d+/.test(postText);

                if (!hasThreadIndicator) {
                    break;
                }

                // Extract content from same-author post with thread indicator
                const text = extractText(post, topicToRemove);
                const media = extractMedia(post);

                if (text || media.length > 0) {
                    chainedPosts.push({ text, media });
                }
            }
        } else {
            // Feed view - look for consecutive siblings
            let sibling = element.nextElementSibling;
            let count = 0;
            const maxChain = 20;

            while (sibling && count < maxChain) {
                // Check if it's a post container
                if (sibling.getAttribute('data-pressable-container') !== 'true') {
                    const innerPost = sibling.querySelector('[data-pressable-container="true"]');
                    if (innerPost) {
                        sibling = innerPost;
                    } else {
                        sibling = sibling.nextElementSibling;
                        continue;
                    }
                }

                // Check if same author
                const siblingAuthorLink = sibling.querySelector('a[href^="/@"]');
                if (!siblingAuthorLink) break;

                const siblingAuthor = '@' + siblingAuthorLink.getAttribute('href').replace('/@', '').split('/')[0];
                if (siblingAuthor !== author) {
                    break;
                }

                // Extract content
                const text = extractText(sibling, topicToRemove);
                const media = extractMedia(sibling);

                if (text || media.length > 0) {
                    chainedPosts.push({ text, media });
                }

                sibling = sibling.nextElementSibling;
                count++;
            }
        }

        return chainedPosts;
    }

    // Extract quoted post
    function extractQuotedPost(element) {
        const quotedEl = element.querySelector('[data-pressable-container] [data-pressable-container]');
        if (quotedEl) {
            return {
                author: extractAuthor(quotedEl),
                content: {
                    text: extractText(quotedEl),
                    media: extractMedia(quotedEl)
                }
            };
        }
        return null;
    }

    // Extract reposter info
    function extractReposter(element) {
        const repostHeader = element.querySelector('[aria-label*="repost"]');
        if (repostHeader) {
            const link = repostHeader.closest('a[href^="/@"]');
            if (link) {
                const username = link.getAttribute('href').replace('/@', '').split('/')[0];
                return {
                    username: `@${username}`,
                    displayName: username
                };
            }
        }
        return null;
    }

    // Convert post data to markdown
    function convertToMarkdown(postData) {
        const now = new Date();

        // Format dates in Seoul timezone (KST = UTC+9)
        const formatSeoulDate = (dateInput) => {
            const date = new Date(dateInput);
            return date.toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        };

        const savedDate = formatSeoulDate(now);
        const postDate = postData.timestamp ? formatSeoulDate(postData.timestamp) : '알 수 없음';

        // Frontmatter (for Obsidian properties)
        let md = '---\n';
        md += 'source: threads\n';
        md += `type: ${postData.type}\n`;
        md += `author: "${escapeYaml(postData.author.username)}"\n`;
        md += `author_name: "${escapeYaml(postData.author.displayName)}"\n`;
        md += `post_url: "${escapeYaml(postData.url)}"\n`;
        md += `saved_at: "${savedDate}"\n`;

        if (postData.timestamp) {
            md += `post_date: "${postDate}"\n`;
        }

        if (postData.type === 'thread' && postData.chainedPosts.length > 0) {
            md += `thread_count: ${postData.chainedPosts.length + 1}\n`;
        }

        if (postData.type === 'repost' && postData.reposter) {
            md += `reposter: "${escapeYaml(postData.reposter.username)}"\n`;
        }

        if (postData.type === 'quote' && postData.quotedPost) {
            md += `quoted_author: "${escapeYaml(postData.quotedPost.author.username)}"\n`;
        }

        md += 'tags:\n  - threads\n';
        if (postData.content.tag) {
            // Format tag without # for frontmatter
            const cleanTag = postData.content.tag.replace(/^#/, '');
            md += `  - ${cleanTag}\n`;
        }
        md += '---\n\n';

        // Title
        if (postData.type === 'repost') {
            md += `# 리포스트 by ${postData.reposter?.username || 'unknown'}\n\n`;
        } else if (postData.type === 'quote') {
            md += `# ${postData.author.username}의 인용\n\n`;
        } else if (postData.type === 'thread') {
            md += `# ${postData.author.username}의 스레드 (${postData.chainedPosts.length + 1}개 글)\n\n`;
        } else {
            md += `# ${postData.author.username}의 게시글\n\n`;
        }

        // Post Info Section (visible when shared)
        md += '## 📋 게시글 정보\n\n';
        md += `| 항목 | 내용 |\n`;
        md += `|------|------|\n`;
        md += `| 게시자 | [${postData.author.displayName} (${postData.author.username})](${postData.author.profileUrl}) |\n`;
        md += `| 게시URL | [Threads에서 보기](${postData.url}) |\n`;
        md += `| 게시일 | ${postDate} |\n`;
        md += `| 저장일 | ${savedDate} |\n`;

        if (postData.content.tag) {
            md += `| 태그 | #${postData.content.tag.replace(/^#/, '')} |\n`;
        }

        if (postData.type === 'repost' && postData.reposter) {
            md += `| 리포스터 | ${postData.reposter.username} |\n`;
        }

        md += '\n---\n\n';

        // Main content
        md += '## 📝 본문\n\n';
        if (postData.content.text) {
            md += `> ${postData.content.text.replace(/\n/g, '\n> ')}\n\n`;
        }

        // Media
        if (postData.content.media.length > 0) {
            md += '## 🖼️ 미디어\n\n';
            let imageIndex = 0;
            postData.content.media.forEach((media) => {
                if (media.type === 'image') {
                    imageIndex++;
                    if (settings.downloadImages) {
                        const postDateForPath = postData.timestamp ? new Date(postData.timestamp) : new Date();
                        const imageFolderPath = getImageFolderPath(postDateForPath);
                        const localPath = `${imageFolderPath}/${generateFilename(postData).replace('.md', '')}_${imageIndex}.jpg`;
                        md += `![[${localPath}]]\n\n`;
                    } else {
                        md += `![이미지 ${imageIndex}](${media.url})\n\n`;
                    }
                } else if (media.type === 'video') {
                    md += `[🎬 동영상 링크](${media.url})\n\n`;
                }
            });
        }

        // Chained posts for threads
        if (postData.type === 'thread' && postData.chainedPosts.length > 0) {
            postData.chainedPosts.forEach((post, i) => {
                md += `## ${i + 2}/${postData.chainedPosts.length + 1}\n\n`;
                if (post.text) {
                    md += `> ${post.text.replace(/\n/g, '\n> ')}\n\n`;
                }
                if (post.media && post.media.length > 0) {
                    let chainImageIndex = 0;
                    post.media.forEach((media) => {
                        if (media.type === 'image') {
                            chainImageIndex++;
                            if (settings.downloadImages) {
                                // Generate filename for chained post images
                                const postDateForPath = postData.timestamp ? new Date(postData.timestamp) : new Date();
                                const imageFolderPath = getImageFolderPath(postDateForPath);
                                const chainImagePath = `${imageFolderPath}/${generateFilename(postData).replace('.md', '')}_p${i + 2}_${chainImageIndex}.jpg`;
                                md += `![[${chainImagePath}]]\n\n`;
                            } else {
                                md += `![첨부 이미지](${media.url})\n\n`;
                            }
                        }
                    });
                }
            });
        }

        // Quoted post
        if (postData.type === 'quote' && postData.quotedPost) {
            md += `## 💬 인용된 원본 (${postData.quotedPost.author.username})\n\n`;
            if (postData.quotedPost.content.text) {
                md += `> ${postData.quotedPost.content.text.replace(/\n/g, '\n> ')}\n\n`;
            }
        }

        return md;
    }

    // Generate filename based on settings
    function generateFilename(postData) {
        const username = postData.author.username.replace('@', '');

        let dateStr;
        if (settings.fileNameType === 'postDate' && postData.timestamp) {
            const date = new Date(postData.timestamp);
            dateStr = formatDate(date);
        } else {
            dateStr = formatDate(new Date());
        }

        return `@${username}_${dateStr}.md`;
    }

    // Format date for filename
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}${month}${day}_${hours}${minutes}`;
    }

    // Get image folder path based on settings and date
    function getImageFolderPath(date) {
        if (settings.useYearMonthFolders && settings.imageFolderMode === 'relative') {
            // Use note folder + _img suffix (e.g., "Threads/2026/01_img")
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            return `${settings.notesFolder}/${year}/${month}_img`;
        }
        return settings.imageFolder;
    }

    // Get or create toast container for stacking
    function getToastContainer() {
        let container = document.querySelector('.threads-obsidian-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'threads-obsidian-toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    // Show toast notification with optional click-to-open Obsidian (supports stacking)
    function showToast(message, options = {}) {
        const { filePath, isSuccess, vaultName, isProcessing, postId, authorId } = options;
        const container = getToastContainer();

        // If postId given, find and replace existing toast for this post
        if (postId) {
            const existing = container.querySelector(`.threads-obsidian-toast[data-post-id="${postId}"]`);
            if (existing) {
                existing.remove();
            }
        } else {
            // For non-postId toasts (errors etc.), remove duplicates
            const existingGeneric = container.querySelector('.threads-obsidian-toast:not([data-post-id])');
            if (existingGeneric) {
                existingGeneric.remove();
            }
        }

        const toast = document.createElement('div');
        toast.className = 'threads-obsidian-toast';
        if (postId) {
            toast.dataset.postId = postId;
        }

        // Author badge (shown for all post-related toasts)
        const authorBadge = authorId ? authorId : '';

        if (isProcessing) {
            // Processing toast with spinner - stays visible until replaced
            const { stage, model, elapsed } = options;
            const stageText = stage || 'AI 변환 중...';
            const modelText = model || '';
            const elapsedText = elapsed !== undefined ? `${elapsed}초` : '';
            const subtitleParts = [modelText, elapsedText].filter(Boolean).join(' • ') || '잠시 기다려주세요';

            const icon = document.createElement('span');
            icon.className = 'toast-icon toast-spinner';
            icon.textContent = '\u23F3';
            const content = document.createElement('div');
            content.className = 'toast-content';
            if (authorBadge) {
                const author = document.createElement('div');
                author.className = 'toast-author';
                author.textContent = authorBadge;
                content.appendChild(author);
            }
            const title = document.createElement('div');
            title.className = 'toast-title';
            title.textContent = stageText;
            const subtitle = document.createElement('div');
            subtitle.className = 'toast-subtitle';
            subtitle.textContent = subtitleParts;
            content.appendChild(title);
            content.appendChild(subtitle);
            toast.appendChild(icon);
            toast.appendChild(content);
            toast.dataset.processing = 'true';
        } else if (filePath && isSuccess) {
            // Create structured toast with click-to-open
            const hasVault = vaultName && vaultName.trim() !== '';
            const imageErrors = options.imageErrors || [];

            const icon = document.createElement('span');
            icon.className = 'toast-icon';
            icon.textContent = imageErrors.length > 0 ? '\u26A0\uFE0F' : '\u2705';
            const content = document.createElement('div');
            content.className = 'toast-content';
            if (authorBadge) {
                const author = document.createElement('div');
                author.className = 'toast-author';
                author.textContent = authorBadge;
                content.appendChild(author);
            }
            const title = document.createElement('div');
            title.className = 'toast-title';
            title.textContent = imageErrors.length > 0
                ? `Obsidian에 저장됨 (이미지 ${imageErrors.length}개 실패)`
                : 'Obsidian에 저장됨';
            const subtitle = document.createElement('div');
            subtitle.className = 'toast-subtitle';
            subtitle.textContent = hasVault ? '클릭하여 열기' : '설정에서 볼트 이름을 입력하세요';
            content.appendChild(title);
            content.appendChild(subtitle);
            toast.appendChild(icon);
            toast.appendChild(content);

            if (hasVault) {
                toast.style.cursor = 'pointer';

                // Click handler to open in Obsidian
                toast.addEventListener('click', () => {
                    const filePathWithoutExt = filePath.replace(/\.md$/, '');
                    const obsidianUri = `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(filePathWithoutExt)}`;
                    window.open(obsidianUri, '_blank');
                    toast.remove();
                });
            }
        } else {
            // Simple text toast for errors/warnings
            toast.textContent = message;
        }

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Only auto-hide if not a processing toast
        if (!isProcessing) {
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }

    // Start initialization
    init();
})();
