// ════════════════════════════════════════════════════════════════════════════
//  Unibotics — admin-dashboard.js
//  Powers the admin dashboard: auth guard, tab switching, and all
//  data fetching/rendering for Overview, Users, Messages, Applications, Courses.
//  Relies on apiFetch(), getUser(), getToken(), showToast() from main.js —
//  this file must load AFTER main.js.
// ════════════════════════════════════════════════════════════════════════════

// ── Auth guard ────────────────────────────────────────────────────────────────
// Runs immediately. If there's no token, or the stored user isn't an admin,
// bounce to admin-login.html before anything else executes.
(function () {
  const user = getUser();
  if (!isLoggedIn() || !user || user.role !== 'admin') {
    window.location.href = 'admin-login.html';
  }
})();

// ── Greet admin by name ─────────────────────────────────────────────────────
(function () {
  const user = getUser();
  const slot = document.getElementById('admin-name-slot');
  if (user && slot) {
    slot.textContent = `Welcome back, ${user.name.split(' ')[0]}.`;
  }
})();

// ── Tab switching ────────────────────────────────────────────────────────────
const dashState = { currentTab: 'overview', coursesLoaded: false, usersLoaded: false, messagesLoaded: false, applicationsLoaded: false };

(function () {
  const tabs  = document.querySelectorAll('.dash-tab');
  const panes = document.querySelectorAll('.dash-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-target');

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      panes.forEach(p => p.classList.toggle('hidden', p.getAttribute('data-pane') !== target));

      dashState.currentTab = target;
      loadTabData(target);
    });
  });
})();

function loadTabData(tab) {
  if (tab === 'overview')      loadOverview();
  if (tab === 'users' && !dashState.usersLoaded)               { loadUsers(); dashState.usersLoaded = true; }
  if (tab === 'messages' && !dashState.messagesLoaded)         { loadMessages(); dashState.messagesLoaded = true; }
  if (tab === 'applications' && !dashState.applicationsLoaded) { loadApplications(); dashState.applicationsLoaded = true; }
  if (tab === 'courses' && !dashState.coursesLoaded) { loadCourses(); dashState.coursesLoaded = true; }
  if (tab === 'requests' && !dashState.requestsLoaded) { loadRequests(); dashState.requestsLoaded = true; }
  if (tab === 'orders' && !dashState.ordersLoaded) { loadOrders(); dashState.ordersLoaded = true; }
}

// ── OVERVIEW ─────────────────────────────────────────────────────────────────
async function loadOverview() {
  const { ok, data } = await apiFetch('/api/admin/dashboard');
  if (!ok) { showToast(data.message || 'Failed to load stats.'); return; }

  const s = data.data;
  const nums = document.querySelectorAll('#stats-grid .num');
  const values = [s.totalUsers, s.unreadMessages, s.pendingApplications, s.activeCourses, s.totalOrders];
  nums.forEach((el, i) => { el.textContent = values[i] ?? '—'; });
}

// ── USERS ────────────────────────────────────────────────────────────────────
async function loadUsers() {
  const { ok, data } = await apiFetch('/api/admin/users');
  const tbody = document.getElementById('users-tbody');
  const empty = document.getElementById('users-empty');

  if (!ok) { showToast(data.message || 'Failed to load users.'); return; }

  const users = data.data || [];
  empty.classList.toggle('hidden', users.length > 0);

  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.phone || '—')}</td>
      <td><span class="pill pill-${u.role}">${u.role}</span></td>
      <td>${formatDate(u.createdAt)}</td>
      <td>
        <div class="row-actions">
          ${u.role === 'admin'
            ? '<span style="color:var(--muted);font-size:.8rem">Protected</span>'
            : `<button class="btn btn-sm btn-danger" data-delete-user="${u._id}">Delete</button>`}
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-delete-user]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this user permanently? This cannot be undone.')) return;
      const id = btn.getAttribute('data-delete-user');
      const { ok, data } = await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      showToast(data.message || (ok ? 'User deleted.' : 'Delete failed.'));
      if (ok) loadUsers();
    });
  });
}

//--------------Load-Messages----------------
async function loadMessages() {
  const { ok, data } = await apiFetch('/api/contact');
  const tbody = document.getElementById('messages-tbody');
  const empty = document.getElementById('messages-empty');

  if (!ok) { showToast(data.message || 'Failed to load messages.'); return; }

  const messages = data.data || [];
  empty.classList.toggle('hidden', messages.length > 0);

  tbody.innerHTML = messages.map(m => `
    <tr>
      <td>${escapeHtml(m.user ? m.user.name : m.name)}</td>
      <td>${escapeHtml(m.user ? m.user.email : m.email)}</td>
      <td>${escapeHtml(m.org || '—')}</td>
      <td style="max-width:220px">${escapeHtml(m.message)}</td>
      <td>${m.replies && m.replies.length
        ? `<span style="color:#0a7a3f;font-weight:700">${m.replies.length} reply</span>`
        : '<span style="color:var(--muted)">None</span>'}</td>
      <td>${formatDate(m.createdAt)}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-sm btn-ghost" data-reply-msg="${m._id}">Reply</button>
          <button class="btn btn-sm btn-danger" data-delete-msg="${m._id}">Delete</button>
        </div>
        <div id="reply-box-${m._id}" class="hidden" style="margin-top:10px">
          <textarea id="reply-text-${m._id}" placeholder="Type your reply..." style="width:100%;min-height:70px;font:inherit;padding:8px;border-radius:8px;border:1.5px solid var(--border);resize:vertical"></textarea>
          <button class="btn btn-sm" data-send-reply="${m._id}" style="margin-top:6px">Send reply</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Also update thead to include Replies column
  const thead = tbody.closest('table').querySelector('thead tr');
  if (thead && !thead.querySelector('[data-replies-col]')) {
    const th = document.createElement('th');
    th.setAttribute('data-replies-col', '1');
    th.textContent = 'Replies';
    thead.insertBefore(th, thead.children[4]);
  }

  tbody.querySelectorAll('[data-reply-msg]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id  = btn.getAttribute('data-reply-msg');
      const box = document.getElementById(`reply-box-${id}`);
      box.classList.toggle('hidden');
    });
  });

  tbody.querySelectorAll('[data-send-reply]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const id       = btn.getAttribute('data-send-reply');
    const textarea = document.getElementById(`reply-text-${id}`);
    const reply    = textarea.value.trim();
    if (!reply) { showToast('Reply cannot be empty.'); return; }

    btn.disabled    = true;
    btn.textContent = 'Sending...';

    const { ok, data } = await apiFetch(`/api/contact/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply })
    });

    if (ok) {
      showToast('Reply sent.');

      // Show the sent reply inline immediately without waiting for a reload
      const replyBox  = document.getElementById(`reply-box-${id}`);
      const sentBlock = document.createElement('div');
      sentBlock.style.cssText = 'margin-top:10px;padding:10px 14px;background:#e3f9ec;border-radius:10px;font-size:.88rem';
      sentBlock.innerHTML = `
        <strong style="color:#0a7a3f">✓ Reply sent:</strong>
        <p style="margin:4px 0 0">${escapeHtml(reply)}</p>
      `;
      replyBox.appendChild(sentBlock);
      textarea.value  = '';
      btn.textContent = 'Send another reply';
      btn.disabled    = false;

      // Refresh messages silently so reply count updates in the table
      dashState.messagesLoaded = false;
    } else {
      showToast(data.message || 'Failed to send reply.');
      btn.disabled    = false;
      btn.textContent = 'Send reply';
    }
  });
});

  tbody.querySelectorAll('[data-delete-msg]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this message permanently?')) return;
      const id = btn.getAttribute('data-delete-msg');
      const { ok, data } = await apiFetch(`/api/contact/${id}`, { method: 'DELETE' });
      showToast(data.message || (ok ? 'Message deleted.' : 'Delete failed.'));
      if (ok) { dashState.messagesLoaded = false; loadMessages(); }
    });
  });
}
// ── APPLICATIONS ─────────────────────────────────────────────────────────────
async function loadApplications() {
  const { ok, data } = await apiFetch('/api/join');
  const tbody = document.getElementById('applications-tbody');
  const empty = document.getElementById('applications-empty');

  if (!ok) { showToast(data.message || 'Failed to load applications.'); return; }

  const apps = data.data || [];
  empty.classList.toggle('hidden', apps.length > 0);

  tbody.innerHTML = apps.map(a => `
    <tr>
      <td>${escapeHtml(a.name)}</td>
      <td>${escapeHtml(a.email)}</td>
      <td>${escapeHtml(a.phone)}</td>
      <td>${escapeHtml(a.role)}</td>
      <td>
        <select data-status-id="${a._id}" class="pill pill-${a.status}" style="border:0;cursor:pointer">
          <option value="pending"  ${a.status === 'pending'  ? 'selected' : ''}>Pending</option>
          <option value="reviewed" ${a.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
          <option value="accepted" ${a.status === 'accepted' ? 'selected' : ''}>Accepted</option>
          <option value="rejected" ${a.status === 'rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </td>
      <td>${formatDate(a.createdAt)}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-sm btn-danger" data-delete-app="${a._id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-status-id]').forEach(sel => {
    sel.addEventListener('change', async () => {
      const id = sel.getAttribute('data-status-id');
      const { ok, data } = await apiFetch(`/api/join/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: sel.value })
      });
      showToast(data.message || (ok ? 'Status updated.' : 'Update failed.'));
      if (ok) {
        sel.className = `pill pill-${sel.value}`;
      }
    });
  });

  tbody.querySelectorAll('[data-delete-app]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this application permanently?')) return;
      const id = btn.getAttribute('data-delete-app');
      const { ok, data } = await apiFetch(`/api/join/${id}`, { method: 'DELETE' });
      showToast(data.message || (ok ? 'Application deleted.' : 'Delete failed.'));
      if (ok) loadApplications();
    });
  });
}

// ── COURSES ──────────────────────────────────────────────────────────────────
async function loadCourses() {
  const { ok, data } = await apiFetch('/api/courses');
  const tbody = document.getElementById('courses-tbody');
  const empty = document.getElementById('courses-empty');

  if (!ok) { showToast(data.message || 'Failed to load courses.'); return; }

  const courses = data.data || [];
  empty.classList.toggle('hidden', courses.length > 0);

  tbody.innerHTML = courses.map(c => `
    <tr>
      <td style="font-size:1.4rem">${c.icon || '📡'}</td>
      <td>${escapeHtml(c.title)}</td>
      <td><span class="pill pill-reviewed">${escapeHtml(c.category)}</span></td>
      <td>${c.price > 0 ? '₹' + c.price : 'Free'}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-sm btn-ghost" data-edit-course="${c._id}">Edit</button>
          <button class="btn btn-sm btn-danger" data-delete-course="${c._id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');

  // store full course data on window for the edit handler to read back
  window.__coursesCache = courses;
 
populateCurriculumCourseSelect(courses);   // ← add this line

  tbody.querySelectorAll('[data-edit-course]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-edit-course');
      const course = window.__coursesCache.find(c => c._id === id);
      if (!course) return;
      enterEditMode(course);
    });
  });

  tbody.querySelectorAll('[data-delete-course]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this course permanently?')) return;
      const id = btn.getAttribute('data-delete-course');
      const { ok, data } = await apiFetch(`/api/courses/${id}`, { method: 'DELETE' });
      showToast(data.message || (ok ? 'Course deleted.' : 'Delete failed.'));
      if (ok) loadCourses();
    });
  });
}

// ── ADMIN REQUESTS ───────────────────────────────────────────────────────────
async function loadRequests() {
  const { ok, data } = await apiFetch('/api/admin-requests');
  const tbody = document.getElementById('requests-tbody');
  const empty = document.getElementById('requests-empty');

  if (!ok) { showToast(data.message || 'Failed to load requests.'); return; }

  const requests = data.data || [];
  empty.classList.toggle('hidden', requests.length > 0);

  tbody.innerHTML = requests.map(r => `
    <tr>
      <td>${escapeHtml(r.user.name)}</td>
      <td>${escapeHtml(r.user.email)}</td>
      <td style="max-width:280px">${escapeHtml(r.reason)}</td>
      <td>${escapeHtml(r.organization || '—')}</td>
      <td>${formatDate(r.createdAt)}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-sm" data-approve-req="${r._id}">Approve</button>
          <button class="btn btn-sm btn-danger" data-reject-req="${r._id}">Reject</button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-approve-req]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Grant this person full admin access?')) return;
      const id = btn.getAttribute('data-approve-req');
      const { ok, data } = await apiFetch(`/api/admin-requests/${id}/approve`, { method: 'PUT' });
      showToast(data.message || (ok ? 'Approved.' : 'Failed.'));
      if (ok) { loadRequests(); loadOverview(); }
    });
  });

  tbody.querySelectorAll('[data-reject-req]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Reject this admin access request?')) return;
      const id = btn.getAttribute('data-reject-req');
      const { ok, data } = await apiFetch(`/api/admin-requests/${id}/reject`, { method: 'PUT' });
      showToast(data.message || (ok ? 'Rejected.' : 'Failed.'));
      if (ok) loadRequests();
    });
  });
}

// ── ORDERS / ENROLLMENTS ─────────────────────────────────────────────────────
async function loadOrders() {
  const { ok, data } = await apiFetch('/api/orders');
  const tbody = document.getElementById('orders-tbody');
  const empty = document.getElementById('orders-empty');

  if (!ok) { showToast(data.message || 'Failed to load enrollments.'); return; }

  const orders = data.data || [];
  empty.classList.toggle('hidden', orders.length > 0);

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td>${escapeHtml(o.user ? o.user.name : 'Unknown')}</td>
      <td>${escapeHtml(o.user ? o.user.email : '—')}</td>
      <td>${escapeHtml(o.course ? o.course.title : 'Course removed')}</td>
      <td>
        <select data-order-status="${o._id}" class="pill pill-${o.status === 'confirmed' ? 'accepted' : o.status === 'cancelled' ? 'rejected' : 'pending'}" style="border:0;cursor:pointer">
          <option value="pending"   ${o.status === 'pending'   ? 'selected' : ''}>Pending</option>
          <option value="confirmed" ${o.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
      <td>${formatDate(o.createdAt)}</td>
      <td><span style="font-size:.78rem;color:var(--muted)">ID: ${o._id.slice(-6)}</span></td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-order-status]').forEach(sel => {
    sel.addEventListener('change', async () => {
      const id = sel.getAttribute('data-order-status');
      const { ok, data } = await apiFetch(`/api/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: sel.value })
      });
      showToast(data.message || (ok ? 'Enrollment status updated.' : 'Update failed.'));
      if (ok) {
        sel.className = `pill pill-${sel.value === 'confirmed' ? 'accepted' : sel.value === 'cancelled' ? 'rejected' : 'pending'}`;
      }
    });
  });
}

function enterEditMode(course) {
  document.getElementById('course-edit-id').value = course._id;
  document.getElementById('course-title').value = course.title;
  document.getElementById('course-category').value = course.category;
  document.getElementById('course-icon').value = course.icon || '';
  document.getElementById('course-price').value = course.price || 0;
  document.getElementById('course-description').value = course.description;
  document.getElementById('course-submit-btn').textContent = 'Save changes';
  document.getElementById('course-cancel-edit').style.display = 'inline-flex';
  document.getElementById('course-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function exitEditMode() {
  document.getElementById('course-form').reset();
  document.getElementById('course-edit-id').value = '';
  document.getElementById('course-submit-btn').textContent = 'Add course';
  document.getElementById('course-cancel-edit').style.display = 'none';
}

(function () {
  const form = document.getElementById('course-form');
  if (!form) return;

  document.getElementById('course-cancel-edit').addEventListener('click', exitEditMode);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const id = document.getElementById('course-edit-id').value;

    const body = {
      title:       document.getElementById('course-title').value.trim(),
      category:    document.getElementById('course-category').value,
      icon:        document.getElementById('course-icon').value.trim() || '📡',
      price:       Number(document.getElementById('course-price').value) || 0,
      description: document.getElementById('course-description').value.trim()
    };

    const endpoint = id ? `/api/courses/${id}` : '/api/courses';
    const method   = id ? 'PUT' : 'POST';

    const { ok, data } = await apiFetch(endpoint, { method, body: JSON.stringify(body) });
    showToast(data.message || (ok ? (id ? 'Course updated.' : 'Course added.') : 'Save failed.'));

    if (ok) {
      exitEditMode();
      loadCourses();
      loadOverview(); // active course count may have changed
    }
  });
})();


// ════════════════════════════════════════════════════════════════════════════
//  CURRICULUM EDITOR  (Courses tab → manage modules & lessons per course)
// ════════════════════════════════════════════════════════════════════════════

let curriculumCourseId = null;

// Populate the course dropdown once courses are loaded
function populateCurriculumCourseSelect(courses) {
  const select = document.getElementById('curriculum-course-select');
  if (!select) return;

  select.innerHTML = '<option value="">Choose a course...</option>' +
    courses.map(c => `<option value="${c._id}">${escapeHtml(c.title)}</option>`).join('');

  select.addEventListener('change', () => {
    curriculumCourseId = select.value;
    const editor = document.getElementById('curriculum-editor');
    if (!curriculumCourseId) {
      editor.classList.add('hidden');
      return;
    }
    editor.classList.remove('hidden');
    loadModulesForCourse(curriculumCourseId);
  });
}

async function loadModulesForCourse(courseId) {
  const container = document.getElementById('modules-list');
  const empty     = document.getElementById('modules-empty');

  const { ok, data } = await apiFetch(`/api/courses/${courseId}/modules`);
  if (!ok) { showToast(data.message || 'Failed to load modules.'); return; }

  const modules = data.data || [];
  empty.classList.toggle('hidden', modules.length > 0);

  container.innerHTML = modules.map(mod => `
    <div class="module-card" data-module-id="${mod._id}">
      <div class="module-card-head">
        <strong>${escapeHtml(mod.title)}</strong>
        <button class="btn btn-sm btn-danger" data-delete-module="${mod._id}">Delete module</button>
      </div>
      <div class="lessons-for-module" data-module-lessons="${mod._id}">
        ${(mod.lessons || []).map(l => `
          <div class="lesson-row" data-lesson-id="${l._id}">
            <span>📄 ${escapeHtml(l.title)}</span>
            <div class="row-actions">
              <button class="btn btn-sm btn-ghost" data-view-lesson="${l._id}">View / Edit</button>
              <button class="btn btn-sm btn-danger" data-delete-lesson="${l._id}">Delete</button>
            </div>
          </div>
          <div class="lesson-content-edit hidden" data-lesson-editor="${l._id}"></div>
        `).join('')}
      </div>
      <form class="lesson-add-form" data-add-lesson-to="${mod._id}">
        <input class="lname" placeholder="New lesson title" required>
        <textarea placeholder="Lesson content..." required style="flex-basis:100%;min-height:70px"></textarea>
        <button class="btn btn-sm" type="submit">Add lesson</button>
      </form>
    </div>
  `).join('');

  attachModuleCardHandlers(courseId);
}

function attachModuleCardHandlers(courseId) {
  // Delete module
  document.querySelectorAll('[data-delete-module]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this module and ALL lessons inside it? This cannot be undone.')) return;
      const id = btn.getAttribute('data-delete-module');
      const { ok, data } = await apiFetch(`/api/modules/${id}`, { method: 'DELETE' });
      showToast(data.message || (ok ? 'Module deleted.' : 'Delete failed.'));
      if (ok) loadModulesForCourse(courseId);
    });
  });

  // Add lesson to a specific module
  document.querySelectorAll('[data-add-lesson-to]').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const moduleId = form.getAttribute('data-add-lesson-to');
      const title   = form.querySelector('.lname').value.trim();
      const content = form.querySelector('textarea').value.trim();

      const { ok, data } = await apiFetch('/api/lessons', {
        method: 'POST',
        body: JSON.stringify({ module: moduleId, title, content, order: 0 })
      });

      showToast(data.message || (ok ? 'Lesson added.' : 'Failed to add lesson.'));
      if (ok) loadModulesForCourse(courseId);
    });
  });

  // Delete lesson
  document.querySelectorAll('[data-delete-lesson]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this lesson?')) return;
      const id = btn.getAttribute('data-delete-lesson');
      const { ok, data } = await apiFetch(`/api/lessons/${id}`, { method: 'DELETE' });
      showToast(data.message || (ok ? 'Lesson deleted.' : 'Delete failed.'));
      if (ok) loadModulesForCourse(courseId);
    });
  });

  // View / edit lesson content inline
  document.querySelectorAll('[data-view-lesson]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-view-lesson');
      const editorBlock = document.querySelector(`[data-lesson-editor="${id}"]`);
      if (!editorBlock) return;

      if (!editorBlock.classList.contains('hidden')) {
        editorBlock.classList.add('hidden');
        return;
      }

      const { ok, data } = await apiFetch(`/api/lessons/${id}`);
      if (!ok) { showToast(data.message || 'Failed to load lesson.'); return; }

      editorBlock.innerHTML = `
        <textarea data-lesson-text="${id}">${escapeHtml(data.data.content)}</textarea>
        <button class="btn btn-sm" data-save-lesson="${id}" style="margin-top:8px">Save changes</button>
      `;
      editorBlock.classList.remove('hidden');

      editorBlock.querySelector(`[data-save-lesson="${id}"]`).addEventListener('click', async () => {
        const newContent = editorBlock.querySelector(`[data-lesson-text="${id}"]`).value;
        const { ok, data } = await apiFetch(`/api/lessons/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ content: newContent })
        });
        showToast(data.message || (ok ? 'Lesson updated.' : 'Update failed.'));
      });
    });
  });

  // Add module (top-level form, only needs wiring once but harmless to rebind)
  const moduleForm = document.getElementById('module-form');
  if (moduleForm && !moduleForm.dataset.bound) {
    moduleForm.dataset.bound = 'true';
    moduleForm.addEventListener('submit', async e => {
      e.preventDefault();
      const title = document.getElementById('new-module-title').value.trim();
      if (!curriculumCourseId) return;

      const { ok, data } = await apiFetch(`/api/courses/${curriculumCourseId}/modules`, {
        method: 'POST',
        body: JSON.stringify({ title, order: 0 })
      });

      showToast(data.message || (ok ? 'Module added.' : 'Failed to add module.'));
      if (ok) {
        document.getElementById('new-module-title').value = '';
        loadModulesForCourse(curriculumCourseId);
      }
    });
  }
}

// ── Admin settings drawer ─────────────────────────────────────────────────────
function openAdminSettings() {
  document.getElementById('settings-overlay').style.display = 'block';
  document.getElementById('admin-settings-drawer').style.right = '0';
}
function closeAdminSettings() {
  document.getElementById('settings-overlay').style.display = 'none';
  document.getElementById('admin-settings-drawer').style.right = '-420px';
}
window.openAdminSettings  = openAdminSettings;
window.closeAdminSettings = closeAdminSettings;

(function () {
  const form = document.getElementById('admin-settings-password-form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    const { ok, data } = await apiFetch('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: document.getElementById('as-current-pw').value,
        newPassword:     document.getElementById('as-new-pw').value,
        confirmPassword: document.getElementById('as-confirm-pw').value
      })
    });
    showToast(data.message || (ok ? 'Password changed.' : 'Failed.'));
    if (ok) form.reset();
    btn.disabled = false;
  });
})();


// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}


// ── Initial load ─────────────────────────────────────────────────────────────
loadOverview();