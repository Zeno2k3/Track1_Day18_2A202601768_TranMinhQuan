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
    empty: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h6M7 13h10"/>'
  };

  const MARK_LABEL = { highlight: 'Highlight', question: 'Câu hỏi', note: 'Ghi chú' };

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
    const node = el(`
      <article class="note note--${mark.type}">
        <div class="note__meta">
          ${icon(mark.type === 'question' ? 'question' : mark.type === 'note' ? 'note' : 'highlight')}
          <span>${MARK_LABEL[mark.type] || 'Ghi chú'}</span>
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
  function toast(message, ms = 2600) {
    if (!toastHost) {
      toastHost = el('<div class="toasts" role="status" aria-live="polite"></div>');
      document.body.appendChild(toastHost);
    }
    const t = el(`<div class="toast">${icon('check')}<span>${escapeHtml(message)}</span></div>`);
    toastHost.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }

  window.UI = { icon, el, fmtTime, escapeHtml, noteCard, emptyState, skeletonBlock, toast, MARK_LABEL };
})();
