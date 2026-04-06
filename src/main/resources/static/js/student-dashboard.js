const API = 'http://localhost:8080';
let authHeader = '';
let currentUser = null;
let currentStudent = null;
let enrollments = [];
let grades = [];
let attendance = [];
let certificates = [];
let schedules = [];
let selectedFiles = [];
let currentCourse = null;
let currentUnitIdx = 0;

const MOCK = {
    user: { id: 1, name: 'María José Rodríguez', email: 'maria@educat.edu.co', role: { id: 3, name: 'ESTUDIANTE' }, status: true, createdAt: '2024-08-15T08:00:00' },
    student: { id: 1, studentCode: 'EST-2024-101' },
    courses: [
        { id: 1, name: 'Matemáticas Avanzadas', description: 'Curso integral que abarca álgebra lineal, cálculo diferencial e integral con aplicaciones prácticas en ingeniería y ciencias.', teacher: { id: 1, specialization: 'Matemáticas', user: { id: 10, name: 'Dr. Carlos Martínez Lozano' } } },
        { id: 2, name: 'Literatura y Expresión', description: 'Análisis literario de textos hispanoamericanos, comprensión lectora avanzada y producción textual de diferentes géneros.', teacher: { id: 2, specialization: 'Letras Hispánicas', user: { id: 11, name: 'Dra. Ana Lucía Pérez Mora' } } },
        { id: 3, name: 'Ciencias Naturales', description: 'Estudio del entorno natural, fenómenos físicos y químicos con énfasis en metodología científica e investigación aplicada.', teacher: { id: 3, specialization: 'Biología y Química', user: { id: 12, name: 'Mg. Roberto Silva Arango' } } },
    ],
    enrollments: [
        { id: 1, course: null, enrollmentDate: '2025-02-01T08:00:00' },
        { id: 2, course: null, enrollmentDate: '2025-02-01T08:00:00' },
        { id: 3, course: null, enrollmentDate: '2025-02-01T08:00:00' },
    ],
    grades: [
        { id: 1, course: { id: 1, name: 'Matemáticas Avanzadas' }, grade: 8.5, description: 'Excelente desempeño en álgebra lineal' },
        { id: 2, course: { id: 2, name: 'Literatura y Expresión' }, grade: 7.2, description: 'Buen análisis crítico y argumentación' },
        { id: 3, course: { id: 3, name: 'Ciencias Naturales' }, grade: 9.0, description: 'Sobresaliente en práctica de laboratorio' },
    ],
    attendance: [
        { id: 1, course: { id: 1, name: 'Matemáticas Avanzadas' }, date: '2025-03-10', present: true },
        { id: 2, course: { id: 1, name: 'Matemáticas Avanzadas' }, date: '2025-03-12', present: true },
        { id: 3, course: { id: 1, name: 'Matemáticas Avanzadas' }, date: '2025-03-17', present: false },
        { id: 4, course: { id: 2, name: 'Literatura y Expresión' }, date: '2025-03-11', present: true },
        { id: 5, course: { id: 2, name: 'Literatura y Expresión' }, date: '2025-03-13', present: true },
        { id: 6, course: { id: 3, name: 'Ciencias Naturales' }, date: '2025-03-14', present: true },
        { id: 7, course: { id: 3, name: 'Ciencias Naturales' }, date: '2025-03-21', present: true },
    ],
    certificates: [
        { id: 1, name: 'Certificado de Excelencia Académica 2024', filePath: '#' },
        { id: 2, name: 'Diploma de Participación — Feria Científica', filePath: '#' },
    ],
    schedules: [
        { id: 1, course: { id: 1, name: 'Matemáticas Avanzadas' }, day: 'Lunes', startTime: '07:00', endTime: '09:00' },
        { id: 2, course: { id: 1, name: 'Matemáticas Avanzadas' }, day: 'Miércoles', startTime: '07:00', endTime: '09:00' },
        { id: 3, course: { id: 2, name: 'Literatura y Expresión' }, day: 'Martes', startTime: '09:00', endTime: '11:00' },
        { id: 4, course: { id: 2, name: 'Literatura y Expresión' }, day: 'Jueves', startTime: '09:00', endTime: '11:00' },
        { id: 5, course: { id: 3, name: 'Ciencias Naturales' }, day: 'Viernes', startTime: '11:00', endTime: '13:00' },
    ],
    activities: [
        { id: 1, course: { id: 1 }, title: 'Taller: Matrices y Determinantes', description: 'Resolver los ejercicios de matrices 3x3 del capítulo 2 y presentar procedimiento completo.', dueDate: '2025-04-15' },
        { id: 2, course: { id: 1 }, title: 'Taller: Derivadas Implícitas', description: 'Aplicación de reglas de derivación en funciones implícitas y paramétricas.', dueDate: '2025-04-22' },
        { id: 3, course: { id: 2 }, title: 'Ensayo Literario', description: 'Análisis temático y estilístico de "Cien años de soledad" — mínimo 3 páginas.', dueDate: '2025-04-18' },
        { id: 4, course: { id: 3 }, title: 'Informe de Laboratorio', description: 'Informe completo del experimento de reacciones ácido-base con conclusiones.', dueDate: '2025-04-20' },
    ],
    exams: [
        { id: 1, course: { id: 1 }, title: 'Parcial I — Álgebra Lineal', examDate: '2025-04-20' },
        { id: 2, course: { id: 2 }, title: 'Evaluación de Comprensión Lectora', examDate: '2025-04-25' },
        { id: 3, course: { id: 3 }, title: 'Quizz: Tabla Periódica', examDate: '2025-04-17' },
    ],
    forums: [
        { id: 1, courseId: 1, title: 'Dudas sobre Álgebra Lineal', description: 'Espacio para resolver dudas de la Unidad 1.' },
        { id: 2, courseId: 2, title: 'Debate: Realismo Mágico', description: 'Discusión sobre los elementos del realismo mágico en la narrativa latinoamericana.' },
        { id: 3, courseId: 3, title: 'Foro: Cambio Climático y Ciencia', description: 'Análisis científico del cambio climático y sus implicaciones.' },
    ],
};

const DEFAULT_UNITS = {
    1: [
        { id: 'u1-1', name: 'Unidad 1: Álgebra Lineal', welcome: 'Bienvenidos a la primera unidad de Matemáticas Avanzadas. En esta unidad exploraremos los conceptos fundamentales del álgebra lineal, que son la base para muchas ramas de las matemáticas aplicadas y la ingeniería.', description: 'Esta unidad cubre vectores en espacios n-dimensionales, matrices y operaciones con matrices, transformaciones lineales, sistemas de ecuaciones lineales y su resolución mediante eliminación gaussiana. Al finalizar podrás modelar y resolver problemas complejos usando estas herramientas.', announcements: ['Recuerden entregar el taller de matrices antes del viernes a las 11:59 p.m.', 'La próxima clase habrá un quiz corto de 10 minutos sobre operaciones matriciales.', 'Horas de atención del docente: martes y jueves de 2 a 4 p.m. en la oficina 304.'], activities: [1], exams: [1], forums: [1], resources: [{ name: 'Álgebra Lineal — Howard Anton (Cap. 1-3)', type: 'pdf', url: '#' }, { name: 'Video: Introducción a Matrices y Vectores', type: 'video', url: '#' }, { name: 'Guía de Ejercicios Resueltos', type: 'doc', url: '#' }] },
        { id: 'u1-2', name: 'Unidad 2: Cálculo Diferencial', welcome: 'Continuamos con el cálculo diferencial, una de las herramientas más poderosas de las matemáticas modernas. Esta unidad conecta el álgebra que ya conocen con el análisis del cambio.', description: 'Estudiaremos límites y su definición formal, continuidad de funciones, la derivada y sus interpretaciones geométrica y física, reglas de derivación, y aplicaciones de las derivadas en optimización y análisis de funciones.', announcements: ['Consultar el capítulo 2 de Stewart antes de la próxima clase.'], activities: [2], exams: [], forums: [], resources: [{ name: 'Cálculo — James Stewart (Cap. 2-3)', type: 'pdf', url: '#' }, { name: 'Tabla de Reglas de Derivación', type: 'doc', url: '#' }] },
    ],
    2: [
        { id: 'u2-1', name: 'Unidad 1: Narrativa Hispanoamericana', welcome: 'Bienvenidos a Literatura y Expresión. Nos adentraremos en el fascinante universo de la narrativa hispanoamericana, un movimiento que revolucionó la literatura mundial en el siglo XX.', description: 'Analizaremos las técnicas narrativas del realismo mágico, el contexto histórico y cultural del "Boom" latinoamericano, la obra de García Márquez, Julio Cortázar y otros autores fundamentales, además de desarrollar habilidades de producción textual académica.', announcements: ['Traer el libro "Cien años de soledad" a la próxima clase.', 'El ensayo literario debe subirse en formato PDF antes del 18 de abril.'], activities: [3], exams: [2], forums: [2], resources: [{ name: 'García Márquez — Cien años de soledad', type: 'pdf', url: '#' }, { name: 'Guía de Análisis Literario', type: 'doc', url: '#' }, { name: 'El Boom Latinoamericano — Contexto histórico', type: 'link', url: '#' }] },
    ],
    3: [
        { id: 'u3-1', name: 'Unidad 1: Química General', welcome: 'Bienvenidos a Ciencias Naturales. Esta unidad establece los fundamentos de la química que necesitarán para comprender los fenómenos naturales que estudiaremos a lo largo del curso.', description: 'Abordaremos estructura atómica y la tabla periódica, tipos de enlace químico, reacciones químicas y balanceo, estequiometría básica, y ácidos y bases con aplicaciones prácticas de laboratorio.', announcements: ['El informe de laboratorio debe entregarse en formato impreso y digital.', 'Próxima práctica de laboratorio: traer bata blanca obligatoriamente.'], activities: [4], exams: [3], forums: [3], resources: [{ name: 'Química — Chang y Goldsby (Cap. 1-4)', type: 'pdf', url: '#' }, { name: 'Tabla Periódica Interactiva', type: 'link', url: '#' }, { name: 'Guía de Práctica de Laboratorio', type: 'doc', url: '#' }] },
    ],
};

function getAuth() { return localStorage.getItem('educat_auth') || sessionStorage.getItem('educat_auth'); }
function getEmail() { return localStorage.getItem('educat_email') || sessionStorage.getItem('educat_email'); }

async function apiFetch(url, options = {}) {
    const headers = { 'Authorization': 'Basic ' + authHeader, 'Content-Type': 'application/json', ...options.headers };
    try { return await fetch(API + url, { ...options, headers }); } catch (e) { return null; }
}

function showToast(msg, type = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + (type ? type + '-toast' : '');
    t.textContent = msg;
    document.getElementById('toastContainer').appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

function closeModal() { document.getElementById('modalBackdrop').classList.remove('show'); }
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalBackdrop').addEventListener('click', e => { if (e.target === document.getElementById('modalBackdrop')) closeModal(); });

function setDate() {
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function getUnits(courseId) {
    const stored = localStorage.getItem('educat_units_' + courseId);
    if (stored) try { return JSON.parse(stored); } catch (e) {}
    return DEFAULT_UNITS[courseId] || [];
}

function navigateTo(section) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
    const btn = document.querySelector('[data-section="' + section + '"]');
    if (btn) btn.classList.add('active');
    const panel = document.getElementById('panel-' + section);
    if (panel) panel.classList.add('active');
    const titles = { overview: ['Resumen', 'Vista general de tu actividad académica'], cursos: ['Cursos Matriculados', 'Accede al contenido de tus cursos'], clases: ['Clases Programadas', 'Horario semanal de tus clases'], ausencias: ['Reportar Ausencia', 'Notifica y justifica tus ausencias'], 'area-personal': ['Área Personal', 'Tu información académica consolidada'], actualizacion: ['Actualización de Datos', 'Mantén tu información al día'] };
    if (titles[section]) { document.getElementById('pageTitle').textContent = titles[section][0]; document.getElementById('pageSubtitle').textContent = titles[section][1]; }
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
    if (section === 'overview') loadOverview();
    else if (section === 'cursos') loadCursos();
    else if (section === 'clases') loadClases();
    else if (section === 'ausencias') loadAusencias();
    else if (section === 'area-personal') loadAreaPersonal();
    else if (section === 'actualizacion') loadActualizacion();
}

async function tryFetch(url) {
    const res = await apiFetch(url);
    if (res && res.ok) { try { return await res.json(); } catch (e) {} }
    return null;
}

async function loadOverview() {
    const enrData = await tryFetch('/api/enrollments/student/' + (currentStudent ? currentStudent.id : 0));
    enrollments = enrData && enrData.length ? enrData : MOCK.enrollments.map((e, i) => ({ ...e, course: MOCK.courses[i] }));
    const grData = await tryFetch('/api/grades/student/' + (currentStudent ? currentStudent.id : 0));
    grades = grData && grData.length ? grData : MOCK.grades;
    const attData = await tryFetch('/api/attendance/student/' + (currentStudent ? currentStudent.id : 0));
    attendance = attData && attData.length ? attData : MOCK.attendance;
    const certData = await tryFetch('/api/certificates/student/' + (currentStudent ? currentStudent.id : 0));
    certificates = certData && certData.length ? certData : MOCK.certificates;

    document.getElementById('statCursos').textContent = enrollments.length;
    const avg = grades.length ? (grades.reduce((s, g) => s + parseFloat(g.grade || 0), 0) / grades.length).toFixed(1) : '—';
    document.getElementById('statPromedio').textContent = avg;
    const pct = attendance.length ? Math.round((attendance.filter(a => a.present).length / attendance.length) * 100) + '%' : '—';
    document.getElementById('statAsistencia').textContent = pct;
    document.getElementById('statCertificados').textContent = certificates.length;

    const oC = document.getElementById('overviewCursos');
    oC.innerHTML = enrollments.slice(0, 4).map(e => {
        const c = e.course || {};
        const teacher = c.teacher && c.teacher.user ? c.teacher.user.name : '—';
        return `<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(11,31,58,0.05);cursor:pointer" onclick="openCourseView(${JSON.stringify(c).replace(/"/g, '&quot;')})">
      <div style="width:9px;height:9px;border-radius:50%;background:var(--gold);flex-shrink:0"></div>
      <div style="flex:1"><div style="font-weight:600;font-size:13.5px">${c.name || 'Curso'}</div><div style="font-size:11.5px;color:var(--text-muted)">${teacher}</div></div>
      <svg width="14" height="14" fill="none" stroke="var(--text-muted)" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </div>`;
    }).join('');

    const oG = document.getElementById('overviewGrades');
    oG.innerHTML = grades.map(g => {
        const val = parseFloat(g.grade || 0);
        const cls = val >= 7 ? 'high' : val >= 5 ? 'mid' : 'low';
        return `<div style="margin-bottom:13px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px;font-weight:500">${g.course ? g.course.name : '—'}</span><span style="font-size:14px;font-weight:700;color:${cls==='high'?'var(--success)':cls==='mid'?'var(--gold)':'var(--error)'}">${val.toFixed(1)}</span></div><div class="grade-bar"><div class="grade-fill ${cls}" style="width:${(val/10)*100}%"></div></div></div>`;
    }).join('');
}

async function loadCursos() {
    const container = document.getElementById('cursosContainer');
    if (!enrollments.length) { enrollments = MOCK.enrollments.map((e, i) => ({ ...e, course: MOCK.courses[i] })); }
    container.innerHTML = '<div class="grid-3">' + enrollments.map(e => {
        const c = e.course || {};
        const teacher = c.teacher && c.teacher.user ? c.teacher.user.name : '—';
        const date = e.enrollmentDate ? new Date(e.enrollmentDate).toLocaleDateString('es-CO') : '—';
        const courseJSON = JSON.stringify(c).replace(/"/g, '&quot;');
        return `<div class="course-card" onclick="openCourseView(${courseJSON})">
      <div class="course-card-top">
        <div class="course-card-name">${c.name || 'Curso'}</div>
        <div class="course-card-teacher">${teacher}</div>
      </div>
      <div class="course-card-body">
        <div class="course-card-desc">${c.description ? c.description.slice(0, 90) + (c.description.length > 90 ? '...' : '') : 'Sin descripción'}</div>
        <div class="course-card-meta"><span><svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Desde ${date}</span></div>
        <div class="course-card-actions">
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openCourseView(${courseJSON})">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Ver contenido
          </button>
        </div>
      </div>
    </div>`;
    }).join('') + '</div>';
}

async function loadClases() {
    const container = document.getElementById('clasesContainer');
    if (!schedules.length) { schedules = MOCK.schedules; }
    if (!schedules.length) { container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Sin clases programadas</div></div>'; return; }
    const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const sorted = [...schedules].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
    container.innerHTML = '<table><thead><tr><th>Día</th><th>Curso</th><th>Hora Inicio</th><th>Hora Fin</th><th>Docente</th></tr></thead><tbody>' +
        sorted.map(s => {
            const teacher = s.course && s.course.teacher && s.course.teacher.user ? s.course.teacher.user.name : '—';
            return `<tr><td><span class="badge badge-navy">${s.day}</span></td><td><strong>${s.course ? s.course.name : '—'}</strong></td><td>${s.startTime || '—'}</td><td>${s.endTime || '—'}</td><td>${teacher}</td></tr>`;
        }).join('') + '</tbody></table>';
}

function loadAusencias() {
    const select = document.getElementById('ausCurso');
    const courses = enrollments.length ? enrollments.map(e => e.course).filter(Boolean) : MOCK.courses;
    select.innerHTML = '<option value="">Selecciona el curso</option>' + courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('ausFecha').value = new Date().toISOString().split('T')[0];
    const historial = JSON.parse(localStorage.getItem('educat_ausencias_' + (currentStudent ? currentStudent.id : 1)) || '[]');
    const hist = document.getElementById('ausenciasHistorial');
    if (!historial.length) { hist.innerHTML = '<div class="empty-state" style="padding:24px 0"><div class="empty-state-title">Sin reportes previos</div><div class="empty-state-text">Aún no has reportado ninguna ausencia.</div></div>'; return; }
    hist.innerHTML = '<table><thead><tr><th>Fecha</th><th>Curso</th><th>Motivo</th><th>Documentos</th><th>Estado</th></tr></thead><tbody>' +
        historial.slice().reverse().map(a => `<tr><td>${a.fecha}</td><td>${a.curso}</td><td style="max-width:160px;font-size:12.5px">${a.motivo}</td><td>${a.archivos ? '<span class="badge badge-navy">' + a.archivos + ' archivo(s)</span>' : '—'}</td><td><span class="badge badge-gold">Pendiente</span></td></tr>`).join('') + '</tbody></table>';
}

function loadAreaPersonal() {
    const grid = document.getElementById('personalGrid');
    const grds = grades.length ? grades : MOCK.grades;
    const schds = schedules.length ? schedules : MOCK.schedules;
    const certs = certificates.length ? certificates : MOCK.certificates;
    const att = attendance.length ? attendance : MOCK.attendance;
    const enr = enrollments.length ? enrollments : MOCK.enrollments.map((e, i) => ({ ...e, course: MOCK.courses[i] }));

    const avg = grds.length ? (grds.reduce((s, g) => s + parseFloat(g.grade || 0), 0) / grds.length).toFixed(2) : '—';
    const pct = att.length ? Math.round((att.filter(a => a.present).length / att.length) * 100) : 0;

    grid.innerHTML = `
    <div class="personal-card">
      <div class="personal-card-header">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span class="personal-card-title">Calificaciones</span>
      </div>
      <div class="personal-card-body">
        <div style="text-align:center;padding:12px 0;margin-bottom:14px;border-bottom:1px solid rgba(11,31,58,0.06)">
          <div style="font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:700;color:var(--text-dark)">${avg}</div>
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Promedio General</div>
        </div>
        ${grds.map(g => { const v=parseFloat(g.grade||0); const cl=v>=7?'high':v>=5?'mid':'low'; return `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-size:12.5px">${g.course?g.course.name:'—'}</span><strong style="font-size:13px;color:${cl==='high'?'var(--success)':cl==='mid'?'var(--gold)':'var(--error)'}">${v.toFixed(1)}</strong></div><div class="grade-bar"><div class="grade-fill ${cl}" style="width:${(v/10)*100}%"></div></div></div>`; }).join('')}
      </div>
    </div>

    <div class="personal-card">
      <div class="personal-card-header">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        <span class="personal-card-title">Asistencia</span>
      </div>
      <div class="personal-card-body">
        <div style="display:flex;gap:16px;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid rgba(11,31,58,0.06)">
          <div style="text-align:center;flex:1"><div style="font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:700;color:var(--text-dark)">${pct}%</div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Total</div></div>
          <div style="text-align:center;flex:1"><div style="font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:700;color:var(--success)">${att.filter(a=>a.present).length}</div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Presentes</div></div>
          <div style="text-align:center;flex:1"><div style="font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:700;color:var(--error)">${att.filter(a=>!a.present).length}</div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Ausencias</div></div>
        </div>
        ${att.slice(-5).reverse().map(a=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(11,31,58,0.04);font-size:12.5px"><span style="color:var(--text-muted)">${a.date ? new Date(a.date+'T00:00:00').toLocaleDateString('es-CO') : '—'}</span><span class="badge ${a.present?'badge-success':'badge-error'}">${a.present?'Presente':'Ausente'}</span></div>`).join('')}
      </div>
    </div>

    <div class="personal-card">
      <div class="personal-card-header">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span class="personal-card-title">Horario Académico</span>
      </div>
      <div class="personal-card-body">
        <div class="schedule-mini">${schds.map(s=>`<div class="schedule-mini-item"><span class="schedule-mini-day">${s.day}</span><span class="schedule-mini-course">${s.course?s.course.name:'—'}</span><span class="schedule-mini-time">${s.startTime}–${s.endTime}</span></div>`).join('')}</div>
      </div>
    </div>

    <div class="personal-card">
      <div class="personal-card-header">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
        <span class="personal-card-title">Certificados</span>
      </div>
      <div class="personal-card-body">${certs.length ? certs.map(c=>`<div class="cert-card"><div class="cert-icon"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg></div><div class="cert-info"><div class="cert-name">${c.name}</div>${c.filePath&&c.filePath!=='#'?`<a href="${c.filePath}" class="cert-sub" style="color:var(--teal)">Descargar documento</a>`:'<span class="cert-sub">Archivo disponible en secretaría</span>'}</div></div>`).join('') : '<div class="empty-state" style="padding:24px 0"><div class="empty-state-title">Sin certificados</div></div>'}</div>
    </div>

    <div class="personal-card">
      <div class="personal-card-header">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        <span class="personal-card-title">Información de Matrícula</span>
      </div>
      <div class="personal-card-body">
        <div style="padding:12px;background:var(--cream);border-radius:8px;margin-bottom:14px">
          <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Código de Estudiante</div>
          <div style="font-size:18px;font-family:'Cormorant Garamond',serif;font-weight:700">${currentStudent ? currentStudent.studentCode : MOCK.student.studentCode}</div>
        </div>
        ${enr.map(e=>{ const c=e.course||{}; const d=e.enrollmentDate?new Date(e.enrollmentDate).toLocaleDateString('es-CO'):'—'; return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(11,31,58,0.05);font-size:13px"><span style="font-weight:500">${c.name||'Curso'}</span><span style="color:var(--text-muted);font-size:12px">${d}</span></div>`; }).join('')}
      </div>
    </div>

    <div class="personal-card">
      <div class="personal-card-header">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        <span class="personal-card-title">Evaluación Docente</span>
      </div>
      <div class="personal-card-body">
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:14px">Tu opinión es confidencial y ayuda a mejorar la calidad educativa.</div>
        ${enr.slice(0,3).map((e,i)=>{ const c=e.course||{}; const t=c.teacher&&c.teacher.user?c.teacher.user.name:'Docente'; return `<div style="padding:10px;background:var(--cream);border-radius:8px;margin-bottom:8px"><div style="font-weight:600;font-size:13px;margin-bottom:8px">${c.name||'Curso'} — ${t}</div><div style="display:flex;gap:4px" id="stars-${i}">${[1,2,3,4,5].map(n=>`<button onclick="setRating(${i},${n})" style="background:none;border:none;cursor:pointer;padding:2px"><svg width="20" height="20" fill="none" stroke="var(--gold)" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button>`).join('')}</div></div>`; }).join('')}
        <button class="btn btn-gold btn-sm" style="margin-top:4px" onclick="submitEvals()">Enviar evaluaciones</button>
      </div>
    </div>

    <div class="personal-card">
      <div class="personal-card-header">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        <span class="personal-card-title">Autoevaluación</span>
      </div>
      <div class="personal-card-body">
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:14px">Reflexiona sobre tu propio proceso de aprendizaje en cada curso.</div>
        ${(enrollments.length?enrollments:MOCK.enrollments.map((e,i)=>({...e,course:MOCK.courses[i]}))).slice(0,2).map((e,i)=>{ const c=e.course||{}; return `<div style="margin-bottom:12px"><div style="font-size:13px;font-weight:600;margin-bottom:6px">${c.name||'Curso'}</div><select class="form-input" style="font-size:13px;padding:8px 12px" id="selfeval-${i}"><option value="">Mi nivel de comprensión</option><option>Excelente — domino los temas</option><option>Bueno — comprendo la mayoría</option><option>Regular — tengo algunas dudas</option><option>Necesito refuerzo en varios temas</option></select></div>`; }).join('')}
        <button class="btn btn-primary btn-sm" onclick="submitAutoeval()">Guardar autoevaluación</button>
      </div>
    </div>

    <div class="personal-card">
      <div class="personal-card-header">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
        <span class="personal-card-title">Instructivos y Reglamento</span>
      </div>
      <div class="personal-card-body">
        ${[{name:'Reglamento Estudiantil 2025',type:'pdf'},{name:'Manual de Convivencia',type:'pdf'},{name:'Instructivo — Uso de Plataforma Virtual',type:'doc'},{name:'Protocolo de Evaluaciones',type:'doc'},{name:'Guía de Bienestar Estudiantil',type:'link'}].map(r=>`<a class="resource-item" href="#" onclick="event.preventDefault()"><div class="resource-icon ${r.type}"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><span class="resource-name">${r.name}</span><span class="resource-type">${r.type.toUpperCase()}</span></a>`).join('')}
      </div>
    </div>
  `;
}

function setRating(idx, val) {
    const cont = document.getElementById('stars-' + idx);
    cont.querySelectorAll('svg').forEach((svg, i) => svg.setAttribute('fill', i < val ? 'var(--gold)' : 'none'));
    cont.dataset.rating = val;
}
function submitEvals() { showToast('Evaluaciones enviadas. ¡Gracias por tu opinión!', 'success'); }
function submitAutoeval() { showToast('Autoevaluación guardada correctamente', 'success'); }

function loadActualizacion() {
    const u = currentUser || MOCK.user;
    document.getElementById('updName').value = u.name || '';
    document.getElementById('updEmail').value = u.email || '';
}

async function saveProfile() {
    const name = document.getElementById('updName').value.trim();
    const email = document.getElementById('updEmail').value.trim();
    const password = document.getElementById('updPassword').value;
    const confirm = document.getElementById('updConfirm').value;
    const alertEl = document.getElementById('updateAlert');
    alertEl.style.display = 'none';
    if (!name || !email) { alertEl.textContent = 'Nombre y correo son obligatorios.'; alertEl.style.display = 'flex'; alertEl.className = 'alert alert-error'; return; }
    if (password && password !== confirm) { alertEl.textContent = 'Las contraseñas no coinciden.'; alertEl.style.display = 'flex'; alertEl.className = 'alert alert-error'; return; }
    const u = currentUser || MOCK.user;
    const body = { name, email, roleId: u.role ? u.role.id : 3, status: u.status || true };
    if (password) body.password = password;
    try {
        const res = await apiFetch('/api/users/' + u.id, { method: 'PUT', body: JSON.stringify(body) });
        if (res && res.ok) { currentUser = await res.json(); document.getElementById('sidebarUserName').textContent = currentUser.name; }
    } catch (e) {}
    alertEl.textContent = 'Datos actualizados correctamente.'; alertEl.style.display = 'flex'; alertEl.className = 'alert alert-success';
    showToast('Perfil actualizado', 'success');
}

function openCourseView(course) {
    currentCourse = typeof course === 'string' ? JSON.parse(course) : course;
    currentUnitIdx = 0;
    document.getElementById('cvCourseName').textContent = currentCourse.name || 'Curso';
    document.getElementById('cvTeacherName').textContent = currentCourse.teacher && currentCourse.teacher.user ? currentCourse.teacher.user.name : '';
    document.getElementById('courseView').classList.add('show');
    renderUnitNav();
    renderUnit(0);
}

document.getElementById('cvBackBtn').addEventListener('click', () => { document.getElementById('courseView').classList.remove('show'); });

function renderUnitNav() {
    const units = getUnits(currentCourse.id);
    const nav = document.getElementById('unitNavItems');
    if (!units.length) { nav.innerHTML = '<div style="padding:12px 18px;font-size:13px;color:var(--text-muted)">Sin unidades registradas</div>'; return; }
    nav.innerHTML = units.map((u, i) => `<button class="unit-nav-item ${i === currentUnitIdx ? 'active' : ''}" onclick="renderUnit(${i})">
    <span class="unit-nav-dot"></span>
    ${u.name}
  </button>`).join('');
}

function renderUnit(idx) {
    currentUnitIdx = idx;
    const units = getUnits(currentCourse.id);
    if (!units.length) { document.getElementById('unitContent').innerHTML = '<div class="empty-state"><div class="empty-state-title">Sin contenido</div><div class="empty-state-text">Este curso aún no tiene unidades configuradas.</div></div>'; return; }
    document.querySelectorAll('.unit-nav-item').forEach((el, i) => el.classList.toggle('active', i === idx));
    const unit = units[idx];
    const allActivities = MOCK.activities.filter(a => a.course && a.course.id === currentCourse.id);
    const allExams = MOCK.exams.filter(x => x.course && x.course.id === currentCourse.id);
    const allForums = MOCK.forums.filter(f => f.courseId === currentCourse.id);
    const acts = unit.activities ? allActivities.filter(a => unit.activities.includes(a.id)) : [];
    const exams = unit.exams ? allExams.filter(x => unit.exams.includes(x.id)) : [];
    const forums = unit.forums ? allForums.filter(f => unit.forums.includes(f.id)) : allForums;
    const resources = unit.resources || [];
    const announcements = unit.announcements || [];

    document.getElementById('unitContent').innerHTML = `
    <div class="unit-welcome">
      <div class="unit-welcome-label">Bienvenida a la Unidad</div>
      <div class="unit-welcome-title">${unit.name}</div>
      <div class="unit-welcome-text">${unit.welcome || ''}</div>
    </div>

    <div class="unit-section">
      <div class="unit-section-header"><div class="unit-section-icon navy"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg></div><span class="unit-section-title">Descripción del Tema</span></div>
      <div class="unit-section-body"><p style="font-size:13.5px;line-height:1.75;color:var(--text-dark)">${unit.description || 'Sin descripción disponible.'}</p></div>
    </div>

    ${announcements.length ? `<div class="unit-section">
      <div class="unit-section-header"><div class="unit-section-icon gold"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg></div><span class="unit-section-title">Anuncios del Docente</span><span class="badge badge-gold">${announcements.length}</span></div>
      <div class="unit-section-body">${announcements.map(a=>`<div class="announcement-item"><div class="announcement-dot"></div><div class="announcement-text">${a}</div></div>`).join('')}</div>
    </div>` : ''}

    <div class="unit-section">
      <div class="unit-section-header"><div class="unit-section-icon navy"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/></svg></div><span class="unit-section-title">Talleres y Actividades</span><span class="badge badge-navy">${acts.length}</span></div>
      <div class="unit-section-body">${acts.length ? acts.map((a,i)=>`<div class="workshop-item"><div class="workshop-num">${i+1}</div><div class="workshop-info"><div class="workshop-title">${a.title}</div>${a.description?`<div class="workshop-desc">${a.description}</div>`:''}${a.dueDate?`<div class="workshop-due">Entrega: ${new Date(a.dueDate+'T00:00:00').toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'})}</div>`:''}  </div></div>`).join('') : '<div style="font-size:13px;color:var(--text-muted);padding:4px 0">Sin talleres asignados para esta unidad.</div>'}</div>
    </div>

    <div class="unit-section">
      <div class="unit-section-header"><div class="unit-section-icon error"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div><span class="unit-section-title">Evaluaciones</span><span class="badge badge-error">${exams.length}</span></div>
      <div class="unit-section-body">${exams.length ? exams.map((x,i)=>`<div class="workshop-item"><div class="workshop-num" style="background:var(--error)">${i+1}</div><div class="workshop-info"><div class="workshop-title">${x.title}</div>${x.examDate?`<div class="workshop-due">Fecha: ${new Date(x.examDate+'T00:00:00').toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>`:''}  </div></div>`).join('') : '<div style="font-size:13px;color:var(--text-muted);padding:4px 0">Sin evaluaciones programadas para esta unidad.</div>'}</div>
    </div>

    ${forums.length ? `<div class="unit-section">
      <div class="unit-section-header"><div class="unit-section-icon teal"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div><span class="unit-section-title">Foros de Discusión</span><span class="badge badge-teal">${forums.length}</span></div>
      <div class="unit-section-body">${forums.map(f=>`<div class="forum-item"><div class="forum-title">${f.title}</div><div class="forum-desc">${f.description||''}</div><div class="forum-meta"><span>Curso activo</span><span>Participar</span></div></div>`).join('')}</div>
    </div>` : ''}

    ${resources.length ? `<div class="unit-section">
      <div class="unit-section-header"><div class="unit-section-icon success"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg></div><span class="unit-section-title">Bibliografía y Recursos</span><span class="badge badge-success">${resources.length}</span></div>
      <div class="unit-section-body">${resources.map(r=>{const t=r.type||'doc';return`<a class="resource-item" href="${r.url||'#'}" target="_blank"><div class="resource-icon ${t}"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">${t==='video'?'<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>':`<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>`}</svg></div><span class="resource-name">${r.name}</span><span class="resource-type">${t.toUpperCase()}</span></a>`}).join('')}</div>
    </div>` : ''}
  `;
}

document.getElementById('fileInput').addEventListener('change', e => {
    Array.from(e.target.files).forEach(f => { if (!selectedFiles.find(x => x.name === f.name)) selectedFiles.push(f); });
    renderFileList();
    e.target.value = '';
});

const dropArea = document.getElementById('fileDropArea');
dropArea.addEventListener('dragover', e => { e.preventDefault(); dropArea.classList.add('drag-over'); });
dropArea.addEventListener('dragleave', () => dropArea.classList.remove('drag-over'));
dropArea.addEventListener('drop', e => {
    e.preventDefault(); dropArea.classList.remove('drag-over');
    Array.from(e.dataTransfer.files).forEach(f => { if (!selectedFiles.find(x => x.name === f.name)) selectedFiles.push(f); });
    renderFileList();
});

function renderFileList() {
    const list = document.getElementById('fileList');
    list.innerHTML = selectedFiles.map((f, i) => `<div class="file-chip">
    <svg width="14" height="14" fill="none" stroke="var(--teal)" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    <span class="file-chip-name">${f.name}</span>
    <span class="file-chip-size">${(f.size/1024).toFixed(0)} KB</span>
    <button class="file-chip-remove" onclick="removeFile(${i})"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
  </div>`).join('');
}

function removeFile(idx) { selectedFiles.splice(idx, 1); renderFileList(); }

document.getElementById('btnReportarAusencia').addEventListener('click', () => {
    const curso = document.getElementById('ausCurso');
    const fecha = document.getElementById('ausFecha').value;
    const motivo = document.getElementById('ausMotivo').value;
    const descripcion = document.getElementById('ausDescripcion').value.trim();
    document.getElementById('ausenciaOk').style.display = 'none';
    if (!curso.value || !fecha || !motivo || !descripcion) { showToast('Completa todos los campos obligatorios', 'error'); return; }
    const sid = currentStudent ? currentStudent.id : 1;
    const key = 'educat_ausencias_' + sid;
    const historial = JSON.parse(localStorage.getItem(key) || '[]');
    historial.push({ fecha, curso: curso.options[curso.selectedIndex].text, motivo: motivo + (descripcion ? ' — ' + descripcion.slice(0, 60) : ''), archivos: selectedFiles.length, ts: Date.now() });
    localStorage.setItem(key, JSON.stringify(historial));
    document.getElementById('ausenciaOk').style.display = 'flex';
    document.getElementById('ausCurso').value = '';
    document.getElementById('ausMotivo').value = '';
    document.getElementById('ausDescripcion').value = '';
    selectedFiles = [];
    renderFileList();
    showToast('Ausencia reportada correctamente', 'success');
    loadAusencias();
});

async function init() {
    authHeader = getAuth() || btoa('demo@educat.edu.co:demo1234');
    setDate();
    const usersData = await tryFetch('/api/users');
    const email = getEmail() || MOCK.user.email;
    if (usersData && usersData.length) {
        currentUser = usersData.find(u => u.email === email) || null;
    }
    if (!currentUser) currentUser = MOCK.user;
    const studentsData = await tryFetch('/api/students');
    if (studentsData && studentsData.length) {
        currentStudent = studentsData.find(s => s.user && s.user.id === currentUser.id) || null;
    }
    if (!currentStudent) currentStudent = { ...MOCK.student, user: currentUser };
    document.getElementById('sidebarUserName').textContent = currentUser.name;
    document.getElementById('sidebarStudentCode').textContent = currentStudent.studentCode;
    await loadOverview();
}

document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => navigateTo(btn.dataset.section)));
document.getElementById('menuToggle').addEventListener('click', () => { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebarOverlay').classList.toggle('show'); });
document.getElementById('sidebarOverlay').addEventListener('click', () => { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('show'); });
document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem('educat_auth'); localStorage.removeItem('educat_email'); sessionStorage.removeItem('educat_auth'); sessionStorage.removeItem('educat_email'); window.location.href = 'login.html'; });
document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);

init();