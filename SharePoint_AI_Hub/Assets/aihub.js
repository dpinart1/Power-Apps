/* ============================================================
   AI Hub — App logic
   - Loads all configured SP lists via REST in parallel
   - Caches per-language data in sessionStorage (TTL 5 min)
   - Renders all sections from in-memory data
   - Self-assessment (client-side score: avg of 5 answers)
   ============================================================ */

(function (global) {
  'use strict';

  var DATA_CFG = global.AIHubData;
  if (!DATA_CFG) {
    console.error('AIHubData config missing — aihub-data.js must load before aihub.js');
    return;
  }

  var CACHE_TTL_MS = 5 * 60 * 1000;
  var CACHE_KEY = 'aihub.cache.v1';
  var SUPPORTED_LANGS = ['de', 'en'];

  var state = {
    lang: 'de',
    section: 'home',
    data: { de: {}, en: {} },
    assessment: { current: 0, answers: [] }
  };

  global.AIHub = {
    state: state,
    data: state.data,
    setLang: setLang,
    setSection: setSection,
    reload: function () { sessionStorage.removeItem(CACHE_KEY); return loadAllData(true).then(renderAll); }
  };

  // -----------------------------
  // REST loader
  // -----------------------------
  function restGet(listTitle, params) {
    var url = DATA_CFG.webUrl + "/_api/web/lists/getbytitle('" + encodeURIComponent(listTitle) + "')/items";
    var qs = [];
    if (params.select) qs.push('$select=' + encodeURIComponent(params.select));
    if (params.filter) qs.push('$filter=' + encodeURIComponent(params.filter));
    if (params.order) qs.push('$orderby=' + encodeURIComponent(params.order));
    qs.push('$top=5000');
    if (qs.length) url += '?' + qs.join('&');

    return fetch(url, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json;odata=nometadata' }
    }).then(function (res) {
      if (!res.ok) throw new Error('REST ' + res.status + ' for ' + listTitle);
      return res.json();
    }).then(function (json) { return json.value || []; });
  }

  function loadAllData(force) {
    if (!force) {
      var cached = readCache();
      if (cached) {
        state.data = cached;
        return Promise.resolve(state.data);
      }
    }

    var byLang = { de: {}, en: {} };
    var promises = [];

    SUPPORTED_LANGS.forEach(function (lang) {
      DATA_CFG.lists.forEach(function (cfg) {
        var p = restGet(cfg.list, {
          select: cfg.select,
          filter: "Language eq '" + lang + "'",
          order: cfg.order
        }).then(function (items) {
          if (cfg.isDictionary) {
            var dict = {};
            items.forEach(function (it) {
              var pair = cfg.map(it);
              if (pair && pair[0]) dict[pair[0]] = pair[1];
            });
            byLang[lang][cfg.key] = dict;
          } else if (cfg.single) {
            byLang[lang][cfg.key] = items.length ? cfg.map(items[0]) : null;
          } else {
            byLang[lang][cfg.key] = items.map(cfg.map);
          }
        }).catch(function (err) {
          console.warn('Load failed for ' + cfg.list + ' [' + lang + ']:', err.message);
          byLang[lang][cfg.key] = cfg.isDictionary ? {} : (cfg.single ? null : []);
        });
        promises.push(p);
      });
    });

    return Promise.all(promises).then(function () {
      state.data = byLang;
      global.AIHub.data = byLang;
      writeCache(byLang);
      return byLang;
    });
  }

  function readCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var box = JSON.parse(raw);
      if (!box || !box.t || (Date.now() - box.t) > CACHE_TTL_MS) return null;
      return box.data;
    } catch (e) { return null; }
  }
  function writeCache(data) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data: data })); } catch (e) {}
  }

  // -----------------------------
  // i18n helper
  // -----------------------------
  function t(key, fallback) {
    var dict = (state.data[state.lang] && state.data[state.lang].i18n) || {};
    if (dict[key] != null) return dict[key];
    return fallback != null ? fallback : key;
  }
  function langData(key) {
    return (state.data[state.lang] && state.data[state.lang][key]) || (Array.isArray(state.data[state.lang] && state.data[state.lang][key]) ? [] : []);
  }

  // -----------------------------
  // Rendering
  // -----------------------------
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function fmtDate(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso);
      if (isNaN(d)) return iso;
      var locale = state.lang === 'de' ? 'de-DE' : 'en-GB';
      return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return iso; }
  }

  function renderAll() {
    renderNav();
    renderHero();
    renderKPIs();
    renderNews();
    renderPromptOfWeek();
    renderAssessment();
    renderLearningPaths();
    renderUseCases();
    renderPrompts();
    renderResources();
    renderEvents();
    renderGovernance();
    renderSteering();
    renderFooter();
    renderLangSwitch();
    showSection(state.section);
  }

  function renderNav() {
    var nav = langData('nav') || [];
    var html = nav.map(function (n) {
      return '<div class="nav-item' + (n.id === state.section ? ' active' : '') +
        (n.restricted ? ' restricted' : '') + '" data-section="' + escapeHtml(n.id) + '">' +
        '<span class="emoji">' + escapeHtml(n.emoji || '•') + '</span>' +
        '<span>' + escapeHtml(n.label) + '</span></div>';
    }).join('');
    var el = document.getElementById('nav');
    if (el) {
      el.innerHTML = html;
      el.querySelectorAll('.nav-item').forEach(function (it) {
        it.addEventListener('click', function () { setSection(it.dataset.section); });
      });
    }
  }

  function renderHero() {
    setText('hero-pill', t('home.pill'));
    setHtml('hero-h1', t('home.h1a') + ' <span>' + escapeHtml(t('home.h1b')) + '</span>');
    setText('hero-subline', t('home.subline'));
    var search = document.getElementById('hero-search');
    if (search) search.placeholder = t('home.searchPlaceholder');
    setText('ceo-quote', t('home.ceoQuote'));
    setText('ceo-name', t('home.ceoName'));
    setText('ceo-title', t('home.ceoTitle'));
    setText('cta-title', t('home.ctaTitle'));
    setText('cta-sub', t('home.ctaSub'));
    setText('cta-btn', t('home.ctaBtn'));
    setText('section-news-title', t('home.navTitle', 'News'));
    setText('section-prompt-title', t('home.promptWeek', 'Prompt der Woche'));
    setText('section-kpi-title', t('home.kpiTitle', 'KPIs'));
  }

  function renderKPIs() {
    var kpis = langData('kpis') || [];
    var el = document.getElementById('kpis');
    if (!el) return;
    if (!kpis.length) { el.innerHTML = ''; return; }
    el.innerHTML = kpis.map(function (k) {
      return '<div class="kpi" style="border-color: ' + escapeHtml(k.color) + '40">' +
        '<div class="kpi-label">' + escapeHtml(k.label) + '</div>' +
        '<div class="kpi-value">' + escapeHtml(k.value) + '</div>' +
        '<div class="kpi-target">' + t('kpi.target', 'Ziel') + ': ' + escapeHtml(k.target) + '</div>' +
        '<div class="kpi-bar"><span style="width:' + Math.min(100, k.progress) + '%; background:' + escapeHtml(k.color) + '"></span></div>' +
        '</div>';
    }).join('');
  }

  function renderNews() {
    var news = langData('news') || [];
    var el = document.getElementById('news');
    if (!el) return;
    el.innerHTML = news.map(function (n) {
      return '<div class="card news-card' + (n.hot ? ' hot' : '') + '">' +
        '<div class="accent-bar" style="background:' + escapeHtml(n.color) + '"></div>' +
        '<div class="top"><span class="tag">' + escapeHtml(n.tag) + '</span>' +
        '<span class="date">' + escapeHtml(fmtDate(n.date)) + '</span></div>' +
        '<div class="title">' + escapeHtml(n.title) + '</div>' +
        '</div>';
    }).join('');
  }

  function renderPromptOfWeek() {
    var p = (state.data[state.lang] && state.data[state.lang].promptWeek) || null;
    var el = document.getElementById('prompt-week');
    if (!el) return;
    if (!p) { el.innerHTML = '<div class="empty-state">' + escapeHtml(t('empty.prompt', 'Kein Prompt verfügbar')) + '</div>'; return; }
    el.innerHTML = '<div class="card prompt-card">' +
      '<div class="top"><span class="tag">' + escapeHtml(p.category) + '</span>' +
      '<button class="copy-btn" data-copy>' + escapeHtml(t('btn.copy', 'Kopieren')) + '</button></div>' +
      '<div class="title">' + escapeHtml(p.title) + '</div>' +
      '<pre>' + escapeHtml(p.text) + '</pre></div>';
    var btn = el.querySelector('[data-copy]');
    if (btn) btn.addEventListener('click', function () {
      navigator.clipboard && navigator.clipboard.writeText(p.text).then(function () {
        btn.textContent = '✓';
        setTimeout(function () { btn.textContent = t('btn.copy', 'Kopieren'); }, 1500);
      });
    });
  }

  function renderAssessment() {
    var qs = langData('aq') || [];
    var el = document.getElementById('assessment');
    if (!el) return;
    if (!qs.length) { el.innerHTML = '<div class="empty-state">' + escapeHtml(t('empty.assessment', 'Keine Fragen')) + '</div>'; return; }
    var idx = state.assessment.current;
    if (idx >= qs.length) { renderAssessmentResult(qs); return; }
    var q = qs[idx];
    var html = '<div class="assessment-progress">' + (idx + 1) + ' / ' + qs.length + '</div>' +
      '<div class="question">' + escapeHtml(q.q) + '</div>' +
      '<div class="options">' +
      q.opts.map(function (o, i) {
        var checked = state.assessment.answers[idx] === i ? 'checked' : '';
        return '<label><input type="radio" name="aq-' + idx + '" value="' + i + '" ' + checked + '/>' +
          '<span>' + escapeHtml(o.label) + '</span></label>';
      }).join('') +
      '</div>' +
      '<div class="assessment-nav">' +
      '<button data-prev ' + (idx === 0 ? 'disabled' : '') + '>' + escapeHtml(t('btn.prev', 'Zurück')) + '</button>' +
      '<button data-next>' + escapeHtml(idx === qs.length - 1 ? t('btn.finish', 'Auswerten') : t('btn.next', 'Weiter')) + '</button>' +
      '</div>';
    el.innerHTML = html;
    el.querySelectorAll('input[type=radio]').forEach(function (r) {
      r.addEventListener('change', function () { state.assessment.answers[idx] = Number(r.value); });
    });
    var prev = el.querySelector('[data-prev]');
    var next = el.querySelector('[data-next]');
    if (prev) prev.addEventListener('click', function () { state.assessment.current = Math.max(0, idx - 1); renderAssessment(); });
    if (next) next.addEventListener('click', function () {
      if (state.assessment.answers[idx] == null) return;
      state.assessment.current = idx + 1;
      renderAssessment();
    });
  }

  function renderAssessmentResult(qs) {
    var el = document.getElementById('assessment');
    var total = 0;
    state.assessment.answers.forEach(function (ai, i) {
      if (qs[i] && qs[i].opts && qs[i].opts[ai]) total += qs[i].opts[ai].score;
    });
    var avg = total / qs.length;
    var levelKey = avg < 1 ? 'starter' : (avg < 2 ? 'pathseeker' : (avg < 3 ? 'transformer' : 'highperformer'));
    var levelLabel = t('assessment.level.' + levelKey, levelKey);
    el.innerHTML = '<div class="assessment-result">' +
      '<strong>' + escapeHtml(t('assessment.yourLevel', 'Dein Level')) + ': ' + escapeHtml(levelLabel) + '</strong>' +
      '<div style="margin-top:6px">' + escapeHtml(t('assessment.score', 'Score')) + ': ' + avg.toFixed(2) + ' / 3.00</div>' +
      '<div style="margin-top:10px;font-size:13px">' + escapeHtml(t('assessment.advice.' + levelKey, '')) + '</div>' +
      '</div>' +
      '<div class="assessment-nav"><button data-restart>' + escapeHtml(t('btn.restart', 'Neu starten')) + '</button></div>';
    el.querySelector('[data-restart]').addEventListener('click', function () {
      state.assessment = { current: 0, answers: [] };
      renderAssessment();
    });
  }

  function renderLearningPaths() {
    var paths = langData('learn') || [];
    var el = document.getElementById('learn');
    if (!el) return;
    el.innerHTML = paths.map(function (p) {
      return '<div class="card">' +
        '<div class="top"><span class="tag">' + escapeHtml(p.levelLabel || p.level) + '</span>' +
        '<span class="meta">' + escapeHtml(p.hours) + ' h</span></div>' +
        '<div class="title">' + escapeHtml(p.title) + '</div>' +
        '<div class="meta">' + escapeHtml(p.provider) + '</div>' +
        '<div class="desc">' + escapeHtml(p.description) + '</div>' +
        '</div>';
    }).join('');
  }

  function renderUseCases() {
    var ucs = langData('ucsData') || [];
    var filterEl = document.getElementById('uc-filters');
    var listEl = document.getElementById('use-cases');
    if (!filterEl || !listEl) return;

    var filters = [
      { id: 'all', label: t('ucs.filterAll', 'Alle') },
      { id: 'live', label: t('ucs.filterLive', 'Live') },
      { id: 'pilot', label: t('ucs.filterPilot', 'Pilot') },
      { id: 'backlog', label: t('ucs.filterBacklog', 'Backlog') }
    ];
    var current = filterEl.dataset.current || 'all';
    filterEl.innerHTML = filters.map(function (f) {
      return '<button data-filter="' + f.id + '"' + (f.id === current ? ' class="active"' : '') + '>' + escapeHtml(f.label) + '</button>';
    }).join('');
    filterEl.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        filterEl.dataset.current = b.dataset.filter;
        renderUseCases();
      });
    });

    var filtered = current === 'all' ? ucs : ucs.filter(function (u) { return u.st === current; });
    listEl.innerHTML = filtered.length ? filtered.map(function (u) {
      return '<div class="card uc-card" data-status="' + escapeHtml(u.st) + '" data-phase="' + escapeHtml(u.phase) + '">' +
        '<div class="badges">' +
        '<span class="badge-status ' + escapeHtml(u.st) + '">' + escapeHtml(t('ucs.status.' + u.st, u.st)) + '</span>' +
        '<span class="tag">' + escapeHtml(t('ucs.phase.' + u.phase, u.phase)) + '</span>' +
        '</div>' +
        '<div class="title">' + escapeHtml(u.title) + '</div>' +
        '<div class="meta">' + escapeHtml(u.dept) + '</div>' +
        '<div class="desc">' + escapeHtml(u.desc) + '</div>' +
        '<div style="display:flex; justify-content:space-between; gap:8px;">' +
        '<span class="impact ' + escapeHtml(u.impact) + '">' + escapeHtml(t('ucs.impact.' + u.impact, u.impact)) + '</span>' +
        '<span class="roi">' + escapeHtml(u.roi || '') + '</span>' +
        '</div></div>';
    }).join('') : '<div class="empty-state">' + escapeHtml(t('empty.useCases', 'Keine Einträge')) + '</div>';
  }

  function renderPrompts() {
    var prompts = langData('prompts') || [];
    var el = document.getElementById('prompts');
    if (!el) return;
    el.innerHTML = prompts.map(function (p) {
      return '<div class="card prompt-card">' +
        '<div class="top"><span class="tag">' + escapeHtml(p.category) + '</span>' +
        '<button class="copy-btn" data-text="' + encodeURIComponent(p.text) + '">' + escapeHtml(t('btn.copy', 'Kopieren')) + '</button></div>' +
        '<div class="title">' + escapeHtml(p.title) + '</div>' +
        '<pre>' + escapeHtml(p.text) + '</pre></div>';
    }).join('');
    el.querySelectorAll('.copy-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        navigator.clipboard && navigator.clipboard.writeText(decodeURIComponent(b.dataset.text)).then(function () {
          var prev = b.textContent; b.textContent = '✓';
          setTimeout(function () { b.textContent = prev; }, 1500);
        });
      });
    });
  }

  function renderResources() {
    var res = langData('resources') || [];
    var el = document.getElementById('resources');
    if (!el) return;
    el.innerHTML = res.map(function (r) {
      return '<div class="card">' +
        '<div class="accent-bar" style="background:' + escapeHtml(r.color) + '"></div>' +
        '<div class="top"><span style="font-size:24px">' + escapeHtml(r.emoji) + '</span>' +
        '<span class="tag">' + escapeHtml(r.source || '') + '</span></div>' +
        '<div class="title">' + escapeHtml(r.title) + '</div>' +
        '<div class="desc">' + escapeHtml(r.desc) + '</div>' +
        '</div>';
    }).join('');
  }

  function renderEvents() {
    var evs = langData('events') || [];
    var el = document.getElementById('events');
    if (!el) return;
    el.innerHTML = evs.map(function (e) {
      return '<div class="card event-card">' +
        '<div class="accent-bar" style="background:' + escapeHtml(e.color) + '"></div>' +
        '<div class="top"><span class="tag">' + escapeHtml(t('event.type.' + e.type, e.type)) + '</span></div>' +
        '<div class="title">' + escapeHtml(e.title) + '</div>' +
        '<div class="when"><strong>' + escapeHtml(fmtDate(e.date)) + '</strong>' +
        '<span>' + escapeHtml(e.time || '') + '</span>' +
        '<span>📍 ' + escapeHtml(e.location || '') + '</span></div>' +
        '</div>';
    }).join('');
  }

  function renderGovernance() {
    // Gov blocks
    var blocks = langData('govBlocks') || [];
    var blocksEl = document.getElementById('gov-blocks');
    if (blocksEl) {
      blocksEl.innerHTML = blocks.map(function (b) {
        return '<div class="gov-block">' +
          '<div class="icon">' + escapeHtml(b.icon) + '</div>' +
          '<h3>' + escapeHtml(b.title) + '</h3>' +
          '<p>' + escapeHtml(b.text) + '</p></div>';
      }).join('');
    }

    // FAQ
    var faq = langData('faq') || [];
    var faqEl = document.getElementById('gov-faq');
    if (faqEl) {
      faqEl.innerHTML = faq.map(function (f, i) {
        return '<div class="faq-item" data-idx="' + i + '">' +
          '<div class="q"><span>' + escapeHtml(f.q) + '</span><span class="chev">▾</span></div>' +
          '<div class="a">' + escapeHtml(f.a) + '</div></div>';
      }).join('');
      faqEl.querySelectorAll('.faq-item').forEach(function (it) {
        it.addEventListener('click', function () { it.classList.toggle('open'); });
      });
    }

    // Docs
    var docs = langData('docs') || [];
    var docsEl = document.getElementById('gov-docs');
    if (docsEl) {
      docsEl.innerHTML = docs.map(function (d) {
        return '<a class="card" href="' + escapeHtml(d.url) + '" target="_blank" rel="noopener">' +
          '<div class="top"><span style="font-size:22px">' + escapeHtml(d.icon) + '</span></div>' +
          '<div class="title">' + escapeHtml(d.title) + '</div></a>';
      }).join('');
    }

    // Roadmap
    var rm = langData('roadmap') || [];
    var rmEl = document.getElementById('gov-roadmap');
    if (rmEl) {
      rmEl.innerHTML = rm.map(function (r) {
        return '<div class="roadmap-item ' + escapeHtml(r.status) + '">' +
          '<span class="quarter">' + escapeHtml(r.quarter) + '</span>' +
          '<span>' + escapeHtml(r.title) + (r.milestone ? ' — ' + escapeHtml(r.milestone) : '') + '</span>' +
          '<span class="status">' + escapeHtml(t('roadmap.status.' + r.status, r.status)) + '</span></div>';
      }).join('');
    }
  }

  function renderSteering() {
    // Banner
    var banner = document.getElementById('restricted-banner');
    if (banner) {
      banner.innerHTML = '🔒 ' + escapeHtml(t('restrictedBanner', 'Zugriff beschränkt – nur Steering-Komitee.'));
    }

    // Risks table
    var risks = langData('risks') || [];
    var risksEl = document.getElementById('risks-table');
    if (risksEl) {
      var headers = [
        t('risks.col.title', 'Risiko'),
        t('risks.col.level', 'Level'),
        t('risks.col.owner', 'Owner'),
        t('risks.col.due', 'Fällig')
      ];
      risksEl.innerHTML = '<table class="risks-table">' +
        '<thead><tr>' + headers.map(function (h) { return '<th>' + escapeHtml(h) + '</th>'; }).join('') + '</tr></thead>' +
        '<tbody>' + risks.map(function (r) {
          return '<tr><td>' + escapeHtml(r.title) + '</td>' +
            '<td><span class="level ' + escapeHtml(r.level) + '">' + escapeHtml(t('risks.level.' + r.level, r.level)) + '</span></td>' +
            '<td>' + escapeHtml(r.owner || '') + '</td>' +
            '<td>' + escapeHtml(fmtDate(r.due)) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }

    // Phases
    var phases = langData('phases') || [];
    var phasesEl = document.getElementById('phases');
    if (phasesEl) {
      phasesEl.innerHTML = phases.map(function (p) {
        var done = p.status === 'done' ? ' done' : '';
        var active = p.status === 'active' ? ' active' : '';
        return '<div class="phase-card' + done + active + '">' +
          '<div class="phase-head"><strong>' + escapeHtml(p.name) + '</strong>' +
          '<span class="budget">' + escapeHtml(p.budget != null ? formatBudget(p.budget) : '') + '</span></div>' +
          '<div class="meta">' + escapeHtml(t('phases.status.' + p.status, p.status)) + ' · ' + p.progress + '%</div>' +
          '<div class="progress-bar"><span style="width:' + Math.min(100, p.progress) + '%"></span></div>' +
          '<ul>' + (p.items || []).map(function (it) { return '<li>' + escapeHtml(it) + '</li>'; }).join('') + '</ul>' +
          '</div>';
      }).join('');
    }

    // Steering KPIs
    var stkpis = langData('stkpis') || [];
    var stEl = document.getElementById('steering-kpis');
    if (stEl) {
      stEl.innerHTML = stkpis.map(function (k) {
        return '<div class="kpi" style="border-color:' + escapeHtml(k.color) + '40">' +
          '<div class="kpi-label">' + escapeHtml(k.label) + '</div>' +
          '<div class="kpi-value">' + escapeHtml(k.value) + '</div>' +
          '<div class="kpi-target">' + t('kpi.target', 'Ziel') + ': ' + escapeHtml(k.target) + '</div>' +
          '<div class="kpi-bar"><span style="width:' + Math.min(100, k.progress) + '%; background:' + escapeHtml(k.color) + '"></span></div>' +
          (k.trend ? '<div class="kpi-trend">' + escapeHtml(k.trend) + '</div>' : '') +
          '</div>';
      }).join('');
    }
  }

  function formatBudget(v) {
    var n = Number(v);
    if (isNaN(n)) return v;
    var locale = state.lang === 'de' ? 'de-DE' : 'en-GB';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  }

  function renderFooter() {
    setText('footer', t('footer'));
  }

  function renderLangSwitch() {
    var el = document.getElementById('lang-switch');
    if (!el) return;
    el.innerHTML = SUPPORTED_LANGS.map(function (l) {
      return '<button data-lang="' + l + '"' + (l === state.lang ? ' class="active"' : '') + '>' + l.toUpperCase() + '</button>';
    }).join('');
    el.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.dataset.lang); });
    });
  }

  // -----------------------------
  // State transitions
  // -----------------------------
  function setLang(lang) {
    if (SUPPORTED_LANGS.indexOf(lang) < 0) return;
    state.lang = lang;
    state.assessment = { current: 0, answers: [] };
    var url = new URL(global.location.href);
    url.searchParams.set('lang', lang);
    history.replaceState(null, '', url.toString());
    renderAll();
  }

  function setSection(id) {
    state.section = id;
    renderNav();
    showSection(id);
  }

  function showSection(id) {
    document.querySelectorAll('.section').forEach(function (s) {
      s.classList.toggle('active', s.dataset.section === id);
    });
  }

  // -----------------------------
  // DOM helpers
  // -----------------------------
  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value || '';
  }
  function setHtml(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html || '';
  }

  function showError(msg) {
    var root = document.getElementById('app-root');
    if (!root) return;
    root.innerHTML = '<div class="error-box"><strong>AI Hub:</strong> ' + escapeHtml(msg) + '</div>';
  }

  // -----------------------------
  // Boot
  // -----------------------------
  function boot() {
    var params = new URLSearchParams(global.location.search);
    var lang = params.get('lang');
    if (lang && SUPPORTED_LANGS.indexOf(lang) >= 0) state.lang = lang;
    var section = params.get('section');
    if (section) state.section = section;

    var loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = '';

    loadAllData(false).then(function () {
      if (loadingEl) loadingEl.style.display = 'none';
      var shell = document.getElementById('app-shell');
      if (shell) shell.style.display = '';
      renderAll();
    }).catch(function (err) {
      console.error(err);
      showError('Daten konnten nicht geladen werden — sind die SharePoint-Listen provisioniert? (' + err.message + ')');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : this);
