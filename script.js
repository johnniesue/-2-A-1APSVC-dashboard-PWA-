/*
  header-behavior.js
  - Handles tab activation, keyboard navigation, deep-linking, persistence, search debounce and inbox count updating.
  - Drop into your project (e.g. /header-behavior.js) and include after /script.js in index.html.
*/
(function () {
  const STORAGE_KEY = 'a1_active_tab';
  const INBOX_COUNT_ENDPOINT = null; // <-- set to your API endpoint or Firebase route if available, e.g. '/api/inbox/count'
  const INBOX_POLL_MS = 60000; // poll interval for inbox count; ignored if INBOX_COUNT_ENDPOINT === null

  // small debounce with fallback to A1Dashboard static debounce or instance constructor debounce if available
  function debounce(fn, wait = 250) {
    // Try class static method A1Dashboard.debounce
    if (window.A1Dashboard && typeof window.A1Dashboard.debounce === 'function') {
      return window.A1Dashboard.debounce(fn, wait);
    }
    // Try instance constructor if the instance was attached as window.a1Dashboard
    if (window.a1Dashboard && window.a1Dashboard.constructor && typeof window.a1Dashboard.constructor.debounce === 'function') {
      return window.a1Dashboard.constructor.debounce(fn, wait);
    }
    // Fallback local debounce
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function onReady(fn) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(fn, 0);
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  onReady(() => {
    let tabs = Array.from(document.querySelectorAll('.tab'));
    const tablist = document.querySelector('[role="tablist"]');
    const inboxBadge = document.getElementById('inboxBadge');
    const searchInput = document.getElementById('globalSearch');
    const newBtn = document.getElementById('newBtn');

    if (!tabs.length || !tablist) {
      // nothing to wire
      return;
    }

    // Utility: slugify for panel ids
    function slugify(str) {
      return String(str).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
    }

    // Activate a tab element and update ARIA + classes + hash + storage
    function activateTab(targetTab, opts = {}) {
      if (!targetTab) return;
      tabs.forEach(t => {
        const isTarget = t === targetTab;
        t.classList.toggle('active', isTarget);
        t.setAttribute('aria-selected', isTarget ? 'true' : 'false');
        // manage tabindex for proper keyboard navigation
        t.setAttribute('tabindex', isTarget ? '0' : '-1');
        if (isTarget && opts.focus !== false) {
          try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); }
        }
      });

      const name = (targetTab.dataset.tab || targetTab.textContent || '').trim();

      // Update hash for deep link (format: #tab=Name)
      try {
        const encoded = encodeURIComponent(name);
        if (history && history.replaceState) {
          const url = new URL(window.location.href);
          url.hash = `tab=${encoded}`;
          history.replaceState(null, '', url.toString());
        } else {
          location.hash = `tab=${encodeURIComponent(name)}`;
        }
      } catch (e) {
        location.hash = `tab=${encodeURIComponent(name)}`;
      }

      // persist
      try {
        localStorage.setItem(STORAGE_KEY, name);
      } catch (e) { /* ignore */ }

      // Hook: show/hide content panels
      // If you implement panels, use ids like "panel-<slugified-name>" and toggle them here.
      // Default behavior: attempt to show element with id `panel-<slug>` and hide siblings with [role="tabpanel"]
      const panelId = `panel-${slugify(name)}`;
      const panel = document.getElementById(panelId);
      if (panel) {
        // hide other panels
        const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
        panels.forEach(p => {
          if (p.id === panelId) {
            p.hidden = false;
            p.setAttribute('aria-hidden', 'false');
          } else {
            p.hidden = true;
            p.setAttribute('aria-hidden', 'true');
          }
        });
      } else if (window.dashboardIntegration && typeof window.dashboardIntegration.showPanelFor === 'function') {
        // call integration hook if panels are managed there
        try { window.dashboardIntegration.showPanelFor(name); } catch (e) { /* ignore */ }
      } else {
        // default hook: log
        console.log('Activated tab:', name);
      }
    }

    function activateTabByName(name) {
      if (!name) return;
      const normalized = (name || '').trim().toLowerCase();
      const target = tabs.find(t => ((t.dataset.tab || t.textContent || '').trim().toLowerCase() === normalized));
      if (target) activateTab(target);
    }

    // Initialize active tab from hash -> localStorage -> first tab
    function initActiveTab() {
      let nameFromHash = null;
      try {
        if (location.hash) {
          const h = location.hash.replace(/^#/, '');
          const m = h.match(/(?:^|&)tab=([^&]+)/);
          if (m) nameFromHash = decodeURIComponent(m[1]);
        }
      } catch (e) { /* ignore */ }

      const stored = (() => {
        try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
      })();

      if (nameFromHash) {
        activateTabByName(nameFromHash);
      } else if (stored) {
        activateTabByName(stored);
      } else {
        activateTab(tabs[0], { focus: false });
      }
    }

    // Click handler for tabs
    function onTabClick(e) {
      const t = e.currentTarget;
      activateTab(t);
      const name = (t.dataset.tab || t.textContent || '').trim();
      if (name === 'Inbox' && inboxBadge) {
        inboxBadge.style.display = 'none';
      }

      // Optionally route or open pages:
      // if (name === 'Customers') { location.href = '/customers.html'; }
    }

    // Key handling on each tab for Enter/Space activation + Arrow/Home/End
    function onTabKeyDown(e) {
      const key = e.key;
      const currentIndex = tabs.indexOf(e.currentTarget);

      if (key === 'Enter' || key === ' ') {
        e.preventDefault();
        activateTab(e.currentTarget);
        return;
      }
      if (key === 'ArrowRight') {
        e.preventDefault();
        const next = (currentIndex + 1) % tabs.length;
        tabs[next].focus();
        return;
      }
      if (key === 'ArrowLeft') {
        e.preventDefault();
        const prev = (currentIndex - 1 + tabs.length) % tabs.length;
        tabs[prev].focus();
        return;
      }
      if (key === 'Home') {
        e.preventDefault();
        tabs[0].focus();
        return;
      }
      if (key === 'End') {
        e.preventDefault();
        tabs[tabs.length - 1].focus();
        return;
      }
    }

    function attachTabListeners() {
      tabs.forEach(t => {
        t.setAttribute('tabindex', t.classList.contains('active') ? '0' : '-1');
        t.addEventListener('click', onTabClick);
        t.addEventListener('keydown', onTabKeyDown);
      });

      // When focus moves inside the tablist, make the focused tab tabbable
      tablist.addEventListener('focusin', (e) => {
        const focusedTab = e.target.closest('.tab');
        if (!focusedTab) return;
        tabs.forEach(t => t.setAttribute('tabindex', t === focusedTab ? '0' : '-1'));
      });

      // Fallback navigation when focus may be on the tablist itself
      tablist.addEventListener('keydown', (e) => {
        const key = e.key;
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) {
          const activeIndex = tabs.findIndex(t => t.classList.contains('active'));
          if (key === 'ArrowRight') {
            e.preventDefault();
            const next = (activeIndex + 1) % tabs.length;
            tabs[next].focus();
          } else if (key === 'ArrowLeft') {
            e.preventDefault();
            const prev = (activeIndex - 1 + tabs.length) % tabs.length;
            tabs[prev].focus();
          } else if (key === 'Home') {
            e.preventDefault();
            tabs[0].focus();
          } else if (key === 'End') {
            e.preventDefault();
            tabs[tabs.length - 1].focus();
          }
        }
      });
    }

    // Debounced search example (replace with your search implementation)
    if (searchInput) {
      const doSearch = debounce((value) => {
        if (window.dashboardIntegration && typeof window.dashboardIntegration.filterDashboard === 'function') {
          try { window.dashboardIntegration.filterDashboard(value); } catch (e) { console.debug(e); }
        } else {
          console.log('Search term (debounced):', value);
        }
      }, 300);

      searchInput.addEventListener('input', (e) => doSearch(e.target.value));
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          // trigger immediate search
          if (window.dashboardIntegration && typeof window.dashboardIntegration.filterDashboard === 'function') {
            try { window.dashboardIntegration.filterDashboard(searchInput.value); } catch (err) { console.debug(err); }
          } else {
            console.log('Search (enter):', searchInput.value);
          }
        }
      });
    }

    // Inbox count fetch example (placeholder) — replace INBOX_COUNT_ENDPOINT with your endpoint or Firebase hook
    async function fetchInboxCount() {
      if (!inboxBadge || !INBOX_COUNT_ENDPOINT) return;
      try {
        const res = await fetch(INBOX_COUNT_ENDPOINT, { cache: 'no-cache' });
        if (!res.ok) throw new Error('Network response not ok');
        const json = await res.json();
        const count = Number(json.count || 0);
        if (count > 0) {
          inboxBadge.textContent = String(count);
          inboxBadge.style.display = '';
        } else {
          inboxBadge.style.display = 'none';
        }
      } catch (err) {
        console.debug('fetchInboxCount failed', err);
      }
    }

    // refreshTabs for dynamic content
    function refreshTabs() {
      tabs.forEach(t => {
        t.removeEventListener('click', onTabClick);
        t.removeEventListener('keydown', onTabKeyDown);
      });
      tabs = Array.from(document.querySelectorAll('.tab'));
      attachTabListeners();
    }

    // Init behavior
    attachTabListeners();
    initActiveTab();

    // optional inbox polling
    if (INBOX_COUNT_ENDPOINT) {
      fetchInboxCount();
      setInterval(fetchInboxCount, INBOX_POLL_MS);
    }

    // Public API
    window.a1Tabs = {
      activateTabByName,
      refreshTabs,
      fetchInboxCount,
      activateTab: (nameOrElement) => {
        if (!nameOrElement) return;
        if (typeof nameOrElement === 'string') return activateTabByName(nameOrElement);
        if (nameOrElement instanceof Element) return activateTab(nameOrElement);
      }
    };

    // Wire New button to dashboard notification or your create flow
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        if (window.a1Dashboard && typeof window.a1Dashboard.showNotification === 'function') {
          window.a1Dashboard.showNotification('Create a new item (implement your flow).', 'info');
        } else {
          alert('Create a new item (implement your flow).');
        }
      });
    }

    // Expose openApps as before
    window.openApps = function () {
      if (window.dashboardIntegration && typeof window.dashboardIntegration.openApps === 'function') {
        try { return window.dashboardIntegration.openApps(); } catch (e) { /* ignore */ }
      }
      alert('Open apps menu (implement as needed).');
    };

    console.log('header-behavior initialized');
  });
})();
