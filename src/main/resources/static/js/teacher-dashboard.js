const API = 'http://localhost:8080';
let authHeader = '';
let currentUser = null;
let currentTeacher = null;
let teacherCourses = [];
let currentCourse = null;
let currentUnitIdx = 0;
let currentSubmissionsActivityId = null;

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
        { id: 1, student: { id: 1, studentCode: 'EST-2024-101', user: { name: 'María José Rodríguez' } }, course: { id: 1 }, grade: 8.5, description: 'Excelente desempeño en álgebra lineal' },
        { id: 2, student: { id: 2, studentCode: 'EST-2024-102', user: { name: 'Andrés Felipe Torres' } }, course: { id: 1 }, grade: 7.0, description: 'Buen progreso' },
        { id: 3, student: { id: 3, studentCode: 'EST-2024-103', user: { name: 'Valentina García Ruiz' } }, course: { id: 1 }, grade: 9.2, description: 'Sobresaliente' },
        { id: 4, student: { id: 4, studentCode: 'EST-2024-104', user: { name: 'Santiago López Mejía' } }, course: { id: 1 }, grade: 6.5, description: 'Debe mejorar' },
        { id: 5, student: { id: 5, studentCode: 'EST-2024-105', user: { name: 'Daniela Martínez Soto' } }, course: { id: 1 }, grade: 8.0, description: 'Muy bien' },
    ],
    activities: [
        { id: 1, course: { id: 1 }, title: 'Taller: Matrices y Determinantes', description: 'Resolver los ejercicios de matrices 3×3 del capítulo 2. Presenta el procedimiento completo con cada operación detallada paso a paso.\n\nCriterios de evaluación:\n• Procedimiento correcto: 50%\n• Resultados: 30%\n• Presentación: 20%', dueDate: '2025-04-15', attachments: [{ name: 'Guía de Ejercicios Cap.2.pdf', type: 'pdf', url: '#' }], materials: [] },
        { id: 2, course: { id: 1 }, title: 'Taller: Derivadas Implícitas', description: 'Aplicación de reglas de derivación en funciones implícitas y paramétricas. Incluye resolución de problemas de optimización con justificación completa.', dueDate: '2025-04-22', attachments: [], materials: [] },
        { id: 3, course: { id: 2 }, title: 'Ensayo Literario', description: 'Análisis temático y estilístico de "Cien años de soledad". Mínimo 3 páginas, máximo 5.', dueDate: '2025-04-18', attachments: [{ name: 'Rúbrica de evaluación.pdf', type: 'pdf', url: '#' }], materials: [] },
        { id: 4, course: { id: 3 }, title: 'Informe de Laboratorio', description: 'Informe completo del experimento de reacciones ácido-base. Incluye: objetivo, marco teórico, materiales, procedimiento, tabla de datos y conclusiones.', dueDate: '2025-04-20', attachments: [], materials: [] },
    ],
    exams: [
        { id: 1, course: { id: 1 }, title: 'Parcial I — Álgebra Lineal', examDate: '2025-04-20', description: 'Temas: vectores, matrices, sistemas de ecuaciones y transformaciones lineales. Duración: 2 horas.' },
        { id: 2, course: { id: 2 }, title: 'Evaluación de Comprensión Lectora', examDate: '2025-04-25', description: 'Análisis de fragmentos literarios y preguntas de comprensión e interpretación.' },
        { id: 3, course: { id: 3 }, title: 'Quiz: Tabla Periódica', examDate: '2025-04-17', description: 'Elementos, grupos, períodos, propiedades periódicas y tipos de enlace. Duración: 30 minutos.' },
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
        {
            id: 'u1-1', name: 'Unidad 1: Álgebra Lineal',
            welcome: 'Bienvenidos a la primera unidad de Matemáticas Avanzadas. Exploraremos los conceptos fundamentales del álgebra lineal, que son la base para muchas ramas de las matemáticas aplicadas.',
            description: 'Vectores en espacios n-dimensionales, matrices y operaciones, sistemas de ecuaciones lineales y resolución mediante eliminación gaussiana, transformaciones lineales y sus propiedades.',
            announcements: [
                { id: 'a1', title: 'Entrega del Taller de Matrices', content: 'Recuerden que el taller de matrices debe entregarse antes del viernes a las 11:59 p.m.\n\nFormato de entrega: PDF con nombre Apellido_Taller1.pdf. Subir a la plataforma o enviar al correo institucional si hay inconvenientes técnicos.', date: '2025-04-01', attachments: [] },
                { id: 'a2', title: 'Quiz sorpresa — próxima clase', content: 'Habrá un quiz corto de 10 minutos al inicio de la próxima clase sobre operaciones matriciales.\n\nTemas a repasar:\n• Suma y resta de matrices\n• Multiplicación de matrices\n• Transpuesta e inversa\n• Determinante 2×2 y 3×3\n\nEl quiz cuenta como nota de participación.', date: '2025-04-03', attachments: [] },
            ],
            activities: [1], exams: [1],
            resources: [
                { name: 'Álgebra Lineal — Howard Anton (Cap. 1-3)', type: 'pdf', url: '#' },
                { name: 'Video: Introducción a Matrices y Vectores', type: 'video', url: '#' },
                { name: 'Guía de Ejercicios Resueltos', type: 'doc', url: '#' },
            ]
        },
        {
            id: 'u1-2', name: 'Unidad 2: Cálculo Diferencial',
            welcome: 'Continuamos con el cálculo diferencial, conectando el álgebra con el análisis del cambio y la optimización.',
            description: 'Límites y su definición formal, continuidad de funciones, la derivada y sus interpretaciones geométrica y física, reglas de derivación y aplicaciones en optimización.',
            announcements: [
                { id: 'a3', title: 'Bibliografía recomendada', content: 'Revisar el capítulo 2 de Stewart "Cálculo" antes de la próxima clase. Está disponible en la biblioteca digital institucional con acceso desde la cuenta institucional.', date: '2025-04-05', attachments: [] },
            ],
            activities: [2], exams: [],
            resources: [
                { name: 'Cálculo — James Stewart (Cap. 2-3)', type: 'pdf', url: '#' },
                { name: 'Tabla de Reglas de Derivación', type: 'doc', url: '#' },
            ]
        },
    ],
    2: [
        {
            id: 'u2-1', name: 'Unidad 1: Narrativa Hispanoamericana',
            welcome: 'Bienvenidos a Literatura y Expresión. Nos adentraremos en el fascinante universo de la narrativa hispanoamericana del siglo XX.',
            description: 'Técnicas narrativas del realismo mágico, el contexto del Boom latinoamericano y la obra de autores como García Márquez y Cortázar.',
            announcements: [
                { id: 'a4', title: 'Traer novela a la próxima clase', content: 'Por favor traer el libro "Cien años de soledad" a la próxima clase. Si no tienen el libro físico, pueden tener una versión digital accesible en su dispositivo.', date: '2025-04-02', attachments: [] },
                { id: 'a5', title: 'Formato y criterios del ensayo', content: 'Aclaraciones sobre el ensayo literario:\n\n• Extensión: mínimo 3 páginas, máximo 5\n• Fuente: Times New Roman 12pt, interlineado 1.5\n• Formato de citas: APA 7ª edición\n• Mínimo 3 fuentes bibliográficas', date: '2025-04-06', attachments: [{ name: 'Rúbrica_Ensayo_Literatura.pdf', type: 'pdf', url: '#' }] },
            ],
            activities: [3], exams: [2],
            resources: [
                { name: 'García Márquez — Cien años de soledad', type: 'pdf', url: '#' },
                { name: 'Guía de Análisis Literario', type: 'doc', url: '#' },
                { name: 'El Boom Latinoamericano — contexto', type: 'link', url: '#' },
            ]
        },
    ],
    3: [
        {
            id: 'u3-1', name: 'Unidad 1: Química General',
            welcome: 'Bienvenidos a Ciencias Naturales. Esta unidad establece los fundamentos de la química necesarios para comprender los fenómenos naturales.',
            description: 'Estructura atómica y tabla periódica, tipos de enlace químico, reacciones y balanceo, estequiometría, ácidos y bases con aplicaciones de laboratorio.',
            announcements: [
                { id: 'a6', title: 'Práctica de laboratorio — elementos obligatorios', content: 'La próxima práctica de laboratorio es de asistencia obligatoria. Deben traer sin excepción:\n\n• Bata blanca de manga larga\n• Guantes de látex\n• Gafas protectoras\n• Cuaderno de laboratorio', date: '2025-04-04', attachments: [{ name: 'Plantilla_Informe_Laboratorio.docx', type: 'doc', url: '#' }] },
            ],
            activities: [4], exams: [3],
            resources: [
                { name: 'Química — Chang y Goldsby (Cap. 1-4)', type: 'pdf', url: '#' },
                { name: 'Tabla Periódica Interactiva', type: 'link', url: '#' },
                { name: 'Guía de Práctica de Laboratorio', type: 'doc', url: '#' },
            ]
        },
    ],
};

function getAuth() { return localStorage.getItem('educat_auth') || sessionStorage.getItem('educat_auth'); }
function getEmail() { return localStorage.getItem('educat_email') || sessionStorage.getItem('educat_email'); }

/* ─── Modal file attachment helpers ─────────────────────────────────────────── */
const modalFiles = {};

function handleModalFile(event, key) {
    if (!modalFiles[key]) modalFiles[key] = [];
    Array.from(event.target.files).forEach(f => {
        if (!modalFiles[key].find(x => x.name === f.name)) modalFiles[key].push(f);
    });
    renderModalFiles(key);
    event.target.value = '';
}

function handleModalDrop(event, key) {
    event.preventDefault();
    const dropEl = document.getElementById('mdrop-' + key);
    if (dropEl) dropEl.classList.remove('drag-over');
    if (!modalFiles[key]) modalFiles[key] = [];
    Array.from(event.dataTransfer.files).forEach(f => {
        if (!modalFiles[key].find(x => x.name === f.name)) modalFiles[key].push(f);
    });
    renderModalFiles(key);
}

function removeModalFile(key, idx) {
    if (modalFiles[key]) { modalFiles[key].splice(idx, 1); renderModalFiles(key); }
}

function renderModalFiles(key) {
    const list = document.getElementById('mfiles-' + key);
    if (!list) return;
    const files = modalFiles[key] || [];
    const IFILE = `<svg width="13" height="13" fill="none" stroke="var(--teal)" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    const IIMG  = `<svg width="13" height="13" fill="none" stroke="var(--teal)" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
    const IVID  = `<svg width="13" height="13" fill="none" stroke="var(--gold)" stroke-width="2" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`;
    list.innerHTML = files.map((f, i) => {
        const isImg = f.type && f.type.startsWith('image/');
        const isVid = f.type && f.type.startsWith('video/');
        const icon  = isImg ? IIMG : isVid ? IVID : IFILE;
        return `<div class="file-chip">
            ${icon}
            <span class="file-chip-name">${f.name}</span>
            <span class="file-chip-size">${(f.size / 1024).toFixed(0)} KB</span>
            <button class="file-chip-remove" onclick="removeModalFile('${key}',${i})">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>`;
    }).join('');
}

function clearModalFiles(key) { delete modalFiles[key]; }

function getModalAttachments(key, existingAttachments) {
    const files = modalFiles[key] || [];
    const newAtts = files.map(f => ({
        name: f.name,
        size: f.size,
        type: (f.type && f.type.startsWith('image/')) ? 'img'
            : (f.type && f.type.startsWith('video/')) ? 'video'
                : f.name.endsWith('.pdf') ? 'pdf' : 'doc',
        url: '#'
    }));
    return [...(existingAttachments || []), ...newAtts];
}

function modalDropArea(key, label) {
    return `<div class="file-drop-area" id="mdrop-${key}" style="padding:16px"
            ondragover="event.preventDefault();document.getElementById('mdrop-${key}').classList.add('drag-over')"
            ondragleave="document.getElementById('mdrop-${key}').classList.remove('drag-over')"
            ondrop="handleModalDrop(event,'${key}')">
        <input type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
               onchange="handleModalFile(event,'${key}')">
        <div class="file-drop-icon">
            <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </div>
        <div class="file-drop-text" style="font-size:13px">${label || 'Arrastra archivos o haz clic para seleccionar'}</div>
        <div class="file-drop-sub">Imágenes, videos, PDF, Word, PowerPoint</div>
    </div>
    <div class="file-list" id="mfiles-${key}" style="margin-top:8px"></div>`;
}

function renderExistingAttachments(attachments, key, unitIdx, annIdx) {
    if (!attachments || !attachments.length) return '';
    const IFILE = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    return `<div style="font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;margin-top:4px">Archivos existentes</div>
    <div class="attachment-list" style="margin-bottom:10px">
        ${attachments.map((at, i) => `<div class="attachment-item" id="exatt-${key}-${i}">
            <div class="attachment-icon ${at.type || 'doc'}">${IFILE}</div>
            <span class="attachment-name">${at.name}</span>
            <button class="attachment-remove" onclick="removeExistingAttachment('${key}',${unitIdx},${annIdx !== undefined ? annIdx : -1},${i})" title="Eliminar">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>`).join('')}
    </div>`;
}

function removeExistingAttachment(key, unitIdx, annIdx, attIdx) {
    const units = getUnits(currentCourse.id);
    if (annIdx >= 0) {
        // announcement attachment
        const ann = units[unitIdx].announcements[annIdx];
        if (ann && Array.isArray(ann.attachments)) {
            ann.attachments.splice(attIdx, 1);
            saveUnits(currentCourse.id, units);
        }
    } else {
        // could extend for activities
    }
    const el = document.getElementById('exatt-' + key + '-' + attIdx);
    if (el) el.remove();
}

/* ─── END modal file helpers ─────────────────────────────────────────────────── */

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

function openModal(title, html) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('modalBackdrop').classList.add('show');
}

function closeModal() { document.getElementById('modalBackdrop').classList.remove('show'); }

function getUnits(courseId) {
    const s = localStorage.getItem('educat_units_' + courseId);
    if (s) try { return JSON.parse(s); } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_UNITS[courseId] || []));
}

function saveUnits(courseId, units) { localStorage.setItem('educat_units_' + courseId, JSON.stringify(units)); }

function setDate() {
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function getStudentSubmission(studentId, actId) {
    try { return JSON.parse(localStorage.getItem('educat_sub_' + studentId + '_' + actId)); } catch (e) { return null; }
}

function saveStudentGrade(studentId, actId, grade, feedback) {
    const existing = getStudentSubmission(studentId, actId) || {};
    localStorage.setItem('educat_sub_' + studentId + '_' + actId, JSON.stringify({ ...existing, graded: true, grade, feedback, gradedAt: new Date().toISOString() }));
}

function getPendingSubmissionsCount() {
    let count = 0;
    MOCK.activities.forEach(a => MOCK.students.forEach(s => {
        const sub = getStudentSubmission(s.id, a.id);
        if (sub && sub.submitted && !sub.graded) count++;
    }));
    return count;
}

function getInitials(name) {
    return (name || '').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
}

function toggleCard(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('open');
}

function showView(view) {
    document.getElementById('mainContent').style.display = view === 'main' ? '' : 'none';
    document.getElementById('courseView').classList.toggle('show', view === 'course');
    document.getElementById('submissionsView').classList.toggle('show', view === 'submissions');
    document.getElementById('courseTopbarActions').style.display = view === 'course' ? 'flex' : 'none';
}

function navigateTo(section) {
    showView('main');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
    const btn = document.querySelector('[data-section="' + section + '"]');
    if (btn) btn.classList.add('active');
    const panel = document.getElementById('panel-' + section);
    if (panel) panel.classList.add('active');
    document.getElementById('topbarBreadcrumb').style.display = 'none';
    document.getElementById('pageTitle').style.display = '';
    document.getElementById('pageSubtitle').style.display = '';
    const titles = {
        overview: ['Resumen', 'Vista general de tu actividad docente'],
        cursos: ['Mis Cursos', 'Gestión de contenido y unidades'],
        entregas: ['Entregas', 'Revisión y calificación de trabajos estudiantiles'],
        calificaciones: ['Calificaciones', 'Registro y gestión de notas'],
        asistencia: ['Control de Asistencia', 'Registro de asistencia por clase'],
        horarios: ['Horarios', 'Programación de clases'],
        estudiantes: ['Estudiantes', 'Gestión del estudiantado'],
        perfil: ['Mi Perfil', 'Datos del docente'],
    };
    if (titles[section]) {
        document.getElementById('pageTitle').textContent = titles[section][0];
        document.getElementById('pageSubtitle').textContent = titles[section][1];
    }
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
    if (section === 'overview') loadOverview();
    else if (section === 'cursos') loadCursos();
    else if (section === 'entregas') loadEntregas();
    else if (section === 'calificaciones') loadCalificaciones();
    else if (section === 'asistencia') loadAsistencia();
    else if (section === 'horarios') loadHorarios();
    else if (section === 'estudiantes') loadEstudiantes();
    else if (section === 'perfil') loadPerfil();
}

async function loadOverview() {
    const coursesData = await tryFetch('/api/courses/teacher/' + (currentTeacher ? currentTeacher.id : 0));
    teacherCourses = (coursesData && coursesData.length) ? coursesData : MOCK.courses;
    const activitiesData = await tryFetch('/api/activities');
    const actividades = (activitiesData && activitiesData.length) ? activitiesData : MOCK.activities;
    const examsData = await tryFetch('/api/exams');
    const examenes = (examsData && examsData.length) ? examsData : MOCK.exams;
    const pending = getPendingSubmissionsCount();
    document.getElementById('statCursos').textContent = teacherCourses.length;
    document.getElementById('statEstudiantes').textContent = teacherCourses.reduce((s, c) => s + (c.studentsCount || 0), 0);
    document.getElementById('statActividades').textContent = actividades.length;
    document.getElementById('statExamenes').textContent = examenes.length;
    document.getElementById('statEntregasPendientes').textContent = pending;
    document.getElementById('overviewPendingCount').textContent = pending;

    document.getElementById('overviewCursos').innerHTML = teacherCourses.map(c => {
        const cj = JSON.stringify(c).replace(/"/g, '&quot;');
        return `<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(11,31,58,0.05);cursor:pointer" onclick="openCourseView(${cj})">
    <div style="width:9px;height:9px;border-radius:50%;background:var(--teal);flex-shrink:0"></div>
<div style="flex:1"><div style="font-weight:600;font-size:13.5px">${c.name}</div><div style="font-size:11.5px;color:var(--text-muted)">${c.studentsCount || 0} estudiantes</div></div>
<svg width="14" height="14" fill="none" stroke="var(--text-muted)" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
</div>`;
    }).join('');

    document.getElementById('overviewActividades').innerHTML = actividades.slice(0, 5).map(a => {
        const course = MOCK.courses.find(c => c.id === (a.course ? a.course.id : 0)) || {};
        const p = MOCK.students.filter(s => { const sub = getStudentSubmission(s.id, a.id); return sub && sub.submitted && !sub.graded; }).length;
        return `<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid rgba(11,31,58,0.05);align-items:center">
    <div style="width:7px;height:7px;border-radius:50%;background:var(--gold);flex-shrink:0;margin-top:3px"></div>
<div style="flex:1;min-width:0">
    <div style="font-size:13.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.title}</div>
    <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">${course.name || '—'}${a.dueDate ? ' · ' + new Date(a.dueDate + 'T00:00:00').toLocaleDateString('es-CO') : ''}</div>
</div>
${p > 0 ? `<span class="badge badge-error" style="flex-shrink:0">${p} pend.</span>` : ''}
</div>`;
    }).join('');

    const oP = document.getElementById('overviewPendingSubmissions');
    const pendingRows = [];
    actividades.forEach(a => MOCK.students.forEach(s => {
        const sub = getStudentSubmission(s.id, a.id);
        if (sub && sub.submitted && !sub.graded) pendingRows.push({ act: a, student: s });
    }));
    if (!pendingRows.length) {
        oP.innerHTML = '<div style="text-align:center;padding:20px 0"><div style="font-family:\'Cormorant Garamond\',serif;font-size:18px;font-weight:600;color:var(--success)">✓ Todo al día</div><div style="font-size:12px;color:var(--text-muted);margin-top:4px">No hay entregas pendientes.</div></div>';
    } else {
        oP.innerHTML = pendingRows.slice(0, 5).map(r => `<div style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid rgba(11,31,58,0.05);align-items:center">
    <div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--navy-light),var(--teal));display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:12px;font-weight:700;color:#fff;flex-shrink:0">${getInitials(r.student.user.name)}</div>
<div style="flex:1;min-width:0">
    <div style="font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.student.user.name}</div>
    <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.act.title}</div>
</div>
<button class="grade-btn view" onclick="openActivitySubmissions(${r.act.id})">Calificar</button>
</div>`).join('') + (pendingRows.length > 5 ? `<div style="text-align:center;padding-top:10px;font-size:12px;color:var(--text-muted)">${pendingRows.length - 5} más — <button style="background:none;border:none;color:var(--gold);cursor:pointer;font-size:12px;font-family:inherit" onclick="navigateTo('entregas')">ver todas</button></div>` : '');
    }

    const sorted = [...examenes].sort((a, b) => new Date(a.examDate) - new Date(b.examDate));
    document.getElementById('overviewExams').innerHTML = sorted.slice(0, 4).map(x => {
        const course = MOCK.courses.find(c => c.id === (x.course ? x.course.id : 0)) || {};
        const d = x.examDate ? new Date(x.examDate + 'T00:00:00') : null;
        const diff = d ? Math.ceil((d - new Date()) / 86400000) : null;
        const col = diff !== null && diff <= 3 ? 'var(--error)' : diff !== null && diff <= 7 ? 'var(--gold)' : 'var(--success)';
        return `<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid rgba(11,31,58,0.05);align-items:center">
    <div style="width:36px;height:36px;border-radius:8px;background:rgba(192,57,43,0.08);display:flex;align-items:center;justify-content:center;flex-shrink:0">
    <svg width="16" height="16" fill="none" stroke="var(--error)" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
</div>
<div style="flex:1;min-width:0">
    <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${x.title}</div>
    <div style="font-size:11.5px;color:var(--text-muted)">${course.name || '—'} · ${d ? d.toLocaleDateString('es-CO') : '—'}</div>
</div>
${diff !== null ? `<span style="font-size:11px;font-weight:700;color:${col};flex-shrink:0">${diff <= 0 ? 'Hoy' : diff + 'd'}</span>` : ''}
</div>`;
    }).join('') || '<div style="color:var(--text-muted);font-size:13px">Sin evaluaciones programadas.</div>';
}

async function loadCursos() {
    if (!teacherCourses.length) teacherCourses = MOCK.courses;
    document.getElementById('cursosGrid').innerHTML = '<div class="grid-3">' + teacherCourses.map(c => {
        const cj = JSON.stringify(c).replace(/"/g, '&quot;');
        const units = getUnits(c.id);
        return `<div class="course-card" onclick="openCourseView(${cj})">
    <div class="course-card-top">
    <div class="course-card-name">${c.name}</div>
<div class="course-card-teacher">${c.studentsCount || 0} estudiantes · ${units.length} unidades</div>
</div>
<div class="card-body" style="padding:16px 20px">
    <div style="font-size:13px;color:var(--text-muted);margin-bottom:14px;line-height:1.5">${c.description ? c.description.slice(0, 85) + '...' : ''}</div>
    <div class="course-card-actions">
        <button class="btn btn-teal btn-sm" onclick="event.stopPropagation();openCourseView(${cj})">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/></svg>
            Gestionar contenido
        </button>
        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();openActivitySubmissions(null,${c.id})">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Entregas
        </button>
    </div>
</div>
</div>`;
    }).join('') + '</div>';
}

function loadEntregas() {
    const coursesSel = document.getElementById('subCourseFilter');
    const actSel = document.getElementById('subActivityFilter');
    const courses = teacherCourses.length ? teacherCourses : MOCK.courses;
    coursesSel.innerHTML = '<option value="">Todos los cursos</option>' + courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    coursesSel.onchange = () => {
        const cId = parseInt(coursesSel.value) || 0;
        const acts = cId ? MOCK.activities.filter(a => a.course && a.course.id === cId) : MOCK.activities;
        actSel.innerHTML = '<option value="">Todas las actividades</option>' + acts.map(a => `<option value="${a.id}">${a.title}</option>`).join('');
        renderEntregasList();
    };
    actSel.onchange = renderEntregasList;
    document.getElementById('subStatusFilter').onchange = renderEntregasList;
    renderEntregasList();
}

function renderEntregasList() {
    const cId = parseInt(document.getElementById('subCourseFilter').value) || 0;
    const aId = parseInt(document.getElementById('subActivityFilter').value) || 0;
    const status = document.getElementById('subStatusFilter').value;
    const container = document.getElementById('entregasContainer');
    document.getElementById('submissionDetailView').style.display = 'none';
    let activities = MOCK.activities;
    if (cId) activities = activities.filter(a => a.course && a.course.id === cId);
    if (aId) activities = activities.filter(a => a.id === aId);
    if (!activities.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Sin actividades</div><div class="empty-state-text">No hay actividades para los filtros seleccionados.</div></div>';
        return;
    }
    let html = '';
    activities.forEach(act => {
        const course = MOCK.courses.find(c => c.id === (act.course ? act.course.id : 0)) || {};
        const rows = MOCK.students.map(s => {
            const sub = getStudentSubmission(s.id, act.id);
            const state = !sub || !sub.submitted ? 'none' : sub.graded ? 'graded' : 'pending';
            return { student: s, sub, state };
        }).filter(r => !status || r.state === status || (status === 'none' && r.state === 'none'));
        if (!rows.length) return;
        const pend = rows.filter(r => r.state === 'pending').length;
        const grad = rows.filter(r => r.state === 'graded').length;
        const miss = rows.filter(r => r.state === 'none').length;
        html += `<div style="margin-bottom:24px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid rgba(11,31,58,0.06)">
    <div style="flex:1;min-width:0">
    <div style="font-size:15px;font-weight:600;color:var(--text-dark)">${act.title}</div>
<div style="font-size:12px;color:var(--text-muted);margin-top:2px">${course.name || '—'}${act.dueDate ? ' · Entrega: ' + new Date(act.dueDate + 'T00:00:00').toLocaleDateString('es-CO') : ''}</div>
</div>
<div style="display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap">
    ${pend > 0 ? `<span class="badge badge-error">${pend} sin calificar</span>` : ''}
    ${grad > 0 ? `<span class="badge badge-success">${grad} calificados</span>` : ''}
    ${miss > 0 ? `<span class="badge badge-navy">${miss} sin entregar</span>` : ''}
</div>
<button class="btn btn-sm btn-teal" onclick="openActivitySubmissions(${act.id})">
    <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    Gestionar
</button>
</div>
${rows.map(r => renderEntregaRow(r.student, r.sub, r.state, act.id)).join('')}
</div>`;
    });
    container.innerHTML = html || '<div class="empty-state"><div class="empty-state-title">Sin entregas</div><div class="empty-state-text">No hay entregas que coincidan con los filtros.</div></div>';
}

function renderEntregaRow(student, sub, state, actId) {
    const initials = getInitials(student.user.name);
    const badgeMap = { none: '<span class="badge badge-navy">Sin entregar</span>', pending: '<span class="badge badge-gold">Por calificar</span>', graded: `<span class="badge badge-success">Nota: ${sub ? sub.grade : '—'}/10</span>` };
    const dateStr = sub && sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
    return `<div class="submission-row">
    <div class="submission-student-avatar">${initials}</div>
<div class="submission-student-info">
    <div class="submission-student-name">${student.user.name}</div>
    <div class="submission-student-code">${student.studentCode}</div>
</div>
<div class="submission-date-info">${state !== 'none' ? dateStr : '—'}</div>
<div style="flex-shrink:0">${badgeMap[state]}</div>
${state === 'pending' ? `<div class="submission-grade-inline">
            <input type="number" class="submission-grade-input" id="gi-${actId}-${student.id}" min="0" max="10" step="0.1" placeholder="0-10">
            <button class="grade-btn save" onclick="quickGrade(${actId},${student.id})">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                Guardar
            </button>
        </div>` : ''}
<div class="submission-actions-inline">
    ${state !== 'none' ? `<button class="grade-btn view" onclick="openGradeModal(${actId},${student.id})">${state === 'graded' ? 'Editar' : 'Calificar'}</button>` : `<span style="font-size:11.5px;color:var(--text-light)">No entregado</span>`}
</div>
</div>`;
}

function quickGrade(actId, studentId) {
    const input = document.getElementById('gi-' + actId + '-' + studentId);
    if (!input) return;
    const val = parseFloat(input.value);
    if (isNaN(val) || val < 0 || val > 10) { showToast('Ingresa una nota válida entre 0 y 10', 'error'); return; }
    saveStudentGrade(studentId, actId, val, '');
    showToast('Calificación guardada', 'success');
    renderEntregasList();
}

function openActivitySubmissions(actId, courseIdFallback) {
    let act = actId ? MOCK.activities.find(a => a.id === actId) : null;
    if (!act && courseIdFallback) {
        const acts = MOCK.activities.filter(a => a.course && a.course.id === courseIdFallback);
        if (!acts.length) { showToast('Este curso no tiene actividades registradas', 'error'); return; }
        act = acts[0];
        actId = act.id;
    }
    if (!act) return;
    currentSubmissionsActivityId = actId;
    const course = MOCK.courses.find(c => c.id === (act.course ? act.course.id : 0)) || {};
    document.getElementById('courseView').classList.remove('show');
    showView('submissions');
    document.getElementById('topbarBreadcrumb').style.display = 'flex';
    document.getElementById('breadcrumbBack').textContent = 'Mis Cursos';
    document.getElementById('breadcrumbCourseName').textContent = course.name || 'Curso';
    document.getElementById('breadcrumbActivitySep').style.display = '';
    document.getElementById('breadcrumbActivityName').style.display = '';
    document.getElementById('breadcrumbActivityName').textContent = act.title;
    document.getElementById('pageTitle').style.display = 'none';
    document.getElementById('pageSubtitle').style.display = 'none';
    document.getElementById('submissionsActivityName').textContent = act.title;
    document.getElementById('submissionsActivityMeta').textContent = `${course.name || '—'}${act.dueDate ? ' · Entrega: ' + new Date(act.dueDate + 'T00:00:00').toLocaleDateString('es-CO') : ''}`;
    document.getElementById('submissionsFilter').value = 'all';
    renderSubmissionsList();
}

function renderSubmissionsList() {
    const actId = currentSubmissionsActivityId;
    const filter = document.getElementById('submissionsFilter').value;
    const rows = MOCK.students.map(s => {
        const sub = getStudentSubmission(s.id, actId);
        const state = !sub || !sub.submitted ? 'missing' : sub.graded ? 'graded' : 'pending';
        return { student: s, sub, state };
    }).filter(r => filter === 'all' || r.state === filter);
    const totalPend = MOCK.students.filter(s => { const sub = getStudentSubmission(s.id, actId); return sub && sub.submitted && !sub.graded; }).length;
    const totalGrad = MOCK.students.filter(s => { const sub = getStudentSubmission(s.id, actId); return sub && sub.graded; }).length;
    document.getElementById('submissionsPendingBadge').textContent = totalPend + ' sin calificar';
    document.getElementById('submissionsGradedBadge').textContent = totalGrad + ' calificados';
    const body = document.getElementById('submissionsListBody');
    if (!rows.length) {
        body.innerHTML = '<div class="empty-state" style="padding:30px"><div class="empty-state-title">Sin resultados</div><div class="empty-state-text">Cambia el filtro para ver más entregas.</div></div>';
        return;
    }
    const IFILE = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    const ICH = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>`;
    body.innerHTML = rows.map(r => {
        const { student, sub, state } = r;
        const initials = getInitials(student.user.name);
        const dateStr = sub && sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
        let statusHtml = '';
        if (state === 'missing') {
            statusHtml = `<div class="submission-status-bar no-submit" style="margin:0 20px 16px">
                <div class="submission-status-icon"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
                <div class="submission-status-info"><div class="submission-status-label">Sin entregar</div><div class="submission-status-detail">El estudiante no ha realizado ninguna entrega.</div></div>
            </div>`;
        } else if (state === 'graded') {
            statusHtml = `<div style="margin:0 20px 16px">
                <div class="submission-grade-display">
                    <div class="submission-grade-num">${sub.grade}</div>
                    <div class="submission-grade-sep"></div>
                    <div class="submission-grade-info">
                        <div class="submission-grade-label">Retroalimentación</div>
                        <div class="submission-grade-comment">${sub.feedback || 'Sin comentarios adicionales.'}</div>
                    </div>
                </div>
                <button class="grade-btn view" onclick="openGradeModal(${actId},${student.id})">Editar calificación</button>
            </div>`;
        } else {
            statusHtml = `<div style="margin:0 20px 16px">
                <div class="submission-status-bar submitted" style="margin-bottom:12px">
                    <div class="submission-status-icon"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
                    <div class="submission-status-info"><div class="submission-status-label">Entrega recibida</div><div class="submission-status-detail">Enviado el ${dateStr}</div></div>
                </div>
                <div style="display:flex;gap:8px;margin-bottom:8px;align-items:flex-start">
                    <input type="number" class="submission-grade-input" id="si-${actId}-${student.id}" min="0" max="10" step="0.1" placeholder="Nota 0-10" style="width:90px;flex-shrink:0">
                    <textarea class="submission-comment-input" id="sf-${actId}-${student.id}" placeholder="Retroalimentación para el estudiante..." style="flex:1;min-height:52px;margin-bottom:0;font-size:13px"></textarea>
                </div>
                <button class="grade-btn save" onclick="saveGradeFromView(${actId},${student.id})" style="padding:6px 14px">
                    <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    Guardar calificación
                </button>
            </div>`;
        }
        const filesHtml = sub && sub.files && sub.files.length ? `<div style="padding:0 20px 14px">
            <div style="font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">Archivos enviados</div>
            <div class="attachment-list">${sub.files.map(f => `<div class="attachment-item"><div class="attachment-icon doc">${IFILE}</div><span class="attachment-name">${f.name}</span><span class="attachment-meta">${(f.size / 1024).toFixed(0)} KB</span></div>`).join('')}</div>
        </div>` : '';
        const commentHtml = sub && sub.comment ? `<div style="padding:0 20px 14px">
            <div style="font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px">Comentario del estudiante</div>
            <div style="background:var(--cream);border-radius:8px;padding:12px 14px;border-left:3px solid var(--gold);font-size:13px;color:var(--text-body);line-height:1.65;white-space:pre-line">${sub.comment}</div>
        </div>` : '';
        const isOpen = state === 'pending';
        return `<div class="activity-card ${isOpen ? 'open' : ''}" id="subrow-${student.id}" style="margin:0;border-radius:0;border-left:none;border-right:none;border-top:none">
            <div class="activity-card-header" onclick="toggleCard('subrow-${student.id}')">
                <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--navy-light),var(--teal));display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:14px;font-weight:700;color:#fff;flex-shrink:0;margin-top:1px">${initials}</div>
                <div class="activity-header-meta">
                    <div class="activity-title">${student.user.name}</div>
                    <div class="activity-due-row">
                        <span style="font-size:11.5px;color:var(--text-muted)">${student.studentCode}</span>
                        ${state === 'graded' ? `<span class="badge badge-success">Calificado: ${sub.grade}/10</span>` : state === 'pending' ? '<span class="badge badge-gold">Por calificar</span>' : '<span class="badge badge-navy">Sin entregar</span>'}
                    </div>
                </div>
                <button class="activity-toggle-btn" onclick="event.stopPropagation();toggleCard('subrow-${student.id}')">${ICH}</button>
            </div>
            <div class="activity-card-body" style="${isOpen ? '' : 'display:none'}">
                ${commentHtml}${filesHtml}${statusHtml}
            </div>
        </div>`;
    }).join('');
}

function saveGradeFromView(actId, studentId) {
    const gradeInput = document.getElementById('si-' + actId + '-' + studentId);
    const feedbackInput = document.getElementById('sf-' + actId + '-' + studentId);
    if (!gradeInput) return;
    const val = parseFloat(gradeInput.value);
    if (isNaN(val) || val < 0 || val > 10) { showToast('Ingresa una nota válida entre 0 y 10', 'error'); return; }
    saveStudentGrade(studentId, actId, val, feedbackInput ? feedbackInput.value.trim() : '');
    showToast('Calificación guardada', 'success');
    renderSubmissionsList();
}

function openGradeModal(actId, studentId) {
    const act = MOCK.activities.find(a => a.id === actId);
    const student = MOCK.students.find(s => s.id === studentId);
    if (!act || !student) return;
    const existing = getStudentSubmission(studentId, actId);
    openModal('Calificar — ' + student.user.name, `
        <div style="background:var(--cream);border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:13px;color:var(--text-muted)">
            <strong style="color:var(--text-dark)">${act.title}</strong> · ${student.studentCode}
        </div>
        <div class="form-group"><label class="form-label">Calificación (0 – 10)</label>
            <input type="number" class="form-input" id="mGradeVal" min="0" max="10" step="0.1" value="${existing && existing.grade !== undefined ? existing.grade : ''}">
        </div>
        <div class="form-group"><label class="form-label">Retroalimentación</label>
            <textarea class="form-input" id="mGradeFb" placeholder="Escribe aquí tu retroalimentación..." style="min-height:100px">${existing && existing.feedback ? existing.feedback : ''}</textarea>
        </div>
        <div style="display:flex;gap:8px">
            <button class="btn btn-teal" style="flex:1" onclick="saveGradeModal(${actId},${studentId})">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Guardar calificación
            </button>
            <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        </div>`);
}

function saveGradeModal(actId, studentId) {
    const val = parseFloat(document.getElementById('mGradeVal').value);
    const fb = document.getElementById('mGradeFb').value.trim();
    if (isNaN(val) || val < 0 || val > 10) { showToast('Ingresa una nota válida entre 0 y 10', 'error'); return; }
    saveStudentGrade(studentId, actId, val, fb);
    closeModal();
    showToast('Calificación guardada', 'success');
    if (document.getElementById('submissionsView').classList.contains('show')) renderSubmissionsList();
    else renderEntregasList();
}

function applyMassGrade() {
    const val = parseFloat(document.getElementById('mMassGrade').value);
    const fb = document.getElementById('mMassFb').value.trim();
    if (isNaN(val) || val < 0 || val > 10) { showToast('Ingresa una nota válida entre 0 y 10', 'error'); return; }
    let count = 0;
    MOCK.students.forEach(s => {
        const sub = getStudentSubmission(s.id, currentSubmissionsActivityId);
        if (sub && sub.submitted && !sub.graded) { saveStudentGrade(s.id, currentSubmissionsActivityId, val, fb); count++; }
    });
    closeModal();
    showToast(count + ' entregas calificadas', 'success');
    renderSubmissionsList();
}

async function loadCalificaciones() {
    const sel = document.getElementById('gradeCourseFilter');
    const courses = teacherCourses.length ? teacherCourses : MOCK.courses;
    sel.innerHTML = '<option value="">Selecciona un curso</option>' + courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    sel.onchange = () => renderGrades(parseInt(sel.value));
    document.getElementById('gradesSummaryBar').style.display = 'none';
}

function renderGrades(courseId) {
    const container = document.getElementById('calificacionesContainer');
    if (!courseId) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Selecciona un curso</div></div>';
        document.getElementById('gradesSummaryBar').style.display = 'none';
        return;
    }
    const courseGrades = MOCK.grades.filter(g => g.course && g.course.id === courseId);
    if (!courseGrades.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Sin calificaciones registradas</div><div class="empty-state-text">Agrega la primera calificación con el botón "Agregar Nota".</div></div>';
        document.getElementById('gradesSummaryBar').style.display = 'none';
        return;
    }
    const vals = courseGrades.map(g => parseFloat(g.grade || 0));
    document.getElementById('gradeAvg').textContent = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
    document.getElementById('gradeMax').textContent = Math.max(...vals).toFixed(1);
    document.getElementById('gradeMin').textContent = Math.min(...vals).toFixed(1);
    document.getElementById('gradeApproval').textContent = Math.round((vals.filter(v => v >= 6).length / vals.length) * 100) + '%';
    document.getElementById('gradesSummaryBar').style.display = 'flex';
    container.innerHTML = `<table><thead><tr><th>Código</th><th>Estudiante</th><th>Calificación</th><th>Barra</th><th>Descripción</th><th>Acciones</th></tr></thead><tbody>` +
        courseGrades.map(g => {
            const val = parseFloat(g.grade || 0);
            const cl = val >= 7 ? 'badge-success' : val >= 5 ? 'badge-gold' : 'badge-error';
            const bc = val >= 7 ? 'high' : val >= 5 ? 'mid' : 'low';
            return `<tr>
                <td style="font-size:12px;color:var(--text-muted)">${g.student && g.student.studentCode ? g.student.studentCode : '—'}</td>
                <td><strong>${g.student && g.student.user ? g.student.user.name : '—'}</strong></td>
                <td><span class="badge ${cl}">${val.toFixed(1)}</span></td>
                <td style="min-width:90px"><div class="grade-bar"><div class="grade-fill ${bc}" style="width:${(val / 10) * 100}%"></div></div></td>
                <td style="font-size:13px;color:var(--text-muted);max-width:160px">${g.description || '—'}</td>
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
    if (!confirm('¿Eliminar esta calificación?')) return;
    const idx = MOCK.grades.findIndex(x => x.id === gradeId);
    if (idx >= 0) MOCK.grades.splice(idx, 1);
    renderGrades(courseId); showToast('Calificación eliminada');
}

function exportGrades() {
    const courseId = parseInt(document.getElementById('gradeCourseFilter').value);
    if (!courseId) { showToast('Selecciona un curso para exportar', 'error'); return; }
    const course = MOCK.courses.find(c => c.id === courseId) || {};
    const grades = MOCK.grades.filter(g => g.course && g.course.id === courseId);
    const csv = ['Código,Estudiante,Calificación,Descripción', ...grades.map(g => `${g.student ? g.student.studentCode || '' : ''},${g.student && g.student.user ? g.student.user.name : ''},${g.grade || 0},"${g.description || ''}"`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'calificaciones_' + (course.name || 'curso').replace(/\s+/g, '_') + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Calificaciones exportadas', 'success');
}

async function loadAsistencia() {
    const courses = teacherCourses.length ? teacherCourses : MOCK.courses;
    const opts = '<option value="">Selecciona un curso</option>' + courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('attCourseFilter').innerHTML = opts;
    document.getElementById('attSummaryCourse').innerHTML = opts;
    document.getElementById('attDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('btnLoadAtt').onclick = renderAttendance;
    document.getElementById('attSummaryCourse').onchange = () => renderAttendanceSummary(parseInt(document.getElementById('attSummaryCourse').value));
}

let attState = {};
function renderAttendance() {
    const courseId = parseInt(document.getElementById('attCourseFilter').value);
    const date = document.getElementById('attDate').value;
    if (!courseId || !date) { showToast('Selecciona curso y fecha', 'error'); return; }
    const key = 'att_' + courseId + '_' + date;
    attState = JSON.parse(localStorage.getItem(key) || '{}');
    MOCK.students.forEach(s => { if (attState[s.id] === undefined) attState[s.id] = true; });
    document.getElementById('asistenciaContainer').innerHTML = `
        <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
            <button class="btn btn-success-outline btn-sm" onclick="markAll(${courseId},'${date}',true)">Marcar todos presentes</button>
            <button class="btn btn-danger btn-sm" onclick="markAll(${courseId},'${date}',false)">Marcar todos ausentes</button>
            <button class="btn btn-teal btn-sm" onclick="saveAttendance(${courseId},'${date}')">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/></svg>
                Guardar
            </button>
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
            <td><div style="display:flex;align-items:center;gap:8px">
                <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--navy-light),var(--teal));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;font-family:'Cormorant Garamond',serif">${getInitials(s.user.name)}</div>
                ${s.user.name}
            </div></td>
            <td><span class="badge ${present ? 'badge-success' : 'badge-error'}">${present ? 'Presente' : 'Ausente'}</span></td>
            <td><button class="btn btn-sm ${present ? 'btn-danger' : 'btn-success-outline'}" onclick="toggleAtt(${s.id},${courseId},'${date}')">${present ? 'Marcar ausente' : 'Marcar presente'}</button></td>
        </tr>`;
    }).join('');
}

function toggleAtt(sid, courseId, date) { attState[sid] = !attState[sid]; renderAttBody(MOCK.students, courseId, date); }
function markAll(courseId, date, val) { MOCK.students.forEach(s => attState[s.id] = val); renderAttBody(MOCK.students, courseId, date); }

function saveAttendance(courseId, date) {
    localStorage.setItem('att_' + courseId + '_' + date, JSON.stringify(attState));
    showToast('Asistencia guardada correctamente', 'success');
    const sumSel = document.getElementById('attSummaryCourse');
    if (parseInt(sumSel.value) === courseId) renderAttendanceSummary(courseId);
}

function renderAttendanceSummary(courseId) {
    const container = document.getElementById('asistenciaResumen');
    if (!courseId) { container.innerHTML = '<div class="empty-state" style="padding:24px 0"><div class="empty-state-title">Sin datos</div></div>'; return; }
    const prefix = 'att_' + courseId + '_';
    const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
    if (!keys.length) { container.innerHTML = '<div style="color:var(--text-muted);font-size:13px">No hay registros de asistencia guardados para este curso.</div>'; return; }
    const totals = {};
    MOCK.students.forEach(s => totals[s.id] = { present: 0, total: 0 });
    keys.forEach(k => {
        try {
            const data = JSON.parse(localStorage.getItem(k));
            if (!data) return;
            MOCK.students.forEach(s => { if (data[s.id] !== undefined) { totals[s.id].total++; if (data[s.id]) totals[s.id].present++; } });
        } catch (e) {}
    });
    container.innerHTML = `<div style="margin-bottom:12px;font-size:12px;color:var(--text-muted)">${keys.length} sesión(es) registrada(s)</div>
    <table><thead><tr><th>Código</th><th>Estudiante</th><th>Presentes</th><th>Ausentes</th><th>Porcentaje</th><th>Estado</th></tr></thead><tbody>` +
        MOCK.students.map(s => {
            const t = totals[s.id];
            const pct = t.total ? Math.round((t.present / t.total) * 100) : 0;
            const bc = pct >= 80 ? 'badge-success' : pct >= 60 ? 'badge-warning' : 'badge-error';
            const fc = pct >= 80 ? 'high' : pct >= 60 ? 'mid' : 'low';
            return `<tr>
                <td style="font-size:12px;color:var(--text-muted)">${s.studentCode}</td>
                <td>${s.user.name}</td>
                <td style="color:var(--success);font-weight:600">${t.present}</td>
                <td style="color:var(--error);font-weight:600">${t.total - t.present}</td>
                <td><div style="display:flex;align-items:center;gap:8px"><div class="grade-bar" style="width:60px"><div class="grade-fill ${fc}" style="width:${pct}%"></div></div><span style="font-size:12px;font-weight:600">${pct}%</span></div></td>
                <td><span class="badge ${bc}">${pct >= 80 ? 'Regular' : pct >= 60 ? 'Riesgo' : 'Crítico'}</span></td>
            </tr>`;
        }).join('') + '</tbody></table>';
}

async function loadHorarios() {
    const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const sorted = [...MOCK.schedules].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
    document.getElementById('horariosContainer').innerHTML = `<table><thead><tr><th>Día</th><th>Curso</th><th>Inicio</th><th>Fin</th><th></th></tr></thead><tbody>` +
        sorted.map(s => `<tr>
            <td><span class="badge badge-teal">${s.day}</span></td>
            <td><strong>${s.course ? s.course.name : '—'}</strong></td>
            <td>${s.startTime}</td>
            <td>${s.endTime}</td>
            <td><button class="btn-icon del" onclick="deleteSchedule(${s.id})" title="Eliminar">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            </button></td>
        </tr>`).join('') + '</tbody></table>';
    renderWeekView(MOCK.schedules);
}

function renderWeekView(schedules) {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    document.getElementById('weekGrid').innerHTML = days.map(day => {
        const slots = schedules.filter(s => s.day === day);
        return `<div class="week-day-col">
            <div class="week-day-header">${day}</div>
            <div class="week-day-slots">
                ${slots.length ? slots.map(s => `<div class="week-slot">
                    <div class="week-slot-course">${s.course ? s.course.name : '—'}</div>
                    <div class="week-slot-time">${s.startTime} – ${s.endTime}</div>
                </div>`).join('') : '<div style="padding:8px;font-size:11.5px;color:var(--text-muted);text-align:center">Sin clases</div>'}
            </div>
        </div>`;
    }).join('');
}

function deleteSchedule(id) {
    if (!confirm('¿Eliminar este horario?')) return;
    const idx = MOCK.schedules.findIndex(s => s.id === id);
    if (idx >= 0) MOCK.schedules.splice(idx, 1);
    loadHorarios(); showToast('Horario eliminado');
}

function loadEstudiantes() {
    const courses = teacherCourses.length ? teacherCourses : MOCK.courses;
    const sel = document.getElementById('studentCourseFilter');
    sel.innerHTML = '<option value="">Todos los cursos</option>' + courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    sel.onchange = renderEstudiantes;
    document.getElementById('studentSearch').oninput = renderEstudiantes;
    renderEstudiantes();
}

function renderEstudiantes() {
    const courseId = parseInt(document.getElementById('studentCourseFilter').value) || 0;
    const query = document.getElementById('studentSearch').value.trim().toLowerCase();
    const container = document.getElementById('estudiantesContainer');
    let students = MOCK.students;
    if (query) students = students.filter(s => s.user.name.toLowerCase().includes(query) || s.studentCode.toLowerCase().includes(query));
    if (!students.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Sin resultados</div><div class="empty-state-text">No se encontraron estudiantes con esos criterios.</div></div>';
        return;
    }
    container.innerHTML = `<table><thead><tr><th>Código</th><th>Estudiante</th><th>Promedio</th><th>Asistencia</th><th>Entregas</th><th>Acciones</th></tr></thead><tbody>` +
        students.map(s => {
            const sGrades = MOCK.grades.filter(g => g.student && g.student.id === s.id && (!courseId || g.course.id === courseId));
            const avg = sGrades.length ? (sGrades.reduce((a, b) => a + parseFloat(b.grade || 0), 0) / sGrades.length).toFixed(1) : '—';
            const avgColor = avg !== '—' ? (parseFloat(avg) >= 7 ? 'var(--success)' : parseFloat(avg) >= 5 ? 'var(--gold)' : 'var(--error)') : 'var(--text-muted)';
            const relActs = MOCK.activities.filter(a => !courseId || (a.course && a.course.id === courseId));
            const subCount = relActs.filter(a => { const sub = getStudentSubmission(s.id, a.id); return sub && sub.submitted; }).length;
            let attPct = '—';
            if (courseId) {
                const keys = Object.keys(localStorage).filter(k => k.startsWith('att_' + courseId + '_'));
                let present = 0, total = 0;
                keys.forEach(k => { try { const d = JSON.parse(localStorage.getItem(k)); if (d && d[s.id] !== undefined) { total++; if (d[s.id]) present++; } } catch (e) {} });
                attPct = total ? Math.round((present / total) * 100) + '%' : '—';
            }
            return `<tr>
                <td style="font-size:12px;color:var(--text-muted)">${s.studentCode}</td>
                <td><div style="display:flex;align-items:center;gap:10px">
                    <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--navy-light),var(--teal));display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:12px;font-weight:700;color:#fff;flex-shrink:0">${getInitials(s.user.name)}</div>
                    <strong style="font-size:13.5px">${s.user.name}</strong>
                </div></td>
                <td><span style="font-size:16px;font-weight:700;font-family:'Cormorant Garamond',serif;color:${avgColor}">${avg}</span></td>
                <td>${attPct !== '—' ? `<span class="badge ${parseFloat(attPct) >= 80 ? 'badge-success' : 'badge-warning'}">${attPct}</span>` : '<span style="color:var(--text-muted);font-size:12px">—</span>'}</td>
                <td><span class="badge badge-navy">${subCount}/${relActs.length}</span></td>
                <td><button class="btn btn-sm btn-outline" onclick="viewStudentProfile(${s.id})">Ver perfil</button></td>
            </tr>`;
        }).join('') + '</tbody></table>';
}

function viewStudentProfile(studentId) {
    const student = MOCK.students.find(s => s.id === studentId);
    if (!student) return;
    const grades = MOCK.grades.filter(g => g.student && g.student.id === studentId);
    const avg = grades.length ? (grades.reduce((a, b) => a + parseFloat(b.grade || 0), 0) / grades.length).toFixed(1) : '—';
    openModal('Perfil — ' + student.user.name, `
        <div style="background:linear-gradient(135deg,var(--navy),var(--navy-light));border-radius:10px;padding:18px 20px;margin-bottom:18px;display:flex;align-items:center;gap:14px">
            <div style="width:48px;height:48px;border-radius:50%;background:rgba(200,150,46,0.2);border:2px solid rgba(200,150,46,0.4);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:700;color:var(--white);flex-shrink:0">${getInitials(student.user.name)}</div>
            <div style="flex:1"><div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:700;color:var(--white)">${student.user.name}</div><div style="font-size:12px;color:rgba(255,255,255,0.55)">${student.studentCode}</div></div>
            <div style="text-align:center"><div style="font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:700;color:var(--gold)">${avg}</div><div style="font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px">Promedio</div></div>
        </div>
        <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px">Calificaciones</div>
        ${grades.length ? grades.map(g => {
        const val = parseFloat(g.grade || 0);
        const cl = val >= 7 ? 'high' : val >= 5 ? 'mid' : 'low';
        const cn = MOCK.courses.find(c => c.id === (g.course ? g.course.id : 0));
        return `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-size:13px">${cn ? cn.name : '—'}</span><strong>${val.toFixed(1)}</strong></div><div class="grade-bar"><div class="grade-fill ${cl}" style="width:${(val/10)*100}%"></div></div></div>`;
    }).join('') : '<p style="font-size:13px;color:var(--text-muted)">Sin calificaciones registradas.</p>'}
        <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-muted);margin:16px 0 10px">Entregas</div>
        ${MOCK.activities.map(a => {
        const sub = getStudentSubmission(studentId, a.id);
        const state = !sub || !sub.submitted ? 'Sin entregar' : sub.graded ? 'Nota: ' + sub.grade + '/10' : 'Por calificar';
        const bc = !sub || !sub.submitted ? 'badge-navy' : sub.graded ? 'badge-success' : 'badge-gold';
        const cn = MOCK.courses.find(c => c.id === (a.course ? a.course.id : 0));
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(11,31,58,0.05)"><div><div style="font-size:13px;font-weight:500">${a.title}</div><div style="font-size:11px;color:var(--text-muted)">${cn ? cn.name : '—'}</div></div><span class="badge ${bc}">${state}</span></div>`;
    }).join('')}`);
}

function loadPerfil() {
    const u = currentUser || MOCK.user;
    const t = currentTeacher || MOCK.teacher;
    document.getElementById('profName').value = u.name || '';
    document.getElementById('profEmail').value = u.email || '';
    document.getElementById('profSpecialization').value = t.specialization || '';
    const courses = teacherCourses.length ? teacherCourses : MOCK.courses;
    const pending = getPendingSubmissionsCount();
    document.getElementById('profSummary').innerHTML = [
        { icon: `<svg width="16" height="16" fill="none" stroke="var(--teal)" stroke-width="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`, bg: 'rgba(30,107,116,0.1)', val: courses.length, lbl: 'Cursos activos' },
        { icon: `<svg width="16" height="16" fill="none" stroke="var(--navy)" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`, bg: 'rgba(11,31,58,0.07)', val: courses.reduce((s, c) => s + (c.studentsCount || 0), 0), lbl: 'Estudiantes' },
        { icon: `<svg width="16" height="16" fill="none" stroke="var(--gold)" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>`, bg: 'rgba(200,150,46,0.1)', val: MOCK.activities.length, lbl: 'Actividades' },
        { icon: `<svg width="16" height="16" fill="none" stroke="var(--error)" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><line x1="16" y1="13" x2="8" y2="13"/></svg>`, bg: 'rgba(192,57,43,0.08)', val: pending, lbl: 'Pendientes', col: pending > 0 ? 'var(--error)' : 'var(--text-dark)' },
    ].map(item => `<div class="prof-summary-stat">
        <div class="prof-summary-icon" style="background:${item.bg}">${item.icon}</div>
        <div><div class="prof-summary-val" style="color:${item.col || 'var(--text-dark)'}">${item.val}</div><div class="prof-summary-lbl">${item.lbl}</div></div>
    </div>`).join('');
    document.getElementById('profCourses').innerHTML = courses.map(c => `<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid rgba(11,31,58,0.05)">
        <div><div style="font-size:13.5px;font-weight:600">${c.name}</div><div style="font-size:11.5px;color:var(--text-muted)">${c.studentsCount || 0} estudiantes</div></div>
        <button class="btn btn-sm btn-outline" onclick="openCourseView(${JSON.stringify(c).replace(/"/g, '&quot;')})">Abrir</button>
    </div>`).join('');
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
    showView('course');
    document.getElementById('topbarBreadcrumb').style.display = 'flex';
    document.getElementById('breadcrumbBack').textContent = 'Mis Cursos';
    document.getElementById('breadcrumbCourseName').textContent = currentCourse.name || 'Curso';
    document.getElementById('breadcrumbActivitySep').style.display = 'none';
    document.getElementById('breadcrumbActivityName').style.display = 'none';
    document.getElementById('pageTitle').style.display = 'none';
    document.getElementById('pageSubtitle').style.display = 'none';
    document.getElementById('cvCourseName').textContent = currentCourse.name || 'Curso';
    document.getElementById('cvCourseMeta').textContent = (currentCourse.studentsCount || 0) + ' estudiantes · ' + getUnits(currentCourse.id).length + ' unidades';
    renderUnitTabs();
    renderUnit(0);
}

function closeCourseView() {
    showView('main');
    document.getElementById('topbarBreadcrumb').style.display = 'none';
    document.getElementById('pageTitle').style.display = '';
    document.getElementById('pageSubtitle').style.display = '';
}

function renderUnitTabs() {
    const units = getUnits(currentCourse.id);
    const bar = document.getElementById('unitTabsBar');
    if (!units.length) {
        bar.innerHTML = '<div style="padding:0 20px;font-size:13px;color:var(--text-muted);display:flex;align-items:center;min-height:52px">Sin unidades. Usa "+ Nueva Unidad" para empezar.</div>';
        return;
    }
    bar.innerHTML = units.map((u, i) => `<button class="unit-tab ${i === 0 ? 'active' : ''}" onclick="renderUnit(${i})"><span class="unit-tab-num">${i + 1}</span>${u.name}</button>`).join('');
}

function renderUnit(idx) {
    currentUnitIdx = idx;
    const units = getUnits(currentCourse.id);
    document.querySelectorAll('.unit-tab').forEach((el, i) => el.classList.toggle('active', i === idx));
    const contentArea = document.getElementById('unitContentArea');
    if (!units.length) {
        contentArea.innerHTML = `<div class="empty-state"><div class="empty-state-title">Sin unidades</div><div class="empty-state-text">Agrega la primera unidad con el botón "Nueva Unidad".</div><button class="btn btn-teal" style="margin-top:16px" onclick="addUnitModal()">Agregar primera unidad</button></div>`;
        return;
    }
    const unit = units[idx];
    const allActs = MOCK.activities.filter(a => a.course && a.course.id === currentCourse.id);
    const allExams = MOCK.exams.filter(x => x.course && x.course.id === currentCourse.id);
    const acts = unit.activities ? allActs.filter(a => unit.activities.includes(a.id)) : [];
    const exams = unit.exams ? allExams.filter(x => unit.exams.includes(x.id)) : [];
    const announcements = unit.announcements || [];
    const resources = unit.resources || [];

    const IFILE = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    const ICLIP = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>`;
    const IBELL = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`;
    const ICAL = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
    const ICH = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>`;
    const IEDIT = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/></svg>`;
    const IDEL = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>`;
    const IPLUS = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    const IVID = `<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>`;
    const ILINK = `<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>`;
    const IIMG = `<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>`;

    /* Helper: render attachment list for a given array */
    function attachmentsHtml(atts) {
        if (!atts || !atts.length) return '';
        const iconMap = {
            pdf: `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
            doc: `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
            img: `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
            video: `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
        };
        return `<div class="attachment-list">${atts.map(at => `<div class="attachment-item">
            <div class="attachment-icon ${at.type || 'doc'}">${iconMap[at.type] || iconMap.doc}</div>
            <span class="attachment-name">${at.name}</span>
            <a class="attachment-download" href="${at.url || '#'}" target="_blank">${ICLIP} Abrir</a>
        </div>`).join('')}</div>`;
    }

    contentArea.innerHTML = `
    <div class="unit-welcome">
        <div class="unit-welcome-content">
            <div class="unit-welcome-label">Unidad ${idx + 1}</div>
            <div class="unit-welcome-title">${unit.name}</div>
            <div class="unit-welcome-text">${unit.welcome || 'Sin texto de bienvenida.'}</div>
        </div>
        <div class="unit-welcome-actions">
            <button class="unit-welcome-edit" onclick="editUnitModal(${idx})">${IEDIT} Editar unidad</button>
            <button class="unit-welcome-edit" style="margin-top:8px;border-color:rgba(192,57,43,0.3);color:rgba(255,100,100,0.8)" onclick="deleteUnitConfirm(${idx})">${IDEL} Eliminar</button>
        </div>
    </div>

    <div class="unit-description-card" style="margin-bottom:20px">
        <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px">Descripción del Tema</div>
        <p style="font-size:14px;line-height:1.75;color:var(--text-body)">${unit.description || 'Sin descripción. Edita la unidad para agregar una.'}</p>
    </div>

    <!-- ── ANUNCIOS ── -->
    <div class="card" style="margin-bottom:20px">
        <div class="card-header">
            <span class="card-title">Anuncios</span>
            <div style="display:flex;align-items:center;gap:8px">
                <span class="badge badge-gold">${announcements.length}</span>
                <button class="btn btn-sm btn-outline" onclick="addAnnouncementModal(${idx})">${IPLUS} Agregar</button>
            </div>
        </div>
        <div class="card-body" style="${announcements.length ? 'padding:0' : ''}">
            ${announcements.length ? announcements.map((a, ai) => {
        const isObj = typeof a === 'object' && a !== null;
        const title = isObj ? (a.title || 'Anuncio') : String(a).slice(0, 80);
        const content = isObj ? (a.content || '') : String(a);
        const dateStr = isObj && a.date ? new Date(a.date + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
        const atts = isObj && Array.isArray(a.attachments) ? a.attachments : [];
        const cid = `ann-t-${currentCourse.id}-${idx}-${ai}`;
        return `<div class="announcement-card" id="${cid}">
                    <div class="announcement-card-header" onclick="toggleCard('${cid}')">
                        <div class="announcement-card-icon">${IBELL}</div>
                        <div class="announcement-card-meta">
                            <div class="announcement-card-title">${title}</div>
                            ${dateStr ? `<div class="announcement-card-date">${dateStr}</div>` : ''}
                            <div class="announcement-card-preview">${content}</div>
                        </div>
                        <div style="display:flex;gap:4px;flex-shrink:0">
                            <button class="btn-icon" onclick="event.stopPropagation();editAnnouncementModal(${idx},${ai})" title="Editar">${IEDIT}</button>
                            <button class="btn-icon del" onclick="event.stopPropagation();removeAnnouncement(${idx},${ai})" title="Eliminar">${IDEL}</button>
                            <button class="announcement-toggle-btn" onclick="event.stopPropagation();toggleCard('${cid}')">${ICH}</button>
                        </div>
                    </div>
                    <div class="announcement-card-body">
                        <div class="announcement-full-text">${content}</div>
                        ${atts.length ? `<div class="announcement-section-label" style="margin-top:14px">Archivos adjuntos</div>${attachmentsHtml(atts)}` : ''}
                    </div>
                </div>`;
    }).join('') : '<div style="color:var(--text-muted);font-size:13px;padding:4px 0">Sin anuncios para esta unidad.</div>'}
        </div>
    </div>

    <!-- ── TALLERES ── -->
    <div class="card" style="margin-bottom:20px">
        <div class="card-header">
            <span class="card-title">Talleres y Actividades</span>
            <div style="display:flex;align-items:center;gap:8px">
                <span class="badge badge-navy">${acts.length}</span>
                <button class="btn btn-sm btn-outline" onclick="addActivityModal(${idx})">${IPLUS} Agregar</button>
            </div>
        </div>
        <div class="card-body">
            ${acts.length ? acts.map((a, i) => {
        const pending = MOCK.students.filter(s => { const sub = getStudentSubmission(s.id, a.id); return sub && sub.submitted && !sub.graded; }).length;
        const cid = `act-t-${a.id}-${currentCourse.id}`;
        const mats = a.materials || [];
        return `<div class="activity-card" id="${cid}" style="margin-bottom:10px">
                    <div class="activity-card-header" onclick="toggleCard('${cid}')">
                        <div class="activity-num">${i + 1}</div>
                        <div class="activity-header-meta">
                            <div class="activity-title">${a.title}</div>
                            <div class="activity-due-row">
                                ${a.dueDate ? `<span class="activity-due">${ICAL} Entrega: ${new Date(a.dueDate + 'T00:00:00').toLocaleDateString('es-CO')}</span>` : ''}
                                ${pending > 0 ? `<span class="badge badge-error">${pending} sin calificar</span>` : ''}
                            </div>
                        </div>
                        <div style="display:flex;gap:4px;flex-shrink:0">
                            <button class="btn-icon" title="Ver entregas" onclick="event.stopPropagation();openActivitySubmissions(${a.id})"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></button>
                            <button class="btn-icon" title="Editar" onclick="event.stopPropagation();editActivityModal(${a.id},${idx})">${IEDIT}</button>
                            <button class="btn-icon del" title="Eliminar" onclick="event.stopPropagation();removeActivity(${a.id},${idx})">${IDEL}</button>
                            <button class="activity-toggle-btn" onclick="event.stopPropagation();toggleCard('${cid}')">${ICH}</button>
                        </div>
                    </div>
                    <div class="activity-card-body">
                        ${a.description ? `<div class="activity-description">${a.description}</div>` : ''}
                        ${a.attachments && a.attachments.length ? `<div class="announcement-section-label" style="margin-top:14px">Archivos adjuntos para el estudiante</div>${attachmentsHtml(a.attachments)}` : ''}
                        ${mats.length ? `<div class="announcement-section-label" style="margin-top:14px">Bibliografía y material de apoyo</div>${attachmentsHtml(mats)}` : ''}
                        <div style="margin-top:14px;display:flex;gap:8px">
                            <button class="btn btn-sm btn-teal" onclick="openActivitySubmissions(${a.id})">
                                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                Ver entregas (${MOCK.students.filter(s => { const sub = getStudentSubmission(s.id, a.id); return sub && sub.submitted; }).length}/${MOCK.students.length})
                            </button>
                        </div>
                    </div>
                </div>`;
    }).join('') : '<div style="color:var(--text-muted);font-size:13px;padding:4px 0">Sin talleres asignados.</div>'}
            <button class="add-item-btn" onclick="addActivityModal(${idx})">${IPLUS} Agregar taller o actividad</button>
        </div>
    </div>

    <!-- ── EVALUACIONES ── -->
    <div class="card" style="margin-bottom:20px">
        <div class="card-header">
            <span class="card-title">Evaluaciones</span>
            <div style="display:flex;align-items:center;gap:8px">
                <span class="badge badge-error">${exams.length}</span>
                <button class="btn btn-sm btn-outline" onclick="addExamModal(${idx})">${IPLUS} Agregar</button>
            </div>
        </div>
        <div class="card-body">
            ${exams.length ? exams.map((x, i) => `<div class="exam-card" style="margin-bottom:10px">
                <div class="exam-card-header">
                    <div class="exam-num">${i + 1}</div>
                    <div class="exam-header-meta">
                        <div class="exam-title">${x.title}</div>
                        ${x.examDate ? `<div class="exam-date">${ICAL} Fecha: ${new Date(x.examDate + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</div>` : ''}
                    </div>
                    <div style="display:flex;gap:4px">
                        <button class="btn-icon" onclick="editExamModal(${x.id},${idx})">${IEDIT}</button>
                        <button class="btn-icon del" onclick="removeExam(${x.id},${idx})">${IDEL}</button>
                    </div>
                </div>
                ${x.description ? `<div class="exam-card-body" style="display:block"><p style="font-size:14px;color:var(--text-body);line-height:1.75">${x.description}</p></div>` : ''}
            </div>`).join('') : '<div style="color:var(--text-muted);font-size:13px;padding:4px 0">Sin evaluaciones programadas.</div>'}
            <button class="add-item-btn" onclick="addExamModal(${idx})">${IPLUS} Agregar evaluación</button>
        </div>
    </div>

    <!-- ── RECURSOS ── -->
    <div class="card" style="margin-bottom:20px">
        <div class="card-header">
            <span class="card-title">Bibliografía y Recursos</span>
            <div style="display:flex;align-items:center;gap:8px">
                <span class="badge badge-success">${resources.length}</span>
                <button class="btn btn-sm btn-outline" onclick="addResourceModal(${idx})">${IPLUS} Agregar</button>
            </div>
        </div>
        <div class="card-body">
            ${resources.map((r, ri) => `<div class="resource-card-item" style="cursor:default">
                <div class="resource-icon ${r.type || 'doc'}"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">${r.type === 'video' ? IVID : r.type === 'link' ? ILINK : r.type === 'img' ? IIMG : '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>'}</svg></div>
                <span class="resource-name">${r.name}</span>
                <span class="resource-type">${(r.type || 'doc').toUpperCase()}</span>
                <button class="btn-icon del" onclick="removeResource(${idx},${ri})" title="Eliminar">${IDEL}</button>
            </div>`).join('') || '<div style="color:var(--text-muted);font-size:13px;padding:4px 0">Sin recursos asignados.</div>'}
            <button class="add-item-btn" onclick="addResourceModal(${idx})">${IPLUS} Agregar recurso o bibliografía</button>
        </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   UNIT CRUD
═══════════════════════════════════════════════════════════════════════════ */
function addUnitModal() {
    openModal('Nueva Unidad', `
        <div class="form-group"><label class="form-label">Nombre de la unidad</label><input type="text" class="form-input" id="mUnitName" placeholder="Ej: Unidad 1 — Álgebra Lineal"></div>
        <div class="form-group"><label class="form-label">Texto de bienvenida</label><textarea class="form-input" id="mUnitWelcome" placeholder="Texto introductorio..."></textarea></div>
        <div class="form-group"><label class="form-label">Descripción del tema</label><textarea class="form-input" id="mUnitDesc" placeholder="Descripción detallada de los temas..."></textarea></div>
        <button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="createUnit()">Crear unidad</button>`);
}

function createUnit() {
    const name = document.getElementById('mUnitName').value.trim();
    if (!name) { showToast('El nombre de la unidad es obligatorio', 'error'); return; }
    const units = getUnits(currentCourse.id);
    units.push({ id: 'u' + Date.now(), name, welcome: document.getElementById('mUnitWelcome').value, description: document.getElementById('mUnitDesc').value, announcements: [], activities: [], exams: [], resources: [] });
    saveUnits(currentCourse.id, units);
    closeModal(); renderUnitTabs(); renderUnit(units.length - 1); showToast('Unidad creada', 'success');
    document.getElementById('cvCourseMeta').textContent = (currentCourse.studentsCount || 0) + ' estudiantes · ' + units.length + ' unidades';
}

function editUnitModal(idx) {
    const u = getUnits(currentCourse.id)[idx];
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
    else document.getElementById('unitContentArea').innerHTML = '<div class="empty-state"><div class="empty-state-title">Sin unidades</div><div class="empty-state-text">Agrega la primera unidad.</div><button class="btn btn-teal" style="margin-top:16px" onclick="addUnitModal()">Agregar unidad</button></div>';
    document.getElementById('cvCourseMeta').textContent = (currentCourse.studentsCount || 0) + ' estudiantes · ' + units.length + ' unidades';
    showToast('Unidad eliminada');
}

/* ═══════════════════════════════════════════════════════════════════════════
   ANNOUNCEMENT CRUD  (with file attachments)
═══════════════════════════════════════════════════════════════════════════ */
function addAnnouncementModal(unitIdx) {
    const key = 'ann-new-' + unitIdx;
    clearModalFiles(key);
    openModal('Nuevo Anuncio', `
        <div class="form-group">
            <label class="form-label">Título del anuncio</label>
            <input type="text" class="form-input" id="mAnnTitle" placeholder="Ej: Recordatorio de entrega">
        </div>
        <div class="form-group">
            <label class="form-label">Contenido</label>
            <textarea class="form-input" id="mAnnContent"
                placeholder="Escribe el anuncio completo para los estudiantes. Puedes incluir instrucciones, recordatorios, aclaraciones, etc."
                style="min-height:160px"></textarea>
        </div>
        <div class="form-group">
            <label class="form-label">Fecha</label>
            <input type="date" class="form-input" id="mAnnDate" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
            <label class="form-label">Archivos adjuntos <span style="font-weight:400;color:var(--text-muted)">(imágenes, videos, PDFs, documentos)</span></label>
            ${modalDropArea(key, 'Arrastra imágenes, videos o documentos aquí')}
        </div>
        <button class="btn btn-teal" style="width:100%" onclick="saveAnnouncement(${unitIdx},'${key}')">Publicar anuncio</button>`);
}

function saveAnnouncement(unitIdx, key) {
    const title = document.getElementById('mAnnTitle').value.trim();
    const content = document.getElementById('mAnnContent').value.trim();
    if (!title || !content) { showToast('Título y contenido son obligatorios', 'error'); return; }
    const attachments = getModalAttachments(key, []);
    const units = getUnits(currentCourse.id);
    units[unitIdx].announcements = units[unitIdx].announcements || [];
    units[unitIdx].announcements.push({
        id: 'a' + Date.now(),
        title,
        content,
        date: document.getElementById('mAnnDate').value,
        attachments
    });
    saveUnits(currentCourse.id, units);
    clearModalFiles(key);
    closeModal();
    renderUnit(unitIdx);
    showToast('Anuncio publicado', 'success');
}

function editAnnouncementModal(unitIdx, annIdx) {
    const units = getUnits(currentCourse.id);
    const a = units[unitIdx].announcements[annIdx];
    const isObj = typeof a === 'object' && a !== null;
    const key = 'ann-edit-' + unitIdx + '-' + annIdx;
    clearModalFiles(key);
    const existingAtts = isObj && Array.isArray(a.attachments) ? a.attachments : [];
    openModal('Editar Anuncio', `
        <div class="form-group">
            <label class="form-label">Título</label>
            <input type="text" class="form-input" id="mAnnTitle" value="${isObj ? (a.title || '') : ''}">
        </div>
        <div class="form-group">
            <label class="form-label">Contenido</label>
            <textarea class="form-input" id="mAnnContent"
                style="min-height:160px">${isObj ? (a.content || String(a)) : String(a)}</textarea>
        </div>
        <div class="form-group">
            <label class="form-label">Fecha</label>
            <input type="date" class="form-input" id="mAnnDate" value="${isObj && a.date ? a.date : new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
            <label class="form-label">Archivos adjuntos</label>
            ${renderExistingAttachments(existingAtts, key, unitIdx, annIdx)}
            ${modalDropArea(key, 'Agregar nuevos archivos')}
        </div>
        <button class="btn btn-teal" style="width:100%" onclick="updateAnnouncement(${unitIdx},${annIdx},'${key}')">Guardar cambios</button>`);
}

function updateAnnouncement(unitIdx, annIdx, key) {
    const title = document.getElementById('mAnnTitle').value.trim();
    const content = document.getElementById('mAnnContent').value.trim();
    if (!title || !content) { showToast('Título y contenido son obligatorios', 'error'); return; }
    const units = getUnits(currentCourse.id);
    const existing = units[unitIdx].announcements[annIdx];
    const isObj = typeof existing === 'object' && existing !== null;
    // Merge: keep existing (possibly edited via removeExistingAttachment) + new uploads
    const currentAtts = isObj && Array.isArray(existing.attachments) ? existing.attachments : [];
    const attachments = getModalAttachments(key, currentAtts);
    units[unitIdx].announcements[annIdx] = {
        ...(isObj ? existing : {}),
        title,
        content,
        date: document.getElementById('mAnnDate').value,
        attachments
    };
    saveUnits(currentCourse.id, units);
    clearModalFiles(key);
    closeModal();
    renderUnit(unitIdx);
    showToast('Anuncio actualizado', 'success');
}

function removeAnnouncement(unitIdx, annIdx) {
    const units = getUnits(currentCourse.id);
    units[unitIdx].announcements.splice(annIdx, 1);
    saveUnits(currentCourse.id, units);
    renderUnit(unitIdx);
    showToast('Anuncio eliminado');
}

/* ═══════════════════════════════════════════════════════════════════════════
   ACTIVITY CRUD  (with attachments + bibliography/materials)
═══════════════════════════════════════════════════════════════════════════ */
function addActivityModal(unitIdx) {
    const keyAtts  = 'act-new-atts-' + unitIdx;
    const keyMats  = 'act-new-mats-' + unitIdx;
    clearModalFiles(keyAtts);
    clearModalFiles(keyMats);
    openModal('Nueva Actividad', `
        <div class="form-group">
            <label class="form-label">Título</label>
            <input type="text" class="form-input" id="mActTitle" placeholder="Ej: Taller — Matrices y Determinantes">
        </div>
        <div class="form-group">
            <label class="form-label">Descripción e instrucciones</label>
            <textarea class="form-input" id="mActDesc"
                placeholder="Describe la actividad, criterios de evaluación, formato de entrega, etc."
                style="min-height:130px"></textarea>
        </div>
        <div class="form-group">
            <label class="form-label">Fecha de entrega</label>
            <input type="date" class="form-input" id="mActDate">
        </div>
        <div class="form-group">
            <label class="form-label">Archivos adjuntos para el estudiante <span style="font-weight:400;color:var(--text-muted)">(guías, rúbricas, plantillas…)</span></label>
            ${modalDropArea(keyAtts, 'Arrastra guías, rúbricas o cualquier archivo')}
        </div>
        <div class="form-group">
            <label class="form-label">Bibliografía y material de apoyo <span style="font-weight:400;color:var(--text-muted)">(lecturas, videos, referencias…)</span></label>
            ${modalDropArea(keyMats, 'Arrastra PDFs, videos u otros materiales de apoyo')}
        </div>
        <button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="saveActivity(${unitIdx},'${keyAtts}','${keyMats}')">Agregar actividad</button>`);
}

function saveActivity(unitIdx, keyAtts, keyMats) {
    const title = document.getElementById('mActTitle').value.trim();
    if (!title) { showToast('El título es obligatorio', 'error'); return; }
    const attachments = getModalAttachments(keyAtts, []);
    const materials   = getModalAttachments(keyMats, []);
    const newAct = {
        id: Date.now(),
        course: { id: currentCourse.id },
        title,
        description: document.getElementById('mActDesc').value,
        dueDate: document.getElementById('mActDate').value,
        attachments,
        materials
    };
    MOCK.activities.push(newAct);
    const units = getUnits(currentCourse.id);
    units[unitIdx].activities = units[unitIdx].activities || [];
    units[unitIdx].activities.push(newAct.id);
    saveUnits(currentCourse.id, units);
    clearModalFiles(keyAtts);
    clearModalFiles(keyMats);
    closeModal();
    renderUnit(unitIdx);
    showToast('Actividad agregada', 'success');
}

function editActivityModal(actId, unitIdx) {
    const a = MOCK.activities.find(x => x.id === actId);
    if (!a) return;
    const keyAtts = 'act-edit-atts-' + actId;
    const keyMats = 'act-edit-mats-' + actId;
    clearModalFiles(keyAtts);
    clearModalFiles(keyMats);
    const existingAtts = Array.isArray(a.attachments) ? a.attachments : [];
    const existingMats = Array.isArray(a.materials)   ? a.materials   : [];
    openModal('Editar Actividad', `
        <div class="form-group">
            <label class="form-label">Título</label>
            <input type="text" class="form-input" id="mActTitle" value="${a.title}">
        </div>
        <div class="form-group">
            <label class="form-label">Descripción e instrucciones</label>
            <textarea class="form-input" id="mActDesc" style="min-height:130px">${a.description || ''}</textarea>
        </div>
        <div class="form-group">
            <label class="form-label">Fecha de entrega</label>
            <input type="date" class="form-input" id="mActDate" value="${a.dueDate || ''}">
        </div>
        <div class="form-group">
            <label class="form-label">Archivos adjuntos para el estudiante</label>
            ${existingAtts.length ? `<div style="margin-bottom:8px">${existingAtts.map((at,i) => `<div class="file-chip" id="exatt2-atts-${i}">
                <svg width="13" height="13" fill="none" stroke="var(--teal)" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span class="file-chip-name">${at.name}</span>
                <button class="file-chip-remove" onclick="removeActExistingAtt(${actId},'attachments',${i})">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>`).join('')}</div>` : ''}
            ${modalDropArea(keyAtts, 'Agregar guías, rúbricas o plantillas')}
        </div>
        <div class="form-group">
            <label class="form-label">Bibliografía y material de apoyo</label>
            ${existingMats.length ? `<div style="margin-bottom:8px">${existingMats.map((at,i) => `<div class="file-chip" id="exatt2-mats-${i}">
                <svg width="13" height="13" fill="none" stroke="var(--gold)" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span class="file-chip-name">${at.name}</span>
                <button class="file-chip-remove" onclick="removeActExistingAtt(${actId},'materials',${i})">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>`).join('')}</div>` : ''}
            ${modalDropArea(keyMats, 'Agregar PDFs, videos u otras referencias')}
        </div>
        <button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="updateActivity(${actId},${unitIdx},'${keyAtts}','${keyMats}')">Guardar cambios</button>`);
}

function removeActExistingAtt(actId, field, idx) {
    const a = MOCK.activities.find(x => x.id === actId);
    if (!a || !Array.isArray(a[field])) return;
    a[field].splice(idx, 1);
    const el = document.getElementById('exatt2-' + field + '-' + idx);
    if (el) el.remove();
}

function updateActivity(actId, unitIdx, keyAtts, keyMats) {
    const a = MOCK.activities.find(x => x.id === actId);
    if (!a) return;
    a.title       = document.getElementById('mActTitle').value.trim() || a.title;
    a.description = document.getElementById('mActDesc').value;
    a.dueDate     = document.getElementById('mActDate').value;
    // Merge new uploads with whatever remains after inline removals
    a.attachments = getModalAttachments(keyAtts, Array.isArray(a.attachments) ? a.attachments : []);
    a.materials   = getModalAttachments(keyMats,  Array.isArray(a.materials)   ? a.materials   : []);
    clearModalFiles(keyAtts);
    clearModalFiles(keyMats);
    closeModal();
    renderUnit(unitIdx);
    showToast('Actividad actualizada', 'success');
}

function removeActivity(actId, unitIdx) {
    const units = getUnits(currentCourse.id);
    units[unitIdx].activities = (units[unitIdx].activities || []).filter(id => id !== actId);
    saveUnits(currentCourse.id, units);
    renderUnit(unitIdx);
    showToast('Actividad eliminada de esta unidad');
}

/* ═══════════════════════════════════════════════════════════════════════════
   EXAM CRUD
═══════════════════════════════════════════════════════════════════════════ */
function addExamModal(unitIdx) {
    openModal('Nueva Evaluación', `
        <div class="form-group"><label class="form-label">Título</label><input type="text" class="form-input" id="mExTitle" placeholder="Ej: Parcial I — Álgebra Lineal"></div>
        <div class="form-group"><label class="form-label">Fecha</label><input type="date" class="form-input" id="mExDate"></div>
        <div class="form-group"><label class="form-label">Descripción</label><textarea class="form-input" id="mExDesc" placeholder="Temas, duración, materiales permitidos..."></textarea></div>
        <button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="saveExam(${unitIdx})">Programar evaluación</button>`);
}

function saveExam(unitIdx) {
    const title = document.getElementById('mExTitle').value.trim();
    if (!title) { showToast('El título es obligatorio', 'error'); return; }
    const newExam = { id: Date.now(), course: { id: currentCourse.id }, title, examDate: document.getElementById('mExDate').value, description: document.getElementById('mExDesc').value };
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
        <div class="form-group"><label class="form-label">Descripción</label><textarea class="form-input" id="mExDesc">${x.description || ''}</textarea></div>
        <button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="updateExam(${examId},${unitIdx})">Guardar cambios</button>`);
}

function updateExam(examId, unitIdx) {
    const x = MOCK.exams.find(e => e.id === examId);
    if (!x) return;
    x.title = document.getElementById('mExTitle').value.trim() || x.title;
    x.examDate = document.getElementById('mExDate').value;
    x.description = document.getElementById('mExDesc').value;
    closeModal(); renderUnit(unitIdx); showToast('Evaluación actualizada', 'success');
}

function removeExam(examId, unitIdx) {
    const units = getUnits(currentCourse.id);
    units[unitIdx].exams = (units[unitIdx].exams || []).filter(id => id !== examId);
    saveUnits(currentCourse.id, units);
    renderUnit(unitIdx); showToast('Evaluación eliminada de esta unidad');
}

/* ═══════════════════════════════════════════════════════════════════════════
   RESOURCE CRUD
═══════════════════════════════════════════════════════════════════════════ */
function addResourceModal(unitIdx) {
    openModal('Agregar Recurso', `
        <div class="form-group"><label class="form-label">Nombre del recurso</label><input type="text" class="form-input" id="mResName" placeholder="Ej: Álgebra Lineal — Howard Anton (Cap. 1-3)"></div>
        <div class="form-group"><label class="form-label">Tipo</label><select class="form-input" id="mResType"><option value="pdf">PDF</option><option value="doc">Documento</option><option value="link">Enlace web</option><option value="video">Video</option><option value="img">Imagen</option></select></div>
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

function saveCourseEdit() {
    currentCourse.name = document.getElementById('mCourseName').value.trim() || currentCourse.name;
    currentCourse.description = document.getElementById('mCourseDesc').value;
    document.getElementById('breadcrumbCourseName').textContent = currentCourse.name;
    document.getElementById('cvCourseName').textContent = currentCourse.name;
    closeModal(); showToast('Curso actualizado', 'success');
}

/* ═══════════════════════════════════════════════════════════════════════════
   GRADE HELPERS
═══════════════════════════════════════════════════════════════════════════ */
function createGrade(courseId) {
    const sId = parseInt(document.getElementById('mStudent').value);
    const val = parseFloat(document.getElementById('mGrade').value);
    const desc = document.getElementById('mGradeDesc').value;
    if (isNaN(val) || val < 0 || val > 10) { showToast('Calificación inválida', 'error'); return; }
    const student = MOCK.students.find(s => s.id === sId);
    MOCK.grades.push({ id: Date.now(), student: { id: sId, studentCode: student ? student.studentCode : '—', user: { name: student ? student.user.name : '—' } }, course: { id: courseId }, grade: val, description: desc });
    closeModal(); renderGrades(courseId); showToast('Calificación registrada', 'success');
}

function createSchedule() {
    const cId = parseInt(document.getElementById('schCourse').value);
    const day = document.getElementById('schDay').value;
    const start = document.getElementById('schStart').value;
    const end = document.getElementById('schEnd').value;
    const course = MOCK.courses.find(c => c.id === cId) || {};
    MOCK.schedules.push({ id: Date.now(), course: { id: cId, name: course.name }, day, startTime: start, endTime: end });
    closeModal(); loadHorarios(); showToast('Horario agregado', 'success');
}

/* ═══════════════════════════════════════════════════════════════════════════
   INIT & EVENT LISTENERS
═══════════════════════════════════════════════════════════════════════════ */
async function init() {
    authHeader = getAuth() || btoa('docente@educat.edu.co:demo1234');
    setDate();
    const usersData = await tryFetch('/api/users');
    const email = getEmail() || MOCK.user.email;
    currentUser = (usersData && usersData.length) ? (usersData.find(u => u.email === email) || MOCK.user) : MOCK.user;
    const teachersData = await tryFetch('/api/teachers');
    currentTeacher = (teachersData && teachersData.length) ? (teachersData.find(t => t.user && t.user.id === currentUser.id) || MOCK.teacher) : MOCK.teacher;
    document.getElementById('sidebarUserName').textContent = currentUser.name;
    document.getElementById('sidebarSpecialization').textContent = currentTeacher.specialization || 'Docente';
    await loadOverview();
}

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

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalBackdrop').addEventListener('click', e => { if (e.target === document.getElementById('modalBackdrop')) closeModal(); });

document.getElementById('cvBackBtn').addEventListener('click', () => {
    closeCourseView();
    navigateTo('cursos');
});

document.getElementById('breadcrumbBack').addEventListener('click', () => {
    if (document.getElementById('submissionsView').classList.contains('show')) {
        showView('course');
        document.getElementById('topbarBreadcrumb').style.display = 'flex';
        document.getElementById('breadcrumbActivitySep').style.display = 'none';
        document.getElementById('breadcrumbActivityName').style.display = 'none';
        document.getElementById('breadcrumbCourseName').textContent = currentCourse ? currentCourse.name : '';
        document.getElementById('pageTitle').style.display = 'none';
        document.getElementById('pageSubtitle').style.display = 'none';
        document.getElementById('courseTopbarActions').style.display = 'flex';
    } else {
        closeCourseView();
        navigateTo('cursos');
    }
});

document.getElementById('submissionsBackBtn').addEventListener('click', () => {
    if (currentCourse) {
        showView('course');
        document.getElementById('topbarBreadcrumb').style.display = 'flex';
        document.getElementById('breadcrumbActivitySep').style.display = 'none';
        document.getElementById('breadcrumbActivityName').style.display = 'none';
        document.getElementById('breadcrumbCourseName').textContent = currentCourse.name;
        document.getElementById('pageTitle').style.display = 'none';
        document.getElementById('pageSubtitle').style.display = 'none';
        document.getElementById('courseTopbarActions').style.display = 'flex';
    } else {
        navigateTo('entregas');
    }
});

document.getElementById('btnEditCourse').addEventListener('click', () => {
    if (!currentCourse) return;
    openModal('Editar Curso', `
        <div class="form-group"><label class="form-label">Nombre del curso</label><input type="text" class="form-input" id="mCourseName" value="${currentCourse.name || ''}"></div>
        <div class="form-group"><label class="form-label">Descripción</label><textarea class="form-input" id="mCourseDesc">${currentCourse.description || ''}</textarea></div>
        <button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="saveCourseEdit()">Guardar cambios</button>`);
});

document.getElementById('btnAddUnit').addEventListener('click', () => { if (currentCourse) addUnitModal(); });

document.getElementById('btnCourseSubmissions').addEventListener('click', () => {
    if (!currentCourse) return;
    const acts = MOCK.activities.filter(a => a.course && a.course.id === currentCourse.id);
    if (!acts.length) { showToast('Este curso no tiene actividades registradas', 'error'); return; }
    openActivitySubmissions(acts[0].id);
});

document.getElementById('btnNewGrade').addEventListener('click', () => {
    const courseId = parseInt(document.getElementById('gradeCourseFilter').value);
    if (!courseId) { showToast('Selecciona un curso primero', 'error'); return; }
    openModal('Nueva Calificación', `
        <div class="form-group"><label class="form-label">Estudiante</label><select class="form-input" id="mStudent">${MOCK.students.map(s => `<option value="${s.id}">${s.user.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Calificación (0-10)</label><input type="number" class="form-input" id="mGrade" min="0" max="10" step="0.1" placeholder="Ej: 8.5"></div>
        <div class="form-group"><label class="form-label">Descripción</label><textarea class="form-input" id="mGradeDesc" placeholder="Observaciones..."></textarea></div>
        <button class="btn btn-teal" style="width:100%" onclick="createGrade(${courseId})">Registrar calificación</button>`);
});

document.getElementById('btnExportGrades').addEventListener('click', exportGrades);

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

document.getElementById('btnLoadSubmissions').addEventListener('click', renderEntregasList);
document.getElementById('submissionsFilter').addEventListener('change', renderSubmissionsList);

document.getElementById('btnGradeAll').addEventListener('click', () => {
    openModal('Calificar todos los pendientes', `
        <p style="font-size:13.5px;color:var(--text-body);margin-bottom:16px;line-height:1.65">Asigna la misma nota a todos los estudiantes con entregas pendientes en esta actividad.</p>
        <div class="form-group"><label class="form-label">Calificación (0 – 10)</label><input type="number" class="form-input" id="mMassGrade" min="0" max="10" step="0.1" placeholder="Ej: 8.0"></div>
        <div class="form-group"><label class="form-label">Retroalimentación (opcional)</label><textarea class="form-input" id="mMassFb" placeholder="Retroalimentación general..."></textarea></div>
        <button class="btn btn-teal" style="width:100%" onclick="applyMassGrade()">Aplicar a todos los pendientes</button>`);
});

document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);

document.getElementById('btnBackToList').addEventListener('click', () => {
    document.getElementById('submissionDetailView').style.display = 'none';
    renderEntregasList();
});

init();