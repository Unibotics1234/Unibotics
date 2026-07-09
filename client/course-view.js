// ════════════════════════════════════════════════════════════════════════════
//  Unibotics — course-view.js
//  Handles the student-facing course viewer:
//  - Reads ?courseId= from the URL
//  - Checks enrollment status (confirmed / pending / none)
//  - Shows the correct state (full content / locked / not enrolled)
//  - Loads modules + lesson titles in the sidebar
//  - Fetches and renders individual lesson content on click
// ════════════════════════════════════════════════════════════════════════════

(function () {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }
})();

// Read courseId from URL: course-view.html?courseId=XXXX
const params   = new URLSearchParams(window.location.search);
const courseId = params.get('courseId');

if (!courseId) {
  window.location.href = 'courses.html';
}

// ── State ─────────────────────────────────────────────────────────────────────
let currentLessonId = null;

// ── Boot sequence ─────────────────────────────────────────────────────────────
(async function boot() {
  // 1. Load the course itself (name, description)
  const courseRes = await apiFetch(`/api/courses/${courseId}`);
  if (courseRes.ok && courseRes.data.data) {
    const c = courseRes.data.data;
    document.getElementById('course-title').textContent = `${c.icon || ''} ${c.title}`;
    document.getElementById('course-meta').textContent  = c.description || '';
    document.title = `${c.title} — Unibotics`;
  }

  // 2. Check this user's enrollment status for this course
  const ordersRes = await apiFetch('/api/orders/my');
  if (!ordersRes.ok) return;

  const orders    = ordersRes.data.data || [];
  const thisOrder = orders.find(o => o.course && o.course._id === courseId);

  if (!thisOrder) {
    // Not enrolled at all
    document.getElementById('cv-not-enrolled').classList.remove('hidden');
    return;
  }

  if (thisOrder.status === 'pending') {
    // Enrolled but not yet confirmed — show locked state
    document.getElementById('cv-locked').classList.remove('hidden');
    return;
  }

  if (thisOrder.status === 'cancelled') {
    document.getElementById('cv-not-enrolled').classList.remove('hidden');
    return;
  }

  // 3. Confirmed enrollment — load full curriculum
  document.getElementById('cv-main').classList.remove('hidden');
  await loadCurriculum();
})();

// ── Load module + lesson title structure (no content yet) ─────────────────────
async function loadCurriculum() {
  const { ok, data } = await apiFetch(`/api/courses/${courseId}/modules`);
  if (!ok) {
    showToast('Failed to load course curriculum.');
    return;
  }

  const modules   = data.data || [];
  const sidebar   = document.getElementById('cv-sidebar-content');

  if (!modules.length) {
    sidebar.innerHTML = '<p style="color:var(--muted);font-size:.88rem">No content has been added to this course yet.</p>';
    return;
  }

  sidebar.innerHTML = modules.map(mod => `
    <div class="cv-module-title">${escapeHtml(mod.title)}</div>
    ${(mod.lessons || []).map((l, idx) => `
      <div class="cv-lesson-link" data-lesson-id="${l._id}">
        ${idx + 1}. ${escapeHtml(l.title)}
      </div>
    `).join('')}
  `).join('');

  // Attach click handlers to each lesson link
  sidebar.querySelectorAll('[data-lesson-id]').forEach(el => {
    el.addEventListener('click', () => openLesson(el.getAttribute('data-lesson-id'), el));
  });
}

// ── Open a specific lesson ────────────────────────────────────────────────────
async function openLesson(lessonId, linkEl) {
  if (currentLessonId === lessonId) return; // already open

  // Update sidebar active state
  document.querySelectorAll('.cv-lesson-link').forEach(el => el.classList.remove('active'));
  linkEl.classList.add('active');

  const display = document.getElementById('cv-lesson-display');
  display.innerHTML = '<p style="color:var(--muted);padding:40px 0;text-align:center">Loading...</p>';

  const { ok, data } = await apiFetch(`/api/lessons/${lessonId}`);

  if (!ok) {
    if (data.locked) {
      display.innerHTML = `
        <div class="cv-placeholder">
          <p style="font-size:1.5rem;margin-bottom:8px">🔒</p>
          <p>This lesson is locked. Your enrollment must be confirmed to access content.</p>
        </div>`;
    } else {
      display.innerHTML = `<div class="cv-placeholder"><p>${escapeHtml(data.message || 'Failed to load lesson.')}</p></div>`;
    }
    return;
  }

  currentLessonId = lessonId;
  const lesson = data.data;

  display.innerHTML = `
    <h2>${escapeHtml(lesson.title)}</h2>
    <div class="cv-lesson-body">${escapeHtml(lesson.content)}</div>
  `;
}

// ── Escape helper (in case this loads before main.js defines it) ──────────────
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}