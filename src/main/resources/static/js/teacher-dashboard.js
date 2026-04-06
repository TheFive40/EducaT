const API = 'http://localhost:8080';
let authHeader = '';
let currentUser = null;
let currentTeacher = null;
let teacherCourses = [];
let currentCourse = null;
let currentUnitIdx = 0;

const MOCK = {
    user: { id: 10, name: 'Dr. Carlos Martínez Lozano', email: 'cmartinez@educat.edu.co', role: { id: 2, name: 'DOCENTE' }, status: true },
    teacher: { id: 1, specialization: 'Matemáticas y Ciencias Exactas' },
    courses: [
        { id: 1, name: 'Matemáticas Avanzadas', description: 'Curso integral que abarca álgebra lineal, cálculo diferencial e integral con aplicaciones prácticas en ingeniería y ciencias.', studentsCount: 28 },
        { id: 2, name: 'Literatura y Expresión', description: 'Análisis literario de textos hispanoamericanos, comprensión lectora avanzada y producción textual de diferentes géneros.', studentsCount: 24 },
        { id: 3, name: 'Ciencias Naturales', description: 'Estudio del entorno natural, fenómenos físicos y químicos con énfasis en metodología científica e investigación aplicada.', studentsCount: 30 },
    ],
    students: [
        { id: 1, studentCode: 'EST-2024-101', user: { name: 'María José Rodríguez' } },
        { id: 2, studentCode: 'EST-2024-102', user: { name: 'Andrés Felipe Torres' } },
        { id: 3, studentCode: 'EST-2024-103', user: { name: 'Valentina García Ruiz' } },
        { id: 4, studentCode: 'EST-2024-104', user: { name: 'Santiago López Mejía' } },
        { id: 5, studentCode: 'EST-2024-105', user: { name: 'Daniela Martínez Soto' } },
    ],
    grades: [
        { id: 1, student: { id: 1, user: { name: 'María José Rodríguez' } }, course: { id: 1 }, grade: 8.5, description: 'Excelente desempeño en álgebra lineal' },
        { id: 2, student: { id: 2, user: { name: 'Andrés Felipe Torres' } }, course: { id: 1 }, grade: 7.0, description: 'Buen progreso' },
        { id: 3, student: { id: 3, user: { name: 'Valentina García Ruiz' } }, course: { id: 1 }, grade: 9.2, description: 'Sobresaliente' },
        { id: 4, student: { id: 4, user: { name: 'Santiago López Mejía' } }, course: { id: 1 }, grade: 6.5, description: 'Debe mejorar' },
        { id: 5, student: { id: 5, user: { name: 'Daniela Martínez Soto' } }, course: { id: 1 }, grade: 8.0, description: 'Muy bien' },
    ],
    activities: [
        { id: 1, course: { id: 1 }, title: 'Taller: Matrices y Determinantes', description: 'Resolver los ejercicios de matrices 3x3 del capítulo 2.', dueDate: '2025-04-15' },
        { id: 2, course: { id: 1 }, title: 'Taller: Derivadas Implícitas', description: 'Aplicación de reglas de derivación en funciones implícitas.', dueDate: '2025-04-22' },
        { id: 3, course: { id: 2 }, title: 'Ensayo Literario', description: 'Análisis temático de "Cien años de soledad".', dueDate: '2025-04-18' },
        { id: 4, course: { id: 3 }, title: 'Informe de Laboratorio', description: 'Informe del experimento de reacciones ácido-base.', dueDate: '2025-04-20' },
    ],
    exams: [
        { id: 1, course: { id: 1 }, title: 'Parcial I — Álgebra Lineal', examDate: '2025-04-20' },
        { id: 2, course: { id: 2 }, title: 'Evaluación de Comprensión Lectora', examDate: '2025-04-25' },
        { id: 3, course: { id: 3 }, title: 'Quizz: Tabla Periódica', examDate: '2025-04-17' },
    ],
    schedules: [
        { id: 1, course: { id: 1, name: 'Matemáticas Avanzadas' }, day: 'Lunes', startTime: '07:00', endTime: '09:00' },
        { id: 2, course: { id: 1, name: 'Matemáticas Avanzadas' }, day: 'Miércoles', startTime: '07:00', endTime: '09:00' },
        { id: 3, course: { id: 2, name: 'Literatura y Expresión' }, day: 'Martes', startTime: '09:00', endTime: '11:00' },
        { id: 4, course: { id: 2, name: 'Literatura y Expresión' }, day: 'Jueves', startTime: '09:00', endTime: '11:00' },
        { id: 5, course: { id: 3, name: 'Ciencias Naturales' }, day: 'Viernes', startTime: '11:00', endTime: '13:00' },
    ],
};

const DEFAULT_UNITS = {
    1: [
        { id: 'u1-1', name: 'Unidad 1: Álgebra Lineal', welcome: 'Bienvenidos a la primera unidad de Matemáticas Avanzadas. Exploraremos los conceptos fundamentales del álgebra lineal, que son la base para muchas ramas de las matemáticas aplicadas.', description: 'Esta unidad cubre vectores en espacios n-dimensionales, matrices y operaciones con matrices, transformaciones lineales, sistemas de ecuaciones lineales y su resolución mediante eliminación gaussiana.', announcements: ['Entrega del taller de matrices: viernes antes de las 11:59 p.m.', 'Quiz corto la próxima clase sobre operaciones matriciales.', 'Horas de atención: martes y jueves de 2 a 4 p.m. en la oficina 304.'], activities: [1], exams: [1], forums: [], resources: [{ name: 'Álgebra Lineal — Howard Anton (Cap. 1-3)', type: 'pdf', url: '#' }, { name: 'Video: Introducción a Matrices y Vectores', type: 'video', url: '#' }, { name: 'Guía de Ejercicios Resueltos', type: 'doc', url: '#' }] },
        { id: 'u1-2', name: 'Unidad 2: Cálculo Diferencial', welcome: 'Continuamos con el cálculo diferencial, conectando el álgebra con el análisis del cambio y la optimización.', description: 'Estudiaremos límites y su definición formal, continuidad de funciones, la derivada y sus interpretaciones geométrica y física, reglas de derivación, y aplicaciones en optimización.', announcements: ['Consultar el capítulo 2 de Stewart antes de la próxima clase.'], activities: [2], exams: [], forums: [], resources: [{ name: 'Cálculo — James Stewart (Cap. 2-3)', type: 'pdf', url: '#' }, { name: 'Tabla de Reglas de Derivación', type: 'doc', url: '#' }] },
    ],
    2: [
        { id: 'u2-1', name: 'Unidad 1: Narrativa Hispanoamericana', welcome: 'Bienvenidos a Literatura y Expresión. Nos adentraremos en el fascinante universo de la narrativa hispanoamericana del siglo XX.', description: 'Analizaremos las técnicas narrativas del realismo mágico, el contexto del "Boom" latinoamericano y la obra de autores fundamentales como García Márquez y Cortázar.', announcements: ['Traer "Cien años de soledad" a la próxima clase.', 'El ensayo literario se sube en PDF antes del 18 de abril.'], activities: [3], exams: [2], forums: [], resources: [{ name: 'García Márquez — Cien años de soledad', type: 'pdf', url: '#' }, { name: 'Guía de Análisis Literario', type: 'doc', url: '#' }, { name: 'El Boom Latinoamericano — contexto', type: 'link', url: '#' }] },
    ],
    3: [
        { id: 'u3-1', name: 'Unidad 1: Química General', welcome: 'Bienvenidos a Ciencias Naturales. Esta unidad establece los fundamentos de la química necesarios para comprender los fenómenos naturales del curso.', description: 'Estructura atómica y tabla periódica, tipos de enlace químico, reacciones químicas y balanceo, estequiometría y ácidos y bases con aplicaciones de laboratorio.', announcements: ['El informe de laboratorio se entrega impreso y digital.', 'Próxima práctica: traer bata blanca obligatoriamente.'], activities: [4], exams: [3], forums: [], resources: [{ name: 'Química — Chang y Goldsby (Cap. 1-4)', type: 'pdf', url: '#' }, { name: 'Tabla Periódica Interactiva', type: 'link', url: '#' }, { name: 'Guía de Práctica de Laboratorio', type: 'doc', url: '#' }] },
    ],
};

// ─── Auth / fetch helpers ─────────────────────────────────────────────────────
function getAuth() { return localStorage.getItem('educat_auth') || sessionStorage.getItem('educat_auth'); }
function getEmail() { return localStorage.getItem('educat_email') || sessionStorage.getItem('educat_email'); }

async function apiFetch(url, opts = {}) {
    const headers = { 'Authorization': 'Basic ' + authHeader, 'Content-Type': 'application/json', ...opts.headers };
    try { return await fetch(API + url, { ...opts, headers }); } catch (e) { return null; }
}

async function tryFetch(url) {
    const res = await apiFetch(url);
    if (res && res.ok) { try { return await res.json(); } catch (e) {} }
    return null;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg, type = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + (type ? type + '-toast' : '');
    t.textContent = msg;
    document.getElementById('toastContainer').appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function openModal(title, html) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('modalBackdrop').classList.add('show');
}
function closeModal() { document.getElementById('modalBackdrop').classList.remove('show'); }
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalBackdrop').addEventListener('click', e => { if (e.target === document.getElementById('modalBackdrop')) closeModal(); });

// ─── Units storage ─────────────────────────────────────────────────────────────
function getUnits(courseId) {
    const s = localStorage.getItem('educat_units_' + courseId);
    if (s) try { return JSON.parse(s); } catch (e) {}
    return (DEFAULT_UNITS[courseId] || []).map(u => ({ ...u }));
}
function saveUnits(courseId, units) { localStorage.setItem('educat_units_' + courseId, JSON.stringify(units)); }

// ─── Date ──────────────────────────────────────────────────────────────────────
function setDate() {
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function navigateTo(section) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
    const btn = document.querySelector('[data-section="' + section + '"]');
    if (btn) btn.classList.add('active');
    const panel = document.getElementById('panel-' + section);
    if (panel) panel.classList.add('active');

    // Hide course view
    document.getElementById('courseView').classList.remove('show');
    document.getElementById('mainContent').style.display = '';
    document.getElementById('courseTopbarActions').style.display = 'none';

    const titles = {
        overview: ['Resumen', 'Vista general de tu actividad docente'],
        cursos: ['Mis Cursos', 'Gestión de contenido y unidades'],
        calificaciones: ['Calificaciones', 'Registro y gestión de notas'],
        asistencia: ['Control de Asistencia', 'Registro de asistencia por clase'],
        horarios: ['Horarios', 'Programación de clases'],
        perfil: ['Mi Perfil', 'Datos del docente']
    };
    if (titles[section]) {
        document.getElementById('pageTitle').textContent = titles[section][0];
        document.getElementById('pageSubtitle').textContent = titles[section][1];
    }

    document.getElementById('topbarBreadcrumb').style.display = 'none';
    document.getElementById('pageTitle').style.display = '';
    document.getElementById('pageSubtitle').style.display = '';

    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');

    if (section === 'overview') loadOverview();
    else if (section === 'cursos') loadCursos();
    else if (section === 'calificaciones') loadCalificaciones();
    else if (section === 'asistencia') loadAsistencia();
    else if (section === 'horarios') loadHorarios();
    else if (section === 'perfil') loadPerfil();
}

// ─── Overview ─────────────────────────────────────────────────────────────────
async function loadOverview() {
    const coursesData = await tryFetch('/api/courses/teacher/' + (currentTeacher ? currentTeacher.id : 0));
    teacherCourses = (coursesData && coursesData.length) ? coursesData : MOCK.courses;

    const activitiesData = await tryFetch('/api/activities');
    const actividades = (activitiesData && activitiesData.length) ? activitiesData : MOCK.activities;

    const examsData = await tryFetch('/api/exams');
    const examenes = (examsData && examsData.length) ? examsData : MOCK.exams;

    document.getElementById('statCursos').textContent = teacherCourses.length;
    document.getElementById('statEstudiantes').textContent = teacherCourses.reduce((s, c) => s + (c.studentsCount || 0), 0) || MOCK.courses.reduce((s, c) => s + c.studentsCount, 0);
    document.getElementById('statActividades').textContent = actividades.length;
    document.getElementById('statExamenes').textContent = examenes.length;

    const oC = document.getElementById('overviewCursos');
    oC.innerHTML = teacherCourses.map(c => {
        const courseJSON = JSON.stringify(c).replace(/"/g, '&quot;');
        return `<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(11,31,58,0.05);cursor:pointer" onclick="openCourseView(${courseJSON})">
      <div style="width:9px;height:9px;border-radius:50%;background:var(--teal);flex-shrink:0"></div>
      <div style="flex:1"><div style="font-weight:600;font-size:13.5px">${c.name}</div><div style="font-size:11.5px;color:var(--text-muted)">${c.studentsCount || 0} estudiantes</div></div>
      <svg width="14" height="14" fill="none" stroke="var(--text-muted)" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </div>`;
    }).join('');

    const oA = document.getElementById('overviewActividades');
    oA.innerHTML = actividades.slice(0, 5).map(a => `<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid rgba(11,31,58,0.05)">
    <div style="width:7px;height:7px;border-radius:50%;background:var(--gold);flex-shrink:0;margin-top:5px"></div>
    <div style="flex:1">
      <div style="font-size:13.5px;font-weight:500">${a.title}</div>
      ${a.dueDate ? `<div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Entrega: ${new Date(a.dueDate + 'T00:00:00').toLocaleDateString('es-CO')}</div>` : ''}
    </div>
  </div>`).join('');
}

// ─── Cursos ───────────────────────────────────────────────────────────────────
async function loadCursos() {
    if (!teacherCourses.length) teacherCourses = MOCK.courses;
    const grid = document.getElementById('cursosGrid');
    grid.innerHTML = '<div class="grid-3">' + teacherCourses.map(c => {
        const courseJSON = JSON.stringify(c).replace(/"/g, '&quot;');
        return `<div class="course-card" onclick="openCourseView(${courseJSON})">
      <div class="course-card-top">
        <div class="course-card-name">${c.name}</div>
        <div class="course-card-teacher">${c.studentsCount || 0} estudiantes matriculados</div>
      </div>
      <div class="card-body" style="padding:16px 20px">
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:14px;line-height:1.5">${c.description ? c.description.slice(0, 85) + '...' : ''}</div>
        <div class="course-card-actions">
          <button class="btn btn-teal btn-sm" onclick="event.stopPropagation();openCourseView(${courseJSON})">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/></svg>
            Gestionar contenido
          </button>
        </div>
      </div>
    </div>`;
    }).join('') + '</div>';
}

// ─── Calificaciones ───────────────────────────────────────────────────────────
async function loadCalificaciones() {
    const sel = document.getElementById('gradeCourseFilter');
    const courses = teacherCourses.length ? teacherCourses : MOCK.courses;
    sel.innerHTML = '<option value="">Selecciona un curso</option>' + courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    sel.onchange = () => renderGrades(parseInt(sel.value));
}

function renderGrades(courseId) {
    const container = document.getElementById('calificacionesContainer');
    if (!courseId) { container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Selecciona un curso</div></div>'; return; }
    const courseGrades = MOCK.grades.filter(g => g.course && g.course.id === courseId);
    if (!courseGrades.length) { container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Sin calificaciones registradas</div><div class="empty-state-text">Agrega la primera calificación con el botón "Agregar Nota".</div></div>'; return; }
    container.innerHTML = `<table><thead><tr><th>Código</th><th>Estudiante</th><th>Calificación</th><th>Descripción</th><th>Acciones</th></tr></thead><tbody>` +
        courseGrades.map(g => {
            const val = parseFloat(g.grade || 0);
            const cls = val >= 7 ? 'badge-success' : val >= 5 ? 'badge-gold' : 'badge-error';
            return `<tr>
        <td style="font-size:12px;color:var(--text-muted)">${g.student && g.student.studentCode ? g.student.studentCode : '—'}</td>
        <td>${g.student && g.student.user ? g.student.user.name : '—'}</td>
        <td><span class="badge ${cls}">${val.toFixed(1)}</span></td>
        <td style="font-size:13px;color:var(--text-muted)">${g.description || '—'}</td>
        <td><div style="display:flex;gap:6px">
          <button class="btn btn-sm btn-outline" onclick="editGrade(${g.id},${courseId})">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="deleteGrade(${g.id},${courseId})">Eliminar</button>
        </div></td>
      </tr>`;
        }).join('') + '</tbody></table>';
}

function editGrade(gradeId, courseId) {
    const g = MOCK.grades.find(x => x.id === gradeId);
    if (!g) return;
    openModal('Editar Calificación', `
    <div class="form-group"><label class="form-label">Calificación (0-10)</label><input type="number" class="form-input" id="mGrade" min="0" max="10" step="0.1" value="${g.grade}"></div>
    <div class="form-group"><label class="form-label">Descripción</label><textarea class="form-input" id="mGradeDesc">${g.description || ''}</textarea></div>
    <button class="btn btn-teal" style="width:100%" onclick="saveGradeEdit(${gradeId},${courseId})">Guardar cambios</button>`);
}
function saveGradeEdit(gradeId, courseId) {
    const val = parseFloat(document.getElementById('mGrade').value);
    const desc = document.getElementById('mGradeDesc').value;
    const g = MOCK.grades.find(x => x.id === gradeId);
    if (g && !isNaN(val)) { g.grade = val; g.description = desc; }
    closeModal(); renderGrades(courseId); showToast('Calificación actualizada', 'success');
}
function deleteGrade(gradeId, courseId) {
    const idx = MOCK.grades.findIndex(x => x.id === gradeId);
    if (idx >= 0) MOCK.grades.splice(idx, 1);
    renderGrades(courseId); showToast('Calificación eliminada');
}

document.getElementById('btnNewGrade').addEventListener('click', () => {
    const courseId = parseInt(document.getElementById('gradeCourseFilter').value);
    if (!courseId) { showToast('Selecciona un curso primero', 'error'); return; }
    openModal('Nueva Calificación', `
    <div class="form-group"><label class="form-label">Estudiante</label><select class="form-input" id="mStudent">${MOCK.students.map(s => `<option value="${s.id}">${s.user.name}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Calificación (0-10)</label><input type="number" class="form-input" id="mGrade" min="0" max="10" step="0.1" placeholder="Ej: 8.5"></div>
    <div class="form-group"><label class="form-label">Descripción</label><textarea class="form-input" id="mGradeDesc" placeholder="Observaciones sobre la calificación"></textarea></div>
    <button class="btn btn-teal" style="width:100%" onclick="createGrade(${courseId})">Registrar calificación</button>`);
});
function createGrade(courseId) {
    const sId = parseInt(document.getElementById('mStudent').value);
    const val = parseFloat(document.getElementById('mGrade').value);
    const desc = document.getElementById('mGradeDesc').value;
    if (isNaN(val) || val < 0 || val > 10) { showToast('Calificación inválida', 'error'); return; }
    const student = MOCK.students.find(s => s.id === sId);
    MOCK.grades.push({ id: Date.now(), student: { id: sId, user: { name: student ? student.user.name : '—' } }, course: { id: courseId }, grade: val, description: desc });
    closeModal(); renderGrades(courseId); showToast('Calificación registrada', 'success');
}

// ─── Asistencia ───────────────────────────────────────────────────────────────
async function loadAsistencia() {
    const sel = document.getElementById('attCourseFilter');
    const courses = teacherCourses.length ? teacherCourses : MOCK.courses;
    sel.innerHTML = '<option value="">Selecciona un curso</option>' + courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('attDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('btnLoadAtt').onclick = renderAttendance;
}

let attState = {};
function renderAttendance() {
    const courseId = parseInt(document.getElementById('attCourseFilter').value);
    const date = document.getElementById('attDate').value;
    if (!courseId || !date) { showToast('Selecciona curso y fecha', 'error'); return; }
    const container = document.getElementById('asistenciaContainer');
    const key = 'att_' + courseId + '_' + date;
    attState = JSON.parse(localStorage.getItem(key) || '{}');
    MOCK.students.forEach(s => { if (attState[s.id] === undefined) attState[s.id] = true; });
    container.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
      <button class="btn btn-success-outline btn-sm" onclick="markAll(${courseId},'${date}',true)">Marcar todos presentes</button>
      <button class="btn btn-danger btn-sm" onclick="markAll(${courseId},'${date}',false)">Marcar todos ausentes</button>
      <button class="btn btn-teal btn-sm" onclick="saveAttendance(${courseId},'${date}')">Guardar asistencia</button>
    </div>
    <table><thead><tr><th>Código</th><th>Estudiante</th><th>Estado</th><th>Acción</th></tr></thead><tbody id="attBody"></tbody></table>`;
    renderAttBody(MOCK.students, courseId, date);
}
function renderAttBody(students, courseId, date) {
    const body = document.getElementById('attBody');
    if (!body) return;
    body.innerHTML = students.map(s => {
        const present = attState[s.id] !== undefined ? attState[s.id] : true;
        return `<tr>
      <td style="font-size:12px;color:var(--text-muted)">${s.studentCode}</td>
      <td>${s.user.name}</td>
      <td><span class="badge ${present ? 'badge-success' : 'badge-error'}">${present ? 'Presente' : 'Ausente'}</span></td>
      <td><button class="btn btn-sm ${present ? 'btn-danger' : 'btn-success-outline'}" onclick="toggleAtt(${s.id},${courseId},'${date}')">${present ? 'Marcar ausente' : 'Marcar presente'}</button></td>
    </tr>`;
    }).join('');
}
function toggleAtt(sid, courseId, date) {
    attState[sid] = !attState[sid];
    renderAttBody(MOCK.students, courseId, date);
}
function markAll(courseId, date, val) {
    MOCK.students.forEach(s => attState[s.id] = val);
    renderAttBody(MOCK.students, courseId, date);
}
function saveAttendance(courseId, date) {
    localStorage.setItem('att_' + courseId + '_' + date, JSON.stringify(attState));
    showToast('Asistencia guardada correctamente', 'success');
}

// ─── Horarios ─────────────────────────────────────────────────────────────────
async function loadHorarios() {
    const schedules = MOCK.schedules;
    const container = document.getElementById('horariosContainer');
    const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const sorted = [...schedules].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
    container.innerHTML = '<table><thead><tr><th>Día</th><th>Curso</th><th>Hora Inicio</th><th>Hora Fin</th></tr></thead><tbody>' +
        sorted.map(s => `<tr><td><span class="badge badge-teal">${s.day}</span></td><td><strong>${s.course ? s.course.name : '—'}</strong></td><td>${s.startTime}</td><td>${s.endTime}</td></tr>`).join('') + '</tbody></table>';
}

document.getElementById('btnNewSchedule').addEventListener('click', () => {
    const courses = teacherCourses.length ? teacherCourses : MOCK.courses;
    openModal('Nuevo Horario', `
    <div class="form-group"><label class="form-label">Curso</label><select class="form-input" id="schCourse">${courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Día</label><select class="form-input" id="schDay"><option>Lunes</option><option>Martes</option><option>Miércoles</option><option>Jueves</option><option>Viernes</option><option>Sábado</option></select></div>
      <div></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Hora Inicio</label><input type="time" class="form-input" id="schStart" value="07:00"></div>
      <div class="form-group"><label class="form-label">Hora Fin</label><input type="time" class="form-input" id="schEnd" value="09:00"></div>
    </div>
    <button class="btn btn-teal" style="width:100%" onclick="createSchedule()">Agregar horario</button>`);
});
function createSchedule() {
    const cId = parseInt(document.getElementById('schCourse').value);
    const day = document.getElementById('schDay').value;
    const start = document.getElementById('schStart').value;
    const end = document.getElementById('schEnd').value;
    const course = MOCK.courses.find(c => c.id === cId) || {};
    MOCK.schedules.push({ id: Date.now(), course: { id: cId, name: course.name }, day, startTime: start, endTime: end });
    closeModal(); loadHorarios(); showToast('Horario agregado', 'success');
}

// ─── Perfil ───────────────────────────────────────────────────────────────────
function loadPerfil() {
    const u = currentUser || MOCK.user;
    const t = currentTeacher || MOCK.teacher;
    document.getElementById('profName').value = u.name || '';
    document.getElementById('profEmail').value = u.email || '';
    document.getElementById('profSpecialization').value = t.specialization || '';
}

async function saveProfile() {
    const name = document.getElementById('profName').value.trim();
    const email = document.getElementById('profEmail').value.trim();
    const pw = document.getElementById('profPassword').value;
    const cf = document.getElementById('profConfirm').value;
    const alertEl = document.getElementById('profileAlert');
    alertEl.style.display = 'none';
    if (!name || !email) { alertEl.textContent = 'Nombre y correo son obligatorios.'; alertEl.style.display = 'flex'; alertEl.className = 'alert alert-error'; return; }
    if (pw && pw !== cf) { alertEl.textContent = 'Las contraseñas no coinciden.'; alertEl.style.display = 'flex'; alertEl.className = 'alert alert-error'; return; }
    document.getElementById('sidebarUserName').textContent = name;
    alertEl.textContent = 'Perfil actualizado correctamente.'; alertEl.style.display = 'flex'; alertEl.className = 'alert alert-success';
    showToast('Perfil actualizado', 'success');
}

// ─── Course View ──────────────────────────────────────────────────────────────
function openCourseView(course) {
    currentCourse = typeof course === 'string' ? JSON.parse(course) : course;
    currentUnitIdx = 0;

    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('courseView').classList.add('show');
    document.getElementById('courseTopbarActions').style.display = 'flex';

    document.getElementById('pageTitle').style.display = 'none';
    document.getElementById('pageSubtitle').style.display = 'none';
    document.getElementById('topbarBreadcrumb').style.display = 'flex';
    document.getElementById('breadcrumbCourseName').textContent = currentCourse.name || 'Curso';

    renderUnitTabs();
    renderUnit(0);
}

document.getElementById('cvBackBtn').addEventListener('click', () => {
    document.getElementById('courseView').classList.remove('show');
    document.getElementById('mainContent').style.display = '';
    document.getElementById('courseTopbarActions').style.display = 'none';
    document.getElementById('topbarBreadcrumb').style.display = 'none';
    document.getElementById('pageTitle').style.display = '';
    document.getElementById('pageSubtitle').style.display = '';
});

document.getElementById('breadcrumbBack').addEventListener('click', () => {
    document.getElementById('courseView').classList.remove('show');
    document.getElementById('mainContent').style.display = '';
    document.getElementById('courseTopbarActions').style.display = 'none';
    document.getElementById('topbarBreadcrumb').style.display = 'none';
    document.getElementById('pageTitle').style.display = '';
    document.getElementById('pageSubtitle').style.display = '';
});

// ─── Unit tabs ────────────────────────────────────────────────────────────────
function renderUnitTabs() {
    const units = getUnits(currentCourse.id);
    const bar = document.getElementById('unitTabsBar');
    if (!units.length) {
        bar.innerHTML = '<div style="padding:0 20px;font-size:13px;color:var(--text-muted);display:flex;align-items:center;min-height:52px">Sin unidades. Usa "+ Nueva Unidad" para empezar.</div>';
        return;
    }
    bar.innerHTML = units.map((u, i) => `
    <button class="unit-tab ${i === 0 ? 'active' : ''}" onclick="renderUnit(${i})">
      <span class="unit-tab-num">${i + 1}</span>
      ${u.name}
    </button>`).join('') +
        `<button class="unit-tab-add" id="btnAddUnit" onclick="addUnitModal()">
      <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Nueva Unidad
    </button>`;
}

// ─── Render Unit Content ───────────────────────────────────────────────────────
function renderUnit(idx) {
    currentUnitIdx = idx;
    const units = getUnits(currentCourse.id);
    document.querySelectorAll('.unit-tab').forEach((el, i) => el.classList.toggle('active', i === idx));

    const contentArea = document.getElementById('unitContentArea');
    if (!units.length) {
        contentArea.innerHTML = `<div class="empty-state">
      <div class="empty-state-title">Sin unidades</div>
      <div class="empty-state-text">Agrega la primera unidad usando el botón "Nueva Unidad".</div>
      <button class="btn btn-teal" style="margin-top:16px" onclick="addUnitModal()">Agregar primera unidad</button>
    </div>`;
        return;
    }

    const unit = units[idx];
    const allActs = MOCK.activities.filter(a => a.course && a.course.id === currentCourse.id);
    const allExams = MOCK.exams.filter(x => x.course && x.course.id === currentCourse.id);
    const acts = unit.activities ? allActs.filter(a => unit.activities.includes(a.id)) : [];
    const exams = unit.exams ? allExams.filter(x => unit.exams.includes(x.id)) : [];
    const announcements = unit.announcements || [];
    const resources = unit.resources || [];

    contentArea.innerHTML = `
    <div class="unit-welcome">
      <div class="unit-welcome-content">
        <div class="unit-welcome-label">Unidad ${idx + 1}</div>
        <div class="unit-welcome-title">${unit.name}</div>
        <div class="unit-welcome-text">${unit.welcome || 'Sin texto de bienvenida.'}</div>
      </div>
      <div class="unit-welcome-actions">
        <button class="unit-welcome-edit" onclick="editUnitModal(${idx})">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/></svg>
          Editar unidad
        </button>
        <button class="unit-welcome-edit" style="margin-top:8px;border-color:rgba(192,57,43,0.3);color:rgba(255,100,100,0.8)" onclick="deleteUnitConfirm(${idx})">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          Eliminar unidad
        </button>
      </div>
    </div>

    <div class="unit-description-card" style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px">Descripción del Tema</div>
      <p style="font-size:14px;line-height:1.75;color:var(--text-body)">${unit.description || 'Sin descripción. Edita la unidad para agregar una.'}</p>
    </div>

    <!-- Anuncios -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-header">
        <span class="card-title">Anuncios</span>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="badge badge-gold">${announcements.length}</span>
          <button class="btn btn-sm btn-outline" onclick="addAnnouncementModal(${idx})">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Agregar
          </button>
        </div>
      </div>
      <div class="card-body" id="announcementsBody">
        ${announcements.length ? announcements.map((a, ai) => `
        <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid rgba(11,31,58,0.05)">
          <div style="width:8px;height:8px;border-radius:50%;background:var(--gold);flex-shrink:0;margin-top:5px"></div>
          <div style="flex:1;font-size:13.5px;line-height:1.6">${a}</div>
          <button class="btn-icon del" onclick="removeAnnouncement(${idx},${ai})" title="Eliminar">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>`).join('') : '<div style="color:var(--text-muted);font-size:13px">Sin anuncios para esta unidad.</div>'}
      </div>
    </div>

    <!-- Actividades -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-header">
        <span class="card-title">Talleres y Actividades</span>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="badge badge-navy">${acts.length}</span>
          <button class="btn btn-sm btn-outline" onclick="addActivityModal(${idx})">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Agregar
          </button>
        </div>
      </div>
      <div class="card-body">
        ${acts.length ? acts.map((a, i) => `
        <div class="activity-card" style="margin-bottom:10px">
          <div class="activity-card-header">
            <div class="activity-num">${i + 1}</div>
            <div class="activity-header-meta">
              <div class="activity-title">${a.title}</div>
              ${a.dueDate ? `<div class="activity-due"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Entrega: ${new Date(a.dueDate + 'T00:00:00').toLocaleDateString('es-CO')}</div>` : ''}
            </div>
            <div style="display:flex;gap:4px">
              <button class="btn-icon" onclick="editActivityModal(${a.id},${idx})" title="Editar"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/></svg></button>
              <button class="btn-icon del" onclick="removeActivity(${a.id},${idx})" title="Eliminar"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button>
            </div>
          </div>
          ${a.description ? `<div class="activity-card-body" style="display:block"><div class="activity-description">${a.description}</div></div>` : ''}
        </div>`).join('') : '<div style="color:var(--text-muted);font-size:13px;padding:4px 0">Sin talleres asignados.</div>'}
        <button class="add-item-btn" onclick="addActivityModal(${idx})">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Agregar taller o actividad
        </button>
      </div>
    </div>

    <!-- Evaluaciones -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-header">
        <span class="card-title">Evaluaciones</span>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="badge badge-error">${exams.length}</span>
          <button class="btn btn-sm btn-outline" onclick="addExamModal(${idx})">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Agregar
          </button>
        </div>
      </div>
      <div class="card-body">
        ${exams.length ? exams.map((x, i) => `
        <div class="exam-card" style="margin-bottom:10px">
          <div class="exam-card-header">
            <div class="exam-num">${i + 1}</div>
            <div class="exam-header-meta">
              <div class="exam-title">${x.title}</div>
              ${x.examDate ? `<div class="exam-date"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Fecha: ${new Date(x.examDate + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</div>` : ''}
            </div>
            <div style="display:flex;gap:4px">
              <button class="btn-icon" onclick="editExamModal(${x.id},${idx})"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/></svg></button>
              <button class="btn-icon del" onclick="removeExam(${x.id},${idx})"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button>
            </div>
          </div>
        </div>`).join('') : '<div style="color:var(--text-muted);font-size:13px;padding:4px 0">Sin evaluaciones programadas.</div>'}
        <button class="add-item-btn" onclick="addExamModal(${idx})">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Agregar evaluación
        </button>
      </div>
    </div>

    <!-- Recursos -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-header">
        <span class="card-title">Bibliografía y Recursos</span>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="badge badge-success">${resources.length}</span>
          <button class="btn btn-sm btn-outline" onclick="addResourceModal(${idx})">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Agregar
          </button>
        </div>
      </div>
      <div class="card-body">
        ${resources.map((r, ri) => `
        <div class="resource-card-item" style="cursor:default">
          <div class="resource-icon ${r.type || 'doc'}"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
          <span class="resource-name">${r.name}</span>
          <span class="resource-type">${(r.type || 'doc').toUpperCase()}</span>
          <button class="btn-icon del" onclick="removeResource(${idx},${ri})" title="Eliminar"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button>
        </div>`).join('') || '<div style="color:var(--text-muted);font-size:13px;padding:4px 0">Sin recursos asignados.</div>'}
        <button class="add-item-btn" onclick="addResourceModal(${idx})">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Agregar recurso o bibliografía
        </button>
      </div>
    </div>
  `;
}

// ─── Unit modals ──────────────────────────────────────────────────────────────
function addUnitModal() {
    openModal('Nueva Unidad', `
    <div class="form-group"><label class="form-label">Nombre de la unidad</label><input type="text" class="form-input" id="mUnitName" placeholder="Ej: Unidad 1 — Álgebra Lineal"></div>
    <div class="form-group"><label class="form-label">Texto de bienvenida</label><textarea class="form-input" id="mUnitWelcome" placeholder="Texto introductorio de bienvenida..."></textarea></div>
    <div class="form-group"><label class="form-label">Descripción del tema</label><textarea class="form-input" id="mUnitDesc" placeholder="Descripción detallada de los temas..."></textarea></div>
    <button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="createUnit()">Crear unidad</button>`);
}
function createUnit() {
    const name = document.getElementById('mUnitName').value.trim();
    if (!name) { showToast('El nombre de la unidad es obligatorio', 'error'); return; }
    const units = getUnits(currentCourse.id);
    units.push({ id: 'u' + Date.now(), name, welcome: document.getElementById('mUnitWelcome').value, description: document.getElementById('mUnitDesc').value, announcements: [], activities: [], exams: [], forums: [], resources: [] });
    saveUnits(currentCourse.id, units);
    closeModal(); renderUnitTabs(); renderUnit(units.length - 1); showToast('Unidad creada', 'success');
}

function editUnitModal(idx) {
    const units = getUnits(currentCourse.id);
    const u = units[idx];
    openModal('Editar Unidad', `
    <div class="form-group"><label class="form-label">Nombre</label><input type="text" class="form-input" id="mUnitName" value="${u.name}"></div>
    <div class="form-group"><label class="form-label">Texto de bienvenida</label><textarea class="form-input" id="mUnitWelcome">${u.welcome || ''}</textarea></div>
    <div class="form-group"><label class="form-label">Descripción</label><textarea class="form-input" id="mUnitDesc">${u.description || ''}</textarea></div>
    <button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="saveUnitEdit(${idx})">Guardar cambios</button>`);
}
function saveUnitEdit(idx) {
    const units = getUnits(currentCourse.id);
    units[idx].name = document.getElementById('mUnitName').value.trim() || units[idx].name;
    units[idx].welcome = document.getElementById('mUnitWelcome').value;
    units[idx].description = document.getElementById('mUnitDesc').value;
    saveUnits(currentCourse.id, units);
    closeModal(); renderUnitTabs(); renderUnit(idx); showToast('Unidad actualizada', 'success');
}
function deleteUnitConfirm(idx) {
    if (!confirm('¿Eliminar esta unidad y todo su contenido?')) return;
    const units = getUnits(currentCourse.id);
    units.splice(idx, 1);
    saveUnits(currentCourse.id, units);
    const newIdx = Math.max(0, idx - 1);
    renderUnitTabs();
    if (units.length) renderUnit(newIdx);
    else document.getElementById('unitContentArea').innerHTML = '<div class="empty-state"><div class="empty-state-title">Sin unidades</div><div class="empty-state-text">Agrega la primera unidad.</div></div>';
    showToast('Unidad eliminada');
}

// ─── Announcement modals ──────────────────────────────────────────────────────
function addAnnouncementModal(unitIdx) {
    openModal('Nuevo Anuncio', `
    <div class="form-group"><label class="form-label">Texto del anuncio</label><textarea class="form-input" id="mAnnouncementText" placeholder="Escribe el anuncio para los estudiantes..." style="min-height:100px"></textarea></div>
    <button class="btn btn-teal" style="width:100%" onclick="saveAnnouncement(${unitIdx})">Publicar anuncio</button>`);
}
function saveAnnouncement(unitIdx) {
    const text = document.getElementById('mAnnouncementText').value.trim();
    if (!text) { showToast('Escribe el texto del anuncio', 'error'); return; }
    const units = getUnits(currentCourse.id);
    units[unitIdx].announcements = units[unitIdx].announcements || [];
    units[unitIdx].announcements.push(text);
    saveUnits(currentCourse.id, units);
    closeModal(); renderUnit(unitIdx); showToast('Anuncio publicado', 'success');
}
function removeAnnouncement(unitIdx, annIdx) {
    const units = getUnits(currentCourse.id);
    units[unitIdx].announcements.splice(annIdx, 1);
    saveUnits(currentCourse.id, units);
    renderUnit(unitIdx); showToast('Anuncio eliminado');
}

// ─── Activity modals ──────────────────────────────────────────────────────────
function addActivityModal(unitIdx) {
    openModal('Nueva Actividad', `
    <div class="form-group"><label class="form-label">Título</label><input type="text" class="form-input" id="mActTitle" placeholder="Ej: Taller — Matrices y Determinantes"></div>
    <div class="form-group"><label class="form-label">Descripción</label><textarea class="form-input" id="mActDesc" placeholder="Descripción de la actividad..."></textarea></div>
    <div class="form-group"><label class="form-label">Fecha de entrega</label><input type="date" class="form-input" id="mActDate"></div>
    <button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="saveActivity(${unitIdx})">Agregar actividad</button>`);
}
function saveActivity(unitIdx) {
    const title = document.getElementById('mActTitle').value.trim();
    if (!title) { showToast('El título es obligatorio', 'error'); return; }
    const newAct = { id: Date.now(), course: { id: currentCourse.id }, title, description: document.getElementById('mActDesc').value, dueDate: document.getElementById('mActDate').value };
    MOCK.activities.push(newAct);
    const units = getUnits(currentCourse.id);
    units[unitIdx].activities = units[unitIdx].activities || [];
    units[unitIdx].activities.push(newAct.id);
    saveUnits(currentCourse.id, units);
    closeModal(); renderUnit(unitIdx); showToast('Actividad agregada', 'success');
}
function editActivityModal(actId, unitIdx) {
    const a = MOCK.activities.find(x => x.id === actId);
    if (!a) return;
    openModal('Editar Actividad', `
    <div class="form-group"><label class="form-label">Título</label><input type="text" class="form-input" id="mActTitle" value="${a.title}"></div>
    <div class="form-group"><label class="form-label">Descripción</label><textarea class="form-input" id="mActDesc">${a.description || ''}</textarea></div>
    <div class="form-group"><label class="form-label">Fecha de entrega</label><input type="date" class="form-input" id="mActDate" value="${a.dueDate || ''}"></div>
    <button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="updateActivity(${actId},${unitIdx})">Guardar cambios</button>`);
}
function updateActivity(actId, unitIdx) {
    const a = MOCK.activities.find(x => x.id === actId);
    if (!a) return;
    a.title = document.getElementById('mActTitle').value.trim() || a.title;
    a.description = document.getElementById('mActDesc').value;
    a.dueDate = document.getElementById('mActDate').value;
    closeModal(); renderUnit(unitIdx); showToast('Actividad actualizada', 'success');
}
function removeActivity(actId, unitIdx) {
    const units = getUnits(currentCourse.id);
    units[unitIdx].activities = (units[unitIdx].activities || []).filter(id => id !== actId);
    saveUnits(currentCourse.id, units);
    renderUnit(unitIdx); showToast('Actividad eliminada de esta unidad');
}

// ─── Exam modals ──────────────────────────────────────────────────────────────
function addExamModal(unitIdx) {
    openModal('Nueva Evaluación', `
    <div class="form-group"><label class="form-label">Título</label><input type="text" class="form-input" id="mExTitle" placeholder="Ej: Parcial I — Álgebra Lineal"></div>
    <div class="form-group"><label class="form-label">Fecha</label><input type="date" class="form-input" id="mExDate"></div>
    <button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="saveExam(${unitIdx})">Programar evaluación</button>`);
}
function saveExam(unitIdx) {
    const title = document.getElementById('mExTitle').value.trim();
    if (!title) { showToast('El título es obligatorio', 'error'); return; }
    const newExam = { id: Date.now(), course: { id: currentCourse.id }, title, examDate: document.getElementById('mExDate').value };
    MOCK.exams.push(newExam);
    const units = getUnits(currentCourse.id);
    units[unitIdx].exams = units[unitIdx].exams || [];
    units[unitIdx].exams.push(newExam.id);
    saveUnits(currentCourse.id, units);
    closeModal(); renderUnit(unitIdx); showToast('Evaluación programada', 'success');
}
function editExamModal(examId, unitIdx) {
    const x = MOCK.exams.find(e => e.id === examId);
    if (!x) return;
    openModal('Editar Evaluación', `
    <div class="form-group"><label class="form-label">Título</label><input type="text" class="form-input" id="mExTitle" value="${x.title}"></div>
    <div class="form-group"><label class="form-label">Fecha</label><input type="date" class="form-input" id="mExDate" value="${x.examDate || ''}"></div>
    <button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="updateExam(${examId},${unitIdx})">Guardar cambios</button>`);
}
function updateExam(examId, unitIdx) {
    const x = MOCK.exams.find(e => e.id === examId);
    if (!x) return;
    x.title = document.getElementById('mExTitle').value.trim() || x.title;
    x.examDate = document.getElementById('mExDate').value;
    closeModal(); renderUnit(unitIdx); showToast('Evaluación actualizada', 'success');
}
function removeExam(examId, unitIdx) {
    const units = getUnits(currentCourse.id);
    units[unitIdx].exams = (units[unitIdx].exams || []).filter(id => id !== examId);
    saveUnits(currentCourse.id, units);
    renderUnit(unitIdx); showToast('Evaluación eliminada de esta unidad');
}

// ─── Resource modals ──────────────────────────────────────────────────────────
function addResourceModal(unitIdx) {
    openModal('Agregar Recurso', `
    <div class="form-group"><label class="form-label">Nombre del recurso</label><input type="text" class="form-input" id="mResName" placeholder="Ej: Álgebra Lineal — Howard Anton (Cap. 1-3)"></div>
    <div class="form-group"><label class="form-label">Tipo</label><select class="form-input" id="mResType"><option value="pdf">PDF</option><option value="doc">Documento</option><option value="link">Enlace web</option><option value="video">Video</option></select></div>
    <div class="form-group"><label class="form-label">URL (opcional)</label><input type="url" class="form-input" id="mResUrl" placeholder="https://..."></div>
    <button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="saveResource(${unitIdx})">Agregar recurso</button>`);
}
function saveResource(unitIdx) {
    const name = document.getElementById('mResName').value.trim();
    if (!name) { showToast('El nombre del recurso es obligatorio', 'error'); return; }
    const units = getUnits(currentCourse.id);
    units[unitIdx].resources = units[unitIdx].resources || [];
    units[unitIdx].resources.push({ name, type: document.getElementById('mResType').value, url: document.getElementById('mResUrl').value || '#' });
    saveUnits(currentCourse.id, units);
    closeModal(); renderUnit(unitIdx); showToast('Recurso agregado', 'success');
}
function removeResource(unitIdx, resIdx) {
    const units = getUnits(currentCourse.id);
    units[unitIdx].resources.splice(resIdx, 1);
    saveUnits(currentCourse.id, units);
    renderUnit(unitIdx); showToast('Recurso eliminado');
}

// ─── Edit course ──────────────────────────────────────────────────────────────
document.getElementById('btnEditCourse').addEventListener('click', () => {
    if (!currentCourse) return;
    openModal('Editar Curso', `
    <div class="form-group"><label class="form-label">Nombre del curso</label><input type="text" class="form-input" id="mCourseName" value="${currentCourse.name || ''}"></div>
    <div class="form-group"><label class="form-label">Descripción</label><textarea class="form-input" id="mCourseDesc">${currentCourse.description || ''}</textarea></div>
    <button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="saveCourseEdit()">Guardar cambios</button>`);
});
function saveCourseEdit() {
    currentCourse.name = document.getElementById('mCourseName').value.trim() || currentCourse.name;
    currentCourse.description = document.getElementById('mCourseDesc').value;
    document.getElementById('breadcrumbCourseName').textContent = currentCourse.name;
    closeModal(); showToast('Curso actualizado', 'success');
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
    authHeader = getAuth() || btoa('docente@educat.edu.co:demo1234');
    setDate();

    const usersData = await tryFetch('/api/users');
    const email = getEmail() || MOCK.user.email;
    if (usersData && usersData.length) currentUser = usersData.find(u => u.email === email) || null;
    if (!currentUser) currentUser = MOCK.user;

    const teachersData = await tryFetch('/api/teachers');
    if (teachersData && teachersData.length) currentTeacher = teachersData.find(t => t.user && t.user.id === currentUser.id) || null;
    if (!currentTeacher) currentTeacher = MOCK.teacher;

    document.getElementById('sidebarUserName').textContent = currentUser.name;
    document.getElementById('sidebarSpecialization').textContent = currentTeacher.specialization || 'Docente';

    await loadOverview();
}

// ─── Event listeners ──────────────────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => navigateTo(btn.dataset.section)));
document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('show');
});
document.getElementById('sidebarOverlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
});
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('educat_auth'); localStorage.removeItem('educat_email');
    sessionStorage.removeItem('educat_auth'); sessionStorage.removeItem('educat_email');
    window.location.href = 'login.html';
});
document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);

init();