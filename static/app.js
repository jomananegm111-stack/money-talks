/* ==========================================================================
   MONEY TALKS® — CLIENT BEHAVIOUR
   Language · overlays · board explorer · countdown · forms
   Brand rule: no hype, no false urgency, no stacked messages.
   ========================================================================== */
(function () {
  'use strict';

  var html = document.documentElement;
  var LANG_KEY = 'mt.lang';
  var storage = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  var MC = [];
  var BOARD = { map: {}, next: null, seatsLeft: 7, currency: 'EGP' };
  var LINKS = {
    waitlist: 'https://forms.gle/fgGZQDT1LAP6cayv5',
    founding: 'https://forms.gle/LVe5XWdEG34vAGUz6',
    firstMove: 'https://forms.gle/Bps4wL1LkUTuBHzAA',
    telegram: 'https://t.me/MoneyTalksClub1',
    firstMoveTelegram: 'https://t.me/MoneyTalksClub1/5'
  };
  var GOOGLE_FORMS = {
    waitlist: {
      action: 'https://docs.google.com/forms/d/e/1FAIpQLSf2BMaozTADFo2XQFOb4M8ZR5cdcprTbZ4o8qdyMfTj5lNY2Q/formResponse',
      fields: { name: '975290697', email: '1666203135', phone: '810918425', country: '1917804334', masterclass: '1468429776' }
    },
    founding: {
      action: 'https://docs.google.com/forms/d/e/1FAIpQLSf53xOTlR5TM_pqY7pmJyGeXeCYIXPIAkl5cjkQ78q8h0a9LA/formResponse',
      fields: { name: '2007271144', email: '1469195019', phone: '2044421919', country: '1525191689', career: '1634415196', age: '324247781', why: '2123389604', confirm: '1892666506' }
    },
    firstMove: {
      action: 'https://docs.google.com/forms/d/e/1FAIpQLSdsjdzaegupMJCvhcOzjR3SbmmzMbsCv8Yzuq6doZghv2U_Mg/formResponse',
      fields: { name: '1121373456', email: '639486719', phone: '99173400', country: '804721613', plan: '194917913' }
    }
  };
  try {
    var d = document.getElementById('mt-data');
    if (d) MC = JSON.parse(d.textContent || '[]');
    var b = document.getElementById('mt-board');
    if (b) BOARD = Object.assign(BOARD, JSON.parse(b.textContent || '{}'));
  } catch (e) { /* keep defaults */ }

  var bySlug = {};
  MC.forEach(function (m) { bySlug[m.slug] = m; });

  var T = {
    locked: { ar: 'هذه الماستركلاس مكتملة. أضفناك لقائمة الانتظار بدلاً من ذلك.', en: 'This masterclass is full. We added you to the waitlist instead.' },
    sending: { ar: 'جارٍ الإرسال…', en: 'Sending…' },
    ok: { ar: 'تم. تحقّق من بريدك.', en: 'Done. Check your inbox.' },
    okEnroll: { ar: 'تم استلام طلبك. الحركة القادمة عندنا.', en: 'Request received. The next move is ours.' },
    netErr: { ar: 'تعذّر الاتصال. حاول مرة أخرى.', en: 'Connection failed. Try again.' },
    emailErr: { ar: 'أدخل بريداً إلكترونياً صحيحاً.', en: 'Enter a valid email address.' },
    nameErr: { ar: 'الاسم مطلوب.', en: 'Name is required.' },
    seatLeftA: 'مقعد متبقٍ',
    seatLeftB: 'مقعداً متبقياً'
  };
  function t(key) {
    var lang = html.getAttribute('data-lang') || 'ar';
    return (T[key] || {})[lang] || (T[key] || {}).en || '';
  }
  function lang() { return html.getAttribute('data-lang') || 'ar'; }

  /* ---------------- language ---------------- */
  function setLang(l) {
    html.setAttribute('data-lang', l);
    html.setAttribute('lang', l);
    html.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr');
    document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang-btn') === l));
    });
    storage.set(LANG_KEY, l);
  }
  setLang(storage.get(LANG_KEY) || 'ar');
  document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () { setLang(btn.getAttribute('data-lang-btn')); });
  });

  /* ---------------- overlays ---------------- */
  var lastFocus = null;
  function panel(id) { return document.getElementById(id); }

  function open(id, opts) {
    var el = panel(id);
    if (!el) return;
    document.querySelectorAll('.mt-overlay[data-open="true"]').forEach(function (other) {
      if (other !== el) other.setAttribute('data-open', 'false');
    });
    lastFocus = document.activeElement;
    el.setAttribute('data-open', 'true');
    document.body.classList.add('mt-lock');
    var focusable = el.querySelector('input,select,textarea,button,a[href]');
    if (focusable) setTimeout(function () { focusable.focus(); }, 90);
    record('open', { panel: id, masterclass: (opts && opts.slug) || null });
  }
  function close(el) {
    if (!el) return;
    el.setAttribute('data-open', 'false');
    if (!document.querySelector('.mt-overlay[data-open="true"]')) {
      document.body.classList.remove('mt-lock');
    }
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }
  function closeAll() {
    document.querySelectorAll('.mt-overlay[data-open="true"]').forEach(close);
  }

  function openCourseLink(slug) {
    var target = slug === 'first-move' ? LINKS.firstMoveTelegram : LINKS.telegram;
    window.location.assign(target);
    record('course_link', { slug: slug, destination: target });
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-open]');
    if (opener) {
      e.preventDefault();
      var id = 'ov-' + opener.getAttribute('data-open');
      var tier = opener.getAttribute('data-tier');
      if (id === 'ov-claim' && tier) prefillClaim(tier);
      if (id === 'ov-mc' && opener.getAttribute('data-mc-open')) {
        showMasterclass(opener.getAttribute('data-mc-open'));
      }
      open(id);
      return;
    }
    var closer = e.target.closest('[data-close]');
    if (closer) { e.preventDefault(); close(closer.closest('.mt-overlay')); return; }
    if (e.target.classList && e.target.classList.contains('mt-overlay')) { close(e.target); return; }

    var mcCard = e.target.closest('[data-mc]');
    if (mcCard) { openCourseLink(mcCard.getAttribute('data-mc')); return; }

    var mcOpen = e.target.closest('[data-mc-open]');
    if (mcOpen) { openCourseLink(mcOpen.getAttribute('data-mc-open')); return; }

    var drawerLink = e.target.closest('[data-drawer-close]');
    if (drawerLink) { close(panel('drawer')); }

    var minus = e.target.closest('[data-drop]');
    if (minus) { e.preventDefault(); showMasterclass(minus.getAttribute('data-drop')); open('ov-mc'); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeAll(); close(panel('drawer')); }
    var card = e.target.closest && e.target.closest('[data-mc]');
    if (card && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openCourseLink(card.getAttribute('data-mc'));
    }
  });

  /* ---------------- drawer ---------------- */
  var burger = document.getElementById('burger');
  var drawer = panel('drawer');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var isOpen = drawer.getAttribute('data-open') === 'true';
      drawer.setAttribute('data-open', String(!isOpen));
      burger.setAttribute('aria-expanded', String(!isOpen));
      document.body.classList.toggle('mt-lock', !isOpen);
    });
  }
  var drawerClose = document.getElementById('drawer-close');
  if (drawerClose) drawerClose.addEventListener('click', function () { close(drawer); });

  /* ---------------- masterclass detail ---------------- */
  function esc(s) { return String(s == null ? '' : s); }
  function showMasterclass(slug) {
    var m = bySlug[slug]; if (!m) return;
    var ar = lang() === 'ar';
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };

    set('mc-topline', 'MASTERCLASS / ' + m.code + ' / ' + m.slug.toUpperCase());
    set('mc-stage', m.stage);
    set('mc-coord', m.code);
    set('mc-title-ar', m.ar);
    set('mc-title-en', m.name);
    set('mc-tagline', ar ? m.taglineAr : m.taglineEn);
    set('mc-summary', ar ? m.summaryAr : m.summaryEn);
    set('mc-audience', ar ? m.audienceAr : m.audienceEn);
    set('mc-outcome', ar ? m.outcomeAr : m.outcomeEn);
    set('mc-level', ar ? m.levelAr : m.levelEn);
    set('mc-price', m.price === 0 ? (ar ? 'مجاناً' : 'FREE') : fmt(m.price) + ' ' + (BOARD.currency || 'EGP'));
    set('mc-duration', (ar ? m.weeks + ' أسابيع' : m.weeks + ' weeks'));
    set('mc-sessions', String(m.sessions));
    set('mc-code', 'M' + String(m.code) + '-' + m.slug.slice(0, 3).toUpperCase());

    var cmp = document.getElementById('mc-compare');
    if (cmp) { cmp.textContent = m.compare ? fmt(m.compare) + ' ' + (BOARD.currency || 'EGP') : ''; }

    var mods = document.getElementById('mc-modules');
    if (mods) {
      mods.innerHTML = m.modules.map(function (x) {
        return '<div class="mt-row" style="padding-block:15px;align-items:flex-start;gap:16px">' +
          '<span class="mt-code" style="flex:none;min-width:30px">' + esc(x.code) + '</span>' +
          '<span style="flex:1;text-align:start">' +
          '<b style="display:block;font-size:.9rem">' + esc(ar ? x.titleAr : x.titleEn) + '</b>' +
          '<span class="mt-body" style="display:block;font-size:.82rem;margin-top:5px">' + esc(ar ? x.detailAr : x.detailEn) + '</span>' +
          '</span></div>';
      }).join('');
    }

    var left = Math.max(0, m.seats - m.taken);
    var pctv = Math.min(100, Math.round((m.taken / m.seats) * 100));
    set('mc-seats', m.status === 'waitlist' ? (ar ? 'قائمة انتظار فقط' : 'Waitlist only') : left + ' / ' + m.seats);
    var meter = document.getElementById('mc-meter');
    if (meter) { meter.setAttribute('data-w', String(pctv)); meter.style.width = pctv + '%'; }
    set('mc-scarcity', m.status === 'waitlist'
      ? (ar ? 'الجلسات الخاصة تُصدر بمعدل جلستين شهرياً فقط.' : 'Private sessions are issued at two per month only.')
      : (ar ? 'تُغلق المجموعة عند اكتمال ' + m.seats + ' لاعباً. التقديم الحالي: ' + pctv + '%.' : 'The cohort closes at ' + m.seats + ' players. Currently filled: ' + pctv + '%.'));

    var cta = document.getElementById('mc-cta');
    if (cta) cta.setAttribute('data-target', m.slug);
    var wl = document.getElementById('mc-waitlist');
    if (wl) wl.setAttribute('data-target', m.slug);

    var wlLabel = wl && wl.querySelector('#mc-waitlist');
    if (wl) {
      wl.style.display = m.status === 'waitlist' ? 'none' : '';
    }
    var badge = document.getElementById('mc-code');
    if (badge) badge.textContent = m.code + ' · SYSTEM / 2026';
  }

  var ctaBtn = document.getElementById('mc-cta');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', function () {
      var slug = ctaBtn.getAttribute('data-target') || 'first-move';
      close(panel('ov-mc'));
      prefillClaim(slug, 'enroll');
      open('ov-claim');
    });
  }
  var wlBtn = document.getElementById('mc-waitlist');
  if (wlBtn) {
    wlBtn.addEventListener('click', function () {
      var slug = wlBtn.getAttribute('data-target') || 'first-move';
      close(panel('ov-mc'));
      prefillClaim(slug, 'waitlist');
      open('ov-claim');
    });
  }

  function fmt(n) { return Number(n).toLocaleString('en-US'); }

  /* ---------------- claim prefill ---------------- */
  function prefillClaim(tier, intent) {
    var sel = document.getElementById('c-masterclass');
    var badge = document.getElementById('claim-tier-badge');
    var note = document.getElementById('claim-seat-note');
    var intentSel = document.getElementById('c-intent');
    var tierMeta = {
      'founding-10': { label: 'FREE MVP 10', noteTxt: '#' + String(Math.max(1, 11 - (BOARD.seatsLeft || 7))).padStart(3, '0') + ' · FREE MVP COHORT / LIMITED' },
      'board-access': { label: 'THE FULL BOARD', noteTxt: 'ALL 07 MASTERCLASSES' },
      'brief': { label: 'THE BRIEF', noteTxt: 'FREE / SUNDAY 07:00' }
    };
    var meta = tierMeta[tier];
    var m = bySlug[tier];

    if (sel) {
      if (meta) sel.value = tier;
      else if (m) sel.value = tier;
      else sel.value = 'first-move';
    }
    if (badge) badge.textContent = meta ? meta.label : (m ? m.stage : 'MASTERCLASS');
    if (note) {
      if (meta) note.textContent = meta.noteTxt;
      else if (m) {
        var left = Math.max(0, m.seats - m.taken);
        note.textContent = m.code + ' · ' + (m.status === 'waitlist'
          ? (lang() === 'ar' ? 'قائمة انتظار' : 'WAITLIST')
          : left + ' ' + (lang() === 'ar' ? 'مقعد متبقي' : 'SEATS LEFT'));
      }
    }
    if (intentSel && intent) intentSel.value = intent;
  }

  /* ---------------- forms ---------------- */
  function post(url, body) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, data: j }; }); });
  }

  function showToast(msg) {
    var box = document.getElementById('toast');
    var m = document.getElementById('toast-msg');
    if (!box || !m) return;
    m.textContent = msg;
    box.setAttribute('data-show', 'true');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { box.setAttribute('data-show', 'false'); }, 4200);
  }

  function submitToGoogleForm(kind, payload) {
    var cfg = GOOGLE_FORMS[kind];
    if (!cfg) return false;
    var frame = document.getElementById('mt-google-submit-frame');
    if (!frame) {
      frame = document.createElement('iframe');
      frame.id = 'mt-google-submit-frame';
      frame.name = 'mt-google-submit-frame';
      frame.setAttribute('aria-hidden', 'true');
      frame.style.display = 'none';
      document.body.appendChild(frame);
    }
    var form = document.createElement('form');
    form.method = 'POST';
    form.action = cfg.action;
    form.target = frame.name;
    form.style.display = 'none';
    Object.keys(payload).forEach(function (key) {
      var fieldKey = key === 'full_name' ? 'name' : key;
      if (!cfg.fields[fieldKey]) return;
      var input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'entry.' + cfg.fields[fieldKey];
      input.value = payload[key] == null ? '' : String(payload[key]);
      form.appendChild(input);
    });
    ['fvv', 'pageHistory', 'submissionTimestamp'].forEach(function (key, i) {
      var hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = key;
      hidden.value = i === 0 ? '1' : i === 1 ? '0' : '-1';
      form.appendChild(hidden);
    });
    document.body.appendChild(form);
    form.submit();
    setTimeout(function () { form.remove(); }, 1500);
    return true;
  }

  function showClaimSuccess(payload, label) {
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    set('succ-player', 'MVP REQUEST');
    set('succ-name', payload.full_name + ' — ' + payload.email);
    set('succ-tier', label || 'RESERVATION SENT');
    set('succ-code', 'MONEY TALKS / GOOGLE FORM / REQUEST RECEIVED');
    var fv = document.getElementById('claim-form-view');
    var sv = document.getElementById('claim-success-view');
    if (fv) fv.style.display = 'none';
    if (sv) sv.style.display = '';
    showToast(lang() === 'ar' ? 'تم إرسال بياناتك بنجاح.' : 'Your details were submitted successfully.');
  }

  /* brief form (inline) */
  var briefForm = document.getElementById('brief-form');
  if (briefForm) {
    briefForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('brief-email');
      var err = document.getElementById('brief-error');
      var email = (input && input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        if (err) err.textContent = t('emailErr');
        if (input) input.focus();
        return;
      }
      if (err) err.textContent = '';
      window.location.assign(LINKS.waitlist);
      return;
      var btn = briefForm.querySelector('button[type="submit"]');
      var original = btn ? btn.innerHTML : '';
      if (btn) btn.disabled = true;
      post('/api/brief', { email: email, locale: lang(), source: 'inline' })
        .then(function (res) {
          if (res.ok) {
            briefForm.reset();
            showToast(t('ok'));
            record('brief', { new: !!(res.data && res.data.created) });
          } else {
            if (err) err.textContent = (res.data && res.data.error) || t('netErr');
          }
        })
        .catch(function () { if (err) err.textContent = t('netErr'); })
        .finally(function () { if (btn) { btn.disabled = false; btn.innerHTML = original; } });
    });
  }

  /* brief form (modal) */
  var briefModalForm = document.getElementById('brief-modal-form');
  if (briefModalForm) {
    briefModalForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('bm-email');
      var err = document.getElementById('brief-modal-error');
      var email = (input && input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        if (err) err.textContent = t('emailErr');
        return;
      }
      if (err) err.textContent = '';
      window.location.assign(LINKS.waitlist);
      return;
      post('/api/brief', { email: email, locale: lang(), source: 'modal' })
        .then(function (res) {
          if (res.ok) {
            briefModalForm.reset();
            close(panel('ov-brief'));
            showToast(t('ok'));
            record('brief', { new: !!(res.data && res.data.created) });
            var inline = document.getElementById('brief-email');
            if (inline) inline.value = '';
          } else if (err) { err.textContent = (res.data && res.data.error) || t('netErr'); }
        })
        .catch(function () { if (err) err.textContent = t('netErr'); });
    });
  }

  /* claim / enroll form */
  var claimForm = document.getElementById('claim-form');
  if (claimForm) {
    claimForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = document.getElementById('claim-error');
      var name = (document.getElementById('c-name') || {}).value || '';
      var email = (document.getElementById('c-email') || {}).value || '';
      if (!name.trim()) { if (err) err.textContent = t('nameErr'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { if (err) err.textContent = t('emailErr'); return; }
      if (err) err.textContent = '';

      var selectedMasterclass = (document.getElementById('c-masterclass') || {}).value || 'founding-10';
      var selectedIntent = (document.getElementById('c-intent') || {}).value || 'enroll';
      var destination = selectedIntent === 'waitlist'
        ? LINKS.waitlist
        : selectedMasterclass === 'founding-10'
          ? LINKS.founding
          : selectedMasterclass === 'first-move'
            ? LINKS.firstMove
            : LINKS.waitlist;
      var kind = selectedIntent === 'waitlist' ? 'waitlist' : selectedMasterclass === 'founding-10' ? 'founding' : 'firstMove';
      var countryNames = { EG: 'Egypt', AE: 'UAE', SA: 'Saudi Arabia', KW: 'Kuwait', QA: 'Qatar', OTHER: 'Other' };
      var common = {
        full_name: name.trim(), email: email.trim(), phone: (document.getElementById('c-phone') || {}).value || '',
        country: countryNames[(document.getElementById('c-country') || {}).value] || (document.getElementById('c-country') || {}).value || ''
      };
      var sent = kind === 'founding'
        ? submitToGoogleForm(kind, Object.assign(common, {
          career: 'MVP applicant', age: '', why: (document.getElementById('c-notes') || {}).value || 'Interested in the free MVP launch seats', confirm: 'i understand'
        }))
        : kind === 'firstMove'
          ? submitToGoogleForm(kind, Object.assign(common, {
            plan: selectedIntent === 'enroll' ? 'Launch Price 600 EGP' : 'Regular Entry 900 EGP'
          }))
          : submitToGoogleForm(kind, Object.assign(common, { masterclass: selectedMasterclass === 'first-move' ? 'A1 Move ( the only available masterclass for now )' : selectedMasterclass }));
      if (!sent) { if (err) err.textContent = t('netErr'); return; }
      showClaimSuccess(common, kind === 'founding' ? 'FREE MVP / FOUNDING 10' : kind === 'firstMove' ? 'A1 FIRST MOVE' : 'WAITLIST');
      record('google_form_submission', { destination: destination, masterclass: selectedMasterclass, intent: selectedIntent });
      return;
    });
  }

  /* reset claim modal to form state when reopened */
  document.querySelectorAll('[data-open="claim"]').forEach(function (el) {
    el.addEventListener('click', function () {
      var fv = document.getElementById('claim-form-view');
      var sv = document.getElementById('claim-success-view');
      if (fv) fv.style.display = '';
      if (sv) sv.style.display = 'none';
      var err = document.getElementById('claim-error');
      if (err) err.textContent = '';
    });
  });

  /* ---------------- board explorer ---------------- */
  var grid = document.getElementById('board-grid');
  var boardMap = BOARD.map || {};
  function paintBoard(coord) {
    var info = boardMap[coord];
    var ar = lang() === 'ar';
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    set('bd-coord', coord);
    set('bd-title-en', info ? info.hEn : coord);
    set('bd-title-ar', info ? info.hAr : coord);
    var desc = document.getElementById('bd-desc');
    if (desc) desc.textContent = info ? (ar ? info.dAr : info.dEn) : (ar ? 'مربع على الرقعة — كل إحداثي يقابل موقعاً حقيقياً في النظام.' : 'A square on the board — every coordinate maps to a real place in the system.');
    if (grid) {
      grid.querySelectorAll('.mt-sq').forEach(function (b) {
        b.setAttribute('aria-current', String(b.getAttribute('data-coord') === coord));
      });
    }
  }
  if (grid) {
    grid.addEventListener('click', function (e) {
      var sq = e.target.closest('.mt-sq');
      if (!sq) return;
      var coord = sq.getAttribute('data-coord');
      paintBoard(coord);
      record('board', { coord: coord });
    });
    paintBoard('A1');
  }

  /* ---------------- countdown ---------------- */
  var cd = document.getElementById('countdown');
  if (cd && BOARD.next) {
    var target = new Date(BOARD.next).getTime();
    var tick = function () {
      var diff = target - Date.now();
      if (diff < 0) diff = 0;
      var s = Math.floor(diff / 1000);
      var parts = {
        d: Math.floor(s / 86400),
        h: Math.floor((s % 86400) / 3600),
        m: Math.floor((s % 3600) / 60),
        s: s % 60
      };
      Object.keys(parts).forEach(function (k) {
        var el = cd.querySelector('[data-cd="' + k + '"]');
        if (el) el.textContent = String(parts[k]).padStart(2, '0');
      });
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------- meters ---------------- */
  var seatMeter = document.getElementById('seat-meter');
  if (seatMeter) setTimeout(function () { seatMeter.style.width = (seatMeter.getAttribute('data-w') || '0') + '%'; }, 260);

  /* ---------------- accordion ---------------- */
  document.querySelectorAll('.mt-acc__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.mt-acc__item');
      var openNow = item.getAttribute('data-open') === 'true';
      document.querySelectorAll('.mt-acc__item').forEach(function (it) {
        it.setAttribute('data-open', 'false');
        var p = it.querySelector('.mt-acc__panel');
        if (p) p.style.maxHeight = '0px';
        var b = it.querySelector('.mt-acc__btn');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (!openNow) {
        item.setAttribute('data-open', 'true');
        btn.setAttribute('aria-expanded', 'true');
        var pnl = item.querySelector('.mt-acc__panel');
        if (pnl) pnl.style.maxHeight = pnl.scrollHeight + 'px';
      }
    });
  });

  /* ---------------- filters ---------------- */
  var filters = document.querySelectorAll('[data-mc-filter]');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var k = btn.getAttribute('data-mc-filter');
      filters.forEach(function (b) {
        var on = b === btn;
        b.className = on ? 'mt-chip mt-chip--solid' : 'mt-chip';
        b.setAttribute('aria-pressed', String(on));
      });
      document.querySelectorAll('[data-mc]').forEach(function (card) {
        var m = bySlug[card.getAttribute('data-mc')];
        if (!m) return;
        var show = k === 'all'
          || (k === 'open' && m.status === 'open')
          || (k === 'waitlist' && m.status === 'waitlist')
          || (k === 'vip' && m.price >= 20000);
        card.style.display = show ? '' : 'none';
      });
    });
  });

  /* ---------------- reveal on scroll ---------------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  document.querySelectorAll('.js-meter').forEach(function (el) {
    if ('IntersectionObserver' in window) {
      var mo = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { el.style.width = (el.getAttribute('data-w') || '0') + '%'; mo.unobserve(el); }
        });
      }, { threshold: 0.3 });
      mo.observe(el);
    } else { el.style.width = (el.getAttribute('data-w') || '0') + '%'; }
  });

  /* ---------------- sticky bar ---------------- */
  var bar = document.getElementById('sticky-bar');
  var dismissed = storage.get('mt.bar.dismissed') === '1';
  if (bar && !dismissed) {
    var onScroll = function () {
      var y = window.scrollY || 0;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = h > 0 ? y / h : 0;
      if (y > 700 && ratio < 0.94) { bar.setAttribute('data-show', 'true'); }
      else if (ratio >= 0.94) { bar.setAttribute('data-show', 'false'); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    var sx = document.getElementById('sticky-x');
    if (sx) sx.addEventListener('click', function () {
      bar.setAttribute('data-show', 'false');
      storage.set('mt.bar.dismissed', '1');
    });
  }

  /* ---------------- founding popup (intent, not spam) ---------------- */
  var seenFounding = storage.get('mt.founding.seen') === '1';
  if (!seenFounding && (BOARD.seatsLeft || 0) > 0 && (BOARD.seatsLeft || 0) <= 10) {
    var fired = false;
    var trigger = function (reason) {
      if (fired) return;
      if (panel('ov-claim') && panel('ov-claim').getAttribute('data-open') === 'true') return;
      if (document.querySelector('.mt-overlay[data-open="true"]')) return;
      fired = true;
      storage.set('mt.founding.seen', '1');
      open('ov-founding');
      record('popup', { name: 'founding', reason: reason });
    };
    setTimeout(function () { trigger('delay'); }, 42000);
    window.addEventListener('scroll', function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (h > 0 && (window.scrollY || 0) / h > 0.62) trigger('scroll');
    }, { passive: true, once: true });
  }

  /* ---------------- exit intent (dismissible, once) ---------------- */
  var seenExit = storage.get('mt.exit.seen') === '1';
  if (!seenExit) {
    var exitFired = false;
    var fireExit = function () {
      if (exitFired) return;
      if (document.querySelector('.mt-overlay[data-open="true"]')) return;
      exitFired = true;
      storage.set('mt.exit.seen', '1');
      open('ov-exit');
      record('popup', { name: 'exit' });
    };
    document.addEventListener('mouseout', function (e) {
      if (!e.relatedTarget && !e.toElement && e.clientY <= 6) fireExit();
    });
    window.addEventListener('beforeunload', function () {
      if (!exitFired && (window.scrollY || 0) > 400) fireExit();
    });
  }
  document.querySelectorAll('[data-close]').forEach(function (b) {
    if (!b.hasAttribute('aria-label')) {
      b.addEventListener('click', function () { record('popup_dismiss', {}); });
    }
  });

  /* ---------------- analytics (fire & forget) ---------------- */
  function record(name, payload) {
    try {
      var body = JSON.stringify({ name: name, payload: payload || {} });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/event', new Blob([body], { type: 'application/json' }));
      } else {
        fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true });
      }
    } catch (e) {}
  }

  /* anchors: offset for the sticky header */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (!id || id === '#') return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    var header = document.querySelector('.mt-header');
    var offset = header ? header.getBoundingClientRect().height + 8 : 0;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
  });
})();
