/* ============================================================
   APP — shell dùng chung: context screen + player + transcript
   + branch registry. Nhánh prototype KHÔNG sửa file này;
   nhánh chỉ gọi App.registerBranch({...}).
   ============================================================ */
(function () {
  const F = window.FIXTURE;
  const { el, icon, fmtTime, escapeHtml } = window.UI;

  /* ---------------- State dùng chung ---------------- */
  const state = {
    slideIndex: 0,
    maxSlideIndex: 0,
    timeSec: 0,
    playing: false,
    marks: F.seedMarks.map((m, i) => ({ ...m, createdAt: i + 1 })),
    activeBranch: null
  };

  const listeners = {};
  function on(evt, fn) { (listeners[evt] || (listeners[evt] = [])).push(fn); }
  function emit(evt, payload) { (listeners[evt] || []).forEach(fn => fn(payload)); }

  /* ---------------- DOM refs ---------------- */
  const dom = {};

  /* ---------------- Slide ---------------- */
  function renderSlide() {
    const s = F.slides[state.slideIndex];
    dom.slide.innerHTML = `
      <p class="slide__eyebrow">${escapeHtml(s.eyebrow)}</p>
      <h2 class="slide__title">${escapeHtml(s.title)}</h2>
      <p class="slide__lead">${escapeHtml(s.lead)}</p>
      <ul class="slide__bullets">
        ${s.bullets.map((b, i) => `<li class="slide__bullet" data-bullet="${i}">${b}</li>`).join('')}
      </ul>
      ${s.figure ? `<pre class="slide__figure">${escapeHtml(s.figure)}</pre>` : ''}
      <div class="slide__footer">
        <span>${escapeHtml(F.lesson.title)}</span>
        <span class="spacer"></span>
        <span>Slide ${state.slideIndex + 1}/${F.slides.length}</span>
      </div>`;
    dom.slide.classList.remove('slide--enter');
    void dom.slide.offsetWidth;
    dom.slide.classList.add('slide--enter');
    dom.slide.scrollTop = 0;
    touchProgress();
    emit('slide:change', { slide: s, index: state.slideIndex, maxSlideIndex: state.maxSlideIndex });
  }

  function touchProgress() {
    state.maxSlideIndex = Math.max(state.maxSlideIndex || 0, state.slideIndex);
  }

  function goToSlide(i) {
    state.slideIndex = Math.max(0, Math.min(F.slides.length - 1, i));
    state.timeSec = F.slides[state.slideIndex].startSec;
    touchProgress();
    renderSlide();
    renderPlayer();
    renderTranscript();
  }

  function seek(sec) {
    state.timeSec = Math.max(0, Math.min(F.lesson.durationSec, sec));
    const idx = F.slides.reduce((acc, s, i) => (state.timeSec >= s.startSec ? i : acc), 0);
    if (idx !== state.slideIndex) { state.slideIndex = idx; touchProgress(); renderSlide(); }
    renderPlayer();
    renderTranscript();
    emit('time:change', { t: state.timeSec });
  }

  /* ---------------- Player ---------------- */
  let timer = null;
  function togglePlay() {
    state.playing = !state.playing;
    if (state.playing) {
      timer = setInterval(() => {
        seek(state.timeSec + 5);                       // 1 tick = 5 giây bài giảng
        if (state.timeSec >= F.lesson.durationSec) togglePlay();
      }, 500);
    } else {
      clearInterval(timer);
    }
    renderPlayer();
    emit('play:change', { playing: state.playing });
  }

  function renderPlayer() {
    const pct = (state.timeSec / F.lesson.durationSec) * 100;
    dom.playFill.style.width = pct + '%';
    dom.time.textContent = `${fmtTime(state.timeSec)} / ${fmtTime(F.lesson.durationSec)}`;
    dom.playBtn.innerHTML = icon(state.playing ? 'pause' : 'play');
    dom.playBtn.setAttribute('aria-label', state.playing ? 'Tạm dừng' : 'Phát');
    dom.dots.querySelectorAll('.player__dot').forEach((d, i) =>
      d.setAttribute('aria-current', String(i === state.slideIndex)));
    dom.ticks.innerHTML = state.marks.map(m =>
      `<span class="player__tick player__tick--${m.type}" style="left:${(m.t / F.lesson.durationSec) * 100}%" title="${escapeHtml(window.UI.MARK_LABEL[m.type])} · ${fmtTime(m.t)}"></span>`).join('');
  }

  /* ---------------- Transcript ---------------- */
  function renderTranscript() {
    const lines = F.transcript.filter(l => l.slideId === F.slides[state.slideIndex].id);
    dom.transcript.innerHTML = lines.map(l => `
      <div class="transcript__line" data-t="${l.t}" data-active="${state.timeSec >= l.t && state.timeSec < l.t + 120}" tabindex="0" role="button">
        <span class="transcript__ts">${fmtTime(l.t)}</span>
        <span>${escapeHtml(l.text)}</span>
      </div>`).join('');
  }

  /* ---------------- Marks API (3 nhánh dùng chung) ---------------- */
  function addMark(mark) {
    const m = {
      id: 'm' + Date.now() + Math.random().toString(36).slice(2, 6),
      type: 'note',
      slideId: F.slides[state.slideIndex].id,
      t: state.timeSec,
      text: '',
      note: '',
      ...mark,
      createdAt: (mark && mark.createdAt) || Date.now()
    };
    state.marks.push(m);
    renderPlayer();
    emit('marks:change', { marks: state.marks, added: m });
    return m;
  }
  function removeMark(id) {
    state.marks = state.marks.filter(m => m.id !== id);
    renderPlayer();
    emit('marks:change', { marks: state.marks, removed: id });
  }
  /* Chỉ vùng bài giảng mới tạo được dấu vết: slide + transcript.
     Bôi đen ở panel/rail/topbar → coi như không có chọn gì. */
  function captureZones() {
    return [dom.slide, dom.transcript].filter(Boolean);
  }
  function isInCaptureZone(node) {
    return captureZones().some(z => z === node || z.contains(node));
  }
  function getSelectionText() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return '';
    const text = (sel.toString() || '').trim();
    if (!text) return '';
    for (let i = 0; i < sel.rangeCount; i++) {
      // cả điểm đầu lẫn điểm cuối phải nằm trong cùng vùng cho phép
      if (!isInCaptureZone(sel.getRangeAt(i).commonAncestorContainer)) return '';
    }
    return text;
  }

  /* ---------------- Branch registry ---------------- */
  const branches = [];
  function registerBranch(cfg) {
    branches.push(cfg);          // { id, label, task, outcome, mount(container, api) }
  }

  function renderBranchSwitch() {
    dom.branchSwitch.innerHTML = branches.map(b =>
      `<button class="seg" type="button" role="tab" data-branch="${b.id}" aria-selected="false">${escapeHtml(b.label)}</button>`).join('');
  }

  function activateBranch(id) {
    const b = branches.find(x => x.id === id) || branches[0];
    if (!b) return;
    state.activeBranch = b.id;
    dom.branchSwitch.querySelectorAll('.seg').forEach(s =>
      s.setAttribute('aria-selected', String(s.dataset.branch === b.id)));
    dom.taskValue.textContent = b.task;
    dom.outcomeValue.textContent = b.outcome;
    dom.railTitle.textContent = b.railTitle || b.label;
    dom.railBody.innerHTML = '';
    dom.railFooter.innerHTML = '';
    try {
      b.mount(dom.railBody, api, dom.railFooter);
    } catch (err) {
      dom.railBody.appendChild(window.UI.emptyState('Nhánh lỗi khi khởi tạo', String(err)));
      console.error(err);
    }
    location.hash = '#' + b.id;
    emit('branch:change', { branch: b });
  }

  /* ---------------- API mở ra cho nhánh ---------------- */
  const api = {
    fixture: F,
    state,
    on,
    goToSlide,
    seek,
    addMark,
    removeMark,
    getMarks: () => state.marks.slice(),
    getSelectionText,
    currentSlide: () => F.slides[state.slideIndex],
    UI: window.UI
  };

  /* ---------------- Bootstrap ---------------- */
  function mount() {
    document.body.appendChild(el(`
      <div class="app">
        <header class="topbar">
          <div class="topbar__brand">
            <span class="topbar__logo">${icon('book')}</span>
            <div class="topbar__titles">
              <p class="topbar__course">${escapeHtml(F.course)}</p>
              <p class="topbar__lesson">${escapeHtml(F.lesson.title)} · ${escapeHtml(F.lesson.instructor)}</p>
            </div>
          </div>
          <span class="topbar__spacer"></span>
          <span class="badge badge--muted">${escapeHtml(F.learner.name)}</span>
          <div class="branch-switch" role="tablist" aria-label="Chọn nhánh prototype" id="branchSwitch"></div>
        </header>

        <div class="taskbar">
          <div class="taskbar__item">
            <span class="taskbar__label">Task</span>
            <span class="taskbar__value" id="taskValue">—</span>
          </div>
          <span class="taskbar__divider"></span>
          <div class="taskbar__item">
            <span class="taskbar__label">Desired outcome</span>
            <span class="taskbar__value" id="outcomeValue">—</span>
          </div>
        </div>

        <div class="main">
          <section class="stage">
            <article class="slide" id="slide" aria-live="polite"></article>
            <div class="splitter splitter--y" id="splitY" role="separator" aria-orientation="horizontal" aria-label="Kéo để đổi chiều cao slide / transcript"></div>
            <div class="stage__dock" id="stageDock">
              <div class="player">
                <button class="btn btn--secondary btn--icon" type="button" id="prevBtn" aria-label="Slide trước">${icon('prev')}</button>
                <button class="btn btn--icon" type="button" id="playBtn" aria-label="Phát">${icon('play')}</button>
                <button class="btn btn--secondary btn--icon" type="button" id="nextBtn" aria-label="Slide sau">${icon('next')}</button>
                <span class="player__time" id="time">00:00 / 00:00</span>
                <div class="player__track" id="track" role="slider" tabindex="0"
                     aria-label="Tiến trình bài giảng" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                  <span class="player__fill" id="playFill"></span>
                  <span id="ticks"></span>
                </div>
                <div class="player__slides" id="dots"></div>
              </div>

              <div class="card card--pad" style="flex:1;min-height:0;overflow:auto">
                <div class="row row--between" style="margin-bottom:var(--space-2)">
                  <strong style="font-size:var(--text-sm)">Lời giảng (transcript)</strong>
                  <span class="badge badge--muted">Bôi đen để tạo dấu vết</span>
                </div>
                <div class="transcript" id="transcript"></div>
              </div>
            </div>
          </section>

          <div class="splitter splitter--x" id="splitX" role="separator" aria-orientation="vertical" aria-label="Kéo để đổi độ rộng panel ghi chú"></div>

          <aside class="rail">
            <div class="rail__header">
              ${icon('sparkle')}
              <span class="rail__title" id="railTitle">Prototype</span>
            </div>
            <div class="rail__body" id="railBody"></div>
            <div class="rail__footer" id="railFooter"></div>
          </aside>
        </div>
      </div>`));

    ['slide', 'time', 'track', 'playFill', 'ticks', 'dots', 'transcript', 'taskValue', 'outcomeValue',
     'railTitle', 'railBody', 'railFooter', 'branchSwitch', 'playBtn', 'prevBtn', 'nextBtn']
      .forEach(id => dom[id] = document.getElementById(id));

    bindSplitters();

    dom.dots.innerHTML = F.slides.map((s, i) =>
      `<button class="player__dot" type="button" data-i="${i}" aria-label="Tới slide ${i + 1}: ${escapeHtml(s.title)}"></button>`).join('');

    /* events */
    dom.playBtn.addEventListener('click', togglePlay);
    dom.prevBtn.addEventListener('click', () => goToSlide(state.slideIndex - 1));
    dom.nextBtn.addEventListener('click', () => goToSlide(state.slideIndex + 1));
    dom.dots.addEventListener('click', e => {
      const b = e.target.closest('.player__dot');
      if (b) goToSlide(Number(b.dataset.i));
    });
    dom.track.addEventListener('click', e => {
      const r = dom.track.getBoundingClientRect();
      seek(((e.clientX - r.left) / r.width) * F.lesson.durationSec);
    });
    dom.track.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { seek(state.timeSec + 30); e.preventDefault(); }
      if (e.key === 'ArrowLeft')  { seek(state.timeSec - 30); e.preventDefault(); }
    });
    dom.transcript.addEventListener('click', e => {
      const line = e.target.closest('.transcript__line');
      if (line && !getSelectionText()) seek(Number(line.dataset.t));
    });
    dom.transcript.addEventListener('keydown', e => {
      const line = e.target.closest('.transcript__line');
      if (line && (e.key === 'Enter' || e.key === ' ')) { seek(Number(line.dataset.t)); e.preventDefault(); }
    });
    dom.branchSwitch.addEventListener('click', e => {
      const b = e.target.closest('.seg');
      if (b) activateBranch(b.dataset.branch);
    });
    document.addEventListener('keydown', e => {
      if (e.target.matches('input, textarea')) return;
      if (e.key === 'ArrowRight') goToSlide(state.slideIndex + 1);
      if (e.key === 'ArrowLeft') goToSlide(state.slideIndex - 1);
      if (e.key === '.') togglePlay();
    });

    renderBranchSwitch();
    renderSlide();
    renderPlayer();
    renderTranscript();
    activateBranch(location.hash.replace('#', '') || (branches[0] && branches[0].id));
  }

  function bindSplitters() {
    const root = document.documentElement;
    const splitX = document.getElementById('splitX');
    const splitY = document.getElementById('splitY');
    const stage = document.querySelector('.stage');
    const main = document.querySelector('.main');

    function drag(handle, onMove) {
      handle.addEventListener('pointerdown', e => {
        e.preventDefault();
        handle.classList.add('is-dragging');
        handle.setPointerCapture(e.pointerId);
      });
      handle.addEventListener('pointermove', ev => {
        if (!handle.hasPointerCapture(ev.pointerId)) return;
        onMove(ev);
      });
      handle.addEventListener('pointerup', ev => {
        handle.classList.remove('is-dragging');
        if (handle.hasPointerCapture(ev.pointerId)) handle.releasePointerCapture(ev.pointerId);
      });
    }

    if (splitX && main) {
      drag(splitX, ev => {
        const r = main.getBoundingClientRect();
        const w = Math.round(r.right - ev.clientX);
        root.style.setProperty('--rail-width', Math.max(280, Math.min(640, w)) + 'px');
      });
    }
    if (splitY && stage) {
      drag(splitY, ev => {
        const r = stage.getBoundingClientRect();
        const h = Math.round(r.bottom - ev.clientY);
        root.style.setProperty('--stage-dock', Math.max(140, Math.min(r.height - 160, h)) + 'px');
      });
    }
  }

  window.App = { registerBranch, mount, api };
  document.addEventListener('DOMContentLoaded', () => {
    // branches.js đã chạy trước (script thường, không defer bất đồng bộ)
    mount();
  });
})();
