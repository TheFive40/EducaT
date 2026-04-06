const API = 'http://localhost:8080';
let authHeader = '', currentUser = null, currentStudent = null;
let enrollments = [], grades = [], attendance = [], certificates = [], schedules = [];
let currentCourse = null, currentUnitIdx = 0;
let selectedFiles = [];
const actSubmissionFiles = {};

const MOCK = {
    user: { id: 1, name: 'María José Rodríguez', email: 'maria@educat.edu.co', role: { id: 3, name: 'ESTUDIANTE' }, status: true },
    student: { id: 1, studentCode: 'EST-2024-101' },
    courses: [
        { id: 1, name: 'Matemáticas Avanzadas', description: 'Álgebra lineal, cálculo diferencial e integral con aplicaciones prácticas.', teacher: { id: 1, specialization: 'Matemáticas', user: { id: 10, name: 'Dr. Carlos Martínez Lozano' } } },
        { id: 2, name: 'Literatura y Expresión', description: 'Análisis literario hispanoamericano y producción textual de diferentes géneros.', teacher: { id: 2, specialization: 'Letras Hispánicas', user: { id: 11, name: 'Dra. Ana Lucía Pérez Mora' } } },
        { id: 3, name: 'Ciencias Naturales', description: 'Fenómenos físicos y químicos con metodología científica aplicada.', teacher: { id: 3, specialization: 'Biología y Química', user: { id: 12, name: 'Mg. Roberto Silva Arango' } } },
    ],
    enrollments: [
        { id: 1, enrollmentDate: '2025-02-01T08:00:00' },
        { id: 2, enrollmentDate: '2025-02-01T08:00:00' },
        { id: 3, enrollmentDate: '2025-02-01T08:00:00' },
    ],
    grades: [
        { id: 1, course: { id: 1, name: 'Matemáticas Avanzadas' }, grade: 8.5, description: 'Excelente desempeño en álgebra lineal' },
        { id: 2, course: { id: 2, name: 'Literatura y Expresión' }, grade: 7.2, description: 'Buen análisis crítico y argumentación' },
        { id: 3, course: { id: 3, name: 'Ciencias Naturales' }, grade: 9.0, description: 'Sobresaliente en práctica de laboratorio' },
    ],
    attendance: [
        { id: 1, course: { id: 1, name: 'Matemáticas Avanzadas' }, date: '2025-03-10', present: true },
        { id: 2, course: { id: 1, name: 'Matemáticas Avanzadas' }, date: '2025-03-17', present: false },
        { id: 3, course: { id: 2, name: 'Literatura y Expresión' }, date: '2025-03-11', present: true },
        { id: 4, course: { id: 2, name: 'Literatura y Expresión' }, date: '2025-03-18', present: true },
        { id: 5, course: { id: 3, name: 'Ciencias Naturales' }, date: '2025-03-14', present: true },
    ],
    certificates: [
        { id: 1, name: 'Certificado de Excelencia Académica 2024', filePath: '#' },
    ],
    schedules: [
        { id: 1, course: { id: 1, name: 'Matemáticas Avanzadas' }, day: 'Lunes', startTime: '07:00', endTime: '09:00' },
        { id: 2, course: { id: 1, name: 'Matemáticas Avanzadas' }, day: 'Miércoles', startTime: '07:00', endTime: '09:00' },
        { id: 3, course: { id: 2, name: 'Literatura y Expresión' }, day: 'Martes', startTime: '09:00', endTime: '11:00' },
        { id: 4, course: { id: 2, name: 'Literatura y Expresión' }, day: 'Jueves', startTime: '09:00', endTime: '11:00' },
        { id: 5, course: { id: 3, name: 'Ciencias Naturales' }, day: 'Viernes', startTime: '11:00', endTime: '13:00' },
    ],
    activities: [
        {
            id: 1, course: { id: 1 },
            title: 'Taller: Matrices y Determinantes',
            description: 'Resolver los ejercicios de matrices 3×3 del capítulo 2. Presenta el procedimiento completo con cada operación detallada paso a paso.\n\nCriterios de evaluación:\n• Procedimiento correcto: 50%\n• Resultados: 30%\n• Presentación: 20%\n\nFormato de entrega: PDF con nombre Apellido_Taller1.pdf',
            dueDate: '2025-04-15',
            attachments: [{ name: 'Guía de Ejercicios Cap.2.pdf', type: 'pdf', url: '#' }]
        },
        {
            id: 2, course: { id: 1 },
            title: 'Taller: Derivadas Implícitas',
            description: 'Aplicación de reglas de derivación en funciones implícitas y paramétricas. Incluye resolución de problemas de optimización con justificación completa.\n\nEntrega en formato PDF con todos los pasos desarrollados.',
            dueDate: '2025-04-22',
            attachments: []
        },
        {
            id: 3, course: { id: 2 },
            title: 'Ensayo Literario',
            description: 'Análisis temático y estilístico de "Cien años de soledad". Mínimo 3 páginas, máximo 5.\n\nEstructura requerida:\n• Introducción con tesis clara\n• Análisis del realismo mágico\n• Análisis de personajes principales\n• Conclusión\n\nFormato: APA 7ª edición. Entrega como PDF.',
            dueDate: '2025-04-18',
            attachments: [{ name: 'Rúbrica de evaluación.pdf', type: 'pdf', url: '#' }]
        },
        {
            id: 4, course: { id: 3 },
            title: 'Informe de Laboratorio',
            description: 'Informe completo del experimento de reacciones ácido-base. Debe incluir: objetivo, marco teórico, materiales, procedimiento, tabla de datos, análisis de resultados y conclusiones.\n\nFormato: impreso y digital (PDF).',
            dueDate: '2025-04-20',
            attachments: []
        },
    ],
    exams: [
        { id: 1, course: { id: 1 }, title: 'Parcial I — Álgebra Lineal', examDate: '2025-04-20', description: 'Temas: vectores, matrices, sistemas de ecuaciones y transformaciones lineales. Duración: 2 horas. Material permitido: calculadora científica.' },
        { id: 2, course: { id: 2 }, title: 'Evaluación de Comprensión Lectora', examDate: '2025-04-25', description: 'Análisis de fragmentos literarios y preguntas de comprensión e interpretación.' },
        { id: 3, course: { id: 3 }, title: 'Quiz: Tabla Periódica', examDate: '2025-04-17', description: 'Elementos, grupos, períodos, propiedades periódicas y tipos de enlace. Duración: 30 minutos.' },
    ],
};

const DEFAULT_UNITS = {
    1: [
        {
            id: 'u1-1',
            name: 'Unidad 1: Álgebra Lineal',
            welcome: 'Bienvenidos a la primera unidad de Matemáticas Avanzadas. Exploraremos los conceptos fundamentales del álgebra lineal que son la base para muchas ramas de la ingeniería y las ciencias.',
            description: 'Vectores en espacios n-dimensionales, matrices y operaciones, sistemas de ecuaciones lineales y resolución mediante eliminación gaussiana, transformaciones lineales y sus propiedades.',
            announcements: [
                {
                    id: 'a1', title: 'Entrega del Taller de Matrices',
                    content: 'Recuerden que el taller de matrices debe entregarse antes del viernes a las 11:59 p.m.\n\nFormato de entrega: PDF con nombre Apellido_Taller1.pdf. Subir a la plataforma o enviar al correo institucional si hay inconvenientes técnicos.\n\nLa calificación se publicará dentro de 5 días hábiles. Cualquier duda pueden escribirme o acercarse en horas de atención.',
                    date: '2025-04-01', attachments: []
                },
                {
                    id: 'a2', title: 'Quiz sorpresa — próxima clase',
                    content: 'Habrá un quiz corto de 10 minutos al inicio de la próxima clase sobre operaciones matriciales.\n\nTemas a repasar:\n• Suma y resta de matrices\n• Multiplicación de matrices\n• Transpuesta e inversa\n• Determinante 2×2 y 3×3\n\nEl quiz cuenta como nota de participación.',
                    date: '2025-04-03', attachments: []
                },
            ],
            activities: [1], exams: [1],
            resources: [
                { name: 'Álgebra Lineal — Howard Anton (Cap. 1-3)', type: 'pdf', url: '#' },
                { name: 'Video: Introducción a Matrices y Vectores', type: 'video', url: '#' },
                { name: 'Guía de Ejercicios Resueltos', type: 'doc', url: '#' },
            ]
        },
        {
            id: 'u1-2',
            name: 'Unidad 2: Cálculo Diferencial',
            welcome: 'Continuamos con el cálculo diferencial, una de las herramientas más poderosas de las matemáticas modernas y esencial para el análisis del cambio.',
            description: 'Límites y su definición formal, continuidad de funciones, la derivada y sus interpretaciones geométrica y física, reglas de derivación y aplicaciones en optimización.',
            announcements: [
                {
                    id: 'a3', title: 'Bibliografía recomendada para esta unidad',
                    content: 'Revisar el capítulo 2 de Stewart "Cálculo" antes de la próxima clase. Está disponible en la biblioteca digital institucional con acceso desde la cuenta de correo institucional.\n\nMaterial complementario recomendado:\n• Khan Academy — sección de Límites y Derivadas (gratuito en línea)\n• Paul\'s Online Math Notes — excelente referencia de consulta rápida\n\nSi tienen dificultades para acceder a algún recurso, escríbanme.',
                    date: '2025-04-05', attachments: []
                },
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
            id: 'u2-1',
            name: 'Unidad 1: Narrativa Hispanoamericana',
            welcome: 'Bienvenidos a Literatura y Expresión. Nos adentraremos en el fascinante universo de la narrativa latinoamericana del siglo XX y sus representantes más destacados.',
            description: 'Técnicas narrativas del realismo mágico, el contexto del Boom latinoamericano, análisis de la obra de García Márquez, Cortázar y otros autores fundamentales.',
            announcements: [
                {
                    id: 'a4', title: 'Traer novela a la próxima clase',
                    content: 'Por favor traer el libro "Cien años de soledad" a la próxima clase. Trabajaremos con el texto directamente durante la sesión.\n\nSi no tienen el libro físico, pueden tener una versión digital accesible en su dispositivo móvil o tablet. Se trabajará con fragmentos específicos, así que necesitan poder consultar la obra durante la clase.\n\nRecomendación: leer hasta el capítulo 5 antes de la sesión.',
                    date: '2025-04-02', attachments: []
                },
                {
                    id: 'a5', title: 'Formato y criterios del ensayo',
                    content: 'Aclaraciones sobre el ensayo literario:\n\n• Extensión: mínimo 3 páginas, máximo 5 (sin contar portada ni bibliografía)\n• Fuente: Times New Roman 12pt, interlineado 1.5\n• Formato de citas: APA 7ª edición\n• Mínimo 3 fuentes bibliográficas (además de la novela)\n\nCriterios de evaluación:\n• Claridad de la tesis: 25%\n• Análisis literario: 40%\n• Uso de evidencias textuales: 20%\n• Redacción y formato: 15%',
                    date: '2025-04-06', attachments: [{ name: 'Rúbrica_Ensayo_Literatura.pdf', type: 'pdf', url: '#' }]
                },
            ],
            activities: [3], exams: [2],
            resources: [
                { name: 'García Márquez — Cien años de soledad', type: 'pdf', url: '#' },
                { name: 'Guía de Análisis Literario', type: 'doc', url: '#' },
                { name: 'El Boom Latinoamericano — contexto histórico', type: 'link', url: '#' },
            ]
        },
    ],
    3: [
        {
            id: 'u3-1',
            name: 'Unidad 1: Química General',
            welcome: 'Bienvenidos a Ciencias Naturales. Esta unidad establece los fundamentos de la química que necesitarán a lo largo del curso y que explican la mayoría de los fenómenos naturales cotidianos.',
            description: 'Estructura atómica y tabla periódica, tipos de enlace químico, reacciones y balanceo, estequiometría básica, ácidos y bases con aplicaciones de laboratorio.',
            announcements: [
                {
                    id: 'a6', title: 'Práctica de laboratorio — elementos obligatorios',
                    content: 'La próxima práctica de laboratorio es de asistencia obligatoria. Deben traer sin excepción:\n\n• Bata blanca de manga larga (no se permitirá el ingreso sin ella)\n• Guantes de látex (talla según su mano)\n• Gafas protectoras\n• Cuaderno de laboratorio o libreta para registro de datos\n\nEl informe se entrega en formato impreso Y digital (PDF) dentro de los 5 días hábiles siguientes a la práctica. La plantilla del informe está adjunta en este anuncio.',
                    date: '2025-04-04', attachments: [{ name: 'Plantilla_Informe_Laboratorio.docx', type: 'doc', url: '#' }]
                },
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

async function apiFetch(url, options = {}) {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 3000);
    const headers = { 'Authorization': 'Basic ' + authHeader, 'Content-Type': 'application/json', ...options.headers };
    try {
        const res = await fetch(API + url, { ...options, headers, signal: controller.signal });
        clearTimeout(tid);
        return res;
    } catch (e) {
        clearTimeout(tid);
        return null;
    }
}

async function tryFetch(url) {
    const res = await apiFetch(url);
    if (res && res.ok) { try { return await res.json(); } catch (e) {} }
    return null;
}

function showToast(msg, type = '') {
    const t = document.createElement('div');
    t.className = 'toast' + (type ? ' ' + type + '-toast' : '');
    t.textContent = msg;
    document.getElementById('toastContainer').appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

function closeModal() { document.getElementById('modalBackdrop').classList.remove('show'); }

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalBackdrop').addEventListener('click', e => {
    if (e.target === document.getElementById('modalBackdrop')) closeModal();
});

function setDate() {
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('es-CO', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

function getUnits(courseId) {
    const s = localStorage.getItem('educat_units_' + courseId);
    if (s) { try { return JSON.parse(s); } catch (e) {} }
    const def = DEFAULT_UNITS[courseId];
    return def ? JSON.parse(JSON.stringify(def)) : [];
}

function getSubmission(actId) {
    const sid = currentStudent ? currentStudent.id : 1;
    try { return JSON.parse(localStorage.getItem('educat_sub_' + sid + '_' + actId)); } catch (e) { return null; }
}

function saveSubmission(actId, data) {
    const sid = currentStudent ? currentStudent.id : 1;
    localStorage.setItem('educat_sub_' + sid + '_' + actId, JSON.stringify(data));
}

function toggleCard(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('open');
}

function navigateTo(section) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
    const btn = document.querySelector('[data-section="' + section + '"]');
    if (btn) btn.classList.add('active');
    const panel = document.getElementById('panel-' + section);
    if (panel) panel.classList.add('active');
    document.getElementById('courseView').classList.remove('show');
    document.getElementById('mainContent').style.display = '';
    const titles = {
        overview: ['Resumen', 'Vista general de tu actividad académica'],
        cursos: ['Cursos Matriculados', 'Accede al contenido de tus cursos'],
        clases: ['Clases Programadas', 'Horario semanal de tus clases'],
        ausencias: ['Reportar Ausencia', 'Notifica y justifica tus ausencias'],
        'area-personal': ['Área Personal', 'Tu información académica consolidada'],
        actualizacion: ['Actualización de Datos', 'Mantén tu información al día']
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
    else if (section === 'clases') loadClases();
    else if (section === 'ausencias') loadAusencias();
    else if (section === 'area-personal') loadAreaPersonal();
    else if (section === 'actualizacion') loadActualizacion();
}

function renderOverviewContent() {
    document.getElementById('statCursos').textContent = enrollments.length;
    const avg = grades.length ? (grades.reduce((s, g) => s + parseFloat(g.grade || 0), 0) / grades.length).toFixed(1) : '—';
    document.getElementById('statPromedio').textContent = avg;
    const attTotal = attendance.length;
    const pct = attTotal ? Math.round((attendance.filter(a => a.present).length / attTotal) * 100) + '%' : '—';
    document.getElementById('statAsistencia').textContent = pct;
    document.getElementById('statCertificados').textContent = certificates.length;

    document.getElementById('overviewCursos').innerHTML = enrollments.slice(0, 4).map(e => {
        const c = e.course || {};
        const teacher = c.teacher && c.teacher.user ? c.teacher.user.name : '—';
        return `<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(11,31,58,0.05);cursor:pointer" onclick="openCourseView(${c.id || 0})">
          <div style="width:9px;height:9px;border-radius:50%;background:var(--gold);flex-shrink:0"></div>
          <div style="flex:1"><div style="font-weight:600;font-size:13.5px">${c.name || 'Curso'}</div><div style="font-size:11.5px;color:var(--text-muted)">${teacher}</div></div>
          <svg width="14" height="14" fill="none" stroke="var(--text-muted)" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>`;
    }).join('') || '<div style="color:var(--text-muted);font-size:13px">Sin cursos matriculados.</div>';

    document.getElementById('overviewGrades').innerHTML = grades.map(g => {
        const val = parseFloat(g.grade || 0);
        const cls = val >= 7 ? 'high' : val >= 5 ? 'mid' : 'low';
        const color = cls === 'high' ? 'var(--success)' : cls === 'mid' ? 'var(--gold)' : 'var(--error)';
        return `<div style="margin-bottom:13px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:13px;font-weight:500">${g.course ? g.course.name : '—'}</span>
            <span style="font-size:14px;font-weight:700;color:${color}">${val.toFixed(1)}</span>
          </div>
          <div class="grade-bar"><div class="grade-fill ${cls}" style="width:${(val / 10) * 100}%"></div></div>
        </div>`;
    }).join('') || '<div style="color:var(--text-muted);font-size:13px">Sin calificaciones registradas.</div>';
}

async function loadOverview() {
    enrollments = MOCK.enrollments.map((e, i) => ({ ...e, course: MOCK.courses[i] }));
    grades = MOCK.grades;
    attendance = MOCK.attendance;
    certificates = MOCK.certificates;
    schedules = MOCK.schedules;
    renderOverviewContent();

    const sid = currentStudent ? currentStudent.id : 0;
    Promise.all([
        tryFetch('/api/enrollments/student/' + sid),
        tryFetch('/api/grades/student/' + sid),
        tryFetch('/api/attendance/student/' + sid),
        tryFetch('/api/certificates/student/' + sid),
        tryFetch('/api/schedules/student/' + sid),
    ]).then(([enrData, grData, attData, certData, schData]) => {
        let updated = false;
        if (enrData && enrData.length) { enrollments = enrData; updated = true; }
        if (grData && grData.length) { grades = grData; updated = true; }
        if (attData && attData.length) { attendance = attData; updated = true; }
        if (certData && certData.length) { certificates = certData; updated = true; }
        if (schData && schData.length) { schedules = schData; updated = true; }
        if (updated) renderOverviewContent();
    });
}

async function loadCursos() {
    if (!enrollments.length) enrollments = MOCK.enrollments.map((e, i) => ({ ...e, course: MOCK.courses[i] }));
    const container = document.getElementById('cursosContainer');
    container.innerHTML = '<div class="grid-3">' + enrollments.map(e => {
        const c = e.course || {};
        const teacher = c.teacher && c.teacher.user ? c.teacher.user.name : '—';
        const date = e.enrollmentDate ? new Date(e.enrollmentDate).toLocaleDateString('es-CO') : '—';
        return `<div class="course-card" onclick="openCourseView(${c.id || 0})">
          <div class="course-card-top">
            <div class="course-card-name">${c.name || 'Curso'}</div>
            <div class="course-card-teacher">${teacher}</div>
          </div>
          <div class="course-card-body">
            <div class="course-card-desc">${c.description ? c.description.slice(0, 90) + (c.description.length > 90 ? '...' : '') : 'Sin descripción'}</div>
            <div class="course-card-meta"><span><svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Desde ${date}</span></div>
            <div class="course-card-actions">
              <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openCourseView(${c.id || 0})">
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
    if (!schedules.length) schedules = MOCK.schedules;
    if (!schedules.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Sin clases programadas</div></div>';
        return;
    }
    const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const sorted = [...schedules].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
    container.innerHTML = '<table><thead><tr><th>Día</th><th>Curso</th><th>Hora Inicio</th><th>Hora Fin</th><th>Docente</th></tr></thead><tbody>' +
        sorted.map(s => {
            const teacher = s.course && s.course.teacher && s.course.teacher.user ? s.course.teacher.user.name : '—';
            return `<tr>
              <td><span class="badge badge-navy">${s.day}</span></td>
              <td><strong>${s.course ? s.course.name : '—'}</strong></td>
              <td>${s.startTime || '—'}</td>
              <td>${s.endTime || '—'}</td>
              <td>${teacher}</td>
            </tr>`;
        }).join('') + '</tbody></table>';
}

function loadAusencias() {
    const select = document.getElementById('ausCurso');
    const courses = enrollments.length ? enrollments.map(e => e.course).filter(Boolean) : MOCK.courses;
    select.innerHTML = '<option value="">Selecciona el curso</option>' + courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('ausFecha').value = new Date().toISOString().split('T')[0];
    const sid = currentStudent ? currentStudent.id : 1;
    const historial = JSON.parse(localStorage.getItem('educat_ausencias_' + sid) || '[]');
    const hist = document.getElementById('ausenciasHistorial');
    if (!historial.length) {
        hist.innerHTML = '<div class="empty-state" style="padding:24px 0"><div class="empty-state-title">Sin reportes previos</div><div class="empty-state-text">Aún no has reportado ninguna ausencia.</div></div>';
        return;
    }
    hist.innerHTML = '<table><thead><tr><th>Fecha</th><th>Curso</th><th>Motivo</th><th>Documentos</th><th>Estado</th></tr></thead><tbody>' +
        historial.slice().reverse().map(a => `<tr>
          <td>${a.fecha}</td>
          <td>${a.curso}</td>
          <td style="max-width:160px;font-size:12.5px">${a.motivo}</td>
          <td>${a.archivos ? '<span class="badge badge-navy">' + a.archivos + ' archivo(s)</span>' : '—'}</td>
          <td><span class="badge badge-gold">Pendiente</span></td>
        </tr>`).join('') + '</tbody></table>';
}

function loadAreaPersonal() {
    const grds = grades.length ? grades : MOCK.grades;
    const schds = schedules.length ? schedules : MOCK.schedules;
    const certs = certificates.length ? certificates : MOCK.certificates;
    const att = attendance.length ? attendance : MOCK.attendance;
    const enr = enrollments.length ? enrollments : MOCK.enrollments.map((e, i) => ({ ...e, course: MOCK.courses[i] }));
    const avg = grds.length ? (grds.reduce((s, g) => s + parseFloat(g.grade || 0), 0) / grds.length).toFixed(2) : '—';
    const pct = att.length ? Math.round((att.filter(a => a.present).length / att.length) * 100) : 0;
    const grid = document.getElementById('personalGrid');
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
        ${grds.map(g => {
        const v = parseFloat(g.grade || 0);
        const cl = v >= 7 ? 'high' : v >= 5 ? 'mid' : 'low';
        const color = cl === 'high' ? 'var(--success)' : cl === 'mid' ? 'var(--gold)' : 'var(--error)';
        return `<div style="margin-bottom:10px">
              <div style="display:flex;justify-content:space-between;margin-bottom:3px">
                <span style="font-size:12.5px">${g.course ? g.course.name : '—'}</span>
                <strong style="font-size:13px;color:${color}">${v.toFixed(1)}</strong>
              </div>
              <div class="grade-bar"><div class="grade-fill ${cl}" style="width:${(v / 10) * 100}%"></div></div>
            </div>`;
    }).join('')}
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
          <div style="text-align:center;flex:1"><div style="font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:700;color:var(--success)">${att.filter(a => a.present).length}</div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Presentes</div></div>
          <div style="text-align:center;flex:1"><div style="font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:700;color:var(--error)">${att.filter(a => !a.present).length}</div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Ausencias</div></div>
        </div>
        ${att.slice(-5).reverse().map(a => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(11,31,58,0.04);font-size:12.5px">
          <span style="color:var(--text-muted)">${a.date ? new Date(a.date + 'T00:00:00').toLocaleDateString('es-CO') : '—'}</span>
          <span class="badge ${a.present ? 'badge-success' : 'badge-error'}">${a.present ? 'Presente' : 'Ausente'}</span>
        </div>`).join('')}
      </div>
    </div>

    <div class="personal-card">
      <div class="personal-card-header">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span class="personal-card-title">Horario Académico</span>
      </div>
      <div class="personal-card-body">
        <div class="schedule-mini">${schds.map(s => `<div class="schedule-mini-item">
          <span class="schedule-mini-day">${s.day}</span>
          <span class="schedule-mini-course">${s.course ? s.course.name : '—'}</span>
          <span class="schedule-mini-time">${s.startTime}–${s.endTime}</span>
        </div>`).join('')}</div>
      </div>
    </div>

    <div class="personal-card">
      <div class="personal-card-header">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
        <span class="personal-card-title">Certificados</span>
      </div>
      <div class="personal-card-body">${certs.length ? certs.map(c => `
        <div class="cert-card">
          <div class="cert-icon"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg></div>
          <div class="cert-info">
            <div class="cert-name">${c.name}</div>
            ${c.filePath && c.filePath !== '#' ? `<a href="${c.filePath}" class="cert-sub" style="color:var(--teal)">Descargar</a>` : '<span class="cert-sub">Disponible en secretaría</span>'}
          </div>
        </div>`).join('') : '<div class="empty-state" style="padding:24px 0"><div class="empty-state-title">Sin certificados</div></div>'}
      </div>
    </div>

    <div class="personal-card">
      <div class="personal-card-header">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
        <span class="personal-card-title">Información de Matrícula</span>
      </div>
      <div class="personal-card-body">
        <div style="padding:12px;background:var(--cream);border-radius:8px;margin-bottom:14px">
          <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Código de Estudiante</div>
          <div style="font-size:18px;font-family:'Cormorant Garamond',serif;font-weight:700">${currentStudent ? currentStudent.studentCode : MOCK.student.studentCode}</div>
        </div>
        ${enr.map(e => {
        const c = e.course || {};
        const d = e.enrollmentDate ? new Date(e.enrollmentDate).toLocaleDateString('es-CO') : '—';
        return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(11,31,58,0.05);font-size:13px">
              <span style="font-weight:500">${c.name || 'Curso'}</span>
              <span style="color:var(--text-muted);font-size:12px">${d}</span>
            </div>`;
    }).join('')}
      </div>
    </div>

    <div class="personal-card">
      <div class="personal-card-header">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        <span class="personal-card-title">Evaluación Docente</span>
      </div>
      <div class="personal-card-body">
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:14px">Tu opinión es confidencial y ayuda a mejorar la calidad educativa.</div>
        ${enr.slice(0, 3).map((e, i) => {
        const c = e.course || {};
        const t = c.teacher && c.teacher.user ? c.teacher.user.name : 'Docente';
        return `<div style="padding:10px;background:var(--cream);border-radius:8px;margin-bottom:8px">
              <div style="font-weight:600;font-size:13px;margin-bottom:8px">${c.name || 'Curso'} — ${t}</div>
              <div style="display:flex;gap:4px" id="stars-${i}">
                ${[1, 2, 3, 4, 5].map(n => `<button onclick="setRating(${i},${n})" style="background:none;border:none;cursor:pointer;padding:2px">
                  <svg width="20" height="20" fill="none" stroke="var(--gold)" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </button>`).join('')}
              </div>
            </div>`;
    }).join('')}
        <button class="btn btn-gold btn-sm" style="margin-top:4px" onclick="submitEvals()">Enviar evaluaciones</button>
      </div>
    </div>`;
}

function setRating(idx, val) {
    const cont = document.getElementById('stars-' + idx);
    if (!cont) return;
    cont.querySelectorAll('svg').forEach((svg, i) => svg.setAttribute('fill', i < val ? 'var(--gold)' : 'none'));
    cont.dataset.rating = val;
}

function submitEvals() { showToast('Evaluaciones enviadas. ¡Gracias por tu opinión!', 'success'); }

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
    if (!name || !email) {
        alertEl.textContent = 'Nombre y correo son obligatorios.';
        alertEl.style.display = 'flex';
        alertEl.className = 'alert alert-error';
        return;
    }
    if (password && password !== confirm) {
        alertEl.textContent = 'Las contraseñas no coinciden.';
        alertEl.style.display = 'flex';
        alertEl.className = 'alert alert-error';
        return;
    }
    const u = currentUser || MOCK.user;
    const body = { name, email, roleId: u.role ? u.role.id : 3, status: u.status || true };
    if (password) body.password = password;
    try {
        const res = await apiFetch('/api/users/' + u.id, { method: 'PUT', body: JSON.stringify(body) });
        if (res && res.ok) { currentUser = await res.json(); document.getElementById('sidebarUserName').textContent = currentUser.name; }
    } catch (e) {}
    alertEl.textContent = 'Datos actualizados correctamente.';
    alertEl.style.display = 'flex';
    alertEl.className = 'alert alert-success';
    showToast('Perfil actualizado', 'success');
}

function openCourseView(courseId) {
    const allCourses = enrollments.map(e => e.course).filter(Boolean);
    currentCourse = allCourses.find(c => c.id === courseId) || MOCK.courses.find(c => c.id === courseId);
    if (!currentCourse) return;
    currentUnitIdx = 0;
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('courseView').classList.add('show');
    document.getElementById('pageTitle').style.display = 'none';
    document.getElementById('pageSubtitle').style.display = 'none';
    document.getElementById('topbarBreadcrumb').style.display = 'flex';
    document.getElementById('breadcrumbCourseName').textContent = currentCourse.name || 'Curso';
    renderUnitTabs();
    renderUnit(0);
}

function closeCourseView() {
    document.getElementById('courseView').classList.remove('show');
    document.getElementById('mainContent').style.display = '';
    document.getElementById('topbarBreadcrumb').style.display = 'none';
    document.getElementById('pageTitle').style.display = '';
    document.getElementById('pageSubtitle').style.display = '';
}

document.getElementById('breadcrumbBack').addEventListener('click', closeCourseView);

function renderUnitTabs() {
    const units = getUnits(currentCourse.id);
    const bar = document.getElementById('unitTabsBar');
    if (!units.length) {
        bar.innerHTML = '<div style="padding:0 20px;font-size:13px;color:var(--text-muted);display:flex;align-items:center;min-height:52px">Sin unidades registradas para este curso.</div>';
        return;
    }
    bar.innerHTML = units.map((u, i) => `
    <button class="unit-tab ${i === 0 ? 'active' : ''}" onclick="renderUnit(${i})">
      <span class="unit-tab-num">${i + 1}</span>
      ${u.name}
    </button>`).join('');
}

/* ─── Submission section ─────────────────────────────────────────────────── */
function renderSubmissionSection(actId, sub) {
    const iconFile = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    const iconSend = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
    const iconCheck = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`;
    const iconStar = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    const iconEdit = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/></svg>`;
    const iconTrash = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>`;
    const iconRefresh = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>`;
    const iconMsg = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`;
    const iconChevron = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>`;

    /* Helper: collapsible comment block */
    function commentToggle(comment, uid) {
        if (!comment) return '';
        return `<div class="sub-comment-toggle" id="sct-wrap-${uid}">
          <button class="sub-comment-toggle-btn" onclick="toggleSubComment('${uid}')">
            <span style="display:flex;align-items:center;gap:6px">${iconMsg} Comentario del estudiante <span class="sub-comment-count">1</span></span>
            <span class="sub-comment-chevron" id="sct-chev-${uid}">${iconChevron}</span>
          </button>
          <div class="sub-comment-body" id="sct-body-${uid}" style="display:none">
            <div class="sub-comment-text">${comment}</div>
          </div>
        </div>`;
    }

    /* ── CALIFICADO ── */
    if (sub && sub.graded) {
        const uid = 'graded-' + actId;
        return `<div class="submission-status-bar graded" style="margin-top:18px">
          <div class="submission-status-icon">${iconStar}</div>
          <div class="submission-status-info">
            <div class="submission-status-label">Calificado</div>
            <div class="submission-status-detail">Entregado el ${new Date(sub.submittedAt).toLocaleDateString('es-CO')}</div>
          </div>
        </div>
        <div class="submission-grade-display">
          <div class="submission-grade-num">${sub.grade}</div>
          <div class="submission-grade-sep"></div>
          <div class="submission-grade-info">
            <div class="submission-grade-label">Retroalimentación del Docente</div>
            <div class="submission-grade-comment">${sub.feedback || 'Sin comentarios adicionales.'}</div>
          </div>
        </div>
        ${commentToggle(sub.comment, uid)}`;
    }

    /* ── MODO EDICIÓN ── */
    if (sub && sub.editing) {
        return `<div class="submission-upload-section" style="margin-top:18px">
          <div class="submission-section-title">
            <span>Editar Entrega</span>
            <span class="badge badge-gold">Editando</span>
          </div>
          <textarea class="submission-comment-input" id="sub-comment-${actId}" placeholder="Comentario para el docente (opcional)...">${sub.prevComment || ''}</textarea>
          <div class="submission-file-drop" id="sub-drop-${actId}" ondragover="event.preventDefault();this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="handleSubDrop(event,${actId})">
            <input type="file" multiple onchange="handleSubFile(event,${actId})">
            <div class="submission-file-drop-text">Arrastra archivos aquí o haz clic para seleccionar</div>
            <div class="submission-file-drop-sub">PDF, imágenes, documentos Word</div>
          </div>
          <div id="sub-files-${actId}"></div>
          <div class="submission-actions" style="gap:8px">
            <button class="btn btn-teal" onclick="submitActivity(${actId})">${iconSend} Guardar cambios</button>
            <button class="btn btn-outline btn-sm" onclick="cancelEditSubmission(${actId})" style="background:transparent">Cancelar</button>
          </div>
        </div>`;
    }

    /* ── ENTREGADO (pendiente de calificación) ── */
    if (sub && sub.submitted) {
        const submittedDate = new Date(sub.submittedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const uid = 'sub-' + actId;
        return `<div class="submission-status-bar submitted" style="margin-top:18px">
          <div class="submission-status-icon">${iconCheck}</div>
          <div class="submission-status-info">
            <div class="submission-status-label">Entrega realizada</div>
            <div class="submission-status-detail">Enviado el ${submittedDate} — Pendiente de calificación</div>
          </div>
          <div class="submission-status-actions">
            <button class="sub-action-btn edit" onclick="editSubmission(${actId})" title="Editar comentario o archivos">${iconEdit} Editar</button>
            <button class="sub-action-btn resubmit" onclick="resubmitActivity(${actId})" title="Volver a entregar">${iconRefresh} Reenviar</button>
            <button class="sub-action-btn delete" onclick="deleteSubmission(${actId})" title="Eliminar entrega">${iconTrash} Eliminar</button>
          </div>
        </div>
        ${commentToggle(sub.comment, uid)}
        ${sub.files && sub.files.length ? `<div class="announcement-section-label" style="margin-top:12px">Archivos enviados</div>
        <div class="attachment-list">${sub.files.map(f => `<div class="attachment-item"><div class="attachment-icon doc">${iconFile}</div><span class="attachment-name">${f.name}</span><span class="attachment-meta">${(f.size / 1024).toFixed(0)} KB</span></div>`).join('')}</div>` : ''}`;
    }

    /* ── SIN ENVIAR ── */
    return `<div class="submission-upload-section" style="margin-top:18px">
      <div class="submission-section-title">
        <span>Entregar Actividad</span>
        <span class="badge badge-navy">Sin enviar</span>
      </div>
      <textarea class="submission-comment-input" id="sub-comment-${actId}" placeholder="Comentario para el docente (opcional)..."></textarea>
      <div class="submission-file-drop" id="sub-drop-${actId}" ondragover="event.preventDefault();this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="handleSubDrop(event,${actId})">
        <input type="file" multiple onchange="handleSubFile(event,${actId})">
        <div class="submission-file-drop-text">Arrastra archivos aquí o haz clic para seleccionar</div>
        <div class="submission-file-drop-sub">PDF, imágenes, documentos Word</div>
      </div>
      <div id="sub-files-${actId}"></div>
      <div class="submission-actions">
        <button class="btn btn-teal" onclick="submitActivity(${actId})">${iconSend} Enviar entrega</button>
      </div>
    </div>`;
}

/* ── Toggles / CRUD de entregas ─────────────────────────────────────────── */
function toggleSubComment(uid) {
    const body = document.getElementById('sct-body-' + uid);
    const chev = document.getElementById('sct-chev-' + uid);
    if (!body) return;
    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'block';
    if (chev) chev.style.transform = isOpen ? '' : 'rotate(180deg)';
}

function deleteSubmission(actId) {
    if (!confirm('¿Seguro que deseas eliminar esta entrega? Esta acción no se puede deshacer.')) return;
    const sid = currentStudent ? currentStudent.id : 1;
    localStorage.removeItem('educat_sub_' + sid + '_' + actId);
    showToast('Entrega eliminada');
    renderUnit(currentUnitIdx);
}

function editSubmission(actId) {
    const sub = getSubmission(actId);
    if (!sub) return;
    saveSubmission(actId, { ...sub, editing: true, prevComment: sub.comment });
    renderUnit(currentUnitIdx);
}

function cancelEditSubmission(actId) {
    const sub = getSubmission(actId);
    if (!sub) return;
    // Remove editing flag, restore original state
    const { editing, prevComment, ...rest } = sub;
    saveSubmission(actId, rest);
    renderUnit(currentUnitIdx);
}

function resubmitActivity(actId) {
    const sub = getSubmission(actId);
    if (!sub) return;
    saveSubmission(actId, { ...sub, editing: true, prevComment: sub.comment });
    renderUnit(currentUnitIdx);
}

function handleSubFile(event, actId) {
    if (!actSubmissionFiles[actId]) actSubmissionFiles[actId] = [];
    Array.from(event.target.files).forEach(f => {
        if (!actSubmissionFiles[actId].find(x => x.name === f.name)) actSubmissionFiles[actId].push(f);
    });
    renderSubFiles(actId);
    event.target.value = '';
}

function handleSubDrop(event, actId) {
    event.preventDefault();
    document.getElementById('sub-drop-' + actId).classList.remove('drag-over');
    if (!actSubmissionFiles[actId]) actSubmissionFiles[actId] = [];
    Array.from(event.dataTransfer.files).forEach(f => {
        if (!actSubmissionFiles[actId].find(x => x.name === f.name)) actSubmissionFiles[actId].push(f);
    });
    renderSubFiles(actId);
}

function renderSubFiles(actId) {
    const list = document.getElementById('sub-files-' + actId);
    if (!list) return;
    const files = actSubmissionFiles[actId] || [];
    list.innerHTML = files.map((f, i) => `<div class="file-chip">
      <svg width="14" height="14" fill="none" stroke="var(--teal)" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <span class="file-chip-name">${f.name}</span>
      <span class="file-chip-size">${(f.size / 1024).toFixed(0)} KB</span>
      <button class="file-chip-remove" onclick="removeSubFile(${actId},${i})">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>`).join('');
}

function removeSubFile(actId, idx) {
    if (actSubmissionFiles[actId]) { actSubmissionFiles[actId].splice(idx, 1); renderSubFiles(actId); }
}

function submitActivity(actId) {
    const comment = (document.getElementById('sub-comment-' + actId) || {}).value || '';
    const files = actSubmissionFiles[actId] || [];
    const existing = getSubmission(actId);
    // Merge files: keep previously submitted files if editing and no new files provided
    let finalFiles = files.map(f => ({ name: f.name, size: f.size }));
    if (!finalFiles.length && existing && existing.files) finalFiles = existing.files;
    saveSubmission(actId, {
        submitted: true,
        submittedAt: new Date().toISOString(),
        comment,
        files: finalFiles,
        graded: false,
        editing: false
    });
    delete actSubmissionFiles[actId];
    showToast('Actividad entregada correctamente', 'success');
    renderUnit(currentUnitIdx);
}

function renderUnit(idx) {
    currentUnitIdx = idx;
    const units = getUnits(currentCourse.id);
    document.querySelectorAll('.unit-tab').forEach((el, i) => el.classList.toggle('active', i === idx));
    const contentArea = document.getElementById('unitContentArea');
    if (!units.length) {
        contentArea.innerHTML = '<div class="empty-state"><div class="empty-state-title">Sin contenido</div><div class="empty-state-text">Este curso aún no tiene unidades configuradas.</div></div>';
        return;
    }
    const unit = units[idx];
    const allActivities = MOCK.activities.filter(a => a.course && a.course.id === currentCourse.id);
    const allExams = MOCK.exams.filter(x => x.course && x.course.id === currentCourse.id);
    const acts = unit.activities ? allActivities.filter(a => unit.activities.includes(a.id)) : [];
    const exams = unit.exams ? allExams.filter(x => unit.exams.includes(x.id)) : [];
    const announcements = unit.announcements || [];
    const resources = unit.resources || [];

    const IC = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>`;
    const ICAL = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
    const IFILE = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    const ICLIP = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>`;
    const IBELL = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`;
    const IVID = `<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>`;
    const ILINK = `<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>`;

    const annHtml = announcements.length ? `
    <div class="card" style="margin-bottom:20px">
      <div class="card-header">
        <span class="card-title">Anuncios del Docente</span>
        <span class="badge badge-gold">${announcements.length}</span>
      </div>
      <div class="card-body" style="padding:0">
        ${announcements.map((a, i) => {
        const isObj = typeof a === 'object' && a !== null;
        const title = isObj ? (a.title || 'Anuncio') : String(a).slice(0, 80);
        const content = isObj ? (a.content || a.title || '') : String(a);
        const dateStr = isObj && a.date ? new Date(a.date + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
        const attachments = isObj && Array.isArray(a.attachments) ? a.attachments : [];
        const cid = `ann-${currentCourse.id}-${idx}-${i}`;
        return `<div class="announcement-card" id="${cid}">
              <div class="announcement-card-header" onclick="toggleCard('${cid}')">
                <div class="announcement-card-icon">${IBELL}</div>
                <div class="announcement-card-meta">
                  <div class="announcement-card-title">${title}</div>
                  ${dateStr ? `<div class="announcement-card-date">${dateStr}</div>` : ''}
                  <div class="announcement-card-preview">${content}</div>
                </div>
                <button class="announcement-toggle-btn" onclick="event.stopPropagation();toggleCard('${cid}')">${IC}</button>
              </div>
              <div class="announcement-card-body">
                <div class="announcement-full-text">${content}</div>
                ${attachments.length ? `<div class="announcement-section-label">Archivos adjuntos</div>
                <div class="attachment-list">${attachments.map(at => `<div class="attachment-item">
                  <div class="attachment-icon ${at.type || 'doc'}">${IFILE}</div>
                  <span class="attachment-name">${at.name}</span>
                  <a class="attachment-download" href="${at.url || '#'}" target="_blank">${ICLIP} Descargar</a>
                </div>`).join('')}</div>` : ''}
              </div>
            </div>`;
    }).join('')}
      </div>
    </div>` : '';

    const actsHtml = `
    <div class="card" style="margin-bottom:20px">
      <div class="card-header">
        <span class="card-title">Talleres y Actividades</span>
        <span class="badge badge-navy">${acts.length}</span>
      </div>
      <div class="card-body" style="${acts.length ? 'padding:0' : ''}">
        ${acts.length ? acts.map((a, i) => {
        const sub = getSubmission(a.id);
        const cid = `act-${a.id}-${currentCourse.id}`;
        const isGraded = sub && sub.graded;
        const isSubmitted = sub && sub.submitted && !sub.editing;
        const statusBadge = isGraded
            ? `<span class="badge badge-gold">Calificado: ${sub.grade}/10</span>`
            : isSubmitted
                ? `<span class="badge badge-success">Enviado</span>`
                : `<span class="badge badge-navy">Pendiente</span>`;
        const dueDateStr = a.dueDate ? new Date(a.dueDate + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
        return `<div class="activity-card" id="${cid}">
              <div class="activity-card-header" onclick="toggleCard('${cid}')">
                <div class="activity-num">${i + 1}</div>
                <div class="activity-header-meta">
                  <div class="activity-title">${a.title}</div>
                  <div class="activity-due-row">
                    ${dueDateStr ? `<span class="activity-due">${ICAL} Entrega: ${dueDateStr}</span>` : ''}
                    ${statusBadge}
                  </div>
                </div>
                <button class="activity-toggle-btn" onclick="event.stopPropagation();toggleCard('${cid}')">${IC}</button>
              </div>
              <div class="activity-card-body">
                <div class="activity-description">${a.description || ''}</div>
                ${a.attachments && a.attachments.length ? `<div class="announcement-section-label" style="margin-top:16px">Material del docente</div>
                <div class="attachment-list">${a.attachments.map(at => `<div class="attachment-item">
                  <div class="attachment-icon ${at.type || 'doc'}">${IFILE}</div>
                  <span class="attachment-name">${at.name}</span>
                  <a class="attachment-download" href="${at.url || '#'}" target="_blank">${ICLIP} Descargar</a>
                </div>`).join('')}</div>` : ''}
                ${renderSubmissionSection(a.id, sub)}
              </div>
            </div>`;
    }).join('') : '<div style="color:var(--text-muted);font-size:13px;padding:4px 0">Sin talleres asignados para esta unidad.</div>'}
      </div>
    </div>`;

    const examsHtml = exams.length ? `
    <div class="card" style="margin-bottom:20px">
      <div class="card-header">
        <span class="card-title">Evaluaciones</span>
        <span class="badge badge-error">${exams.length}</span>
      </div>
      <div class="card-body" style="padding:0">
        ${exams.map((x, i) => {
        const cid = `exam-${x.id}-${currentCourse.id}`;
        const examDateStr = x.examDate ? new Date(x.examDate + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
        return `<div class="exam-card" id="${cid}">
              <div class="exam-card-header" onclick="toggleCard('${cid}')">
                <div class="exam-num">${i + 1}</div>
                <div class="exam-header-meta">
                  <div class="exam-title">${x.title}</div>
                  ${examDateStr ? `<div class="exam-date">${ICAL} ${examDateStr}</div>` : ''}
                </div>
              </div>
              ${x.description ? `<div class="exam-card-body"><p style="font-size:14px;color:var(--text-body);line-height:1.75">${x.description}</p></div>` : ''}
            </div>`;
    }).join('')}
      </div>
    </div>` : '';

    const resourcesHtml = resources.length ? `
    <div class="card" style="margin-bottom:20px">
      <div class="card-header">
        <span class="card-title">Bibliografía y Recursos</span>
        <span class="badge badge-success">${resources.length}</span>
      </div>
      <div class="card-body">
        ${resources.map(r => `<a class="resource-card-item" href="${r.url || '#'}" target="_blank">
          <div class="resource-icon ${r.type || 'doc'}">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              ${r.type === 'video' ? IVID : r.type === 'link' ? ILINK : '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>'}
            </svg>
          </div>
          <span class="resource-name">${r.name}</span>
          <span class="resource-type">${(r.type || 'doc').toUpperCase()}</span>
        </a>`).join('')}
      </div>
    </div>` : '';

    contentArea.innerHTML = `
    <div class="unit-welcome">
      <div class="unit-welcome-content">
        <div class="unit-welcome-label">Bienvenida a la Unidad</div>
        <div class="unit-welcome-title">${unit.name}</div>
        <div class="unit-welcome-text">${unit.welcome || ''}</div>
      </div>
    </div>
    <div class="unit-description-card" style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px">Descripción del Tema</div>
      <p style="font-size:14px;line-height:1.75;color:var(--text-body)">${unit.description || 'Sin descripción disponible.'}</p>
    </div>
    ${annHtml}
    ${actsHtml}
    ${examsHtml}
    ${resourcesHtml}`;
}

document.getElementById('fileInput').addEventListener('change', e => {
    Array.from(e.target.files).forEach(f => {
        if (!selectedFiles.find(x => x.name === f.name)) selectedFiles.push(f);
    });
    renderFileList();
    e.target.value = '';
});

const dropArea = document.getElementById('fileDropArea');
if (dropArea) {
    dropArea.addEventListener('dragover', e => { e.preventDefault(); dropArea.classList.add('drag-over'); });
    dropArea.addEventListener('dragleave', () => dropArea.classList.remove('drag-over'));
    dropArea.addEventListener('drop', e => {
        e.preventDefault();
        dropArea.classList.remove('drag-over');
        Array.from(e.dataTransfer.files).forEach(f => {
            if (!selectedFiles.find(x => x.name === f.name)) selectedFiles.push(f);
        });
        renderFileList();
    });
}

function renderFileList() {
    const list = document.getElementById('fileList');
    if (!list) return;
    list.innerHTML = selectedFiles.map((f, i) => `<div class="file-chip">
      <svg width="14" height="14" fill="none" stroke="var(--teal)" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <span class="file-chip-name">${f.name}</span>
      <span class="file-chip-size">${(f.size / 1024).toFixed(0)} KB</span>
      <button class="file-chip-remove" onclick="removeFile(${i})">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>`).join('');
}

function removeFile(idx) { selectedFiles.splice(idx, 1); renderFileList(); }

document.getElementById('btnReportarAusencia').addEventListener('click', () => {
    const curso = document.getElementById('ausCurso');
    const fecha = document.getElementById('ausFecha').value;
    const motivo = document.getElementById('ausMotivo').value;
    const descripcion = document.getElementById('ausDescripcion').value.trim();
    document.getElementById('ausenciaOk').style.display = 'none';
    if (!curso.value || !fecha || !motivo || !descripcion) {
        showToast('Completa todos los campos obligatorios', 'error');
        return;
    }
    const sid = currentStudent ? currentStudent.id : 1;
    const key = 'educat_ausencias_' + sid;
    const historial = JSON.parse(localStorage.getItem(key) || '[]');
    historial.push({
        fecha,
        curso: curso.options[curso.selectedIndex].text,
        motivo: motivo + (descripcion ? ' — ' + descripcion.slice(0, 60) : ''),
        archivos: selectedFiles.length,
        ts: Date.now()
    });
    localStorage.setItem(key, JSON.stringify(historial));
    document.getElementById('ausenciaOk').style.display = 'flex';
    curso.value = '';
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
    currentUser = MOCK.user;
    currentStudent = { ...MOCK.student, user: currentUser };
    document.getElementById('sidebarUserName').textContent = currentUser.name;
    document.getElementById('sidebarStudentCode').textContent = currentStudent.studentCode;
    await loadOverview();
    Promise.all([
        tryFetch('/api/users'),
        tryFetch('/api/students'),
    ]).then(([usersData, studentsData]) => {
        const email = getEmail() || MOCK.user.email;
        if (usersData && usersData.length) {
            const u = usersData.find(u => u.email === email);
            if (u) { currentUser = u; document.getElementById('sidebarUserName').textContent = currentUser.name; }
        }
        if (studentsData && studentsData.length) {
            const s = studentsData.find(s => s.user && s.user.id === currentUser.id);
            if (s) { currentStudent = s; document.getElementById('sidebarStudentCode').textContent = currentStudent.studentCode; }
        }
    });
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
document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);

init();