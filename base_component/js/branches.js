/* ============================================================
   BRANCHES — 3 hướng giải quyết, cùng chạy trên một shell.
   A (ai-notes) = bản trên main (nhánh A của teammate).
   B (template) = bản feature/template.
   C (reminder) = bản đã giữ trên feature/template.
   ============================================================ */
(function () {
  const { el, icon, escapeHtml, noteCard, emptyState, skeletonBlock, toast, notify, fmtTime, guideBanner, suggestField, phrasesFromSlide } = window.UI;
  const JOB = window.FIXTURE.job;

  const TEMPLATE_TABS = [
    { key: 'key',    label: 'Ý chính',      type: 'highlight', tab: '1. Ý chính',      badge: 'badge--highlight' },
    { key: 'unsure', label: 'Chưa hiểu',    type: 'question',  tab: '2. Chưa hiểu',    badge: 'badge--question'  },
    { key: 'todo',   label: 'Việc cần làm', type: 'note',      tab: '3. Việc cần làm', badge: 'badge--note'      }
  ];

  function slidePhrases(api) {
    const slide = api.currentSlide();
    const fromSlide = phrasesFromSlide(slide);
    const extra = api.fixture.suggestions || [];
    return [...new Set([...fromSlide, ...extra])];
  }

  /* ==========================================================
     HƯỚNG 1 — AI Notes tự động  (giải pháp hiện tại)
     Luồng: bắt dấu vết trong lúc học → AI tổng hợp sau bài
            → học viên sửa & xác nhận.
     Kiểm chứng: học viên có tin bản AI tổng hợp là "đủ đúng"
     để thay ghi chú tự tay hay không.
     Task/outcome: dùng chung JOB — nhánh này đánh vào vế "≤ 3 phút,
     đúng ≥ 80% ý". Chỉ số riêng đo ở footer: tỉ lệ chấp nhận từng ý.
     ========================================================== */
  window.App.registerBranch({
    id: 'ai-notes',
    label: '1 · AI Notes',
    railTitle: 'AI Notes tự động',
    task: JOB.task,
    outcome: JOB.outcome,
    mount(root, api, footer) {
      const panel = el(`
        <div class="stack">
          <div class="row" role="tablist" aria-label="Giai đoạn">
            <button class="seg" type="button" data-phase="capture" aria-selected="true">Trong lúc học</button>
            <button class="seg" type="button" data-phase="review" aria-selected="false">Sau bài học</button>
          </div>
          <div id="phaseBody"></div>
        </div>`);
      root.appendChild(panel);
      const body = panel.querySelector('#phaseBody');
      const review = { done: false };

      panel.addEventListener('click', e => {
        const b = e.target.closest('[data-phase]');
        if (!b) return;
        panel.querySelectorAll('[data-phase]').forEach(s => s.setAttribute('aria-selected', String(s === b)));
        b.dataset.phase === 'capture' ? renderCapture() : renderReview();
      });

      /* --- Giai đoạn 1: bắt dấu vết, 1 thao tác, không rời bài --- */
      function renderCapture() {
        body.innerHTML = '';
        const v = el(`
          <div class="stack">
            <p class="field__hint">Bôi đen chữ <b>trên slide hoặc transcript</b> rồi bấm một nút. Chọn chữ ở nơi khác sẽ không tính.</p>
            <div class="row" id="qa"></div>
            <div class="row row--between">
              <strong style="font-size:var(--text-sm)">Dấu vết đã bắt</strong>
              <span class="badge" id="cnt">0</span>
            </div>
            <div class="stack" id="list"></div>
          </div>`);
        body.appendChild(v);

        const acts = [
          { type: 'highlight', label: 'Quan trọng', icon: 'highlight', cls: 'btn--mark-highlight' },
          { type: 'question', label: 'Chưa hiểu', icon: 'question', cls: 'btn--mark-question' },
          { type: 'note', label: 'Ghi chú', icon: 'note', cls: 'btn--mark-note' }
        ];
        const qa = v.querySelector('#qa');
        acts.forEach(a => {
          const b = el(`<button class="btn btn--sm ${a.cls}" type="button">${icon(a.icon)}<span>${a.label}</span></button>`);
          b.addEventListener('click', () => {
            const sel = api.getSelectionText();
            if (!sel) return toast('Hãy bôi đen một đoạn chữ trên slide hoặc transcript');
            api.addMark({ type: a.type, text: sel });
            window.getSelection().removeAllRanges();
            toast(`Đã bắt: ${a.label}`);
          });
          qa.appendChild(b);
        });

        const list = v.querySelector('#list'), cnt = v.querySelector('#cnt');
        function draw() {
          const marks = api.getMarks();
          cnt.textContent = marks.length;
          list.innerHTML = '';
          if (!marks.length) return list.appendChild(
            emptyState('Chưa có dấu vết nào', 'Bôi đen một câu trên slide rồi bấm "Quan trọng".'));
          marks.forEach(m => list.appendChild(noteCard(m, {
            onSeek: mk => api.seek(mk.t),
            actions: [{ label: 'Xoá', icon: 'trash', onClick: mk => api.removeMark(mk.id) }]
          })));
        }
        api.on('marks:change', () => { if (body.contains(list)) draw(); });
        draw();
        stats();
      }

      /* --- Giai đoạn 2: AI tổng hợp (Act ở phần dựng nháp),
             học viên duyệt từng ý rồi mới lưu (Ask) --- */
      let draft = null;   // bản nháp AI đang mở; null = chưa tổng hợp lần nào

      /* AI đọc dấu vết của user + transcript → dựng nháp có dẫn chứng.
         Mỗi ý giữ `aiText` gốc để nút "Khôi phục" quay về được. */
      function buildDraft() {
        const g = api.fixture.goldenSummary;
        const marks = api.getMarks();
        const count = { total: marks.length, highlight: 0, question: 0, note: 0 };
        marks.forEach(m => { if (count[m.type] != null) count[m.type]++; });

        const fromMarks = marks.filter(m => m.type === 'question').map(m => ({
          text: m.note || m.text,
          origin: 'user',
          sources: [{ t: m.t, slideId: m.slideId, quote: m.text }]
        }));
        const groups = [
          { type: 'highlight', title: 'Quan trọng',   items: g.keyPoints },
          { type: 'question',  title: 'Chưa hiểu',    items: fromMarks.concat(g.openQuestions) },
          { type: 'note',      title: 'Việc cần làm', items: g.actionItems }
        ];
        const seen = new Set();
        return {
          count,
          groups: groups.map(sec => ({
            type: sec.type, title: sec.title,
            items: sec.items.filter(it => !seen.has(it.text) && seen.add(it.text)).map(it => ({
              aiText: it.text, text: it.text,
              inferred: !!it.inferred,
              origin: it.origin || 'ai',
              sources: it.sources || [],
              state: 'pending'
            }))
          })).filter(sec => sec.items.length)
        };
      }

      function allItems() {
        return draft ? draft.groups.flatMap(sec => sec.items) : [];
      }

      function renderReview() {
        body.innerHTML = '';
        const v = el(`
          <div class="stack">
            <p class="field__hint">AI dựng bản ghi chú từ dấu vết bạn đã bắt + transcript. Duyệt từng ý: đúng / sửa / bỏ.</p>
            <button class="btn btn--block" type="button" id="gen">${icon('sparkle')}<span>Tổng hợp bản ghi chú</span></button>
            <div class="stack" id="out"></div>
          </div>`);
        body.appendChild(v);
        const out = v.querySelector('#out');
        const gen = v.querySelector('#gen');
        const genLabel = gen.querySelector('span');

        function generate() {
          out.innerHTML = '';
          out.appendChild(skeletonBlock(6));
          gen.disabled = true;
          setTimeout(() => {
            gen.disabled = false;
            genLabel.textContent = 'Tạo lại bản tóm tắt bằng AI';
            draft = buildDraft();
            review.done = false;
            drawDraft(out);
          }, 900);
        }
        gen.addEventListener('click', generate);

        if (draft) { genLabel.textContent = 'Tạo lại bản tóm tắt bằng AI'; drawDraft(out); }
        else out.appendChild(emptyState('Chưa tổng hợp', 'Bấm nút trên sau khi buổi học kết thúc.'));
        stats();
      }

      function drawDraft(out) {
        out.innerHTML = '';
        const c = draft.count;

        /* Capability — AI nói rõ nó đã đọc những gì */
        out.appendChild(el(`
          <p class="field__hint">${icon('sparkle')} AI đã tổng hợp từ <b>${c.total} dấu vết</b> của bạn
            (${c.highlight} quan trọng · ${c.question} chưa hiểu · ${c.note} ghi chú) cùng transcript buổi học.</p>`));

        /* Limit — nói rõ đây mới là bản nháp, chưa lưu */
        out.appendChild(el(`
          <div class="callout callout--warn">${icon('question')}
            <span>Bản nháp do AI tạo, <b>chưa được lưu</b>. Vui lòng kiểm tra và chỉnh sửa lại theo ý bạn trước khi lưu.</span>
          </div>`));

        draft.groups.forEach(sec => {
          const box = el(`<div class="stack"><strong style="font-size:var(--text-sm)">${sec.title}</strong></div>`);
          const host = el('<div class="stack"></div>');
          sec.items.forEach(it => host.appendChild(reviewItem(it, sec.type)));
          box.appendChild(host);
          const add = el(`<button class="btn btn--ghost btn--sm" type="button">${icon('note')}<span>Thêm ý của bạn</span></button>`);
          add.addEventListener('click', () => {
            const it = { aiText: '', text: '', inferred: false, origin: 'user-added', sources: [], state: 'added' };
            sec.items.push(it);
            const node = reviewItem(it, sec.type);
            host.appendChild(node);
            node.querySelector('[data-act="edit"]').click();
            stats();
          });
          box.appendChild(add);
          out.appendChild(box);
        });

        /* Recovery + xác nhận */
        const bar = el('<div class="row"></div>');
        const reset = el(`<button class="btn btn--secondary btn--sm" type="button">${icon('prev')}<span>Khôi phục về bản AI vừa dựng</span></button>`);
        reset.addEventListener('click', () => {
          draft.groups.forEach(sec => {
            sec.items = sec.items.filter(it => it.origin !== 'user-added');
            sec.items.forEach(it => { it.text = it.aiText; it.state = 'pending'; });
          });
          review.done = false;
          drawDraft(out);
          toast('Đã khôi phục bản nháp gốc của AI');
        });
        bar.appendChild(reset);
        out.appendChild(bar);

        const save = el(`<button class="btn btn--accent btn--block" type="button">${icon('check')}<span>Xác nhận & lưu bản ghi chú</span></button>`);
        save.addEventListener('click', () => {
          const kept = allItems().filter(it => it.state !== 'dropped' && it.text.trim());
          if (!kept.length) return toast('Bản ghi chú đang trống — giữ lại ít nhất một ý');
          review.done = true;
          save.disabled = true;
          save.querySelector('span').textContent = `Đã lưu ${kept.length} ý vào ghi chú của bạn`;
          toast('Đã lưu bản ghi chú — thử hướng 3 để xem có quay lại mở không');
          stats();
        });
        out.appendChild(save);
        stats();
      }

      function reviewItem(it, type) {
        const item = el(`<div class="note note--${type}"></div>`);

        function paint() {
          item.dataset.state = it.state;
          item.innerHTML = '';

          const meta = el('<div class="note__meta"></div>');
          if (it.origin === 'user') meta.appendChild(el(`<span class="badge badge--muted">Từ dấu vết của bạn</span>`));
          if (it.origin === 'user-added') meta.appendChild(el(`<span class="badge badge--muted">Bạn tự thêm</span>`));
          if (it.inferred) meta.appendChild(el(`<span class="badge badge--accent" title="AI tự suy luận, không có câu nào trong bài nói thẳng ý này">${icon('question')}AI suy luận thêm</span>`));
          if (it.state === 'kept') meta.appendChild(el(`<span class="badge badge--success">Đã xác nhận</span>`));
          if (it.state === 'edited') meta.appendChild(el(`<span class="badge">Bạn đã sửa</span>`));
          if (it.state === 'dropped') meta.appendChild(el(`<span class="badge badge--muted">Đã bỏ</span>`));
          if (meta.children.length) item.appendChild(meta);

          item.appendChild(el(`<p class="note__text">${escapeHtml(it.text || '(ý trống — bấm Sửa để nhập)')}</p>`));

          /* Evidence — nối từng ý với đoạn gốc, bấm để tua tới đúng chỗ */
          if (it.sources.length) {
            const ev = el(`<details class="evidence"><summary>Dẫn chứng (${it.sources.length})</summary></details>`);
            it.sources.forEach(src => {
              const b = el(`<button class="evidence__item" type="button" data-t="${src.t}">
                <span class="evidence__ts">${fmtTime(src.t)}</span>
                <span>“${escapeHtml(src.quote)}”</span></button>`);
              ev.appendChild(b);
            });
            item.appendChild(ev);
          }

          const acts = el('<div class="note__actions"></div>');
          if (it.state === 'dropped') {
            acts.appendChild(el(`<button class="btn btn--ghost btn--sm" data-act="undrop">${icon('prev')}<span>Hoàn tác</span></button>`));
          } else {
            acts.appendChild(el(`<button class="btn btn--ghost btn--sm" data-act="keep">${icon('check')}<span>Đúng</span></button>`));
            acts.appendChild(el(`<button class="btn btn--ghost btn--sm" data-act="edit">${icon('note')}<span>Sửa</span></button>`));
            acts.appendChild(el(`<button class="btn btn--ghost btn--sm" data-act="drop">${icon('trash')}<span>Bỏ</span></button>`));
          }
          item.appendChild(acts);
        }

        item.addEventListener('click', e => {
          const ev = e.target.closest('.evidence__item');
          if (ev) { api.seek(Number(ev.dataset.t)); return; }
          const act = e.target.closest('[data-act]')?.dataset.act;
          if (!act) return;
          if (act === 'keep')   { it.state = 'kept'; paint(); }
          if (act === 'drop')   { it.state = 'dropped'; paint(); }
          if (act === 'undrop') { it.state = it.text === it.aiText ? 'pending' : 'edited'; paint(); }
          if (act === 'edit') {
            const p = item.querySelector('.note__text');
            const ta = el('<textarea class="textarea" aria-label="Sửa nội dung ý"></textarea>');
            ta.value = it.text;
            ta.addEventListener('blur', () => {
              it.text = ta.value.trim();
              it.state = it.origin === 'user-added' ? 'added' : (it.text === it.aiText ? 'pending' : 'edited');
              paint(); stats();
            });
            p.replaceWith(ta); ta.focus();
            return;
          }
          stats();
        });

        paint();
        return item;
      }

      /* Số liệu tính lại từ bản nháp hiện tại — tạo lại/khôi phục là về đúng mốc,
         không cộng dồn qua các lần tổng hợp. */
      function stats() {
        const items = allItems();
        const n = st => items.filter(it => it.state === st).length;
        const kept = n('kept'), edited = n('edited'), dropped = n('dropped'), added = n('added');
        const judged = kept + edited + dropped;
        const rate = judged ? Math.round((kept / judged) * 100) : 0;
        footer.innerHTML = '';
        footer.appendChild(el(`<p class="field__hint">Đo: ${api.getMarks().length} dấu vết · chấp nhận <b>${rate}%</b> (giữ ${kept} · sửa ${edited} · bỏ ${dropped}${added ? ` · tự thêm ${added}` : ''})${review.done ? ' · <b>đã lưu</b>' : ''}</p>`));
      }

      renderCapture();
    }
  });

  /* ==========================================================
     HƯỚNG 2 — Mẫu ghi chú thủ công có cấu trúc (KHÔNG AI)
     Tab Ý chính / Chưa hiểu / Việc cần làm, học viên tự gõ.
     Task/outcome: dùng chung JOB — nhánh này nhắm vế "xong bài 3 phút
     là có ghi chú đúng ý mình", đổi lại tốn tập trung lúc nghe giảng.
     Chỉ số riêng đo ở footer.
     ========================================================== */
  window.App.registerBranch({
    id: 'template',
    label: '2 · Template',
    railTitle: 'Mẫu ghi chú có cấu trúc',
    task: JOB.task,
    outcome: JOB.outcome,
    mount(root, api, footer) {
      const entries = { key: [], unsure: [], todo: [] };
      const metrics = { pausesAtStart: 0, firstEntryAt: null, keystrokes: 0 };
      let activeKey = 'key';
      let view = 'edit';

      const wrap = el('<div class="stack" id="tplRoot"></div>');
      root.appendChild(wrap);

      function addEntry(tab, text) {
        const t = api.state.timeSec;
        const slideId = api.currentSlide().id;
        if (metrics.firstEntryAt === null) metrics.firstEntryAt = t;
        entries[tab.key].push({ text, t, slideId });
        api.addMark({ type: tab.type, text, note: tab.label, t, slideId });
        const filled = TEMPLATE_TABS.filter(s => entries[s.key].length).length;
        notify(
          `Đã thêm vào ${tab.label}`,
          filled >= 3
            ? 'Đủ 3 mục rồi. Bấm «Xem tổng hợp bản ghi chú» ở cuối panel.'
            : 'Có thể đổi tab sang mục khác, hoặc gõ tiếp rồi Enter. Khi xong bấm Xem tổng hợp.',
          { variant: 'success', ms: 5500 }
        );
      }

      function loadSamples(opts = {}) {
        const pack = api.fixture.samplePack || [];
        const existingIds = new Set(api.getMarks().map(m => m.id));
        let n = 0;
        pack.forEach(item => {
          const tab = TEMPLATE_TABS.find(t => t.type === item.type);
          if (!tab) return;
          if (entries[tab.key].some(e => e.text === item.text)) return;
          if (metrics.firstEntryAt === null) metrics.firstEntryAt = item.t;
          entries[tab.key].push({ text: item.text, t: item.t, slideId: item.slideId });
          if (!existingIds.has(item.id)) {
            api.addMark({ ...item, note: tab.label });
            existingIds.add(item.id);
          }
          n++;
        });
        if (!opts.silent) {
          notify(
            n ? `Đã nạp ${n} ghi chú mẫu` : 'Dữ liệu mẫu đã có',
            'Mỗi tab đã có sẵn 1 dòng. Gõ thêm hoặc bấm Xem tổng hợp.',
            { variant: 'success' }
          );
        }
        render();
      }

      function render() {
        wrap.innerHTML = '';
        view === 'summary' ? renderSummary() : renderEditor();
        stats();
      }

      function renderEditor() {
        const active = TEMPLATE_TABS.find(t => t.key === activeKey) || TEMPLATE_TABS[0];
        const panel = el(`
          <div class="stack">
            <div id="guideSlot"></div>
            <div class="seg-bar" role="tablist" aria-label="Mục ghi chú"></div>
            <div class="card card--pad tab-panel" id="tabPanel"></div>
            <button class="btn btn--block" type="button" id="toSummary">${icon('list')}<span>📋 Xem tổng hợp bản ghi chú</span></button>
          </div>`);
        wrap.appendChild(panel);
        panel.querySelector('#guideSlot').appendChild(guideBanner(
          '📝',
          '**Hướng dẫn:** Nhập ý chính hoặc câu hỏi vào ô bên dưới. Bấm **+ Thêm** hoặc **Enter**. Khi hoàn thành, bấm \'Xem tổng hợp\'.'
        ));

        const bar = panel.querySelector('[role="tablist"]');
        TEMPLATE_TABS.forEach(tab => {
          const b = el(`<button class="seg" type="button" role="tab" data-tab="${tab.key}" aria-selected="${tab.key === activeKey}">${tab.tab} <span class="badge ${tab.badge}">${entries[tab.key].length}</span></button>`);
          b.addEventListener('click', () => {
            if (tab.key === activeKey) return;
            activeKey = tab.key;
            notify(`Đang ở mục ${tab.label}`, 'Gõ vào ô (thử chữ M để hiện gợi ý từ slide), rồi Enter hoặc + Thêm.');
            render();
          });
          bar.appendChild(b);
        });

        const host = panel.querySelector('#tabPanel');
        host.appendChild(el(`
          <div class="row row--between">
            <label class="field__label" for="in-${active.key}">${active.label}</label>
            <span class="badge ${active.badge}" id="c-${active.key}">${entries[active.key].length}</span>
          </div>`));
        const input = el(`<input class="input input--lg" id="in-${active.key}" placeholder="Gõ chữ cái đầu, ví dụ M → gợi ý câu trên slide…" autocomplete="off">`);
        const addBtn = el(`<button class="btn btn--${active.type} btn--block" type="button">${icon('plus')}<span>+ Thêm vào Note</span></button>`);
        const list = el(`<div class="stack" id="l-${active.key}"></div>`);
        const wrapped = suggestField(input, () => slidePhrases(api));

        function commit() {
          metrics.keystrokes++;
          const val = input.value.trim();
          if (!val) return;
          addEntry(active, val);
          input.value = '';
          render();
        }
        input.addEventListener('keydown', e => {
          metrics.keystrokes++;
          if (e.key !== 'Enter') return;
          e.preventDefault();
          commit();
        });
        addBtn.addEventListener('click', commit);

        host.append(wrapped, addBtn, list);
        if (!entries[active.key].length) {
          list.appendChild(emptyState(`Chưa có ${active.label.toLowerCase()}`, 'Gõ vào ô trên hoặc nạp dữ liệu mẫu.'));
        } else {
          entries[active.key].forEach(en => {
            list.appendChild(noteCard({
              type: active.type,
              text: en.text,
              t: en.t,
              slideId: en.slideId
            }, { onSeek: mk => api.seek(mk.t) }));
          });
        }

        panel.querySelector('#toSummary').addEventListener('click', () => {
          view = 'summary';
          notify('Tổng hợp ghi chú', 'Đây là bảng 3 mục bạn đã nhập. Bấm Quay lại nếu muốn thêm.');
          render();
        });
      }

      function renderSummary() {
        const panel = el(`
          <div class="stack">
            <div class="row row--between">
              <strong style="font-size:var(--text-sm)">Tổng hợp bản ghi chú</strong>
              <button class="btn btn--ghost btn--sm" type="button" id="backEdit">← Quay lại</button>
            </div>
            <div class="stack" id="sumBody"></div>
          </div>`);
        wrap.appendChild(panel);
        panel.querySelector('#backEdit').addEventListener('click', () => {
          view = 'edit';
          notify('Quay lại viết note', 'Chọn tab, gõ hoặc chọn gợi ý, rồi + Thêm.');
          render();
        });
        const body = panel.querySelector('#sumBody');
        const icons = { key: '📌', unsure: '❓', todo: '🎯' };
        TEMPLATE_TABS.forEach(tab => {
          const items = entries[tab.key];
          const box = el(`
            <section class="summary-section summary-section--${tab.type}">
              <div class="summary-section__head">
                <span class="summary-section__icon" aria-hidden="true">${icons[tab.key]}</span>
                <h3 class="summary-section__title">${tab.label}</h3>
                <span class="badge ${tab.badge}">${items.length}</span>
              </div>
              <div class="stack" data-items></div>
            </section>`);
          const host = box.querySelector('[data-items]');
          if (!items.length) {
            host.appendChild(emptyState(`Chưa có ${tab.label.toLowerCase()}`, 'Quay lại để thêm mục này.'));
          } else {
            items.forEach(en => host.appendChild(noteCard({
              type: tab.type, text: en.text, t: en.t, slideId: en.slideId
            }, { onSeek: mk => api.seek(mk.t) })));
          }
          body.appendChild(box);
        });
      }

      api.on('play:change', ({ playing }) => { if (!playing) { metrics.pausesAtStart++; stats(); } });

      function stats() {
        const filled = TEMPLATE_TABS.filter(s => entries[s.key].length).length;
        footer.innerHTML = '';
        footer.appendChild(el(`<p class="field__hint">Đo: <b>${filled}/3</b> mục đã điền · ${Object.values(entries).flat().length} dòng · ${metrics.pausesAtStart} lần dừng bài · ${metrics.keystrokes} phím gõ</p>`));
      }

      loadSamples({ silent: true });
      notify('Bắt đầu Template', 'Mỗi mục đã có 1 dòng mẫu. Gõ vào ô text Ý chính để hiện gợi ý từ slide — rồi Enter hoặc + Thêm. Xong bấm Xem tổng hợp.');
    }
  });

  /* ==========================================================
     HƯỚNG 3 — Nhắc ôn tập theo lịch
     Không tập trung vào khâu TẠO ghi chú, mà vào khâu QUAY LẠI.
     Có công tắc: lịch cố định (không AI) ↔ AI chọn thời điểm.
     Kiểm chứng: rào cản thật là chất lượng ghi chú (Pain A)
     hay là động lực quay lại ôn (Pain B)?
     Task/outcome: dùng chung JOB — nhánh này nhắm vế "lúc cần ôn,
     mở ra dùng được ngay trong 3 phút". Chỉ số riêng đo ở footer.
     ========================================================== */
  window.App.registerBranch({
    id: 'reminder',
    label: '3 · Nhắc ôn',
    railTitle: 'Nhắc ôn tập theo lịch',
    task: JOB.task,
    outcome: JOB.outcome,
    mount(root, api, footer) {
      const FREQUENCIES = {
        intensive: [1, 2, 5],
        standard: [1, 3, 7],
        light: [2, 7, 14]
      };
      const prefs = {
        notifications: true,
        frequency: 'standard',
        customDays: FREQUENCIES.standard.slice(),
        studyTime: '21:00',
        selfLevel: 'unknown'
      };
      const metrics = {
        reminders: 0, opened: 0, deferred: 0,
        remembered: 0, answered: 0, sessions: []
      };
      const history = [];
      let mode = 'fixed';
      let aiInsight = null;
      let historySeq = 0;
      let activeSession = null;
      let slots = makeSlots(mode);

      const panel = el(`
        <div class="stack">
          <div class="card card--pad stack">
            <div class="row row--between">
              <span class="field__label">Cách chọn thời điểm nhắc</span>
              <span class="badge badge--muted" id="planState">0/3 đã mở</span>
            </div>
            <div class="row" role="tablist" aria-label="Chế độ nhắc">
              <button class="seg" type="button" data-mode="fixed" aria-selected="true">Lịch cố định</button>
              <button class="seg" type="button" data-mode="ai" aria-selected="false">AI chọn thời điểm</button>
            </div>
            <p class="field__hint" id="modeHint">Ba mốc 1 / 3 / 7 ngày, giống nhau cho mọi học viên.</p>
            <label class="row row--between" style="min-height:44px">
              <span><span class="field__label">Notification chủ động</span><br><span class="field__hint">Hệ thống tự gửi khi đến mốc</span></span>
              <input id="notifications" type="checkbox" checked aria-label="Bật notification" style="width:22px;height:22px;accent-color:var(--color-primary)">
            </label>
            <div class="field">
              <label class="field__label" for="frequency">Tần suất nhắc</label>
              <select class="input" id="frequency">
                <option value="intensive">Dày · 1, 2, 5 ngày</option>
                <option value="standard" selected>Chuẩn · 1, 3, 7 ngày</option>
                <option value="light">Thưa · 2, 7, 14 ngày</option>
              </select>
            </div>
            <div class="field">
              <label class="field__label" for="customDays">Tùy chỉnh 3 mốc (ngày)</label>
              <input class="input" id="customDays" value="1, 3, 7" inputmode="numeric" aria-describedby="daysHint">
              <span class="field__hint" id="daysHint">Nhập ba số cách nhau bằng dấu phẩy.</span>
            </div>
            <div class="row" style="align-items:flex-end">
              <div class="field" style="flex:1;min-width:120px">
                <label class="field__label" for="studyTime">Giờ thường học</label>
                <select class="input" id="studyTime">
                  <option value="07:30">07:30 · Buổi sáng</option>
                  <option value="12:30">12:30 · Buổi trưa</option>
                  <option value="21:00" selected>21:00 · Buổi tối</option>
                </select>
              </div>
              <div class="field" style="flex:1;min-width:120px">
                <label class="field__label" for="selfLevel">Tự đánh giá</label>
                <select class="input" id="selfLevel">
                  <option value="unknown">Chưa rõ</option>
                  <option value="hard">Khó nhớ</option>
                  <option value="medium">Tạm nhớ</option>
                  <option value="easy">Nhớ tốt</option>
                </select>
              </div>
            </div>
            <button class="btn btn--secondary btn--block" type="button" id="applySchedule">Áp dụng & tính lại lịch</button>
          </div>
          <div id="insight"></div>
          <div id="notification"></div>
          <div class="row row--between">
            <strong style="font-size:var(--text-sm)">Lịch nhắc sắp tới</strong>
            <span class="field__hint">Mục tiêu: mở ≥ 2/3 mốc</span>
          </div>
          <div class="stack" id="slots"></div>
          <button class="btn btn--secondary btn--block" type="button" id="advance">${icon('next')}<span>Gửi notification thử</span></button>
          <div id="session"></div>
          <div class="row row--between"><strong style="font-size:var(--text-sm)">Lịch sử ôn tập</strong><span class="badge badge--muted" id="historyCount">0</span></div>
          <div class="stack" id="history"></div>
        </div>`);
      root.appendChild(panel);
      const slotHost = panel.querySelector('#slots');
      const session = panel.querySelector('#session');
      const modeHint = panel.querySelector('#modeHint');
      const planState = panel.querySelector('#planState');
      const advance = panel.querySelector('#advance');
      const notificationHost = panel.querySelector('#notification');
      const insightHost = panel.querySelector('#insight');
      const historyHost = panel.querySelector('#history');
      const historyCount = panel.querySelector('#historyCount');
      const notificationsInput = panel.querySelector('#notifications');
      const frequencyInput = panel.querySelector('#frequency');
      const customDaysInput = panel.querySelector('#customDays');
      const studyTimeInput = panel.querySelector('#studyTime');
      const selfLevelInput = panel.querySelector('#selfLevel');

      panel.addEventListener('click', e => {
        const b = e.target.closest('[data-mode]');
        if (!b) return;
        mode = b.dataset.mode;
        panel.querySelectorAll('[data-mode]').forEach(s => s.setAttribute('aria-selected', String(s === b)));
        modeHint.textContent = mode === 'ai'
          ? 'AI phân tích lịch sử ôn, độ khó và giờ học để đề xuất từng mốc.'
          : `Lịch theo ba mốc bạn chọn: ${prefs.customDays.join(' / ')} ngày.`;
        slots = makeSlots(mode);
        activeSession = null;
        session.innerHTML = '';
        notificationHost.innerHTML = '';
        renderAll();
      });

      advance.addEventListener('click', () => {
        notifyNext('demo');
      });

      notificationsInput.addEventListener('change', () => {
        prefs.notifications = notificationsInput.checked;
        addHistory(prefs.notifications ? 'settings' : 'disabled', null,
          prefs.notifications ? 'Đã bật notification chủ động' : 'Đã tắt notification');
        if (!prefs.notifications) notificationHost.innerHTML = '';
        renderAll();
      });

      frequencyInput.addEventListener('change', () => {
        prefs.frequency = frequencyInput.value;
        prefs.customDays = FREQUENCIES[prefs.frequency].slice();
        customDaysInput.value = prefs.customDays.join(', ');
      });

      panel.querySelector('#applySchedule').addEventListener('click', () => {
        const parsed = [...new Set(customDaysInput.value.split(',').map(v => Number(v.trim())).filter(v => Number.isInteger(v) && v > 0 && v <= 30))].sort((a, b) => a - b);
        if (parsed.length !== 3) return toast('Hãy nhập đúng 3 mốc từ 1 đến 30 ngày');
        prefs.customDays = parsed;
        prefs.studyTime = studyTimeInput.value;
        prefs.selfLevel = selfLevelInput.value;
        slots = makeSlots(mode);
        activeSession = null;
        session.innerHTML = '';
        notificationHost.innerHTML = '';
        addHistory('settings', null, mode === 'ai' ? 'AI đã tính lại lịch từ tín hiệu mới' : `Đã đổi lịch thành ${parsed.join(' / ')} ngày`);
        modeHint.textContent = mode === 'ai'
          ? 'AI vừa tính lại lịch từ lịch sử ôn, độ khó và thói quen học.'
          : `Lịch theo ba mốc bạn chọn: ${parsed.join(' / ')} ngày.`;
        renderAll();
        toast('Đã cập nhật lịch nhắc');
      });

      function makeSlots(scheduleMode) {
        const proposal = scheduleMode === 'ai' ? buildAIProposal() : {
          days: prefs.customDays,
          confidence: null,
          difficulty: difficultyScore(),
          evidence: 'Lịch cố định do học viên kiểm soát.'
        };
        if (scheduleMode === 'ai') aiInsight = proposal;
        return proposal.days.map((day, index) => ({
          id: `${scheduleMode}-${day}-${index}`,
          day,
          time: prefs.studyTime,
          label: day === 1 ? 'Ngày mai' : `Sau ${day} ngày`,
          hint: scheduleMode === 'ai' ? proposal.reasons[index] : fixedReason(day, index),
          confidence: proposal.confidence,
          state: 'pending'
        }));
      }

      function buildAIProposal() {
        const marks = api.getMarks();
        const recall = recallRate();
        const difficulty = difficultyScore();
        const enoughHistory = metrics.sessions.length > 0;
        let days;
        if (prefs.selfLevel === 'hard' || (enoughHistory && recall < 60) || difficulty >= 70) days = [1, 2, 5];
        else if (prefs.selfLevel === 'easy' || (enoughHistory && recall >= 80)) days = [1, 4, 9];
        else days = prefs.customDays.slice();
        const confidence = Math.min(94, 58 + Math.min(16, marks.length * 2) + Math.min(18, metrics.sessions.length * 6) + (prefs.selfLevel !== 'unknown' ? 5 : 0));
        const habit = prefs.studyTime === '21:00' ? 'khung giờ bạn thường học buổi tối' : `thói quen học lúc ${prefs.studyTime}`;
        return {
          days,
          confidence,
          difficulty,
          evidence: `${metrics.sessions.length} lượt ôn · ${marks.length} dấu vết · ${questionCount()} câu chưa hiểu · nhớ ${recall}%`,
          reasons: [
            `Nhắc sớm vì bài có ${questionCount()} câu chưa hiểu; gửi theo ${habit}.`,
            enoughHistory ? `Điều chỉnh theo tỷ lệ nhớ ${recall}% và ${metrics.deferred} lần để sau.` : 'Mốc củng cố ban đầu theo đường cong quên; sẽ đổi sau lượt ôn đầu.',
            difficulty >= 70 ? 'Bài đang được đánh giá khó; giữ mốc ôn gần hơn.' : 'Giãn mốc để kiểm tra khả năng ghi nhớ dài hạn.'
          ]
        };
      }

      function fixedReason(day, index) {
        if (index === 0) return `Đã đến mốc ${day} ngày — nhắc lại trước khi kiến thức giảm nhanh.`;
        if (index === 1) return `Mốc ${day} ngày — thời điểm củng cố lần hai theo lịch đã chọn.`;
        return `Mốc ${day} ngày — kiểm tra khả năng ghi nhớ dài hạn.`;
      }

      function questionCount() {
        return api.getMarks().filter(m => m.type === 'question').length;
      }

      function recallRate() {
        return metrics.answered ? Math.round((metrics.remembered / metrics.answered) * 100) : 0;
      }

      function difficultyScore() {
        const marks = api.getMarks();
        const questionRatio = marks.length ? questionCount() / marks.length : 0;
        const recallPenalty = metrics.answered ? 100 - recallRate() : 25;
        const selfAdjust = { unknown: 0, easy: -18, medium: 0, hard: 22 }[prefs.selfLevel];
        return Math.max(15, Math.min(95, Math.round(42 + questionRatio * 36 + recallPenalty * .28 + selfAdjust)));
      }

      function notifyNext(source) {
        if (!prefs.notifications) return toast('Notification đang tắt — hãy bật lại trong cài đặt');
        if (slots.some(s => s.state === 'notified')) return toast('Hãy xử lý notification đang chờ trước');
        const next = slots.find(s => s.state === 'pending');
        if (!next) return toast('Bạn đã đi hết các mốc trong lịch này');
        next.state = 'notified';
        metrics.reminders++;
        addHistory('notified', next, source === 'auto' ? 'Hệ thống tự động gửi khi đến mốc' : 'Notification thử từ prototype');
        renderNotification(next);
        drawSlots(); stats();
        toast(`Đã đến mốc ${next.day} ngày — mở lại bài ${api.fixture.lesson.title}`);
      }

      function renderNotification(slot) {
        notificationHost.innerHTML = '';
        const confidence = mode === 'ai' ? `<span class="badge badge--success">Độ tối ưu ${slot.confidence}%</span>` : '<span class="badge badge--muted">Lịch do bạn chọn</span>';
        const notice = el(`
          <div class="card card--pad stack" role="alert" style="border-color:var(--color-accent)">
            <div class="row row--between"><span class="badge badge--accent">Notification chủ động</span>${confidence}</div>
            <strong style="font-size:var(--text-sm)">Đã đến mốc ${slot.day} ngày — thời điểm tốt để ôn lại</strong>
            <p class="field__hint">${escapeHtml(slot.hint)}</p>
            <p class="field__hint"><b>Cơ chế:</b> lịch dựa trên Forgetting Curve. Đây là ước tính hỗ trợ ghi nhớ, không bảo đảm bạn sẽ nhớ chính xác.</p>
            <div class="row" data-notice-actions></div>
          </div>`);
        const open = el(`<button class="btn btn--sm" type="button">${icon('play')}<span>Mở ghi chú cũ</span></button>`);
        const later = el('<button class="btn btn--ghost btn--sm" type="button">Để sau</button>');
        open.addEventListener('click', () => openReminder(slot));
        later.addEventListener('click', () => deferReminder(slot));
        notice.querySelector('[data-notice-actions]').append(open, later);
        notificationHost.appendChild(notice);
      }

      function renderInsight() {
        const insight = mode === 'ai' ? (aiInsight || buildAIProposal()) : {
          confidence: null,
          difficulty: difficultyScore(),
          evidence: 'Lịch cố định do học viên chọn; thuật toán không tự thay đổi mốc.'
        };
        const confidence = insight.confidence === null ? 'Không dùng AI' : `Độ tối ưu ${insight.confidence}%`;
        const points = slots.map((s, i) => {
          const x = 36 + i * 94;
          const y = 88 - i * 8;
          return `<line x1="${x}" y1="20" x2="${x}" y2="96" stroke="var(--color-border)" stroke-dasharray="3 4"/><circle cx="${x}" cy="${y}" r="6" fill="var(--color-primary)"/><text x="${x}" y="114" text-anchor="middle" font-size="10" fill="var(--color-muted-fg)">D+${s.day}</text>`;
        }).join('');
        insightHost.innerHTML = '';
        insightHost.appendChild(el(`
          <div class="card card--pad stack">
            <div class="row row--between"><strong style="font-size:var(--text-sm)">Forgetting Curve cá nhân</strong><span class="badge ${mode === 'ai' ? 'badge--success' : 'badge--muted'}">${confidence}</span></div>
            <svg viewBox="0 0 260 122" role="img" aria-label="Đường cong giảm nhớ và các mốc ôn tập" style="width:100%;height:122px">
              <path d="M10 22 C56 38 66 92 112 96 C150 98 176 101 250 105" fill="none" stroke="var(--color-accent)" stroke-width="3" stroke-linecap="round"/>
              <path d="M10 22 C48 35 62 63 78 80 C90 57 96 38 112 30 C144 48 154 70 172 82 C184 57 194 37 206 29 C225 42 236 61 250 77" fill="none" stroke="var(--color-success)" stroke-width="3" stroke-linecap="round"/>
              ${points}
            </svg>
            <p class="field__hint"><b>Evidence:</b> ${escapeHtml(insight.evidence)}</p>
            <p class="field__hint"><b>Uncertainty:</b> Độ khó ước tính ${insight.difficulty}/100; lịch sẽ được tính lại sau mỗi lượt ôn và tự đánh giá.</p>
          </div>`));
      }

      function addHistory(type, slot, detail) {
        history.unshift({
          id: ++historySeq,
          type,
          slotId: slot?.id || null,
          slotLabel: slot ? `D+${slot.day} · ${slot.time}` : 'Cài đặt',
          detail,
          recovered: false
        });
        if (history.length > 10) history.pop();
        renderHistory();
      }

      function renderHistory() {
        historyHost.innerHTML = '';
        historyCount.textContent = history.length;
        if (!history.length) return historyHost.appendChild(emptyState('Chưa có lịch sử', 'Notification và lượt ôn sẽ xuất hiện tại đây.'));
        history.forEach(item => {
          const labels = { notified: 'Đã gửi', deferred: 'Đã bỏ qua', opened: 'Đã mở', completed: 'Đã ôn xong', settings: 'Đã thay đổi', disabled: 'Đã tắt' };
          const row = el(`
            <div class="note note--${item.type === 'deferred' ? 'question' : 'note'}">
              <div class="note__meta"><span class="badge badge--muted">${labels[item.type] || 'Hoạt động'}</span><span class="spacer"></span><span>${escapeHtml(item.slotLabel)}</span></div>
              <p class="note__text">${escapeHtml(item.detail)}</p>
              <div class="note__actions"></div>
            </div>`);
          if (item.type === 'deferred' && !item.recovered) {
            const recover = el('<button class="btn btn--ghost btn--sm" type="button">Mở lại từ lịch sử</button>');
            recover.addEventListener('click', () => recoverFromHistory(item));
            row.querySelector('.note__actions').appendChild(recover);
          } else {
            row.querySelector('.note__actions').remove();
          }
          historyHost.appendChild(row);
        });
      }

      function recoverFromHistory(item) {
        if (activeSession) return toast('Hãy hoàn thành lượt ôn đang mở trước');
        item.recovered = true;
        const slot = slots.find(s => s.id === item.slotId) || { id: item.slotId || `history-${item.id}`, day: '?', time: prefs.studyTime, label: 'Từ lịch sử' };
        if (slot.state) slot.state = 'opened';
        metrics.opened++;
        addHistory('opened', slot, 'Đã khôi phục lời nhắc bị bỏ qua từ lịch sử');
        startSession(slot);
        drawSlots(); stats();
      }

      function renderAll() {
        drawSlots();
        renderInsight();
        renderHistory();
        stats();
      }

      function drawSlots() {
        slotHost.innerHTML = '';
        slots.forEach((s, index) => {
          const badge = { pending: 'badge--muted', notified: 'badge--accent', deferred: 'badge--accent', opened: 'badge--success' }[s.state];
          const label = { pending: 'Sắp tới', notified: 'Đến giờ ôn', deferred: 'Đã để sau', opened: 'Đã mở' }[s.state];
          const card = el(`
            <div class="card card--pad stack">
              <div class="row row--between">
                <div class="row"><span class="badge badge--muted">${index + 1}</span><strong style="font-size:var(--text-sm)">${escapeHtml(s.label)} · ${escapeHtml(s.time)}</strong></div>
                <span class="badge ${badge}">${label}</span>
              </div>
              <p class="field__hint">${escapeHtml(s.hint)}</p>
              <div class="row" data-actions></div>
            </div>`);
          if (s.state === 'notified') {
            const open = el(`<button class="btn btn--sm" type="button">${icon('play')}<span>Mở ôn ngay</span></button>`);
            const skip = el('<button class="btn btn--ghost btn--sm" type="button">Để sau</button>');
            open.addEventListener('click', () => openReminder(s));
            skip.addEventListener('click', () => deferReminder(s));
            card.querySelector('[data-actions]').append(open, skip);
          } else if (s.state === 'deferred') {
            const reopen = el(`<button class="btn btn--secondary btn--sm" type="button">${icon('play')}<span>Mở ôn bây giờ</span></button>`);
            reopen.addEventListener('click', () => openReminder(s));
            card.querySelector('[data-actions]').appendChild(reopen);
          }
          slotHost.appendChild(card);
        });
        const remaining = slots.some(s => s.state === 'pending');
        advance.disabled = !prefs.notifications || !remaining || slots.some(s => s.state === 'notified');
      }

      function deferReminder(slot) {
        slot.state = 'deferred';
        metrics.deferred++;
        notificationHost.innerHTML = '';
        addHistory('deferred', slot, 'Đã để sau; có thể khôi phục từ lịch sử ôn tập');
        drawSlots(); renderInsight(); stats();
        toast('Đã để sau — lời nhắc vẫn nằm trong lịch sử');
      }

      function openReminder(slot) {
        if (activeSession) return toast('Hãy hoàn thành lượt ôn đang mở trước');
        slot.state = 'opened';
        metrics.opened++;
        history.filter(item => item.slotId === slot.id && item.type === 'deferred').forEach(item => { item.recovered = true; });
        notificationHost.innerHTML = '';
        addHistory('opened', slot, 'Đã mở lại bản ghi chú cũ từ notification');
        drawSlots(); renderInsight(); stats();
        startSession(slot);
      }

      /* Lượt ôn tối đa 3 phút, dùng lại đúng dấu vết từ hướng 1 hoặc 2. */
      function startSession(slot) {
        const priority = { question: 0, highlight: 1, note: 2 };
        const marks = api.getMarks().sort((a, b) => {
          if (mode === 'ai' && a.type !== b.type) return (priority[a.type] ?? 3) - (priority[b.type] ?? 3);
          return a.t - b.t;
        });
        session.innerHTML = '';
        if (!marks.length) {
          activeSession = null;
          return session.appendChild(emptyState('Chưa có gì để ôn', 'Tạo ghi chú ở hướng 1 hoặc 2 trước, rồi quay lại đây.'));
        }
        activeSession = { slot, startedAt: Date.now(), index: 0, remembered: 0, answered: 0 };

        function draw() {
          session.innerHTML = '';
          const current = activeSession;
          if (current.index >= marks.length) return finishSession();
          const m = marks[current.index];
          const card = el(`
            <div class="card card--pad stack">
              <div class="row row--between">
                <span class="badge badge--accent">Thẻ ${current.index + 1}/${marks.length}</span>
                <span class="field__hint">Mục tiêu dưới 03:00</span>
              </div>
              <p style="font-size:var(--text-lg);line-height:var(--leading-relaxed)">
                ${escapeHtml(m.type === 'question' && m.note ? m.note : 'Nhớ lại: ' + m.text.split(' ').slice(0, 7).join(' ') + '…')}
              </p>
              <div data-answer hidden><p class="note__text" style="color:var(--color-muted-fg)">${escapeHtml(m.text)}</p></div>
              <div class="row" data-acts></div>
            </div>`);
          const flip = el('<button class="btn btn--block" type="button">Lật thẻ</button>');
          flip.addEventListener('click', () => {
            card.querySelector('[data-answer]').hidden = false;
            flip.remove();
            const yes = el(`<button class="btn btn--sm btn--secondary" type="button">${icon('check')}<span>Nhớ được</span></button>`);
            const no = el('<button class="btn btn--ghost btn--sm" type="button">Chưa nhớ · xem lại</button>');
            yes.addEventListener('click', () => answer(true));
            no.addEventListener('click', () => { api.seek(m.t); answer(false); });
            card.querySelector('[data-acts]').append(yes, no);
          });
          card.appendChild(flip);
          session.appendChild(card);
        }

        function answer(remembered) {
          if (remembered) activeSession.remembered++;
          activeSession.answered++;
          activeSession.index++;
          draw();
        }

        function finishSession() {
          const result = activeSession;
          const durationSec = Math.max(1, Math.round((Date.now() - result.startedAt) / 1000));
          metrics.remembered += result.remembered;
          metrics.answered += result.answered;
          metrics.sessions.push({ slot: result.slot.id, durationSec });
          activeSession = null;
          const withinTarget = durationSec < 180;
          addHistory('completed', result.slot, `Nhớ ${result.remembered}/${result.answered} thẻ trong ${fmtTime(durationSec)}`);
          if (mode === 'ai') recalculatePendingAI();
          const summary = el(`
            <div class="empty card">
              <span class="empty__icon">${icon('check', 'icon--lg')}</span>
              <p class="empty__title">Hoàn thành lượt ôn</p>
              <p class="empty__hint">Nhớ được ${result.remembered}/${result.answered} thẻ trong ${fmtTime(durationSec)}.</p>
              <span class="badge ${withinTarget ? 'badge--success' : 'badge--accent'}">${withinTarget ? 'Đạt mục tiêu dưới 3 phút' : 'Vượt mục tiêu 3 phút'}</span>
              <p class="field__hint">Bạn cảm thấy bài này thế nào?</p>
              <div class="row" data-levels></div>
            </div>`);
          [
            { value: 'hard', label: 'Khó nhớ' },
            { value: 'medium', label: 'Tạm nhớ' },
            { value: 'easy', label: 'Nhớ tốt' }
          ].forEach(option => {
            const button = el(`<button class="btn btn--ghost btn--sm" type="button">${option.label}</button>`);
            button.addEventListener('click', () => {
              prefs.selfLevel = option.value;
              selfLevelInput.value = option.value;
              if (mode === 'ai') recalculatePendingAI();
              renderAll();
              toast('AI đã điều chỉnh các mốc còn lại');
            });
            summary.querySelector('[data-levels]').appendChild(button);
          });
          session.appendChild(summary);
          renderInsight(); drawSlots(); stats();
        }
        draw();
      }

      function recalculatePendingAI() {
        const proposal = buildAIProposal();
        aiInsight = proposal;
        slots = slots.map((slot, index) => {
          if (slot.state !== 'pending') return slot;
          const day = proposal.days[index] ?? proposal.days[proposal.days.length - 1];
          return {
            ...slot,
            id: `ai-${day}-${index}`,
            day,
            time: prefs.studyTime,
            label: day === 1 ? 'Ngày mai' : `Sau ${day} ngày`,
            hint: proposal.reasons[index],
            confidence: proposal.confidence
          };
        });
      }

      function stats() {
        const rate = metrics.reminders ? Math.round((metrics.opened / metrics.reminders) * 100) : 0;
        const recall = recallRate();
        const average = metrics.sessions.length
          ? Math.round(metrics.sessions.reduce((sum, item) => sum + item.durationSec, 0) / metrics.sessions.length)
          : 0;
        const currentOpened = slots.filter(slot => slot.state === 'opened').length;
        planState.textContent = `${currentOpened}/3 đã mở`;
        planState.className = `badge ${currentOpened >= 2 ? 'badge--success' : 'badge--muted'}`;
        footer.innerHTML = '';
        footer.appendChild(el(`<p class="field__hint">Đo: mở lại <b>${metrics.opened}/${metrics.reminders}</b> mốc (${rate}%) · nhớ <b>${recall}%</b> · lượt ôn TB <b>${fmtTime(average)}</b> · để sau ${metrics.deferred} lần</p>`));
      }

      api.on('marks:change', () => {
        if (!panel.isConnected || mode !== 'ai') return;
        recalculatePendingAI();
        renderInsight();
        drawSlots();
      });

      renderAll();
      setTimeout(() => {
        if (panel.isConnected && api.state.activeBranch === 'reminder' && prefs.notifications && metrics.reminders === 0) notifyNext('auto');
      }, 900);
    }
  });
})();
