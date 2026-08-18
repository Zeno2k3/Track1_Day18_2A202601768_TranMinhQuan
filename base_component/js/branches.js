/* ============================================================
   BRANCHES — 3 hướng giải quyết, cùng chạy trên một shell.
   Mỗi nhánh: id, label, task, outcome, mount(container, api, footer).
   ĐÂY LÀ FILE DUY NHẤT MỖI NHÁNH ĐƯỢC SỬA khi tách branch git.

   1 · AI Notes tự động        → có AI
   2 · Mẫu ghi chú thủ công    → không AI
   3 · Nhắc ôn tập theo lịch   → AI tuỳ chọn (bật/tắt ngay trong panel)
   ============================================================ */
(function () {
  const { el, icon, escapeHtml, noteCard, emptyState, skeletonBlock, toast, notify, fmtTime, guideBanner, suggestField, phrasesFromSlide } = window.UI;

  const TEMPLATE_TABS = [
    { key: 'key',    label: 'Ý chính',      type: 'highlight', tab: '1. Ý chính',      badge: 'badge--highlight' },
    { key: 'unsure', label: 'Chưa hiểu',    type: 'question',  tab: '2. Chưa hiểu',    badge: 'badge--question'  },
    { key: 'todo',   label: 'Việc cần làm', type: 'note',      tab: '3. Việc cần làm', badge: 'badge--note'      }
  ];

  function sortedMarks(api, newestFirst) {
    const list = api.getMarks().slice();
    return list.sort((a, b) => {
      const ac = a.createdAt || 0, bc = b.createdAt || 0;
      if (ac !== bc) return newestFirst ? bc - ac : ac - bc;
      return newestFirst ? b.t - a.t : a.t - b.t;
    });
  }

  function visibleMarks(api) {
    const max = api.state.maxSlideIndex || 0;
    return sortedMarks(api, true).filter(m => {
      if ((m.createdAt || 0) > 1000) return true;
      const idx = api.fixture.slides.findIndex(s => s.id === m.slideId);
      return idx === -1 || idx <= max;
    });
  }

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
            <button class="seg seg--locked" type="button" data-phase="review" aria-selected="false" aria-disabled="true">Sau bài học</button>
          </div>
          <p class="progress-hint" id="progressHint"></p>
          <div id="phaseBody"></div>
        </div>`);
      root.appendChild(panel);
      const body = panel.querySelector('#phaseBody');
      const progressHint = panel.querySelector('#progressHint');
      const reviewBtn = panel.querySelector('[data-phase="review"]');
      const review = { kept: 0, edited: 0, dropped: 0, done: false };
      let didToastEnd = false;
      let nudgeHost = null;
      let phase = 'capture';

      function isLessonEnd() {
        return api.state.slideIndex === api.fixture.slides.length - 1
          || api.state.timeSec >= api.fixture.lesson.durationSec;
      }

      function syncUnlock() {
        const unlocked = isLessonEnd();
        reviewBtn.setAttribute('aria-disabled', String(!unlocked));
        reviewBtn.classList.toggle('seg--locked', !unlocked);
        const seen = (api.state.maxSlideIndex || 0) + 1;
        const total = api.fixture.slides.length;
        progressHint.innerHTML = unlocked
          ? `Đã tới slide cuối (${seen}/${total}). Tab <b>Sau bài học</b> đã mở.`
          : `Đang ở slide ${api.state.slideIndex + 1}/${total} · đã xem ${seen}/${total}. Tab Sau bài học mở khi tới slide cuối.`;
      }

      function toastEndOnce() {
        if (didToastEnd) return;
        didToastEnd = true;
        syncUnlock();
        notify('Đã tới slide cuối', 'Bấm nút bên dưới để AI tổng hợp ghi chú thành 3 mục.', {
          variant: 'nudge',
          ms: 10000,
          action: { label: 'Sang tab Sau bài học', onClick: () => setPhase('review') }
        });
      }

      function setPhase(next) {
        if (next === 'review' && !isLessonEnd()) {
          notify('Chưa mở được', 'Hãy học đến slide cuối rồi tab Sau bài học mới mở.', { variant: 'warn', ms: 4500 });
          return;
        }
        phase = next;
        panel.querySelectorAll('[data-phase]').forEach(s =>
          s.setAttribute('aria-selected', String(s.dataset.phase === next)));
        if (next === 'capture') {
          renderCapture();
          notify('Trong lúc học', 'Bôi đen chữ trên slide hoặc transcript, rồi bấm một nút màu: Quan trọng / Chưa hiểu / Ghi chú.');
        } else {
          renderReview(true);
        }
      }

      function drawNudge() {
        if (!nudgeHost || !nudgeHost.isConnected) return;
        nudgeHost.innerHTML = '';
        if (!isLessonEnd()) return;
        const n = el(`
          <div class="nudge-banner">
            <p class="nudge-banner__title">🎉 Bạn đã đến slide cuối! Hãy chuyển sang tab 'Sau bài học' để AI tổng hợp ghi chú.</p>
            <button class="btn btn--sm" type="button" data-go-review>${icon('sparkle')}<span>Sang tab Sau bài học</span></button>
          </div>`);
        n.querySelector('[data-go-review]').addEventListener('click', () => setPhase('review'));
        nudgeHost.appendChild(n);
      }

      panel.addEventListener('click', e => {
        const b = e.target.closest('[data-phase]');
        if (!b) return;
        setPhase(b.dataset.phase);
      });

      api.on('slide:change', () => {
        syncUnlock();
        if (isLessonEnd()) toastEndOnce();
        drawNudge();
        if (phase === 'capture') refreshCaptureList();
      });
      api.on('time:change', ({ t }) => {
        if (t >= api.fixture.lesson.durationSec) {
          syncUnlock();
          toastEndOnce();
          drawNudge();
        }
      });

      let refreshCaptureList = () => {};

      /* --- Giai đoạn 1: bắt dấu vết, 1 thao tác, không rời bài --- */
      function renderCapture() {
        body.innerHTML = '';
        const v = el(`
          <div class="stack">
            <div id="guideSlot"></div>
            <div id="nudgeSlot"></div>
            <div class="btn-row-equal" id="qa"></div>
            <div class="field">
              <label class="field__label" for="quickNote">Ghi chú ngắn (không bắt buộc)</label>
              <input class="input" id="quickNote" placeholder="vd: nhớ theo cặp Lasso / Ridge">
            </div>
            <div class="row row--between">
              <strong style="font-size:var(--text-sm)">Dấu vết đã bắt (mới thêm lên trên)</strong>
              <span class="badge" id="cnt">0</span>
            </div>
            <div class="stack" id="list"></div>
          </div>`);
        body.appendChild(v);
        v.querySelector('#guideSlot').appendChild(guideBanner(
          '💡',
          '**Cách dùng:** Bôi đen đoạn chữ trên slide hoặc transcript ➔ Bấm nút màu tương ứng bên dưới để bắt dấu vết. Ghi chú ngắn là tùy chọn.'
        ));
        nudgeHost = v.querySelector('#nudgeSlot');

        const acts = [
          { type: 'highlight', label: 'Quan trọng', icon: 'highlight', cls: 'btn--highlight' },
          { type: 'question',  label: 'Chưa hiểu',  icon: 'question',  cls: 'btn--question' },
          { type: 'note',      label: 'Ghi chú',    icon: 'note',      cls: 'btn--note' }
        ];
        const qa = v.querySelector('#qa');
        const noteInput = v.querySelector('#quickNote');
        acts.forEach(a => {
          const b = el(`<button class="btn btn--sm ${a.cls}" type="button">${icon(a.icon)}<span>${a.label}</span></button>`);
          b.addEventListener('click', () => {
            const sel = api.getSelectionText();
            if (!sel) {
              notify('Chưa bôi đen chữ', 'Kéo chuột chọn một câu trên slide hoặc transcript, rồi bấm lại nút này.', { variant: 'warn', ms: 5000 });
              return;
            }
            api.addMark({ type: a.type, text: sel, note: noteInput.value.trim() });
            noteInput.value = '';
            window.getSelection().removeAllRanges();
            notify('Đã lưu dấu vết', 'Tiếp: bôi đen câu khác, hoặc sang slide. Tab Sau bài học sẽ mở khi tới slide cuối.', { variant: 'success', ms: 5000 });
          });
          qa.appendChild(b);
        });

        const list = v.querySelector('#list'), cnt = v.querySelector('#cnt');
        function draw() {
          const marks = visibleMarks(api);
          cnt.textContent = marks.length;
          list.innerHTML = '';
          if (!marks.length) return list.appendChild(
            emptyState('Chưa có dấu vết trên các slide đã xem', 'Bôi đen một câu trên slide rồi bấm "Quan trọng", hoặc sang slide sau để thấy dấu vết có sẵn.'));
          marks.forEach(m => list.appendChild(noteCard(m, {
            onSeek: mk => api.seek(mk.t),
            actions: [{ label: 'Xoá', icon: 'trash', onClick: mk => api.removeMark(mk.id) }]
          })));
        }
        refreshCaptureList = () => { if (body.contains(list)) draw(); };
        api.on('marks:change', () => refreshCaptureList());
        draw();
        drawNudge();
        stats();
      }

      function fillStructuredSummary(out) {
        out.innerHTML = '';
        const g = api.fixture.goldenSummary;
        const marks = api.getMarks();
        const questions = marks
          .filter(m => m.type === 'question')
          .map(m => m.note || m.text)
          .concat(g.openQuestions);
        const groups = [
          { title: 'Ý chính cốt lõi',              icon: '📌', type: 'highlight', items: g.keyPoints },
          { title: 'Điểm chưa hiểu cần làm rõ',    icon: '❓', type: 'question',  items: questions },
          { title: 'Hành động / Bài tập cần làm', icon: '🎯', type: 'note',      items: g.actionItems }
        ];
        groups.forEach(sec => {
          const items = [...new Set(sec.items.filter(Boolean))];
          const box = el(`
            <section class="summary-section summary-section--${sec.type}">
              <div class="summary-section__head">
                <span class="summary-section__icon" aria-hidden="true">${sec.icon}</span>
                <h3 class="summary-section__title">${sec.title}</h3>
                <span class="badge badge--${sec.type}">${items.length}</span>
              </div>
              <div class="stack" data-items></div>
            </section>`);
          const host = box.querySelector('[data-items]');
          if (!items.length) {
            host.appendChild(emptyState('Chưa có mục nào', 'Bắt thêm dấu vết rồi tổng hợp lại.'));
          } else {
            items.forEach(text => host.appendChild(reviewItem(text, sec.type)));
          }
          out.appendChild(box);
        });
        const save = el(`<button class="btn btn--accent btn--block" type="button">${icon('check')}<span>Xác nhận & lưu bản ghi chú</span></button>`);
        save.addEventListener('click', () => {
          review.done = true;
          notify('Đã lưu bản ghi chú', 'Thử tab 3 · Nhắc ôn ở góc phải trên để xem bạn có quay lại mở ghi chú không.', { variant: 'success', ms: 7000 });
          stats();
        });
        out.appendChild(save);
        stats();
      }

      /* --- Giai đoạn 2: AI tổng hợp, học viên duyệt từng ý --- */
      function renderReview(autoRun) {
        nudgeHost = null;
        body.innerHTML = '';
        const v = el(`
          <div class="stack">
            <p class="field__hint">AI dựng bản ghi chú theo 3 mục: ý chính, chưa hiểu, việc cần làm. Duyệt từng ý: đúng / sửa / bỏ.</p>
            <button class="btn btn--block" type="button" id="gen">${icon('sparkle')}<span>Tổng hợp bản ghi chú</span></button>
            <div class="stack" id="out"></div>
          </div>`);
        body.appendChild(v);
        const out = v.querySelector('#out');

        function run() {
          out.innerHTML = '';
          out.appendChild(skeletonBlock(6));
          notify('Đang tổng hợp…', 'AI đang nhóm thành Ý chính, Chưa hiểu, Việc cần làm.');
          setTimeout(() => {
            fillStructuredSummary(out);
            notify('Đã có bản ghi chú', 'Duyệt từng ý: Đúng / Sửa / Bỏ. Xong thì bấm Xác nhận & lưu.', { variant: 'success' });
          }, 700);
        }
        v.querySelector('#gen').addEventListener('click', run);
        if (autoRun) run();
        else out.appendChild(emptyState('Chưa tổng hợp', 'Bấm nút trên sau khi buổi học kết thúc.'));
        stats();
      }

      function reviewItem(text, type) {
        const item = el(`
          <div class="note note--${type || 'note'}">
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
          if (act === 'keep') { review.kept++; item.style.outline = '2px solid var(--color-success)'; }
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
      syncUnlock();
      notify('Bắt đầu AI Notes', 'Bôi đen chữ trên slide, rồi bấm một nút màu bên phải.');
      if (isLessonEnd()) toastEndOnce();
    }
  });

  /* ==========================================================
     HƯỚNG 2 — Mẫu ghi chú thủ công có cấu trúc (KHÔNG AI)
     Tab Ý chính / Chưa hiểu / Việc cần làm, học viên tự gõ.
     ========================================================== */
  window.App.registerBranch({
    id: 'template',
    label: '2 · Template',
    railTitle: 'Mẫu ghi chú có cấu trúc',
    task: 'Tự điền ghi chú vào khung Ý chính / Chưa hiểu / Việc cần làm ngay trong lúc nghe giảng',
    outcome: 'Điền được cả 3 mục trước khi bài học kết thúc, không phải dừng hay tua lại',
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
          <div id="guideSlot"></div>
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
      panel.querySelector('#guideSlot').appendChild(guideBanner(
        '🔔',
        '**Cách dùng:** Hệ thống dựa trên các điểm \'Chưa hiểu\' bạn đã lưu ở Nhánh 1 & 2 để đặt lịch nhắc ôn tập theo thời điểm vàng ghi nhớ.'
      ));

      const slotHost = panel.querySelector('#slots');
      const session = panel.querySelector('#session');
      const modeHint = panel.querySelector('#modeHint');

      panel.addEventListener('click', e => {
        const b = e.target.closest('[data-mode]');
        if (!b) return;
        const nextAI = b.dataset.mode === 'ai';
        if (nextAI === useAI) return;
        useAI = nextAI;
        panel.querySelectorAll('[data-mode]').forEach(s => s.setAttribute('aria-selected', String(s === b)));
        modeHint.textContent = useAI
          ? 'AI giãn/rút mốc theo số câu chưa hiểu còn tồn và lịch học thực tế của bạn.'
          : 'Mốc cố định 1 / 3 / 7 ngày, giống nhau cho mọi học viên.';
        slots = (useAI ? AI_SCHEDULE : FIXED).map(s => ({ ...s, state: 'pending' }));
        session.innerHTML = '';
        notify(
          useAI ? 'Đã bật AI chọn mốc' : 'Đã chọn lịch cố định',
          useAI
            ? 'Mốc sẽ giãn/rút theo câu chưa hiểu. Bấm Tua tới mốc nhắc tiếp theo.'
            : 'Nhắc vào D+1, D+3, D+7. Bấm Tua tới mốc nhắc tiếp theo.'
        );
        drawSlots(); stats();
      });

      panel.querySelector('#advance').addEventListener('click', () => {
        const next = slots.find(s => s.state === 'pending');
        if (!next) {
          notify('Hết mốc nhắc', 'Bạn đã đi hết chuỗi ôn trong chế độ này.', { variant: 'warn' });
          return;
        }
        next.state = 'notified';
        drawSlots();
        notify(`Nhắc ${next.label}`, 'Đến giờ ôn lại buổi học. Bấm Mở ôn ngay trên thẻ vừa hiện.', {
          variant: 'nudge',
          ms: 8000
        });
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
            open.addEventListener('click', () => {
              s.state = 'opened';
              log.push({ slot: s.label, opened: true });
              drawSlots();
              startSession();
              notify('Bắt đầu lượt ôn', 'Bấm Lật thẻ, rồi chọn Nhớ được hoặc Chưa nhớ.');
              stats();
            });
            skip.addEventListener('click', () => {
              s.state = 'skipped';
              log.push({ slot: s.label, opened: false });
              drawSlots();
              stats();
              notify('Đã để sau', 'Bấm Tua tới mốc nhắc nếu muốn sang mốc tiếp.', { variant: 'warn', ms: 4500 });
            });
            card.querySelector('[data-actions]').append(open, skip);
          }
          slotHost.appendChild(card);
        });
      }

      /* Lượt ôn 3 phút: lấy đúng dấu vết đã lưu ở hướng 1 hoặc 2 */
      function startSession() {
        const marks = sortedMarks(api, false);
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
              <span class="badge ${m.type === 'question' ? 'badge--question' : m.type === 'highlight' ? 'badge--highlight' : 'badge--note'}">Thẻ ${i + 1}/${marks.length}</span>
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
      notify('Bắt đầu Nhắc ôn', 'Chọn Lịch cố định hoặc AI, rồi bấm Tua tới mốc nhắc tiếp theo. Hệ thống ôn các điểm Chưa hiểu đã lưu.');
    }
  });
})();
