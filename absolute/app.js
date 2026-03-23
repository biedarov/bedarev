/* ═══════════════════════════════════════════════
   ABSOLUTE — Task Command Center · App Logic
   ═══════════════════════════════════════════════ */

(function(){
'use strict';

/* ─── STORAGE KEYS ─── */
const K = {
    tasks:    'abs_tasks',
    projects: 'abs_projects',
    settings: 'abs_settings',
    activity: 'abs_activity',
    auth:     'abs_auth'
};

/* ─── SALT for password hashing ─── */
const SALT = 'bedarev-salt-2024';
const EXPECTED = 'd49d4bef4cc85ceced527b2d44cf03ac3e532b77295b25f6334217b23177c8b7';

/* ─── STATE ─── */
let state = {
    tasks: [],
    projects: [],
    settings: {
        defaultView: 'dashboard',
        compact: false,
        showDone: true,
        reminders: true,
        sounds: false
    },
    activity: [],
    currentView: 'dashboard',
    analyticsPeriod: 'week',
    customRange: { from: null, to: null }
};

let charts = {};

/* ═══════════ AUTH ═══════════ */

async function hashStr(str) {
    const data = new TextEncoder().encode(str + ':' + SALT);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
}

async function verifyPassword(pwd) {
    const h = await hashStr(pwd);
    return h === EXPECTED;
}

function isAuthed() {
    return sessionStorage.getItem(K.auth) === '1';
}

function setAuthed(v) {
    if (v) sessionStorage.setItem(K.auth, '1');
    else sessionStorage.removeItem(K.auth);
}

/* ─── LOGIN UI ─── */
const loginScreen = document.getElementById('login-screen');
const loginPw     = document.getElementById('login-pw');
const loginBtn    = document.getElementById('login-btn');
const loginError  = document.getElementById('login-error');
const appEl       = document.getElementById('app');

function showApp() {
    loginScreen.classList.add('hidden');
    appEl.classList.remove('hidden');
    loadState();
    renderAll();
}

loginBtn.addEventListener('click', async () => {
    const ok = await verifyPassword(loginPw.value);
    if (ok) {
        setAuthed(true);
        showApp();
    } else {
        loginError.classList.add('show');
        loginPw.value = '';
        loginPw.focus();
        setTimeout(() => loginError.classList.remove('show'), 2500);
    }
});

loginPw.addEventListener('keydown', e => {
    if (e.key === 'Enter') loginBtn.click();
});

document.getElementById('logout-btn').addEventListener('click', () => {
    setAuthed(false);
    location.reload();
});

/* ═══════════ PERSISTENCE ═══════════ */

function save() {
    localStorage.setItem(K.tasks, JSON.stringify(state.tasks));
    localStorage.setItem(K.projects, JSON.stringify(state.projects));
    localStorage.setItem(K.settings, JSON.stringify(state.settings));
    localStorage.setItem(K.activity, JSON.stringify(state.activity.slice(-200)));
}

function loadState() {
    try { state.tasks = JSON.parse(localStorage.getItem(K.tasks)) || []; } catch { state.tasks = []; }
    try { state.projects = JSON.parse(localStorage.getItem(K.projects)) || []; } catch { state.projects = []; }
    try { state.settings = { ...state.settings, ...JSON.parse(localStorage.getItem(K.settings)) }; } catch {}
    try { state.activity = JSON.parse(localStorage.getItem(K.activity)) || []; } catch { state.activity = []; }
    applySettings();
}

function applySettings() {
    document.getElementById('setting-default-view').value = state.settings.defaultView;
    document.getElementById('setting-compact').checked = state.settings.compact;
    document.getElementById('setting-show-done').checked = state.settings.showDone;
    document.getElementById('setting-reminders').checked = state.settings.reminders;
    document.getElementById('setting-sounds').checked = state.settings.sounds;
}

/* ═══════════ HELPERS ═══════════ */

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function today() {
    return new Date().toISOString().slice(0, 10);
}

function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function fmtRelative(iso) {
    if (!iso) return '';
    const now = new Date();
    const d = new Date(iso);
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return diff + 'm ago';
    if (diff < 1440) return Math.floor(diff / 60) + 'h ago';
    return Math.floor(diff / 1440) + 'd ago';
}

function isOverdue(task) {
    return task.dueDate && task.status !== 'done' && task.dueDate < today();
}

const PRIORITY_ORDER = { urgent: 4, high: 3, medium: 2, low: 1 };

function addActivity(type, text) {
    state.activity.push({ type, text, time: new Date().toISOString() });
    if (state.activity.length > 200) state.activity = state.activity.slice(-200);
}

function toast(msg, type = 'info') {
    const c = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => {
        el.style.animation = 'toastOut .2s ease forwards';
        setTimeout(() => el.remove(), 200);
    }, 2500);
}

/* ═══════════ NAVIGATION ═══════════ */

const sidebarBtns = document.querySelectorAll('.sidebar-btn[data-view]');
const views = document.querySelectorAll('.view');

function switchView(name) {
    state.currentView = name;
    sidebarBtns.forEach(b => b.classList.toggle('active', b.dataset.view === name));
    views.forEach(v => {
        v.classList.remove('active');
        if (v.id === 'view-' + name) v.classList.add('active');
    });
    if (name === 'dashboard') renderDashboard();
    if (name === 'tasks') renderTasks();
    if (name === 'projects') renderProjects();
    if (name === 'analytics') renderAnalytics();

    // close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
}

sidebarBtns.forEach(b => b.addEventListener('click', () => switchView(b.dataset.view)));

// Mobile
document.getElementById('topbar-burger').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});
document.getElementById('topbar-add').addEventListener('click', () => openTaskModal());

/* ═══════════ RENDER ALL ═══════════ */

function renderAll() {
    const v = state.settings.defaultView || 'dashboard';
    switchView(v);
    populateProjectSelects();
}

/* ═══════════ DASHBOARD ═══════════ */

function renderDashboard() {
    // date
    const now = new Date();
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('dash-date').textContent = now.toLocaleDateString('en-US', opts).toUpperCase();

    // stats
    const total = state.tasks.length;
    const inProgress = state.tasks.filter(t => t.status === 'in_progress').length;
    const done = state.tasks.filter(t => t.status === 'done').length;
    const overdue = state.tasks.filter(t => isOverdue(t)).length;
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-progress').textContent = inProgress;
    document.getElementById('stat-done').textContent = done;
    document.getElementById('stat-overdue').textContent = overdue;

    // today's tasks
    const todayStr = today();
    const todayTasks = state.tasks.filter(t => t.dueDate === todayStr || (t.status !== 'done' && isOverdue(t)));
    document.getElementById('today-count').textContent = todayTasks.length;
    const container = document.getElementById('today-tasks');
    if (todayTasks.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">—</div><div class="empty-state-text">No tasks for today</div></div>';
    } else {
        container.innerHTML = todayTasks.slice(0, 8).map(t => taskItemHTML(t)).join('');
        bindTaskItems(container);
    }

    // recent activity
    const actEl = document.getElementById('recent-activity');
    const recent = state.activity.slice(-8).reverse();
    if (recent.length === 0) {
        actEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">—</div><div class="empty-state-text">No activity yet</div></div>';
    } else {
        actEl.innerHTML = recent.map(a => `
            <div class="activity-item">
                <div class="activity-dot ${a.type}"></div>
                <div>
                    <div>${a.text}</div>
                    <div class="activity-time">${fmtRelative(a.time)}</div>
                </div>
            </div>
        `).join('');
    }

    // charts
    renderWeeklyChart();
    renderStatusChart();
}

function renderWeeklyChart() {
    const ctx = document.getElementById('chart-weekly');
    if (charts.weekly) charts.weekly.destroy();

    const days = [];
    const created = [];
    const completed = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().slice(0, 10);
        days.push(d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase());
        created.push(state.tasks.filter(t => t.createdAt && t.createdAt.slice(0, 10) === ds).length);
        completed.push(state.tasks.filter(t => t.completedAt && t.completedAt.slice(0, 10) === ds).length);
    }

    charts.weekly = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [
                { label: 'Created', data: created, backgroundColor: 'rgba(0,0,0,0.15)', borderColor: 'rgba(0,0,0,0.3)', borderWidth: 1 },
                { label: 'Completed', data: completed, backgroundColor: 'rgba(0,0,0,0.75)', borderColor: '#000', borderWidth: 1 }
            ]
        },
        options: chartOpts('Weekly Activity')
    });
}

function renderStatusChart() {
    const ctx = document.getElementById('chart-status');
    if (charts.status) charts.status.destroy();

    const ns = state.tasks.filter(t => t.status === 'not_started').length;
    const ip = state.tasks.filter(t => t.status === 'in_progress').length;
    const dn = state.tasks.filter(t => t.status === 'done').length;

    charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Not Started', 'In Progress', 'Done'],
            datasets: [{
                data: [ns, ip, dn],
                backgroundColor: ['rgba(0,0,0,0.12)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.85)'],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: "'Unbounded', sans-serif", size: 10 }, boxWidth: 12, padding: 12 } }
            }
        }
    });
}

function chartOpts(title) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'bottom', labels: { font: { family: "'Unbounded', sans-serif", size: 10 }, boxWidth: 12, padding: 12 } },
            title: { display: false }
        },
        scales: {
            x: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { font: { family: "'Unbounded', sans-serif", size: 10 } } },
            y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { font: { family: "'Unbounded', sans-serif", size: 10 }, stepSize: 1 }, beginAtZero: true }
        }
    };
}

/* ═══════════ TASKS ═══════════ */

function getFilteredTasks() {
    let list = [...state.tasks];
    const search = document.getElementById('task-search').value.toLowerCase();
    const statusF = document.getElementById('filter-status').value;
    const priorityF = document.getElementById('filter-priority').value;
    const projectF = document.getElementById('filter-project').value;
    const sortBy = document.getElementById('sort-by').value;

    if (!state.settings.showDone) list = list.filter(t => t.status !== 'done');
    if (search) list = list.filter(t => t.title.toLowerCase().includes(search) || (t.description || '').toLowerCase().includes(search) || (t.tags || []).some(tg => tg.toLowerCase().includes(search)));
    if (statusF !== 'all') list = list.filter(t => t.status === statusF);
    if (priorityF !== 'all') list = list.filter(t => t.priority === priorityF);
    if (projectF !== 'all') list = list.filter(t => t.project === projectF);

    const sortFns = {
        created_desc: (a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''),
        created_asc:  (a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''),
        due_asc:      (a, b) => (a.dueDate || 'z').localeCompare(b.dueDate || 'z'),
        due_desc:     (a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''),
        priority_desc:(a, b) => (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0),
        priority_asc: (a, b) => (PRIORITY_ORDER[a.priority] || 0) - (PRIORITY_ORDER[b.priority] || 0)
    };
    list.sort(sortFns[sortBy] || sortFns.created_desc);
    return list;
}

function renderTasks() {
    const list = getFilteredTasks();
    document.getElementById('tasks-count-label').textContent = list.length + ' task' + (list.length !== 1 ? 's' : '');
    const container = document.getElementById('task-list');
    if (list.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">□</div><div class="empty-state-text">No tasks found</div></div>';
        return;
    }
    container.innerHTML = list.map(t => taskItemHTML(t)).join('');
    bindTaskItems(container);
}

function taskItemHTML(t) {
    const compact = state.settings.compact ? ' compact' : '';
    const doneClass = t.status === 'done' ? ' done' : '';
    const checkClass = t.status === 'done' ? 'checked' : (t.status === 'in_progress' ? 'in-progress' : '');
    const overdue = isOverdue(t);
    const proj = t.project ? state.projects.find(p => p.id === t.project) : null;

    let meta = '';
    if (t.priority) meta += `<span class="task-priority-dot ${t.priority}"></span>`;
    if (t.dueDate) {
        const cls = overdue ? ' overdue' : '';
        meta += `<span class="task-meta-item${cls}">${overdue ? 'OVERDUE · ' : ''}${fmtDate(t.dueDate)}</span>`;
    }
    if (proj) meta += `<span class="task-project-tag" style="border-color:${proj.color}">${proj.name}</span>`;
    if (t.subtasks && t.subtasks.length) {
        const sdone = t.subtasks.filter(s => s.done).length;
        meta += `<span class="task-meta-item">${sdone}/${t.subtasks.length} subtasks</span>`;
    }

    return `
    <div class="task-item${doneClass}${compact}" data-id="${t.id}">
        <button class="task-check ${checkClass}" data-id="${t.id}" type="button"></button>
        <div class="task-info">
            <div class="task-name">${escHTML(t.title)}</div>
            <div class="task-meta">${meta}</div>
        </div>
        <div class="task-actions">
            <button class="task-action-btn edit-btn" data-id="${t.id}" type="button" title="Edit">✎</button>
            <button class="task-action-btn delete task-del-btn" data-id="${t.id}" type="button" title="Delete">×</button>
        </div>
    </div>`;
}

function escHTML(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function bindTaskItems(container) {
    container.querySelectorAll('.task-check').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            cycleStatus(btn.dataset.id);
        });
    });
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            openTaskModal(btn.dataset.id);
        });
    });
    container.querySelectorAll('.task-del-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            deleteTask(btn.dataset.id);
        });
    });
    container.querySelectorAll('.task-item').forEach(el => {
        el.addEventListener('click', () => openTaskModal(el.dataset.id));
    });
}

function cycleStatus(id) {
    const t = state.tasks.find(x => x.id === id);
    if (!t) return;
    const cycle = ['not_started', 'in_progress', 'done'];
    const idx = cycle.indexOf(t.status);
    t.status = cycle[(idx + 1) % 3];
    if (t.status === 'done') {
        t.completedAt = new Date().toISOString();
        addActivity('completed', 'Completed: ' + t.title);
    } else {
        t.completedAt = null;
        addActivity('updated', 'Status changed: ' + t.title);
    }
    save();
    renderCurrent();
}

function deleteTask(id) {
    showConfirm('Delete Task', 'Are you sure you want to delete this task? This cannot be undone.', () => {
        const t = state.tasks.find(x => x.id === id);
        state.tasks = state.tasks.filter(x => x.id !== id);
        if (t) addActivity('updated', 'Deleted: ' + t.title);
        save();
        renderCurrent();
        toast('Task deleted', 'success');
    });
}

/* ═══════════ TASK MODAL ═══════════ */

const taskModal   = document.getElementById('task-modal');
const taskForm    = document.getElementById('task-form');
const modalTitle  = document.getElementById('modal-title');
const modalDelete = document.getElementById('modal-delete');

function openTaskModal(id) {
    taskForm.reset();
    document.getElementById('subtask-list').innerHTML = '';
    document.getElementById('task-priority').value = 'medium';
    populateProjectSelects();

    if (id) {
        const t = state.tasks.find(x => x.id === id);
        if (!t) return;
        modalTitle.textContent = 'Edit Task';
        modalDelete.classList.remove('hidden');
        document.getElementById('task-id').value = t.id;
        document.getElementById('task-title').value = t.title;
        document.getElementById('task-desc').value = t.description || '';
        document.getElementById('task-status').value = t.status;
        document.getElementById('task-priority').value = t.priority;
        document.getElementById('task-due').value = t.dueDate || '';
        document.getElementById('task-project').value = t.project || '';
        document.getElementById('task-tags').value = (t.tags || []).join(', ');
        if (t.subtasks) t.subtasks.forEach(s => addSubtaskEl(s.title, s.done));
    } else {
        modalTitle.textContent = 'New Task';
        modalDelete.classList.add('hidden');
        document.getElementById('task-id').value = '';
    }
    taskModal.classList.remove('hidden');
    document.getElementById('task-title').focus();
}

function closeTaskModal() {
    taskModal.classList.add('hidden');
}

document.getElementById('modal-close').addEventListener('click', closeTaskModal);
document.getElementById('modal-cancel').addEventListener('click', closeTaskModal);
taskModal.addEventListener('click', e => { if (e.target === taskModal) closeTaskModal(); });

modalDelete.addEventListener('click', () => {
    const id = document.getElementById('task-id').value;
    if (id) { closeTaskModal(); deleteTask(id); }
});

taskForm.addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('task-id').value;
    const title = document.getElementById('task-title').value.trim();
    if (!title) return;

    const tags = document.getElementById('task-tags').value.split(',').map(s => s.trim()).filter(Boolean);
    const subtasks = [];
    document.querySelectorAll('#subtask-list .subtask-item').forEach(el => {
        subtasks.push({
            title: el.querySelector('.subtask-text').textContent,
            done: el.querySelector('.subtask-check').classList.contains('checked')
        });
    });

    const newStatus = document.getElementById('task-status').value;

    if (id) {
        const t = state.tasks.find(x => x.id === id);
        if (!t) return;
        const wasNotDone = t.status !== 'done';
        t.title = title;
        t.description = document.getElementById('task-desc').value.trim();
        t.status = newStatus;
        t.priority = document.getElementById('task-priority').value;
        t.dueDate = document.getElementById('task-due').value || null;
        t.project = document.getElementById('task-project').value || null;
        t.tags = tags;
        t.subtasks = subtasks;
        if (newStatus === 'done' && wasNotDone) {
            t.completedAt = new Date().toISOString();
            addActivity('completed', 'Completed: ' + t.title);
        } else if (newStatus !== 'done') {
            t.completedAt = null;
        }
        addActivity('updated', 'Updated: ' + t.title);
        toast('Task updated', 'success');
    } else {
        const task = {
            id: uid(),
            title,
            description: document.getElementById('task-desc').value.trim(),
            status: newStatus,
            priority: document.getElementById('task-priority').value,
            dueDate: document.getElementById('task-due').value || null,
            project: document.getElementById('task-project').value || null,
            tags,
            subtasks,
            createdAt: new Date().toISOString(),
            completedAt: newStatus === 'done' ? new Date().toISOString() : null
        };
        state.tasks.push(task);
        addActivity('created', 'Created: ' + task.title);
        toast('Task created', 'success');
    }

    save();
    closeTaskModal();
    renderCurrent();
});

/* Subtasks */
document.getElementById('add-subtask-btn').addEventListener('click', () => {
    const input = document.getElementById('subtask-input');
    const val = input.value.trim();
    if (!val) return;
    addSubtaskEl(val, false);
    input.value = '';
    input.focus();
});
document.getElementById('subtask-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); document.getElementById('add-subtask-btn').click(); }
});

function addSubtaskEl(title, done) {
    const list = document.getElementById('subtask-list');
    const el = document.createElement('div');
    el.className = 'subtask-item' + (done ? ' done' : '');
    el.innerHTML = `
        <button type="button" class="subtask-check${done ? ' checked' : ''}"></button>
        <span class="subtask-text">${escHTML(title)}</span>
        <button type="button" class="subtask-remove">×</button>
    `;
    el.querySelector('.subtask-check').addEventListener('click', function() {
        this.classList.toggle('checked');
        el.classList.toggle('done');
    });
    el.querySelector('.subtask-remove').addEventListener('click', () => el.remove());
    list.appendChild(el);
}

/* ═══════════ PROJECTS ═══════════ */

function renderProjects() {
    document.getElementById('projects-count-label').textContent = state.projects.length + ' project' + (state.projects.length !== 1 ? 's' : '');
    const grid = document.getElementById('projects-grid');
    if (state.projects.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">◇</div><div class="empty-state-text">No projects yet</div></div>';
        return;
    }
    grid.innerHTML = state.projects.map(p => {
        const tasks = state.tasks.filter(t => t.project === p.id);
        const done = tasks.filter(t => t.status === 'done').length;
        const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
        return `
        <div class="project-card" data-id="${p.id}">
            <div class="project-card-bar" style="background:${p.color}"></div>
            <div class="project-card-name">${escHTML(p.name)}</div>
            <div class="project-card-count">${tasks.length} task${tasks.length !== 1 ? 's' : ''}</div>
            <div class="project-card-progress"><div class="project-card-fill" style="width:${pct}%;background:${p.color}"></div></div>
            <div class="project-card-stats"><span>${done} done</span><span>${pct}%</span></div>
        </div>`;
    }).join('');

    grid.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => openProjectModal(card.dataset.id));
    });
}

function populateProjectSelects() {
    const selects = [document.getElementById('task-project'), document.getElementById('filter-project')];
    selects.forEach(sel => {
        if (!sel) return;
        const val = sel.value;
        const isFilter = sel.id === 'filter-project';
        sel.innerHTML = isFilter ? '<option value="all">All Projects</option>' : '<option value="">No Project</option>';
        state.projects.forEach(p => {
            sel.innerHTML += `<option value="${p.id}">${escHTML(p.name)}</option>`;
        });
        sel.value = val;
    });
}

/* Project modal */
const projectModal = document.getElementById('project-modal');
const projectForm  = document.getElementById('project-form');

function openProjectModal(id) {
    projectForm.reset();
    document.getElementById('project-color-val').value = '#000000';
    document.querySelectorAll('#color-picker .color-swatch').forEach(s => s.classList.toggle('active', s.dataset.color === '#000000'));

    if (id) {
        const p = state.projects.find(x => x.id === id);
        if (!p) return;
        document.getElementById('project-modal-title').textContent = 'Edit Project';
        document.getElementById('project-delete').classList.remove('hidden');
        document.getElementById('project-id').value = p.id;
        document.getElementById('project-name').value = p.name;
        document.getElementById('project-color-val').value = p.color;
        document.querySelectorAll('#color-picker .color-swatch').forEach(s => s.classList.toggle('active', s.dataset.color === p.color));
    } else {
        document.getElementById('project-modal-title').textContent = 'New Project';
        document.getElementById('project-delete').classList.add('hidden');
        document.getElementById('project-id').value = '';
    }
    projectModal.classList.remove('hidden');
    document.getElementById('project-name').focus();
}

function closeProjectModal() { projectModal.classList.add('hidden'); }
document.getElementById('project-modal-close').addEventListener('click', closeProjectModal);
document.getElementById('project-cancel').addEventListener('click', closeProjectModal);
projectModal.addEventListener('click', e => { if (e.target === projectModal) closeProjectModal(); });

document.querySelectorAll('#color-picker .color-swatch').forEach(s => {
    s.addEventListener('click', () => {
        document.querySelectorAll('#color-picker .color-swatch').forEach(x => x.classList.remove('active'));
        s.classList.add('active');
        document.getElementById('project-color-val').value = s.dataset.color;
    });
});

document.getElementById('project-delete').addEventListener('click', () => {
    const id = document.getElementById('project-id').value;
    if (!id) return;
    showConfirm('Delete Project', 'Delete this project? Tasks in this project will be unassigned.', () => {
        state.projects = state.projects.filter(x => x.id !== id);
        state.tasks.forEach(t => { if (t.project === id) t.project = null; });
        save();
        closeProjectModal();
        renderCurrent();
        toast('Project deleted', 'success');
    });
});

projectForm.addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('project-id').value;
    const name = document.getElementById('project-name').value.trim();
    const color = document.getElementById('project-color-val').value;
    if (!name) return;

    if (id) {
        const p = state.projects.find(x => x.id === id);
        if (p) { p.name = name; p.color = color; }
        toast('Project updated', 'success');
    } else {
        state.projects.push({ id: uid(), name, color });
        toast('Project created', 'success');
    }
    save();
    closeProjectModal();
    renderCurrent();
});

document.getElementById('projects-add-btn').addEventListener('click', () => openProjectModal());

/* ═══════════ ANALYTICS ═══════════ */

function renderAnalytics() {
    const period = state.analyticsPeriod;
    const { from, to } = getAnalyticsDates(period);

    const tasksInRange = state.tasks.filter(t => {
        const cd = t.createdAt ? t.createdAt.slice(0, 10) : null;
        const dd = t.completedAt ? t.completedAt.slice(0, 10) : null;
        return (cd && cd >= from && cd <= to) || (dd && dd >= from && dd <= to);
    });

    const completed = tasksInRange.filter(t => t.status === 'done');
    const created = tasksInRange;

    document.getElementById('analytics-completed-count').textContent = completed.length + ' completed';
    document.getElementById('a-created').textContent = created.length;
    document.getElementById('a-completed').textContent = completed.length;
    document.getElementById('a-rate').textContent = created.length ? Math.round((completed.length / created.length) * 100) + '%' : '0%';

    // avg completion time
    const times = completed.filter(t => t.createdAt && t.completedAt).map(t => {
        return (new Date(t.completedAt) - new Date(t.createdAt)) / 3600000;
    });
    if (times.length) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        document.getElementById('a-avg-time').textContent = avg < 24 ? Math.round(avg) + 'h' : Math.round(avg / 24) + 'd';
    } else {
        document.getElementById('a-avg-time').textContent = '—';
    }

    // most productive day
    const dayMap = {};
    completed.forEach(t => {
        if (t.completedAt) {
            const d = t.completedAt.slice(0, 10);
            dayMap[d] = (dayMap[d] || 0) + 1;
        }
    });
    const bestDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
    document.getElementById('a-best-day').textContent = bestDay ? fmtDate(bestDay[0]) + ' (' + bestDay[1] + ')' : '—';

    // streak
    let streak = 0;
    const d = new Date();
    while (true) {
        const ds = d.toISOString().slice(0, 10);
        if (state.tasks.some(t => t.completedAt && t.completedAt.slice(0, 10) === ds)) {
            streak++;
            d.setDate(d.getDate() - 1);
        } else break;
    }
    document.getElementById('a-streak').textContent = streak + ' day' + (streak !== 1 ? 's' : '');

    renderCompletionChart(from, to, period);
    renderPriorityChart(tasksInRange);
    renderProjectChart(tasksInRange);
}

function getAnalyticsDates(period) {
    const now = new Date();
    let from, to = today();
    switch (period) {
        case 'day':
            from = to;
            break;
        case 'week':
            const w = new Date(now);
            w.setDate(w.getDate() - 6);
            from = w.toISOString().slice(0, 10);
            break;
        case 'month':
            const m = new Date(now);
            m.setMonth(m.getMonth() - 1);
            from = m.toISOString().slice(0, 10);
            break;
        case 'year':
            const y = new Date(now);
            y.setFullYear(y.getFullYear() - 1);
            from = y.toISOString().slice(0, 10);
            break;
        case 'custom':
            from = state.customRange.from || to;
            to = state.customRange.to || to;
            break;
        default:
            from = to;
    }
    return { from, to };
}

function renderCompletionChart(from, to, period) {
    const ctx = document.getElementById('chart-completion');
    if (charts.completion) charts.completion.destroy();

    const dates = [];
    const d = new Date(from);
    const end = new Date(to);
    while (d <= end) {
        dates.push(d.toISOString().slice(0, 10));
        d.setDate(d.getDate() + 1);
    }

    // aggregate by period for year view
    let labels, dataCreated, dataCompleted;
    if (period === 'year' && dates.length > 60) {
        // monthly aggregation
        const months = {};
        dates.forEach(ds => {
            const m = ds.slice(0, 7);
            if (!months[m]) months[m] = { created: 0, completed: 0 };
        });
        state.tasks.forEach(t => {
            if (t.createdAt) {
                const m = t.createdAt.slice(0, 7);
                if (months[m]) months[m].created++;
            }
            if (t.completedAt) {
                const m = t.completedAt.slice(0, 7);
                if (months[m]) months[m].completed++;
            }
        });
        labels = Object.keys(months);
        dataCreated = labels.map(m => months[m].created);
        dataCompleted = labels.map(m => months[m].completed);
    } else {
        labels = dates;
        dataCreated = dates.map(ds => state.tasks.filter(t => t.createdAt && t.createdAt.slice(0, 10) === ds).length);
        dataCompleted = dates.map(ds => state.tasks.filter(t => t.completedAt && t.completedAt.slice(0, 10) === ds).length);
    }

    const shortLabels = labels.map(l => {
        if (l.length === 7) {
            const [y, m] = l.split('-');
            return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m)-1] + ' ' + y.slice(2);
        }
        const dd = new Date(l);
        return dd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    charts.completion = new Chart(ctx, {
        type: 'line',
        data: {
            labels: shortLabels,
            datasets: [
                {
                    label: 'Created',
                    data: dataCreated,
                    borderColor: 'rgba(0,0,0,0.3)',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: dates.length > 30 ? 0 : 3,
                    borderWidth: 2
                },
                {
                    label: 'Completed',
                    data: dataCompleted,
                    borderColor: 'rgba(0,0,0,0.85)',
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: dates.length > 30 ? 0 : 3,
                    borderWidth: 2
                }
            ]
        },
        options: chartOpts()
    });
}

function renderPriorityChart(tasks) {
    const ctx = document.getElementById('chart-priority');
    if (charts.priority) charts.priority.destroy();

    const counts = { urgent: 0, high: 0, medium: 0, low: 0 };
    tasks.forEach(t => { if (counts[t.priority] !== undefined) counts[t.priority]++; });

    charts.priority = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Urgent', 'High', 'Medium', 'Low'],
            datasets: [{
                data: [counts.urgent, counts.high, counts.medium, counts.low],
                backgroundColor: ['#c0392b', '#e67e22', '#f1c40f', '#95a5a6'],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: "'Unbounded', sans-serif", size: 10 }, boxWidth: 12, padding: 12 } }
            }
        }
    });
}

function renderProjectChart(tasks) {
    const ctx = document.getElementById('chart-project');
    if (charts.project) charts.project.destroy();

    const projMap = {};
    tasks.forEach(t => {
        const pname = t.project ? (state.projects.find(p => p.id === t.project)?.name || 'Unknown') : 'No Project';
        projMap[pname] = (projMap[pname] || 0) + 1;
    });

    const labels = Object.keys(projMap);
    const data = Object.values(projMap);
    const colors = labels.map((_, i) => {
        const v = Math.round(((i * 40) + 20) % 100);
        return `hsl(0, 0%, ${v}%)`;
    });

    charts.project = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Tasks',
                data,
                backgroundColor: colors.map(c => c.replace(')', ', 0.6)')),
                borderColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            ...chartOpts(),
            indexAxis: 'y',
            plugins: { legend: { display: false } }
        }
    });
}

/* Analytics tabs */
document.querySelectorAll('.tab-btn[data-period]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn[data-period]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.analyticsPeriod = btn.dataset.period;
        document.getElementById('custom-range').classList.toggle('hidden', btn.dataset.period !== 'custom');
        renderAnalytics();
    });
});

document.getElementById('range-apply').addEventListener('click', () => {
    state.customRange.from = document.getElementById('range-from').value;
    state.customRange.to = document.getElementById('range-to').value;
    renderAnalytics();
});

/* ═══════════ SETTINGS ═══════════ */

['setting-default-view', 'setting-compact', 'setting-show-done', 'setting-reminders', 'setting-sounds'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
        state.settings.defaultView = document.getElementById('setting-default-view').value;
        state.settings.compact = document.getElementById('setting-compact').checked;
        state.settings.showDone = document.getElementById('setting-show-done').checked;
        state.settings.reminders = document.getElementById('setting-reminders').checked;
        state.settings.sounds = document.getElementById('setting-sounds').checked;
        save();
        renderCurrent();
        toast('Settings saved', 'info');
    });
});

document.getElementById('export-btn').addEventListener('click', () => {
    const data = {
        tasks: state.tasks,
        projects: state.projects,
        settings: state.settings,
        activity: state.activity,
        exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'absolute-backup-' + today() + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Data exported', 'success');
});

document.getElementById('import-btn').addEventListener('click', () => {
    const file = document.getElementById('import-file').files[0];
    if (!file) { toast('Select a file first', 'error'); return; }
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.tasks) state.tasks = data.tasks;
            if (data.projects) state.projects = data.projects;
            if (data.settings) state.settings = { ...state.settings, ...data.settings };
            if (data.activity) state.activity = data.activity;
            save();
            applySettings();
            renderCurrent();
            toast('Data imported successfully', 'success');
        } catch {
            toast('Invalid file format', 'error');
        }
    };
    reader.readAsText(file);
});

document.getElementById('clear-btn').addEventListener('click', () => {
    showConfirm('Delete All Data', 'This will permanently delete ALL tasks, projects, and activity. This cannot be undone.', () => {
        state.tasks = [];
        state.projects = [];
        state.activity = [];
        save();
        renderCurrent();
        toast('All data cleared', 'success');
    });
});

/* ═══════════ CONFIRM DIALOG ═══════════ */

let confirmCallback = null;

function showConfirm(title, body, callback) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-body').textContent = body;
    confirmCallback = callback;
    document.getElementById('confirm-modal').classList.remove('hidden');
}

function closeConfirm() {
    document.getElementById('confirm-modal').classList.add('hidden');
    confirmCallback = null;
}

document.getElementById('confirm-yes').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    closeConfirm();
});
document.getElementById('confirm-no').addEventListener('click', closeConfirm);
document.getElementById('confirm-close').addEventListener('click', closeConfirm);
document.getElementById('confirm-modal').addEventListener('click', e => { if (e.target.id === 'confirm-modal') closeConfirm(); });

/* ═══════════ KEYBOARD SHORTCUTS ═══════════ */

document.addEventListener('keydown', e => {
    // skip if typing in input
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if (!isAuthed() || appEl.classList.contains('hidden')) return;

    const key = e.key.toLowerCase();
    if (key === 'n') { e.preventDefault(); openTaskModal(); }
    if (key === 'd') { e.preventDefault(); switchView('dashboard'); }
    if (key === 't') { e.preventDefault(); switchView('tasks'); }
    if (key === 'p') { e.preventDefault(); switchView('projects'); }
    if (key === 'a') { e.preventDefault(); switchView('analytics'); }
    if (key === 'escape') {
        closeTaskModal();
        closeProjectModal();
        closeConfirm();
    }
    if (key === '/') {
        e.preventDefault();
        switchView('tasks');
        setTimeout(() => document.getElementById('task-search').focus(), 100);
    }
});

/* ═══════════ FILTER LISTENERS ═══════════ */

['task-search', 'filter-status', 'filter-priority', 'filter-project', 'sort-by'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => renderTasks());
    document.getElementById(id).addEventListener('change', () => renderTasks());
});

/* ═══════════ ADD BUTTONS ═══════════ */

document.getElementById('dash-add-btn').addEventListener('click', () => openTaskModal());
document.getElementById('tasks-add-btn').addEventListener('click', () => openTaskModal());

/* ═══════════ RENDER CURRENT ─── */

function renderCurrent() {
    if (state.currentView === 'dashboard') renderDashboard();
    else if (state.currentView === 'tasks') renderTasks();
    else if (state.currentView === 'projects') renderProjects();
    else if (state.currentView === 'analytics') renderAnalytics();
}

/* ═══════════ INIT ═══════════ */

if (isAuthed()) {
    showApp();
} else {
    loginPw.focus();
}

})();
