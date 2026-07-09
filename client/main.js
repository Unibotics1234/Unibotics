// ════════════════════════════════════════════════════════════════════════════
//  Unibotics — main.js  (API-connected version)
// ════════════════════════════════════════════════════════════════════════════

const API = '';

// ── Token helpers ─────────────────────────────────────────────────────────────
function getToken()   { return sessionStorage.getItem('ub_token'); }
function setToken(t)  { sessionStorage.setItem('ub_token', t); }
function removeToken(){ sessionStorage.removeItem('ub_token'); }
function setUser(u)   { sessionStorage.setItem('ub_user', JSON.stringify(u)); }
function getUser()    { try { return JSON.parse(sessionStorage.getItem('ub_user')); } catch { return null; } }
function removeUser() { sessionStorage.removeItem('ub_user'); }
function isLoggedIn() { return !!getToken(); }
function isAdmin()    { const u = getUser(); return u && u.role === 'admin'; }

// ── Generic fetch wrapper ─────────────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res  = await fetch(API + endpoint, { ...options, headers });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

// ── Toast helper ──────────────────────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

// ════════════════════════════════════════════════════════════════════════════
//  ACTIVE NAV LINK
// ════════════════════════════════════════════════════════════════════════════
(function () {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a, .mobile-nav a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
})();

// ════════════════════════════════════════════════════════════════════════════
//  MOBILE MENU
// ════════════════════════════════════════════════════════════════════════════
(function () {
  const btn = document.querySelector('.menu-btn');
  const nav = document.querySelector('.mobile-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => nav.classList.toggle('open'));
})();

// ════════════════════════════════════════════════════════════════════════════
//  HERO CAROUSEL
// ════════════════════════════════════════════════════════════════════════════
(function () {
  const slides = document.querySelectorAll('.hero-bg');
  const dots   = document.querySelectorAll('.hero-dots button');
  if (!slides.length) return;
  let i = 0;
  function show(n) {
    slides.forEach((s, k) => s.classList.toggle('active', k === n));
    dots.forEach((d, k)   => d.classList.toggle('active', k === n));
    i = n;
  }
  show(0);
  dots.forEach((d, k) => d.addEventListener('click', () => show(k)));
  setInterval(() => show((i + 1) % slides.length), 5000);
})();

// ════════════════════════════════════════════════════════════════════════════
//  AUTH TAB SWITCHING
// ════════════════════════════════════════════════════════════════════════════
(function () {
  document.querySelectorAll('.auth-tabs').forEach(tabs => {
    const btns = tabs.querySelectorAll('.auth-tab');
    btns.forEach(b => {
      b.addEventListener('click', () => {
        btns.forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        const target = b.getAttribute('data-target');
        document.querySelectorAll('[data-pane]').forEach(p => {
          p.classList.toggle('hidden', p.getAttribute('data-pane') !== target);
        });
      });
    });
  });
})();

// ════════════════════════════════════════════════════════════════════════════
//  SOLO / TEAM TOGGLE
// ════════════════════════════════════════════════════════════════════════════
(function () {
  document.querySelectorAll('.toggle-pill').forEach(pill => {
    const btns = pill.querySelectorAll('button');
    btns.forEach(b => {
      b.addEventListener('click', () => {
        btns.forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        const target = b.getAttribute('data-toggle');
        document.querySelectorAll('[data-toggle-pane]').forEach(p => {
          p.classList.toggle('hidden', p.getAttribute('data-toggle-pane') !== target);
        });
      });
    });
  });
})();

// ════════════════════════════════════════════════════════════════════════════
//  CONTACT FORM — requires login
// ════════════════════════════════════════════════════════════════════════════
(function () {
  const form   = document.getElementById('contact-form');
  const prompt = document.getElementById('contact-login-prompt');
  if (!form) return;

  if (!isLoggedIn()) {
    form.classList.add('hidden');
    if (prompt) prompt.classList.remove('hidden');
    return;
  }

  const user = getUser();
  if (user) {
    const nameEl  = document.getElementById('name');
    const emailEl = document.getElementById('email');
    if (nameEl  && !nameEl.value)  nameEl.value  = user.name  || '';
    if (emailEl && !emailEl.value) emailEl.value = user.email || '';
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled    = true;
    btn.textContent = 'Sending…';
    const body = {
      name:  document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      org:   document.getElementById('org') ? document.getElementById('org').value.trim() : '',
      msg:   document.getElementById('msg').value.trim()
    };
    try {
      const { ok, data } = await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      showToast(data.message || (ok ? 'Message sent!' : 'Something went wrong.'));
      if (ok) form.reset();
    } catch {
      showToast('Network error. Please try again.');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Send message';
    }
  });
})();

// ════════════════════════════════════════════════════════════════════════════
//  JOIN FORM
// ════════════════════════════════════════════════════════════════════════════
(function () {
  const form = document.getElementById('join-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled    = true;
    btn.textContent = 'Submitting…';
    const fd   = new FormData(form);
    const body = {};
    fd.forEach((v, k) => { body[k] = v; });
    try {
      const { ok, data } = await apiFetch('/api/join', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      showToast(data.message || (ok ? 'Application submitted!' : 'Something went wrong.'));
      if (ok) form.reset();
    } catch {
      showToast('Network error. Please try again.');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Submit registration';
    }
  });
})();

// ════════════════════════════════════════════════════════════════════════════
//  AUTH FORMS
// ════════════════════════════════════════════════════════════════════════════
(function () {
  document.querySelectorAll('form[data-auth]').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const type = form.getAttribute('data-auth');
      const btn  = form.querySelector('button[type="submit"]');
      btn.disabled = true;

      const fd   = new FormData(form);
      const body = {};
      fd.forEach((v, k) => { body[k] = v; });

      if (body.password && body.confirm && body.password !== body.confirm) {
        showToast('Passwords do not match.');
        btn.disabled = false;
        return;
      }

      let endpoint = '';
      if (type === 'user-login')                                         endpoint = '/api/auth/login';
      else if (type === 'user-register-solo' || type === 'user-register-team') endpoint = '/api/auth/register';
      else if (type === 'admin-login')                                   endpoint = '/api/auth/admin-login';
      else if (type === 'admin-register')                                endpoint = '/api/auth/admin-register';

      if (type === 'user-register-team') body.registrationType = 'team';

      try {
        const { ok, data } = await apiFetch(endpoint, {
          method: 'POST',
          body: JSON.stringify(body)
        });

        showToast(data.message || (ok ? 'Done!' : 'Error. Please try again.'));

        if (ok && data.token) {
          setToken(data.token);
          setUser(data.user);
          setTimeout(() => {
            window.location.href = data.user.role === 'admin'
              ? 'admin-dashboard.html'
              : 'account.html';
          }, 1000);
        } else if (!ok) {
          form.reset();
        }
      } catch {
        showToast('Network error. Please check your connection.');
      } finally {
        btn.disabled = false;
      }
    });
  });
})();

// ════════════════════════════════════════════════════════════════════════════
//  ADMIN ACCESS REQUEST FORM
// ════════════════════════════════════════════════════════════════════════════
(function () {
  const form = document.getElementById('admin-request-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    const fd   = new FormData(form);
    const body = {};
    fd.forEach((v, k) => { body[k] = v; });
    try {
      const { ok, data } = await apiFetch('/api/auth/admin-register', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      showToast(data.message || (ok ? 'Request submitted.' : 'Something went wrong.'));
      if (ok && data.token) {
        setToken(data.token);
        setUser(data.user);
        setTimeout(() => { window.location.href = 'account.html'; }, 1500);
      }
      if (ok) form.reset();
    } catch {
      showToast('Network error. Please try again.');
    } finally {
      btn.disabled = false;
    }
  });
})();

// ════════════════════════════════════════════════════════════════════════════
//  LOGOUT
// ════════════════════════════════════════════════════════════════════════════
(function () {
  document.querySelectorAll('[data-action="logout"]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      removeToken();
      removeUser();
      window.location.href = 'login.html';
    });
  });
})();

// ════════════════════════════════════════════════════════════════════════════
//  PASSWORD VISIBILITY TOGGLE
// ════════════════════════════════════════════════════════════════════════════
(function () {
  document.querySelectorAll('input[type="password"]').forEach(input => {
    const wrap = document.createElement('div');
    wrap.className = 'pw-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    const btn = document.createElement('button');
    btn.type      = 'button';
    btn.className = 'pw-toggle';
    btn.innerHTML = '👁';
    btn.setAttribute('aria-label', 'Toggle password visibility');
    wrap.appendChild(btn);
    btn.addEventListener('click', () => {
      const isHidden = input.type === 'password';
      input.type    = isHidden ? 'text' : 'password';
      btn.innerHTML = isHidden ? '🙈' : '👁';
    });
  });
})();

// ════════════════════════════════════════════════════════════════════════════
//  COURSES PAGE
// ════════════════════════════════════════════════════════════════════════════
(function () {
  const grid      = document.getElementById('grid');
  const filtersEl = document.getElementById('filters');
  const searchEl  = document.getElementById('search');
  if (!grid || !filtersEl) return;

  const CATEGORIES = ['All', 'AI', 'Data', 'Cloud', 'Security', 'Software', 'Emerging'];
  let allCourses   = [];
  let currentCat   = 'All';

  CATEGORIES.forEach(cat => {
    const b = document.createElement('button');
    b.textContent = cat;
    if (cat === 'All') b.classList.add('active');
    b.addEventListener('click', () => {
      document.querySelectorAll('.filters button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      currentCat = cat;
      renderGrid();
    });
    filtersEl.appendChild(b);
  });

  function renderGrid() {
    const q = searchEl ? searchEl.value.toLowerCase() : '';
    const filtered = allCourses.filter(c =>
      (currentCat === 'All' || c.category === currentCat) &&
      c.title.toLowerCase().includes(q)
    );
    grid.innerHTML = filtered.length
      ? filtered.map(c => `
          <div class="card">
            <div class="icon">${c.icon || '📡'}</div>
            <span class="badge">${c.category}</span>
            <h3>${c.title}</h3>
            <p>${c.description}</p>
            <button class="btn" data-enroll-id="${c._id}" data-enroll-title="${c.title}">Enroll Now</button>
          </div>`).join('')
      : '<p style="color:var(--muted)">No courses found.</p>';

    grid.querySelectorAll('[data-enroll-id]').forEach(btn => {
      btn.addEventListener('click', () => enrollInCourse(btn.getAttribute('data-enroll-id'), btn));
    });
  }

  async function enrollInCourse(courseId, btn) {
    if (!isLoggedIn()) {
      showToast('Please log in to enroll.');
      setTimeout(() => { window.location.href = 'login.html'; }, 1000);
      return;
    }
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = 'Enrolling…';
    const { ok, data } = await apiFetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ courseId })
    });
    showToast(data.message || (ok ? 'Enrolled successfully!' : 'Enrollment failed.'));
    if (ok) {
      btn.textContent = 'Enrolled ✓';
      setTimeout(() => { window.location.href = 'account.html'; }, 1200);
    } else {
      btn.disabled    = false;
      btn.textContent = originalText;
    }
  }

  if (searchEl) searchEl.addEventListener('input', renderGrid);

  apiFetch('/api/courses').then(({ ok, data }) => {
    if (ok) {
      allCourses = data.data || [];
      renderGrid();
    } else {
      grid.innerHTML = '<p>Failed to load courses. Please refresh.</p>';
    }
  }).catch(() => {
    grid.innerHTML = '<p>Network error loading courses.</p>';
  });
})();

// ════════════════════════════════════════════════════════════════════════════
//  SITE-WIDE SESSION-AWARE NAV
//  Must be last — reads sessionStorage directly, no helper dependency.
//  Script loads at bottom of <body> so DOM is already fully parsed.
// ════════════════════════════════════════════════════════════════════════════
;(function () {
  var token   = sessionStorage.getItem('ub_token');
  var userRaw = sessionStorage.getItem('ub_user');
  if (!token || !userRaw) return;

  var user;
  try { user = JSON.parse(userRaw); } catch (e) { return; }
  if (!user) return;

  var firstName = user.name ? user.name.split(' ')[0] : 'Account';
  var dashHref  = user.role === 'admin' ? 'admin-dashboard.html' : 'account.html';
  var dashLabel = user.role === 'admin' ? '⚡ Admin' : '👤 ' + firstName;

  document.querySelectorAll('.nav').forEach(function (nav) {
    if (nav.querySelector('[data-dash-link]')) return;

    nav.querySelectorAll('a[href="login.html"]').forEach(function (a) {
      a.style.display = 'none';
    });

    var pill = document.createElement('a');
    pill.setAttribute('href', dashHref);
    pill.setAttribute('data-dash-link', '1');
    pill.textContent = dashLabel;
    pill.style.cssText = 'padding:7px 16px;border-radius:999px;background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#fff;font-weight:700;font-size:.85rem;text-decoration:none;display:inline-flex;align-items:center;gap:6px;';
    nav.appendChild(pill);
  });

  document.querySelectorAll('.mobile-nav a[href="login.html"]').forEach(function (a) {
    a.textContent = '👤 My Account';
    a.setAttribute('href', 'account.html');
  });

  if (user.role === 'admin') {
    document.querySelectorAll('.mobile-nav a[href="admin-login.html"]').forEach(function (a) {
      a.textContent = '⚡ Admin Dashboard';
      a.setAttribute('href', 'admin-dashboard.html');
    });
  }
})();