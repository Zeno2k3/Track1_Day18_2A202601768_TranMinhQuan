/* ============================================================
   COMPONENTS — hàm dựng UI dùng chung. Cả 3 nhánh gọi
   window.UI.* thay vì tự viết HTML, để giao diện đồng nhất.
   ============================================================ */
(function () {
  const ICONS = {
    book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H19v18H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M19 15H6.5A2.5 2.5 0 0 0 4 17.5"/>',
    highlight: '<path d="m9 11-6 6v3h3l6-6"/><path d="m17 3 4 4-9 9-4-4z"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.5v.4"/><path d="M12 17h.01"/>',
    note: '<path d="M4 5a2 2 0 0 1 2-2h8l6 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M14 3v6h6"/>',
    play: '<path d="M6 4l14 8-14 8z"/>',
    pause: '<path d="M8 4v16M16 4v16"/>',
    prev: '<path d="M15 5l-7 7 7 7"/>',
    next: '<path d="M9 5l7 7-7 7"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="m6.5 6.5 2.5 2.5M15 15l2.5 2.5M17.5 6.5 15 9M9 15l-2.5 2.5"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    trash: '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    empty: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h6M7 13h10"/>',
    zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>'
  };

  const MARK_LABEL = { highlight: 'Quan trọng', question: 'Chưa hiểu', note: 'Ghi chú' };
  const MARK_BADGE = { highlight: 'badge--highlight', question: 'badge--question', note: 'badge--note' };

  function icon(name, cls) {
    return `<svg class="icon ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  }

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function fmtTime(sec) {
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  /* --- Note card: dạng hiển thị chuẩn cho MỌI kết quả của 3 nhánh --- */
  function noteCard(mark, opts = {}) {
    const type = mark.type || 'note';
    const node = el(`
      <article class="note note--${type}">
        <div class="note__meta">
          ${icon(type === 'question' ? 'question' : type === 'note' ? 'note' : 'highlight')}
          <span class="badge ${MARK_BADGE[type] || 'badge--note'}">${escapeHtml(MARK_LABEL[type] || 'Ghi chú')}</span>
          <span aria-hidden="true">·</span>
          <span>${fmtTime(mark.t || 0)}</span>
          <span class="spacer"></span>
          <span class="badge badge--muted">${escapeHtml(mark.slideId || '')}</span>
        </div>
        <p class="note__text">${escapeHtml(mark.text || '')}</p>
        ${mark.note ? `<p class="note__text" style="color:var(--color-muted-fg)">${escapeHtml(mark.note)}</p>` : ''}
        <div class="note__actions"></div>
      </article>`);

    const actions = node.querySelector('.note__actions');
    (opts.actions || []).forEach(a => {
      const b = el(`<button class="btn btn--ghost btn--sm" type="button">${a.icon ? icon(a.icon) : ''}<span>${escapeHtml(a.label)}</span></button>`);
      b.addEventListener('click', () => a.onClick(mark, node));
      actions.appendChild(b);
    });
    if (!actions.children.length) actions.remove();

    if (opts.onSeek) {
      node.style.cursor = 'pointer';
      node.addEventListener('click', e => {
        if (e.target.closest('button')) return;
        opts.onSeek(mark);
      });
    }
    return node;
  }

  function emptyState(title, hint) {
    return el(`
      <div class="empty">
        <span class="empty__icon">${icon('empty', 'icon--lg')}</span>
        <p class="empty__title">${escapeHtml(title)}</p>
        <p class="empty__hint">${escapeHtml(hint || '')}</p>
      </div>`);
  }

  function skeletonBlock(lines = 3) {
    const wrap = el('<div class="stack" aria-hidden="true"></div>');
    for (let i = 0; i < lines; i++) {
      const s = el('<div class="skeleton"></div>');
      s.style.width = `${60 + Math.random() * 40}%`;
      wrap.appendChild(s);
    }
    return wrap;
  }

  let toastHost = null;
  function toast(message, ms = 2600, variant) {
    if (!toastHost) {
      toastHost = el('<div class="toasts" role="status" aria-live="polite"></div>');
      document.body.appendChild(toastHost);
    }
    const glyph = variant === 'nudge' ? 'sparkle' : 'check';
    const t = el(`<div class="toast${variant ? ` toast--${variant}` : ''}">${icon(glyph)}<span>${escapeHtml(message)}</span></div>`);
    toastHost.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }

  /* Thông báo động — 1 cái tại một thời điểm, nhảy vào khi vào màn / khi bấm nút */
  let coachHost = null, coachEl = null, coachTimer = null;
  function notify(titleOrOpts, body, extra) {
    const opts = typeof titleOrOpts === 'string'
      ? { title: titleOrOpts, body: body || '', ...(extra || {}) }
      : (titleOrOpts || {});
    const title = opts.title || 'Bước tiếp theo';
    const text = opts.body || '';
    const variant = opts.variant || 'info';
    const ms = opts.ms == null ? 7000 : opts.ms;
    if (!coachHost) {
      coachHost = el('<div class="coaches" role="status" aria-live="assertive"></div>');
      document.body.appendChild(coachHost);
    }
    if (coachTimer) clearTimeout(coachTimer);
    if (coachEl) coachEl.remove();
    const glyph = variant === 'success' ? 'check' : variant === 'nudge' ? 'sparkle' : variant === 'warn' ? 'info' : 'info';
    coachEl = el(`
      <div class="coach coach--${variant}">
        <span class="coach__icon">${icon(glyph)}</span>
        <div class="coach__body">
          <p class="coach__kicker">Bước tiếp theo</p>
          <p class="coach__title">${escapeHtml(title)}</p>
          ${text ? `<p class="coach__text">${escapeHtml(text)}</p>` : ''}
          <div class="coach__actions"></div>
        </div>
        <button class="coach__close" type="button" aria-label="Đóng">${icon('close')}</button>
      </div>`);
    const actions = coachEl.querySelector('.coach__actions');
    if (opts.action && opts.action.label) {
      const b = el(`<button class="btn btn--sm btn--secondary coach__cta" type="button">${escapeHtml(opts.action.label)}</button>`);
      b.addEventListener('click', () => {
        opts.action.onClick && opts.action.onClick();
        dismiss();
      });
      actions.appendChild(b);
    } else {
      actions.remove();
    }
    function dismiss() {
      if (coachTimer) clearTimeout(coachTimer);
      if (coachEl) { coachEl.remove(); coachEl = null; }
    }
    coachEl.querySelector('.coach__close').addEventListener('click', dismiss);
    coachHost.appendChild(coachEl);
    if (ms > 0) coachTimer = setTimeout(dismiss, ms);
    return dismiss;
  }

  /* Coachmark / onboarding callout — icon có thể là tên SVG hoặc emoji */
  function guideBanner(iconOrEmoji, text) {
    const isKey = !!(iconOrEmoji && ICONS[iconOrEmoji]);
    const glyph = isKey
      ? icon(iconOrEmoji)
      : `<span class="guide-banner__emoji" aria-hidden="true">${escapeHtml(iconOrEmoji || '')}</span>`;
    const formatted = escapeHtml(text || '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return el(`
      <aside class="guide-banner" role="note">
        ${glyph}
        <p class="guide-banner__text">${formatted}</p>
      </aside>`);
  }

  function stripHtml(s) {
    return String(s).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  function phrasesFromSlide(slide) {
    if (!slide) return [];
    const chunks = [slide.title, slide.lead, ...(slide.bullets || []).map(stripHtml)];
    const out = [];
    chunks.forEach(t => {
      if (!t) return;
      out.push(t);
      String(t).split(/[.;:]\s+/).forEach(p => {
        const x = p.trim();
        if (x.length > 6) out.push(x);
      });
    });
    return [...new Set(out)];
  }

  function filterSuggest(query, phrases) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return phrases.slice(0, 6);
    return phrases.filter(s => {
      const L = s.toLowerCase();
      if (L.startsWith(q)) return true;
      return L.split(/[\s,./()]+/).some(w => w.startsWith(q));
    }).slice(0, 8);
  }

  /* Gợi ý kiểu VSCode: dropdown dưới ô nhập, Tab/Enter/click để nhận */
  function suggestField(input, getPhrases) {
    const wrap = el('<div class="suggest"></div>');
    wrap.appendChild(input);
    const menu = el('<div class="suggest__menu" hidden role="listbox"></div>');
    wrap.appendChild(menu);
    let items = [];
    let active = 0;

    function highlight(text, q) {
      const raw = escapeHtml(text);
      if (!q) return raw;
      const i = text.toLowerCase().indexOf(q.toLowerCase());
      if (i < 0) return raw;
      const a = escapeHtml(text.slice(0, i));
      const b = escapeHtml(text.slice(i, i + q.length));
      const c = escapeHtml(text.slice(i + q.length));
      return `${a}<mark>${b}</mark>${c}`;
    }

    function close() {
      menu.hidden = true;
      items = [];
    }

    function renderMenu() {
      const q = input.value;
      if (!String(q).trim()) { close(); return; }
      const phrases = getPhrases() || [];
      items = filterSuggest(q, phrases);
      if (!items.length || document.activeElement !== input) { close(); return; }
      active = Math.max(0, Math.min(active, items.length - 1));
      menu.innerHTML = `<div class="suggest__hint">Gợi ý từ slide hiện tại · Tab hoặc Enter để chọn</div>` + items.map((s, i) =>
        `<button class="suggest__item" type="button" role="option" aria-selected="${i === active}" data-i="${i}">${highlight(s, q)}</button>`
      ).join('');
      menu.hidden = false;
    }

    function accept(i) {
      const pick = items[i];
      if (!pick) return;
      input.value = pick;
      close();
      input.focus();
    }

    input.addEventListener('input', () => { active = 0; renderMenu(); });
    input.addEventListener('focus', () => { active = 0; renderMenu(); });
    input.addEventListener('blur', () => setTimeout(close, 140));
    input.addEventListener('keydown', e => {
      if (menu.hidden || !items.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % items.length; renderMenu(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + items.length) % items.length; renderMenu(); }
      else if (e.key === 'Tab') {
        e.preventDefault();
        accept(active);
      } else if (e.key === 'Enter') {
        accept(active);
      } else if (e.key === 'Escape') { close(); }
    });
    menu.addEventListener('mousedown', e => {
      const b = e.target.closest('[data-i]');
      if (!b) return;
      e.preventDefault();
      accept(Number(b.dataset.i));
    });
    return wrap;
  }

  window.UI = { icon, el, fmtTime, escapeHtml, stripHtml, noteCard, emptyState, skeletonBlock, toast, notify, guideBanner, suggestField, phrasesFromSlide, MARK_LABEL, MARK_BADGE };
})();
