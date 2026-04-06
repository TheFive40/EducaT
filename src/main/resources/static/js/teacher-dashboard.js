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
        { id: 'u1-1', name: 'Unidad 1: Álgebra Lineal', welcome: 'Bienvenidos a la primera unidad de Matemáticas Avanzadas. Exploraremos los conceptos fundamentales del álgebra lineal, que son la base para muchas ramas de las matemáticas aplicadas y la ingeniería.', description: 'Esta unidad cubre vectores en espacios n-dimensionales, matrices y operaciones con matrices, transformaciones lineales, sistemas de ecuaciones lineales y su resolución mediante eliminación gaussiana.', announcements: ['Entrega del taller de matrices: viernes antes de las 11:59 p.m.', 'Quiz corto la próxima clase sobre operaciones matriciales.', 'Horas de atención: martes y jueves de 2 a 4 p.m. en la oficina 304.'], activities: [1], exams: [1], forums: [1], resources: [{ name: 'Álgebra Lineal — Howard Anton (Cap. 1-3)', type: 'pdf', url: '#' }, { name: 'Video: Introducción a Matrices y Vectores', type: 'video', url: '#' }, { name: 'Guía de Ejercicios Resueltos', type: 'doc', url: '#' }] },
        { id: 'u1-2', name: 'Unidad 2: Cálculo Diferencial', welcome: 'Continuamos con el cálculo diferencial, una de las herramientas más poderosas de las matemáticas modernas. Conecta el álgebra con el análisis del cambio y la optimización.', description: 'Estudiaremos límites y su definición formal, continuidad de funciones, la derivada y sus interpretaciones geométrica y física, reglas de derivación, y aplicaciones en optimización.', announcements: ['Consultar el capítulo 2 de Stewart antes de la próxima clase.'], activities: [2], exams: [], forums: [], resources: [{ name: 'Cálculo — James Stewart (Cap. 2-3)', type: 'pdf', url: '#' }, { name: 'Tabla de Reglas de Derivación', type: 'doc', url: '#' }] },
    ],
    2: [
        { id: 'u2-1', name: 'Unidad 1: Narrativa Hispanoamericana', welcome: 'Bienvenidos a Literatura y Expresión. Nos adentraremos en el fascinante universo de la narrativa hispanoamericana, un movimiento que revolucionó la literatura mundial en el siglo XX.', description: 'Analizaremos las técnicas narrativas del realismo mágico, el contexto del "Boom" latinoamericano y la obra de autores fundamentales como García Márquez y Cortázar.', announcements: ['Traer "Cien años de soledad" a la próxima clase.', 'El ensayo literario se sube en PDF antes del 18 de abril.'], activities: [3], exams: [2], forums: [2], resources: [{ name: 'García Márquez — Cien años de soledad', type: 'pdf', url: '#' }, { name: 'Guía de Análisis Literario', type: 'doc', url: '#' }, { name: 'El Boom Latinoamericano — contexto', type: 'link', url: '#' }] },
    ],
    3: [
        { id: 'u3-1', name: 'Unidad 1: Química General', welcome: 'Bienvenidos a Ciencias Naturales. Esta unidad establece los fundamentos de la química que necesitan para comprender los fenómenos naturales del curso.', description: 'Estructura atómica y tabla periódica, tipos de enlace químico, reacciones químicas y balanceo, estequiometría y ácidos y bases con aplicaciones de laboratorio.', announcements: ['El informe de laboratorio se entrega impreso y digital.', 'Próxima práctica: traer bata blanca obligatoriamente.'], activities: [4], exams: [3], forums: [3], resources: [{ name: 'Química — Chang y Goldsby (Cap. 1-4)', type: 'pdf', url: '#' }, { name: 'Tabla Periódica Interactiva', type: 'link', url: '#' }, { name: 'Guía de Práctica de Laboratorio', type: 'doc', url: '#' }] },
    ],
};

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
function showToast(msg, type = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + (type ? type + '-toast' : '');
    t.textContent = msg;
    document.getElementById('toastContainer').appendChild(t);
    setTimeout(() => t.remove(), 3500);
}
function openModal(title, html, onOk) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('modalBackdrop').classList.add('show');
    if (onOk) document.getElementById('modalBody').dataset.onok = 'pending';
    document.getElementById('modalBackdrop').dataset.callback = '';
    window._modalOk = onOk || null;
}
function closeModal() { document.getElementById('modalBackdrop').classList.remove('show'); }
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalBackdrop').addEventListener('click', e => { if (e.target === document.getElementById('modalBackdrop')) closeModal(); });

function getUnits(courseId) {
    const s = localStorage.getItem('educat_units_' + courseId);
    if (s) try { return JSON.parse(s); } catch (e) {}
    return (DEFAULT_UNITS[courseId] || []).map(u => ({ ...u }));
}
function saveUnits(courseId, units) { localStorage.setItem('educat_units_' + courseId, JSON.stringify(units)); }

function setDate() { document.getElementById('currentDate').textContent = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }

function navigateTo(section) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
    const btn = document.querySelector('[data-section="' + section + '"]');
    if (btn) btn.classList.add('active');
    const panel = document.getElementById('panel-' + section);
    if (panel) panel.classList.add('active');
    const titles = { overview: ['Resumen', 'Vista general de tu actividad docente'], cursos: ['Mis Cursos', 'Gestión de contenido y unidades'], calificaciones: ['Calificaciones', 'Registro y gestión de notas'], asistencia: ['Control de Asistencia', 'Registro de asistencia por clase'], horarios: ['Horarios', 'Programación de clases'], perfil: ['Mi Perfil', 'Datos del docente'] };
    if (titles[section]) { document.getElementById('pageTitle').textContent = titles[section][0]; document.getElementById('pageSubtitle').textContent = titles[section][1]; }
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
    if (section === 'overview') loadOverview();
    else if (section === 'cursos') loadCursos();
    else if (section === 'calificaciones') loadCalificaciones();
    else if (section === 'asistencia') loadAsistencia();
    else if (section === 'horarios') loadHorarios();
    else if (section === 'perfil') loadPerfil();
}

async function loadOverview() {
    const coursesData = await tryFetch('/api/courses/teacher/' + (currentTeacher ? currentTeacher.id : 0));
    teacherCourses = coursesData && coursesData.length ? coursesData : MOCK.courses;
    const activitiesData = await tryFetch('/api/activities');
    const actividades = activitiesData && activitiesData.length ? activitiesData : MOCK.activities;
    const examsData = await tryFetch('/api/exams');
    const examenes = examsData && examsData.length ? examsData : MOCK.exams;

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
    <div style="flex:1"><div style="font-size:13.5px;font-weight:500">${a.title}</div>${a.dueDate ? `<div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Entrega: ${new Date(a.dueDate + 'T00:00:00').toLocaleDateString('es-CO')}</div>` : ''}</div>
  </div>`).join('');
}

async function loadCursos() {
    if (!teacherCourses.length) teacherCourses = MOCK.courses;
    const grid = document.getElementById('cursosGrid');
    grid.innerHTML = '<div class="grid-3">' + teacherCourses.map(c => {
        const courseJSON = JSON.stringify(c).replace(/"/g, '&quot;');
        return `<div class="course-card" onclick="openCourseView(${courseJSON})">
      <div class="course-card-top">
        <div class="course-card-name">${c.name}</div>
        <div class="course-card-desc">${c.studentsCount || 0} estudiantes matriculados</div>
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
    container.innerHTML = `<table><thead><tr><th>Codigo</th><th>Estudiante</th><th>Calificacion</th><th>Descripcion</th><th>Acciones</th></tr></thead><tbody>` +
        courseGrades.map(g => {
            const val = parseFloat(g.grade || 0);
            const cls = val >= 7 ? 'badge-success' : val >= 5 ? 'badge-gold' : 'badge-error';
            return `<tr><td style="font-size:12px;color:var(--text-muted)">${g.student && g.student.studentCode ? g.student.studentCode : '—'}</td><td>${g.student && g.student.user ? g.student.user.name : '—'}</td><td><span class="badge ${cls}">${val.toFixed(1)}</span></td><td style="font-size:13px;color:var(--text-muted)">${g.description || '—'}</td><td><div style="display:flex;gap:6px"><button class="btn btn-sm btn-outline" onclick="editGrade(${g.id},${courseId})">Editar</button><button class="btn btn-sm btn-danger" onclick="deleteGrade(${g.id},${courseId})">Eliminar</button></div></td></tr>`;
        }).join('') + '</tbody></table>';
}

function editGrade(gradeId, courseId) {
    const g = MOCK.grades.find(x => x.id === gradeId);
    if (!g) return;
    openModal('Editar Calificacion', `<div class="form-group"><label class="form-label">Calificacion (0-10)</label><input type="number" class="form-input" id="mGrade" min="0" max="10" step="0.1" value="${g.grade}"></div><div class="form-group"><label class="form-label">Descripcion</label><textarea class="form-input" id="mGradeDesc">${g.description || ''}</textarea></div><button class="btn btn-teal" style="width:100%" onclick="saveGradeEdit(${gradeId},${courseId})">Guardar cambios</button>`);
}
function saveGradeEdit(gradeId, courseId) {
    const val = parseFloat(document.getElementById('mGrade').value);
    const desc = document.getElementById('mGradeDesc').value;
    const g = MOCK.grades.find(x => x.id === gradeId);
    if (g && !isNaN(val)) { g.grade = val; g.description = desc; }
    closeModal(); renderGrades(courseId); showToast('Calificacion actualizada', 'success');
}
function deleteGrade(gradeId, courseId) {
    const idx = MOCK.grades.findIndex(x => x.id === gradeId);
    if (idx >= 0) MOCK.grades.splice(idx, 1);
    renderGrades(courseId); showToast('Calificacion eliminada');
}

document.getElementById('btnNewGrade').addEventListener('click', () => {
    const courseId = parseInt(document.getElementById('gradeCourseFilter').value);
    if (!courseId) { showToast('Selecciona un curso primero', 'error'); return; }
    openModal('Nueva Calificacion', `<div class="form-group"><label class="form-label">Estudiante</label><select class="form-input" id="mStudent">${MOCK.students.map(s => `<option value="${s.id}">${s.user.name}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">Calificacion (0-10)</label><input type="number" class="form-input" id="mGrade" min="0" max="10" step="0.1" placeholder="Ej: 8.5"></div><div class="form-group"><label class="form-label">Descripcion</label><textarea class="form-input" id="mGradeDesc" placeholder="Observaciones sobre la calificacion"></textarea></div><button class="btn btn-teal" style="width:100%" onclick="createGrade(${courseId})">Registrar calificacion</button>`);
});
function createGrade(courseId) {
    const sId = parseInt(document.getElementById('mStudent').value);
    const val = parseFloat(document.getElementById('mGrade').value);
    const desc = document.getElementById('mGradeDesc').value;
    if (isNaN(val) || val < 0 || val > 10) { showToast('Calificacion invalida', 'error'); return; }
    const student = MOCK.students.find(s => s.id === sId);
    const newGrade = { id: Date.now(), student: { id: sId, user: { name: student ? student.user.name : '—' } }, course: { id: courseId }, grade: val, description: desc };
    MOCK.grades.push(newGrade);
    closeModal(); renderGrades(courseId); showToast('Calificacion registrada', 'success');
}

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
    const students = MOCK.students;
    container.innerHTML = `<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
    <button class="btn btn-success btn-sm" onclick="markAll(${courseId},'${date}',true)">Marcar todos presentes</button>
    <button class="btn btn-danger btn-sm" onclick="markAll(${courseId},'${date}',false)">Marcar todos ausentes</button>
    <button class="btn btn-teal btn-sm" onclick="saveAttendance(${courseId},'${date}')">Guardar asistencia</button>
  </div>
  <table><thead><tr><th>Codigo</th><th>Estudiante</th><th>Estado</th><th>Accion</th></tr></thead><tbody id="attBody"></tbody></table>`;
    renderAttBody(students, courseId, date);
}
function renderAttBody(students, courseId, date) {
    const key = 'att_' + courseId + '_' + date;
    document.getElementById('attBody').innerHTML = students.map(s => {
        const present = attState[s.id] !== undefined ? attState[s.id] : true;
        return `<tr><td style="font-size:12px;color:var(--text-muted)">${s.studentCode}</td><td>${s.user.name}</td><td><span class="badge ${present ? 'badge-success' : 'badge-error'}" id="badge-${s.id}">${present ? 'Presente' : 'Ausente'}</span></td><td><button class="att-toggle ${present ? 'present' : 'absent'}" id="tog-${s.id}" onclick="toggleAtt(${s.id},${courseId},'${date}')"></button></td></tr>`;
    }).join('');
}
function toggleAtt(sid, courseId, date) {
    attState[sid] = attState[sid] !== undefined ? !attState[sid] : false;
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

async function loadHorarios() {
    const schedules = MOCK.schedules;
    const container = document.getElementById('horariosContainer');
    const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const sorted = [...schedules].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
    container.innerHTML = '<table><thead><tr><th>Dia</th><th>Curso</th><th>Hora Inicio</th><th>Hora Fin</th></tr></thead><tbody>' +
        sorted.map(s => `<tr><td><span class="badge badge-teal">${s.day}</span></td><td><strong>${s.course ? s.course.name : '—'}</strong></td><td>${s.startTime}</td><td>${s.endTime}</td></tr>`).join('') + '</tbody></table>';
}

document.getElementById('btnNewSchedule').addEventListener('click', () => {
    const courses = teacherCourses.length ? teacherCourses : MOCK.courses;
    openModal('Nuevo Horario', `<div class="form-group"><label class="form-label">Curso</label><select class="form-input" id="schCourse">${courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div><div class="form-row"><div class="form-group"><label class="form-label">Dia</label><select class="form-input" id="schDay"><option>Lunes</option><option>Martes</option><option>Miércoles</option><option>Jueves</option><option>Viernes</option><option>Sábado</option></select></div><div></div></div><div class="form-row"><div class="form-group"><label class="form-label">Hora Inicio</label><input type="time" class="form-input" id="schStart" value="07:00"></div><div class="form-group"><label class="form-label">Hora Fin</label><input type="time" class="form-input" id="schEnd" value="09:00"></div></div><button class="btn btn-teal" style="width:100%" onclick="createSchedule()">Agregar horario</button>`);
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

function openCourseView(course) {
    currentCourse = typeof course === 'string' ? JSON.parse(course) : course;
    currentUnitIdx = 0;
    document.getElementById('cvCourseName').textContent = currentCourse.name || 'Curso';
    document.getElementById('courseView').classList.add('show');
    renderUnitNav();
    renderUnit(0);
}

document.getElementById('cvBackBtn').addEventListener('click', () => document.getElementById('courseView').classList.remove('show'));

function renderUnitNav() {
    const units = getUnits(currentCourse.id);
    const nav = document.getElementById('unitNavItems');
    if (!units.length) { nav.innerHTML = '<div style="padding:12px 18px;font-size:13px;color:var(--text-muted)">Sin unidades. Agrega la primera.</div>'; return; }
    nav.innerHTML = units.map((u, i) => `<button class="unit-nav-item ${i === currentUnitIdx ? 'active' : ''}" onclick="renderUnit(${i})">
    <span class="unit-nav-dot"></span>
    <span class="unit-nav-item-name">${u.name}</span>
    <span class="unit-nav-item-actions">
    </span>
  </button>`).join('');
}

document.getElementById('btnAddUnit').addEventListener('click', () => {
    openModal('Nueva Unidad', `<div class="form-group"><label class="form-label">Nombre de la unidad</label><input type="text" class="form-input" id="mUnitName" placeholder="Ej: Unidad 1 — Álgebra Lineal"></div><div class="form-group"><label class="form-label">Texto de bienvenida</label><textarea class="form-input" id="mUnitWelcome" placeholder="Texto introductorio de bienvenida a esta unidad..."></textarea></div><div class="form-group"><label class="form-label">Descripcion del tema</label><textarea class="form-input" id="mUnitDesc" placeholder="Descripcion detallada de los temas de esta unidad..."></textarea></div><button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="createUnit()">Crear unidad</button>`);
});

function createUnit() {
    const name = document.getElementById('mUnitName').value.trim();
    if (!name) { showToast('El nombre de la unidad es obligatorio', 'error'); return; }
    const units = getUnits(currentCourse.id);
    units.push({ id: 'u' + Date.now(), name, welcome: document.getElementById('mUnitWelcome').value, description: document.getElementById('mUnitDesc').value, announcements: [], activities: [], exams: [], forums: [], resources: [] });
    saveUnits(currentCourse.id, units);
    closeModal(); renderUnitNav(); renderUnit(units.length - 1); showToast('Unidad creada', 'success');
}

function editUnitName(idx) {
    const units = getUnits(currentCourse.id);
    const u = units[idx];
    openModal('Editar Unidad', `<div class="form-group"><label class="form-label">Nombre de la unidad</label><input type="text" class="form-input" id="mUnitName" value="${u.name}"></div><div class="form-group"><label class="form-label">Texto de bienvenida</label><textarea class="form-input" id="mUnitWelcome">${u.welcome || ''}</textarea></div><div class="form-group"><label class="form-label">Descripcion del tema</label><textarea class="form-input" id="mUnitDesc">${u.description || ''}</textarea></div><button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="saveUnitEdit(${idx})">Guardar cambios</button>`);
}
function saveUnitEdit(idx) {
    const units = getUnits(currentCourse.id);
    units[idx].name = document.getElementById('mUnitName').value.trim() || units[idx].name;
    units[idx].welcome = document.getElementById('mUnitWelcome').value;
    units[idx].description = document.getElementById('mUnitDesc').value;
    saveUnits(currentCourse.id, units);
    closeModal(); renderUnitNav(); renderUnit(idx); showToast('Unidad actualizada', 'success');
}
function deleteUnit(idx) {
    if (!confirm('Eliminar esta unidad y todo su contenido?')) return;
    const units = getUnits(currentCourse.id);
    units.splice(idx, 1);
    saveUnits(currentCourse.id, units);
    const newIdx = Math.max(0, idx - 1);
    renderUnitNav(); if (units.length) renderUnit(newIdx); else document.getElementById('unitContent').innerHTML = '<div class="empty-state"><div class="empty-state-title">Sin unidades</div><div class="empty-state-text">Agrega la primera unidad usando el boton +.</div></div>';
    showToast('Unidad eliminada');
}

function renderUnit(idx) {
    currentUnitIdx = idx;
    const units = getUnits(currentCourse.id);
    if (!units.length) { document.getElementById('unitContent').innerHTML = '<div class="empty-state"><div class="empty-state-title">Sin unidades</div><div class="empty-state-text">Agrega la primera unidad usando el boton + en la barra lateral.</div></div>'; return; }
    document.querySelectorAll('.unit-nav-item').forEach((el, i) => el.classList.toggle('active', i === idx));
    const unit = units[idx];
    const allActs = MOCK.activities.filter(a => a.course && a.course.id === currentCourse.id);
    const allExams = MOCK.exams.filter(x => x.course && x.course.id === currentCourse.id);
    const acts = unit.activities ? allActs.filter(a => unit.activities.includes(a.id)) : [];
    const exams = unit.exams ? allExams.filter(x => unit.exams.includes(x.id)) : [];
    const announcements = unit.announcements || [];
    const resources = unit.resources || [];

    document.getElementById('unitContent').innerHTML = `
    <div class="unit-welcome">
      <div class="unit-welcome-label">Bienvenida a la Unidad</div>
      <div class="unit-welcome-title">${unit.name}</div>
      <div class="unit-welcome-text">${unit.welcome || 'Sin texto de bienvenida. Edita esta unidad para agregar uno.'}</div>
      <button class="unit-welcome-edit" onclick="editUnitName(${idx})">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/></svg>
        Editar unidad
      </button>
    </div>

    <div class="unit-section">
      <div class="unit-section-header"><div class="unit-section-icon navy"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><line x1="16" y1="13" x2="8" y2="13"/></svg></div><span class="unit-section-title">Descripcion del Tema</span></div>
      <div class="unit-section-body"><p style="font-size:13.5px;line-height:1.75;color:var(--text-dark)">${unit.description || 'Sin descripcion. Edita la unidad para agregar una descripcion detallada.'}</p></div>
    </div>

    <div class="unit-section">
      <div class="unit-section-header"><div class="unit-section-icon gold"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg></div><span class="unit-section-title">Anuncios</span><span class="badge badge-gold">${announcements.length}</span><button class="btn btn-sm btn-outline" style="margin-left:auto" onclick="addAnnouncement(${idx})"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Agregar</button></div>
      <div class="unit-section-body" id="announcementsBody">${renderAnnouncements(announcements, idx)}</div>
    </div>

    <div class="unit-section">
      <div class="unit-section-header"><div class="unit-section-icon navy"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/></svg></div><span class="unit-section-title">Talleres y Actividades</span><span class="badge badge-navy">${acts.length}</span><button class="btn btn-sm btn-outline" style="margin-left:auto" onclick="addActivity(${idx})"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Agregar</button></div>
      <div class="unit-section-body">${acts.map((a, i) => `<div class="content-item"><div class="content-item-num">${i + 1}</div><div class="content-item-info"><div class="content-item-title">${a.title}</div>${a.description ? `<div class="content-item-desc">${a.description}</div>` : ''}${a.dueDate ? `<div class="content-item-meta">Entrega: ${new Date(a.dueDate + 'T00:00:00').toLocaleDateString('es-CO')}</div>` : ''}</div><div class="content-item-actions"><button class="ic-btn" onclick="editActivity(${a.id},${idx})"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/></svg></button><button class="ic-btn del" onclick="removeActivity(${a.id},${idx})"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button></div></div>`).join('') || '<div style="font-size:13px;color:var(--text-muted);padding:4px 0">Sin talleres asignados.</div>'}<button class="add-item-btn" onclick="addActivity(${idx})"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Agregar taller o actividad</button></div>
    </div>

    <div class="unit-section">
      <div class="unit-section-header"><div class="unit-section-icon error"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div><span class="unit-section-title">Evaluaciones</span><span class="badge badge-error">${exams.length}</span><button class="btn btn-sm btn-outline" style="margin-left:auto" onclick="addExam(${idx})"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Agregar</button></div>
      <div class="unit-section-body">${exams.map((x, i) => `<div class="content-item"><div class="content-item-num" style="background:var(--error)">${i + 1}</div><div class="content-item-info"><div class="content-item-title">${x.title}</div>${x.examDate ? `<div class="content-item-meta">Fecha: ${new Date(x.examDate + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</div>` : ''}</div><div class="content-item-actions"><button class="ic-btn" onclick="editExam(${x.id},${idx})"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/></svg></button><button class="ic-btn del" onclick="removeExam(${x.id},${idx})"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button></div></div>`).join('') || '<div style="font-size:13px;color:var(--text-muted);padding:4px 0">Sin evaluaciones programadas.</div>'}<button class="add-item-btn" onclick="addExam(${idx})"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Agregar evaluacion</button></div>
    </div>

    <div class="unit-section">
      <div class="unit-section-header"><div class="unit-section-icon success"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg></div><span class="unit-section-title">Bibliografía y Recursos</span><span class="badge badge-success">${resources.length}</span><button class="btn btn-sm btn-outline" style="margin-left:auto" onclick="addResource(${idx})"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Agregar</button></div>
      <div class="unit-section-body">${resources.map((r, ri) => `<div class="resource-item"><div class="resource-icon ${r.type || 'doc'}"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><span class="resource-name">${r.name}</span><span class="resource-type">${(r.type || 'doc').toUpperCase()}</span><div style="display:flex;gap:4px;margin-left:8px"><button class="ic-btn del" onclick="removeResource(${idx},${ri})"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button></div></div>`).join('') || '<div style="font-size:13px;color:var(--text-muted);padding:4px 0">Sin recursos asignados.</div>'}<button class="add-item-btn" onclick="addResource(${idx})"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Agregar recurso o bibliografía</button></div>
    </div>
  `;
}

function renderAnnouncements(announcements, idx) {
    if (!announcements.length) return '<div style="font-size:13px;color:var(--text-muted);padding:4px 0">Sin anuncios para esta unidad.</div>';
    return announcements.map((a, ai) => `<div class="announcement-item"><div class="announcement-dot"></div><div class="announcement-text">${a}</div><button class="ic-btn del" style="flex-shrink:0" onclick="removeAnnouncement(${idx},${ai})"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`).join('');
}

function addAnnouncement(unitIdx) {
    openModal('Nuevo Anuncio', `<div class="form-group"><label class="form-label">Texto del anuncio</label><textarea class="form-input" id="mAnnouncementText" placeholder="Escribe el anuncio para los estudiantes..." style="min-height:100px"></textarea></div><button class="btn btn-teal" style="width:100%" onclick="saveAnnouncement(${unitIdx})">Publicar anuncio</button>`);
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

function addActivity(unitIdx) {
    openModal('Nueva Actividad', `<div class="form-group"><label class="form-label">Titulo de la actividad</label><input type="text" class="form-input" id="mActTitle" placeholder="Ej: Taller — Matrices y Determinantes"></div><div class="form-group"><label class="form-label">Descripcion</label><textarea class="form-input" id="mActDesc" placeholder="Descripcion de la actividad o taller..."></textarea></div><div class="form-group"><label class="form-label">Fecha de entrega</label><input type="date" class="form-input" id="mActDate"></div><button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="saveActivity(${unitIdx})">Agregar actividad</button>`);
}
function saveActivity(unitIdx) {
    const title = document.getElementById('mActTitle').value.trim();
    if (!title) { showToast('El titulo es obligatorio', 'error'); return; }
    const newAct = { id: Date.now(), course: { id: currentCourse.id }, title, description: document.getElementById('mActDesc').value, dueDate: document.getElementById('mActDate').value };
    MOCK.activities.push(newAct);
    const units = getUnits(currentCourse.id);
    units[unitIdx].activities = units[unitIdx].activities || [];
    units[unitIdx].activities.push(newAct.id);
    saveUnits(currentCourse.id, units);
    closeModal(); renderUnit(unitIdx); showToast('Actividad agregada', 'success');
}
function editActivity(actId, unitIdx) {
    const a = MOCK.activities.find(x => x.id === actId);
    if (!a) return;
    openModal('Editar Actividad', `<div class="form-group"><label class="form-label">Titulo</label><input type="text" class="form-input" id="mActTitle" value="${a.title}"></div><div class="form-group"><label class="form-label">Descripcion</label><textarea class="form-input" id="mActDesc">${a.description || ''}</textarea></div><div class="form-group"><label class="form-label">Fecha de entrega</label><input type="date" class="form-input" id="mActDate" value="${a.dueDate || ''}"></div><button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="updateActivity(${actId},${unitIdx})">Guardar cambios</button>`);
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
    renderUnit(unitIdx); showToast('Actividad retirada de esta unidad');
}

function addExam(unitIdx) {
    openModal('Nueva Evaluacion', `<div class="form-group"><label class="form-label">Titulo de la evaluacion</label><input type="text" class="form-input" id="mExTitle" placeholder="Ej: Parcial I — Álgebra Lineal"></div><div class="form-group"><label class="form-label">Fecha de la evaluacion</label><input type="date" class="form-input" id="mExDate"></div><button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="saveExam(${unitIdx})">Programar evaluacion</button>`);
}
function saveExam(unitIdx) {
    const title = document.getElementById('mExTitle').value.trim();
    if (!title) { showToast('El titulo es obligatorio', 'error'); return; }
    const newExam = { id: Date.now(), course: { id: currentCourse.id }, title, examDate: document.getElementById('mExDate').value };
    MOCK.exams.push(newExam);
    const units = getUnits(currentCourse.id);
    units[unitIdx].exams = units[unitIdx].exams || [];
    units[unitIdx].exams.push(newExam.id);
    saveUnits(currentCourse.id, units);
    closeModal(); renderUnit(unitIdx); showToast('Evaluacion programada', 'success');
}
function editExam(examId, unitIdx) {
    const x = MOCK.exams.find(e => e.id === examId);
    if (!x) return;
    openModal('Editar Evaluacion', `<div class="form-group"><label class="form-label">Titulo</label><input type="text" class="form-input" id="mExTitle" value="${x.title}"></div><div class="form-group"><label class="form-label">Fecha</label><input type="date" class="form-input" id="mExDate" value="${x.examDate || ''}"></div><button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="updateExam(${examId},${unitIdx})">Guardar cambios</button>`);
}
function updateExam(examId, unitIdx) {
    const x = MOCK.exams.find(e => e.id === examId);
    if (!x) return;
    x.title = document.getElementById('mExTitle').value.trim() || x.title;
    x.examDate = document.getElementById('mExDate').value;
    closeModal(); renderUnit(unitIdx); showToast('Evaluacion actualizada', 'success');
}
function removeExam(examId, unitIdx) {
    const units = getUnits(currentCourse.id);
    units[unitIdx].exams = (units[unitIdx].exams || []).filter(id => id !== examId);
    saveUnits(currentCourse.id, units);
    renderUnit(unitIdx); showToast('Evaluacion retirada de esta unidad');
}

function addResource(unitIdx) {
    openModal('Agregar Recurso', `<div class="form-group"><label class="form-label">Nombre del recurso</label><input type="text" class="form-input" id="mResName" placeholder="Ej: Algebra Lineal — Howard Anton (Cap. 1-3)"></div><div class="form-group"><label class="form-label">Tipo</label><select class="form-input" id="mResType"><option value="pdf">PDF</option><option value="doc">Documento</option><option value="link">Enlace web</option><option value="video">Video</option></select></div><div class="form-group"><label class="form-label">URL (opcional)</label><input type="url" class="form-input" id="mResUrl" placeholder="https://..."></div><button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="saveResource(${unitIdx})">Agregar recurso</button>`);
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

document.getElementById('btnEditCourse').addEventListener('click', () => {
    if (!currentCourse) return;
    openModal('Editar Curso', `<div class="form-group"><label class="form-label">Nombre del curso</label><input type="text" class="form-input" id="mCourseName" value="${currentCourse.name || ''}"></div><div class="form-group"><label class="form-label">Descripcion</label><textarea class="form-input" id="mCourseDesc">${currentCourse.description || ''}</textarea></div><button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="saveCourseEdit()">Guardar cambios</button>`);
});
function saveCourseEdit() {
    currentCourse.name = document.getElementById('mCourseName').value.trim() || currentCourse.name;
    currentCourse.description = document.getElementById('mCourseDesc').value;
    document.getElementById('cvCourseName').textContent = currentCourse.name;
    closeModal(); showToast('Curso actualizado', 'success');
}

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

document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => navigateTo(btn.dataset.section)));
document.getElementById('menuToggle').addEventListener('click', () => { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebarOverlay').classList.toggle('show'); });
document.getElementById('sidebarOverlay').addEventListener('click', () => { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('show'); });
document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem('educat_auth'); localStorage.removeItem('educat_email'); sessionStorage.removeItem('educat_auth'); sessionStorage.removeItem('educat_email'); window.location.href = 'login.html'; });
document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);

init();