/* ============================================================
   BRANCHES — 3 hướng giải quyết, cùng chạy trên một shell.
   Mỗi nhánh: id, label, task, outcome, mount(container, api, footer).
   ĐÂY LÀ FILE DUY NHẤT MỖI NHÁNH ĐƯỢC SỬA khi tách branch git.
   Bản này là stub chạy được — đủ để demo luồng, chưa phải sản phẩm.

   1 · AI Notes tự động        → có AI
   2 · Mẫu ghi chú thủ công    → không AI
   3 · Nhắc ôn tập theo lịch   → AI tuỳ chọn (bật/tắt ngay trong panel)
   ============================================================ */
(function () {
  const { el, icon, escapeHtml, noteCard, emptyState, skeletonBlock, toast, fmtTime } = window.UI;

  const SECTIONS = [
    { key: 'key', label: 'Ý chính', type: 'highlight' },
    { key: 'ask', label: 'Câu hỏi', type: 'question' },
    { key: 'unsure', label: 'Chưa hiểu', type: 'question' },
    { key: 'todo', label: 'Việc cần làm', type: 'note' }
  ];

  /* ==========================================================
     HƯỚNG 1 — AI Notes tự động  (giải pháp hiện tại)
     Luồng: bắt dấu vết trong lúc học → AI tổng hợp sau bài
            → học viên sửa & xác nhận.
     Kiểm chứng: học viên có tin bản AI tổng hợp là "đủ đúng"
     để thay ghi chú tự tay hay không.
     ========================================================== */
  window.App.registerBranch({
    id: 'ai-notes',
    label: '1 · AI Notes',
    railTitle: 'AI Notes tự động',
    task: 'Bắt dấu vết trong lúc học, để AI tổng hợp thành bản ghi chú sau bài rồi duyệt lại',
    outcome: 'Bản ghi chú hoàn chỉnh trong ≤ 3 phút sau bài, học viên xác nhận ≥ 80% ý mà không viết lại từ đầu',
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
     Khung cố định Ý chính / Câu hỏi / Chưa hiểu / Việc cần làm,
     học viên tự gõ trong lúc học.
     Kiểm chứng: chỉ cần cái khung là đủ, hay khâu gõ tay vẫn
     làm phân tán sự tập trung?
     ========================================================== */
  window.App.registerBranch({
    id: 'template',
    label: '2 · Template',
    railTitle: 'Mẫu ghi chú có cấu trúc',
    task: 'Tự điền ghi chú vào khung 4 mục có sẵn ngay trong lúc nghe giảng',
    outcome: 'Điền được cả 4 mục trước khi bài học kết thúc, không phải dừng hay tua lại',
    mount(root, api, footer) {
      const entries = { key: [], ask: [], unsure: [], todo: [] };
      const metrics = { pausesAtStart: 0, firstEntryAt: null, keystrokes: 0 };

      const panel = el(`
        <div class="stack">
          <p class="field__hint">Không có AI. Gõ vào đúng mục — mỗi dòng Enter là một ý. Mốc thời gian được tự gắn theo bài giảng.</p>
          <div class="stack" id="sections"></div>
        </div>`);
      root.appendChild(panel);
      const host = panel.querySelector('#sections');

      SECTIONS.forEach(sec => {
        const block = el(`
          <div class="card card--pad stack">
            <div class="row row--between">
              <label class="field__label" for="in-${sec.key}">${sec.label}</label>
              <span class="badge badge--muted" id="c-${sec.key}">0</span>
            </div>
            <input class="input" id="in-${sec.key}" placeholder="Gõ rồi Enter để thêm dòng…">
            <div class="stack" id="l-${sec.key}"></div>
          </div>`);
        const input = block.querySelector('input');
        const list = block.querySelector(`#l-${sec.key}`);
        const count = block.querySelector(`#c-${sec.key}`);

        input.addEventListener('keydown', e => {
          metrics.keystrokes++;
          if (e.key !== 'Enter') return;
          const val = input.value.trim();
          if (!val) return;
          if (metrics.firstEntryAt === null) metrics.firstEntryAt = api.state.timeSec;
          const entry = { text: val, t: api.state.timeSec, slideId: api.currentSlide().id };
          entries[sec.key].push(entry);
          input.value = '';
          drawList();
          // đồng bộ sang marks chung để hướng 3 dùng lại được
          api.addMark({ type: sec.type, text: val, note: sec.label });
          stats();
        });

        function drawList() {
          count.textContent = entries[sec.key].length;
          list.innerHTML = entries[sec.key].map((en, i) => `
            <div class="note note--${sec.type}">
              <div class="note__meta"><span>${fmtTime(en.t)}</span><span class="spacer"></span>
                <span class="badge badge--muted">${escapeHtml(en.slideId)}</span></div>
              <p class="note__text">${escapeHtml(en.text)}</p>
            </div>`).join('');
        }
        drawList();
        host.appendChild(block);
      });

      // Đo cái mà hướng này hay hỏng: học viên phải dừng bài để gõ kịp.
      api.on('play:change', ({ playing }) => { if (!playing) { metrics.pausesAtStart++; stats(); } });

      function stats() {
        const filled = SECTIONS.filter(s => entries[s.key].length).length;
        footer.innerHTML = '';
        footer.appendChild(el(`<p class="field__hint">Đo: <b>${filled}/4</b> mục đã điền · ${Object.values(entries).flat().length} dòng · ${metrics.pausesAtStart} lần dừng bài · ${metrics.keystrokes} phím gõ</p>`));
      }
      stats();
    }
  });

  /* ==========================================================
     HƯỚNG 3 — Nhắc ôn tập theo lịch
     Không tập trung vào khâu TẠO ghi chú, mà vào khâu QUAY LẠI.
     Có công tắc: lịch cố định (không AI) ↔ AI chọn thời điểm.
     Kiểm chứng: rào cản thật là chất lượng ghi chú (Pain A)
     hay là động lực quay lại ôn (Pain B)?
     ========================================================== */
  window.App.registerBranch({
    id: 'reminder',
    label: '3 · Nhắc ôn',
    railTitle: 'Nhắc ôn tập theo lịch',
    task: 'Nhận nhắc đúng lúc và mở lại bản ghi chú đã lưu để ôn',
    outcome: 'Mở lại ghi chú ở ≥ 2/3 mốc nhắc đầu tiên, mỗi lượt ôn dưới 3 phút',
    mount(root, api, footer) {
      let useAI = false;
      const FIXED = [
        { day: 1, label: 'D+1', hint: 'Lịch cố định: 1 ngày' },
        { day: 3, label: 'D+3', hint: 'Lịch cố định: 3 ngày' },
        { day: 7, label: 'D+7', hint: 'Lịch cố định: 1 tuần' }
      ];
      const AI_SCHEDULE = [
        { day: 1, label: 'D+1 · 21:00', hint: 'AI: sau giờ bạn thường học buổi tối' },
        { day: 4, label: 'D+4 · 07:30', hint: 'AI: giãn ra vì 2 câu "chưa hiểu" đã được giải đáp' },
        { day: 9, label: 'D+9 · 20:00', hint: 'AI: sát mốc kiểm tra, ưu tiên 3 thẻ khó nhất' }
      ];
      let slots = FIXED.map(s => ({ ...s, state: 'pending' }));   // pending | notified | opened | skipped
      const log = [];

      const panel = el(`
        <div class="stack">
          <div class="card card--pad stack">
            <div class="row row--between">
              <span class="field__label">Cách chọn thời điểm nhắc</span>
            </div>
            <div class="row" role="tablist" aria-label="Chế độ nhắc">
              <button class="seg" type="button" data-mode="fixed" aria-selected="true">Lịch cố định</button>
              <button class="seg" type="button" data-mode="ai" aria-selected="false">AI chọn thời điểm</button>
            </div>
            <p class="field__hint" id="modeHint">Mốc cố định 1 / 3 / 7 ngày, giống nhau cho mọi học viên.</p>
          </div>
          <div class="stack" id="slots"></div>
          <button class="btn btn--secondary btn--block" type="button" id="advance">Tua tới mốc nhắc tiếp theo</button>
          <div id="session"></div>
        </div>`);
      root.appendChild(panel);
      const slotHost = panel.querySelector('#slots');
      const session = panel.querySelector('#session');
      const modeHint = panel.querySelector('#modeHint');

      panel.addEventListener('click', e => {
        const b = e.target.closest('[data-mode]');
        if (!b) return;
        useAI = b.dataset.mode === 'ai';
        panel.querySelectorAll('[data-mode]').forEach(s => s.setAttribute('aria-selected', String(s === b)));
        modeHint.textContent = useAI
          ? 'AI giãn/rút mốc theo số câu chưa hiểu còn tồn và lịch học thực tế của bạn.'
          : 'Mốc cố định 1 / 3 / 7 ngày, giống nhau cho mọi học viên.';
        slots = (useAI ? AI_SCHEDULE : FIXED).map(s => ({ ...s, state: 'pending' }));
        session.innerHTML = '';
        drawSlots(); stats();
      });

      panel.querySelector('#advance').addEventListener('click', () => {
        const next = slots.find(s => s.state === 'pending');
        if (!next) return toast('Hết mốc nhắc trong chuỗi này');
        next.state = 'notified';
        drawSlots();
        toast(`Nhắc ${next.label}: đến giờ ôn lại buổi ${api.fixture.lesson.index}`);
      });

      function drawSlots() {
        slotHost.innerHTML = '';
        slots.forEach(s => {
          const badge = { pending: 'badge--muted', notified: 'badge--accent', opened: 'badge--success', skipped: 'badge--muted' }[s.state];
          const label = { pending: 'Chờ', notified: 'Đã nhắc', opened: 'Đã mở lại', skipped: 'Bỏ qua' }[s.state];
          const card = el(`
            <div class="card card--pad stack">
              <div class="row row--between">
                <strong style="font-size:var(--text-sm)">${escapeHtml(s.label)}</strong>
                <span class="badge ${badge}">${label}</span>
              </div>
              <p class="field__hint">${escapeHtml(s.hint)}</p>
              <div class="row" data-actions></div>
            </div>`);
          if (s.state === 'notified') {
            const open = el(`<button class="btn btn--sm" type="button">${icon('play')}<span>Mở ôn ngay</span></button>`);
            const skip = el('<button class="btn btn--ghost btn--sm" type="button">Để sau</button>');
            open.addEventListener('click', () => { s.state = 'opened'; log.push({ slot: s.label, opened: true }); drawSlots(); startSession(); stats(); });
            skip.addEventListener('click', () => { s.state = 'skipped'; log.push({ slot: s.label, opened: false }); drawSlots(); stats(); toast('Đã bỏ qua mốc này'); });
            card.querySelector('[data-actions]').append(open, skip);
          }
          slotHost.appendChild(card);
        });
      }

      /* Lượt ôn 3 phút: lấy đúng dấu vết đã lưu ở hướng 1 hoặc 2 */
      function startSession() {
        const marks = api.getMarks();
        session.innerHTML = '';
        if (!marks.length) return session.appendChild(
          emptyState('Chưa có gì để ôn', 'Tạo ghi chú ở hướng 1 hoặc 2 trước, rồi quay lại đây.'));
        let i = 0, right = 0, answered = 0;

        function draw() {
          session.innerHTML = '';
          if (i >= marks.length) {
            session.appendChild(el(`
              <div class="empty">
                <span class="empty__icon">${icon('check', 'icon--lg')}</span>
                <p class="empty__title">Xong lượt ôn</p>
                <p class="empty__hint">Đúng ${right}/${answered} thẻ. Mốc nhắc tiếp theo đã được xếp lịch.</p>
              </div>`));
            stats(); return;
          }
          const m = marks[i];
          const card = el(`
            <div class="card card--pad stack">
              <span class="badge badge--accent">Thẻ ${i + 1}/${marks.length}</span>
              <p style="font-size:var(--text-lg);line-height:var(--leading-relaxed)">
                ${escapeHtml(m.type === 'question' && m.note ? m.note : 'Nhớ lại: ' + m.text.split(' ').slice(0, 7).join(' ') + '…')}
              </p>
              <div id="ans" hidden><p class="note__text" style="color:var(--color-muted-fg)">${escapeHtml(m.text)}</p></div>
              <div class="row" data-acts></div>
            </div>`);
          const flip = el('<button class="btn btn--block" type="button">Lật thẻ</button>');
          flip.addEventListener('click', () => {
            card.querySelector('#ans').hidden = false;
            flip.remove();
            const yes = el(`<button class="btn btn--sm btn--secondary" type="button">${icon('check')}<span>Nhớ được</span></button>`);
            const no = el('<button class="btn btn--ghost btn--sm" type="button">Chưa nhớ</button>');
            yes.addEventListener('click', () => { right++; answered++; i++; draw(); });
            no.addEventListener('click', () => { answered++; i++; api.seek(m.t); draw(); });
            card.querySelector('[data-acts]').append(yes, no);
          });
          card.appendChild(flip);
          session.appendChild(card);
        }
        draw();
      }

      function stats() {
        const notified = log.length;
        const opened = log.filter(l => l.opened).length;
        const rate = notified ? Math.round((opened / notified) * 100) : 0;
        footer.innerHTML = '';
        footer.appendChild(el(`<p class="field__hint">Chế độ: <b>${useAI ? 'AI' : 'cố định'}</b> · mở lại <b>${opened}/${notified}</b> mốc (${rate}%) · ${api.getMarks().length} thẻ trong kho</p>`));
      }

      drawSlots();
      stats();
    }
  });
})();
