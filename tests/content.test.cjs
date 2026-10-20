const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const source = fs.readFileSync(process.env.CONTENT_SCRIPT || 'content/content.js', 'utf8');

function post(id, text = id, author = 'writer', label = 'Like') {
    return `<div data-pressable-container="true" id="${id}">
      <a href="/@${author}"><span dir="auto">${author}</span></a>
      <a href="/@${author}/post/${id}"><time datetime="2026-10-20T01:00:00Z">1h</time></a>
      <div dir="auto">${text}</div>
      <div role="button" class="more"><svg><title>More</title></svg></div>
      <div role="button" class="like"><svg><title>${label}</title></svg></div>
    </div>`;
}
async function setup(html, url = '/@writer/post/B', options = {}) {
    const dom = new JSDOM(html + '<div role="menuitem" id="save">Save</div>', {
        url: 'https://www.threads.com' + url, runScripts: 'outside-only'
    });
    const w = dom.window;
    const sent = [], timers = [], errors = [];
    Object.defineProperty(w.HTMLElement.prototype, 'innerText', { get() { return this.textContent; } });
    w.Element.prototype.getClientRects = function () {
        for (let el = this; el; el = el.parentElement) {
            if (el.hidden || el.style.display === 'none') return [];
        }
        return [{}];
    };
    w.setTimeout = (fn, delay) => { timers.push({ fn, delay }); return timers.length; };
    w.setInterval = () => 1;
    w.console.error = (...args) => errors.push(args);
    w.i18n = { init: async () => {}, getMessage: key => key };
    w.chrome = { runtime: {
        id: 'test', onMessage: { addListener() {} },
        sendMessage: async message => {
            if (message.type === 'GET_SETTINGS') return {
                triggerOnLike: true, triggerOnSave: true, saveMethod: 'rest',
                notesFolder: 'Threads', imageFolder: 'Threads_img', ...options
            };
            sent.push(message);
            return { success: true, path: 'Threads/test.md' };
        }
    } };
    w.eval(source);
    await new Promise(resolve => setImmediate(resolve));
    const flush = async () => {
        const pending = timers.splice(0);
        for (const timer of pending) if (timer.delay <= 200) timer.fn();
        await Promise.resolve(); await Promise.resolve();
    };
    const click = selector => w.document.querySelector(selector).dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    return { w, sent, errors, flush, click, close: () => w.close() };
}
function content(h) { return h.sent[0]?.data.content; }

 test('save selects current visible post over retained hidden feed and duplicate', async t => {
    const h = await setup(`<section style="display:none">${post('A')}${post('B', 'STALE COPY')}</section><main>${post('B', 'CURRENT BODY')}</main>`);
    t.after(h.close); h.click('#save'); await h.flush();
    assert.equal(h.sent.length, 1); assert.match(content(h), /CURRENT BODY/); assert.doesNotMatch(content(h), /STALE COPY/);
    assert.match(content(h), /post\/B/);
 });
 test('save does not depend on DOM order when unrelated visible posts precede target', async t => {
    const h = await setup(`<main>${post('A')}${post('B', 'TARGET')}</main>`);
    t.after(h.close); h.click('#save'); await h.flush(); assert.match(content(h), /TARGET/);
 });
 for (const [name, html] of [
    ['missing target', post('A')],
    ['hidden target', `<div hidden>${post('B')}</div>${post('A')}`],
    ['ambiguous duplicate', post('B') + post('B')],
    ['only quoted target', post('A').replace('<div dir="auto">A</div>', post('B')).replace('id="B"', 'id="quoted"')],
 ]) {
    test(`save refuses ${name}`, async t => {
        const h = await setup(html); t.after(h.close);
        // Nested quote is visible but is not the current top-level detail post.
        h.click('#save'); await h.flush(); assert.equal(h.sent.length, 0);
    });
 }
 test('save captures content before synchronous navigation in the page handler', async t => {
    const h = await setup(`<main>${post('B', 'CLICKED BODY')}</main>`); t.after(h.close);
    h.w.document.querySelector('#save').addEventListener('click', () => {
        h.w.history.pushState({}, '', '/@writer/post/C');
        h.w.document.querySelector('main').innerHTML = post('C', 'NEXT BODY');
    });
    h.click('#save'); await h.flush(); assert.match(content(h), /CLICKED BODY/); assert.doesNotMatch(content(h), /NEXT BODY/);
 });
 test('menu owner selects a reply rather than the detail root', async t => {
    const h = await setup(`<main>${post('B', 'ROOT')}${post('C', 'REPLY', 'reply')}</main>`); t.after(h.close);
    h.click('#C .more'); h.click('#save'); await h.flush(); assert.match(content(h), /REPLY/); assert.match(content(h), /post\/C/);
 });
 test('menu context is rejected after SPA navigation', async t => {
    const h = await setup(`<main>${post('B')}${post('C')}</main>`); t.after(h.close);
    h.click('#B .more'); h.w.history.pushState({}, '', '/@writer/post/C'); h.click('#save'); await h.flush(); assert.equal(h.sent.length, 0);
 });
 test('canonical identity handles threads.net, media suffix and query', async t => {
    const h = await setup(post('B_-'), '/@writer/post/B_-/media?x=1'); t.after(h.close);
    h.w.document.querySelector('time').closest('a').href = 'https://www.threads.net/@writer/post/B_-/?x=2';
    h.click('#save'); await h.flush(); assert.match(content(h), /https:\/\/www.threads.net\/@writer\/post\/B_-/);
 });
 for (const [name, label, active, aria] of [
    ['English title', 'Like', 'Unlike', false], ['Korean title', '좋아요', '좋아요 취소', false], ['legacy aria-label', 'Like', 'Unlike', true]
 ]) {
    test(`like saves clicked post: ${name}`, async t => {
        const h = await setup(`<section hidden>${post('A')}</section><main>${post('B', 'LIKED BODY', 'writer', label)}</main>`); t.after(h.close);
        const svg = h.w.document.querySelector('#B .like svg');
        if (aria) svg.setAttribute('aria-label', label);
        h.click('#B .like');
        if (aria) svg.setAttribute('aria-label', active); else svg.querySelector('title').textContent = active;
        await h.flush(); assert.equal(h.sent.length, 1); assert.match(content(h), /LIKED BODY/);
    });
 }
 for (const action of ['unchanged', 'unlike', 'navigation', 'reused DOM', 'detached']) {
    test(`like does not save on ${action}`, async t => {
        const h = await setup(`<main>${post('B')}</main>`); t.after(h.close);
        const svg = h.w.document.querySelector('#B .like svg');
        if (action === 'unlike') svg.querySelector('title').textContent = 'Unlike';
        h.click('#B .like');
        if (action !== 'unchanged') svg.querySelector('title').textContent = 'Unlike';
        if (action === 'navigation') h.w.history.pushState({}, '', '/@writer/post/C');
        if (action === 'reused DOM') h.w.document.querySelector('time').closest('a').href = '/@writer/post/C';
        if (action === 'detached') h.w.document.querySelector('#B').remove();
        await h.flush(); assert.equal(h.sent.length, 0);
    });
 }
 test('feed likes save their own post and same timestamp does not suppress another post', async t => {
    const h = await setup(post('A') + post('B'), '/'); t.after(h.close);
    for (const id of ['A', 'B']) {
        h.click(`#${id} .like`);
        h.w.document.querySelector(`#${id} .like title`).textContent = 'Unlike'; await h.flush();
    }
    assert.equal(h.sent.length, 2);
 });
 test('related posts exclude hidden old pages, nested quotes and other columns', async t => {
    const h = await setup(`<main>${post('B', 'ROOT 1 / 2')}${post('C', 'CHAIN 2 / 2')}${post('D', 'CURRENT COMMENT', 'other')}<section hidden>${post('E', 'STALE COMMENT', 'other')}</section></main><main>${post('F', 'OTHER COLUMN', 'other')}</main>`, undefined, { collectComments: true });
    t.after(h.close); h.click('#save'); await h.flush();
    assert.match(content(h), /CHAIN/); assert.match(content(h), /CURRENT COMMENT/);
    assert.doesNotMatch(content(h), /STALE COMMENT|OTHER COLUMN/);
 });
 test('like snapshot is unchanged by later same-post content mutations', async t => {
    const h = await setup(post('B', 'ORIGINAL BODY')); t.after(h.close);
    h.click('#B .like'); h.w.document.querySelector('#B .like title').textContent = 'Unlike';
    h.w.document.querySelector('#B > div[dir]').textContent = 'CHANGED BODY'; await h.flush();
    assert.match(content(h), /ORIGINAL BODY/); assert.doesNotMatch(content(h), /CHANGED BODY/);
 });

test('article layout wrapper is not treated as a quoted post', async t => {
    const h = await setup(`<article>${post('B', 'ARTICLE BODY')}</article>`); t.after(h.close);
    h.click('#save'); await h.flush(); assert.match(content(h), /ARTICLE BODY/);
});
test('unchanged Like label does not save a white/red-tinted icon', async t => {
    const h = await setup(post('B')); t.after(h.close);
    h.w.document.querySelector('#B .like svg').style.color = 'rgb(255, 255, 255)';
    h.click('#B .like'); await h.flush(); assert.equal(h.sent.length, 0);
});
test('same post saved by like then bookmark is deduplicated', async t => {
    const h = await setup(post('B')); t.after(h.close);
    h.click('#B .like'); h.w.document.querySelector('#B .like title').textContent = 'Unlike';
    await h.flush(); h.click('#save'); await h.flush(); assert.equal(h.sent.length, 1);
});
