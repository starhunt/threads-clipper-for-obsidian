// Custom i18n module for Threads to Obsidian.
// Works in pages (popup/options), content scripts, and service worker (importScripts).
// Loads _locales/{lang}/messages.json from the extension and exposes getMessage().

(function (root) {
  const SUPPORTED = ['en', 'ko'];
  const DEFAULT_LANG = 'en';

  let currentLang = DEFAULT_LANG;
  let messages = {};
  let ready = false;
  let readyPromise = null;

  function resolveAuto() {
    try {
      const ui = (chrome.i18n && chrome.i18n.getUILanguage) ? chrome.i18n.getUILanguage() : '';
      if (typeof ui === 'string' && ui.toLowerCase().startsWith('ko')) return 'ko';
    } catch (e) { /* ignore */ }
    return 'en';
  }

  function normalizeLang(value) {
    if (!value || value === 'auto') return resolveAuto();
    return SUPPORTED.includes(value) ? value : DEFAULT_LANG;
  }

  async function fetchMessages(lang) {
    const url = chrome.runtime.getURL(`_locales/${lang}/messages.json`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`i18n fetch failed: ${lang}`);
    return res.json();
  }

  async function readStoredLanguage() {
    try {
      const stored = await chrome.storage.sync.get('settings');
      return stored?.settings?.language || 'auto';
    } catch (e) {
      return 'auto';
    }
  }

  async function init(forceLang) {
    if (readyPromise && !forceLang) return readyPromise;
    readyPromise = (async () => {
      const raw = forceLang ?? await readStoredLanguage();
      currentLang = normalizeLang(raw);
      try {
        messages = await fetchMessages(currentLang);
      } catch (e) {
        if (currentLang !== DEFAULT_LANG) {
          currentLang = DEFAULT_LANG;
          messages = await fetchMessages(DEFAULT_LANG);
        } else {
          messages = {};
        }
      }
      ready = true;
    })();
    return readyPromise;
  }

  function substitute(template, args) {
    if (!args || args.length === 0) return template;
    return template.replace(/\$(\d+)/g, (_, n) => {
      const idx = parseInt(n, 10) - 1;
      return args[idx] !== undefined ? String(args[idx]) : '';
    });
  }

  function getMessage(key, ...args) {
    const entry = messages[key];
    if (!entry || typeof entry.message !== 'string') {
      // Fallback: key itself, so missing keys are visible during development.
      return key;
    }
    return substitute(entry.message, args.length === 1 && Array.isArray(args[0]) ? args[0] : args);
  }

  function applyTranslations(rootElement) {
    const root = rootElement || document;
    if (!root.querySelectorAll) return;

    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const value = getMessage(key);
      if (value) el.textContent = value;
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      const value = getMessage(key);
      if (value) el.setAttribute('placeholder', value);
    });
    root.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      const value = getMessage(key);
      if (value) el.setAttribute('title', value);
    });
    root.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria-label');
      const value = getMessage(key);
      if (value) el.setAttribute('aria-label', value);
    });

    // Translate <html lang="..."> for accessibility
    if (root === document && document.documentElement) {
      document.documentElement.setAttribute('lang', currentLang);
    }
  }

  function getCurrentLanguage() {
    return currentLang;
  }

  function isReady() {
    return ready;
  }

  const api = {
    init,
    getMessage,
    applyTranslations,
    getCurrentLanguage,
    isReady,
    SUPPORTED,
    DEFAULT_LANG
  };

  // Expose to global scope (works in service worker via importScripts, content scripts, and pages)
  if (typeof window !== 'undefined') {
    window.i18n = api;
  } else if (typeof self !== 'undefined') {
    self.i18n = api;
  } else if (typeof globalThis !== 'undefined') {
    globalThis.i18n = api;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
