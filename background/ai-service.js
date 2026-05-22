// AI Service Module - Handles AI API calls for content transformation

const _t = (key, ...args) => (self.i18n ? self.i18n.getMessage(key, ...args) : key);

function aiFetchWithTimeout(url, options = {}, timeoutMs = 60000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(id));
}

const AI_ENDPOINTS = {
    openai: 'https://api.openai.com/v1/chat/completions',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
    anthropic: 'https://api.anthropic.com/v1/messages',
    grok: 'https://api.x.ai/v1/chat/completions',
    zai: 'https://api.z.ai/api/coding/paas/v4/chat/completions'
};

async function callAI(prompt, settings) {
    const { aiProvider, aiApiKey, aiEndpoint, aiModel, aiMaxTokens = 64000 } = settings;

    // Custom/Local endpoints may not require auth (e.g. self-hosted Ollama, LM Studio).
    // Other providers always need a key.
    if (!aiApiKey && aiProvider !== 'custom') {
        throw new Error(_t('errApiKeyMissing'));
    }

    switch (aiProvider) {
        case 'openai':
        case 'grok':
            return await callOpenAICompatible(prompt, aiApiKey, AI_ENDPOINTS[aiProvider], aiModel, aiMaxTokens, aiProvider);
        case 'gemini':
            return await callGemini(prompt, aiApiKey, aiModel, aiMaxTokens);
        case 'anthropic':
            return await callAnthropic(prompt, aiApiKey, aiModel, aiMaxTokens);
        case 'zai': {
            const endpoint = aiEndpoint || AI_ENDPOINTS.zai;
            return await callOpenAICompatible(prompt, aiApiKey, endpoint, aiModel, aiMaxTokens, 'zai');
        }
        case 'custom':
            if (!aiEndpoint) throw new Error(_t('errCustomEndpoint'));
            return await callOpenAICompatible(prompt, aiApiKey, aiEndpoint, aiModel, aiMaxTokens, 'custom');
        default:
            throw new Error(_t('errUnsupportedProvider', aiProvider));
    }
}

async function callOpenAICompatible(prompt, apiKey, endpoint, model, maxTokens, _providerTag) {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await aiFetchWithTimeout(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: maxTokens
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(_t('errApiError', response.status, error));
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error(_t('errInvalidResponse'));
    return content;
}

async function callGemini(prompt, apiKey, model, maxTokens) {
    const endpoint = AI_ENDPOINTS.gemini.replace('{model}', model) + `?key=${apiKey}`;

    const response = await aiFetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: maxTokens
            }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(_t('errApiError', `Gemini ${response.status}`, error));
    }

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error(_t('errInvalidResponse'));
    return content;
}

async function callAnthropic(prompt, apiKey, model, maxTokens) {
    const response = await aiFetchWithTimeout(AI_ENDPOINTS.anthropic, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            messages: [{ role: 'user', content: prompt }]
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(_t('errApiError', `Anthropic ${response.status}`, error));
    }

    const data = await response.json();
    const content = data?.content?.[0]?.text;
    if (!content) throw new Error(_t('errInvalidResponse'));
    return content;
}

// Transform post content AND generate title in single API call
async function transformWithTitle(postData, settings) {
    const prompt = buildTransformPrompt(postData, settings);

    try {
        const response = await callAI(prompt, settings);

        let title = null;
        let content = response;

        const titleMatch = response.match(/<<TITLE>>\s*([\s\S]+?)\s*<<\/?TITLE>>/i);

        if (titleMatch) {
            title = titleMatch[1];
            content = response.replace(/<<TITLE>>[\s\S]+?<<\/?TITLE>>\n?/i, '').trim();
        } else {
            const lines = response.split('\n');
            const firstLine = lines[0].trim();

            if (firstLine.match(/^(Title|제목)\s*[:]\s*(.+)$/i)) {
                title = firstLine.match(/^(Title|제목)\s*[:]\s*(.+)$/i)[2];
                content = lines.slice(1).join('\n').trim();
            } else if (firstLine.length > 0 && firstLine.length < 50 && !firstLine.startsWith('#') && !firstLine.startsWith('---')) {
                title = firstLine;
                content = lines.slice(1).join('\n').trim();
            }
        }

        if (title) {
            title = title.trim()
                .replace(/[\/\\:*?"<>|]/g, '')
                .replace(/\.$/, '')
                .substring(0, 50);
        }

        return { title, content };
    } catch (error) {
        console.error('[AI Service] Transform failed:', error);
        return { title: null, content: null, error: error.message };
    }
}

// English fallback prompt template (used only when settings.aiPromptTemplate is empty).
// Users typically configure their own template in the options page.
const DEFAULT_PROMPT_TEMPLATE = `Below is a Threads SNS post. Analyze it and transform it into the format below.
Write all content in English.

---
Author: {author}
Original:
{content}
---

**[Required] The very first line of your response MUST be the title in this exact format:**
<<TITLE>>A concise summary title within 15-20 characters<</TITLE>>

(Do not use special characters /, \\, :, *, ?, ", <, >, | in the title.)

Then output the body starting on the next line:

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

function buildTransformPrompt(postData, settings) {
    const content = postData.content.text;
    const author = postData.author.displayName || postData.author.username;
    const chainedContent = postData.chainedPosts?.map((p, i) =>
        `[${i + 2}/${postData.chainedPosts.length + 1}] ${p.text}`
    ).join('\n\n') || '';

    const fullContent = chainedContent
        ? `${content}\n\n--- ${_t('mdChainedPosts')} ---\n${chainedContent}`
        : content;

    const template = settings.aiPromptTemplate || DEFAULT_PROMPT_TEMPLATE;

    return template
        .replace(/\{author\}/g, author)
        .replace(/\{content\}/g, fullContent);
}

async function testAIConnection(settings) {
    const testPrompt = _t('aiTestPrompt');
    try {
        const response = await callAI(testPrompt, settings);
        return {
            success: true,
            message: _t('aiTestSuccess', response.substring(0, 50))
        };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

if (typeof self !== 'undefined') {
    self.aiService = {
        callAI,
        transformWithTitle,
        testAIConnection
    };
}
