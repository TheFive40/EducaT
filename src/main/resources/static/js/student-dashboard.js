let authHeader = '', currentUser = null, currentStudent = null;
let enrollments = [], grades = [], attendance = [], certificates = [], schedules = [];
let currentCourse = null, currentUnitIdx = 0;
let selectedFiles = [];
let personalCertificatesMap = {};
const actSubmissionFiles = {};

const MOCK_GRADE_PERIODS = {
    1: { periods: [{ name:'Corte 1', grade:8.5, weight:33.3 },{ name:'Corte 2', grade:7.8, weight:33.3 },{ name:'Corte 3', grade:9.1, weight:33.4 }] },
    2: { periods: [{ name:'Corte 1', grade:7.2, weight:33.3 },{ name:'Corte 2', grade:8.0, weight:33.3 },{ name:'Corte 3', grade:6.8, weight:33.4 }] },
    3: { periods: [{ name:'Corte 1', grade:9.0, weight:33.3 },{ name:'Corte 2', grade:8.5, weight:33.3 },{ name:'Corte 3', grade:9.3, weight:33.4 }] },
};
const EVAL_QUESTIONS = [
    { id:'q1', type:'binary',   label:'Puntualidad',  text:'¿El docente llega puntualmente a clases?' },
    { id:'q2', type:'binary',   label:'Contenido',    text:'¿El docente cumple con el contenido programático?' },
    { id:'q3', type:'binary',   label:'Respeto',      text:'¿El docente mantiene una comunicación respetuosa?' },
    { id:'q4', type:'rating5',  label:'Claridad',     text:'Claridad en la explicación de los temas (1 = muy bajo · 5 = excelente)' },
    { id:'q5', type:'rating5',  label:'Disposición',  text:'Disposición para resolver dudas fuera de clase (1 = nunca · 5 = siempre)' },
    { id:'q6', type:'rating10', label:'Metodología',  text:'Calidad de la metodología de enseñanza (0 = deficiente · 10 = sobresaliente)' },
    { id:'q7', type:'rating10', label:'Material',     text:'Calidad del material de apoyo entregado (0 = deficiente · 10 = sobresaliente)' },
    { id:'q8', type:'open',     label:'Lo mejor',     text:'¿Qué aspectos positivos destacas de este docente?' },
    { id:'q9', type:'open',     label:'Sugerencias',  text:'¿Qué sugerencias de mejora le darías a este docente?' },
];
const AUTOEVAL_QUESTIONS = [
    { id:'a1', type:'binary',   label:'Asistencia',    text:'¿Asististe regularmente a todas las clases del curso?' },
    { id:'a2', type:'binary',   label:'Entregas',      text:'¿Entregaste todas las actividades y talleres en los plazos establecidos?' },
    { id:'a3', type:'binary',   label:'Preparación',   text:'¿Preparaste el material antes de cada sesión de clase?' },
    { id:'a4', type:'rating5',  label:'Participación', text:'Evalúa tu nivel de participación activa en clase (1 = muy baja · 5 = excelente)' },
    { id:'a5', type:'rating5',  label:'Dedicación',    text:'Tiempo dedicado al estudio independiente fuera de clase (1 = muy poco · 5 = mucho)' },
    { id:'a6', type:'rating10', label:'Comprensión',   text:'¿Cuánto comprendes el contenido visto hasta ahora? (0 = nada · 10 = todo)' },
    { id:'a7', type:'open',     label:'Dificultades',  text:'¿Cuáles fueron tus principales dificultades en este curso?' },
    { id:'a8', type:'open',     label:'Compromisos',   text:'¿Qué compromisos asumes para mejorar en el siguiente período?' },
];
const MOCK_OUTCOMES = {
    1: [
        { text:'Comprende y aplica operaciones con matrices y vectores',  status:'achieved'     },
        { text:'Resuelve sistemas de ecuaciones lineales',                status:'achieved'     },
        { text:'Calcula límites y derivadas de funciones',                status:'in-progress'  },
        { text:'Aplica la derivada en problemas de optimización',         status:'pending'      },
    ],
    2: [
        { text:'Analiza textos literarios hispanoamericanos',             status:'achieved'     },
        { text:'Identifica técnicas narrativas del realismo mágico',      status:'achieved'     },
        { text:'Produce ensayos con argumentación sólida',               status:'in-progress'  },
        { text:'Utiliza normas APA en producción textual',               status:'in-progress'  },
    ],
    3: [
        { text:'Comprende la estructura atómica y la tabla periódica',   status:'achieved'     },
        { text:'Clasifica tipos de enlace químico',                       status:'achieved'     },
        { text:'Balancea ecuaciones químicas',                            status:'achieved'     },
        { text:'Aplica principios de estequiometría básica',              status:'in-progress'  },
        { text:'Realiza e interpreta prácticas de laboratorio',          status:'pending'      },
    ],
};

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
        { id: 1, name: 'Certificado de Matrícula 2025',              issuedAt: '2025-02-01', status: 'available', filePath: '#' },
        { id: 2, name: 'Certificado de Excelencia Académica 2024',   issuedAt: '2024-12-15', status: 'available', filePath: '#' },
        { id: 3, name: 'Certificado de Calificaciones — I Semestre', issuedAt: '2025-06-01', status: 'pending',   filePath: null },
    ],
    schedules: [
        { id: 1, course: { id: 1, name: 'Matemáticas Avanzadas' }, day: 'Lunes',     startTime: '07:00', endTime: '09:00' },
        { id: 2, course: { id: 1, name: 'Matemáticas Avanzadas' }, day: 'Miércoles', startTime: '07:00', endTime: '09:00' },
        { id: 3, course: { id: 2, name: 'Literatura y Expresión' }, day: 'Martes',   startTime: '09:00', endTime: '11:00' },
        { id: 4, course: { id: 2, name: 'Literatura y Expresión' }, day: 'Jueves',   startTime: '09:00', endTime: '11:00' },
        { id: 5, course: { id: 3, name: 'Ciencias Naturales' },     day: 'Viernes',  startTime: '11:00', endTime: '13:00' },
    ],
    activities: [
        { id: 1, course: { id: 1 }, title: 'Taller: Matrices y Determinantes', description: 'Resolver los ejercicios de matrices 3×3 del capítulo 2. Presenta el procedimiento completo con cada operación detallada paso a paso.\n\nCriterios de evaluación:\n• Procedimiento correcto: 50%\n• Resultados: 30%\n• Presentación: 20%\n\nFormato de entrega: PDF con nombre Apellido_Taller1.pdf', dueDate: '2025-04-15', attachments: [{ name: 'Guía de Ejercicios Cap.2.pdf', type: 'pdf', url: '#' }] },
        { id: 2, course: { id: 1 }, title: 'Taller: Derivadas Implícitas', description: 'Aplicación de reglas de derivación en funciones implícitas y paramétricas. Incluye resolución de problemas de optimización con justificación completa.\n\nEntrega en formato PDF con todos los pasos desarrollados.', dueDate: '2025-04-22', attachments: [] },
        { id: 3, course: { id: 2 }, title: 'Ensayo Literario', description: 'Análisis temático y estilístico de "Cien años de soledad". Mínimo 3 páginas, máximo 5.\n\nEstructura requerida:\n• Introducción con tesis clara\n• Análisis del realismo mágico\n• Análisis de personajes principales\n• Conclusión\n\nFormato: APA 7ª edición. Entrega como PDF.', dueDate: '2025-04-18', attachments: [{ name: 'Rúbrica de evaluación.pdf', type: 'pdf', url: '#' }] },
        { id: 4, course: { id: 3 }, title: 'Informe de Laboratorio', description: 'Informe completo del experimento de reacciones ácido-base. Debe incluir: objetivo, marco teórico, materiales, procedimiento, tabla de datos, análisis de resultados y conclusiones.\n\nFormato: impreso y digital (PDF).', dueDate: '2025-04-20', attachments: [] },
    ],
    exams: [
        { id: 1, course: { id: 1 }, title: 'Parcial I — Álgebra Lineal', examDate: '2025-04-20', description: 'Temas: vectores, matrices, sistemas de ecuaciones y transformaciones lineales. Duración: 2 horas. Material permitido: calculadora científica.' },
        { id: 2, course: { id: 2 }, title: 'Evaluación de Comprensión Lectora', examDate: '2025-04-25', description: 'Análisis de fragmentos literarios y preguntas de comprensión e interpretación.' },
        { id: 3, course: { id: 3 }, title: 'Quiz: Tabla Periódica', examDate: '2025-04-17', description: 'Elementos, grupos, períodos, propiedades periódicas y tipos de enlace. Duración: 30 minutos.' },
    ],
};

const DEFAULT_UNITS = {
    1: [
        { id:'u1-1', name:'Unidad 1: Álgebra Lineal', welcome:'Bienvenidos a la primera unidad de Matemáticas Avanzadas. Exploraremos los conceptos fundamentales del álgebra lineal que son la base para muchas ramas de la ingeniería y las ciencias.', description:'Vectores en espacios n-dimensionales, matrices y operaciones, sistemas de ecuaciones lineales y resolución mediante eliminación gaussiana, transformaciones lineales y sus propiedades.', announcements:[ { id:'a1', title:'Entrega del Taller de Matrices', content:'Recuerden que el taller de matrices debe entregarse antes del viernes a las 11:59 p.m.\n\nFormato de entrega: PDF con nombre Apellido_Taller1.pdf. Subir a la plataforma o enviar al correo institucional si hay inconvenientes técnicos.\n\nLa calificación se publicará dentro de 5 días hábiles. Cualquier duda pueden escribirme o acercarse en horas de atención.', date:'2025-04-01', attachments:[] }, { id:'a2', title:'Quiz sorpresa — próxima clase', content:'Habrá un quiz corto de 10 minutos al inicio de la próxima clase sobre operaciones matriciales.\n\nTemas a repasar:\n• Suma y resta de matrices\n• Multiplicación de matrices\n• Transpuesta e inversa\n• Determinante 2×2 y 3×3\n\nEl quiz cuenta como nota de participación.', date:'2025-04-03', attachments:[] } ], activities:[1], exams:[1], resources:[ { name:'Álgebra Lineal — Howard Anton (Cap. 1-3)', type:'pdf', url:'#' }, { name:'Video: Introducción a Matrices y Vectores', type:'video', url:'#' }, { name:'Guía de Ejercicios Resueltos', type:'doc', url:'#' } ] },
        { id:'u1-2', name:'Unidad 2: Cálculo Diferencial', welcome:'Continuamos con el cálculo diferencial, una de las herramientas más poderosas de las matemáticas modernas y esencial para el análisis del cambio.', description:'Límites y su definición formal, continuidad de funciones, la derivada y sus interpretaciones geométrica y física, reglas de derivación y aplicaciones en optimización.', announcements:[ { id:'a3', title:'Bibliografía recomendada para esta unidad', content:'Revisar el capítulo 2 de Stewart "Cálculo" antes de la próxima clase. Está disponible en la biblioteca digital institucional con acceso desde la cuenta de correo institucional.\n\nMaterial complementario recomendado:\n• Khan Academy — sección de Límites y Derivadas (gratuito en línea)\n• Paul\'s Online Math Notes — excelente referencia de consulta rápida\n\nSi tienen dificultades para acceder a algún recurso, escríbanme.', date:'2025-04-05', attachments:[] } ], activities:[2], exams:[], resources:[ { name:'Cálculo — James Stewart (Cap. 2-3)', type:'pdf', url:'#' }, { name:'Tabla de Reglas de Derivación', type:'doc', url:'#' } ] },
    ],
    2: [
        { id:'u2-1', name:'Unidad 1: Narrativa Hispanoamericana', welcome:'Bienvenidos a Literatura y Expresión. Nos adentraremos en el fascinante universo de la narrativa latinoamericana del siglo XX y sus representantes más destacados.', description:'Técnicas narrativas del realismo mágico, el contexto del Boom latinoamericano, análisis de la obra de García Márquez, Cortázar y otros autores fundamentales.', announcements:[ { id:'a4', title:'Traer novela a la próxima clase', content:'Por favor traer el libro "Cien años de soledad" a la próxima clase. Trabajaremos con el texto directamente durante la sesión.\n\nSi no tienen el libro físico, pueden tener una versión digital accesible en su dispositivo móvil o tablet. Se trabajará con fragmentos específicos, así que necesitan poder consultar la obra durante la clase.\n\nRecomendación: leer hasta el capítulo 5 antes de la sesión.', date:'2025-04-02', attachments:[] }, { id:'a5', title:'Formato y criterios del ensayo', content:'Aclaraciones sobre el ensayo literario:\n\n• Extensión: mínimo 3 páginas, máximo 5 (sin contar portada ni bibliografía)\n• Fuente: Times New Roman 12pt, interlineado 1.5\n• Formato de citas: APA 7ª edición\n• Mínimo 3 fuentes bibliográficas (además de la novela)\n\nCriterios de evaluación:\n• Claridad de la tesis: 25%\n• Análisis literario: 40%\n• Uso de evidencias textuales: 20%\n• Redacción y formato: 15%', date:'2025-04-06', attachments:[{ name:'Rúbrica_Ensayo_Literatura.pdf', type:'pdf', url:'#' }] } ], activities:[3], exams:[2], resources:[ { name:'García Márquez — Cien años de soledad', type:'pdf', url:'#' }, { name:'Guía de Análisis Literario', type:'doc', url:'#' }, { name:'El Boom Latinoamericano — contexto histórico', type:'link', url:'#' } ] },
    ],
    3: [
        { id:'u3-1', name:'Unidad 1: Química General', welcome:'Bienvenidos a Ciencias Naturales. Esta unidad establece los fundamentos de la química que necesitarán a lo largo del curso y que explican la mayoría de los fenómenos naturales cotidianos.', description:'Estructura atómica y tabla periódica, tipos de enlace químico, reacciones y balanceo, estequiometría básica, ácidos y bases con aplicaciones de laboratorio.', announcements:[ { id:'a6', title:'Práctica de laboratorio — elementos obligatorios', content:'La próxima práctica de laboratorio es de asistencia obligatoria. Deben traer sin excepción:\n\n• Bata blanca de manga larga (no se permitirá el ingreso sin ella)\n• Guantes de látex (talla según su mano)\n• Gafas protectoras\n• Cuaderno de laboratorio o libreta para registro de datos\n\nEl informe se entrega en formato impreso Y digital (PDF) dentro de los 5 días hábiles siguientes a la práctica. La plantilla del informe está adjunta en este anuncio.', date:'2025-04-04', attachments:[{ name:'Plantilla_Informe_Laboratorio.docx', type:'doc', url:'#' }] } ], activities:[4], exams:[3], resources:[ { name:'Química — Chang y Goldsby (Cap. 1-4)', type:'pdf', url:'#' }, { name:'Tabla Periódica Interactiva', type:'link', url:'#' }, { name:'Guía de Práctica de Laboratorio', type:'doc', url:'#' } ] },
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
    } catch (e) { clearTimeout(tid); return null; }
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
document.getElementById('modalBackdrop').addEventListener('click', e => { if (e.target === document.getElementById('modalBackdrop')) closeModal(); });

function setDate() {
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('es-CO', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
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
function toggleCard(id) { const el = document.getElementById(id); if (el) el.classList.toggle('open'); }

function navigateTo(section) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
    const btn = document.querySelector('[data-section="' + section + '"]');
    if (btn) btn.classList.add('active');
    const panel = document.getElementById('panel-' + section);
    if (panel) panel.classList.add('active');
    document.getElementById('courseView').classList.remove('show');
    document.getElementById('personalSubView').classList.remove('show');
    document.getElementById('mainContent').style.display = '';
    const titles = {
        overview:       ['Resumen',               'Vista general de tu actividad académica'],
        cursos:         ['Cursos Matriculados',    'Accede al contenido de tus cursos'],
        clases:         ['Clases Programadas',     'Horario semanal de tus clases'],
        ausencias:      ['Reportar Ausencia',      'Notifica y justifica tus ausencias'],
        'area-personal':['Área Personal',          'Tu información académica consolidada'],
        actualizacion:  ['Actualización de Datos', 'Mantén tu información al día'],
    };
    if (titles[section]) {
        document.getElementById('pageTitle').textContent    = titles[section][0];
        document.getElementById('pageSubtitle').textContent = titles[section][1];
    }
    document.getElementById('topbarBreadcrumb').style.display = 'none';
    document.getElementById('pageTitle').style.display        = '';
    document.getElementById('pageSubtitle').style.display     = '';
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
    if (section === 'overview')       loadOverview();
    else if (section === 'cursos')    loadCursos();
    else if (section === 'clases')    loadClases();
    else if (section === 'ausencias') loadAusencias();
    else if (section === 'area-personal') loadAreaPersonal();
    else if (section === 'actualizacion') loadActualizacion();
}

function renderOverviewContent() {
    document.getElementById('statCursos').textContent = enrollments.length;
    const avg = grades.length ? (grades.reduce((s,g) => s + parseFloat(g.grade||0), 0) / grades.length).toFixed(1) : '—';
    document.getElementById('statPromedio').textContent = avg;
    const attTotal = attendance.length;
    const pct = attTotal ? Math.round((attendance.filter(a=>a.present).length/attTotal)*100)+'%' : '—';
    document.getElementById('statAsistencia').textContent = pct;
    document.getElementById('statCertificados').textContent = certificates.length;
    document.getElementById('overviewCursos').innerHTML = enrollments.slice(0,4).map(e => {
        const c = e.course || {}, teacher = c.teacher && c.teacher.user ? c.teacher.user.name : '—';
        return `<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(11,31,58,0.05);cursor:pointer" onclick="openCourseView(${c.id||0})">
          <div style="width:9px;height:9px;border-radius:50%;background:var(--gold);flex-shrink:0"></div>
          <div style="flex:1"><div style="font-weight:600;font-size:13.5px">${c.name||'Curso'}</div><div style="font-size:11.5px;color:var(--text-muted)">${teacher}</div></div>
          <svg width="14" height="14" fill="none" stroke="var(--text-muted)" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>`;
    }).join('') || '<div style="color:var(--text-muted);font-size:13px">Sin cursos matriculados.</div>';
    document.getElementById('overviewGrades').innerHTML = grades.map(g => {
        const val = parseFloat(g.grade||0), cls = val>=7?'high':val>=5?'mid':'low';
        const color = cls==='high'?'var(--success)':cls==='mid'?'var(--gold)':'var(--error)';
        return `<div style="margin-bottom:13px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px;font-weight:500">${g.course?g.course.name:'—'}</span><span style="font-size:14px;font-weight:700;color:${color}">${val.toFixed(1)}</span></div><div class="grade-bar"><div class="grade-fill ${cls}" style="width:${(val/10)*100}%"></div></div></div>`;
    }).join('') || '<div style="color:var(--text-muted);font-size:13px">Sin calificaciones registradas.</div>';
}

async function loadOverview() {
    enrollments  = MOCK.enrollments.map((e,i) => ({...e, course:MOCK.courses[i]}));
    grades       = MOCK.grades;
    attendance   = MOCK.attendance;
    certificates = MOCK.certificates;
    schedules    = MOCK.schedules;
    renderOverviewContent();
    const sid = currentStudent ? currentStudent.id : 0;
    Promise.all([
        tryFetch('/api/enrollments/student/'+sid), tryFetch('/api/grades/student/'+sid),
        tryFetch('/api/attendance/student/'+sid),  tryFetch('/api/certificates/student/'+sid),
        tryFetch('/api/schedules/student/'+sid),
    ]).then(([enrData,grData,attData,certData,schData]) => {
        let updated = false;
        if (enrData&&enrData.length){enrollments=enrData;updated=true;}
        if (grData&&grData.length){grades=grData;updated=true;}
        if (attData&&attData.length){attendance=attData;updated=true;}
        if (certData&&certData.length){certificates=certData;updated=true;}
        if (schData&&schData.length){schedules=schData;updated=true;}
        if (updated) renderOverviewContent();
    });
}

async function loadCursos() {
    if (!enrollments.length) enrollments = MOCK.enrollments.map((e,i) => ({...e, course:MOCK.courses[i]}));
    document.getElementById('cursosContainer').innerHTML = '<div class="grid-3">' + enrollments.map(e => {
        const c = e.course||{}, teacher = c.teacher&&c.teacher.user?c.teacher.user.name:'—';
        const date = e.enrollmentDate ? new Date(e.enrollmentDate).toLocaleDateString('es-CO') : '—';
        return `<div class="course-card" onclick="openCourseView(${c.id||0})">
          <div class="course-card-top"><div class="course-card-name">${c.name||'Curso'}</div><div class="course-card-teacher">${teacher}</div></div>
          <div class="course-card-body">
            <div class="course-card-desc">${c.description?c.description.slice(0,90)+(c.description.length>90?'...':''):'Sin descripción'}</div>
            <div class="course-card-meta"><span>Desde ${date}</span></div>
            <div class="course-card-actions"><button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openCourseView(${c.id||0})">Ver contenido</button></div>
          </div>
        </div>`;
    }).join('') + '</div>';
}

async function loadClases() {
    const container = document.getElementById('clasesContainer');
    if (!schedules.length) schedules = MOCK.schedules;
    if (!schedules.length) { container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Sin clases programadas</div></div>'; return; }
    const DAY_ORDER = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const DAY_SHORT = {Lunes:'Lun',Martes:'Mar',Miércoles:'Mié',Jueves:'Jue',Viernes:'Vie',Sábado:'Sáb'};
    function toMin(t) { if(!t)return 0; const[h,m]=t.split(':').map(Number); return h*60+(m||0); }
    const activeDays = DAY_ORDER.filter(d => schedules.some(s => s.day===d));
    const allMins = schedules.flatMap(s => [toMin(s.startTime),toMin(s.endTime)]);
    const startHour = Math.floor(Math.min(...allMins)/60), endHour = Math.ceil(Math.max(...allMins)/60);
    const minTime = startHour*60, maxTime = endHour*60, PX = 2.2, totalH = (maxTime-minTime)*PX;
    const PALETTE = [{bg:'rgba(26,58,107,0.10)',border:'#1A3A6B',text:'#0B1F3A'},{bg:'rgba(30,107,116,0.10)',border:'#1E6B74',text:'#134e54'},{bg:'rgba(200,150,46,0.12)',border:'#C8962E',text:'#7a5a1a'},{bg:'rgba(39,174,96,0.10)',border:'#27AE60',text:'#1a6b3c'},{bg:'rgba(142,68,173,0.10)',border:'#8e44ad',text:'#5b2577'},{bg:'rgba(192,57,43,0.10)',border:'#C0392B',text:'#7b1d13'}];
    const courseIds = [...new Set(schedules.map(s=>s.course&&s.course.id).filter(Boolean))];
    const colorMap = {}; courseIds.forEach((id,i) => colorMap[id]=PALETTE[i%PALETTE.length]);
    let guideHtml='', timeLabelsHtml='';
    for (let h=startHour;h<=endHour;h++) { const top=(h*60-minTime)*PX; guideHtml+=`<div class="wcal-guide" style="top:${top}px"></div>`; timeLabelsHtml+=`<div class="wcal-time-label" style="top:${top}px">${String(h).padStart(2,'0')}:00</div>`; }
    let colsHtml='';
    activeDays.forEach(day => {
        const daySch=schedules.filter(s=>s.day===day); let blocksHtml='';
        daySch.forEach(s => {
            const sMin=(toMin(s.startTime)-minTime)*PX, height=Math.max((toMin(s.endTime)-toMin(s.startTime))*PX-3,20);
            const c=colorMap[s.course&&s.course.id]||PALETTE[0], name=s.course?s.course.name:'—';
            const teacher=s.course&&s.course.teacher&&s.course.teacher.user?s.course.teacher.user.name:'';
            blocksHtml+=`<div class="wcal-block" style="top:${sMin}px;height:${height}px;background:${c.bg};border-left:3px solid ${c.border};" title="${name}${teacher?' · '+teacher:''}\n${s.startTime} – ${s.endTime}">
                <span class="wcal-block-name" style="color:${c.text}">${name.length>22?name.slice(0,21)+'…':name}</span>
                ${height>=36?`<span class="wcal-block-time">${s.startTime} – ${s.endTime}</span>`:''}
                ${height>=52&&teacher?`<span class="wcal-block-teacher">${teacher}</span>`:''}
            </div>`;
        });
        colsHtml+=`<div class="wcal-day-col"><div class="wcal-day-header"><span class="wcal-day-full">${day}</span><span class="wcal-day-short">${DAY_SHORT[day]||day}</span><span class="wcal-day-count">${daySch.length} clase${daySch.length!==1?'s':''}</span></div><div class="wcal-day-body" style="height:${totalH}px">${guideHtml}${blocksHtml}</div></div>`;
    });
    const legendHtml = courseIds.map(id => { const s=schedules.find(x=>x.course&&x.course.id===id), c=colorMap[id]; return `<div class="wcal-legend-item"><div class="wcal-legend-swatch" style="background:${c.bg};border-color:${c.border}"></div><span>${s&&s.course?s.course.name:'—'}</span></div>`; }).join('');
    container.innerHTML = `<div class="wcal-legend">${legendHtml}</div><div class="wcal-root"><div class="wcal-time-col" style="width:52px"><div class="wcal-corner" style="height:44px"></div><div class="wcal-time-track" style="height:${totalH}px">${timeLabelsHtml}</div></div><div class="wcal-grid">${colsHtml}</div></div>`;
}

function loadAusencias() {
    const select = document.getElementById('ausCurso');
    const courses = enrollments.length ? enrollments.map(e=>e.course).filter(Boolean) : MOCK.courses;
    select.innerHTML = '<option value="">Selecciona el curso</option>' + courses.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('ausFecha').value = new Date().toISOString().split('T')[0];
    const sid = currentStudent ? currentStudent.id : 1;
    const historial = JSON.parse(localStorage.getItem('educat_ausencias_'+sid)||'[]');
    const hist = document.getElementById('ausenciasHistorial');
    if (!historial.length) { hist.innerHTML='<div class="empty-state" style="padding:24px 0"><div class="empty-state-title">Sin reportes previos</div><div class="empty-state-text">Aún no has reportado ninguna ausencia.</div></div>'; return; }
    hist.innerHTML = '<table><thead><tr><th>Fecha</th><th>Curso</th><th>Motivo</th><th>Documentos</th><th>Estado</th></tr></thead><tbody>' +
        historial.slice().reverse().map(a=>`<tr><td>${a.fecha}</td><td>${a.curso}</td><td style="max-width:160px;font-size:12.5px">${a.motivo}</td><td>${a.archivos?'<span class="badge badge-navy">'+a.archivos+' archivo(s)</span>':'—'}</td><td><span class="badge badge-gold">Pendiente</span></td></tr>`).join('') + '</tbody></table>';
}

// ═══════════════════════ ÁREA PERSONAL ═══════════════════════════

function loadAreaPersonal() {
    const items = [
        { type:'grades',     color:'rgba(200,150,46,0.1)',  stroke:'var(--gold)',       icon:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',                                                                                                             title:'Calificaciones',              sub:'Notas por corte, definitiva por curso y promedio general' },
        { type:'instructivos', color:'rgba(11,31,58,0.08)',  stroke:'var(--navy)',       icon:'<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',                                                                                                           title:'Instructivos',                sub:'Guías rápidas para trámites académicos y uso de la plataforma' },
        { type:'certificados', color:'rgba(39,174,96,0.1)',  stroke:'var(--success)',    icon:'<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>',                                                                                                                                            title:'Certificados',                sub:'Consulta, visualiza y descarga tus certificados disponibles' },
        { type:'eval',       color:'rgba(26,58,107,0.08)',  stroke:'var(--navy-light)', icon:'<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',                                              title:'Evaluación Docente',           sub:'Evalúa individualmente a cada uno de tus profesores' },
        { type:'autoeval',   color:'rgba(142,68,173,0.08)', stroke:'#8e44ad',           icon:'<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',                                                                                                                                                title:'Autoevaluación',               sub:'Reflexiona sobre tu propio desempeño académico' },
        { type:'horario',    color:'rgba(39,174,96,0.08)',  stroke:'var(--success)',    icon:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>',                                                               title:'Escogencia de Horario',        sub:'Indica tu disponibilidad horaria para el próximo período' },
        { type:'resultados', color:'rgba(30,107,116,0.08)', stroke:'var(--teal)',       icon:'<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',                                                                                                              title:'Resultados de Aprendizaje',    sub:'Competencias y logros alcanzados por asignatura' },
        { type:'bienestar',  color:'rgba(192,57,43,0.07)',  stroke:'#e74c3c',           icon:'<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>',                                                                               title:'Bienestar Estudiantil',        sub:'Servicios de apoyo psicológico, salud, deporte y más' },
    ];
    document.getElementById('personalGrid').innerHTML = items.map(it => `
        <div class="ap-menu-card" onclick="openPersonalView('${it.type}')">
            <div class="ap-menu-icon" style="background:${it.color}"><svg width="26" height="26" fill="none" stroke="${it.stroke}" stroke-width="1.5" viewBox="0 0 24 24">${it.icon}</svg></div>
            <div class="ap-menu-info"><div class="ap-menu-title">${it.title}</div><div class="ap-menu-sub">${it.sub}</div></div>
            <svg width="16" height="16" fill="none" stroke="var(--text-light)" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>`).join('');
}

function openPersonalView(type) {
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('courseView').classList.remove('show');
    document.getElementById('personalSubView').classList.add('show');
    document.getElementById('topbarBreadcrumb').style.display = 'none';
    document.getElementById('pageTitle').style.display    = 'none';
    document.getElementById('pageSubtitle').style.display = 'none';
    const TITLES = {
        grades:'Calificaciones',
        instructivos:'Instructivos',
        certificados:'Certificados',
        eval:'Evaluación Docente',
        autoeval:'Autoevaluación',
        horario:'Escogencia de Horario',
        resultados:'Resultados de Aprendizaje',
        bienestar:'Bienestar Estudiantil'
    };
    document.getElementById('personalSubTitle').textContent = TITLES[type] || type;
    const enr     = enrollments.length ? enrollments : MOCK.enrollments.map((e,i) => ({...e, course:MOCK.courses[i]}));
    const courses  = enr.map(e => e.course).filter(Boolean);
    const content  = document.getElementById('personalSubContent');
    content.innerHTML = '';
    if      (type === 'grades')     { content.innerHTML = apGradesHtml(courses);            apInitGrades(); }
    else if (type === 'instructivos') { content.innerHTML = apInstructivosHtml(); }
    else if (type === 'certificados') { content.innerHTML = apCertificadosHtml(); apRefreshCertificates(); }
    else if (type === 'eval')       { content.innerHTML = apEvalHtml(courses, 'eval');       apInitEval(courses, 'eval'); }
    else if (type === 'autoeval')   { content.innerHTML = apEvalHtml(courses, 'autoeval');   apInitEval(courses, 'autoeval'); }
    else if (type === 'horario')    { content.innerHTML = apHorarioHtml();                   apInitHorario(); }
    else if (type === 'resultados') { content.innerHTML = apResultadosHtml(courses); }
    else if (type === 'bienestar')  { content.innerHTML = apBienestarHtml(); }
}

function closePersonalView() {
    document.getElementById('personalSubView').classList.remove('show');
    document.getElementById('mainContent').style.display = '';
    document.getElementById('pageTitle').style.display    = '';
    document.getElementById('pageSubtitle').style.display = '';
}

// ── 1. Calificaciones ────────────────────────────────────────────
function apGradesHtml(courses) {
    const cg = courses.map(c => {
        const d = MOCK_GRADE_PERIODS[c.id];
        if (!d) return { course:c, def:null, periods:[] };
        const def = d.periods.reduce((s,p) => s + p.grade*(p.weight/100), 0);
        return { course:c, def:parseFloat(def.toFixed(2)), periods:d.periods };
    });
    const valid = cg.filter(x => x.def !== null);
    const prom  = valid.length ? (valid.reduce((s,x)=>s+x.def,0)/valid.length).toFixed(2) : '—';
    const pc    = apGC(parseFloat(prom));
    const rows  = cg.map((x,i) => {
        if (!x.def) return '';
        const dc = apGC(x.def);
        const ps = x.periods.map(p => { const c=apGC(p.grade); return `<div class="ap-period-row"><span class="ap-period-name">${p.name}</span><div class="ap-period-bar-wrap"><div class="ap-period-bar"><div class="ap-period-fill" style="width:${(p.grade/10)*100}%;background:${c}"></div></div></div><span class="ap-period-grade" style="color:${c}">${p.grade.toFixed(1)}</span></div>`; }).join('');
        return `<div class="ap-course-row" id="apgrow-${i}"><div class="ap-course-row-header" onclick="apToggleGrade(${i})"><div class="ap-course-row-dot" style="background:${dc}"></div><span class="ap-course-row-name">${x.course.name}</span><span class="ap-course-row-def" style="color:${dc}">${x.def.toFixed(2)}</span><svg class="ap-chevron" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div><div class="ap-course-row-body" id="apgbody-${i}" style="display:none"><div class="ap-periods-list">${ps}</div><div class="ap-definitiva-row"><span>Nota definitiva del curso</span><strong style="font-size:20px;font-family:'Cormorant Garamond',serif;color:${dc}">${x.def.toFixed(2)}<span style="font-size:12px;color:var(--text-muted)">/10</span></strong></div></div></div>`;
    }).join('');
    return `<div style="max-width:760px;margin:0 auto"><div class="card"><div style="background:linear-gradient(135deg,#0B1F3A,#1A3A6B);padding:28px;display:flex;align-items:center;justify-content:space-between;gap:12px;position:relative;overflow:hidden"><div style="position:relative"><div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:4px">Promedio General</div><div style="font-family:'Cormorant Garamond',serif;font-size:48px;font-weight:700;color:#fff;line-height:1">${prom}<span style="font-size:16px;color:rgba(255,255,255,0.45)">/10</span></div><div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:5px">${valid.length} curso(s) · Período Académico 2025</div></div><div style="font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:8px 18px;border-radius:20px;border:1px solid ${pc}50;background:${pc}20;color:${pc};flex-shrink:0">${apGL(parseFloat(prom))}</div></div><div class="ap-courses-list">${rows}</div></div></div>`;
}
function apInitGrades() {
    const b=document.getElementById('apgbody-0'), r=document.getElementById('apgrow-0');
    if(b) b.style.display='block';
    if(r) r.querySelector('.ap-chevron').style.transform='rotate(180deg)';
}
function apToggleGrade(i) {
    const b=document.getElementById('apgbody-'+i), r=document.getElementById('apgrow-'+i);
    if(!b) return;
    const open=b.style.display!=='none';
    b.style.display=open?'none':'block';
    r.querySelector('.ap-chevron').style.transform=open?'':'rotate(180deg)';
}
function apGC(v) { return isNaN(v)?'var(--text-muted)':v>=8?'#27AE60':v>=6?'#C8962E':'#C0392B'; }
function apGL(v) { return isNaN(v)?'—':v>=9?'Sobresaliente':v>=8?'Excelente':v>=7?'Bueno':v>=6?'Aprobado':'Reprobado'; }

const AP_GUIDES = [
    {
        id: 'ins-manual',
        title: 'Manual de Convivencia',
        detail: 'Consulta normas, derechos, deberes y rutas de atencion institucional.',
        pdfUrl: '/docs/manual-convivencia.pdf',
        hasText: true,
        hasPdf: true,
        textSections: [
            {
                heading: 'Proposito',
                paragraphs: [
                    'El Manual de Convivencia establece los acuerdos de comportamiento, respeto y participacion para toda la comunidad educativa.',
                    'Su cumplimiento promueve un ambiente seguro, inclusivo y orientado al aprendizaje.'
                ]
            },
            {
                heading: 'Principios de convivencia',
                bullets: [
                    'Respeto por la dignidad de cada persona.',
                    'Dialogo como mecanismo principal de resolucion de conflictos.',
                    'Corresponsabilidad entre estudiantes, docentes y familias.',
                    'Cuidado de los espacios fisicos y recursos institucionales.'
                ]
            },
            {
                heading: 'Derechos del estudiante',
                bullets: [
                    'Recibir formacion academica integral y de calidad.',
                    'Ser escuchado con debido proceso en situaciones disciplinarias.',
                    'Acceder a orientacion y apoyo institucional cuando sea necesario.'
                ]
            },
            {
                heading: 'Deberes del estudiante',
                bullets: [
                    'Cumplir horarios, actividades y compromisos academicos.',
                    'Mantener un trato respetuoso con toda la comunidad.',
                    'Evitar conductas que afecten el bienestar colectivo.'
                ]
            }
        ]
    },
    {
        id: 'ins-1',
        title: 'Descarga de Certificados',
        detail: 'Aprende a consultar, visualizar y descargar certificados academicos desde el Area Personal.',
        hasText: true,
        hasPdf: false,
        textSections: [
            {
                heading: 'Pasos',
                bullets: [
                    'Ingresa al menu Area Personal y abre la opcion Certificados.',
                    'Ubica el certificado con estado Disponible.',
                    'Usa Ver para previsualizar el documento.',
                    'Usa Descargar para guardar una copia en tu equipo.'
                ]
            }
        ]
    },
    {
        id: 'ins-2',
        title: 'Reporte de Ausencias',
        detail: 'Conoce como reportar una ausencia y adjuntar soportes de forma correcta.',
        hasText: true,
        hasPdf: false,
        textSections: [
            {
                heading: 'Pasos',
                bullets: [
                    'Selecciona el curso y la fecha de la clase.',
                    'Elige el motivo e incluye una descripcion clara.',
                    'Adjunta soportes en PDF o imagen cuando aplique.',
                    'Presiona Enviar Reporte de Ausencia y verifica la confirmacion.'
                ]
            }
        ]
    },
    {
        id: 'ins-3',
        title: 'Actualizacion de Datos',
        detail: 'Revisa como mantener actualizada tu informacion de contacto y acceso.',
        hasText: true,
        hasPdf: false,
        textSections: [
            {
                heading: 'Pasos',
                bullets: [
                    'Abre Actualizacion de Datos en el menu lateral.',
                    'Corrige nombre o correo y valida la informacion.',
                    'Si cambias contrasena, confirma ambos campos.',
                    'Guarda los cambios y espera el mensaje de exito.'
                ]
            }
        ]
    }
];

function apGetGuideById(guideId) {
    return AP_GUIDES.find(g => g.id === guideId) || null;
}

// ── 1.1 Instructivos ──────────────────────────────────────────────
function apInstructivosHtml() {
    const cards = AP_GUIDES.map(g => {
        const modeLabel = g.hasPdf && g.hasText ? 'PDF y texto' : g.hasPdf ? 'PDF' : 'Texto';
        return `<div class="bw-card">
            <div class="bw-card-icon" style="background:rgba(11,31,58,0.08)">
                <svg width="24" height="24" fill="none" stroke="var(--navy)" stroke-width="1.5" viewBox="0 0 24 24">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                </svg>
            </div>
            <div class="bw-card-title">${g.title}</div>
            <p class="bw-card-desc">${g.detail}</p>
            <span class="badge badge-navy" style="width:max-content">${modeLabel}</span>
            <button class="bw-card-btn" onclick="apOpenGuide('${g.id}')">
                Abrir instructivo
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </button>
        </div>`;
    }).join('');

    return `<div style="max-width:900px;margin:0 auto">
        <div class="bw-info-banner">
            <svg width="18" height="18" fill="none" stroke="#fff" stroke-width="1.6" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
                <div style="font-size:14px;font-weight:700;color:#fff">Instructivos del Alumno</div>
                <div style="font-size:12.5px;color:rgba(255,255,255,0.65);margin-top:2px">Guías rápidas para gestionar tus procesos más frecuentes.</div>
            </div>
        </div>
        <div class="bw-grid">${cards}</div>
    </div>`;
}

function apOpenGuide(guideId) {
    const guide = apGetGuideById(guideId);
    if (!guide) return;

    const defaultMode = guide.hasText ? 'text' : 'pdf';
    const switcher = `<div class="guide-switch-row">
        ${guide.hasText ? `<button class="guide-switch-btn" id="guide-text-btn" onclick="apRenderGuideMode('${guide.id}','text')">Texto</button>` : ''}
        ${guide.hasPdf ? `<button class="guide-switch-btn" id="guide-pdf-btn" onclick="apRenderGuideMode('${guide.id}','pdf')">PDF</button>` : ''}
    </div>`;

    document.getElementById('modalTitle').textContent = 'Instructivo: ' + guide.title;
    document.getElementById('modalBody').innerHTML = `
        <div class="guide-reader-wrap">
            <div class="guide-meta">Selecciona el formato de lectura disponible para este instructivo.</div>
            ${switcher}
            <div id="guide-reader-content"></div>
        </div>
    `;
    apRenderGuideMode(guide.id, defaultMode);
    document.getElementById('modalBackdrop').classList.add('show');
}

function apRenderGuideMode(guideId, mode) {
    const guide = apGetGuideById(guideId);
    if (!guide) return;

    const textBtn = document.getElementById('guide-text-btn');
    const pdfBtn = document.getElementById('guide-pdf-btn');
    if (textBtn) textBtn.classList.toggle('active', mode === 'text');
    if (pdfBtn) pdfBtn.classList.toggle('active', mode === 'pdf');

    const target = document.getElementById('guide-reader-content');
    if (!target) return;

    if (mode === 'pdf') {
        if (!guide.pdfUrl) {
            target.innerHTML = '<div class="guide-empty">Este instructivo no tiene PDF cargado por ahora.</div>';
            return;
        }
        target.innerHTML = `
            <div class="guide-pdf-toolbar">
                <a class="btn btn-outline btn-sm" href="${guide.pdfUrl}" target="_blank" rel="noopener">Abrir PDF en nueva pestaña</a>
            </div>
            <iframe class="guide-pdf-frame" src="${guide.pdfUrl}" title="${guide.title}"></iframe>
        `;
        return;
    }

    target.innerHTML = apGuideTextHtml(guide);
}

function apGuideTextHtml(guide) {
    const sections = (guide.textSections || []).map(section => {
        const heading = section.heading ? `<h4 class="guide-sec-title">${section.heading}</h4>` : '';
        const paragraphs = (section.paragraphs || []).map(p => `<p class="guide-paragraph">${p}</p>`).join('');
        const bullets = (section.bullets || []).length
            ? `<ul class="guide-list">${section.bullets.map(item => `<li>${item}</li>`).join('')}</ul>`
            : '';
        return `<section class="guide-section">${heading}${paragraphs}${bullets}</section>`;
    }).join('');

    if (!sections) {
        return '<div class="guide-empty">No hay contenido en texto para este instructivo.</div>';
    }

    return `<article class="guide-text-reader">${sections}</article>`;
}

// ── 1.2 Certificados ──────────────────────────────────────────────
function apCertificadosHtml() {
    const certs = certificates || [];
    personalCertificatesMap = certs.reduce((acc, cert) => {
        acc[cert.id] = cert;
        return acc;
    }, {});

    if (!certs.length) {
        return `<div class="empty-state">
            <div class="empty-state-title">Sin certificados registrados</div>
            <div class="empty-state-text">Cuando la institución emita tus certificados, aparecerán aquí para visualización y descarga.</div>
        </div>`;
    }

    const rows = certs.map(cert => {
        const certName = cert.name || 'Certificado';
        const issuedText = cert.issuedAt ? new Date(cert.issuedAt + 'T00:00:00').toLocaleDateString('es-CO') : 'No informado';
        const statusRaw = (cert.status || '').toLowerCase();
        const hasFile = !!cert.filePath && cert.filePath !== '#';
        const available = statusRaw !== 'pending' && hasFile;
        const statusBadge = available
            ? '<span class="badge badge-success">Disponible</span>'
            : '<span class="badge badge-gold">En gestión</span>';

        return `<tr>
            <td>
                <div style="display:flex;align-items:center;gap:10px">
                    <div class="cert-tbl-icon">
                        <svg width="16" height="16" fill="none" stroke="var(--gold)" stroke-width="1.8" viewBox="0 0 24 24">
                            <circle cx="12" cy="8" r="6"/>
                            <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                        </svg>
                    </div>
                    <span class="cert-tbl-name">${certName}</span>
                </div>
            </td>
            <td>${issuedText}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="cert-actions-cell">
                    <button class="cert-action-btn cert-btn-view" onclick="apViewCertificate(${cert.id})" ${available ? '' : 'disabled style="opacity:.55;cursor:not-allowed"'}>
                        Ver
                    </button>
                    <button class="cert-action-btn cert-btn-dl" onclick="apDownloadCertificate(${cert.id})" ${available ? '' : 'disabled style="opacity:.55;cursor:not-allowed"'}>
                        Descargar
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');

    return `<div style="max-width:960px;margin:0 auto">
        <div class="card">
            <div class="card-header">
                <div>
                    <span class="card-title">Mis Certificados</span>
                    <div style="font-size:12.5px;color:var(--text-muted);margin-top:2px">Consulta el estado de tus certificados y descárgalos cuando estén disponibles.</div>
                </div>
            </div>
            <div class="card-body" style="padding:0;overflow-x:auto">
                <table class="cert-table">
                    <thead>
                        <tr>
                            <th>Certificado</th>
                            <th>Fecha de emisión</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>
    </div>`;
}

async function apRefreshCertificates() {
    const sid = currentStudent ? currentStudent.id : 0;
    const certData = await tryFetch('/api/certificates/student/' + sid);
    if (!certData || !certData.length) return;

    certificates = certData;
    const content = document.getElementById('personalSubContent');
    if (!content) return;
    content.innerHTML = apCertificadosHtml();
}

function apViewCertificate(certId) {
    const cert = personalCertificatesMap[certId];
    if (!cert || !cert.filePath || cert.filePath === '#') {
        showToast('Este certificado aún no está disponible para visualización.', 'error');
        return;
    }

    const safeUrl = cert.filePath;
    document.getElementById('modalTitle').textContent = cert.name || 'Certificado';
    document.getElementById('modalBody').innerHTML = `
        <div style="display:flex;flex-direction:column;gap:14px">
            <div style="font-size:12.5px;color:var(--text-muted)">Previsualización del certificado</div>
            <iframe src="${safeUrl}" title="Vista de certificado" style="width:100%;height:60vh;border:1px solid rgba(11,31,58,0.1);border-radius:8px;background:#fff"></iframe>
            <div style="display:flex;justify-content:flex-end">
                <button class="btn btn-primary" onclick="apDownloadCertificate(${certId})">Descargar</button>
            </div>
        </div>
    `;
    document.getElementById('modalBackdrop').classList.add('show');
}

function apDownloadCertificate(certId) {
    const cert = personalCertificatesMap[certId];
    if (!cert || !cert.filePath || cert.filePath === '#') {
        showToast('Este certificado aún no está disponible para descarga.', 'error');
        return;
    }

    const link = document.createElement('a');
    link.href = cert.filePath;
    link.target = '_blank';
    link.rel = 'noopener';
    link.download = (cert.name || 'certificado') + '.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Descarga iniciada', 'success');
}

// ── 2 & 3. Evaluación Docente / Autoevaluación ───────────────────
function apEvalKey(prefix, courseId) { return 'educat_'+prefix+'_'+(currentStudent?currentStudent.id:1)+'_'+courseId; }
function apGetEval(prefix, courseId) { try { return JSON.parse(localStorage.getItem(apEvalKey(prefix,courseId)))||{}; } catch(e){ return {}; } }
function apSaveEval(prefix, courseId, data) { localStorage.setItem(apEvalKey(prefix,courseId), JSON.stringify(data)); }

function apEvalHtml(courses, prefix) {
    const questions = prefix==='autoeval' ? AUTOEVAL_QUESTIONS : EVAL_QUESTIONS;
    const info = prefix==='autoeval' ? 'Reflexiona honestamente sobre tu desempeño en cada asignatura.' : 'Evalúa a cada docente. Tu opinión es completamente confidencial.';
    const tabs = courses.map((c,i) => {
        const sent = !!localStorage.getItem(apEvalKey(prefix,c.id)+'_sent');
        return `<button class="eval-tab ${i===0?'active':''}" onclick="apSwitchEval(${i},'${prefix}')" id="${prefix}-tab-${i}">${sent?'<svg width="12" height="12" fill="none" stroke="var(--success)" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>':''} ${c.name.length>18?c.name.slice(0,17)+'…':c.name}</button>`;
    }).join('');
    const panels = courses.map((c,i) => {
        const teacher  = c.teacher&&c.teacher.user?c.teacher.user.name:'Docente';
        const spec     = c.teacher?c.teacher.specialization||'':'';
        const initials = teacher.split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
        const sent     = !!localStorage.getItem(apEvalKey(prefix,c.id)+'_sent');
        const bannerName = prefix==='autoeval' ? 'Autoevaluación' : teacher;
        const bannerSub  = prefix==='autoeval' ? c.name : (spec+' · '+c.name);
        return `<div class="eval-form-panel ${i===0?'active':''}" id="${prefix}-panel-${i}" data-course="${c.id}" data-prefix="${prefix}">
            <div class="eval-teacher-banner" style="display:flex;align-items:center;gap:14px;padding:16px 18px;border-bottom:1px solid rgba(11,31,58,0.07);background:linear-gradient(135deg,#0B1F3A,#1A3A6B);position:relative;overflow:hidden">
                <div class="eval-teacher-avatar" style="background:rgba(200,150,46,0.15);border:2px solid rgba(200,150,46,0.35)">${initials}</div>
                <div style="flex:1;position:relative"><div class="eval-teacher-name">${bannerName}</div><div class="eval-teacher-sub">${bannerSub}</div></div>
                <div class="eval-completion-badge" id="${prefix}-badge-${i}"></div>
            </div>
            <div class="eval-questions-list">${apBuildQs(prefix, c.id, questions, sent)}</div>
            <div style="padding:0 18px 18px">
                <button class="btn btn-gold" id="${prefix}-btn-${i}" onclick="apSubmitEval('${prefix}',${i},${c.id})" style="width:100%;${sent?'display:none':''}"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Enviar evaluación</button>
                <div id="${prefix}-msg-${i}" style="${sent?'display:flex':'display:none'};align-items:center;gap:8px;padding:10px 14px;background:rgba(39,174,96,0.08);border:1px solid rgba(39,174,96,0.25);border-radius:8px;font-size:13.5px;font-weight:600;color:var(--success);margin-top:10px"><svg width="14" height="14" fill="none" stroke="var(--success)" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Evaluación enviada. ¡Gracias!</div>
            </div>
        </div>`;
    }).join('');
    return `<div style="max-width:860px;margin:0 auto"><div class="card"><div style="padding:10px 18px;background:rgba(200,150,46,0.05);border-bottom:1px solid rgba(200,150,46,0.12);font-size:13px;color:var(--text-muted);display:flex;align-items:center;gap:8px"><svg width="14" height="14" fill="none" stroke="var(--gold)" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${info}</div><div class="eval-tabs-bar">${tabs}</div>${panels}</div></div>`;
}

function apBuildQs(prefix, courseId, questions, disabled) {
    const saved = apGetEval(prefix, courseId);
    return questions.map(q => {
        const val = saved[q.id], answered = val!==undefined&&val!==null&&val!=='';
        let input = '';
        if (q.type==='binary') {
            input = `<div class="eval-binary-group">${['si','no'].map(opt=>`<button class="eval-binary-btn${val===opt?' active-'+opt:''}" onclick="apSetEval('${prefix}','${courseId}','${q.id}','${opt}',this,'binary')" data-opt="${opt}" ${disabled?'disabled':''}>${opt==='si'?'<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Sí':'<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> No'}</button>`).join('')}</div>`;
        }
        if (q.type==='rating5') {
            input = `<div class="eval-rating-group">${[1,2,3,4,5].map(n=>`<button class="eval-rating-btn${val===n?' selected':''}" onclick="apSetEval('${prefix}','${courseId}','${q.id}',${n},this,'rating5')" data-val="${n}" ${disabled?'disabled':''}>${n}</button>`).join('')}<span class="eval-rating-labels"><span>Muy bajo</span><span>Excelente</span></span></div>`;
        }
        if (q.type==='rating10') {
            input = `<div class="eval-rating-group eval-rating-10">${[0,1,2,3,4,5,6,7,8,9,10].map(n=>`<button class="eval-rating-btn${val===n?' selected':''}" onclick="apSetEval('${prefix}','${courseId}','${q.id}',${n},this,'rating10')" data-val="${n}" ${disabled?'disabled':''}>${n}</button>`).join('')}<span class="eval-rating-labels"><span>Deficiente</span><span>Sobresaliente</span></span></div>`;
        }
        if (q.type==='open') {
            input = `<textarea class="eval-open-input" rows="3" placeholder="Escribe aquí..." ${disabled?'disabled':''} oninput="apSetEval('${prefix}','${courseId}','${q.id}',this.value,this,'open')">${val||''}</textarea>`;
        }
        return `<div class="eval-question${answered?' answered':''}" id="${prefix}-q-${courseId}-${q.id}"><div class="eval-q-label-row"><span class="eval-q-tag">${q.label}</span>${q.type!=='open'?'<span class="eval-q-required">*</span>':''}${answered?'<svg width="13" height="13" fill="none" stroke="var(--success)" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>':''}</div><p class="eval-q-text">${q.text}</p>${input}</div>`;
    }).join('');
}

function apSetEval(prefix, courseId, qId, value, el, type) {
    if (localStorage.getItem(apEvalKey(prefix,courseId)+'_sent')) return;
    const data = apGetEval(prefix, courseId);
    data[qId] = value;
    apSaveEval(prefix, courseId, data);
    const qEl = document.getElementById(prefix+'-q-'+courseId+'-'+qId);
    if (qEl) {
        qEl.classList.add('answered');
        const lr = qEl.querySelector('.eval-q-label-row');
        if (lr && !lr.querySelector('svg[stroke="var(--success)"]')) lr.insertAdjacentHTML('beforeend','<svg width="13" height="13" fill="none" stroke="var(--success)" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>');
    }
    if (type==='binary') { el.closest('.eval-binary-group').querySelectorAll('.eval-binary-btn').forEach(b=>{b.className='eval-binary-btn'+(b.dataset.opt===value?' active-'+value:'');}); }
    if (type==='rating5'||type==='rating10') { el.closest('.eval-rating-group').querySelectorAll('.eval-rating-btn').forEach(b=>{b.classList.toggle('selected',parseInt(b.dataset.val)===value);}); }
    apUpdateBadge(prefix, courseId);
}
function apUpdateBadge(prefix, courseId) {
    const questions = prefix==='autoeval'?AUTOEVAL_QUESTIONS:EVAL_QUESTIONS;
    const data = apGetEval(prefix, courseId);
    const done = questions.filter(q=>data[q.id]!==undefined&&data[q.id]!==null&&data[q.id]!=='').length;
    const panel = document.querySelector(`.eval-form-panel[data-course="${courseId}"][data-prefix="${prefix}"]`);
    if (!panel) return;
    const idx = panel.id.replace(prefix+'-panel-','');
    const badge = document.getElementById(prefix+'-badge-'+idx);
    if (badge) { badge.textContent=done+'/'+questions.length+' respondidas'; badge.className='eval-completion-badge '+(done===questions.length?'complete':'partial'); }
}
function apInitEval(courses, prefix) { courses.forEach(c => apUpdateBadge(prefix, c.id)); }
function apSwitchEval(idx, prefix) {
    document.querySelectorAll('[id^="'+prefix+'-tab-"]').forEach((t,i)=>t.classList.toggle('active',i===idx));
    document.querySelectorAll('[id^="'+prefix+'-panel-"]').forEach((p,i)=>p.classList.toggle('active',i===idx));
}
function apSubmitEval(prefix, panelIdx, courseId) {
    const questions = prefix==='autoeval'?AUTOEVAL_QUESTIONS:EVAL_QUESTIONS;
    const data    = apGetEval(prefix, courseId);
    const missing = questions.filter(q=>q.type!=='open'&&(data[q.id]===undefined||data[q.id]===null||data[q.id]===''));
    if (missing.length) {
        showToast('Responde todas las preguntas obligatorias (*).','error');
        const el=document.getElementById(prefix+'-q-'+courseId+'-'+missing[0].id);
        if(el) el.scrollIntoView({behavior:'smooth',block:'center'});
        return;
    }
    localStorage.setItem(apEvalKey(prefix,courseId)+'_sent','1');
    const btn=document.getElementById(prefix+'-btn-'+panelIdx), msg=document.getElementById(prefix+'-msg-'+panelIdx);
    if(btn) btn.style.display='none';
    if(msg) msg.style.display='flex';
    document.querySelectorAll('#'+prefix+'-panel-'+panelIdx+' button,#'+prefix+'-panel-'+panelIdx+' textarea').forEach(el=>el.disabled=true);
    const tab=document.getElementById(prefix+'-tab-'+panelIdx);
    if(tab&&!tab.querySelector('svg')) tab.insertAdjacentHTML('afterbegin','<svg width="12" height="12" fill="none" stroke="var(--success)" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> ');
    showToast('Evaluación enviada. ¡Gracias!','success');
}

// ── 4. Escogencia de Horario ─────────────────────────────────────
function apHorarioHtml() {
    const days  = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const slots = ['06:00–07:00','07:00–08:00','08:00–09:00','09:00–10:00','10:00–11:00','11:00–12:00','12:00–13:00','13:00–14:00','14:00–15:00','15:00–16:00','16:00–17:00','17:00–18:00','18:00–19:00','19:00–20:00'];
    const headCols = days.map(d=>`<th style="text-align:center;font-size:11px;padding:8px 6px">${d}</th>`).join('');
    const bodyRows = slots.map(s => {
        const cells = days.map(d => { const key='sch_'+d+'_'+s; return `<td style="text-align:center;padding:4px 3px"><button class="sch-cell" id="${key}" onclick="apToggleSch('${key}')" title="${d} ${s}"></button></td>`; }).join('');
        return `<tr><td style="font-size:11.5px;font-weight:600;color:var(--text-muted);padding:4px 10px;white-space:nowrap">${s}</td>${cells}</tr>`;
    }).join('');
    return `<div style="max-width:900px;margin:0 auto"><div class="card"><div class="card-header"><div><div class="card-title">Disponibilidad Horaria</div><div style="font-size:12.5px;color:var(--text-muted);margin-top:3px">Marca los bloques en los que estás disponible para el próximo período</div></div><div style="display:flex;gap:8px;align-items:center"><div style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--text-muted)"><div style="width:14px;height:14px;border-radius:3px;background:rgba(200,150,46,0.15);border:1.5px solid var(--gold)"></div>Disponible</div><button class="btn btn-sm btn-outline" onclick="apClearSch()">Limpiar</button><button class="btn btn-sm btn-gold" onclick="apSaveSch()">Guardar disponibilidad</button></div></div><div class="card-body" style="overflow-x:auto;padding:0"><table style="width:100%;border-collapse:collapse;min-width:600px"><thead><tr><th style="font-size:10px;padding:8px 10px;text-align:left;color:var(--text-muted);border-bottom:2px solid var(--cream-dark);background:var(--cream)">Franja</th>${headCols}</tr></thead><tbody>${bodyRows}</tbody></table></div></div></div>`;
}
function apInitHorario() {
    const sid = currentStudent?currentStudent.id:1;
    const saved = JSON.parse(localStorage.getItem('educat_sch_sel_'+sid)||'{}');
    Object.keys(saved).forEach(k => { if(saved[k]){ const el=document.getElementById(k); if(el) el.classList.add('selected'); } });
}
function apToggleSch(key) { const el=document.getElementById(key); if(el) el.classList.toggle('selected'); }
function apSaveSch() {
    const sid=currentStudent?currentStudent.id:1, state={};
    document.querySelectorAll('.sch-cell').forEach(b=>{ state[b.id]=b.classList.contains('selected'); });
    localStorage.setItem('educat_sch_sel_'+sid, JSON.stringify(state));
    showToast('Disponibilidad guardada correctamente','success');
}
function apClearSch() { document.querySelectorAll('.sch-cell').forEach(b=>b.classList.remove('selected')); showToast('Selección limpiada'); }

// ── 5. Resultados de Aprendizaje ─────────────────────────────────
function apResultadosHtml(courses) {
    const STATUS = { achieved:{label:'Logrado',badge:'badge-success',icon:'<polyline points="20 6 9 17 4 12"/>'}, 'in-progress':{label:'En proceso',badge:'badge-gold',icon:'<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>'}, pending:{label:'Pendiente',badge:'badge-navy',icon:'<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12.01" y2="16"/>'} };
    const cards = courses.map(c => {
        const outcomes = MOCK_OUTCOMES[c.id]||[];
        if(!outcomes.length) return '';
        const achieved = outcomes.filter(o=>o.status==='achieved').length;
        const pct      = Math.round((achieved/outcomes.length)*100);
        const color    = pct>=80?'var(--success)':pct>=50?'var(--gold)':'var(--error)';
        const rows     = outcomes.map(o => { const s=STATUS[o.status]||STATUS.pending; return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(11,31,58,0.05)"><svg width="16" height="16" fill="none" stroke="${o.status==='achieved'?'var(--success)':o.status==='in-progress'?'var(--gold)':'var(--text-light)'}" stroke-width="2.5" viewBox="0 0 24 24">${s.icon}</svg><span style="flex:1;font-size:13.5px;color:var(--text-body)">${o.text}</span><span class="badge ${s.badge}" style="flex-shrink:0;font-size:10px">${s.label}</span></div>`; }).join('');
        return `<div class="card" style="margin-bottom:16px"><div class="card-header" style="flex-wrap:nowrap"><div><div class="card-title">${c.name}</div><div style="font-size:12px;color:var(--text-muted);margin-top:2px">${achieved} de ${outcomes.length} resultados logrados</div></div><div style="text-align:right;flex-shrink:0"><div style="font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:700;color:${color};line-height:1">${pct}%</div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Avance</div></div></div><div class="card-body" style="padding-top:0"><div style="height:5px;background:rgba(11,31,58,0.07);border-radius:3px;overflow:hidden;margin-bottom:16px"><div style="height:100%;width:${pct}%;background:${color};border-radius:3px;transition:width .5s ease"></div></div>${rows}</div></div>`;
    }).join('');
    return `<div style="max-width:800px;margin:0 auto">${cards||'<div class="empty-state"><div class="empty-state-title">Sin resultados registrados</div></div>'}</div>`;
}

// ── 6. Bienestar Estudiantil ─────────────────────────────────────
function apBienestarHtml() {
    const services = [
        { color:'rgba(142,68,173,0.1)', stroke:'#8e44ad', icon:'<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>', title:'Apoyo Psicológico',         desc:'Atención individual y grupal con profesionales en salud mental. Espacios de escucha y acompañamiento emocional.', cta:'Solicitar cita' },
        { color:'rgba(39,174,96,0.08)', stroke:'var(--success)', icon:'<circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>', title:'Actividad Física y Deporte', desc:'Torneos internos, equipos representativos y acceso a instalaciones deportivas durante la jornada académica.', cta:'Más información' },
        { color:'rgba(200,150,46,0.08)',stroke:'var(--gold)',    icon:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',  title:'Arte y Cultura',             desc:'Grupos de teatro, música, danza y artes plásticas. Participa en los eventos culturales del calendario institucional.', cta:'Inscribirme' },
        { color:'rgba(30,107,116,0.08)',stroke:'var(--teal)',    icon:'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>',  title:'Apoyos Económicos y Becas',  desc:'Descuentos por excelencia académica, becas socioeconómicas y planes de financiamiento flexible para tu matrícula.', cta:'Consultar requisitos' },
        { color:'rgba(192,57,43,0.07)', stroke:'#e74c3c',       icon:'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',                  title:'Servicio Médico y Salud',    desc:'Enfermería disponible en la institución, campañas de vacunación y orientación en salud preventiva.', cta:'Más información' },
        { color:'rgba(26,58,107,0.07)', stroke:'var(--navy-light)', icon:'<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>',              title:'Orientación Vocacional',     desc:'Talleres de proyección profesional, feria de universidades y asesoría personalizada para tu plan de vida.', cta:'Agendar sesión' },
    ];
    const cards = services.map((s,i) => `<div class="bw-card"><div class="bw-card-icon" style="background:${s.color}"><svg width="24" height="24" fill="none" stroke="${s.stroke}" stroke-width="1.5" viewBox="0 0 24 24">${s.icon}</svg></div><div class="bw-card-title">${s.title}</div><p class="bw-card-desc">${s.desc}</p><button class="bw-card-btn" onclick="apBwRequest('${s.title}',${i})">${s.cta} <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button><div id="bw-sent-${i}" style="display:none;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--success)"><svg width="14" height="14" fill="none" stroke="var(--success)" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Solicitud enviada</div></div>`).join('');
    return `<div style="max-width:900px;margin:0 auto"><div style="background:linear-gradient(135deg,#0B1F3A,#1A3A6B);border-radius:var(--radius);padding:20px 24px;display:flex;align-items:center;gap:14px;margin-bottom:20px"><svg width="18" height="18" fill="none" stroke="#fff" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg><div><div style="font-size:14px;font-weight:700;color:#fff">Servicios de Bienestar Estudiantil</div><div style="font-size:12.5px;color:rgba(255,255,255,0.65);margin-top:2px">Tu institución te acompaña más allá del aula.</div></div></div><div class="bw-grid">${cards}</div></div>`;
}
function apBwRequest(service, idx) {
    const btn=document.getElementById('bw-sent-'+idx).previousElementSibling, sent=document.getElementById('bw-sent-'+idx);
    if(btn) btn.style.display='none';
    if(sent) sent.style.display='flex';
    showToast('Solicitud enviada — '+service,'success');
}

// ═══════════════════ FIN ÁREA PERSONAL ═══════════════════════════

function loadActualizacion() {
    const u = currentUser || MOCK.user;
    document.getElementById('updName').value  = u.name  || '';
    document.getElementById('updEmail').value = u.email || '';
}
async function saveProfile() {
    const name = document.getElementById('updName').value.trim();
    const email = document.getElementById('updEmail').value.trim();
    const password = document.getElementById('updPassword').value;
    const confirm  = document.getElementById('updConfirm').value;
    const alertEl  = document.getElementById('updateAlert');
    alertEl.style.display = 'none';
    if (!name || !email) { alertEl.textContent='Nombre y correo son obligatorios.'; alertEl.style.display='flex'; alertEl.className='alert alert-error'; return; }
    if (password && password !== confirm) { alertEl.textContent='Las contraseñas no coinciden.'; alertEl.style.display='flex'; alertEl.className='alert alert-error'; return; }
    const u = currentUser || MOCK.user;
    const body = { name, email, roleId:u.role?u.role.id:3, status:u.status||true };
    if (password) body.password = password;
    try { const res=await apiFetch('/api/users/'+u.id,{method:'PUT',body:JSON.stringify(body)}); if(res&&res.ok){currentUser=await res.json(); document.getElementById('sidebarUserName').textContent=currentUser.name;} } catch(e){}
    alertEl.textContent='Datos actualizados correctamente.'; alertEl.style.display='flex'; alertEl.className='alert alert-success';
    showToast('Perfil actualizado','success');
}

function openCourseView(courseId) {
    const allCourses = enrollments.map(e=>e.course).filter(Boolean);
    currentCourse = allCourses.find(c=>c.id===courseId) || MOCK.courses.find(c=>c.id===courseId);
    if (!currentCourse) return;
    currentUnitIdx = 0;
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('personalSubView').classList.remove('show');
    document.getElementById('courseView').classList.add('show');
    document.getElementById('pageTitle').style.display    = 'none';
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
    document.getElementById('pageTitle').style.display    = '';
    document.getElementById('pageSubtitle').style.display = '';
}
document.getElementById('breadcrumbBack').addEventListener('click', closeCourseView);

function renderUnitTabs() {
    const units = getUnits(currentCourse.id), bar = document.getElementById('unitTabsBar');
    if (!units.length) { bar.innerHTML='<div style="padding:0 20px;font-size:13px;color:var(--text-muted);display:flex;align-items:center;min-height:52px">Sin unidades registradas para este curso.</div>'; return; }
    bar.innerHTML = units.map((u,i)=>`<button class="unit-tab ${i===0?'active':''}" onclick="renderUnit(${i})"><span class="unit-tab-num">${i+1}</span>${u.name}</button>`).join('');
}

function renderSubmissionSection(actId, sub) {
    const iconFile=`<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    const iconSend=`<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
    const iconCheck=`<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`;
    const iconStar=`<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    const iconEdit=`<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/></svg>`;
    const iconTrash=`<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>`;
    const iconRefresh=`<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>`;
    const iconMsg=`<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`;
    const iconChevron=`<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>`;
    function commentToggle(comment,uid) {
        if(!comment) return '';
        return `<div class="sub-comment-toggle" id="sct-wrap-${uid}"><button class="sub-comment-toggle-btn" onclick="toggleSubComment('${uid}')"><span style="display:flex;align-items:center;gap:6px">${iconMsg} Comentario del estudiante <span class="sub-comment-count">1</span></span><span class="sub-comment-chevron" id="sct-chev-${uid}">${iconChevron}</span></button><div class="sub-comment-body" id="sct-body-${uid}" style="display:none"><div class="sub-comment-text">${comment}</div></div></div>`;
    }
    if (sub&&sub.graded) {
        const uid='graded-'+actId;
        return `<div class="submission-status-bar graded" style="margin-top:18px"><div class="submission-status-icon">${iconStar}</div><div class="submission-status-info"><div class="submission-status-label">Calificado</div><div class="submission-status-detail">Entregado el ${new Date(sub.submittedAt).toLocaleDateString('es-CO')}</div></div></div><div class="submission-grade-display"><div class="submission-grade-num">${sub.grade}</div><div class="submission-grade-sep"></div><div class="submission-grade-info"><div class="submission-grade-label">Retroalimentación del Docente</div><div class="submission-grade-comment">${sub.feedback||'Sin comentarios adicionales.'}</div></div></div>${commentToggle(sub.comment,uid)}`;
    }
    if (sub&&sub.editing) {
        return `<div class="submission-upload-section" style="margin-top:18px"><div class="submission-section-title"><span>Editar Entrega</span><span class="badge badge-gold">Editando</span></div><textarea class="submission-comment-input" id="sub-comment-${actId}" placeholder="Comentario para el docente (opcional)...">${sub.prevComment||''}</textarea><div class="submission-file-drop" id="sub-drop-${actId}" ondragover="event.preventDefault();this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="handleSubDrop(event,${actId})"><input type="file" multiple onchange="handleSubFile(event,${actId})"><div class="submission-file-drop-text">Arrastra archivos aquí o haz clic para seleccionar</div><div class="submission-file-drop-sub">PDF, imágenes, documentos Word</div></div><div id="sub-files-${actId}"></div><div class="submission-actions" style="gap:8px"><button class="btn btn-teal" onclick="submitActivity(${actId})">${iconSend} Guardar cambios</button><button class="btn btn-outline btn-sm" onclick="cancelEditSubmission(${actId})" style="background:transparent">Cancelar</button></div></div>`;
    }
    if (sub&&sub.submitted) {
        const submittedDate = new Date(sub.submittedAt).toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
        const uid='sub-'+actId;
        return `<div class="submission-status-bar submitted" style="margin-top:18px"><div class="submission-status-icon">${iconCheck}</div><div class="submission-status-info"><div class="submission-status-label">Entrega realizada</div><div class="submission-status-detail">Enviado el ${submittedDate} — Pendiente de calificación</div></div><div class="submission-status-actions"><button class="sub-action-btn edit" onclick="editSubmission(${actId})">${iconEdit} Editar</button><button class="sub-action-btn resubmit" onclick="resubmitActivity(${actId})">${iconRefresh} Reenviar</button><button class="sub-action-btn delete" onclick="deleteSubmission(${actId})">${iconTrash} Eliminar</button></div></div>${commentToggle(sub.comment,uid)}${sub.files&&sub.files.length?`<div class="announcement-section-label" style="margin-top:12px">Archivos enviados</div><div class="attachment-list">${sub.files.map(f=>`<div class="attachment-item"><div class="attachment-icon doc">${iconFile}</div><span class="attachment-name">${f.name}</span><span class="attachment-meta">${(f.size/1024).toFixed(0)} KB</span></div>`).join('')}</div>`:''}`;
    }
    return `<div class="submission-upload-section" style="margin-top:18px"><div class="submission-section-title"><span>Entregar Actividad</span><span class="badge badge-navy">Sin enviar</span></div><textarea class="submission-comment-input" id="sub-comment-${actId}" placeholder="Comentario para el docente (opcional)..."></textarea><div class="submission-file-drop" id="sub-drop-${actId}" ondragover="event.preventDefault();this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="handleSubDrop(event,${actId})"><input type="file" multiple onchange="handleSubFile(event,${actId})"><div class="submission-file-drop-text">Arrastra archivos aquí o haz clic para seleccionar</div><div class="submission-file-drop-sub">PDF, imágenes, documentos Word</div></div><div id="sub-files-${actId}"></div><div class="submission-actions"><button class="btn btn-teal" onclick="submitActivity(${actId})">${iconSend} Enviar entrega</button></div></div>`;
}

function toggleSubComment(uid) {
    const body=document.getElementById('sct-body-'+uid), chev=document.getElementById('sct-chev-'+uid);
    if(!body) return;
    const isOpen=body.style.display!=='none';
    body.style.display=isOpen?'none':'block';
    if(chev) chev.style.transform=isOpen?'':'rotate(180deg)';
}
function deleteSubmission(actId) {
    if(!confirm('¿Seguro que deseas eliminar esta entrega? Esta acción no se puede deshacer.')) return;
    localStorage.removeItem('educat_sub_'+(currentStudent?currentStudent.id:1)+'_'+actId);
    showToast('Entrega eliminada'); renderUnit(currentUnitIdx);
}
function editSubmission(actId) { const sub=getSubmission(actId); if(!sub) return; saveSubmission(actId,{...sub,editing:true,prevComment:sub.comment}); renderUnit(currentUnitIdx); }
function cancelEditSubmission(actId) { const sub=getSubmission(actId); if(!sub) return; const{editing,prevComment,...rest}=sub; saveSubmission(actId,rest); renderUnit(currentUnitIdx); }
function resubmitActivity(actId) { const sub=getSubmission(actId); if(!sub) return; saveSubmission(actId,{...sub,editing:true,prevComment:sub.comment}); renderUnit(currentUnitIdx); }
function handleSubFile(event,actId) {
    if(!actSubmissionFiles[actId]) actSubmissionFiles[actId]=[];
    Array.from(event.target.files).forEach(f=>{ if(!actSubmissionFiles[actId].find(x=>x.name===f.name)) actSubmissionFiles[actId].push(f); });
    renderSubFiles(actId); event.target.value='';
}
function handleSubDrop(event,actId) {
    event.preventDefault(); document.getElementById('sub-drop-'+actId).classList.remove('drag-over');
    if(!actSubmissionFiles[actId]) actSubmissionFiles[actId]=[];
    Array.from(event.dataTransfer.files).forEach(f=>{ if(!actSubmissionFiles[actId].find(x=>x.name===f.name)) actSubmissionFiles[actId].push(f); });
    renderSubFiles(actId);
}
function renderSubFiles(actId) {
    const list=document.getElementById('sub-files-'+actId); if(!list) return;
    list.innerHTML=(actSubmissionFiles[actId]||[]).map((f,i)=>`<div class="file-chip"><svg width="14" height="14" fill="none" stroke="var(--teal)" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span class="file-chip-name">${f.name}</span><span class="file-chip-size">${(f.size/1024).toFixed(0)} KB</span><button class="file-chip-remove" onclick="removeSubFile(${actId},${i})"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`).join('');
}
function removeSubFile(actId,idx) { if(actSubmissionFiles[actId]){actSubmissionFiles[actId].splice(idx,1);renderSubFiles(actId);} }
function submitActivity(actId) {
    const comment=(document.getElementById('sub-comment-'+actId)||{}).value||'';
    const files=actSubmissionFiles[actId]||[], existing=getSubmission(actId);
    let finalFiles=files.map(f=>({name:f.name,size:f.size}));
    if(!finalFiles.length&&existing&&existing.files) finalFiles=existing.files;
    saveSubmission(actId,{submitted:true,submittedAt:new Date().toISOString(),comment,files:finalFiles,graded:false,editing:false});
    delete actSubmissionFiles[actId];
    showToast('Actividad entregada correctamente','success'); renderUnit(currentUnitIdx);
}

function renderUnit(idx) {
    currentUnitIdx = idx;
    const units = getUnits(currentCourse.id);
    document.querySelectorAll('.unit-tab').forEach((el,i) => el.classList.toggle('active', i===idx));
    const contentArea = document.getElementById('unitContentArea');
    if (!units.length) { contentArea.innerHTML='<div class="empty-state"><div class="empty-state-title">Sin contenido</div><div class="empty-state-text">Este curso aún no tiene unidades configuradas.</div></div>'; return; }
    const unit = units[idx];
    const allActivities = MOCK.activities.filter(a=>a.course&&a.course.id===currentCourse.id);
    const allExams      = MOCK.exams.filter(x=>x.course&&x.course.id===currentCourse.id);
    const acts          = unit.activities ? allActivities.filter(a=>unit.activities.includes(a.id)) : [];
    const exams         = unit.exams      ? allExams.filter(x=>unit.exams.includes(x.id)) : [];
    const announcements = unit.announcements || [];
    const resources     = unit.resources || [];
    const IC=`<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>`;
    const ICAL=`<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
    const IFILE=`<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    const ICLIP=`<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>`;
    const IBELL=`<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`;
    const IVID=`<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>`;
    const ILINK=`<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>`;
    const annHtml = announcements.length ? `<div class="card" style="margin-bottom:20px"><div class="card-header"><span class="card-title">Anuncios del Docente</span><span class="badge badge-gold">${announcements.length}</span></div><div class="card-body" style="padding:0">${announcements.map((a,i)=>{ const isObj=typeof a==='object'&&a!==null; const title=isObj?(a.title||'Anuncio'):String(a).slice(0,80); const content=isObj?(a.content||a.title||''):String(a); const dateStr=isObj&&a.date?new Date(a.date+'T00:00:00').toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'}):''; const attachments=isObj&&Array.isArray(a.attachments)?a.attachments:[]; const cid=`ann-${currentCourse.id}-${idx}-${i}`; return `<div class="announcement-card" id="${cid}"><div class="announcement-card-header" onclick="toggleCard('${cid}')"><div class="announcement-card-icon">${IBELL}</div><div class="announcement-card-meta"><div class="announcement-card-title">${title}</div>${dateStr?`<div class="announcement-card-date">${dateStr}</div>`:''}<div class="announcement-card-preview">${content}</div></div><button class="announcement-toggle-btn" onclick="event.stopPropagation();toggleCard('${cid}')">${IC}</button></div><div class="announcement-card-body"><div class="announcement-full-text">${content}</div>${attachments.length?`<div class="announcement-section-label">Archivos adjuntos</div><div class="attachment-list">${attachments.map(at=>`<div class="attachment-item"><div class="attachment-icon ${at.type||'doc'}">${IFILE}</div><span class="attachment-name">${at.name}</span><a class="attachment-download" href="${at.url||'#'}" target="_blank">${ICLIP} Descargar</a></div>`).join('')}</div>`:''}</div></div>`; }).join('')}</div></div>` : '';
    const actsHtml = `<div class="card" style="margin-bottom:20px"><div class="card-header"><span class="card-title">Talleres y Actividades</span><span class="badge badge-navy">${acts.length}</span></div><div class="card-body" style="${acts.length?'padding:0':''}">${acts.length?acts.map((a,i)=>{ const sub=getSubmission(a.id); const cid=`act-${a.id}-${currentCourse.id}`; const isGraded=sub&&sub.graded; const isSubmitted=sub&&sub.submitted&&!sub.editing; const statusBadge=isGraded?`<span class="badge badge-gold">Calificado: ${sub.grade}/10</span>`:isSubmitted?`<span class="badge badge-success">Enviado</span>`:`<span class="badge badge-navy">Pendiente</span>`; const dueDateStr=a.dueDate?new Date(a.dueDate+'T00:00:00').toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'}):''; return `<div class="activity-card" id="${cid}"><div class="activity-card-header" onclick="toggleCard('${cid}')"><div class="activity-num">${i+1}</div><div class="activity-header-meta"><div class="activity-title">${a.title}</div><div class="activity-due-row">${dueDateStr?`<span class="activity-due">${ICAL} Entrega: ${dueDateStr}</span>`:''} ${statusBadge}</div></div><button class="activity-toggle-btn" onclick="event.stopPropagation();toggleCard('${cid}')">${IC}</button></div><div class="activity-card-body"><div class="activity-description">${a.description||''}</div>${a.attachments&&a.attachments.length?`<div class="announcement-section-label" style="margin-top:16px">Material del docente</div><div class="attachment-list">${a.attachments.map(at=>`<div class="attachment-item"><div class="attachment-icon ${at.type||'doc'}">${IFILE}</div><span class="attachment-name">${at.name}</span><a class="attachment-download" href="${at.url||'#'}" target="_blank">${ICLIP} Descargar</a></div>`).join('')}</div>`:''} ${renderSubmissionSection(a.id,sub)}</div></div>`; }).join(''):'<div style="color:var(--text-muted);font-size:13px;padding:4px 0">Sin talleres asignados para esta unidad.</div>'}</div></div>`;
    const examsHtml = exams.length ? `<div class="card" style="margin-bottom:20px"><div class="card-header"><span class="card-title">Evaluaciones</span><span class="badge badge-error">${exams.length}</span></div><div class="card-body" style="padding:0">${exams.map((x,i)=>{ const cid=`exam-${x.id}-${currentCourse.id}`; const examDateStr=x.examDate?new Date(x.examDate+'T00:00:00').toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long',year:'numeric'}):''; return `<div class="exam-card" id="${cid}"><div class="exam-card-header" onclick="toggleCard('${cid}')"><div class="exam-num">${i+1}</div><div class="exam-header-meta"><div class="exam-title">${x.title}</div>${examDateStr?`<div class="exam-date">${ICAL} ${examDateStr}</div>`:''}</div></div>${x.description?`<div class="exam-card-body"><p style="font-size:14px;color:var(--text-body);line-height:1.75">${x.description}</p></div>`:''}</div>`; }).join('')}</div></div>` : '';
    const resourcesHtml = resources.length ? `<div class="card" style="margin-bottom:20px"><div class="card-header"><span class="card-title">Bibliografía y Recursos</span><span class="badge badge-success">${resources.length}</span></div><div class="card-body">${resources.map(r=>`<a class="resource-card-item" href="${r.url||'#'}" target="_blank"><div class="resource-icon ${r.type||'doc'}"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">${r.type==='video'?IVID:r.type==='link'?ILINK:'<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>'}</svg></div><span class="resource-name">${r.name}</span><span class="resource-type">${(r.type||'doc').toUpperCase()}</span></a>`).join('')}</div></div>` : '';
    contentArea.innerHTML = `<div class="unit-welcome"><div class="unit-welcome-content"><div class="unit-welcome-label">Bienvenida a la Unidad</div><div class="unit-welcome-title">${unit.name}</div><div class="unit-welcome-text">${unit.welcome||''}</div></div></div><div class="unit-description-card" style="margin-bottom:20px"><div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px">Descripción del Tema</div><p style="font-size:14px;line-height:1.75;color:var(--text-body)">${unit.description||'Sin descripción disponible.'}</p></div>${annHtml}${actsHtml}${examsHtml}${resourcesHtml}`;
}

document.getElementById('fileInput').addEventListener('change', e => {
    Array.from(e.target.files).forEach(f => { if(!selectedFiles.find(x=>x.name===f.name)) selectedFiles.push(f); });
    renderFileList(); e.target.value='';
});
const dropArea = document.getElementById('fileDropArea');
if (dropArea) {
    dropArea.addEventListener('dragover', e=>{e.preventDefault();dropArea.classList.add('drag-over');});
    dropArea.addEventListener('dragleave', ()=>dropArea.classList.remove('drag-over'));
    dropArea.addEventListener('drop', e=>{ e.preventDefault(); dropArea.classList.remove('drag-over'); Array.from(e.dataTransfer.files).forEach(f=>{if(!selectedFiles.find(x=>x.name===f.name))selectedFiles.push(f);}); renderFileList(); });
}
function renderFileList() {
    const list=document.getElementById('fileList'); if(!list) return;
    list.innerHTML=selectedFiles.map((f,i)=>`<div class="file-chip"><svg width="14" height="14" fill="none" stroke="var(--teal)" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span class="file-chip-name">${f.name}</span><span class="file-chip-size">${(f.size/1024).toFixed(0)} KB</span><button class="file-chip-remove" onclick="removeFile(${i})"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`).join('');
}
function removeFile(idx) { selectedFiles.splice(idx,1); renderFileList(); }

document.getElementById('btnReportarAusencia').addEventListener('click', () => {
    const curso=document.getElementById('ausCurso'), fecha=document.getElementById('ausFecha').value, motivo=document.getElementById('ausMotivo').value, descripcion=document.getElementById('ausDescripcion').value.trim();
    document.getElementById('ausenciaOk').style.display='none';
    if(!curso.value||!fecha||!motivo||!descripcion){showToast('Completa todos los campos obligatorios','error');return;}
    const sid=currentStudent?currentStudent.id:1, key='educat_ausencias_'+sid;
    const historial=JSON.parse(localStorage.getItem(key)||'[]');
    historial.push({fecha,curso:curso.options[curso.selectedIndex].text,motivo:motivo+(descripcion?' — '+descripcion.slice(0,60):''),archivos:selectedFiles.length,ts:Date.now()});
    localStorage.setItem(key,JSON.stringify(historial));
    document.getElementById('ausenciaOk').style.display='flex';
    curso.value=''; document.getElementById('ausMotivo').value=''; document.getElementById('ausDescripcion').value='';
    selectedFiles=[]; renderFileList();
    showToast('Ausencia reportada correctamente','success'); loadAusencias();
});

async function init() {
    authHeader = getAuth() || btoa('demo@educat.edu.co:demo1234');
    setDate();
    currentUser    = MOCK.user;
    currentStudent = {...MOCK.student, user:currentUser};
    document.getElementById('sidebarUserName').textContent    = currentUser.name;
    document.getElementById('sidebarStudentCode').textContent = currentStudent.studentCode;
    await loadOverview();
    Promise.all([tryFetch('/api/users'), tryFetch('/api/students')]).then(([usersData,studentsData]) => {
        const email = getEmail()||MOCK.user.email;
        if(usersData&&usersData.length){const u=usersData.find(u=>u.email===email);if(u){currentUser=u;document.getElementById('sidebarUserName').textContent=currentUser.name;}}
        if(studentsData&&studentsData.length){const s=studentsData.find(s=>s.user&&s.user.id===currentUser.id);if(s){currentStudent=s;document.getElementById('sidebarStudentCode').textContent=currentStudent.studentCode;}}
    });
}

document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => navigateTo(btn.dataset.section)));
document.getElementById('menuToggle').addEventListener('click', () => { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebarOverlay').classList.toggle('show'); });
document.getElementById('sidebarOverlay').addEventListener('click', () => { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('show'); });
document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem('educat_auth'); localStorage.removeItem('educat_email'); sessionStorage.removeItem('educat_auth'); sessionStorage.removeItem('educat_email'); window.location.href='login.html'; });
document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);

init();