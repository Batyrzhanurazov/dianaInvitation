/* ── CONFIG ─────────────────────────────── */
  const TOTAL = 6;
  const WEDDING_DATE = new Date('2026-06-05T18:00:00');
  // Replace with your actual API endpoint:
  const RSVP_API = '/api/rsvp';

  /* ── STATE ───────────────────────────────── */
  let current = 0;
  let autoTimer = null;
  const AUTO_DUR = 8000; // ms per slide (except RSVP)
  let pbInterval = null;
  let pbStart = null;

  /* ── BUILD CHROME ────────────────────────── */
  const pb = document.getElementById('progressBar');
  const dots = document.getElementById('dotBar');
  for (let i = 0; i < TOTAL; i++) {
    const seg = document.createElement('div');
    seg.className = 'pb-seg';
    seg.innerHTML = '<div class="pb-fill"></div>';
    pb.appendChild(seg);

    const d = document.createElement('div');
    d.className = 'si-dot';
    dots.appendChild(d);
  }
  const segs = Array.from(pb.querySelectorAll('.pb-seg'));
  const dotEls = Array.from(dots.querySelectorAll('.si-dot'));
  const pages = Array.from({length: TOTAL}, (_, i) => document.getElementById('p' + (i+1)));

  /* ── SHOW PAGE ───────────────────────────── */
  function showPage(idx, dir = 1) {
    clearAuto();
    pages.forEach((p, i) => p.classList.toggle('active', i === idx));
    segs.forEach((s, i) => {
      s.classList.remove('done', 'active');
      s.querySelector('.pb-fill').style.width = '';
      if (i < idx) s.classList.add('done');
      if (i === idx) s.classList.add('active');
    });
    dotEls.forEach((d, i) => d.classList.toggle('cur', i === idx));
    current = idx;
    document.querySelector('.nav-zones').style.display = (idx === TOTAL - 1) ? 'none' : 'flex';
    startAuto();
  }

  /* ── AUTO ADVANCE ────────────────────────── */
  function startAuto() {
    if (current === TOTAL - 1) return; // don't auto on RSVP
    clearAuto();
    pbStart = Date.now();
    const fill = segs[current].querySelector('.pb-fill');
    fill.style.transition = 'none';
    fill.style.width = '0%';

    pbInterval = setInterval(() => {
      const elapsed = Date.now() - pbStart;
      const pct = Math.min((elapsed / AUTO_DUR) * 100, 100);
      fill.style.width = pct + '%';
      if (pct >= 100) {
        clearAuto();
        if (current < TOTAL - 1) showPage(current + 1);
      }
    }, 50);
  }

  function clearAuto() {
    if (pbInterval) { clearInterval(pbInterval); pbInterval = null; }
  }

  /* ── NAV ─────────────────────────────────── */
  document.getElementById('navPrev').addEventListener('click', () => {
    if (current > 0) showPage(current - 1, -1);
  });
  document.getElementById('navNext').addEventListener('click', () => {
    if (current < TOTAL - 1) showPage(current + 1, 1);
  });

  /* ── SWIPE ───────────────────────────────── */
  let touchX = null;
  const wrap = document.getElementById('storyWrap');
  wrap.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, {passive: true});
  wrap.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) < 40) return;
    if (current === TOTAL - 1) return; // Disable swipe on RSVP page
    if (dx < 0 && current < TOTAL - 1) showPage(current + 1);
    else if (dx > 0 && current > 0) showPage(current - 1);
  }, {passive: true});

  /* ── KEYBOARD ────────────────────────────── */
  document.addEventListener('keydown', e => {
    if (current === TOTAL - 1) return; // Disable keyboard on RSVP page
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      if (current < TOTAL - 1) showPage(current + 1);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      if (current > 0) showPage(current - 1);
    }
  });

  /* ── COUNTDOWN TIMER ─────────────────────── */
  function updateTimer() {
    const now = new Date();
    const diff = WEDDING_DATE - now;
    if (diff <= 0) {
      ['days','hours','mins','secs'].forEach(k => {
        document.getElementById('t-' + k).textContent = '00';
      });
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.getElementById('t-days').textContent  = String(d).padStart(2,'0');
    document.getElementById('t-hours').textContent = String(h).padStart(2,'0');
    document.getElementById('t-mins').textContent  = String(m).padStart(2,'0');
    document.getElementById('t-secs').textContent  = String(s).padStart(2,'0');
  }
  updateTimer();
  setInterval(updateTimer, 1000);

  /* ── RSVP SUBMIT ─────────────────────────── */
  async function submitRSVP() {
    const name = document.getElementById('guestName').value.trim();
    const rsvp = document.querySelector('input[name="rsvp"]:checked')?.value;
    if (!name) {
      document.getElementById('guestName').focus();
      return;
    }
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    const isRu = document.documentElement.classList.contains('lang-ru');
    btn.textContent = isRu ? 'Отправляем...' : 'Жіберілуде...';
    try {
      await fetch(RSVP_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rsvp })
      });
    } catch (_) { /* offline — still show success */ }
    document.getElementById('rsvpForm').classList.add('hidden');
    document.getElementById('rsvpSuccess').classList.add('show');
  }

  /* ── INIT ────────────────────────────────── */
  showPage(0);