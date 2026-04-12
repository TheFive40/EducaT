const API = 'http://localhost:8080';
let authHeader = '';
let currentUser = null;
let currentTeacher = null;
let teacherCourses = [];
let currentCourse = null;
let currentUnitIdx = 0;
let currentSubmissionsActivityId = null;
let teacherForumReplyPanels = {};
const GRADE_SCALE_MAX = 10;
const DEFAULT_FORUM_PARTICIPATION_GRADE = 4.0;
const tableUiState = {
    grades: { page: 1, pageSize: 8, query: '' },
    students: { page: 1, pageSize: 8 },
    absences: { page: 1, pageSize: 5, query: '', status: 'all' },
    attendanceSummary: { page: 1, pageSize: 8, query: '' },
};

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
        { id: 1, course: { id: 1 }, title: 'Taller: Matrices y Determinantes', description: 'Resolver los ejercicios de matrices 3×3 del capítulo 2. Presenta el procedimiento completo con cada operación detallada paso a paso.\n\nCriterios de evaluación:\n• Procedimiento correcto: 50%\n• Resultados: 30%\n• Presentación: 20%', dueDate: '2025-04-15', allowLateSubmission: false, attachments: [{ name: 'Guía de Ejercicios Cap.2.pdf', type: 'pdf', url: '#' }], materials: [] },
        { id: 2, course: { id: 1 }, title: 'Taller: Derivadas Implícitas', description: 'Aplicación de reglas de derivación en funciones implícitas y paramétricas. Incluye resolución de problemas de optimización con justificación completa.', dueDate: '2025-04-22', allowLateSubmission: true, attachments: [], materials: [] },
        { id: 3, course: { id: 2 }, title: 'Ensayo Literario', description: 'Análisis temático y estilístico de "Cien años de soledad". Mínimo 3 páginas, máximo 5.', dueDate: '2025-04-18', allowLateSubmission: true, attachments: [{ name: 'Rúbrica de evaluación.pdf', type: 'pdf', url: '#' }], materials: [] },
        { id: 4, course: { id: 3 }, title: 'Informe de Laboratorio', description: 'Informe completo del experimento de reacciones ácido-base. Incluye: objetivo, marco teórico, materiales, procedimiento, tabla de datos y conclusiones.', dueDate: '2025-04-20', allowLateSubmission: false, attachments: [], materials: [] },
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

function modalDropAreaNoVideo(key, label) {
    return `<div class="file-drop-area" id="mdrop-${key}" style="padding:16px"
            ondragover="event.preventDefault();document.getElementById('mdrop-${key}').classList.add('drag-over')"
            ondragleave="document.getElementById('mdrop-${key}').classList.remove('drag-over')"
            ondrop="handleModalDrop(event,'${key}')">
        <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
               onchange="handleModalFile(event,'${key}')">
        <div class="file-drop-icon">
            <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </div>
        <div class="file-drop-text" style="font-size:13px">${label || 'Arrastra archivos o haz clic para seleccionar'}</div>
        <div class="file-drop-sub">Imágenes, PDF, Word, PowerPoint (sin video)</div>
    </div>
    <div class="file-list" id="mfiles-${key}" style="margin-top:8px"></div>`;
}

function parseYoutubeLinks(rawText) {
    return (rawText || '')
        .split(/\r?\n/)
        .map(x => x.trim())
        .filter(Boolean)
        .filter(x => /youtube\.com|youtu\.be/i.test(x))
        .map((url, idx) => ({ name: 'Video YouTube ' + (idx + 1), type: 'video', url }));
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

function setModalSize(size) {
    const modal = document.getElementById('modalDialog');
    if (!modal) return;
    modal.className = 'modal ' + (size === 'xl' ? 'modal-xl' : 'modal-lg');
}

function openModal(title, html, options = {}) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = html;
    setModalSize(options.size || 'lg');
    document.getElementById('modalBackdrop').classList.add('show');
}

function closeModal() {
    document.getElementById('modalBackdrop').classList.remove('show');
    setModalSize('lg');
}

function openConfirmModal(title, message, onConfirm, confirmLabel) {
    openModal(title || 'Confirmar', `
        <div style="font-size:13.5px;color:var(--text-body);line-height:1.7;margin-bottom:14px">${message || ''}</div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-danger" onclick="runConfirmModalAction()">${confirmLabel || 'Confirmar'}</button>
        </div>`);
    window.__educatConfirmAction = typeof onConfirm === 'function' ? onConfirm : null;
}

function runConfirmModalAction() {
    const action = window.__educatConfirmAction;
    window.__educatConfirmAction = null;
    closeModal();
    if (typeof action === 'function') action();
}

const trtState = {
    savedRangeByEditor: {},
    activeImageByEditor: {},
    draggedImage: null,
};

function buildRichEditorHtml(editorId, minHeight) {
    return `<div class="trt-editor-shell">
        <div class="trt-toolbar" onmousedown="trtToolbarMouseDown('${editorId}',event)">
            <div class="trt-toolbar-group">
                <select class="form-input trt-select" onchange="trtSetBlock('${editorId}',this.value)">
                    <option value="P">Parrafo</option><option value="H2">Titulo 1</option><option value="H3">Titulo 2</option><option value="H4">Titulo 3</option><option value="BLOCKQUOTE">Cita</option>
                </select>
                <select class="form-input trt-select" onchange="trtSetFont('${editorId}',this.value)">
                    <option value="Calibri">Calibri</option><option value="Jost">Jost</option><option value="Arial">Arial</option><option value="Georgia">Georgia</option>
                </select>
                <select class="form-input trt-select trt-size-select" onchange="trtSetFontSize('${editorId}',this.value)">
                    <option value="2">Pequena</option><option value="3" selected>Normal</option><option value="4">Grande</option><option value="5">Muy grande</option>
                </select>
            </div>
            <span class="trt-sep"></span>
            <div class="trt-toolbar-group">
                <button class="trt-btn" type="button" title="Negrita" onclick="trtCmd('${editorId}','bold')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h8a4 4 0 010 8H6z"/><path d="M6 12h9a4 4 0 010 8H6z"/></svg></button>
                <button class="trt-btn" type="button" title="Cursiva" onclick="trtCmd('${editorId}','italic')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg></button>
                <button class="trt-btn" type="button" title="Subrayado" onclick="trtCmd('${editorId}','underline')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4v6a6 6 0 0012 0V4"/><line x1="4" y1="20" x2="20" y2="20"/></svg></button>
                <button class="trt-btn" type="button" title="Tachado" onclick="trtCmd('${editorId}','strikeThrough')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><path d="M16 6a4 4 0 00-4-2 4 4 0 00-4 4c0 4 8 2 8 6a4 4 0 01-4 4 4 4 0 01-4-2"/></svg></button>
                <button class="trt-btn" type="button" title="Superindice" onclick="trtCmd('${editorId}','superscript')">X<sup>2</sup></button>
                <button class="trt-btn" type="button" title="Subindice" onclick="trtCmd('${editorId}','subscript')">X<sub>2</sub></button>
            </div>
            <span class="trt-sep"></span>
            <div class="trt-toolbar-group">
                <button class="trt-btn" type="button" title="Lista con viñetas" onclick="trtCmd('${editorId}','insertUnorderedList')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="6" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="18" r="1"/><line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/></svg></button>
                <button class="trt-btn" type="button" title="Lista numerada" onclick="trtCmd('${editorId}','insertOrderedList')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M4 14h2l-2 4h2"/><line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/></svg></button>
                <button class="trt-btn" type="button" title="Reducir sangria" onclick="trtCmd('${editorId}','outdent')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/><polyline points="7 8 4 11 7 14"/></svg></button>
                <button class="trt-btn" type="button" title="Aumentar sangria" onclick="trtCmd('${editorId}','indent')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/><polyline points="4 8 7 11 4 14"/></svg></button>
            </div>
            <span class="trt-sep"></span>
            <div class="trt-toolbar-group">
                <button class="trt-btn" type="button" title="Alinear izquierda" onclick="trtCmd('${editorId}','justifyLeft')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg></button>
                <button class="trt-btn" type="button" title="Centrar" onclick="trtCmd('${editorId}','justifyCenter')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg></button>
                <button class="trt-btn" type="button" title="Alinear derecha" onclick="trtCmd('${editorId}','justifyRight')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg></button>
                <button class="trt-btn" type="button" title="Justificar" onclick="trtCmd('${editorId}','justifyFull')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg></button>
            </div>
            <span class="trt-sep"></span>
            <div class="trt-toolbar-group">
                <button class="trt-btn" type="button" title="Enlace" onclick="trtInsertLink('${editorId}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 10-7.07-7.07L11 5"/><path d="M14 11a5 5 0 00-7.07 0L4.1 13.83a5 5 0 107.07 7.07L13 19"/></svg></button>
                <button class="trt-btn" type="button" title="Quitar enlace" onclick="trtUnlink('${editorId}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 7l-10 10"/><path d="M7 7h5a5 5 0 013 8"/><path d="M17 17h-5a5 5 0 01-3-8"/></svg></button>
                <button class="trt-btn" type="button" title="Insertar imagen" onclick="trtInsertImageLink('${editorId}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M21 16l-5-5-4 4-2-2-7 7"/></svg></button>
                <button class="trt-btn" type="button" title="Insertar linea" onclick="trtCmd('${editorId}','insertHorizontalRule')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="12" x2="20" y2="12"/></svg></button>
            </div>
            <span class="trt-sep"></span>
            <div class="trt-toolbar-group">
                <label class="trt-color-wrap" title="Color de texto"><span class="trt-color-label">A</span><input class="trt-color" type="color" value="#0b1f3a" onchange="trtApplyForeColor('${editorId}',this.value)"></label>
                <label class="trt-color-wrap" title="Resaltado"><span class="trt-color-label">Res</span><input class="trt-color" type="color" value="#fff3a0" onchange="trtApplyHighlightColor('${editorId}',this.value)"></label>
                <button class="trt-btn" type="button" title="Imagen izquierda" onclick="trtImageAlign('${editorId}','left')">Img L</button>
                <button class="trt-btn" type="button" title="Imagen centrada" onclick="trtImageAlign('${editorId}','center')">Img C</button>
                <button class="trt-btn" type="button" title="Imagen derecha" onclick="trtImageAlign('${editorId}','right')">Img R</button>
                <button class="trt-btn" type="button" title="Quitar imagen seleccionada" onclick="trtRemoveActiveImage('${editorId}')">Quitar Img</button>
            </div>
            <span class="trt-sep"></span>
            <div class="trt-toolbar-group">
                <button class="trt-btn" type="button" title="Deshacer" onclick="trtCmd('${editorId}','undo')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 14L4 9l5-5"/><path d="M20 20a8 8 0 00-8-8H4"/></svg></button>
                <button class="trt-btn" type="button" title="Rehacer" onclick="trtCmd('${editorId}','redo')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 14l5-5-5-5"/><path d="M4 20a8 8 0 018-8h8"/></svg></button>
                <button class="trt-btn" type="button" title="Limpiar formato" onclick="trtCmd('${editorId}','removeFormat')">Limpiar</button>
            </div>
        </div>
        <div id="${editorId}" class="rich-editor-content" contenteditable="true" style="min-height:${(minHeight || 120)}px" onfocus="trtEnsureEditor('${editorId}')"></div>
    </div>`;
}

function trtFocus(editorId) {
    trtEnsureEditor(editorId);
    const el = document.getElementById(editorId);
    if (el) el.focus();
}
function trtToolbarMouseDown(editorId, ev) {
    if (ev) {
        const target = ev.target;
        const allowNative = !!(target && target.closest && (target.closest('select') || target.closest('input') || target.closest('option') || target.closest('label')));
        if (!allowNative) ev.preventDefault();
    }
    trtRestoreSelection(editorId);
}
function trtEnsureEditor(editorId) {
    const el = document.getElementById(editorId);
    if (!el || el.dataset.trtReady === '1') return;
    el.dataset.trtReady = '1';
    ['mouseup', 'keyup', 'focus', 'input'].forEach(evt => {
        el.addEventListener(evt, () => trtSaveSelection(editorId));
    });
    el.addEventListener('click', ev => {
        const wrap = ev.target.closest('.trt-image-wrap');
        trtSelectImage(editorId, wrap || null);
        trtSaveSelection(editorId);
    });
    el.addEventListener('dragstart', ev => {
        const wrap = ev.target.closest('.trt-image-wrap');
        if (!wrap) return;
        trtState.draggedImage = wrap;
        if (ev.dataTransfer) {
            ev.dataTransfer.effectAllowed = 'move';
            ev.dataTransfer.setData('text/plain', 'img-move');
        }
    });
    el.addEventListener('dragover', ev => {
        if (!trtState.draggedImage) return;
        ev.preventDefault();
    });
    el.addEventListener('drop', ev => {
        if (!trtState.draggedImage) return;
        ev.preventDefault();
        const range = trtRangeFromPoint(ev.clientX, ev.clientY);
        if (range) {
            range.collapse(true);
            range.insertNode(trtState.draggedImage);
            trtState.draggedImage = null;
            trtSaveSelection(editorId);
        }
    });
    el.addEventListener('dragend', () => { trtState.draggedImage = null; });
}
function trtRangeFromPoint(x, y) {
    if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
    if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(x, y);
        if (pos) {
            const range = document.createRange();
            range.setStart(pos.offsetNode, pos.offset);
            return range;
        }
    }
    return null;
}
function trtSaveSelection(editorId) {
    const el = document.getElementById(editorId);
    const sel = window.getSelection();
    if (!el || !sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (el.contains(range.commonAncestorContainer)) {
        trtState.savedRangeByEditor[editorId] = range.cloneRange();
    }
}
function trtRestoreSelection(editorId) {
    const el = document.getElementById(editorId);
    const range = trtState.savedRangeByEditor[editorId];
    if (!el) return;
    el.focus();
    if (!range) return;
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
}
function trtCmd(editorId, cmd) {
    trtFocus(editorId);
    trtRestoreSelection(editorId);
    document.execCommand(cmd, false, null);
    trtSaveSelection(editorId);
}
function trtSetBlock(editorId, tag) { trtFocus(editorId); trtRestoreSelection(editorId); document.execCommand('formatBlock', false, tag); trtSaveSelection(editorId); }
function trtSetFont(editorId, font) { trtFocus(editorId); trtRestoreSelection(editorId); document.execCommand('fontName', false, font); trtSaveSelection(editorId); }
function trtSetFontSize(editorId, size) { trtFocus(editorId); trtRestoreSelection(editorId); document.execCommand('fontSize', false, size); trtSaveSelection(editorId); }
function trtApplyForeColor(editorId, color) { if (!color) return; trtFocus(editorId); trtRestoreSelection(editorId); document.execCommand('foreColor', false, color); trtSaveSelection(editorId); }
function trtApplyHighlightColor(editorId, color) { if (!color) return; trtFocus(editorId); trtRestoreSelection(editorId); document.execCommand('hiliteColor', false, color); trtSaveSelection(editorId); }
function trtUnlink(editorId) { trtFocus(editorId); trtRestoreSelection(editorId); document.execCommand('unlink', false, null); trtSaveSelection(editorId); }
function trtPickColor(editorId) {
    trtSaveSelection(editorId);
    trtOpenMiniDialog('Color de texto', `<div class="form-group" style="margin-bottom:12px"><label class="form-label" for="trtColorInput">Selecciona color</label><input type="color" class="form-input" id="trtColorInput" value="#0b1f3a" style="height:44px;padding:6px"></div><button class="btn btn-teal" style="width:100%" onclick="trtApplyColor('${editorId}')">Aplicar color</button>`);
}
function trtInsertImageLink(editorId) {
    trtSaveSelection(editorId);
    trtOpenMiniDialog('Insertar imagen', `<div class="form-group"><label class="form-label" for="trtImgUrl">URL de imagen</label><input type="url" class="form-input" id="trtImgUrl" placeholder="https://..."></div><div class="form-group"><label class="form-label" for="trtImgAlt">Texto alternativo</label><input type="text" class="form-input" id="trtImgAlt" placeholder="Descripcion de la imagen"></div><button class="btn btn-teal" style="width:100%" onclick="trtApplyImage('${editorId}')">Insertar imagen</button><div style="margin-top:10px;font-size:12px;color:var(--text-muted)">Tip: luego puedes arrastrar la imagen para reubicarla.</div>`);
}
function trtInsertLink(editorId) {
    trtSaveSelection(editorId);
    trtOpenMiniDialog('Insertar enlace', `<div class="form-group"><label class="form-label" for="trtLinkUrl">URL</label><input type="url" class="form-input" id="trtLinkUrl" placeholder="https://..."></div><div class="form-group"><label class="form-label" for="trtLinkText">Texto (opcional)</label><input type="text" class="form-input" id="trtLinkText" placeholder="Texto visible"></div><button class="btn btn-teal" style="width:100%" onclick="trtApplyLink('${editorId}')">Insertar enlace</button>`);
}
function trtPickHighlight(editorId) {
    trtSaveSelection(editorId);
    trtOpenMiniDialog('Resaltado', `<div class="form-group" style="margin-bottom:12px"><label class="form-label" for="trtHighlightInput">Color de resaltado</label><input type="color" class="form-input" id="trtHighlightInput" value="#fff3a0" style="height:44px;padding:6px"></div><button class="btn btn-teal" style="width:100%" onclick="trtApplyHighlight('${editorId}')">Aplicar resaltado</button>`);
}
function trtOpenMiniDialog(title, bodyHtml) {
    trtCloseMiniDialog();
    const host = document.createElement('div');
    host.id = 'trtMiniDialog';
    host.className = 'trt-mini-backdrop';
    host.innerHTML = `<div class="trt-mini-modal"><div class="trt-mini-header"><span class="trt-mini-title">${title}</span><button class="trt-mini-close" type="button" onclick="trtCloseMiniDialog()">x</button></div><div class="trt-mini-body">${bodyHtml}</div></div>`;
    document.body.appendChild(host);
}
function trtCloseMiniDialog() {
    const prev = document.getElementById('trtMiniDialog');
    if (prev) prev.remove();
}
function trtApplyColor(editorId) {
    const color = (document.getElementById('trtColorInput') || {}).value;
    if (!color) return;
    trtFocus(editorId);
    trtRestoreSelection(editorId);
    document.execCommand('foreColor', false, color);
    trtCloseMiniDialog();
    trtSaveSelection(editorId);
}
function trtApplyHighlight(editorId) {
    const color = (document.getElementById('trtHighlightInput') || {}).value;
    if (!color) return;
    trtFocus(editorId);
    trtRestoreSelection(editorId);
    document.execCommand('hiliteColor', false, color);
    trtCloseMiniDialog();
    trtSaveSelection(editorId);
}
function trtApplyLink(editorId) {
    const urlEl = document.getElementById('trtLinkUrl');
    const txtEl = document.getElementById('trtLinkText');
    const url = (urlEl ? urlEl.value : '').trim();
    if (!url) { showToast('Ingresa una URL valida', 'error'); return; }
    trtFocus(editorId);
    trtRestoreSelection(editorId);
    const selectedText = (window.getSelection() || {}).toString ? window.getSelection().toString().trim() : '';
    const visibleText = (txtEl ? txtEl.value : '').trim();
    if (!selectedText && visibleText) document.execCommand('insertText', false, visibleText);
    document.execCommand('createLink', false, url);
    trtCloseMiniDialog();
    trtSaveSelection(editorId);
}
function trtApplyImage(editorId) {
    const url = ((document.getElementById('trtImgUrl') || {}).value || '').trim();
    const alt = ((document.getElementById('trtImgAlt') || {}).value || '').trim();
    if (!url) { showToast('Ingresa la URL de la imagen', 'error'); return; }
    trtFocus(editorId);
    trtRestoreSelection(editorId);
    const sel = window.getSelection();
    let range = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
    if (!range) {
        const editor = document.getElementById(editorId);
        range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
    }
    const wrap = document.createElement('span');
    wrap.className = 'trt-image-wrap';
    wrap.setAttribute('contenteditable', 'false');
    wrap.setAttribute('draggable', 'true');
    wrap.innerHTML = `<img src="${url}" alt="${alt || 'imagen'}" style="max-width:100%;height:auto;display:block;border-radius:8px"><span class="trt-image-grip" title="Arrastra para mover">::</span>`;
    range.insertNode(wrap);
    const spacer = document.createTextNode(' ');
    wrap.after(spacer);
    range.setStartAfter(spacer);
    range.collapse(true);
    if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
    }
    trtCloseMiniDialog();
    trtSelectImage(editorId, wrap);
    trtSaveSelection(editorId);
}
function trtSelectImage(editorId, wrap) {
    const editor = document.getElementById(editorId);
    if (!editor) return;
    editor.querySelectorAll('.trt-image-wrap.active').forEach(el => el.classList.remove('active'));
    if (wrap) {
        wrap.classList.add('active');
        trtState.activeImageByEditor[editorId] = wrap;
    } else {
        trtState.activeImageByEditor[editorId] = null;
    }
}
function trtImageAlign(editorId, align) {
    const imgWrap = trtState.activeImageByEditor[editorId];
    if (!imgWrap) { showToast('Selecciona una imagen primero', 'error'); return; }
    imgWrap.style.display = 'block';
    imgWrap.style.float = 'none';
    imgWrap.style.margin = '10px 0';
    if (align === 'left') imgWrap.style.marginRight = 'auto';
    if (align === 'center') imgWrap.style.margin = '10px auto';
    if (align === 'right') imgWrap.style.marginLeft = 'auto';
}
function trtRemoveActiveImage(editorId) {
    const imgWrap = trtState.activeImageByEditor[editorId];
    if (!imgWrap) { showToast('Selecciona una imagen primero', 'error'); return; }
    imgWrap.remove();
    trtState.activeImageByEditor[editorId] = null;
}
function trtGetHtml(editorId) {
    const el = document.getElementById(editorId);
    return el ? el.innerHTML.trim() : '';
}

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

function clampGrade(value) {
    const n = parseFloat(value);
    if (isNaN(n)) return 0;
    return Math.max(0, Math.min(GRADE_SCALE_MAX, n));
}

function clampPercent(value) {
    const n = parseFloat(value);
    if (isNaN(n)) return 0;
    return Math.max(0, Math.min(100, n));
}

function fmtGrade(value) {
    return clampGrade(value).toFixed(1);
}

function getUnitPartialScores(courseId, unitId) {
    try { return JSON.parse(localStorage.getItem('educat_unit_partial_' + courseId + '_' + unitId) || '{}'); } catch (e) { return {}; }
}

function saveUnitPartialScores(courseId, unitId, scores) {
    localStorage.setItem('educat_unit_partial_' + courseId + '_' + unitId, JSON.stringify(scores || {}));
}

function getForumParticipantStudentId(msg) {
    if (!msg) return null;
    if (msg.studentId) return parseInt(msg.studentId, 10) || null;
    const byName = MOCK.students.find(s => (s.user && s.user.name) === msg.authorName);
    return byName ? byName.id : null;
}

function splitStudentName(fullName) {
    const clean = (fullName || '').trim().replace(/\s+/g, ' ');
    if (!clean) return { firstName: '', lastName: '' };
    const parts = clean.split(' ');
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    return { firstName: parts.slice(0, Math.ceil(parts.length / 2)).join(' '), lastName: parts.slice(Math.ceil(parts.length / 2)).join(' ') };
}

function getStudentIdByName(name) {
    const byName = MOCK.students.find(s => (s.user && s.user.name) === name);
    return byName ? byName.id : null;
}

function getForumParticipants(forum) {
    const map = {};
    (forum && forum.messages ? forum.messages : []).forEach(msg => {
        if ((msg.authorRole || '').toLowerCase() !== 'estudiante') return;
        const studentId = getForumParticipantStudentId(msg);
        if (!studentId || map[studentId]) return;
        const student = MOCK.students.find(s => s.id === studentId);
        if (student) map[studentId] = student;
    });
    return Object.values(map);
}

function ensureForumGradingDefaults(forum) {
    forum.grading = forum.grading || {};
    if (!forum.grading.type) forum.grading.type = 'real';
    if (!forum.grading.defaultGrade && forum.grading.defaultGrade !== 0) forum.grading.defaultGrade = Math.min(DEFAULT_FORUM_PARTICIPATION_GRADE, GRADE_SCALE_MAX);
    if (!forum.grading.weightPercent && forum.grading.weightPercent !== 0) forum.grading.weightPercent = 10;
    if (!forum.grading.bonusMode) forum.grading.bonusMode = 'decimas';
    if (!forum.grading.bonusValue && forum.grading.bonusValue !== 0) forum.grading.bonusValue = 0.3;
    forum.participantGrades = forum.participantGrades || {};
    const defaultGrade = clampGrade(forum.grading.defaultGrade);
    getForumParticipants(forum).forEach(stu => {
        if (forum.participantGrades[stu.id] === undefined || forum.participantGrades[stu.id] === null || forum.participantGrades[stu.id] === '') {
            forum.participantGrades[stu.id] = defaultGrade;
        }
    });
}

function ensureGlossaryDefaults(glossary) {
    glossary.grading = glossary.grading || {};
    if (!glossary.grading.type) glossary.grading.type = 'none';
    if (!glossary.grading.defaultGrade && glossary.grading.defaultGrade !== 0) glossary.grading.defaultGrade = Math.min(DEFAULT_FORUM_PARTICIPATION_GRADE, GRADE_SCALE_MAX);
    if (!glossary.grading.weightPercent && glossary.grading.weightPercent !== 0) glossary.grading.weightPercent = 10;
    if (!glossary.grading.bonusMode) glossary.grading.bonusMode = 'decimas';
    if (!glossary.grading.bonusValue && glossary.grading.bonusValue !== 0) glossary.grading.bonusValue = 0.3;
    glossary.participantGrades = glossary.participantGrades || {};
    glossary.terms = glossary.terms || [];
    const defaultGrade = clampGrade(glossary.grading.defaultGrade);
    glossary.terms.forEach(term => {
        const sid = term.studentId || getStudentIdByName(term.authorName || '');
        if (!sid) return;
        if (glossary.participantGrades[sid] === undefined || glossary.participantGrades[sid] === null || glossary.participantGrades[sid] === '') {
            glossary.participantGrades[sid] = defaultGrade;
        }
    });
}

function ensureUnitGlossaries(unit) {
    unit.glossaries = unit.glossaries || [];
    const legacyTerms = Array.isArray(unit.glossaryTerms) ? unit.glossaryTerms : [];
    if (!unit.glossaries.length) {
        unit.glossaries.push({
            id: 'gls-' + Date.now(),
            title: 'Glosario general',
            terms: legacyTerms,
            grading: {
                type: unit.glossaryGrading && unit.glossaryGrading.type ? unit.glossaryGrading.type : 'none',
                defaultGrade: unit.glossaryGrading && unit.glossaryGrading.defaultGrade !== undefined ? unit.glossaryGrading.defaultGrade : Math.min(DEFAULT_FORUM_PARTICIPATION_GRADE, GRADE_SCALE_MAX),
                weightPercent: unit.glossaryGrading && unit.glossaryGrading.weightPercent !== undefined ? unit.glossaryGrading.weightPercent : 10,
                bonusMode: unit.glossaryGrading && unit.glossaryGrading.bonusMode ? unit.glossaryGrading.bonusMode : 'decimas',
                bonusValue: unit.glossaryGrading && unit.glossaryGrading.bonusValue !== undefined ? unit.glossaryGrading.bonusValue : 0.3
            },
            participantGrades: unit.glossaryParticipantGrades || {}
        });
    } else if (legacyTerms.length) {
        const base = unit.glossaries[0];
        const existingIds = new Set((base.terms || []).map(t => String(t.id)));
        legacyTerms.forEach(t => {
            if (!existingIds.has(String(t.id))) {
                base.terms.push(t);
                existingIds.add(String(t.id));
            }
        });
    }
    unit.glossaries.forEach(g => ensureGlossaryDefaults(g));
    return unit.glossaries;
}

function getGlossaryParticipants(glossary) {
    const map = {};
    (glossary.terms || []).forEach(term => {
        const sid = term.studentId || getStudentIdByName(term.authorName || '');
        if (!sid || map[sid]) return;
        const st = MOCK.students.find(s => s.id === sid);
        if (st) map[sid] = st;
    });
    return Object.values(map);
}

function getAdminGradingConfig() {
    const normalizeMode = (value) => {
        const map = {
            '': '',
            simple: 'simple-average',
            weighted: 'category-global',
            'period-weighted': 'category-global',
            'global-weight': 'category-global',
            'item-individual': 'item-individual',
            'simple-average': 'simple-average',
            'category-global': 'category-global',
            none: 'none'
        };
        return map[value] !== undefined ? map[value] : '';
    };
    const defaults = {
        allowTeacherCustom: true,
        forcedModel: '',
        selectedMethod: 'category-global',
        examMinPercent: 0,
        examMaxPercent: 100
    };
    try {
        const raw = JSON.parse(localStorage.getItem('educat_admin_grade_policy') || '{}');
        return {
            allowTeacherCustom: raw.allowTeacherCustom !== false,
            forcedModel: normalizeMode(raw.forcedModel || ''),
            selectedMethod: normalizeMode(raw.selectedMethod || '') || defaults.selectedMethod,
            examMinPercent: clampPercent(raw.examMinPercent !== undefined ? raw.examMinPercent : defaults.examMinPercent),
            examMaxPercent: clampPercent(raw.examMaxPercent !== undefined ? raw.examMaxPercent : defaults.examMaxPercent)
        };
    } catch (e) {
        return defaults;
    }
}

function upsertTeacherGradeRecord(courseId, student, grade, description, sourceUnitId) {
    const existing = MOCK.grades.find(g => g.course && g.course.id === courseId && g.student && g.student.id === student.id && g.sourceUnitId === sourceUnitId);
    const payload = {
        student: { id: student.id, studentCode: student.studentCode, user: { name: student.user.name } },
        course: { id: courseId },
        grade: clampGrade(grade),
        description,
        sourceUnitId,
        source: 'unit-final'
    };
    if (existing) Object.assign(existing, payload);
    else MOCK.grades.push({ id: Date.now() + Math.floor(Math.random() * 1000), ...payload });
}

function getStoredCourseActivities(courseId) {
    try { return JSON.parse(localStorage.getItem('educat_course_activities_' + courseId) || '[]'); } catch (e) { return []; }
}
function saveStoredCourseActivities(courseId, items) {
    localStorage.setItem('educat_course_activities_' + courseId, JSON.stringify(items || []));
}
function getStoredCourseExams(courseId) {
    try { return JSON.parse(localStorage.getItem('educat_course_exams_' + courseId) || '[]'); } catch (e) { return []; }
}
function saveStoredCourseExams(courseId, items) {
    localStorage.setItem('educat_course_exams_' + courseId, JSON.stringify(items || []));
}
function getCourseActivitiesMerged(courseId) {
    const base = MOCK.activities.filter(a => a.course && a.course.id === courseId);
    const stored = getStoredCourseActivities(courseId);
    if (!stored.length) return base;
    const map = {};
    base.forEach(a => { map[String(a.id)] = a; });
    stored.forEach(a => { map[String(a.id)] = a; });
    return Object.values(map);
}
function getCourseExamsMerged(courseId) {
    const base = MOCK.exams.filter(x => x.course && x.course.id === courseId);
    const stored = getStoredCourseExams(courseId);
    if (!stored.length) return base;
    const map = {};
    base.forEach(x => { map[String(x.id)] = x; });
    stored.forEach(x => { map[String(x.id)] = x; });
    return Object.values(map);
}
function getAllActivitiesMerged() {
    const ids = (teacherCourses.length ? teacherCourses : MOCK.courses).map(c => c.id);
    return ids.flatMap(id => getCourseActivitiesMerged(id));
}
function getAllExamsMerged() {
    const ids = (teacherCourses.length ? teacherCourses : MOCK.courses).map(c => c.id);
    return ids.flatMap(id => getCourseExamsMerged(id));
}

function getActivityById(actId) {
    const all = getAllActivitiesMerged();
    return all.find(a => String(a.id) === String(actId)) || null;
}

function getActivityDeadline(act) {
    if (!act) return null;
    if (act.dueDateTime) return new Date(act.dueDateTime);
    if (!act.dueDate) return null;
    const t = act.dueTime || '23:59';
    return new Date(act.dueDate + 'T' + t + ':59');
}

function isSubmissionLate(act, sub) {
    if (!act || !sub || !sub.submittedAt) return false;
    if (sub.isLate === true) return true;
    const deadline = getActivityDeadline(act);
    if (!deadline) return false;
    return new Date(sub.submittedAt) > deadline;
}

function saveStudentGrade(studentId, actId, grade, feedback) {
    const existing = getStudentSubmission(studentId, actId) || {};
    localStorage.setItem('educat_sub_' + studentId + '_' + actId, JSON.stringify({ ...existing, graded: true, grade: clampGrade(grade), feedback, gradedAt: new Date().toISOString() }));
}

function getPendingSubmissionsCount() {
    let count = 0;
    getAllActivitiesMerged().forEach(a => MOCK.students.forEach(s => {
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
    const statusFilter = document.getElementById('subStatusFilter');
    if (statusFilter && !statusFilter.querySelector('option[value="late"]')) {
        statusFilter.insertAdjacentHTML('beforeend', '<option value="late">Entregas tardias</option>');
    }
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
            const isLate = isSubmissionLate(act, sub);
            const state = !sub || !sub.submitted ? 'none' : sub.graded ? 'graded' : 'pending';
            return { student: s, sub, state, isLate };
        }).filter(r => {
            if (!status) return true;
            if (status === 'none') return r.state === 'none';
            if (status === 'late') return r.state !== 'none' && r.isLate;
            return r.state === status;
        });
        if (!rows.length) return;
        const pend = rows.filter(r => r.state === 'pending').length;
        const grad = rows.filter(r => r.state === 'graded').length;
        const miss = rows.filter(r => r.state === 'none').length;
        const late = rows.filter(r => r.isLate).length;
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
    ${late > 0 ? `<span class="badge badge-warning">${late} tardias</span>` : ''}
</div>
<button class="btn btn-sm btn-teal" onclick="openActivitySubmissions(${act.id},null,'submitted')">
    <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    Calificar
</button>
</div>
${rows.map(r => renderEntregaRow(r.student, r.sub, r.state, act.id, r.isLate)).join('')}
</div>`;
    });
    container.innerHTML = html || '<div class="empty-state"><div class="empty-state-title">Sin entregas</div><div class="empty-state-text">No hay entregas que coincidan con los filtros.</div></div>';
}

function renderEntregaRow(student, sub, state, actId, isLate) {
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
${isLate ? '<div style="flex-shrink:0"><span class="badge badge-warning">Con retraso</span></div>' : ''}
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

function openActivitySubmissions(actId, courseIdFallback, defaultFilter) {
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
    document.getElementById('submissionsFilter').value = defaultFilter || 'all';
    renderSubmissionsList();
}

function renderSubmissionsList() {
    const actId = currentSubmissionsActivityId;
    const act = getActivityById(actId);
    const filterSel = document.getElementById('submissionsFilter');
    if (filterSel && !filterSel.querySelector('option[value="late"]')) {
        filterSel.insertAdjacentHTML('beforeend', '<option value="late">Con retraso</option>');
    }
    if (filterSel && !filterSel.querySelector('option[value="submitted"]')) {
        filterSel.insertAdjacentHTML('beforeend', '<option value="submitted">Enviados</option>');
    }
    const filter = filterSel.value;
    const rows = MOCK.students.map(s => {
        const sub = getStudentSubmission(s.id, actId);
        const state = !sub || !sub.submitted ? 'missing' : sub.graded ? 'graded' : 'pending';
        const isLate = isSubmissionLate(act, sub);
        return { student: s, sub, state, isLate };
    }).filter(r => {
        if (filter === 'all') return true;
        if (filter === 'late') return r.isLate;
        if (filter === 'submitted') return r.state !== 'missing';
        return r.state === filter;
    });
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
        const { student, sub, state, isLate } = r;
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
                    <div class="submission-status-info"><div class="submission-status-label">Entrega recibida</div><div class="submission-status-detail">Enviado el ${dateStr}${isLate ? ' · Con retraso' : ''}</div></div>
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
            <div class="attachment-list">${sub.files.map((f, fileIdx) => {
                const hasSrc = !!(f.dataUrl || f.url);
                return `<div class="attachment-item"><div class="attachment-icon doc">${IFILE}</div><span class="attachment-name">${f.name}</span><span class="attachment-meta">${(f.size / 1024).toFixed(0)} KB</span><button class="attachment-download" ${hasSrc ? `onclick="previewSubmissionFile(${student.id},${actId},${fileIdx})"` : 'disabled'}>${hasSrc ? 'Previsualizar' : 'Sin vista'}</button><button class="attachment-download" ${hasSrc ? `onclick="downloadSubmissionFile(${student.id},${actId},${fileIdx})"` : 'disabled'}>${hasSrc ? 'Descargar' : 'Sin descarga'}</button></div>`;
            }).join('')}</div>
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
                        ${isLate ? '<span class="badge badge-warning">Con retraso</span>' : ''}
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

function previewSubmissionFile(studentId, actId, fileIdx) {
    const sub = getStudentSubmission(studentId, actId);
    if (!sub || !sub.files || !sub.files[fileIdx]) return;
    const file = sub.files[fileIdx];
    const src = file.dataUrl || file.url;
    if (!src) { showToast('Este archivo no tiene vista previa disponible.', 'error'); return; }
    const isImage = (file.type || '').startsWith('image/') || /^data:image\//.test(src);
    const isPdf = (file.type || '').includes('pdf') || /^data:application\/pdf/.test(src) || (file.name || '').toLowerCase().endsWith('.pdf');
    const viewer = isImage
        ? `<img src="${src}" alt="Soporte" style="max-width:100%;border-radius:8px;border:1px solid rgba(11,31,58,0.08)">`
        : isPdf
            ? `<iframe src="${src}" style="width:100%;height:62vh;border:1px solid rgba(11,31,58,0.1);border-radius:8px"></iframe>`
            : `<div style="font-size:13px;color:var(--text-muted)">No hay vista integrada para este tipo de archivo. Usa descargar.</div>`;
    openModal('Archivo: ' + (file.name || 'entrega'), `${viewer}<div style="margin-top:10px"><button class="btn btn-teal" onclick="downloadSubmissionFile(${studentId},${actId},${fileIdx})">Descargar</button></div>`);
}

function downloadSubmissionFile(studentId, actId, fileIdx) {
    const sub = getStudentSubmission(studentId, actId);
    if (!sub || !sub.files || !sub.files[fileIdx]) return;
    const file = sub.files[fileIdx];
    const src = file.dataUrl || file.url;
    if (!src) { showToast('Archivo sin URL de descarga.', 'error'); return; }
    const a = document.createElement('a');
    a.href = src;
    a.download = file.name || 'entrega';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
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
    const files = existing && Array.isArray(existing.files) ? existing.files : [];
    const comment = existing && existing.comment ? existing.comment : '';
    openModal('Calificar — ' + student.user.name, `
        <div style="background:var(--cream);border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:13px;color:var(--text-muted)">
            <strong style="color:var(--text-dark)">${act.title}</strong> · ${student.studentCode}
        </div>
        ${comment ? `<div class="form-group"><label class="form-label">Comentario del estudiante</label><div style="background:var(--cream);border-radius:8px;padding:12px 14px;border-left:3px solid var(--gold);font-size:13px;color:var(--text-body);line-height:1.65;white-space:pre-line">${comment}</div></div>` : ''}
        ${files.length ? `<div class="form-group"><label class="form-label">Archivos enviados</label><div class="attachment-list">${files.map((f, fileIdx) => {
            const hasSrc = !!(f.dataUrl || f.url);
            return `<div class="attachment-item"><div class="attachment-icon doc"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><span class="attachment-name">${f.name}</span><span class="attachment-meta">${f.size ? (f.size/1024).toFixed(0) + ' KB' : ''}</span><button class="attachment-download" ${hasSrc ? `onclick="previewSubmissionFile(${studentId},${actId},${fileIdx})"` : 'disabled'}>${hasSrc ? 'Previsualizar' : 'Sin vista'}</button><button class="attachment-download" ${hasSrc ? `onclick="downloadSubmissionFile(${studentId},${actId},${fileIdx})"` : 'disabled'}>${hasSrc ? 'Descargar' : 'Sin descarga'}</button></div>`;
        }).join('')}</div></div>` : ''}
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
    sel.onchange = () => { tableUiState.grades.page = 1; renderGrades(parseInt(sel.value)); };
    document.getElementById('gradesSummaryBar').style.display = 'none';
}

function renderGrades(courseId) {
    const container = document.getElementById('calificacionesContainer');
    const state = tableUiState.grades;
    if (!courseId) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Selecciona un curso</div></div>';
        document.getElementById('gradesSummaryBar').style.display = 'none';
        return;
    }
    const allCourseGrades = MOCK.grades.filter(g => g.course && g.course.id === courseId);
    const query = (state.query || '').trim().toLowerCase();
    let courseGrades = [...allCourseGrades];
    if (query) {
        courseGrades = courseGrades.filter(g => {
            const studentName = g.student && g.student.user ? g.student.user.name : '';
            const code = g.student && g.student.studentCode ? g.student.studentCode : '';
            const desc = g.description || '';
            return studentName.toLowerCase().includes(query) || code.toLowerCase().includes(query) || desc.toLowerCase().includes(query);
        });
    }
    if (!courseGrades.length) {
        container.innerHTML = `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px"><input class="form-input" id="gradeSearchInput" placeholder="Filtrar por estudiante, código o descripción" style="max-width:360px"></div><div class="empty-state"><div class="empty-state-title">Sin calificaciones registradas</div><div class="empty-state-text">Agrega la primera calificación con el botón "Agregar Nota".</div></div>`;
        const searchEl = document.getElementById('gradeSearchInput');
        if (searchEl) {
            searchEl.value = state.query || '';
            searchEl.oninput = () => { state.query = searchEl.value; state.page = 1; renderGrades(courseId); };
        }
        document.getElementById('gradesSummaryBar').style.display = 'none';
        return;
    }
    const vals = allCourseGrades.map(g => parseFloat(g.grade || 0));
    document.getElementById('gradeAvg').textContent = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
    document.getElementById('gradeMax').textContent = Math.max(...vals).toFixed(1);
    document.getElementById('gradeMin').textContent = Math.min(...vals).toFixed(1);
    document.getElementById('gradeApproval').textContent = Math.round((vals.filter(v => v >= 6).length / vals.length) * 100) + '%';
    document.getElementById('gradesSummaryBar').style.display = 'flex';

    const totalPages = Math.max(1, Math.ceil(courseGrades.length / state.pageSize));
    const safePage = Math.min(Math.max(1, state.page), totalPages);
    state.page = safePage;
    const chunk = courseGrades.slice((safePage - 1) * state.pageSize, safePage * state.pageSize);

    container.innerHTML = `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px"><input class="form-input" id="gradeSearchInput" placeholder="Filtrar por estudiante, código o descripción" style="max-width:360px"><select class="form-input" id="gradePageSize" style="width:auto"><option value="8">8 por página</option><option value="12">12 por página</option><option value="20">20 por página</option></select></div><table><thead><tr><th>Código</th><th>Estudiante</th><th>Calificación</th><th>Barra</th><th>Descripción</th><th>Acciones</th></tr></thead><tbody>` +
        chunk.map(g => {
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
        }).join('') + `</tbody></table><div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px;flex-wrap:wrap"><span style="font-size:12px;color:var(--text-muted)">Mostrando ${(safePage - 1) * state.pageSize + 1}-${Math.min(safePage * state.pageSize, courseGrades.length)} de ${courseGrades.length}</span><div style="display:flex;gap:6px"><button class="btn btn-sm btn-outline" ${safePage===1?'disabled':''} onclick="changeGradesPage(-1,${courseId})">Anterior</button><button class="btn btn-sm btn-outline" ${safePage===totalPages?'disabled':''} onclick="changeGradesPage(1,${courseId})">Siguiente</button></div></div>`;

    const searchEl = document.getElementById('gradeSearchInput');
    const sizeEl = document.getElementById('gradePageSize');
    if (searchEl) {
        searchEl.value = state.query || '';
        searchEl.oninput = () => { state.query = searchEl.value; state.page = 1; renderGrades(courseId); };
    }
    if (sizeEl) {
        sizeEl.value = String(state.pageSize);
        sizeEl.onchange = () => { state.pageSize = parseInt(sizeEl.value, 10) || 8; state.page = 1; renderGrades(courseId); };
    }
}

function changeGradesPage(delta, courseId) {
    tableUiState.grades.page += delta;
    renderGrades(courseId);
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
    openConfirmModal('Eliminar calificación', '¿Eliminar esta calificación?', () => {
        const idx = MOCK.grades.findIndex(x => x.id === gradeId);
        if (idx >= 0) MOCK.grades.splice(idx, 1);
        renderGrades(courseId);
        showToast('Calificación eliminada');
    }, 'Eliminar');
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

    ensureTeacherAbsenceCard();
    const reviewSel = document.getElementById('absenceReviewCourse');
    if (reviewSel) {
        reviewSel.innerHTML = '<option value="">Todos los cursos</option>' + courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        reviewSel.onchange = () => { tableUiState.absences.page = 1; renderTeacherAbsenceReports(); };
    }
    const statusSel = document.getElementById('absenceStatusFilter');
    if (statusSel) statusSel.onchange = () => { tableUiState.absences.status = statusSel.value || 'all'; tableUiState.absences.page = 1; renderTeacherAbsenceReports(); };
    const searchInput = document.getElementById('absenceSearchInput');
    if (searchInput) searchInput.oninput = () => { tableUiState.absences.query = searchInput.value || ''; tableUiState.absences.page = 1; renderTeacherAbsenceReports(); };
    renderTeacherAbsenceReports();
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
    const state = tableUiState.attendanceSummary;
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
    const query = (state.query || '').trim().toLowerCase();
    let rows = [...MOCK.students];
    if (query) rows = rows.filter(s => s.user.name.toLowerCase().includes(query) || s.studentCode.toLowerCase().includes(query));
    const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
    const safePage = Math.min(Math.max(1, state.page), totalPages);
    state.page = safePage;
    const chunk = rows.slice((safePage - 1) * state.pageSize, safePage * state.pageSize);

    container.innerHTML = `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px"><span style="font-size:12px;color:var(--text-muted)">${keys.length} sesión(es) registrada(s)</span><input class="form-input" id="attSummarySearch" placeholder="Filtrar por estudiante o código" style="max-width:300px"><select class="form-input" id="attSummaryPageSize" style="width:auto"><option value="8">8 por página</option><option value="12">12 por página</option><option value="20">20 por página</option></select></div>
    <table><thead><tr><th>Código</th><th>Estudiante</th><th>Presentes</th><th>Ausentes</th><th>Porcentaje</th><th>Estado</th></tr></thead><tbody>` +
        chunk.map(s => {
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
        }).join('') + `</tbody></table><div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px;flex-wrap:wrap"><span style="font-size:12px;color:var(--text-muted)">Mostrando ${(safePage - 1) * state.pageSize + 1}-${Math.min(safePage * state.pageSize, rows.length)} de ${rows.length}</span><div style="display:flex;gap:6px"><button class="btn btn-sm btn-outline" ${safePage===1?'disabled':''} onclick="changeAttendanceSummaryPage(-1,${courseId})">Anterior</button><button class="btn btn-sm btn-outline" ${safePage===totalPages?'disabled':''} onclick="changeAttendanceSummaryPage(1,${courseId})">Siguiente</button></div></div>`;

    const searchEl = document.getElementById('attSummarySearch');
    const sizeEl = document.getElementById('attSummaryPageSize');
    if (searchEl) {
        searchEl.value = state.query || '';
        searchEl.oninput = () => { state.query = searchEl.value; state.page = 1; renderAttendanceSummary(courseId); };
    }
    if (sizeEl) {
        sizeEl.value = String(state.pageSize);
        sizeEl.onchange = () => { state.pageSize = parseInt(sizeEl.value, 10) || 8; state.page = 1; renderAttendanceSummary(courseId); };
    }
}

function changeAttendanceSummaryPage(delta, courseId) {
    tableUiState.attendanceSummary.page += delta;
    renderAttendanceSummary(courseId);
}

async function loadHorarios() {
    renderWeekView(MOCK.schedules);
}

function renderWeekView(schedules) {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const toMin = t => {
        if (!t || !t.includes(':')) return 0;
        const p = t.split(':');
        return (parseInt(p[0], 10) * 60) + parseInt(p[1], 10);
    };
    const valid = (schedules || []).filter(s => days.includes(s.day) && toMin(s.endTime) > toMin(s.startTime));
    if (!valid.length) {
        document.getElementById('weekGrid').innerHTML = '<div class="empty-state" style="padding:18px 0"><div class="empty-state-title">Sin clases programadas</div><div class="empty-state-text">Agrega horarios para ver el calendario semanal.</div></div>';
        return;
    }

    const minStart = Math.floor(Math.min.apply(null, valid.map(s => toMin(s.startTime))) / 60) * 60;
    const maxEnd = Math.ceil(Math.max.apply(null, valid.map(s => toMin(s.endTime))) / 60) * 60;
    const rowHeight = 72;
    const calendarHeight = Math.max(rowHeight, ((maxEnd - minStart) / 60) * rowHeight);
    const hourTicks = [];
    for (let m = minStart; m <= maxEnd; m += 60) hourTicks.push(m);

    const byDay = {};
    days.forEach(day => { byDay[day] = []; });
    valid.forEach(s => byDay[s.day].push(s));
    days.forEach(day => byDay[day].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')));

    const hourGuides = hourTicks.map(t => {
        const top = ((t - minStart) / 60) * rowHeight;
        return `<div style="position:absolute;left:0;right:0;top:${top}px;border-top:1px solid rgba(11,31,58,0.08)"></div>`;
    }).join('');
    const timeLabels = hourTicks.map(t => {
        const hh = String(Math.floor(t / 60)).padStart(2, '0');
        const mm = String(t % 60).padStart(2, '0');
        const top = ((t - minStart) / 60) * rowHeight;
        return `<div style="position:absolute;top:${top - 8}px;right:10px;font-size:11px;color:var(--text-muted)">${hh}:${mm}</div>`;
    }).join('');

    const dayColumns = days.map(day => {
        const slots = byDay[day];
        let overlap = false;
        for (let i = 1; i < slots.length; i++) {
            if (toMin(slots[i].startTime) < toMin(slots[i - 1].endTime)) { overlap = true; break; }
        }
        const blocks = slots.map(s => {
            const top = ((toMin(s.startTime) - minStart) / 60) * rowHeight;
            const height = Math.max(34, ((toMin(s.endTime) - toMin(s.startTime)) / 60) * rowHeight - 6);
            return `<div style="position:absolute;left:10px;right:10px;top:${top + 4}px;height:${height}px;background:rgba(30,107,116,0.10);border:1px solid rgba(30,107,116,0.25);border-left:4px solid var(--teal);border-radius:10px;padding:9px 10px;overflow:hidden"><button class="btn-icon del" onclick="deleteSchedule(${s.id})" title="Eliminar" style="position:absolute;top:4px;right:4px;background:rgba(255,255,255,0.8)"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button><div style="font-size:12px;font-weight:700;color:var(--text-dark);line-height:1.2;padding-right:22px">${s.course ? s.course.name : '—'}</div><div style="font-size:11px;color:var(--text-muted);margin-top:3px">${s.startTime} - ${s.endTime}</div></div>`;
        }).join('');
        return `<div style="min-width:0;border-left:1px solid rgba(11,31,58,0.08)"><div style="height:42px;border-bottom:1px solid rgba(11,31,58,0.08);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--text-dark);background:#fafbfd">${day}${overlap ? ' <span class="badge badge-warning" style="margin-left:6px">Cruce</span>' : ''}</div><div style="position:relative;height:${calendarHeight}px">${hourGuides}${blocks}</div></div>`;
    }).join('');

    document.getElementById('weekGrid').innerHTML = `<div style="border:1px solid rgba(11,31,58,0.10);border-radius:10px;overflow:auto;background:#fff;width:100%"><div style="min-width:1880px;display:grid;grid-template-columns:92px repeat(${days.length}, minmax(295px, 1fr))"><div style="border-right:1px solid rgba(11,31,58,0.08);position:relative;height:${calendarHeight + 42}px;background:#fff">${timeLabels}</div>${dayColumns}</div></div>`;
}

function deleteSchedule(id) {
    openModal('Eliminar horario', `<p style="font-size:13.5px;color:var(--text-body);line-height:1.7;margin-bottom:14px">Esta accion eliminara el horario seleccionado de la vista semanal.</p><div style="display:flex;gap:8px"><button class="btn btn-outline" style="flex:1" onclick="closeModal()">Cancelar</button><button class="btn btn-danger" style="flex:1" onclick="confirmDeleteSchedule(${id})">Eliminar</button></div>`);
}

function confirmDeleteSchedule(id) {
    const idx = MOCK.schedules.findIndex(s => s.id === id);
    if (idx >= 0) MOCK.schedules.splice(idx, 1);
    closeModal();
    loadHorarios();
    showToast('Horario eliminado');
}

function loadEstudiantes() {
    const courses = teacherCourses.length ? teacherCourses : MOCK.courses;
    const sel = document.getElementById('studentCourseFilter');
    sel.innerHTML = '<option value="">Todos los cursos</option>' + courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    sel.onchange = () => { tableUiState.students.page = 1; renderEstudiantes(); };
    document.getElementById('studentSearch').oninput = () => { tableUiState.students.page = 1; renderEstudiantes(); };
    renderEstudiantes();
}

function renderEstudiantes() {
    const state = tableUiState.students;
    const courseId = parseInt(document.getElementById('studentCourseFilter').value) || 0;
    const query = document.getElementById('studentSearch').value.trim().toLowerCase();
    const container = document.getElementById('estudiantesContainer');
    let students = MOCK.students;
    if (query) students = students.filter(s => s.user.name.toLowerCase().includes(query) || s.studentCode.toLowerCase().includes(query));
    if (!students.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Sin resultados</div><div class="empty-state-text">No se encontraron estudiantes con esos criterios.</div></div>';
        return;
    }
    const totalPages = Math.max(1, Math.ceil(students.length / state.pageSize));
    const safePage = Math.min(Math.max(1, state.page), totalPages);
    state.page = safePage;
    const chunk = students.slice((safePage - 1) * state.pageSize, safePage * state.pageSize);

    container.innerHTML = `<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><select class="form-input" id="studentPageSize" style="width:auto"><option value="8">8 por página</option><option value="12">12 por página</option><option value="20">20 por página</option></select></div><table><thead><tr><th>Código</th><th>Estudiante</th><th>Promedio</th><th>Asistencia</th><th>Entregas</th><th>Acciones</th></tr></thead><tbody>` +
        chunk.map(s => {
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
        }).join('') + `</tbody></table><div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px;flex-wrap:wrap"><span style="font-size:12px;color:var(--text-muted)">Mostrando ${(safePage - 1) * state.pageSize + 1}-${Math.min(safePage * state.pageSize, students.length)} de ${students.length}</span><div style="display:flex;gap:6px"><button class="btn btn-sm btn-outline" ${safePage===1?'disabled':''} onclick="changeStudentsPage(-1)">Anterior</button><button class="btn btn-sm btn-outline" ${safePage===totalPages?'disabled':''} onclick="changeStudentsPage(1)">Siguiente</button></div></div>`;

    const sizeEl = document.getElementById('studentPageSize');
    if (sizeEl) {
        sizeEl.value = String(state.pageSize);
        sizeEl.onchange = () => { state.pageSize = parseInt(sizeEl.value, 10) || 8; state.page = 1; renderEstudiantes(); };
    }
}

function changeStudentsPage(delta) {
    tableUiState.students.page += delta;
    renderEstudiantes();
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
    const allActs = getCourseActivitiesMerged(currentCourse.id);
    const allExams = getCourseExamsMerged(currentCourse.id);
    const acts = unit.activities ? allActs.filter(a => unit.activities.includes(a.id)) : [];
    const exams = unit.exams ? allExams.filter(x => unit.exams.includes(x.id)) : [];
    const announcements = unit.announcements || [];
    const resources = unit.resources || [];
    const forums = unit.forums || [];
    const glossaries = ensureUnitGlossaries(unit);

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
                                <span class="badge ${a.allowLateSubmission === false ? 'badge-navy' : 'badge-warning'}">${a.allowLateSubmission === false ? 'Sin retraso' : 'Permite retraso'}</span>
                                ${pending > 0 ? `<span class="badge badge-error">${pending} sin calificar</span>` : ''}
                            </div>
                        </div>
                        <div style="display:flex;gap:4px;flex-shrink:0">
                            <button class="btn-icon" title="Calificar" onclick="event.stopPropagation();openActivitySubmissions(${a.id},null,'submitted')"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></button>
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
                            <button class="btn btn-sm btn-teal" onclick="openActivitySubmissions(${a.id},null,'submitted')">
                                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                Calificar (${MOCK.students.filter(s => { const sub = getStudentSubmission(s.id, a.id); return sub && sub.submitted; }).length}/${MOCK.students.length})
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

    contentArea.insertAdjacentHTML('beforeend', buildTeacherForumsHtml(idx, forums));
    contentArea.insertAdjacentHTML('beforeend', buildTeacherGlossaryHtml(idx, glossaries));
    contentArea.insertAdjacentHTML('beforeend', `<div class="card" style="margin-bottom:20px"><div class="card-header"><span class="card-title">Cierre de unidad</span></div><div class="card-body"><div style="font-size:13px;color:var(--text-muted);line-height:1.6;margin-bottom:12px">Calcula la nota final de la unidad usando talleres, parcial y foros evaluables. Las tareas no enviadas se califican en 0.0.</div><button class="btn btn-teal" onclick="openFinalizeUnitModal(${idx})">Finalizar unidad</button></div></div>`);
}

function buildTeacherForumsHtml(unitIdx, forums) {
    const cards = forums.length ? forums.map((forum, forumIdx) => {
        ensureForumGradingDefaults(forum);
        const messages = forum.messages || [];
        const participants = getForumParticipants(forum);
        const recent = [...messages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
        const gradeBadge = forum.grading.type === 'bonus'
            ? `<span class="badge badge-warning">Bonificación (+${fmtGrade(forum.grading.bonusValue)} máx.)</span>`
            : forum.grading.type === 'none'
                ? '<span class="badge badge-navy">Sin nota</span>'
                : `<span class="badge badge-success">Nota real</span>`;
        return `<div class="forum-card" style="margin-bottom:12px">
            <div class="forum-card-header">
                <div class="forum-card-icon"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div>
                <div class="forum-card-meta">
                    <div class="forum-card-title">${forum.title}</div>
                    <div class="forum-card-desc">${forum.description || 'Sin descripcion.'}</div>
                </div>
                <button class="btn-icon del" onclick="removeForum(${unitIdx},${forumIdx})" title="Eliminar foro"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div class="forum-card-stats"><span class="forum-stat">${messages.length} publicacion(es)</span><span class="forum-stat">${participants.length} participante(s)</span>${gradeBadge}</div>
            <div class="forum-threads-body">
                ${recent.length ? recent.map(m => `<div class="forum-thread-item"><div class="forum-thread-title">${m.authorName}</div><div class="forum-thread-meta"><span>${new Date(m.createdAt).toLocaleString('es-CO')}</span></div><div style="font-size:12.8px;color:var(--text-body);line-height:1.6;margin-top:6px">${m.text}</div></div>`).join('') : '<div style="font-size:12.5px;color:var(--text-muted)">Sin publicaciones aun.</div>'}
            </div>
            <div style="padding:0 20px 16px"><button class="btn btn-sm btn-teal" onclick="openTeacherForumDetail(${unitIdx},${forumIdx})">Abrir foro completo</button></div>
        </div>`;
    }).join('') : '<div style="font-size:13px;color:var(--text-muted)">Sin foros creados para esta unidad.</div>';
    return `<div class="card" style="margin-bottom:20px"><div class="card-header"><span class="card-title">Foros</span><button class="btn btn-sm btn-outline" onclick="addForumModal(${unitIdx})">Nuevo foro</button></div><div class="card-body">${cards}</div></div>`;
}

function buildTeacherGlossaryHtml(unitIdx, glossaries) {
    const cards = (glossaries || []).length ? (glossaries || []).map((glossary, glossaryIdx) => {
        ensureGlossaryDefaults(glossary);
        const participants = getGlossaryParticipants(glossary);
        const terms = glossary.terms || [];
        const initials = [...new Set(terms.map(t => (t.term || '').charAt(0).toUpperCase()).filter(Boolean))].sort();
        const recent = [...terms].slice(-4).reverse();
        const gradingBadge = glossary.grading.type === 'bonus'
            ? `<span class="badge badge-warning">Bonificación</span>`
                : glossary.grading.type === 'real'
                    ? `<span class="badge badge-success">Nota real</span>`
                : '<span class="badge badge-navy">Sin nota</span>';
        return `<div class="forum-card" style="margin-bottom:12px">
            <div class="forum-card-header">
                <div class="forum-card-icon"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 19h16"/><path d="M5 5h14v10H5z"/><path d="M9 9h6"/></svg></div>
                <div class="forum-card-meta"><div class="forum-card-title">${glossary.title || 'Glosario'}</div><div class="forum-card-desc">${terms.length} término(s)</div></div>
            </div>
            <div class="forum-card-stats">${gradingBadge}<span class="forum-stat">${participants.length} participante(s)</span></div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;padding:0 20px 8px">${initials.length ? initials.map(i => `<span class="badge badge-navy">${i}</span>`).join('') : '<span style="font-size:12px;color:var(--text-muted)">Sin iniciales.</span>'}</div>
            <div class="forum-threads-body">${recent.length ? recent.map(t => `<div class="forum-thread-item"><div class="forum-thread-title">${t.term}</div><div style="font-size:12.6px;color:var(--text-body);line-height:1.6;margin-top:4px">${t.definition}</div></div>`).join('') : '<div style="font-size:12.5px;color:var(--text-muted)">Sin términos aún.</div>'}</div>
            <div style="padding:0 20px 16px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-sm btn-outline" onclick="addGlossaryModal(${unitIdx},${glossaryIdx})">Agregar término</button><button class="btn btn-sm btn-outline" onclick="openGlossaryGradingModal(${unitIdx},${glossaryIdx})">Configurar evaluación</button><button class="btn btn-sm btn-teal" onclick="openTeacherGlossaryDetail(${unitIdx},${glossaryIdx},'ALL',1)">Ver completo</button></div>
        </div>`;
    }).join('') : '<div style="font-size:13px;color:var(--text-muted)">Sin glosarios creados para esta unidad.</div>';
    return `<div class="card" style="margin-bottom:20px"><div class="card-header"><span class="card-title">Glosarios</span><button class="btn btn-sm btn-outline" onclick="addGlossaryCollectionModal(${unitIdx})">Nuevo glosario</button></div><div class="card-body">${cards}</div></div>`;
}

function addGlossaryCollectionModal(unitIdx) {
    openModal('Nuevo glosario', `
        <div class="form-group"><label class="form-label">Título del glosario</label><input type="text" class="form-input" id="mGlossaryTitle" placeholder="Ej: Glosario de Integrales"></div>
        <button class="btn btn-teal" style="width:100%" onclick="saveGlossaryCollection(${unitIdx})">Crear glosario</button>
    `);
}

function saveGlossaryCollection(unitIdx) {
    const title = (document.getElementById('mGlossaryTitle') || {}).value ? document.getElementById('mGlossaryTitle').value.trim() : '';
    if (!title) { showToast('El título del glosario es obligatorio', 'error'); return; }
    const units = getUnits(currentCourse.id);
    const unit = units[unitIdx];
    if (!unit) return;
    const glossaries = ensureUnitGlossaries(unit);
    glossaries.push({ id: 'gls-' + Date.now(), title, terms: [], grading: { type: 'none', defaultGrade: Math.min(DEFAULT_FORUM_PARTICIPATION_GRADE, GRADE_SCALE_MAX), weightPercent: 10, bonusMode: 'decimas', bonusValue: 0.3 }, participantGrades: {} });
    saveUnits(currentCourse.id, units);
    closeModal();
    renderUnit(unitIdx);
    showToast('Glosario creado', 'success');
}

function openGlossaryGradingModal(unitIdx, glossaryIdx) {
    const units = getUnits(currentCourse.id);
    const unit = units[unitIdx];
    if (!unit) return;
    const glossaries = ensureUnitGlossaries(unit);
    const glossary = glossaries[glossaryIdx];
    if (!glossary) return;
    ensureGlossaryDefaults(glossary);
    saveUnits(currentCourse.id, units);
    openModal('Configurar evaluación del glosario', `
        <div class="form-group"><label class="form-label">Tipo de evaluación</label><select class="form-input" id="mGlossGradeType" onchange="toggleGlossaryGradeFields()"><option value="none" ${glossary.grading.type === 'none' ? 'selected' : ''}>Sin nota</option><option value="real" ${glossary.grading.type === 'real' ? 'selected' : ''}>Pesa en la nota final</option><option value="bonus" ${glossary.grading.type === 'bonus' ? 'selected' : ''}>Bonificación</option></select></div>
        <div class="form-group" id="mGlossDefaultGradeWrap"><label class="form-label">Nota base por participación (0-${GRADE_SCALE_MAX})</label><input type="number" class="form-input" id="mGlossDefaultGrade" min="0" max="${GRADE_SCALE_MAX}" step="0.1" value="${fmtGrade(glossary.grading.defaultGrade)}"></div>
        <div id="mGlossBonusWrap" style="display:none">
            <div class="form-group"><label class="form-label">Valor de bonificación</label><input type="number" class="form-input" id="mGlossBonusValue" min="0" step="0.1" value="${glossary.grading.bonusValue}"></div>
            <div style="font-size:12px;color:var(--text-muted);margin:-6px 0 10px">La bonificación suma puntos extra directos (ej: <strong>0,45</strong> suma 0.45 puntos).</div>
        </div>
        <button class="btn btn-teal" style="width:100%" onclick="saveGlossaryGrading(${unitIdx},${glossaryIdx})">Guardar configuración</button>
    `, { size: 'lg' });
    toggleGlossaryGradeFields();
}

function toggleGlossaryGradeFields() {
    const type = (document.getElementById('mGlossGradeType') || {}).value || 'none';
    const bonusWrap = document.getElementById('mGlossBonusWrap');
    const defaultWrap = document.getElementById('mGlossDefaultGradeWrap');
    if (bonusWrap) bonusWrap.style.display = type === 'bonus' ? '' : 'none';
    if (defaultWrap) defaultWrap.style.display = type === 'real' ? '' : 'none';
}

function saveGlossaryGrading(unitIdx, glossaryIdx) {
    const units = getUnits(currentCourse.id);
    const unit = units[unitIdx];
    if (!unit) return;
    const glossaries = ensureUnitGlossaries(unit);
    const glossary = glossaries[glossaryIdx];
    if (!glossary) return;
    ensureGlossaryDefaults(glossary);
    glossary.grading.type = (document.getElementById('mGlossGradeType') || {}).value || 'none';
    glossary.grading.defaultGrade = clampGrade((document.getElementById('mGlossDefaultGrade') || {}).value);
    glossary.grading.weightPercent = 0;
    glossary.grading.bonusMode = 'decimas';
    glossary.grading.bonusValue = Math.max(0, parseFloat((document.getElementById('mGlossBonusValue') || {}).value || '0'));
    saveUnits(currentCourse.id, units);
    closeModal();
    renderUnit(unitIdx);
    showToast('Configuración del glosario actualizada', 'success');
}

function addForumModal(unitIdx) {
    openModal('Nuevo Foro', `
        <div class="form-group"><label class="form-label">Titulo</label><input type="text" class="form-input" id="mForumTitle" placeholder="Ej: Dudas del taller"></div>
        <div class="form-group"><label class="form-label">Descripcion</label>${buildRichEditorHtml('mForumDescEditor',120)}</div>
        <div class="form-group"><label class="form-label">Tipo de evaluación</label><select class="form-input" id="mForumGradeType" onchange="toggleForumGradeFields()"><option value="none">Sin nota</option><option value="real">Pesa en la nota final</option><option value="bonus">Bonificación</option></select></div>
        <div class="form-group" id="mForumDefaultGradeWrap"><label class="form-label">Nota base por participación (0-${GRADE_SCALE_MAX})</label><input type="number" class="form-input" id="mForumDefaultGrade" min="0" max="${GRADE_SCALE_MAX}" step="0.1" value="${Math.min(DEFAULT_FORUM_PARTICIPATION_GRADE, GRADE_SCALE_MAX)}"></div>
        <div id="mForumBonusWrap" style="display:none">
            <div class="form-group"><label class="form-label">Valor de bonificación</label><input type="number" class="form-input" id="mForumBonusValue" min="0" step="0.1" value="0.3"></div>
            <div style="font-size:12px;color:var(--text-muted);margin:-6px 0 10px">La bonificación suma puntos extra directos (ej: <strong>0,45</strong> suma 0.45 puntos).</div>
            <div style="font-size:12px;color:var(--text-muted);margin:-6px 0 10px">Si la suma supera ${GRADE_SCALE_MAX}, la nota final se ajusta automáticamente al máximo permitido.</div>
        </div>
        <button class="btn btn-teal" style="width:100%" onclick="saveForum(${unitIdx})">Crear foro</button>`, { size: 'xl' });
    toggleForumGradeFields();
}

function toggleForumGradeFields() {
    const type = (document.getElementById('mForumGradeType') || {}).value || 'real';
    const bonusWrap = document.getElementById('mForumBonusWrap');
    const defaultWrap = document.getElementById('mForumDefaultGradeWrap');
    if (bonusWrap) bonusWrap.style.display = type === 'bonus' ? '' : 'none';
    if (defaultWrap) defaultWrap.style.display = type === 'real' ? '' : 'none';
}

function saveForum(unitIdx) {
    const title = document.getElementById('mForumTitle').value.trim();
    if (!title) { showToast('El titulo del foro es obligatorio', 'error'); return; }
    const gradeType = (document.getElementById('mForumGradeType') || {}).value || 'real';
    const defaultGrade = clampGrade((document.getElementById('mForumDefaultGrade') || {}).value);
    const weightPercent = 0;
    const bonusMode = 'decimas';
    const bonusValue = Math.max(0, parseFloat((document.getElementById('mForumBonusValue') || {}).value || '0'));
    const units = getUnits(currentCourse.id);
    units[unitIdx].forums = units[unitIdx].forums || [];
    units[unitIdx].forums.push({
        id: 'f' + Date.now(),
        title,
        description: trtGetHtml('mForumDescEditor'),
        messages: [],
        grading: {
            type: gradeType,
            defaultGrade,
            weightPercent,
            bonusMode,
            bonusValue
        },
        participantGrades: {}
    });
    saveUnits(currentCourse.id, units);
    closeModal();
    renderUnit(unitIdx);
    showToast('Foro creado', 'success');
}

function postTeacherForumMessage(unitIdx, forumIdx) {
    const text = trtGetHtml('mForumPostEditor');
    if (!text) { showToast('Escribe un mensaje para publicar', 'error'); return; }
    const units = getUnits(currentCourse.id);
    const forum = (units[unitIdx].forums || [])[forumIdx];
    if (!forum) return;
    forum.messages = forum.messages || [];
    const parentId = (document.getElementById('mForumReplyTo') || {}).value || null;
    forum.messages.push({ id: 'fm' + Date.now(), parentId: parentId || null, authorRole: 'docente', authorName: (currentUser && currentUser.name) || 'Docente', text, createdAt: new Date().toISOString() });
    saveUnits(currentCourse.id, units);
    openTeacherForumDetail(unitIdx, forumIdx, 1);
}

function openTeacherForumDetail(unitIdx, forumIdx, page) {
    const units = getUnits(currentCourse.id);
    const forum = (units[unitIdx].forums || [])[forumIdx];
    if (!forum) return;
    ensureForumGradingDefaults(forum);
    saveUnits(currentCourse.id, units);
    const participants = getForumParticipants(forum);
    const gradingTypeLabel = forum.grading.type === 'bonus' ? 'Bonificación' : forum.grading.type === 'none' ? 'Sin nota' : 'Nota real';
    const showForumGradingPanel = forum.grading.type !== 'none';
    const forumEvalHtml = showForumGradingPanel ? `
        <div class="card" style="margin-bottom:12px">
            <div class="card-header" style="padding:10px 14px"><span class="card-title" style="font-size:13px">Evaluación del foro</span><span class="badge ${forum.grading.type === 'bonus' ? 'badge-warning' : 'badge-success'}">${gradingTypeLabel}</span></div>
            <div class="card-body" style="padding:12px 14px">
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
                    <span class="badge badge-navy">Participantes: ${participants.length}</span>
                    ${forum.grading.type === 'real' ? `<span class="badge badge-gold">Nota base: ${fmtGrade(forum.grading.defaultGrade)}</span>` : ''}
                    ${forum.grading.type === 'real' ? `<span class="badge badge-success">Calificable por nota base</span>` : `<span class="badge badge-warning">Bonificación: +${fmtGrade(forum.grading.bonusValue)} máx.</span>`}
                </div>
                <div id="mForumGradesWrap" style="max-height:220px;overflow:auto;border:1px solid rgba(11,31,58,0.08);border-radius:8px;padding:8px 10px">
                    ${participants.length ? participants.map(st => `<div style="display:grid;grid-template-columns:minmax(180px,1fr) 98px;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid rgba(11,31,58,0.06)"><div style="font-size:13px">${st.user.name}</div><input id="mForumGrade-${st.id}" type="number" class="form-input" min="0" max="${GRADE_SCALE_MAX}" step="0.1" value="${fmtGrade(forum.participantGrades[st.id])}" style="padding:6px 8px;font-size:12px"></div>`).join('') : '<div style="font-size:12.5px;color:var(--text-muted)">Aun no hay participaciones de estudiantes para calificar.</div>'}
                </div>
                ${participants.length ? `<button class="btn btn-sm btn-teal" style="margin-top:10px" onclick="saveForumParticipantGrades(${unitIdx},${forumIdx})">Guardar notas de participantes</button>` : ''}
            </div>
        </div>` : `<div class="card" style="margin-bottom:12px"><div class="card-header" style="padding:10px 14px"><span class="card-title" style="font-size:13px">Evaluación del foro</span><span class="badge badge-navy">Sin nota</span></div><div class="card-body" style="padding:12px 14px"><div style="font-size:12.5px;color:var(--text-muted)">Este foro es informativo y no permite calificación de estudiantes.</div></div></div>`;
    const html = `
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
            <div><div style="font-size:16px;font-weight:700">${forum.title}</div><div style="font-size:12px;color:var(--text-muted)">${forum.description || ''}</div></div>
            <button class="btn btn-sm btn-danger" onclick="removeForum(${unitIdx},${forumIdx});closeModal()">Eliminar foro</button>
        </div>
        ${forumEvalHtml}
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
            <input class="form-input" id="mForumAuthorFilter" placeholder="Filtrar por alumno/docente" style="flex:1;min-width:220px">
            <select class="form-input" id="mForumSort" style="width:auto"><option value="recent">Mas reciente</option><option value="old">Mas antiguo</option></select>
            <button class="btn btn-sm btn-outline" onclick="renderTeacherForumDetail(${unitIdx},${forumIdx},1)">Aplicar</button>
        </div>
        <div id="mForumDetailList"></div>
        <input type="hidden" id="mForumReplyTo" value="">
        <div id="mForumReplyInfo" style="display:none;font-size:12px;color:var(--teal);margin-bottom:8px"></div>
        <div style="margin-top:14px"><div style="font-size:11px;font-weight:700;letter-spacing:1px;color:var(--text-muted);margin-bottom:8px">Publicar intervencion</div>${buildRichEditorHtml('mForumPostEditor',120)}<div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-teal" style="flex:1" onclick="postTeacherForumMessage(${unitIdx},${forumIdx})">Publicar</button><button class="btn btn-outline" type="button" onclick="clearTeacherForumReply()">Cancelar respuesta</button></div></div>
    `;
    openModal('Foro completo', html, { size: 'xl' });
    teacherForumReplyPanels = {};
    document.getElementById('mForumSort').value = 'recent';
    renderTeacherForumDetail(unitIdx, forumIdx, page || 1);
}

function saveForumParticipantGrades(unitIdx, forumIdx) {
    const units = getUnits(currentCourse.id);
    const forum = (units[unitIdx].forums || [])[forumIdx];
    if (!forum) return;
    ensureForumGradingDefaults(forum);
    getForumParticipants(forum).forEach(st => {
        const input = document.getElementById('mForumGrade-' + st.id);
        if (!input) return;
        forum.participantGrades[st.id] = clampGrade(input.value);
    });
    saveUnits(currentCourse.id, units);
    showToast('Notas del foro actualizadas', 'success');
}

function toggleTeacherForumReplies(messageId) {
    teacherForumReplyPanels[messageId] = !teacherForumReplyPanels[messageId];
    const panel = document.getElementById('mForumReplies_' + messageId);
    const btn = document.getElementById('mForumRepliesBtn_' + messageId);
    if (!panel || !btn) return;
    const expanded = !!teacherForumReplyPanels[messageId];
    panel.style.display = expanded ? 'block' : 'none';
    btn.dataset.expanded = expanded ? '1' : '0';
    btn.textContent = (expanded ? 'Ocultar respuestas' : 'Ver respuestas') + ' (' + (btn.dataset.count || '0') + ')';
}

function renderTeacherForumDetail(unitIdx, forumIdx, page) {
    const units = getUnits(currentCourse.id);
    const forum = (units[unitIdx].forums || [])[forumIdx];
    if (!forum) return;
    const query = (document.getElementById('mForumAuthorFilter') || {}).value ? document.getElementById('mForumAuthorFilter').value.trim().toLowerCase() : '';
    const sort = (document.getElementById('mForumSort') || {}).value || 'recent';
    let items = [...(forum.messages || [])];
    if (query) items = items.filter(m => (m.authorName || '').toLowerCase().includes(query));
    items.sort((a, b) => sort === 'old' ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt));
    const host = document.getElementById('mForumDetailList');
    if (!host) return;
    const byParent = {};
    items.forEach(m => {
        const key = m.parentId || '__root__';
        byParent[key] = byParent[key] || [];
        byParent[key].push(m);
    });
    const roots = byParent['__root__'] || [];
    const pageSize = 8;
    const totalPages = Math.max(1, Math.ceil(roots.length / pageSize));
    const safePage = Math.min(Math.max(1, page || 1), totalPages);
    const chunkRoots = roots.slice((safePage - 1) * pageSize, safePage * pageSize);
    function renderNode(node, level) {
        const replies = byParent[node.id] || [];
        const safeId = String(node.id || '').replace(/[^a-zA-Z0-9_-]/g, '_');
        const expanded = !!teacherForumReplyPanels[safeId];
        const repliesBlock = replies.length
            ? `<div style="margin-top:8px"><button class="btn btn-sm btn-outline" id="mForumRepliesBtn_${safeId}" data-count="${replies.length}" data-expanded="${expanded ? '1' : '0'}" onclick="toggleTeacherForumReplies('${safeId}')">${expanded ? 'Ocultar respuestas' : 'Ver respuestas'} (${replies.length})</button></div><div id="mForumReplies_${safeId}" style="display:${expanded ? 'block' : 'none'};margin-top:8px">${replies.map(r => renderNode(r, level + 1)).join('')}</div>`
            : '';
        const safeAuthor = (node.authorName || '').replace(/'/g, "\\'");
        return `<div class="forum-thread-item" style="margin-bottom:8px;margin-left:${Math.min(level,3)*18}px;border-left:${level? '2px solid rgba(11,31,58,0.08)' : 'none'}"><div class="forum-thread-title">${node.authorName}</div><div class="forum-thread-meta"><span>${new Date(node.createdAt).toLocaleString('es-CO')}</span></div><div style="font-size:13px;color:var(--text-body);line-height:1.65;margin-top:6px">${node.text}</div><div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-sm btn-outline" onclick="setTeacherForumReplyTarget('${node.id}','${safeAuthor}')">Responder</button><button class="btn btn-sm btn-danger" onclick="deleteTeacherForumMessage(${unitIdx},${forumIdx},'${node.id}',${safePage})">Eliminar comentario</button></div>${repliesBlock}</div>`;
    }
    host.innerHTML = `${chunkRoots.length ? chunkRoots.map(r => renderNode(r, 0)).join('') : '<div style="font-size:13px;color:var(--text-muted)">Sin publicaciones para los filtros seleccionados.</div>'}<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><span style="font-size:12px;color:var(--text-muted)">Pagina ${safePage} de ${totalPages}</span><div style="display:flex;gap:6px"><button class="btn btn-sm btn-outline" ${safePage===1?'disabled':''} onclick="renderTeacherForumDetail(${unitIdx},${forumIdx},${safePage-1})">Anterior</button><button class="btn btn-sm btn-outline" ${safePage===totalPages?'disabled':''} onclick="renderTeacherForumDetail(${unitIdx},${forumIdx},${safePage+1})">Siguiente</button></div></div>`;
}

function deleteTeacherForumMessage(unitIdx, forumIdx, messageId, page) {
    const units = getUnits(currentCourse.id);
    const forum = (units[unitIdx].forums || [])[forumIdx];
    if (!forum) return;
    const idsToDelete = new Set([String(messageId)]);
    let changed = true;
    while (changed) {
        changed = false;
        (forum.messages || []).forEach(msg => {
            if (msg.parentId && idsToDelete.has(String(msg.parentId)) && !idsToDelete.has(String(msg.id))) {
                idsToDelete.add(String(msg.id));
                changed = true;
            }
        });
    }
    forum.messages = (forum.messages || []).filter(msg => !idsToDelete.has(String(msg.id)));
    saveUnits(currentCourse.id, units);
    showToast('Comentario eliminado', 'success');
    renderTeacherForumDetail(unitIdx, forumIdx, page || 1);
}

function setTeacherForumReplyTarget(messageId, authorName) {
    const input = document.getElementById('mForumReplyTo');
    const info = document.getElementById('mForumReplyInfo');
    if (!input || !info) return;
    input.value = messageId;
    info.style.display = '';
    info.textContent = 'Respondiendo a: ' + (authorName || 'mensaje');
}

function clearTeacherForumReply() {
    const input = document.getElementById('mForumReplyTo');
    const info = document.getElementById('mForumReplyInfo');
    if (input) input.value = '';
    if (info) { info.style.display = 'none'; info.textContent = ''; }
}

function removeForum(unitIdx, forumIdx) {
    openConfirmModal('Eliminar foro', '¿Eliminar este foro?', () => {
        const units = getUnits(currentCourse.id);
        units[unitIdx].forums = units[unitIdx].forums || [];
        units[unitIdx].forums.splice(forumIdx, 1);
        saveUnits(currentCourse.id, units);
        renderUnit(unitIdx);
        showToast('Foro eliminado');
    }, 'Eliminar');
}

function addGlossaryModal(unitIdx, glossaryIdx) {
    openModal('Nuevo termino del glosario', `
        <div class="form-group"><label class="form-label">Termino</label><input type="text" class="form-input" id="mGlossTerm" placeholder="Ej: Derivada"></div>
        <div class="form-group"><label class="form-label">Definicion</label>${buildRichEditorHtml('mGlossDefEditor',110)}</div>
        <button class="btn btn-teal" style="width:100%" onclick="saveGlossaryTerm(${unitIdx},${glossaryIdx})">Guardar termino</button>`, { size: 'xl' });
}

function saveGlossaryTerm(unitIdx, glossaryIdx) {
    const term = document.getElementById('mGlossTerm').value.trim();
    const definition = trtGetHtml('mGlossDefEditor');
    if (!term || !definition) { showToast('Termino y definicion son obligatorios', 'error'); return; }
    const units = getUnits(currentCourse.id);
    const unit = units[unitIdx];
    if (!unit) return;
    const glossaries = ensureUnitGlossaries(unit);
    const glossary = glossaries[glossaryIdx];
    if (!glossary) return;
    glossary.terms = glossary.terms || [];
    glossary.terms.push({ id: 'g' + Date.now(), term, definition, createdBy: 'docente', authorName: (currentUser && currentUser.name) || 'Docente' });
    ensureGlossaryDefaults(glossary);
    saveUnits(currentCourse.id, units);
    closeModal();
    renderUnit(unitIdx);
    showToast('Termino agregado', 'success');
}

function removeGlossaryTerm(unitIdx, glossaryIdx, termId) {
    const units = getUnits(currentCourse.id);
    const unit = units[unitIdx];
    if (!unit) return;
    const glossaries = ensureUnitGlossaries(unit);
    const glossary = glossaries[glossaryIdx];
    if (!glossary) return;
    glossary.terms = (glossary.terms || []).filter(t => String(t.id) !== String(termId));
    saveUnits(currentCourse.id, units);
    renderUnit(unitIdx);
    showToast('Termino eliminado');
}

function openTeacherGlossaryDetail(unitIdx, glossaryIdx, initial, page) {
    const units = getUnits(currentCourse.id);
    const unit = units[unitIdx];
    if (!unit) return;
    const glossaries = ensureUnitGlossaries(unit);
    const glossary = glossaries[glossaryIdx];
    if (!glossary) return;
    const terms = glossary.terms || [];
    ensureGlossaryDefaults(glossary);
    saveUnits(currentCourse.id, units);
    const participants = getGlossaryParticipants(glossary);
    const initials = [...new Set(terms.map(t => (t.term || '').charAt(0).toUpperCase()).filter(Boolean))].sort();
    const gradingTypeLabel = glossary.grading.type === 'bonus' ? 'Bonificación' : glossary.grading.type === 'real' ? 'Nota real' : 'Sin nota';
    const html = `
        <div class="card" style="margin-bottom:12px">
            <div class="card-header" style="padding:10px 14px"><span class="card-title" style="font-size:13px">Evaluación del glosario</span><span class="badge ${glossary.grading.type === 'bonus' ? 'badge-warning' : glossary.grading.type === 'real' ? 'badge-success' : 'badge-navy'}">${gradingTypeLabel}</span></div>
            <div class="card-body" style="padding:12px 14px">
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
                    <span class="badge badge-navy">Participantes: ${participants.length}</span>
                    <span class="badge badge-gold">Nota base: ${fmtGrade(glossary.grading.defaultGrade)}</span>
                    ${glossary.grading.type === 'real' ? `<span class="badge badge-success">Calificable por nota base</span>` : glossary.grading.type === 'bonus' ? `<span class="badge badge-warning">Bonificación: +${fmtGrade(glossary.grading.bonusValue)} máx.</span>` : '<span class="badge badge-navy">No aporta a la nota</span>'}
                </div>
                <div style="max-height:220px;overflow:auto;border:1px solid rgba(11,31,58,0.08);border-radius:8px;padding:8px 10px">
                    ${participants.length ? participants.map(st => `<div style="display:grid;grid-template-columns:minmax(180px,1fr) 98px;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid rgba(11,31,58,0.06)"><div style="font-size:13px">${st.user.name}</div><input id="mGlossGrade-${st.id}" type="number" class="form-input" min="0" max="${GRADE_SCALE_MAX}" step="0.1" value="${fmtGrade(glossary.participantGrades[st.id] || glossary.grading.defaultGrade)}" style="padding:6px 8px;font-size:12px"></div>`).join('') : '<div style="font-size:12.5px;color:var(--text-muted)">Aun no hay aportes de estudiantes.</div>'}
                </div>
                ${participants.length ? `<button class="btn btn-sm btn-teal" style="margin-top:10px" onclick="saveGlossaryParticipantGrades(${unitIdx},${glossaryIdx})">Guardar notas de participantes</button>` : ''}
            </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
            <input class="form-input" id="mGlossSearch" placeholder="Buscar termino o autor" style="flex:1;min-width:220px">
            <select class="form-input" id="mGlossSort" style="width:auto"><option value="recent">Mas reciente</option><option value="alpha">A-Z</option></select>
            <button class="btn btn-sm btn-outline" onclick="renderTeacherGlossaryDetail(${unitIdx},${glossaryIdx},'ALL',1)">Aplicar</button>
        </div>
        <div id="mGlossInitials" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px"><button class="btn btn-sm btn-outline" onclick="renderTeacherGlossaryDetail(${unitIdx},${glossaryIdx},'ALL',1)">Todas</button>${initials.map(i => `<button class="btn btn-sm btn-outline" onclick="renderTeacherGlossaryDetail(${unitIdx},${glossaryIdx},'${i}',1)">${i}</button>`).join('')}</div>
        <div id="mGlossDetailList"></div>
    `;
    openModal('Glosario completo', html, { size: 'xl' });
    renderTeacherGlossaryDetail(unitIdx, glossaryIdx, initial || 'ALL', page || 1);
}

function saveGlossaryParticipantGrades(unitIdx, glossaryIdx) {
    const units = getUnits(currentCourse.id);
    const unit = units[unitIdx];
    if (!unit) return;
    const glossaries = ensureUnitGlossaries(unit);
    const glossary = glossaries[glossaryIdx];
    if (!glossary) return;
    ensureGlossaryDefaults(glossary);
    getGlossaryParticipants(glossary).forEach(st => {
        const input = document.getElementById('mGlossGrade-' + st.id);
        if (!input) return;
        glossary.participantGrades[st.id] = clampGrade(input.value);
    });
    saveUnits(currentCourse.id, units);
    showToast('Notas del glosario actualizadas', 'success');
}

function renderTeacherGlossaryDetail(unitIdx, glossaryIdx, initial, page) {
    const units = getUnits(currentCourse.id);
    const unit = units[unitIdx];
    if (!unit) return;
    const glossaries = ensureUnitGlossaries(unit);
    const glossary = glossaries[glossaryIdx];
    if (!glossary) return;
    const query = (document.getElementById('mGlossSearch') || {}).value ? document.getElementById('mGlossSearch').value.trim().toLowerCase() : '';
    const sort = (document.getElementById('mGlossSort') || {}).value || 'recent';
    let items = [...(glossary.terms || [])];
    if (initial && initial !== 'ALL') items = items.filter(t => (t.term || '').toUpperCase().startsWith(initial));
    if (query) items = items.filter(t => (t.term || '').toLowerCase().includes(query) || (t.authorName || '').toLowerCase().includes(query));
    items.sort((a, b) => sort === 'alpha' ? (a.term || '').localeCompare(b.term || '') : ((b.createdAt || '')).localeCompare(a.createdAt || ''));
    const pageSize = 12;
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const safePage = Math.min(Math.max(1, page || 1), totalPages);
    const chunk = items.slice((safePage - 1) * pageSize, safePage * pageSize);
    const host = document.getElementById('mGlossDetailList');
    if (!host) return;
    host.innerHTML = `${chunk.length ? chunk.map((t) => `<div class="glossary-term-item"><div class="glossary-term-letter">${(t.term||'?').charAt(0).toUpperCase()}</div><div class="glossary-term-content"><div class="glossary-term-word">${t.term}</div><div class="glossary-term-def">${t.definition}</div></div><div class="glossary-term-actions"><button class="btn-icon del" onclick="removeGlossaryTerm(${unitIdx},${glossaryIdx},'${String(t.id).replace(/'/g, "\\'")}');openTeacherGlossaryDetail(${unitIdx},${glossaryIdx},'${initial}',${safePage})">✕</button></div></div>`).join('') : '<div style="font-size:13px;color:var(--text-muted)">Sin terminos para este filtro.</div>'}<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><span style="font-size:12px;color:var(--text-muted)">Pagina ${safePage} de ${totalPages}</span><div style="display:flex;gap:6px"><button class="btn btn-sm btn-outline" ${safePage===1?'disabled':''} onclick="renderTeacherGlossaryDetail(${unitIdx},${glossaryIdx},'${initial}',${safePage-1})">Anterior</button><button class="btn btn-sm btn-outline" ${safePage===totalPages?'disabled':''} onclick="renderTeacherGlossaryDetail(${unitIdx},${glossaryIdx},'${initial}',${safePage+1})">Siguiente</button></div></div>`;
}

let finalizeUnitState = null;

function getFinalizeUnitContext(unitIdx) {
    const units = getUnits(currentCourse.id);
    const unit = units[unitIdx];
    const allActs = getCourseActivitiesMerged(currentCourse.id);
    const allExams = getCourseExamsMerged(currentCourse.id);
    const acts = unit && unit.activities ? allActs.filter(a => unit.activities.includes(a.id)) : [];
    const exams = unit && unit.exams ? allExams.filter(e => unit.exams.includes(e.id)) : [];
    const forums = unit && unit.forums ? unit.forums : [];
    const glossaries = unit ? ensureUnitGlossaries(unit) : [];
    forums.forEach(f => ensureForumGradingDefaults(f));
    glossaries.forEach(g => ensureGlossaryDefaults(g));
    saveUnits(currentCourse.id, units);
    const realForums = forums.filter(f => (f.grading && f.grading.type) === 'real');
    const bonusForums = forums.filter(f => f.grading && f.grading.type === 'bonus');
    const realGlossaries = glossaries.filter(g => g.grading && g.grading.type === 'real');
    const bonusGlossaries = glossaries.filter(g => g.grading && g.grading.type === 'bonus');
    return { unit, acts, exams, forums, realForums, bonusForums, glossaries, realGlossaries, bonusGlossaries };
}

function getUnitExamScores(courseId, unitId) {
    try { return JSON.parse(localStorage.getItem('educat_unit_exam_scores_' + courseId + '_' + unitId) || '{}'); } catch (e) { return {}; }
}

function saveUnitExamScores(courseId, unitId, scores) {
    localStorage.setItem('educat_unit_exam_scores_' + courseId + '_' + unitId, JSON.stringify(scores || {}));
}

function getUnitFinalizeConfig(courseId, unitId) {
    try { return JSON.parse(localStorage.getItem('educat_unit_finalize_cfg_' + courseId + '_' + unitId) || '{}'); } catch (e) { return {}; }
}

function saveUnitFinalizeConfig(courseId, unitId, cfg) {
    localStorage.setItem('educat_unit_finalize_cfg_' + courseId + '_' + unitId, JSON.stringify(cfg || {}));
}

function getScoreByCategory(ctx, student, examScoresByExam) {
    const activities = ctx.acts.map(a => {
        const sub = getStudentSubmission(student.id, a.id);
        return (sub && sub.submitted && sub.graded) ? clampGrade(sub.grade) : 0;
    });
    const exams = ctx.exams.map(ex => clampGrade((examScoresByExam[ex.id] || {})[student.id] || 0));
    const forumsReal = ctx.realForums.map(f => clampGrade((f.participantGrades || {})[student.id] || 0));
    const glossary = ctx.realGlossaries.map(g => clampGrade((g.participantGrades || {})[student.id] || 0));
    return {
        activities,
        exams,
        forumsReal,
        glossary,
        avgActivities: activities.length ? activities.reduce((a, b) => a + b, 0) / activities.length : 0,
        avgExams: exams.length ? exams.reduce((a, b) => a + b, 0) / exams.length : 0,
        avgForums: forumsReal.length ? forumsReal.reduce((a, b) => a + b, 0) / forumsReal.length : 0,
        glossaryScore: glossary.length ? glossary.reduce((a, b) => a + b, 0) / glossary.length : 0
    };
}

function computeStudentUnitResult(ctx, student, examScoresByExam, cfg) {
    const score = getScoreByCategory(ctx, student, examScoresByExam || {});
    const mode = cfg.mode || 'category-global';
    const globalWeights = cfg.globalWeights || { activities: 50, exams: 30, forums: 10, glossary: 10 };
    const itemWeights = cfg.itemWeights || {};
    let base = 0;
    if (mode === 'none') {
        base = 0;
    } else if (mode === 'simple-average') {
        const arr = [...score.activities, ...score.exams, ...score.forumsReal, ...score.glossary];
        base = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    } else if (mode === 'item-individual') {
        ctx.acts.forEach(a => {
            const sub = getStudentSubmission(student.id, a.id);
            const v = (sub && sub.submitted && sub.graded) ? clampGrade(sub.grade) : 0;
            base += ((itemWeights['A_' + a.id] || 0) / 100) * v;
        });
        ctx.exams.forEach(ex => { base += ((itemWeights['E_' + ex.id] || 0) / 100) * clampGrade((examScoresByExam[ex.id] || {})[student.id] || 0); });
        ctx.realForums.forEach(f => { base += ((itemWeights['F_' + f.id] || 0) / 100) * clampGrade((f.participantGrades || {})[student.id] || 0); });
        ctx.realGlossaries.forEach(g => { base += ((itemWeights['G_' + g.id] || 0) / 100) * clampGrade((g.participantGrades || {})[student.id] || 0); });
    } else {
        base =
            score.avgActivities * ((globalWeights.activities || 0) / 100) +
            score.avgExams * ((globalWeights.exams || 0) / 100) +
            score.avgForums * ((globalWeights.forums || 0) / 100) +
            score.glossaryScore * ((globalWeights.glossary || 0) / 100);
    }

    let bonus = 0;
    ctx.bonusForums.forEach(forum => {
        const score = clampGrade((forum.participantGrades || {})[student.id] || 0);
        if (score <= 0) return;
        bonus += calcBonusContribution(score, forum.grading || {});
    });
    ctx.bonusGlossaries.forEach(g => {
        const s = clampGrade((g.participantGrades || {})[student.id] || 0);
        if (s <= 0) return;
        bonus += calcBonusContribution(s, g.grading || {});
    });
    const final = clampGrade(base + bonus);
    return { avgActivities: score.avgActivities, avgExams: score.avgExams, avgForums: score.avgForums, glossaryScore: score.glossaryScore, base, bonus, final };
}

function getEffectiveFinalizeMode(adminCfg, cfg) {
    if (!adminCfg.allowTeacherCustom && adminCfg.forcedModel) return adminCfg.forcedModel;
    if (adminCfg.forcedModel) return adminCfg.forcedModel;
    if (!adminCfg.allowTeacherCustom) return adminCfg.selectedMethod || 'category-global';
    return cfg.mode || adminCfg.selectedMethod || 'category-global';
}

function toggleFinalizeWeightAreas() {
    if (!finalizeUnitState) return;
    const mode = (document.getElementById('mFinalizeMode') || {}).value || 'category-global';
    const globalWrap = document.getElementById('mFinalizeGlobalWrap');
    const itemWrap = document.getElementById('mFinalizeItemWrap');
    const noneWrap = document.getElementById('mFinalizeNoneWrap');
    if (globalWrap) globalWrap.style.display = mode === 'category-global' ? '' : 'none';
    if (itemWrap) itemWrap.style.display = mode === 'item-individual' ? '' : 'none';
    if (noneWrap) noneWrap.style.display = mode === 'none' ? '' : 'none';
}

function readFinalizeExamScores(ctx) {
    const map = {};
    ctx.exams.forEach(ex => {
        map[ex.id] = {};
        MOCK.students.forEach(st => {
            map[ex.id][st.id] = clampGrade((document.getElementById('mUnitExam-' + ex.id + '-' + st.id) || {}).value);
        });
    });
    return map;
}

function readFinalizeConfig(ctx, adminCfg) {
    const requestedMode = (document.getElementById('mFinalizeMode') || {}).value || 'category-global';
    const mode = getEffectiveFinalizeMode(adminCfg, { mode: requestedMode });
    const cfg = { mode, globalWeights: {}, itemWeights: {} };
    cfg.globalWeights.activities = clampPercent((document.getElementById('mUnitWeightTasks') || {}).value);
    cfg.globalWeights.exams = clampPercent((document.getElementById('mUnitWeightExam') || {}).value);
    cfg.globalWeights.forums = clampPercent((document.getElementById('mUnitWeightForum') || {}).value);
    cfg.globalWeights.glossary = clampPercent((document.getElementById('mUnitWeightGlossary') || {}).value);
    const cached = (finalizeUnitState && finalizeUnitState.itemWeightCache) ? finalizeUnitState.itemWeightCache : {};
    Object.keys(cached).forEach(k => { cfg.itemWeights[k] = clampPercent(cached[k]); });
    ctx.acts.forEach(a => { cfg.itemWeights['A_' + a.id] = cfg.itemWeights['A_' + a.id] !== undefined ? cfg.itemWeights['A_' + a.id] : 0; });
    ctx.exams.forEach(ex => { cfg.itemWeights['E_' + ex.id] = cfg.itemWeights['E_' + ex.id] !== undefined ? cfg.itemWeights['E_' + ex.id] : 0; });
    ctx.realForums.forEach(f => { cfg.itemWeights['F_' + f.id] = cfg.itemWeights['F_' + f.id] !== undefined ? cfg.itemWeights['F_' + f.id] : 0; });
    ctx.realGlossaries.forEach(g => { cfg.itemWeights['G_' + g.id] = cfg.itemWeights['G_' + g.id] !== undefined ? cfg.itemWeights['G_' + g.id] : 0; });
    return cfg;
}

function validateFinalizeConfig(ctx, cfg, adminCfg) {
    let examShare = 0;
    if (cfg.mode === 'category-global') {
        const sum = (cfg.globalWeights.activities || 0) + (cfg.globalWeights.exams || 0) + (cfg.globalWeights.forums || 0) + (cfg.globalWeights.glossary || 0);
        if (Math.abs(sum - 100) > 0.01) return 'La suma de pesos globales debe ser 100%.';
        examShare = cfg.globalWeights.exams || 0;
    }
    if (cfg.mode === 'item-individual') {
        const sum = Object.values(cfg.itemWeights || {}).reduce((a, b) => a + (b || 0), 0);
        if (Math.abs(sum - 100) > 0.01) return 'La suma de pesos por ítem debe ser 100%.';
        examShare = Object.keys(cfg.itemWeights || {}).filter(k => k.startsWith('E_')).reduce((a, k) => a + (cfg.itemWeights[k] || 0), 0);
    }
    if (cfg.mode === 'none') return '';
    if (cfg.mode !== 'simple-average') {
        const min = adminCfg.examMinPercent || 0;
        const max = adminCfg.examMaxPercent || 100;
        if (examShare < min || examShare > max) {
            return `El peso de parciales debe estar entre ${min}% y ${max}%. Actual: ${examShare.toFixed(1)}%.`;
        }
    }
    return '';
}

function getFinalizeItemEntries(ctx) {
    return {
        actividades: ctx.acts.map(a => ({ key: 'A_' + a.id, label: 'Taller: ' + a.title })),
        parciales: ctx.exams.map(ex => ({ key: 'E_' + ex.id, label: 'Parcial: ' + ex.title })),
        foros: ctx.realForums.map(f => ({ key: 'F_' + f.id, label: 'Foro: ' + f.title })),
        glosarios: ctx.realGlossaries.map(g => ({ key: 'G_' + g.id, label: 'Glosario: ' + g.title }))
    };
}

function saveVisibleItemWeightInputs() {
    if (!finalizeUnitState || !finalizeUnitState.itemWeightCache) return;
    const wrap = document.getElementById('mFinalizeItemRows');
    if (!wrap) return;
    wrap.querySelectorAll('input[data-key]').forEach(input => {
        finalizeUnitState.itemWeightCache[input.dataset.key] = clampPercent(input.value);
    });
}

function renderFinalizeItemPage() {
    if (!finalizeUnitState || finalizeUnitState.unitIdx === undefined) return;
    const ctx = getFinalizeUnitContext(finalizeUnitState.unitIdx);
    const entriesByCat = getFinalizeItemEntries(ctx);
    const category = (document.getElementById('mItemCategory') || {}).value || 'actividades';
    const all = entriesByCat[category] || [];
    const pageSize = 6;
    const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
    finalizeUnitState.itemPage = Math.min(Math.max(1, finalizeUnitState.itemPage || 1), totalPages);
    const chunk = all.slice((finalizeUnitState.itemPage - 1) * pageSize, finalizeUnitState.itemPage * pageSize);
    const host = document.getElementById('mFinalizeItemRows');
    if (!host) return;
    host.innerHTML = chunk.length ? chunk.map(entry => `<div style="display:grid;grid-template-columns:minmax(220px,1fr) 98px;gap:8px;align-items:center;padding:5px 0"><div style="font-size:12.5px">${entry.label}</div><input data-key="${entry.key}" class="form-input" type="number" min="0" max="100" step="1" value="${clampPercent((finalizeUnitState.itemWeightCache || {})[entry.key] || 0)}" oninput="saveVisibleItemWeightInputs();recalcFinalizeUnitPreview()"></div>`).join('') : '<div style="font-size:12.5px;color:var(--text-muted)">No hay ítems en esta categoría.</div>';
    const pageLbl = document.getElementById('mItemPageLbl');
    if (pageLbl) pageLbl.textContent = `Página ${finalizeUnitState.itemPage} de ${totalPages}`;
    const prev = document.getElementById('mItemPrevBtn');
    const next = document.getElementById('mItemNextBtn');
    if (prev) prev.disabled = finalizeUnitState.itemPage <= 1;
    if (next) next.disabled = finalizeUnitState.itemPage >= totalPages;
}

function changeFinalizeItemCategory() {
    saveVisibleItemWeightInputs();
    finalizeUnitState.itemPage = 1;
    renderFinalizeItemPage();
}

function changeFinalizeItemPage(delta) {
    saveVisibleItemWeightInputs();
    finalizeUnitState.itemPage = (finalizeUnitState.itemPage || 1) + delta;
    renderFinalizeItemPage();
}

function openFinalizeUnitModal(unitIdx) {
    const ctx = getFinalizeUnitContext(unitIdx);
    if (!ctx.unit) return;
    const adminCfg = getAdminGradingConfig();
    const storedCfg = getUnitFinalizeConfig(currentCourse.id, ctx.unit.id);
    const mode = getEffectiveFinalizeMode(adminCfg, storedCfg);
    const examScores = getUnitExamScores(currentCourse.id, ctx.unit.id);
    const defaultGlobal = storedCfg.globalWeights || { activities: 50, exams: 30, forums: 10, glossary: 10 };
    const itemWeights = storedCfg.itemWeights || {};
    const modeLocked = !adminCfg.allowTeacherCustom || !!adminCfg.forcedModel;
    const reportDefault = storedCfg.reportIncludeFinal !== false;
    finalizeUnitState = { unitIdx, unitId: ctx.unit.id, itemWeightCache: { ...itemWeights }, itemPage: 1 };
    openModal('Finalizar unidad — ' + ctx.unit.name, `
        <div style="font-size:13px;color:var(--text-body);line-height:1.65;margin-bottom:12px">Esta acción calcula y registra la nota final de la unidad por estudiante. Las actividades no enviadas o no calificadas cuentan como <strong>0.0</strong>.</div>
        <div class="form-group" style="margin-bottom:10px">
            <label class="form-label">Modelo de cálculo</label>
            <select id="mFinalizeMode" class="form-input" onchange="toggleFinalizeWeightAreas();recalcFinalizeUnitPreview()" ${modeLocked ? 'disabled' : ''}>
                <option value="category-global" ${mode === 'category-global' ? 'selected' : ''}>Por categorías globales</option>
                <option value="item-individual" ${mode === 'item-individual' ? 'selected' : ''}>Porcentajes individuales por ítem</option>
                <option value="simple-average" ${mode === 'simple-average' ? 'selected' : ''}>Promedio simple de todos los ítems</option>
                <option value="none" ${mode === 'none' ? 'selected' : ''}>Ninguno (solo reporte)</option>
            </select>
            ${modeLocked ? '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">Este modelo está fijado por administración/coordinación.</div>' : ''}
        </div>
        <div id="mFinalizeGlobalWrap" style="display:none">
            <div style="display:grid;grid-template-columns:repeat(4,minmax(110px,1fr));gap:10px;margin-bottom:12px">
                <div class="form-group" style="margin:0"><label class="form-label">Talleres (%)</label><input id="mUnitWeightTasks" class="form-input" type="number" min="0" max="100" step="1" value="${defaultGlobal.activities}" oninput="recalcFinalizeUnitPreview()"></div>
                <div class="form-group" style="margin:0"><label class="form-label">Parciales (%)</label><input id="mUnitWeightExam" class="form-input" type="number" min="0" max="100" step="1" value="${defaultGlobal.exams}" oninput="recalcFinalizeUnitPreview()"></div>
                <div class="form-group" style="margin:0"><label class="form-label">Foros (%)</label><input id="mUnitWeightForum" class="form-input" type="number" min="0" max="100" step="1" value="${defaultGlobal.forums}" oninput="recalcFinalizeUnitPreview()"></div>
                <div class="form-group" style="margin:0"><label class="form-label">Glosario (%)</label><input id="mUnitWeightGlossary" class="form-input" type="number" min="0" max="100" step="1" value="${defaultGlobal.glossary}" oninput="recalcFinalizeUnitPreview()"></div>
            </div>
        </div>
        <div id="mFinalizeItemWrap" style="display:none;margin-bottom:12px">
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
                <select id="mItemCategory" class="form-input" style="width:auto" onchange="changeFinalizeItemCategory()">
                    <option value="actividades">Actividades/Talleres</option>
                    <option value="parciales">Parciales</option>
                    <option value="foros">Foros</option>
                    <option value="glosarios">Glosarios</option>
                </select>
                <span id="mItemPageLbl" style="font-size:12px;color:var(--text-muted)">Página 1 de 1</span>
            </div>
            <div id="mFinalizeItemRows" style="max-height:170px;overflow:auto;border:1px solid rgba(11,31,58,0.08);border-radius:8px;padding:8px 10px"></div>
            <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:8px"><button id="mItemPrevBtn" class="btn btn-sm btn-outline" onclick="changeFinalizeItemPage(-1)">Anterior</button><button id="mItemNextBtn" class="btn btn-sm btn-outline" onclick="changeFinalizeItemPage(1)">Siguiente</button></div>
        </div>
        <div id="mFinalizeNoneWrap" style="display:none;font-size:12px;color:var(--text-muted);margin-bottom:12px">Modo "Ninguno": no se calcula ni registra definitiva automática; puedes exportar el reporte y calcular manualmente en Excel.</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px">Rango permitido para parciales por administración: ${adminCfg.examMinPercent}% - ${adminCfg.examMaxPercent}%.</div>
        <div style="margin-bottom:12px">
            <label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" id="mIncludeFinalInReport" ${reportDefault ? 'checked' : ''}> Incluir columna de definitiva en el reporte Excel</label>
        </div>
        <div id="mFinalizeWeightWarning" style="display:none;font-size:12px;color:var(--error);margin-bottom:10px"></div>
        <div style="max-height:48vh;overflow:auto;border:1px solid rgba(11,31,58,0.08);border-radius:10px">
            <table style="margin:0"><thead><tr><th>Estudiante</th><th>Prom. talleres</th><th>Prom. parciales</th><th>Prom. foros</th><th>Glosario</th><th>Bonificación</th><th>Nota final</th></tr></thead><tbody>
                ${MOCK.students.map(st => `<tr>
                    <td><div style="font-size:13px;font-weight:600">${st.user.name}</div><div style="font-size:11px;color:var(--text-muted)">${st.studentCode}</div></td>
                    <td id="mResTasks-${st.id}">0.0</td>
                    <td>
                        <div id="mResExams-${st.id}" style="font-size:12px;font-weight:700;margin-bottom:6px">0.0</div>
                        <div style="display:grid;gap:6px;min-width:150px">
                        ${ctx.exams.length ? ctx.exams.map(ex => `<input title="${ex.title}" id="mUnitExam-${ex.id}-${st.id}" class="form-input" type="number" min="0" max="${GRADE_SCALE_MAX}" step="0.1" value="${fmtGrade(((examScores[ex.id] || {})[st.id]) || 0)}" oninput="recalcFinalizeUnitPreview()" style="padding:4px 7px;font-size:12px">`).join('') : '<span style="font-size:12px;color:var(--text-muted)">—</span>'}
                        </div>
                    </td>
                    <td id="mResForums-${st.id}">0.0</td>
                    <td id="mResGloss-${st.id}">0.0</td>
                    <td id="mResBonus-${st.id}">+0.0</td>
                    <td id="mResFinal-${st.id}"><span class="badge badge-success">0.0</span></td>
                </tr>`).join('')}
            </tbody></table>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:12px;flex-wrap:wrap">
            <div id="mFinalizeAvg" style="font-size:12px;color:var(--text-muted)"></div>
            <div style="display:flex;gap:8px"><button class="btn btn-outline" onclick="generateUnitReport()">Generar reporte</button><button class="btn btn-teal" onclick="finalizeUnitApply()">Finalizar unidad</button></div>
        </div>
    `, { size: 'xl' });
    toggleFinalizeWeightAreas();
    renderFinalizeItemPage();
    recalcFinalizeUnitPreview();
}

function recalcFinalizeUnitPreview() {
    if (!finalizeUnitState || finalizeUnitState.unitIdx === undefined) return;
    const ctx = getFinalizeUnitContext(finalizeUnitState.unitIdx);
    const adminCfg = getAdminGradingConfig();
    saveVisibleItemWeightInputs();
    const cfg = readFinalizeConfig(ctx, adminCfg);
    const examScores = readFinalizeExamScores(ctx);
    const err = validateFinalizeConfig(ctx, cfg, adminCfg);
    const warn = document.getElementById('mFinalizeWeightWarning');
    if (warn) {
        warn.style.display = err ? '' : 'none';
        warn.textContent = err || '';
    }
    let sumFinal = 0;
    MOCK.students.forEach(st => {
        const r = computeStudentUnitResult(ctx, st, examScores, cfg);
        const elTasks = document.getElementById('mResTasks-' + st.id);
        const elExam = document.getElementById('mResExams-' + st.id);
        const elForum = document.getElementById('mResForums-' + st.id);
        const elGloss = document.getElementById('mResGloss-' + st.id);
        const elBonus = document.getElementById('mResBonus-' + st.id);
        const elFinal = document.getElementById('mResFinal-' + st.id);
        if (elTasks) elTasks.textContent = fmtGrade(r.avgActivities);
        if (elExam) elExam.textContent = fmtGrade(r.avgExams);
        if (elForum) elForum.textContent = fmtGrade(r.avgForums);
        if (elGloss) elGloss.textContent = fmtGrade(r.glossaryScore);
        if (elBonus) elBonus.textContent = '+' + fmtGrade(r.bonus);
        if (cfg.mode === 'none') {
            if (elFinal) elFinal.innerHTML = '<span class="badge badge-navy">—</span>';
        } else {
            if (elFinal) elFinal.innerHTML = `<span class="badge ${r.final >= 7 ? 'badge-success' : r.final >= 5 ? 'badge-gold' : 'badge-error'}">${fmtGrade(r.final)}</span>`;
            sumFinal += r.final;
        }
    });
    const avgEl = document.getElementById('mFinalizeAvg');
    if (avgEl) avgEl.textContent = cfg.mode === 'none' ? 'Modo manual: sin definitiva automática.' : ('Promedio del curso (unidad): ' + fmtGrade(MOCK.students.length ? sumFinal / MOCK.students.length : 0));
}

function finalizeUnitApply() {
    if (!finalizeUnitState || finalizeUnitState.unitIdx === undefined) return;
    const ctx = getFinalizeUnitContext(finalizeUnitState.unitIdx);
    if (!ctx.unit) return;
    const adminCfg = getAdminGradingConfig();
    const cfg = readFinalizeConfig(ctx, adminCfg);
    const err = validateFinalizeConfig(ctx, cfg, adminCfg);
    if (err) { showToast(err, 'error'); return; }
    const examScores = readFinalizeExamScores(ctx);
    saveVisibleItemWeightInputs();
    saveUnitExamScores(currentCourse.id, ctx.unit.id, examScores);
    saveUnitFinalizeConfig(currentCourse.id, ctx.unit.id, { ...cfg, reportIncludeFinal: !!((document.getElementById('mIncludeFinalInReport') || {}).checked) });
    if (cfg.mode !== 'none') {
        MOCK.students.forEach(st => {
            const r = computeStudentUnitResult(ctx, st, examScores, cfg);
            const description = `Cierre ${ctx.unit.name}: Talleres ${fmtGrade(r.avgActivities)}, Parciales ${fmtGrade(r.avgExams)}, Foros ${fmtGrade(r.avgForums)}, Glosarios ${fmtGrade(r.glossaryScore)}, Bonificación ${fmtGrade(r.bonus)}.`;
            upsertTeacherGradeRecord(currentCourse.id, st, r.final, description, ctx.unit.id);
        });
    }
    localStorage.setItem('educat_unit_closure_' + currentCourse.id + '_' + ctx.unit.id, JSON.stringify({
        courseId: currentCourse.id,
        unitId: ctx.unit.id,
        unitName: ctx.unit.name,
        config: cfg,
        closedAt: new Date().toISOString()
    }));
    closeModal();
    const selectedCourse = parseInt((document.getElementById('gradeCourseFilter') || {}).value || '0');
    if (selectedCourse === currentCourse.id) renderGrades(currentCourse.id);
    showToast(cfg.mode === 'none' ? 'Unidad cerrada en modo manual (sin definitiva automática)' : 'Unidad finalizada y calificaciones registradas', 'success');
}

function excelCol(colNum) {
    let n = colNum;
    let s = '';
    while (n > 0) {
        const m = (n - 1) % 26;
        s = String.fromCharCode(65 + m) + s;
        n = Math.floor((n - m) / 26);
    }
    return s;
}

function buildUnitReportFormulas(ctx, cfg, columnMap, rowNum) {
    const refs = keyArr => keyArr.filter(k => !!columnMap[k]).map(k => `${excelCol(columnMap[k])}${rowNum}`);
    const avgFn = arr => arr.length ? `AVERAGE(${arr.join(',')})` : '0';
    const actRefs = refs(ctx.acts.map(a => 'A_' + a.id));
    const examRefs = refs(ctx.exams.map(e => 'E_' + e.id));
    const forumRealRefs = refs(ctx.realForums.map(f => 'F_' + f.id));
    const glossaryRealRefs = refs(ctx.realGlossaries.map(g => 'G_' + g.id));
    const bonusTerms = [];
    if (columnMap.BONUS_TOTAL) bonusTerms.push(`${excelCol(columnMap.BONUS_TOTAL)}${rowNum}`);
    const bonusExpr = bonusTerms.length ? bonusTerms.join('+') : '0';
    let baseExpr = '0';
    if (cfg.mode === 'none') {
        return '0';
    }
    if (cfg.mode === 'simple-average') {
        const allRefs = [...actRefs, ...examRefs, ...forumRealRefs, ...glossaryRealRefs];
        baseExpr = allRefs.length ? avgFn(allRefs) : '0';
    } else if (cfg.mode === 'item-individual') {
        const terms = [];
        Object.keys(cfg.itemWeights || {}).forEach(k => {
            const w = (cfg.itemWeights[k] || 0) / 100;
            if (!w || !columnMap[k]) return;
            terms.push(`${excelCol(columnMap[k])}${rowNum}*${w.toFixed(6)}`);
        });
        baseExpr = terms.length ? terms.join('+') : '0';
    } else {
        const gw = cfg.globalWeights || {};
        const a = actRefs.length ? `${avgFn(actRefs)}*${((gw.activities || 0) / 100).toFixed(6)}` : '0';
        const e = examRefs.length ? `${avgFn(examRefs)}*${((gw.exams || 0) / 100).toFixed(6)}` : '0';
        const f = forumRealRefs.length ? `${avgFn(forumRealRefs)}*${((gw.forums || 0) / 100).toFixed(6)}` : '0';
        const g = glossaryRealRefs.length ? `${avgFn(glossaryRealRefs)}*${((gw.glossary || 0) / 100).toFixed(6)}` : '0';
        baseExpr = `${a}+${e}+${f}+${g}`;
    }
    return `MIN(${GRADE_SCALE_MAX},${baseExpr}+${bonusExpr})`;
}

function calcBonusContribution(score, grading) {
    const s = clampGrade(score);
    if (!grading || s <= 0) return 0;
    const raw = parseFloat(grading.bonusValue || 0) || 0;
    // Bonificacion solo por puntos extra directos.
    return clampGrade(raw);
}

function getForumReportValue(forum, studentId) {
    const score = clampGrade((forum.participantGrades || {})[studentId] || 0);
    const type = (forum.grading || {}).type || 'none';
    if (type === 'bonus') return calcBonusContribution(score, forum.grading || {});
    return score;
}

function getGlossaryReportValue(glossary, studentId) {
    const score = clampGrade((glossary.participantGrades || {})[studentId] || 0);
    const type = (glossary.grading || {}).type || 'none';
    if (type === 'bonus') return calcBonusContribution(score, glossary.grading || {});
    return score;
}

function getStudentBonusTotal(ctx, studentId) {
    let total = 0;
    (ctx.bonusForums || []).forEach(f => {
        const score = clampGrade((f.participantGrades || {})[studentId] || 0);
        total += calcBonusContribution(score, f.grading || {});
    });
    (ctx.bonusGlossaries || []).forEach(g => {
        const score = clampGrade((g.participantGrades || {})[studentId] || 0);
        total += calcBonusContribution(score, g.grading || {});
    });
    return clampGrade(total);
}

function generateUnitReport() {
    if (!finalizeUnitState || finalizeUnitState.unitIdx === undefined) return;
    const ctx = getFinalizeUnitContext(finalizeUnitState.unitIdx);
    const adminCfg = getAdminGradingConfig();
    const cfg = readFinalizeConfig(ctx, adminCfg);
    const err = validateFinalizeConfig(ctx, cfg, adminCfg);
    if (err) { showToast(err, 'error'); return; }
    const examScores = readFinalizeExamScores(ctx);
    const includeFinal = !!((document.getElementById('mIncludeFinalInReport') || {}).checked);
    const includeFinalFormula = includeFinal && cfg.mode !== 'none';
    const exportForums = (ctx.forums || []).filter(f => ((f.grading || {}).type || 'none') === 'real');
    const exportGlossaries = (ctx.glossaries || []).filter(g => ((g.grading || {}).type || 'none') === 'real');
    const hasBonusItems = (ctx.bonusForums || []).length > 0 || (ctx.bonusGlossaries || []).length > 0;
    const columns = [
        { key: 'firstName', label: 'Nombre', width: 170 },
        { key: 'lastName', label: 'Apellido', width: 170 },
        { key: 'code', label: 'Código', width: 130 },
        ...ctx.acts.map(a => ({ key: 'A_' + a.id, label: a.title, width: 260 })),
        ...ctx.exams.map(e => ({ key: 'E_' + e.id, label: e.title, width: 240 })),
        ...exportForums.map(f => ({ key: 'F_' + f.id, label: f.title, width: 240 })),
        ...exportGlossaries.map(g => ({ key: 'G_' + g.id, label: g.title, width: 240 }))
    ];
    if (hasBonusItems) columns.push({ key: 'BONUS_TOTAL', label: 'Bonificación total', width: 180 });
    if (includeFinalFormula) columns.push({ key: 'FINAL', label: 'Definitiva', width: 140 });
    const columnMap = {};
    columns.forEach((c, idx) => { columnMap[c.key] = idx + 1; });

    const xmlRows = [];
    const esc = (v) => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const hdrRow1 = [];
    hdrRow1.push(`<Cell ss:StyleID="hdr" ss:MergeDown="1"><Data ss:Type="String">Nombre</Data></Cell>`);
    hdrRow1.push(`<Cell ss:StyleID="hdr" ss:MergeDown="1"><Data ss:Type="String">Apellido</Data></Cell>`);
    hdrRow1.push(`<Cell ss:StyleID="hdr" ss:MergeDown="1"><Data ss:Type="String">Código</Data></Cell>`);
    if (ctx.acts.length) hdrRow1.push(`<Cell ss:StyleID="hdr" ss:MergeAcross="${ctx.acts.length - 1}"><Data ss:Type="String">Talleres / Actividades</Data></Cell>`);
    if (ctx.exams.length) hdrRow1.push(`<Cell ss:StyleID="hdr" ss:MergeAcross="${ctx.exams.length - 1}"><Data ss:Type="String">Parciales</Data></Cell>`);
    if (exportForums.length) hdrRow1.push(`<Cell ss:StyleID="hdr" ss:MergeAcross="${exportForums.length - 1}"><Data ss:Type="String">Foros</Data></Cell>`);
    if (exportGlossaries.length) hdrRow1.push(`<Cell ss:StyleID="hdr" ss:MergeAcross="${exportGlossaries.length - 1}"><Data ss:Type="String">Glosarios</Data></Cell>`);
    if (hasBonusItems) hdrRow1.push(`<Cell ss:StyleID="hdr" ss:MergeDown="1"><Data ss:Type="String">Bonificaciones</Data></Cell>`);
    if (includeFinalFormula) hdrRow1.push(`<Cell ss:StyleID="hdr" ss:MergeDown="1"><Data ss:Type="String">Definitiva</Data></Cell>`);
    xmlRows.push(`<Row>${hdrRow1.join('')}</Row>`);

    const subLabels = [
        ...ctx.acts.map(a => esc(a.title)),
        ...ctx.exams.map(e => esc(e.title)),
        ...exportForums.map(f => esc(f.title)),
        ...exportGlossaries.map(g => esc(g.title))
    ];
    const headerRowsCount = subLabels.length ? 2 : 1;
    if (subLabels.length) {
        const subCells = subLabels.map((l, idx) => idx === 0
            ? `<Cell ss:Index="4" ss:StyleID="hdr"><Data ss:Type="String">${l}</Data></Cell>`
            : `<Cell ss:StyleID="hdr"><Data ss:Type="String">${l}</Data></Cell>`).join('');
        xmlRows.push(`<Row>${subCells}</Row>`);
    }

    MOCK.students.forEach((st, i) => {
        const nm = splitStudentName((st.user || {}).name || '');
        const rowNum = i + headerRowsCount + 1;
        const forumById = {};
        exportForums.forEach(f => {
            forumById[f.id] = getForumReportValue(f, st.id);
        });
        const glossaryById = {};
        exportGlossaries.forEach(g => {
            glossaryById[g.id] = getGlossaryReportValue(g, st.id);
        });
        const bonusTotal = hasBonusItems ? getStudentBonusTotal(ctx, st.id) : 0;
        const cells = [
            `<Cell><Data ss:Type="String">${nm.firstName}</Data></Cell>`,
            `<Cell><Data ss:Type="String">${nm.lastName}</Data></Cell>`,
            `<Cell><Data ss:Type="String">${st.studentCode || ''}</Data></Cell>`,
            ...ctx.acts.map(a => {
                const sub = getStudentSubmission(st.id, a.id);
                const val = (sub && sub.submitted && sub.graded) ? clampGrade(sub.grade) : 0;
                return `<Cell><Data ss:Type="Number">${val.toFixed(2)}</Data></Cell>`;
            }),
            ...ctx.exams.map(e => `<Cell><Data ss:Type="Number">${clampGrade((examScores[e.id] || {})[st.id] || 0).toFixed(2)}</Data></Cell>`),
            ...exportForums.map(f => `<Cell><Data ss:Type="Number">${(forumById[f.id] || 0).toFixed(2)}</Data></Cell>`),
            ...exportGlossaries.map(g => `<Cell><Data ss:Type="Number">${(glossaryById[g.id] || 0).toFixed(2)}</Data></Cell>`),
            ...(hasBonusItems ? [`<Cell><Data ss:Type="Number">${bonusTotal.toFixed(2)}</Data></Cell>`] : [])
        ];
        if (includeFinalFormula) {
            const formula = buildUnitReportFormulas(ctx, cfg, columnMap, rowNum);
            cells.push(`<Cell ss:StyleID="final" ss:Formula="=${formula}"><Data ss:Type="Number">0</Data></Cell>`);
        }
        xmlRows.push(`<Row>${cells.join('')}</Row>`);
    });

    const xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="11"/><Interior/><Borders/></Style>
  <Style ss:ID="hdr"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1E6B74" ss:Pattern="Solid"/></Style>
  <Style ss:ID="final"><Font ss:Bold="1"/><Interior ss:Color="#FFF7D6" ss:Pattern="Solid"/></Style>
 </Styles>
 <Worksheet ss:Name="Reporte unidad">
  <Table>
   ${columns.map(c => `<Column ss:AutoFitWidth="0" ss:Width="${c.width || 220}"/>`).join('')}
   ${xmlRows.join('')}
  </Table>
 </Worksheet>
</Workbook>`;
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = ('reporte_unidad_' + (ctx.unit.name || 'unidad')).replace(/\s+/g, '_') + '.xls';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
    showToast('Reporte generado en Excel', 'success');
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
    units.push({ id: 'u' + Date.now(), name, welcome: document.getElementById('mUnitWelcome').value, description: document.getElementById('mUnitDesc').value, announcements: [], activities: [], exams: [], resources: [], forums: [], glossaryTerms: [] });
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
    openConfirmModal('Eliminar unidad', '¿Eliminar esta unidad y todo su contenido?', () => {
        const units = getUnits(currentCourse.id);
        units.splice(idx, 1);
        saveUnits(currentCourse.id, units);
        const newIdx = Math.max(0, idx - 1);
        renderUnitTabs();
        if (units.length) renderUnit(newIdx);
        else document.getElementById('unitContentArea').innerHTML = '<div class="empty-state"><div class="empty-state-title">Sin unidades</div><div class="empty-state-text">Agrega la primera unidad.</div><button class="btn btn-teal" style="margin-top:16px" onclick="addUnitModal()">Agregar unidad</button></div>';
        document.getElementById('cvCourseMeta').textContent = (currentCourse.studentsCount || 0) + ' estudiantes · ' + units.length + ' unidades';
        showToast('Unidad eliminada');
    }, 'Eliminar');
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
            <label class="form-label">Hora límite de entrega</label>
            <input type="time" class="form-input" id="mActTime" value="23:59">
        </div>
        <div class="form-group">
            <label class="form-label">Visible para estudiantes desde</label>
            <select class="form-input" id="mActVisibleMode" onchange="document.getElementById('mActVisibleFromWrap').style.display=this.value==='scheduled'?'':'none'">
                <option value="now" selected>Inmediatamente</option>
                <option value="scheduled">Programar fecha y hora</option>
            </select>
        </div>
        <div class="form-group" id="mActVisibleFromWrap" style="display:none">
            <label class="form-label">Fecha y hora de publicación</label>
            <input type="datetime-local" class="form-input" id="mActVisibleFrom">
        </div>
        <div class="form-group">
            <label class="form-label">Permitir entrega con retraso</label>
            <select class="form-input" id="mActLate">
                <option value="yes" selected>Si, permitir entregas tardias</option>
                <option value="no">No, bloquear fuera de fecha</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Archivos adjuntos para el estudiante <span style="font-weight:400;color:var(--text-muted)">(guías, rúbricas, plantillas…)</span></label>
            ${modalDropAreaNoVideo(keyAtts, 'Arrastra guías, rúbricas o cualquier archivo')}
        </div>
        <div class="form-group">
            <label class="form-label">Bibliografía y material de apoyo <span style="font-weight:400;color:var(--text-muted)">(lecturas y referencias)</span></label>
            ${modalDropAreaNoVideo(keyMats, 'Arrastra PDFs y otros materiales de apoyo')}
        </div>
        <div class="form-group">
            <label class="form-label">Videos (solo enlaces de YouTube)</label>
            <textarea class="form-input" id="mActYoutubeLinks" placeholder="https://www.youtube.com/watch?v=... (uno por línea)" style="min-height:90px"></textarea>
        </div>
        <button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="saveActivity(${unitIdx},'${keyAtts}','${keyMats}')">Agregar actividad</button>`);
}

function saveActivity(unitIdx, keyAtts, keyMats) {
    const title = document.getElementById('mActTitle').value.trim();
    if (!title) { showToast('El título es obligatorio', 'error'); return; }
    const attachments = getModalAttachments(keyAtts, []);
    const materials   = getModalAttachments(keyMats, []);
    const youtubeLinks = parseYoutubeLinks((document.getElementById('mActYoutubeLinks') || {}).value || '');
    const newAct = {
        id: Date.now(),
        course: { id: currentCourse.id },
        title,
        description: document.getElementById('mActDesc').value,
        dueDate: document.getElementById('mActDate').value,
        dueTime: (document.getElementById('mActTime') || {}).value || '23:59',
        allowLateSubmission: document.getElementById('mActLate').value !== 'no',
        visibleFrom: (document.getElementById('mActVisibleMode') || {}).value === 'scheduled'
            ? ((document.getElementById('mActVisibleFrom') || {}).value || null)
            : null,
        attachments,
        materials: [...materials, ...youtubeLinks]
    };
    MOCK.activities.push(newAct);
    const courseActs = getCourseActivitiesMerged(currentCourse.id);
    courseActs.push(newAct);
    saveStoredCourseActivities(currentCourse.id, courseActs);
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
            <label class="form-label">Hora límite de entrega</label>
            <input type="time" class="form-input" id="mActTime" value="${a.dueTime || '23:59'}">
        </div>
        <div class="form-group">
            <label class="form-label">Visible para estudiantes desde</label>
            <select class="form-input" id="mActVisibleMode" onchange="document.getElementById('mActVisibleFromWrap').style.display=this.value==='scheduled'?'':'none'">
                <option value="now" ${(a.visibleFrom ? '' : 'selected')}>Inmediatamente</option>
                <option value="scheduled" ${(a.visibleFrom ? 'selected' : '')}>Programar fecha y hora</option>
            </select>
        </div>
        <div class="form-group" id="mActVisibleFromWrap" style="${a.visibleFrom ? '' : 'display:none'}">
            <label class="form-label">Fecha y hora de publicación</label>
            <input type="datetime-local" class="form-input" id="mActVisibleFrom" value="${a.visibleFrom || ''}">
        </div>
        <div class="form-group">
            <label class="form-label">Permitir entrega con retraso</label>
            <select class="form-input" id="mActLate">
                <option value="yes" ${a.allowLateSubmission === false ? '' : 'selected'}>Si, permitir entregas tardias</option>
                <option value="no" ${a.allowLateSubmission === false ? 'selected' : ''}>No, bloquear fuera de fecha</option>
            </select>
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
            ${modalDropAreaNoVideo(keyAtts, 'Agregar guías, rúbricas o plantillas')}
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
            ${modalDropAreaNoVideo(keyMats, 'Agregar PDFs u otras referencias')}
        </div>
        <div class="form-group">
            <label class="form-label">Videos (solo enlaces de YouTube)</label>
            <textarea class="form-input" id="mActYoutubeLinks" placeholder="https://www.youtube.com/watch?v=... (uno por línea)" style="min-height:90px">${(existingMats || []).filter(m => (m.type || '') === 'video' && /youtube\.com|youtu\.be/i.test(m.url || '')).map(m => m.url).join('\n')}</textarea>
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
    a.dueTime     = (document.getElementById('mActTime') || {}).value || '23:59';
    a.allowLateSubmission = document.getElementById('mActLate').value !== 'no';
    a.visibleFrom = (document.getElementById('mActVisibleMode') || {}).value === 'scheduled'
        ? ((document.getElementById('mActVisibleFrom') || {}).value || null)
        : null;
    // Merge new uploads with whatever remains after inline removals
    a.attachments = getModalAttachments(keyAtts, Array.isArray(a.attachments) ? a.attachments : []);
    const currentMats = Array.isArray(a.materials) ? a.materials : [];
    const matsNoVideos = currentMats.filter(m => (m.type || '') !== 'video' || !/youtube\.com|youtu\.be/i.test(m.url || ''));
    const newMats = getModalAttachments(keyMats, matsNoVideos);
    const youtubeLinks = parseYoutubeLinks((document.getElementById('mActYoutubeLinks') || {}).value || '');
    a.materials = [...newMats, ...youtubeLinks];
    const courseActs = getCourseActivitiesMerged(currentCourse.id);
    const idxAct = courseActs.findIndex(x => String(x.id) === String(a.id));
    if (idxAct >= 0) courseActs[idxAct] = a;
    else courseActs.push(a);
    saveStoredCourseActivities(currentCourse.id, courseActs);
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
    const courseActs = getCourseActivitiesMerged(currentCourse.id).filter(a => String(a.id) !== String(actId));
    saveStoredCourseActivities(currentCourse.id, courseActs);
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
        <div class="form-group"><label class="form-label">Hora</label><input type="time" class="form-input" id="mExTime" value="07:00"></div>
        <div class="form-group"><label class="form-label">Descripción</label><textarea class="form-input" id="mExDesc" placeholder="Temas, duración, materiales permitidos..."></textarea></div>
        <button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="saveExam(${unitIdx})">Programar evaluación</button>`);
}

function saveExam(unitIdx) {
    const title = document.getElementById('mExTitle').value.trim();
    if (!title) { showToast('El título es obligatorio', 'error'); return; }
    const newExam = { id: Date.now(), course: { id: currentCourse.id }, title, examDate: document.getElementById('mExDate').value, examTime: (document.getElementById('mExTime') || {}).value || '07:00', description: document.getElementById('mExDesc').value };
    MOCK.exams.push(newExam);
    const courseExams = getCourseExamsMerged(currentCourse.id);
    courseExams.push(newExam);
    saveStoredCourseExams(currentCourse.id, courseExams);
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
        <div class="form-group"><label class="form-label">Hora</label><input type="time" class="form-input" id="mExTime" value="${x.examTime || '07:00'}"></div>
        <div class="form-group"><label class="form-label">Descripción</label><textarea class="form-input" id="mExDesc">${x.description || ''}</textarea></div>
        <button class="btn btn-teal" style="width:100%;margin-top:4px" onclick="updateExam(${examId},${unitIdx})">Guardar cambios</button>`);
}

function updateExam(examId, unitIdx) {
    const x = MOCK.exams.find(e => e.id === examId);
    if (!x) return;
    x.title = document.getElementById('mExTitle').value.trim() || x.title;
    x.examDate = document.getElementById('mExDate').value;
    x.examTime = (document.getElementById('mExTime') || {}).value || '07:00';
    x.description = document.getElementById('mExDesc').value;
    const courseExams = getCourseExamsMerged(currentCourse.id);
    const idxEx = courseExams.findIndex(e => String(e.id) === String(x.id));
    if (idxEx >= 0) courseExams[idxEx] = x;
    else courseExams.push(x);
    saveStoredCourseExams(currentCourse.id, courseExams);
    closeModal(); renderUnit(unitIdx); showToast('Evaluación actualizada', 'success');
}

function removeExam(examId, unitIdx) {
    const units = getUnits(currentCourse.id);
    units[unitIdx].exams = (units[unitIdx].exams || []).filter(id => id !== examId);
    saveUnits(currentCourse.id, units);
    const courseExams = getCourseExamsMerged(currentCourse.id).filter(e => String(e.id) !== String(examId));
    saveStoredCourseExams(currentCourse.id, courseExams);
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
    if (!cId || !day || !start || !end) { showToast('Completa todos los campos del horario', 'error'); return; }
    if (start >= end) { showToast('La hora de fin debe ser mayor que la hora de inicio', 'error'); return; }
    const course = MOCK.courses.find(c => c.id === cId) || {};
    MOCK.schedules.push({ id: Date.now(), course: { id: cId, name: course.name }, day, startTime: start, endTime: end });
    closeModal(); loadHorarios(); showToast('Horario agregado', 'success');
}

function getAllAbsenceReports() {
    const central = JSON.parse(localStorage.getItem('educat_absence_reports') || '[]');
    if (central.length) return central;

    const reports = [];
    MOCK.students.forEach(s => {
        const items = JSON.parse(localStorage.getItem('educat_ausencias_' + s.id) || '[]');
        items.forEach(item => {
            reports.push({
                id: item.id || ('abs-' + s.id + '-' + (item.ts || Date.now())),
                studentId: s.id,
                studentName: s.user.name,
                studentCode: s.studentCode,
                courseId: item.courseId || null,
                courseName: item.courseName || item.curso || 'Curso',
                fecha: item.fecha,
                motivo: item.motivo || '',
                descripcion: item.descripcion || '',
                files: item.files || [],
                archivos: item.archivos || 0,
                status: item.status || 'pending',
                ts: item.ts || Date.now()
            });
        });
    });
    return reports;
}

function ensureTeacherAbsenceCard() {
    const panel = document.getElementById('panel-asistencia');
    if (!panel || document.getElementById('teacherAbsenceContainer')) return;

    panel.insertAdjacentHTML('beforeend', `
        <div class="card" style="margin-top:0">
            <div class="card-header">
                <span class="card-title">Excusas de Inasistencia</span>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                    <select class="form-input" id="absenceReviewCourse" style="width:auto;padding:7px 12px;font-size:13px">
                        <option value="">Todos los cursos</option>
                    </select>
                    <select class="form-input" id="absenceStatusFilter" style="width:auto;padding:7px 12px;font-size:13px">
                        <option value="all">Todos los estados</option>
                        <option value="pending">Pendiente</option>
                        <option value="approved">Valida</option>
                        <option value="rejected">No valida</option>
                    </select>
                    <input class="form-input" id="absenceSearchInput" placeholder="Filtrar por estudiante, código o motivo" style="min-width:260px">
                </div>
            </div>
            <div class="card-body" id="teacherAbsenceContainer">
                <div class="empty-state" style="padding:24px 0">
                    <div class="empty-state-title">Sin reportes</div>
                    <div class="empty-state-text">Aun no hay excusas de inasistencia registradas.</div>
                </div>
            </div>
        </div>
    `);
}

function renderTeacherAbsenceReports() {
    ensureTeacherAbsenceCard();
    const state = tableUiState.absences;
    const container = document.getElementById('teacherAbsenceContainer');
    const filter = parseInt((document.getElementById('absenceReviewCourse') || {}).value || '0');
    const statusEl = document.getElementById('absenceStatusFilter');
    const searchEl = document.getElementById('absenceSearchInput');
    const status = statusEl ? (statusEl.value || 'all') : (state.status || 'all');
    const query = ((searchEl ? searchEl.value : state.query) || '').trim().toLowerCase();
    state.status = status;
    state.query = query;

    let reports = getAllAbsenceReports();
    if (filter) reports = reports.filter(r => parseInt(r.courseId || '0') === filter);
    if (status !== 'all') reports = reports.filter(r => String(r.status || 'pending') === status);
    if (query) {
        reports = reports.filter(r => {
            const student = r.studentName || '';
            const code = r.studentCode || '';
            const motivo = r.motivo || '';
            const desc = r.descripcion || '';
            return student.toLowerCase().includes(query) || code.toLowerCase().includes(query) || motivo.toLowerCase().includes(query) || desc.toLowerCase().includes(query);
        });
    }
    reports = reports.sort((a, b) => (b.ts || 0) - (a.ts || 0));

    const totalPages = Math.max(1, Math.ceil(reports.length / state.pageSize));
    const safePage = Math.min(Math.max(1, state.page), totalPages);
    state.page = safePage;
    const pageReports = reports.slice((safePage - 1) * state.pageSize, safePage * state.pageSize);

    if (!reports.length) {
        container.innerHTML = '<div class="empty-state" style="padding:24px 0"><div class="empty-state-title">Sin reportes</div><div class="empty-state-text">No hay excusas para los filtros seleccionados.</div></div>';
        return;
    }

    container.innerHTML = pageReports.map((r, ri) => {
        const badge = r.status === 'approved'
            ? '<span class="badge badge-success">Valida</span>'
            : r.status === 'rejected'
                ? '<span class="badge badge-error">No valida</span>'
                : '<span class="badge badge-gold">Pendiente</span>';
        const files = Array.isArray(r.files) ? r.files : [];
        return `<div class="card" style="margin-bottom:14px">
            <div class="card-header" style="padding:14px 18px">
                <div>
                    <div style="font-size:14px;font-weight:700">${r.studentName || 'Estudiante'} <span style="font-size:11px;color:var(--text-muted);font-weight:500">${r.studentCode || ''}</span></div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${r.courseName || '—'} · ${r.fecha || '—'}</div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${badge}</div>
            </div>
            <div class="card-body" style="padding:16px 18px">
                <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px">Motivo</div>
                <div style="font-size:13px;line-height:1.65;color:var(--text-body);background:var(--cream);border-radius:8px;padding:10px 12px;border:1px solid rgba(11,31,58,0.06)">${r.motivo || 'Sin motivo'}</div>
                <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:var(--text-muted);text-transform:uppercase;margin:12px 0 6px">Descripcion</div>
                <div style="font-size:13px;line-height:1.65;color:var(--text-body);background:#fff;border-radius:8px;padding:10px 12px;border:1px solid rgba(11,31,58,0.08);max-height:160px;overflow:auto">${r.descripcion || 'Sin detalle adicional'}</div>
                <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:var(--text-muted);text-transform:uppercase;margin:12px 0 6px">Soportes (${files.length || r.archivos || 0})</div>
                <div>${files.length ? files.map((f, fi) => {
                    const hasUrl = !!(f.dataUrl || f.url);
                    return `<div class="attachment-item" style="margin-bottom:6px"><div class="attachment-icon doc"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><span class="attachment-name">${f.name || 'Archivo'}</span><span class="attachment-meta">${f.size ? (f.size/1024).toFixed(0) + ' KB' : ''}</span><button class="attachment-download" ${hasUrl ? `onclick="previewAbsenceSupport('${String(r.id).replace(/'/g, "\\'")}',${fi})"` : 'disabled'}>${hasUrl ? 'Previsualizar' : 'Sin vista previa'}</button><button class="attachment-download" ${hasUrl ? `onclick="downloadAbsenceSupport('${String(r.id).replace(/'/g, "\\'")}',${fi})"` : 'disabled'}>${hasUrl ? 'Descargar' : 'Sin descarga'}</button></div>`;
                }).join('') : '<div style="font-size:12px;color:var(--text-muted)">No se adjuntaron soportes.</div>'}</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn btn-sm btn-success-outline" onclick="updateAbsenceReportStatus('${r.id}','approved')">Validar excusa</button><button class="btn btn-sm btn-danger" onclick="updateAbsenceReportStatus('${r.id}','rejected')">No validar</button></div>
            </div>
        </div>`;
    }).join('') + `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px;flex-wrap:wrap"><span style="font-size:12px;color:var(--text-muted)">Mostrando ${(safePage - 1) * state.pageSize + 1}-${Math.min(safePage * state.pageSize, reports.length)} de ${reports.length}</span><div style="display:flex;gap:6px"><button class="btn btn-sm btn-outline" ${safePage===1?'disabled':''} onclick="changeAbsenceReportsPage(-1)">Anterior</button><button class="btn btn-sm btn-outline" ${safePage===totalPages?'disabled':''} onclick="changeAbsenceReportsPage(1)">Siguiente</button></div></div>`;
}

function changeAbsenceReportsPage(delta) {
    tableUiState.absences.page += delta;
    renderTeacherAbsenceReports();
}

function getAbsenceReportById(reportId) {
    const reports = getAllAbsenceReports();
    return reports.find(r => String(r.id) === String(reportId)) || null;
}

function previewAbsenceSupport(reportId, fileIdx) {
    const report = getAbsenceReportById(reportId);
    if (!report || !report.files || !report.files[fileIdx]) return;
    const file = report.files[fileIdx];
    const src = file.dataUrl || file.url;
    if (!src) { showToast('Este archivo no tiene una URL de previsualizacion disponible.', 'error'); return; }
    const isImage = (file.type || '').startsWith('image/') || /^data:image\//.test(src);
    const isPdf = (file.type || '').includes('pdf') || /^data:application\/pdf/.test(src) || (file.name || '').toLowerCase().endsWith('.pdf');
    const viewer = isImage
        ? `<img src="${src}" alt="Soporte" style="max-width:100%;border-radius:8px;border:1px solid rgba(11,31,58,0.08)">`
        : isPdf
            ? `<iframe src="${src}" style="width:100%;height:62vh;border:1px solid rgba(11,31,58,0.1);border-radius:8px"></iframe>`
            : `<div style="font-size:13px;color:var(--text-muted)">No hay vista integrada para este tipo de archivo. Usa descargar.</div>`;
    openModal('Soporte: ' + (file.name || 'archivo'), `${viewer}<div style="margin-top:10px"><button class="btn btn-teal" onclick="downloadAbsenceSupport('${String(reportId).replace(/'/g, "\\'")}',${fileIdx})">Descargar</button></div>`);
}

function downloadAbsenceSupport(reportId, fileIdx) {
    const report = getAbsenceReportById(reportId);
    if (!report || !report.files || !report.files[fileIdx]) return;
    const file = report.files[fileIdx];
    const src = file.dataUrl || file.url;
    if (!src) { showToast('Archivo sin URL de descarga.', 'error'); return; }
    const a = document.createElement('a');
    a.href = src;
    a.download = file.name || 'soporte';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
}

function updateAbsenceReportStatus(reportId, status) {
    const reports = getAllAbsenceReports();
    const idx = reports.findIndex(r => String(r.id) === String(reportId));
    if (idx < 0) return;
    reports[idx].status = status;
    reports[idx].reviewedAt = new Date().toISOString();
    localStorage.setItem('educat_absence_reports', JSON.stringify(reports));
    if (reports[idx].studentId) {
        const studentKey = 'educat_ausencias_' + reports[idx].studentId;
        const studentReports = JSON.parse(localStorage.getItem(studentKey) || '[]');
        const studentIdx = studentReports.findIndex(r => String(r.id) === String(reportId));
        if (studentIdx >= 0) {
            studentReports[studentIdx].status = status;
            studentReports[studentIdx].reviewedAt = reports[idx].reviewedAt;
            localStorage.setItem(studentKey, JSON.stringify(studentReports));
        }
    }
    showToast(status === 'approved' ? 'Excusa marcada como valida' : 'Excusa marcada como no valida', 'success');
    renderTeacherAbsenceReports();
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

document.getElementById('sidebarCloseBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('educat_auth'); localStorage.removeItem('educat_email');
    sessionStorage.removeItem('educat_auth'); sessionStorage.removeItem('educat_email');
    window.location.href = 'login.html';
});

document.getElementById('modalClose').addEventListener('click', closeModal);

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