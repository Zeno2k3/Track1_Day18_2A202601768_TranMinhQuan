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
    { key: 'key',    label: 'Ý chính',      type: 'highlight' },
    { key: 'ask',    label: 'Câu hỏi',      type: 'question'  },
    { key: 'unsure', label: 'Chưa hiểu',    type: 'question'  },
    { key: 'todo',   label: 'Việc cần làm', type: 'note'      }
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
      const review = { kept: 0, edited: 0, dropped: 0, done: false };

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
            <p class="field__hint">Bôi đen chữ trên slide hoặc transcript rồi bấm một nút. Ghi chú ngắn là tuỳ chọn.</p>
            <div class="row" id="qa"></div>
            <div class="field">
              <label class="field__label" for="quickNote">Ghi chú ngắn (không bắt buộc)</label>
              <input class="input" id="quickNote" placeholder="vd: nhớ theo cặp Lasso / Ridge">
            </div>
            <div class="row row--between">
              <strong style="font-size:var(--text-sm)">Dấu vết đã bắt</strong>
              <span class="badge" id="cnt">0</span>
            </div>
            <div class="stack" id="list"></div>
          </div>`);
        body.appendChild(v);

        const acts = [
          { type: 'highlight', label: 'Quan trọng', icon: 'highlight', cls: '' },
          { type: 'question',  label: 'Chưa hiểu',  icon: 'question',  cls: 'btn--accent' },
          { type: 'note',      label: 'Ghi chú',    icon: 'note',      cls: 'btn--secondary' }
        ];
        const qa = v.querySelector('#qa');
        const noteInput = v.querySelector('#quickNote');
        acts.forEach(a => {
          const b = el(`<button class="btn btn--sm ${a.cls}" type="button">${icon(a.icon)}<span>${a.label}</span></button>`);
          b.addEventListener('click', () => {
            const sel = api.getSelectionText();
            if (!sel) return toast('Hãy bôi đen một đoạn chữ trước');
            api.addMark({ type: a.type, text: sel, note: noteInput.value.trim() });
            noteInput.value = '';
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

      /* --- Giai đoạn 2: AI tổng hợp, học viên duyệt từng ý --- */
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
        out.appendChild(emptyState('Chưa tổng hợp', 'Bấm nút trên sau khi buổi học kết thúc.'));

        v.querySelector('#gen').addEventListener('click', () => {
          out.innerHTML = '';
          out.appendChild(skeletonBlock(6));
          setTimeout(() => {
            out.innerHTML = '';
            const g = api.fixture.goldenSummary;
            const marks = api.getMarks();
            const groups = [
              { title: 'Ý chính', items: g.keyPoints },
              { title: 'Chỗ chưa hiểu', items: marks.filter(m => m.type === 'question').map(m => m.note || m.text).concat(g.openQuestions) },
              { title: 'Việc cần làm', items: g.actionItems }
            ];
            groups.forEach(sec => {
              if (!sec.items.length) return;
              const box = el(`<div class="stack"><strong style="font-size:var(--text-sm)">${sec.title}</strong></div>`);
              [...new Set(sec.items)].forEach(text => box.appendChild(reviewItem(text)));
              out.appendChild(box);
            });
            const save = el(`<button class="btn btn--accent btn--block" type="button">${icon('check')}<span>Xác nhận & lưu bản ghi chú</span></button>`);
            save.addEventListener('click', () => {
              review.done = true;
              toast('Đã lưu bản ghi chú — thử hướng 3 để xem có quay lại mở không');
              stats();
            });
            out.appendChild(save);
            stats();
          }, 900);
        });
        stats();
      }

      function reviewItem(text) {
        const item = el(`
          <div class="note note--note">
            <p class="note__text">${escapeHtml(text)}</p>
            <div class="note__actions">
              <button class="btn btn--ghost btn--sm" data-act="keep">${icon('check')}<span>Đúng</span></button>
              <button class="btn btn--ghost btn--sm" data-act="edit">${icon('note')}<span>Sửa</span></button>
              <button class="btn btn--ghost btn--sm" data-act="drop">${icon('trash')}<span>Bỏ</span></button>
            </div>
          </div>`);
        item.addEventListener('click', e => {
          const act = e.target.closest('[data-act]')?.dataset.act;
          if (!act) return;
          if (act === 'keep') { review.kept++; item.style.borderLeftColor = 'var(--color-success)'; }
          if (act === 'drop') { review.dropped++; item.remove(); }
          if (act === 'edit') {
            review.edited++;
            const p = item.querySelector('.note__text');
            const ta = el('<textarea class="textarea" aria-label="Sửa nội dung ý"></textarea>');
            ta.value = p.textContent;
            ta.addEventListener('blur', () => { p.textContent = ta.value; ta.replaceWith(p); });
            p.replaceWith(ta); ta.focus();
          }
          stats();
        });
        return item;
      }

      function stats() {
        const t = review.kept + review.edited + review.dropped;
        const rate = t ? Math.round((review.kept / t) * 100) : 0;
        footer.innerHTML = '';
        footer.appendChild(el(`<p class="field__hint">Đo: ${api.getMarks().length} dấu vết · chấp nhận <b>${rate}%</b> (giữ ${review.kept} · sửa ${review.edited} · bỏ ${review.dropped})${review.done ? ' · <b>đã lưu</b>' : ''}</p>`));
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
      const SCHEDULES = {
        fixed: [
          { id: 'f1', day: 1, time: '20:00', label: 'Ngày mai', hint: 'Ôn lại sau 1 ngày' },
          { id: 'f2', day: 3, time: '20:00', label: 'Sau 3 ngày', hint: 'Củng cố lần hai' },
          { id: 'f3', day: 7, time: '20:00', label: 'Sau 1 tuần', hint: 'Kiểm tra ghi nhớ dài hạn' }
        ],
        ai: [
          { id: 'a1', day: 1, time: '21:00', label: 'Ngày mai', hint: 'Sau khung giờ bạn thường học buổi tối' },
          { id: 'a2', day: 4, time: '07:30', label: 'Sau 4 ngày', hint: 'Giãn mốc vì các ý chính đã được ghi khá đầy đủ' },
          { id: 'a3', day: 9, time: '20:00', label: 'Sau 9 ngày', hint: 'Ưu tiên ôn lại trước mốc kiểm tra tiếp theo' }
        ]
      };
      const metrics = {
        reminders: 0, opened: 0, deferred: 0,
        remembered: 0, answered: 0, sessions: []
      };
      let mode = 'fixed';
      let slots = makeSlots(mode);
      let activeSession = null;

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
          </div>
          <div class="row row--between">
            <strong style="font-size:var(--text-sm)">Lịch nhắc sắp tới</strong>
            <span class="field__hint">Mục tiêu: mở ≥ 2/3 mốc</span>
          </div>
          <div class="stack" id="slots"></div>
          <button class="btn btn--secondary btn--block" type="button" id="advance">${icon('next')}<span>Mô phỏng mốc nhắc tiếp theo</span></button>
          <div id="session"></div>
        </div>`);
      root.appendChild(panel);
      const slotHost = panel.querySelector('#slots');
      const session = panel.querySelector('#session');
      const modeHint = panel.querySelector('#modeHint');
      const planState = panel.querySelector('#planState');
      const advance = panel.querySelector('#advance');

      panel.addEventListener('click', e => {
        const b = e.target.closest('[data-mode]');
        if (!b) return;
        mode = b.dataset.mode;
        panel.querySelectorAll('[data-mode]').forEach(s => s.setAttribute('aria-selected', String(s === b)));
        modeHint.textContent = mode === 'ai'
          ? `AI ưu tiên ${questionCount()} câu chưa hiểu và chọn giờ phù hợp với thói quen học.`
          : 'Ba mốc 1 / 3 / 7 ngày, giống nhau cho mọi học viên.';
        resetMetrics();
        slots = makeSlots(mode);
        activeSession = null;
        session.innerHTML = '';
        drawSlots(); stats();
      });

      advance.addEventListener('click', () => {
        if (slots.some(s => s.state === 'notified')) return toast('Hãy xử lý lời nhắc đang chờ trước');
        const next = slots.find(s => s.state === 'pending');
        if (!next) return toast('Bạn đã đi hết 3 mốc trong lịch này');
        next.state = 'notified';
        metrics.reminders++;
        drawSlots(); stats();
        toast(`${next.label}, ${next.time}: đến giờ ôn lại buổi ${api.fixture.lesson.index}`);
      });

      function makeSlots(scheduleMode) {
        return SCHEDULES[scheduleMode].map(s => ({ ...s, state: 'pending' }));
      }

      function resetMetrics() {
        metrics.reminders = 0;
        metrics.opened = 0;
        metrics.deferred = 0;
        metrics.remembered = 0;
        metrics.answered = 0;
        metrics.sessions = [];
      }

      function questionCount() {
        return api.getMarks().filter(m => m.type === 'question').length;
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
            skip.addEventListener('click', () => {
              s.state = 'deferred';
              metrics.deferred++;
              drawSlots(); stats();
              toast('Đã để sau — bạn vẫn có thể mở lại mốc này');
            });
            card.querySelector('[data-actions]').append(open, skip);
          } else if (s.state === 'deferred') {
            const reopen = el(`<button class="btn btn--secondary btn--sm" type="button">${icon('play')}<span>Mở ôn bây giờ</span></button>`);
            reopen.addEventListener('click', () => openReminder(s));
            card.querySelector('[data-actions]').appendChild(reopen);
          }
          slotHost.appendChild(card);
        });
        const remaining = slots.some(s => s.state === 'pending');
        advance.disabled = !remaining || slots.some(s => s.state === 'notified');
      }

      function openReminder(slot) {
        if (activeSession) return toast('Hãy hoàn thành lượt ôn đang mở trước');
        slot.state = 'opened';
        metrics.opened++;
        drawSlots(); stats();
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
          session.appendChild(el(`
            <div class="empty card">
              <span class="empty__icon">${icon('check', 'icon--lg')}</span>
              <p class="empty__title">Hoàn thành lượt ôn</p>
              <p class="empty__hint">Nhớ được ${result.remembered}/${result.answered} thẻ trong ${fmtTime(durationSec)}.</p>
              <span class="badge ${withinTarget ? 'badge--success' : 'badge--accent'}">${withinTarget ? 'Đạt mục tiêu dưới 3 phút' : 'Vượt mục tiêu 3 phút'}</span>
            </div>`));
          stats();
        }
        draw();
      }

      function stats() {
        const rate = metrics.reminders ? Math.round((metrics.opened / metrics.reminders) * 100) : 0;
        const recall = metrics.answered ? Math.round((metrics.remembered / metrics.answered) * 100) : 0;
        const average = metrics.sessions.length
          ? Math.round(metrics.sessions.reduce((sum, item) => sum + item.durationSec, 0) / metrics.sessions.length)
          : 0;
        planState.textContent = `${metrics.opened}/3 đã mở`;
        planState.className = `badge ${metrics.opened >= 2 ? 'badge--success' : 'badge--muted'}`;
        footer.innerHTML = '';
        footer.appendChild(el(`<p class="field__hint">Đo: mở lại <b>${metrics.opened}/${metrics.reminders}</b> mốc (${rate}%) · nhớ <b>${recall}%</b> · lượt ôn TB <b>${fmtTime(average)}</b> · để sau ${metrics.deferred} lần</p>`));
      }

      drawSlots();
      stats();
    }
  });
})();
