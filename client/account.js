// ════════════════════════════════════════════════════════════════════════════
//  Unibotics — account.js
// ════════════════════════════════════════════════════════════════════════════

(function () {
  if (!isLoggedIn()) { window.location.href = 'login.html'; return; }
})();



// ── Open / close settings drawer ─────────────────────────────────────────────
function openSettings() {
  const user = getUser();
  document.getElementById('s-name').value    = user.name  || '';
  document.getElementById('s-phone').value   = document.getElementById('acc-phone-data')?.textContent || '';
  document.getElementById('s-country').value = '';
  document.getElementById('s-study').value   = '';

  // Load full profile to pre-fill country + study level
  apiFetch('/api/user/profile').then(({ ok, data }) => {
    if (ok && data.data) {
      document.getElementById('s-phone').value   = data.data.phone   || '';
      document.getElementById('s-country').value = data.data.country || '';
      if (data.data.studyLevel) document.getElementById('s-study').value = data.data.studyLevel;
      selectedAvatar = data.data.avatar || null;
      renderAvatarGrid();
    }
  });

  document.getElementById('settings-overlay').style.display = 'block';
  document.getElementById('settings-drawer').style.right    = '0';
}

function closeSettings() {
  document.getElementById('settings-overlay').style.display = 'none';
  document.getElementById('settings-drawer').style.right    = '-420px';
}

window.openSettings  = openSettings;
window.closeSettings = closeSettings;

// ── Update avatar display ───────────────────────────────────────────────────
function updateAvatarDisplay(name) {
  const el = document.getElementById('acc-avatar');
  if (!el) return;
  el.textContent    = name ? name.trim().charAt(0).toUpperCase() : 'U';
  el.style.fontSize = '1.5rem';
}

// ── Settings — save profile ───────────────────────────────────────────────────
(function () {
  const form = document.getElementById('settings-profile-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;

    const body = {
      name:       document.getElementById('s-name').value.trim(),
      phone:      document.getElementById('s-phone').value.trim(),
      country:    document.getElementById('s-country').value.trim(),
      studyLevel: document.getElementById('s-study').value || null,
     
    };

    const { ok, data } = await apiFetch('/api/users/profile', {
  method: 'PUT',   // ← must match the route definition
  body: JSON.stringify(body)
});

    showToast(data.message || (ok ? 'Profile updated.' : 'Update failed.'));

    if (ok && data.data) {
      const updated = { ...getUser(), name: data.data.name };
      setUser(updated);
      document.getElementById('acc-greeting').textContent =
        `Welcome back, ${data.data.name.split(' ')[0]}.`;
      updateAvatarDisplay(data.data.avatar);
    }

    btn.disabled = false;
  });
})();

// ── Settings — change password ────────────────────────────────────────────────
(function () {
  const form = document.getElementById('settings-password-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;

    const body = {
      currentPassword: document.getElementById('s-current-pw').value,
      newPassword:     document.getElementById('s-new-pw').value,
      confirmPassword: document.getElementById('s-confirm-pw').value
    };

   const { ok, data } = await apiFetch('/api/auth/change-password', {
  method: 'POST',
  body: JSON.stringify({
    currentPassword: document.getElementById('s-current-pw').value,
    newPassword:     document.getElementById('s-new-pw').value,
    confirmPassword: document.getElementById('s-confirm-pw').value
  })
});

    showToast(data.message || (ok ? 'Password changed.' : 'Failed.'));
    if (ok) form.reset();
    btn.disabled = false;
  });
})();

// ── Main profile load ─────────────────────────────────────────────────────────
(function () {
  const user = getUser();
  if (!user) return;

  const firstName = user.name?.split(' ')[0] || 'there';
  document.getElementById('acc-greeting').textContent  = `Welcome back, ${firstName}.`;
  document.getElementById('acc-role-line').textContent = user.role === 'admin'
    ? 'Unibotics administrator' : 'Unibotics member';
  document.getElementById('stat-role').textContent = user.role === 'admin' ? 'Admin' : 'User';

  apiFetch('/api/user/profile').then(({ ok, data }) => {
    if (!ok || !data.data) return;
    const p = data.data;
    if (p.createdAt) {
      document.getElementById('stat-since').textContent =
        new Date(p.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    }
    updateAvatarDisplay(p.avatar);
  });
})();

// ── My courses (auto-refreshable) ────────────────────────────────────────────
async function loadMyOrders() {
  const container = document.getElementById('my-orders');
  const emptyMsg  = document.getElementById('orders-empty');
  if (!container) return;

  const { ok, data } = await apiFetch('/api/orders/my');
  if (!ok) return;

  const orders = data.data || [];
  document.getElementById('stat-enrollments').textContent = orders.length;
  emptyMsg.classList.toggle('hidden', orders.length > 0);

  container.innerHTML = orders.map(o => `
    <div class="card" style="padding:16px;display:flex;align-items:center;justify-content:space-between;gap:12px">
      <div>
        <strong>${o.course ? (o.course.icon || '📡') + ' ' + o.course.title : 'Course unavailable'}</strong>
        <div style="font-size:.82rem;color:var(--muted);margin-top:4px">
          Status: <span style="font-weight:700;color:${
            o.status === 'confirmed' ? '#0a7a3f' :
            o.status === 'cancelled' ? '#b8123f' : '#92660a'
          }">${o.status.charAt(0).toUpperCase() + o.status.slice(1)}</span>
        </div>
      </div>
      ${o.status === 'confirmed' && o.course
        ? `<a class="btn" href="course-view.html?courseId=${o.course._id}" style="white-space:nowrap;padding:8px 14px;font-size:.82rem">Go to course →</a>`
        : o.status === 'pending'
        ? `<span style="font-size:.8rem;color:var(--muted);text-align:right">Awaiting<br>confirmation</span>`
        : ''}
    </div>
  `).join('');
}

// ── My messages (with admin replies) ─────────────────────────────────────────
async function loadMyMessages() {
  const container = document.getElementById('my-messages');
  const emptyMsg  = document.getElementById('messages-empty-user');
  if (!container) return;

  const { ok, data } = await apiFetch('/api/contact/my');
  if (!ok) return;

  const messages = data.data || [];
  if (emptyMsg) emptyMsg.classList.toggle('hidden', messages.length > 0);

  container.innerHTML = messages.map(m => `
  <div class="card" style="padding:18px">
    <div style="font-size:.78rem;color:var(--muted);margin-bottom:6px">
      ${new Date(m.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
    </div>
    <p style="margin:0 0 10px;font-weight:600">${escapeHtml(m.message)}</p>
    ${m.replies && m.replies.length ? `
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
        <p style="font-size:.78rem;font-weight:800;color:var(--primary);margin:0 0 8px">REPLY FROM UNIBOTICS</p>
        ${m.replies.map(r => `
          <div style="background:var(--secondary);border-radius:10px;padding:10px 14px;margin-bottom:6px">
            <p style="margin:0;font-size:.9rem">${escapeHtml(r.message)}</p>
            <p style="margin:4px 0 0;font-size:.75rem;color:var(--muted)">
              ${new Date(r.sentAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
            </p>
          </div>
        `).join('')}
        <p style="margin:10px 0 0;font-size:.82rem;color:var(--muted)">
          Want to continue the conversation? Reach us directly at 
          <a href="mailto:directorunibotics@gmail.com" style="color:var(--primary);font-weight:700">directorunibotics@gmail.com</a> 
          or <a href="tel:+919017902010" style="color:var(--primary);font-weight:700">+91-9017902010</a>.
        </p>
      </div>
    ` : `
      <p style="font-size:.8rem;color:var(--muted);margin:0">
        No reply yet — we usually respond within 1–2 business days.
      </p>
    `}
  </div>
`).join('');
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

loadMyMessages();
loadMyOrders();