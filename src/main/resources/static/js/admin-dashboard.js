const API = '';
let activeSessionUser = null;
let currentEffectivePermissions = [];

function buildRuntimeStore() {
    const data = Object.create(null);
    const keys = [];
    const add = k => { if (keys.indexOf(k) === -1) keys.push(k); };
    const del = k => {
        const idx = keys.indexOf(k);
        if (idx >= 0) keys.splice(idx, 1);
    };
    return {
        getItem(key) {
            const k = String(key || '');
            return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null;
        },
        setItem(key, value) {
            const k = String(key || '');
            data[k] = String(value);
            add(k);
        },
        removeItem(key) {
            const k = String(key || '');
            delete data[k];
            del(k);
        },
        key(index) {
            const i = Number(index);
            if (isNaN(i) || i < 0 || i >= keys.length) return null;
            return keys[i];
        },
        clear() {
            keys.slice().forEach(k => delete data[k]);
            keys.length = 0;
        },
        get length() {
            return keys.length;
        }
    };
}

const storageService = buildRuntimeStore();
const sessionService = buildRuntimeStore();

const STORAGE_KEYS = {
    guides: 'educat_admin_instructivos',
    forms: 'educat_admin_eval_forms',
    formsMeta: 'educat_admin_eval_forms_meta',
    customForms: 'educat_admin_custom_forms',
    formResponses: 'educat_admin_form_responses',
    formShares: 'educat_admin_form_shares',
    surveys: 'educat_admin_surveys',
    rolePerms: 'educat_admin_role_permissions',
    userPerms: 'educat_admin_user_permissions',
    gradePolicy: 'educat_admin_grade_policy',
    academicLevels: 'educat_admin_academic_levels',
    academicGrades: 'educat_admin_academic_grades',
    courseLevels: 'educat_admin_course_levels',
    courseGrades: 'educat_admin_course_grades',
    courseCapacity: 'educat_admin_course_capacity',
    teacherLevels: 'educat_admin_teacher_levels',
    teacherGrades: 'educat_admin_teacher_grades',
    assignmentRules: 'educat_admin_assignment_rules',
    courseCreateDraft: 'educat_admin_course_create_draft',
    localUsers: 'educat_local_users',
    localTeachers: 'educat_local_teachers',
    localRoles: 'educat_local_roles',
    localStudents: 'educat_local_students',
    studentLevels: 'educat_student_levels',
    studentGrades: 'educat_student_grades',
    localCourses: 'educat_local_courses',
    localEnrollments: 'educat_local_enrollments',
    enrollmentRequests: 'educat_enrollment_requests',
    enrollmentFormConfig: 'educat_enrollment_form_config'
};

const PERMISSIONS = [];
const PERMISSION_LABELS = {};
const PORTAL_PERMISSIONS = ['portal.admin', 'portal.teacher', 'portal.student'];

const DEFAULT_GUIDES = [
    { id: 'ins-manual', title: 'Manual de Convivencia', detail: 'Normas y rutas institucionales.', hasText: true, hasPdf: true, pdfUrl: '/docs/manual-convivencia.pdf', textSections: [{ heading: 'Proposito', paragraphs: ['Define acuerdos institucionales.'], bullets: ['Respeto', 'Dialogo', 'Corresponsabilidad'] }] },
    { id: 'ins-certificados', title: 'Descarga de Certificados', detail: 'Proceso para visualizar y descargar certificados.', hasText: true, hasPdf: false, pdfUrl: '', textSections: [{ heading: 'Pasos', bullets: ['Ir a Area Personal', 'Abrir Certificados', 'Visualizar o descargar'] }] }
];

const DEFAULT_FORMS = {
    eval: [
        { id: 'q1', type: 'binary', label: 'Puntualidad', text: 'El docente llega puntualmente a clases?', required: true },
        { id: 'q2', type: 'rating5', label: 'Claridad', text: 'Claridad en la explicacion de los temas (1-5).', required: true },
        { id: 'q3', type: 'rating10', label: 'Metodologia', text: 'Calidad de la metodologia de ensenanza (0-10).', required: true },
        { id: 'q4', type: 'open', label: 'Sugerencias', text: 'Que sugerencias tienes?', required: false }
    ],
    autoeval: [
        { id: 'a1', type: 'binary', label: 'Asistencia', text: 'Asististe regularmente?', required: true },
        { id: 'a2', type: 'rating5', label: 'Participacion', text: 'Evalua tu participacion (1-5).', required: true },
        { id: 'a3', type: 'open', label: 'Compromisos', text: 'Que compromisos asumes?', required: false }
    ]
};

const DEFAULT_POLICY = {
    selectedMethod: 'simple',
    allowTeacherCustom: true,
    forcedModel: '',
    examMinPercent: 0,
    examMaxPercent: 100,
    scheduleSelectionMode: 'free'
};

const QUESTION_TYPES = [
    { id: 'binary', label: 'Si/No' },
    { id: 'rating5', label: 'Escala 1-5' },
    { id: 'rating10', label: 'Escala 0-10' },
    { id: 'single', label: 'Opcion unica' },
    { id: 'multiselect', label: 'Seleccion multiple' },
    { id: 'open', label: 'Respuesta abierta' }
];

const SURVEY_NO_ROLE = 'NO_ROLE';
const ENROLLMENT_FORM_MAX_FILE_FIELDS = 4;
const ADMIN_NAV_SESSION_KEY = 'educat_admin_nav_state_v2';
const DEFAULT_ENROLLMENT_FORM_FIELDS = [
    { id: 'studentName', section: 'Datos del estudiante', type: 'text', label: 'Nombre completo', placeholder: 'Nombre del estudiante', required: true },
    { id: 'studentDoc', section: 'Datos del estudiante', type: 'text', label: 'Documento', placeholder: 'CC / TI / Pasaporte', required: true },
    { id: 'studentBirthDate', section: 'Datos del estudiante', type: 'date', label: 'Fecha de nacimiento', placeholder: '', required: true },
    { id: 'studentGender', section: 'Datos del estudiante', type: 'select', label: 'Genero', placeholder: '', required: true, options: ['Femenino', 'Masculino', 'Otro', 'Prefiero no decirlo'] },
    { id: 'studentEmail', section: 'Datos del estudiante', type: 'email', label: 'Correo electronico del estudiante', placeholder: 'estudiante@dominio.com', required: true, immutable: true },
    { id: 'level', section: 'Datos academicos', type: 'select', label: 'Nivel academico', placeholder: '', required: true, options: [] },
    { id: 'grade', section: 'Datos academicos', type: 'select', label: 'Grado', placeholder: '', required: true, options: [] },
    { id: 'studentLastName', section: 'Datos del estudiante', type: 'text', label: 'Apellidos del estudiante', placeholder: 'Apellidos del estudiante', required: true },
    { id: 'guardianName', section: 'Acudiente y contacto', type: 'text', label: 'Nombre del acudiente', placeholder: 'Nombre del responsable', required: true },
    { id: 'guardianRelation', section: 'Acudiente y contacto', type: 'text', label: 'Parentesco', placeholder: 'Ej: Madre, Padre, Tutor', required: true },
    { id: 'contactPhone', section: 'Acudiente y contacto', type: 'tel', label: 'Telefono', placeholder: 'Celular o fijo', required: true },
    { id: 'contactEmail', section: 'Acudiente y contacto', type: 'email', label: 'Correo de contacto', placeholder: 'correo@dominio.com', required: true },
    { id: 'address', section: 'Acudiente y contacto', type: 'text', label: 'Direccion', placeholder: 'Direccion de residencia', required: true },
    { id: 'notes', section: 'Acudiente y contacto', type: 'textarea', label: 'Observaciones (opcional)', placeholder: 'Informacion medica, apoyos requeridos, comentarios...', required: false },
    { id: 'schoolCertificateFile', section: 'Documentos adjuntos', type: 'file', label: 'Certificado de escolaridad', placeholder: '', required: true },
    { id: 'guardianDocumentFile', section: 'Documentos adjuntos', type: 'file', label: 'Copia del documento de identidad del acudiente', placeholder: '', required: true },
    { id: 'studentIdentityCardFile', section: 'Documentos adjuntos', type: 'file', label: 'Tarjeta de identidad', placeholder: '', required: true },
    { id: 'healthAffiliationFile', section: 'Documentos adjuntos', type: 'file', label: 'Certificado de afiliacion al sistema de salud (opcional)', placeholder: '', required: false },
    { id: 'additionalFilesUrl', section: 'Documentos adjuntos', type: 'url', label: 'URL para documentos adicionales (opcional)', placeholder: 'https://...', required: false }
];

const state = {
    users: [],
    teachers: [],
    students: [],
    courses: [],
    enrollments: [],
    roles: [],
    certificates: [],
    guides: [],
    forms: { eval: [], autoeval: [] },
    formsMeta: { eval: { title: 'Evaluacion docente' }, autoeval: { title: 'Autoevaluacion' } },
    customForms: [],
    formResponses: [],
    formShares: {},
    surveys: [],
    certTemplates: [],
    permissionCatalog: [],
    rolePerms: {},
    userPerms: {},
    userPortalAccess: {},
    gradePolicy: { ...DEFAULT_POLICY },
    academicLevels: [],
    academicGrades: [],
    courseLevels: {},
    courseGrades: {},
    courseCapacity: {},
    teacherLevels: {},
    teacherGrades: {},
    studentLevels: {},
    studentGrades: {},
    assignmentRules: [],
    ui: {
        rolesSearch: '',
        rolesPage: 1,
        rolesPageSize: 8,
        permRoleSearch: '',
        permRolePage: 1,
        permRolePageSize: 20,
        permUserSearch: '',
        permUserSearchTimer: null,
        permUserPage: 1,
        permUserPageSize: 20,
        permRoleChecklistPage: 1,
        permRoleChecklistPageSize: 10,
        permUserChecklistPage: 1,
        permUserChecklistPageSize: 10,
        adminUsersSearch: '',
        adminUsersRoleFilter: 'all',
        adminUsersPage: 1,
        adminUsersPageSize: 8,
        adminUsersSelectedIds: [],
        adminUsersFilteredIds: [],
        adminUsersCurrentPageIds: [],
        formBuilderPage: 1,
        formBuilderPageSize: 5,
        formDraft: { type: 'eval', title: '', questions: [] },
        surveyDraft: {
            options: [{ text: '', media: null }],
            roles: ['ESTUDIANTE'],
            startsAt: '',
            endsAt: '',
            authRequired: true,
            questionMedia: null
        },
        surveyHistoryPage: 1,
        surveyHistoryPageSize: 5,
        adminCoursesQuery: '',
        adminCoursesFilter: 'all',
        adminCoursesPage: 1,
        adminCoursesPageSize: 6,
        certFilterLevel: '',
        certFilterGrade: '',
        certFilterGrades: [],
        certFilterCourse: '',
        certFilterCourses: [],
        certGradeQuery: '',
        certCourseQuery: '',
        certGradePage: 1,
        certCoursePage: 1,
        certFilterCardsPageSize: 8,
        certCourseCardsPageSize: 6,
        certStudentQuery: '',
        certSelectedStudentIds: [],
        certFilteredStudentIds: [],
        certCurrentPageStudentIds: [],
        certStudentsPage: 1,
        certStudentsPageSize: 8,
        certTableSearch: '',
        certTablePage: 1,
        certTablePageSize: 8,
        enrollmentReviewSearch: '',
        enrollmentReviewStatusFilter: 'pending-review',
        enrollmentReviewLevelFilter: 'all',
        enrollmentReviewFromDate: '',
        enrollmentReviewToDate: '',
        enrollmentReviewPage: 1,
        enrollmentReviewPageSize: 8,
        enrollmentReviewSelectedIds: [],
        enrollmentReviewFilteredIds: [],
        enrollmentReviewCurrentPageIds: [],
        enrollmentSchedulePage: 1,
        enrollmentFormBuilderPage: 1,
        enrollmentFormBuilderPageSize: 6,
        enrollmentFormBuilderDraft: []
    }
};

const importState = {
    headers: [],
    rows: [],
    mappedRows: [],
    validation: { total: 0, valid: 0, invalid: 0, duplicates: 0, missing: 0 },
    mapping: { studentCode: '', name: '', level: '', grade: '', course: '', assignmentMode: '' },
    format: 'auto',
    delimiter: ','
};

const DEFAULT_LEVELS = [
    { id: 'lvl-1', name: 'Primaria', description: 'Niveles básicos' },
    { id: 'lvl-2', name: 'Bachillerato', description: 'Secundaria y media' }
];

const DEMO_DATA = {
    teachers: [
        { id: 901, specialization: 'Matemáticas', user: { id: 1901, name: 'Prof. Laura Méndez' } },
        { id: 902, specialization: 'Lengua Castellana', user: { id: 1902, name: 'Prof. Andrés Rojas' } },
        { id: 903, specialization: 'Ciencias Naturales', user: { id: 1903, name: 'Prof. Diana Castro' } }
    ],
    students: [
        { id: 1001, studentCode: 'EST-1001', user: { id: 3001, name: 'Valentina Pardo' } },
        { id: 1002, studentCode: 'EST-1002', user: { id: 3002, name: 'Samuel Gutiérrez' } },
        { id: 1003, studentCode: 'EST-1003', user: { id: 3003, name: 'Mariana Córdoba' } },
        { id: 1004, studentCode: 'EST-1004', user: { id: 3004, name: 'Tomás Quiroga' } },
        { id: 1005, studentCode: 'EST-1005', user: { id: 3005, name: 'Juliana Nieto' } },
        { id: 1006, studentCode: 'EST-1006', user: { id: 3006, name: 'Nicolás Rincón' } }
    ],
    courses: [
        { id: 801, name: 'Matemáticas 6A', description: 'Números y geometría básica', courseCode: 'CUR-MAT6A01', teacher: { id: 901, user: { name: 'Prof. Laura Méndez' } } },
        { id: 802, name: 'Lengua 7B', description: 'Comprensión lectora y redacción', courseCode: 'CUR-LEN7B01', teacher: { id: 902, user: { name: 'Prof. Andrés Rojas' } } },
        { id: 803, name: 'Ciencias 8A', description: 'Biología y física introductoria', courseCode: 'CUR-CIE8A01', teacher: { id: 903, user: { name: 'Prof. Diana Castro' } } },
        { id: 804, name: 'Álgebra 9A', description: 'Expresiones algebraicas', courseCode: 'CUR-ALG9A01', teacher: { id: 901, user: { name: 'Prof. Laura Méndez' } } }
    ],
    enrollments: [
        { id: 5001, studentId: 1001, courseId: 801 },
        { id: 5002, studentId: 1002, courseId: 801 },
        { id: 5003, studentId: 1003, courseId: 802 },
        { id: 5004, studentId: 1004, courseId: 803 },
        { id: 5005, studentId: 1005, courseId: 804 },
        { id: 5006, studentId: 1006, courseId: 804 }
    ],
    academicLevels: [
        { id: 'lvl-primaria', name: 'Primaria', description: 'Grados 1 a 5' },
        { id: 'lvl-secundaria', name: 'Secundaria', description: 'Grados 6 a 9' },
        { id: 'lvl-media', name: 'Media', description: 'Grados 10 y 11' }
    ],
    academicGrades: [
        { id: 'gr-6a', levelId: 'lvl-secundaria', name: '6A' },
        { id: 'gr-7b', levelId: 'lvl-secundaria', name: '7B' },
        { id: 'gr-8a', levelId: 'lvl-secundaria', name: '8A' },
        { id: 'gr-9a', levelId: 'lvl-secundaria', name: '9A' },
        { id: 'gr-10a', levelId: 'lvl-media', name: '10A' }
    ],
    courseLevels: {
        '801': 'lvl-secundaria',
        '802': 'lvl-secundaria',
        '803': 'lvl-secundaria',
        '804': 'lvl-media'
    },
    courseGrades: {
        '801': 'gr-6a',
        '802': 'gr-7b',
        '803': 'gr-8a',
        '804': 'gr-9a'
    },
    courseCapacity: {
        '801': 35,
        '802': 30,
        '803': 32,
        '804': 40
    },
    teacherLevels: {
        '901': ['lvl-secundaria', 'lvl-media'],
        '902': ['lvl-secundaria'],
        '903': ['lvl-secundaria']
    },
    teacherGrades: {
        '901': { 'lvl-secundaria': ['gr-6a', 'gr-9a'], 'lvl-media': ['gr-10a'] },
        '902': { 'lvl-secundaria': ['gr-7b'] },
        '903': { 'lvl-secundaria': ['gr-8a'] }
    }
};

const modalState = {
    studentCourse: { levelId: '', gradeIds: [], queryStudent: '', queryCourse: '', onlyWithoutCourse: false, pageStudents: 1, pageCourses: 1, pageSize: 8, gradePage: 1, gradePageSize: 8, selectedStudents: {}, selectedCourses: {} },
    courseLevel: { levelId: '', queryCourse: '', pageCourses: 1, pageSize: 10, levelPage: 1, levelPageSize: 8, selectedCourses: {} },
    enrollmentSummary: { page: 1, pageSize: 8 },
    levelsSummary: { page: 1, pageSize: 6, query: '', filter: 'all' },
    courseCreate: { gradeIds: [], menuOpen: false, draft: { name: '', description: '', teacherId: '', levelId: '', capacity: '35', gradeIds: [], scheduleDay: '', startTime: '', endTime: '' } },
    teacherAssign: { gradeIds: [], menuOpen: false },
    surveyVoteSelections: {},
    surveyVotePages: {},
    guideAttachments: [],
    guidePdfDataUrl: '',
    guidePdfName: '',
    enrollmentRejectIds: []
};

let surveyLiveTimer = null;
let publicSurveyLiveTimer = null;
let storageListenersBound = false;
const storageMonitorState = {
    details: null,
    lastLoaded: 0,
    loading: false,
    refreshMs: 15000,
    timer: null
};
const publicFormRuntime = {
    type: '',
    title: '',
    questions: [],
    page: 1,
    pageSize: 5,
    answers: {},
    responder: ''
};

function getAuth() {
    return '';
}

function buildAuthHeaderValue(authValue) {
    const raw = String(authValue || '').trim();
    if (!raw) return '';
    if (/^(Basic|Bearer)\s+/i.test(raw)) return raw;
    return 'Basic ' + raw;
}

function headers(json = true) {
    const h = {};
    if (json) h['Content-Type'] = 'application/json';
    return h;
}

function shouldUseBackend() {
    return true;
}

async function api(path, options = {}) {
    const requestOptions = {
        ...options,
        credentials: 'include',
        headers: {
            ...headers(false),
            ...(options.headers || {})
        }
    };
    const res = await fetch(API + path, requestOptions);
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || ('HTTP ' + res.status));
    }
    if (res.status === 204) return null;
    return res.json();
}

async function fetchBlob(path, options = {}) {
    const res = await fetch(API + path, {
        ...options,
        credentials: 'include',
        headers: { ...headers(false), ...(options.headers || {}) }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.blob();
}

function readStorage(key, fallback) {
    try {
        const raw = storageService.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
}

function saveStorage(key, value) {
    let serialized = 'null';
    try {
        serialized = JSON.stringify(value);
    } catch (e) {
        serialized = 'null';
    }
    storageService.setItem(key, serialized);
}



function readSessionJson(key, fallback) {
    try {
        const raw = sessionService.getItem(String(key || ''));
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
}

function writeSessionJson(key, value) {
    try {
        sessionService.setItem(String(key || ''), JSON.stringify(value));
    } catch (e) {
        // Ignorar errores de cuota/storage bloqueado.
    }
}

function asArray(value) {
    return Array.isArray(value) ? value : [];
}

function asObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function safeJsonParse(str, fallback) { try { return JSON.parse(str); } catch (e) { return fallback; } }

function showToast(msg, type) {
    const tc = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast toast-' + (type || 'info');
    t.textContent = msg;
    tc.appendChild(t);
    setTimeout(() => t.classList.add('show'), 20);
    setTimeout(() => {
        t.classList.remove('show');
        setTimeout(() => t.remove(), 280);
    }, 2600);
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeJsSingle(text) {
    return String(text || '')
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n');
}

function formatBytes(bytes) {
    const value = Math.max(0, Number(bytes) || 0);
    if (value < 1024) return `${value.toFixed(0)} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
    return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function clampPercent(value) {
    const v = Number(value);
    if (!Number.isFinite(v)) return 0;
    return Math.max(0, Math.min(100, v));
}

function hasAnyPermissionAdmin(permissions) {
    const granted = Array.isArray(currentEffectivePermissions) ? currentEffectivePermissions : [];
    return (permissions || []).some(p => granted.includes(String(p || '')));
}

function isAdminFullAccess() {
    return hasAnyPermissionAdmin(['portal.admin']);
}

function applyAdminPermissionVisibility() {
    const sectionPermissions = {
        cursos: ['cursos.crear','cursos.editar','cursos.eliminar','cursos.asignar','niveles.crear','niveles.asignar'],
        roles: ['roles.crear','roles.permisos'],
        certificados: ['certificados.emitir','certificados.eliminar'],
        instructivos: ['instructivos.crear','instructivos.editar'],
        formularios: ['formularios.editar','formularios.reportes'],
        configuracion: ['notas.configurar'],
        auditoria: ['portal.admin'],
        contenido: ['news.create','news.edit','events.create','events.edit','articles.create','articles.edit']
    };
    document.querySelectorAll('.sidebar-nav .nav-item[data-section]').forEach(btn => {
        const section = btn.dataset.section;
        if (!section || section === 'overview') return;
        const required = sectionPermissions[section];
        if (!required || required.length === 0) return;
        const visible = isAdminFullAccess() || hasAnyPermissionAdmin(required);
        btn.style.display = visible ? '' : 'none';
    });
}

function normalizeAdminSection(section) {
    let normalized = String(section || '').trim().toLowerCase();
    if (normalized === 'calificacion') normalized = 'configuracion';
    if (!normalized) return 'overview';
    const panel = document.getElementById('panel-' + normalized);
    return panel ? normalized : 'overview';
}

function syncAdminSectionUrl(section) {
    const normalized = normalizeAdminSection(section);
    const url = new URL(window.location.href);
    if (normalized === 'overview') {
        url.searchParams.delete('aSection');
    } else {
        url.searchParams.set('aSection', normalized);
    }
    url.searchParams.delete('section');
    const next = url.toString();
    if (next !== window.location.href) window.history.replaceState({}, '', next);
}

function writeAdminNavigationState(section, syncUrl) {
    const normalized = normalizeAdminSection(section);
    writeSessionJson(ADMIN_NAV_SESSION_KEY, {
        section: normalized,
        updatedAt: Date.now()
    });
    if (syncUrl !== false) syncAdminSectionUrl(normalized);
}

function readAdminNavigationState() {
    const fromUrl = normalizeAdminSection(getSearchParam('aSection') || getSearchParam('section'));
    if (fromUrl && fromUrl !== 'overview') return fromUrl;
    const fromSession = readSessionJson(ADMIN_NAV_SESSION_KEY, null);
    if (fromSession && fromSession.section) return normalizeAdminSection(fromSession.section);
    return 'overview';
}

function navigateTo(section, options) {
    const opts = options && typeof options === 'object' ? options : {};
    section = normalizeAdminSection(section);
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.section === section));
    document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('panel-' + section);
    if (panel) panel.classList.add('active');
    const title = {
        overview: 'Resumen',
        cursos: 'Cursos y asignaciones',
        roles: 'Roles y permisos',
        certificados: 'Certificados',
        matriculas: 'Matriculas',
        instructivos: 'Instructivos',
        formularios: 'Formularios',
        importacion: 'Importar Datos',
        configuracion: 'Configuracion',
        auditoria: 'Auditoria',
        contenido: 'Contenido institucional'
    }[section] || 'Administrador';
    document.getElementById('pageTitle').textContent = title;
    if (!opts.skipPersist) writeAdminNavigationState(section, true);
    if (section === 'auditoria') {
        loadAuditLogs();
    }
    if (section === 'configuracion') {
        callIfFn('renderStorageMonitorSection');
    }
    if (section === 'contenido') {
        loadContentSection();
    }
}
window.navigateTo = navigateTo;

function openModal(title, bodyHtml, size) {
    setAdminModalSize(size || 'lg');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalBackdrop').classList.add('show');
}

function setAdminModalSize(size) {
    const dlg = document.getElementById('modalDialog');
    if (!dlg) return;
    dlg.classList.remove('modal-sm', 'modal-lg', 'modal-xl', 'modal-xxl');
    dlg.classList.add('modal-' + (size || 'lg'));
}

function closeModal() {
    document.getElementById('modalBackdrop').classList.remove('show');
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

async function loadData() {
    const calls = [
        api('/api/users').catch(() => []),
        api('/api/teachers').catch(() => []),
        api('/api/students').catch(() => []),
        api('/api/courses').catch(() => []),
        api('/api/enrollments').catch(() => []),
        api('/api/roles').catch(() => []),
        api('/api/certificates').catch(() => []),
        api('/api/admin/access/config').catch(() => ({ permissions: [], rolePerms: {}, userPerms: {}, userPortalAccess: {} }))
    ];
    const [users, teachers, students, courses, enrollments, roles, certificates, accessConfig] = await Promise.all(calls);
    state.users = users || [];
    state.teachers = teachers || [];
    state.students = students || [];
    state.courses = courses || [];
    state.enrollments = enrollments || [];
    state.roles = roles || [];
    state.certificates = certificates || [];
    state.permissionCatalog = asArray((accessConfig || {}).permissions).map(p => ({ key: String((p || {}).key || ''), label: String((p || {}).label || '') })).filter(p => p.key);
    state.rolePerms = asObject((accessConfig || {}).rolePerms);
    state.userPerms = asObject((accessConfig || {}).userPerms);
    state.userPortalAccess = asObject((accessConfig || {}).userPortalAccess);

    state.guides = asArray(await api('/api/guides').catch(() => [])).map(g => ({
        ...g,
        textSections: g.sectionsJson ? JSON.parse(g.sectionsJson) : [],
        id: String(g.id || '')
    }));
    const evalForms = asArray(await api('/api/evaluation-forms/type/eval').catch(() => []));
    const autoevalForms = asArray(await api('/api/evaluation-forms/type/autoeval').catch(() => []));
    state.forms = {
        eval: evalForms.length && evalForms[0].questionsJson ? JSON.parse(evalForms[0].questionsJson) : [],
        autoeval: autoevalForms.length && autoevalForms[0].questionsJson ? JSON.parse(autoevalForms[0].questionsJson) : []
    };
    state.formsMeta = {
        eval: { title: (evalForms[0] && evalForms[0].title) || 'Evaluacion docente', id: (evalForms[0] && evalForms[0].id) || null },
        autoeval: { title: (autoevalForms[0] && autoevalForms[0].title) || 'Autoevaluacion', id: (autoevalForms[0] && autoevalForms[0].id) || null }
    };
    state.customForms = asArray(readStorage(STORAGE_KEYS.customForms, []));
    state.formResponses = asArray(readStorage(STORAGE_KEYS.formResponses, []));
    state.formShares = asObject(readStorage(STORAGE_KEYS.formShares, {}));
    state.surveys = asArray(await api('/api/surveys').catch(() => [])).map(s => {
        try {
            return {
                ...s,
                options: s.optionsJson ? JSON.parse(s.optionsJson) : [],
                roles: s.rolesJson ? JSON.parse(s.rolesJson) : [],
                questionMedia: s.questionMediaJson ? JSON.parse(s.questionMediaJson) : null,
                voteLedger: s.voteLedgerJson ? JSON.parse(s.voteLedgerJson) : {},
                startsAt: s.startsAt || '',
                endsAt: s.endsAt || '',
                createdAt: s.createdAt || ''
            };
        } catch (e) {
            return { ...s, options: [], roles: [], questionMedia: null, voteLedger: {}, startsAt: '', endsAt: '', createdAt: '' };
        }
    });
    const gradePolicyRes = await api('/api/config/grade-policy').catch(() => null);
    state.gradePolicy = gradePolicyRes && gradePolicyRes.value ? { ...DEFAULT_POLICY, ...JSON.parse(gradePolicyRes.value) } : { ...DEFAULT_POLICY };
    state.academicLevels = asArray(await api('/api/academic-levels').catch(() => [])).map(l => ({ ...l, id: String(l.id || '') }));
    state.academicGrades = asArray(await api('/api/academic-grades').catch(() => [])).map(g => ({ ...g, id: String(g.id || ''), levelId: String(g.levelId || '') }));
    state.courseLevels = asObject(readStorage(STORAGE_KEYS.courseLevels, {}));
    state.courseCapacity = asObject(readStorage(STORAGE_KEYS.courseCapacity, {}));
    state.teacherLevels = asObject(readStorage(STORAGE_KEYS.teacherLevels, {}));
    state.teacherGrades = asObject(readStorage(STORAGE_KEYS.teacherGrades, {}));
    state.studentLevels = asObject(readStorage(STORAGE_KEYS.studentLevels, {}));

    const courseGradesRes = await api('/api/config/course-grades').catch(() => null);
    state.courseGrades = courseGradesRes && courseGradesRes.value ? asObject(JSON.parse(courseGradesRes.value)) : asObject(readStorage(STORAGE_KEYS.courseGrades, {}));
    const studentGradesRes = await api('/api/config/student-grades').catch(() => null);
    state.studentGrades = studentGradesRes && studentGradesRes.value ? asObject(JSON.parse(studentGradesRes.value)) : asObject(readStorage(STORAGE_KEYS.studentGrades, {}));
    const assignmentRulesRes = await api('/api/config/assignment-rules').catch(() => null);
    state.assignmentRules = assignmentRulesRes && assignmentRulesRes.value ? asArray(JSON.parse(assignmentRulesRes.value)) : [];
    const cutPeriodsRes = await api('/api/config/cut-periods').catch(() => null);
    state.cutPeriods = cutPeriodsRes && cutPeriodsRes.value ? asArray(JSON.parse(cutPeriodsRes.value)) : [];
    const enrollmentConfigRes = await api('/api/config/enrollment-form-config').catch(() => null);
    state.ui.enrollmentFormConfigLoaded = enrollmentConfigRes && enrollmentConfigRes.value ? asArray(JSON.parse(enrollmentConfigRes.value)).map(cloneEnrollmentField) : [];

    state.users = asArray(state.users);
    state.teachers = asArray(state.teachers);
    state.students = asArray(state.students);
    state.courses = asArray(state.courses);
    state.enrollments = asArray(state.enrollments);
    state.roles = asArray(state.roles);
    state.certificates = asArray(state.certificates);
    if (!Array.isArray(state.forms.eval)) state.forms.eval = [];
    if (!Array.isArray(state.forms.autoeval)) state.forms.autoeval = [];
    if (!state.formsMeta.eval) state.formsMeta.eval = { title: 'Evaluacion docente' };
    if (!state.formsMeta.autoeval) state.formsMeta.autoeval = { title: 'Autoevaluacion' };
    state.customForms = asArray(state.customForms).map(f => ({
        id: String((f && f.id) || ('custom-' + Date.now() + '-' + Math.floor(Math.random() * 1000))),
        title: String((f && f.title) || 'Formulario personalizable').trim(),
        questions: cloneQuestions((f && f.questions) || []),
        audience: {
            mode: (f && f.audience && f.audience.mode)
                ? String(f.audience.mode)
                : ((f && f.audience && f.audience.allRegistered) ? 'registered' : 'roles'),
            roles: asArray(f && f.audience && f.audience.roles).map(String)
        }
    }));
    state.guides = (state.guides || []).map(g => ({
        ...g,
        id: String((g && g.id) || ('guide-' + Date.now() + '-' + Math.floor(Math.random() * 1000))),
        title: String((g && g.title) || '').trim(),
        detail: String((g && g.detail) || '').trim(),
        richHtml: sanitizeQuestionHtml((g && g.richHtml) || ''),
        pdfUrl: String((g && g.pdfUrl) || '').trim(),
        attachments: normalizeGuideAttachments(g && g.attachments),
        hasText: !!(String((g && g.richHtml) || '').trim() || String((g && g.detail) || '').trim() || asArray((g && g.textSections)).length),
        hasPdf: !!String((g && g.pdfUrl) || '').trim(),
        textSections: asArray(g && g.textSections)
    }));
    state.surveys = (state.surveys || []).map(s => ({
        ...s,
        createdAt: String((s && s.createdAt) || ''),
        startsAt: String((s && s.startsAt) || ''),
        endsAt: String((s && s.endsAt) || ''),
        authRequired: !(s && s.authRequired === false),
        questionMedia: normalizeSurveyQuestionMedia(s && s.questionMedia),
        voteLedger: asObject((s && s.voteLedger) || {}),
        options: asArray(s.options).map(opt => ({
            id: opt && opt.id ? opt.id : ('opt-' + Date.now() + '-' + Math.floor(Math.random() * 1000)),
            text: String((opt && opt.text) || '').trim(),
            votes: Math.max(0, parseInt((opt && opt.votes) || '0', 10) || 0),
            media: normalizeSurveyQuestionMedia(opt && opt.media)
        })).filter(opt => opt.text),
        roles: (function () {
            const values = asArray(s.roles).map(String).filter(Boolean);
            return values.length ? values : ['ESTUDIANTE'];
        })(),
        status: s.status === 'closed' ? 'closed' : 'active'
    }));


    if (!state.teachers.length) {
        const inferredTeachers = inferTeachersFromUsers(state.users);
        if (inferredTeachers.length) {
            state.teachers = inferredTeachers;
            showToast('No se encontraron docentes en /api/teachers. Se usaron usuarios con rol docente.', 'info');
        }
    }
    if (!state.teachers.length) {
        showToast('No hay docentes registrados en backend.', 'info');
    }

    cleanupStudentAcademicLinks();

}

function seedDemoDataIfNeeded() {
    // Intencionalmente vacío: no sembrar datos demo por defecto.
}

function normalizedIncludes(value, query) {
    return String(value || '').toLowerCase().includes(String(query || '').toLowerCase());
}

function paginateItems(items, page, pageSize) {
    const size = Math.max(1, parseInt(pageSize || '1', 10) || 1);
    const totalPages = Math.max(1, Math.ceil((items || []).length / size));
    const safePage = Math.max(1, Math.min(totalPages, parseInt(page || '1', 10) || 1));
    const start = (safePage - 1) * size;
    return {
        page: safePage,
        totalPages,
        items: (items || []).slice(start, start + size)
    };
}

function setPagerInfo(id, page, totalPages) {
    const el = document.getElementById(id);
    if (el) el.textContent = `${page}/${totalPages}`;
}

function fillPagedSelect(selectId, items, optionBuilder, placeholder, keepValue) {
    const el = document.getElementById(selectId);
    if (!el) return;
    const previous = keepValue ? String(el.value || '') : '';
    const options = [`<option value="">${escapeHtml(placeholder || 'Selecciona')}</option>`].concat((items || []).map(optionBuilder));
    el.innerHTML = options.join('');
    if (previous && (items || []).some(x => String(x.id) === previous)) {
        el.value = previous;
    } else if ((items || []).length) {
        el.value = String(items[0].id);
    }
}

async function ensureDefaultRoles() {
    return Promise.resolve();
}

function renderOverview() {
    document.getElementById('statCourses').textContent = String(state.courses.length);
    document.getElementById('statTeachers').textContent = String(state.teachers.length);
    document.getElementById('statStudents').textContent = String(state.students.length);
    document.getElementById('statCerts').textContent = String(state.certificates.length);

    const modelNames = {
        simple: 'Promedio aritmetico simple',
        weighted: 'Promedio ponderado por porcentajes',
        'period-weighted': 'Periodos con peso diferente',
        none: 'Ninguno (carga manual por docente)'
    };
    const p = state.gradePolicy;
    document.getElementById('activeGradingModel').innerHTML = `
        <div><strong>${modelNames[p.selectedMethod] || modelNames.simple}</strong></div>
        <div class="muted" style="margin-top:6px">Libertad docente: ${p.allowTeacherCustom ? 'Si' : 'No'}</div>
        <div class="muted">Rango de parciales: ${p.examMinPercent}% - ${p.examMaxPercent}%</div>
    `;
    callIfFn('renderEvaluationReportSection');
    loadActiveSurveysForAdmin();
}

async function loadActiveSurveysForAdmin() {
    const container = document.getElementById('overviewSurveys');
    const countBadge = document.getElementById('adminSurveyCount');
    if (!container) return;
    const roleName = String((((activeSessionUser || {}).role || {}).name) || 'ADMINISTRADOR').toUpperCase();
    const surveys = await api('/api/surveys/active-for-role?role=' + encodeURIComponent(roleName)).catch(() => []);
    if (!Array.isArray(surveys) || surveys.length === 0) {
        container.innerHTML = '<div style="color:var(--text-muted);font-size:13px">No hay encuestas activas para tu rol en este momento.</div>';
        if (countBadge) countBadge.style.display = 'none';
        return;
    }
    if (countBadge) { countBadge.textContent = surveys.length; countBadge.style.display = ''; }
    container.innerHTML = surveys.map(s => {
        const question = escapeHtml(s.question || 'Encuesta sin título');
        const options = safeJsonParse(s.optionsJson, []);
        const optsPreview = options.slice(0, 3).map(o => escapeHtml(o.text || 'Opción')).join(', ') + (options.length > 3 ? '...' : '');
        return `<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(11,31,58,0.05)">
            <div style="width:9px;height:9px;border-radius:50%;background:var(--navy);flex-shrink:0"></div>
            <div style="flex:1">
                <div style="font-weight:600;font-size:13.5px">${question}</div>
                <div style="font-size:11.5px;color:var(--text-muted)">${optsPreview || 'Sin opciones'}</div>
            </div>
            <a class="btn btn-sm btn-teal" href="/public-survey?publicSurvey=${encodeURIComponent(s.id)}" title="Votar">Votar</a>
        </div>`;
    }).join('');
}

function userNameFrom(obj) {
    return obj && obj.user && obj.user.name ? obj.user.name : (obj && obj.name ? obj.name : 'Sin nombre');
}

function cloneDemoTeachers() {
    return (DEMO_DATA.teachers || []).map(t => ({ ...t, user: { ...(t.user || {}) } }));
}

function isTeacherRoleName(name) {
    const normalized = String(name || '').toUpperCase();
    return normalized === 'PROFESOR' || normalized === 'DOCENTE' || normalized === 'TEACHER';
}

function inferTeachersFromUsers(users) {
    return (users || [])
        .filter(u => u && u.role && isTeacherRoleName(u.role.name))
        .map(u => ({
            id: u.id,
            user: { id: u.id, name: u.name, email: u.email },
            specialization: 'Por definir',
            inferred: true
        }));
}

function fillSelect(selectId, items, toOption, firstLabel) {
    const el = document.getElementById(selectId);
    if (!el) return;
    const first = firstLabel ? `<option value="">${firstLabel}</option>` : '';
    el.innerHTML = first + items.map(toOption).join('');
}

function getGradesByLevel(levelId) {
    return (state.academicGrades || []).filter(g => String(g.levelId) === String(levelId));
}

function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
}

function normalize(value) {
    return String(value || '').trim();
}

async function ensureAcademicLevelByName(levelName) {
    const raw = String(levelName || '').trim();
    if (!raw) return null;
    const existing = (state.academicLevels || []).find(l => normalizeText(l.name) === normalizeText(raw));
    if (existing) return existing;
    try {
        const created = await api('/api/academic-levels', { method: 'POST', headers: headers(), body: JSON.stringify({ name: raw, description: '' }) });
        const item = { id: String(created.id), name: created.name, description: created.description };
        state.academicLevels.push(item);
        return item;
    } catch (e) {
        return null;
    }
}

async function ensureAcademicGradeByName(levelId, gradeName) {
    const lid = String(levelId || '');
    const raw = String(gradeName || '').trim();
    if (!lid || !raw) return null;
    const existing = (state.academicGrades || []).find(g => String(g.levelId) === lid && normalizeText(g.name) === normalizeText(raw));
    if (existing) return existing;
    try {
        const created = await api('/api/academic-grades', { method: 'POST', headers: headers(), body: JSON.stringify({ levelId: parseInt(lid, 10), name: raw }) });
        const item = { id: String(created.id), levelId: String(created.levelId), name: created.name };
        state.academicGrades.push(item);
        return item;
    } catch (e) {
        return null;
    }
}

function slug3(value) {
    const raw = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return (raw || 'CUR').slice(0, 3).padEnd(3, 'X');
}

function generateLocalCourseCode(name) {
    const used = new Set((state.courses || []).map(c => String(c.courseCode || '').toUpperCase()).filter(Boolean));
    const base = 'CUR-' + slug3(name);
    let seq = 1;
    let code = `${base}${String(seq).padStart(3, '0')}`;
    while (used.has(code)) {
        seq += 1;
        code = `${base}${String(seq).padStart(3, '0')}`;
    }
    return code;
}

function cleanupStudentAcademicLinks() {
    const validStudentIds = new Set((state.students || []).map(s => String(s.id || '')).filter(Boolean));
    const validLevelIds = new Set((state.academicLevels || []).map(l => String(l.id || '')).filter(Boolean));
    const gradeById = {};
    (state.academicGrades || []).forEach(g => {
        gradeById[String(g.id)] = String(g.levelId || '');
    });

    const cleanedStudentLevels = {};
    Object.keys(state.studentLevels || {}).forEach(sid => {
        const levelId = String((state.studentLevels || {})[sid] || '');
        if (validStudentIds.has(String(sid)) && validLevelIds.has(levelId)) cleanedStudentLevels[String(sid)] = levelId;
    });

    const cleanedStudentGrades = {};
    Object.keys(state.studentGrades || {}).forEach(sid => {
        const gradeId = String((state.studentGrades || {})[sid] || '');
        const levelId = cleanedStudentLevels[String(sid)] || '';
        if (!validStudentIds.has(String(sid))) return;
        if (!gradeById[gradeId]) return;
        if (levelId && gradeById[gradeId] !== levelId) return;
        cleanedStudentGrades[String(sid)] = gradeId;
    });

    state.studentLevels = cleanedStudentLevels;
    state.studentGrades = cleanedStudentGrades;
    saveStudentGradesToBackend();
}


function surveyHistoryPrevPage() {
    state.ui.surveyHistoryPage = Math.max(1, (state.ui.surveyHistoryPage || 1) - 1);
    renderSurveyBoards();
}

function surveyHistoryNextPage() {
    state.ui.surveyHistoryPage = (state.ui.surveyHistoryPage || 1) + 1;
    renderSurveyBoards();
}

function cleanupAssistantSelections() {
    const validStudents = new Set((state.students || []).map(s => String(s.id || '')).filter(Boolean));
    const validCourses = new Set((state.courses || []).map(c => String(c.id || '')).filter(Boolean));
    const validGrades = new Set((state.academicGrades || []).map(g => String(g.id || '')).filter(Boolean));

    Object.keys(modalState.studentCourse.selectedStudents || {}).forEach(sid => {
        if (!validStudents.has(String(sid))) delete modalState.studentCourse.selectedStudents[sid];
    });
    Object.keys(modalState.studentCourse.selectedCourses || {}).forEach(cid => {
        if (!validCourses.has(String(cid))) delete modalState.studentCourse.selectedCourses[cid];
    });
    modalState.studentCourse.gradeIds = (modalState.studentCourse.gradeIds || []).map(String).filter(gid => validGrades.has(gid));
}

function getTeacherLevelIds(teacherId) {
    const key = String(teacherId || '');
    if (!key) return [];
    return (state.teacherLevels[key] || []).map(String);
}

function getTeacherGradeIds(teacherId, levelId) {
    const tKey = String(teacherId || '');
    const lKey = String(levelId || '');
    if (!tKey || !lKey) return [];
    const byLevel = (state.teacherGrades || {})[tKey] || {};
    return (byLevel[lKey] || []).map(String);
}

function getCourseLevelOptionsByTeacher() {
    const teacherId = (document.getElementById('courseTeacher') || {}).value || '';
    const teacherLevelIds = getTeacherLevelIds(teacherId);
    if (!teacherLevelIds.length) return state.academicLevels || [];
    const allowed = new Set(teacherLevelIds);
    return (state.academicLevels || []).filter(l => allowed.has(String(l.id)));
}

function renderCourseLevelOptions() {
    const levelEl = document.getElementById('courseLevel');
    if (!levelEl) return;
    const prev = String(levelEl.value || '');
    const options = getCourseLevelOptionsByTeacher();
    fillSelect('courseLevel', options, l => `<option value="${l.id}">${escapeHtml(l.name)}</option>`, 'Sin nivel');
    if (prev && (options || []).some(l => String(l.id) === prev)) levelEl.value = prev;
}

function readCourseCreateDraftFromDom() {
    const current = modalState.courseCreate && modalState.courseCreate.draft ? modalState.courseCreate.draft : {};
    return {
        name: (document.getElementById('courseName') || {}).value || current.name || '',
        description: (document.getElementById('courseDescription') || {}).value || current.description || '',
        teacherId: String((document.getElementById('courseTeacher') || {}).value || current.teacherId || ''),
        levelId: String((document.getElementById('courseLevel') || {}).value || current.levelId || ''),
        capacity: String((document.getElementById('courseCapacity') || {}).value || current.capacity || '35'),
        scheduleDay: String((document.getElementById('courseScheduleDay') || {}).value || current.scheduleDay || ''),
        startTime: String((document.getElementById('courseStartTime') || {}).value || current.startTime || ''),
        endTime: String((document.getElementById('courseEndTime') || {}).value || current.endTime || '')
    };
}

function saveCourseCreateDraft() {
    const domDraft = readCourseCreateDraftFromDom();
    const gradeIds = (modalState.courseCreate.gradeIds || []).map(String).filter(Boolean);
    modalState.courseCreate.draft = { ...domDraft, gradeIds };
    saveStorage(STORAGE_KEYS.courseCreateDraft, modalState.courseCreate.draft);
}

function applyCourseCreateDraft() {
    const draft = modalState.courseCreate && modalState.courseCreate.draft ? modalState.courseCreate.draft : {};
    const nameEl = document.getElementById('courseName');
    const descEl = document.getElementById('courseDescription');
    const teacherEl = document.getElementById('courseTeacher');
    const levelEl = document.getElementById('courseLevel');
    const capEl = document.getElementById('courseCapacity');
    const dayEl = document.getElementById('courseScheduleDay');
    const startEl = document.getElementById('courseStartTime');
    const endEl = document.getElementById('courseEndTime');
    if (nameEl && draft.name !== undefined) nameEl.value = draft.name || '';
    if (descEl && draft.description !== undefined) descEl.value = draft.description || '';
    if (teacherEl && draft.teacherId && Array.from(teacherEl.options || []).some(o => String(o.value) === String(draft.teacherId))) {
        teacherEl.value = String(draft.teacherId);
    }
    renderCourseLevelOptions();
    if (levelEl && draft.levelId && Array.from(levelEl.options || []).some(o => String(o.value) === String(draft.levelId))) {
        levelEl.value = String(draft.levelId);
    }
    if (capEl && draft.capacity !== undefined) capEl.value = draft.capacity || '35';
    if (dayEl && draft.scheduleDay !== undefined) dayEl.value = draft.scheduleDay || '';
    if (startEl && draft.startTime !== undefined) startEl.value = draft.startTime || '';
    if (endEl && draft.endTime !== undefined) endEl.value = draft.endTime || '';
    modalState.courseCreate.gradeIds = Array.isArray(draft.gradeIds) ? draft.gradeIds.map(String) : (modalState.courseCreate.gradeIds || []);
}

function renderCoursesSection() {
    saveCourseCreateDraft();
    const draft = modalState.courseCreate.draft || {};
    const teachersForSelect = getAvailableTeachers();
    const courseTeacherEl = document.getElementById('courseTeacher');
    const prevTeacher = String(draft.teacherId || (courseTeacherEl ? String(courseTeacherEl.value || '') : ''));
    fillSelect('courseTeacher', teachersForSelect, t => `<option value="${t.id}">${escapeHtml(userNameFrom(t))}</option>`, 'Selecciona docente');
    if (courseTeacherEl && prevTeacher && (teachersForSelect || []).some(t => String(t.id) === prevTeacher)) courseTeacherEl.value = prevTeacher;
    applyCourseCreateDraft();
    renderCourseGradeOptions();
    fillSelect('gradeLevel', state.academicLevels, l => `<option value="${l.id}">${escapeHtml(l.name)}</option>`, 'Selecciona nivel');
    fillSelect('assignCourseLevel', state.academicLevels, l => `<option value="${l.id}">${escapeHtml(l.name)}</option>`, 'Selecciona nivel');
    fillSelect('assignTeacherLevel', state.academicLevels, l => `<option value="${l.id}">${escapeHtml(l.name)}</option>`, 'Selecciona nivel');
    fillSelect('assignLevelTeacher', teachersForSelect, t => `<option value="${t.id}">${escapeHtml(userNameFrom(t))}</option>`, 'Selecciona docente');
    renderAssignTeacherGradeOptions();
    const levelsSearch = document.getElementById('levelsSearch');
    if (levelsSearch) levelsSearch.value = modalState.levelsSummary.query || '';
    const levelsFilter = document.getElementById('levelsFilter');
    if (levelsFilter) levelsFilter.value = modalState.levelsSummary.filter || 'all';
    renderEnrollmentsTable();
    renderLevelsTable();
    renderAdminCoursesCards();
}

function renderAdminCoursesCards() {
    const host = document.getElementById('adminCoursesCards');
    if (!host) return;
    const query = String(state.ui.adminCoursesQuery || '').trim().toLowerCase();
    const filter = String(state.ui.adminCoursesFilter || 'all');
    const countByCourse = {};
    (state.enrollments || []).forEach(e => {
        const cid = String((e.course || {}).id || e.courseId || '');
        if (!cid) return;
        countByCourse[cid] = (countByCourse[cid] || 0) + 1;
    });
    const cardsData = (state.courses || []).map((c, index) => {
        const cid = String(c.id);
        const total = countByCourse[cid] || 0;
        const code = c.courseCode || 'Sin código';
        const teacher = c.teacher ? userNameFrom(c.teacher) : 'Sin docente';
        const students = (state.enrollments || [])
            .filter(e => String((e.course || {}).id || e.courseId || '') === cid)
            .map(e => e.student || (state.students || []).find(s => String(s.id) === String(e.studentId || '')))
            .filter(Boolean)
            .map(s => userNameFrom(s));
        return {
            cid,
            total,
            code,
            teacher,
            hasTeacher: !!c.teacher,
            name: c.name || 'Curso',
            description: c.description || '',
            scheduleDay: c.defaultScheduleDay || '',
            scheduleStart: c.defaultStartTime || '',
            scheduleEnd: c.defaultEndTime || '',
            students,
            index
        };
    });

    const filtered = cardsData.filter(item => {
        if (query) {
            const haystack = `${item.name} ${item.code} ${item.teacher}`.toLowerCase();
            if (!haystack.includes(query)) return false;
        }
        if (filter === 'with-teacher') return item.hasTeacher;
        if (filter === 'without-teacher') return !item.hasTeacher;
        if (filter === 'with-students') return item.total > 0;
        if (filter === 'empty') return item.total === 0;
        return true;
    });

    const paged = paginateItems(filtered, state.ui.adminCoursesPage, state.ui.adminCoursesPageSize);
    state.ui.adminCoursesPage = paged.page;
    const cards = paged.items.map(item => {
        const previewStudents = item.students.slice(0, 3).map(n => `<span class="admin-course-chip">${escapeHtml(n)}</span>`).join('');
        const extraStudents = item.students.length > 3 ? `<span class="admin-course-chip">+${item.students.length - 3}</span>` : '';
        const scheduleDay = item.scheduleDay || '';
        const scheduleStart = item.scheduleStart || '';
        const scheduleEnd = item.scheduleEnd || '';
        const scheduleMeta = (scheduleStart && scheduleEnd)
            ? `${scheduleDay || 'N/A'} ${scheduleStart} - ${scheduleEnd}`
            : 'Sin horario configurado';
        return `<div class="admin-course-card tone-${item.index % 4}">
            <div class="admin-course-card-head">
                <div style="min-width:0">
                    <div class="admin-course-title">${escapeHtml(item.name)}</div>
                    <div class="admin-course-code">Código: <strong>${escapeHtml(item.code)}</strong></div>
                </div>
                <button class="btn btn-sm btn-outline" onclick="openDeleteCourseModal('${item.cid}')">Eliminar</button>
            </div>
            <div class="admin-course-meta">Docente: ${escapeHtml(item.teacher)}</div>
            <div class="admin-course-meta">Matriculados: ${item.total}</div>
            <div class="admin-course-meta">Horario: ${escapeHtml(scheduleMeta)}</div>
            <div class="admin-course-desc">${escapeHtml(item.description || 'Sin descripción')}</div>
            <div class="admin-course-students">
                ${item.students.length ? previewStudents + extraStudents : '<span class="muted">Sin alumnos matriculados</span>'}
            </div>
        </div>`;
    });
    host.innerHTML = `
        <div class="form-row" style="margin-bottom:10px">
            <div class="form-group">
                <label class="form-label">Buscar curso</label>
                <input id="adminCoursesQueryInput" class="form-input" value="${escapeHtml(state.ui.adminCoursesQuery || '')}" placeholder="Nombre, código o docente" oninput="setAdminCoursesQuery(this.value)">
            </div>
            <div class="form-group">
                <label class="form-label">Filtro</label>
                <select class="form-input" onchange="setAdminCoursesFilter(this.value)">
                    <option value="all" ${filter === 'all' ? 'selected' : ''}>Todos</option>
                    <option value="with-teacher" ${filter === 'with-teacher' ? 'selected' : ''}>Con docente</option>
                    <option value="without-teacher" ${filter === 'without-teacher' ? 'selected' : ''}>Sin docente</option>
                    <option value="with-students" ${filter === 'with-students' ? 'selected' : ''}>Con matriculados</option>
                    <option value="empty" ${filter === 'empty' ? 'selected' : ''}>Sin matriculados</option>
                </select>
            </div>
        </div>
        ${filtered.length
            ? `<div class="admin-course-grid">${cards.join('')}</div>
               <div class="pager" style="margin-top:10px">
                    <button class="btn btn-sm btn-outline" ${paged.page <= 1 ? 'disabled' : ''} onclick="adminCoursesPrevPage()">Anterior</button>
                    <span>${paged.page}/${paged.totalPages}</span>
                    <button class="btn btn-sm btn-outline" ${paged.page >= paged.totalPages ? 'disabled' : ''} onclick="adminCoursesNextPage()">Siguiente</button>
               </div>`
            : '<div class="muted">No hay cursos para el filtro actual.</div>'}
    `;
}

function setAdminCoursesQuery(value) {
    const active = document.activeElement;
    const shouldRestoreFocus = !!(active && active.id === 'adminCoursesQueryInput');
    const selectionStart = shouldRestoreFocus && typeof active.selectionStart === 'number' ? active.selectionStart : null;
    const selectionEnd = shouldRestoreFocus && typeof active.selectionEnd === 'number' ? active.selectionEnd : null;
    state.ui.adminCoursesQuery = String(value || '');
    state.ui.adminCoursesPage = 1;
    renderAdminCoursesCards();
    if (shouldRestoreFocus) {
        const input = document.getElementById('adminCoursesQueryInput');
        if (input) {
            input.focus();
            if (selectionStart !== null && selectionEnd !== null) {
                input.setSelectionRange(selectionStart, selectionEnd);
            }
        }
    }
}

function setAdminCoursesFilter(value) {
    state.ui.adminCoursesFilter = String(value || 'all');
    state.ui.adminCoursesPage = 1;
    renderAdminCoursesCards();
}

function adminCoursesPrevPage() {
    state.ui.adminCoursesPage = Math.max(1, (state.ui.adminCoursesPage || 1) - 1);
    renderAdminCoursesCards();
}

function adminCoursesNextPage() {
    state.ui.adminCoursesPage = (state.ui.adminCoursesPage || 1) + 1;
    renderAdminCoursesCards();
}

function openDeleteCourseModal(courseId) {
    const course = (state.courses || []).find(c => String(c.id) === String(courseId));
    if (!course) return;
    openModal('Eliminar curso', `
        <p style="font-size:13px;color:var(--text-body)">Vas a eliminar <strong>${escapeHtml(course.name || 'Curso')}</strong>. Esta acción también limpiará asignaciones locales de nivel y matrículas vinculadas.</p>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
            <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-danger" onclick="confirmDeleteCourse('${String(course.id)}')">Eliminar curso</button>
        </div>
    `);
}

async function confirmDeleteCourse(courseId) {
    try {
        await api('/api/courses/' + courseId, { method: 'DELETE', headers: headers(false) });
    } catch (e) {
        showToast('No se pudo eliminar en servidor, se aplicará localmente', 'error');
    }
    state.courses = (state.courses || []).filter(c => String(c.id) !== String(courseId));
    state.enrollments = (state.enrollments || []).filter(e => String((e.course || {}).id || e.courseId || '') !== String(courseId));
    delete state.courseLevels[String(courseId)];
    delete state.courseGrades[String(courseId)];
    delete state.courseCapacity[String(courseId)];
    saveLevelsState();
    saveCourseGradesToBackend();
    closeModal();
    renderCoursesSection();
    renderOverview();
    showToast('Curso eliminado', 'success');
}

async function createCourse() {
    const name = document.getElementById('courseName').value.trim();
    const description = document.getElementById('courseDescription').value.trim();
    const teacherRaw = (document.getElementById('courseTeacher').value || '').trim();
    let teacherId = null;
    try {
        teacherId = await resolveTeacherIdForCourseCreation(teacherRaw);
    } catch (e) {
        showToast((e && e.message) ? e.message : 'No se pudo vincular el docente seleccionado', 'error');
        return;
    }
    const levelId = (document.getElementById('courseLevel').value || '').trim();
    const gradeIds = (modalState.courseCreate.gradeIds || []).map(String).filter(Boolean);
    const capacity = Math.max(1, parseInt(document.getElementById('courseCapacity').value || '35', 10) || 35);
    const scheduleDay = String((document.getElementById('courseScheduleDay') || {}).value || '').trim();
    const startTime = String((document.getElementById('courseStartTime') || {}).value || '').trim();
    const endTime = String((document.getElementById('courseEndTime') || {}).value || '').trim();
    if (!name) return showToast('Completa nombre del curso', 'error');
    if (!levelId || !gradeIds.length) return showToast('Selecciona nivel y al menos un grado', 'error');
    if ((startTime && !endTime) || (!startTime && endTime)) return showToast('Si defines horario, completa hora inicio y fin', 'error');
    let saved = null;
    try {
        const payload = { name, description };
        // Docente opcional: solo se envía si viene seleccionado.
        if (teacherId !== null && Number.isFinite(teacherId)) payload.teacherId = teacherId;
        if (startTime && endTime) {
            payload.defaultScheduleDay = scheduleDay;
            payload.defaultStartTime = startTime;
            payload.defaultEndTime = endTime;
        }
        saved = await api('/api/courses', { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
    } catch (e) {
        showToast('No se pudo crear en servidor', 'error');
        return;
    }

    state.courses.push(saved);
    if (levelId) state.courseLevels[String(saved.id)] = String(levelId);
    setCourseGradeIds(String(saved.id), gradeIds);
    state.courseCapacity[String(saved.id)] = capacity;
    saveLevelsState();
    saveCourseGradesToBackend();
    renderCoursesSection();
    renderOverview();
    document.getElementById('courseName').value = '';
    document.getElementById('courseDescription').value = '';
    document.getElementById('courseTeacher').value = '';
    document.getElementById('courseLevel').value = '';
    document.getElementById('courseScheduleDay').value = '';
    document.getElementById('courseStartTime').value = '';
    document.getElementById('courseEndTime').value = '';
    modalState.courseCreate.gradeIds = [];
    modalState.courseCreate.draft = { name: '', description: '', teacherId: '', levelId: '', capacity: '35', gradeIds: [], scheduleDay: '', startTime: '', endTime: '' };
    saveStorage(STORAGE_KEYS.courseCreateDraft, modalState.courseCreate.draft);
    renderCourseGradeOptions();
    const capacityEl = document.getElementById('courseCapacity');
    if (capacityEl) capacityEl.value = '35';
    if (saved && saved.scheduleWarning) showToast(saved.scheduleWarning, 'info');
    showToast(saved && saved.courseCode ? ('Curso creado. Código: ' + saved.courseCode) : 'Curso creado', 'success');
}

async function createTestTeachers() {
    const teacherRole = (state.roles || []).find(r => {
        const roleName = String(r.name || '').toUpperCase();
        return roleName === 'PROFESOR' || roleName === 'DOCENTE' || roleName === 'TEACHER';
    });
    if (!teacherRole) {
        return showToast('No existe rol docente (PROFESOR/DOCENTE/TEACHER). Créalo primero en Roles.', 'error');
    }

    const samples = [
        { name: 'Docente Prueba 1', specialization: 'Matemáticas', email: 'docente.prueba1@educat.local' },
        { name: 'Docente Prueba 2', specialization: 'Lengua Castellana', email: 'docente.prueba2@educat.local' },
        { name: 'Docente Prueba 3', specialization: 'Ciencias Naturales', email: 'docente.prueba3@educat.local' },
        { name: 'Docente Prueba 4', specialization: 'Ciencias Sociales', email: 'docente.prueba4@educat.local' },
        { name: 'Docente Prueba 5', specialization: 'Inglés', email: 'docente.prueba5@educat.local' }
    ];
    const defaultPassword = 'Docente123*';
    const existingEmails = new Set((state.users || []).map(u => String(u.email || '').toLowerCase()).filter(Boolean));

    let created = 0;
    let skipped = 0;
    for (let i = 0; i < samples.length; i += 1) {
        const sample = samples[i];
        const email = String(sample.email || '').toLowerCase();
        if (!email || existingEmails.has(email)) {
            skipped += 1;
            continue;
        }
        try {
            const user = await api('/api/users', {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify({
                    name: sample.name,
                    email,
                    password: defaultPassword,
                    roleId: teacherRole.id,
                    status: true
                })
            });
            state.users.push(user);

            const teacher = await api('/api/teachers', {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify({ userId: user.id, specialization: sample.specialization })
            });
            state.teachers.push(teacher);
            created += 1;
        } catch (e) {
            showToast('No se pudo crear docente en backend: ' + (e && e.message ? e.message : 'error desconocido'), 'error');
        }
        existingEmails.add(email);
    }

    renderCoursesSection();
    renderOverview();
    showToast(`Docentes de prueba creados: ${created}${skipped ? ` | Omitidos: ${skipped}` : ''} (clave: ${defaultPassword})`, 'success');
}

function getAvailableTeachers() {
    const current = asArray(state.teachers).filter(Boolean);
    if (current.length) return current;
    const inferred = inferTeachersFromUsers(state.users);
    if (inferred.length) return inferred;
    return [];
}

function findTeacherOptionByValue(teacherValue) {
    const id = String(teacherValue || '').trim();
    if (!id) return null;
    return getAvailableTeachers().find(t => String((t && t.id) || '') === id) || null;
}

async function resolveTeacherIdForCourseCreation(teacherValue) {
    const selected = findTeacherOptionByValue(teacherValue);
    if (!selected) return null;
    if (!selected.inferred) {
        const teacherId = parseInt(selected.id, 10);
        return Number.isFinite(teacherId) ? teacherId : null;
    }

    const userId = parseInt((selected.user || {}).id || selected.id, 10);
    if (!Number.isFinite(userId)) {
        throw new Error('Selecciona un docente válido para asignar al curso');
    }

    try {
        const created = await api('/api/teachers', {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ userId, specialization: selected.specialization || 'Por definir' })
        });
        const idx = asArray(state.teachers).findIndex(t => String((t && t.id) || '') === String(selected.id));
        if (idx >= 0) state.teachers[idx] = created;
        else state.teachers.push(created);
        return parseInt(created.id, 10);
    } catch (e) {
        const teachers = await api('/api/teachers').catch(() => []);
        const existing = asArray(teachers).find(t => String((((t || {}).user || {}).id) || '') === String(userId));
        if (existing) {
            const idx = asArray(state.teachers).findIndex(t => String((t && t.id) || '') === String(selected.id));
            if (idx >= 0) state.teachers[idx] = existing;
            else state.teachers.push(existing);
            return parseInt(existing.id, 10);
        }
        throw new Error('El usuario seleccionado no tiene perfil docente en backend');
    }
}

async function saveLevelsState() {
    await api('/api/config/assignment-rules', { method: 'PUT', headers: headers(), body: JSON.stringify(state.assignmentRules) }).catch(() => {});
}

async function saveCourseGradesToBackend() {
    await api('/api/config/course-grades', { method: 'PUT', headers: headers(), body: JSON.stringify(state.courseGrades) }).catch(() => {});
    saveStorage(STORAGE_KEYS.courseGrades, state.courseGrades);
}

async function saveStudentGradesToBackend() {
    await api('/api/config/student-grades', { method: 'PUT', headers: headers(), body: JSON.stringify(state.studentGrades) }).catch(() => {});
    saveStorage(STORAGE_KEYS.studentGrades, state.studentGrades);
}

function setCourseGradeIds(courseId, gradeIds) {
    const cid = String(courseId || '');
    const values = (gradeIds || []).map(String).filter(Boolean);
    if (!cid || !values.length) {
        delete state.courseGrades[cid];
        return;
    }
    state.courseGrades[cid] = values[0];
}

function renderCourseGradeOptions() {
    const levelId = String((document.getElementById('courseLevel') || {}).value || '');
    const teacherId = String((document.getElementById('courseTeacher') || {}).value || '');
    const host = document.getElementById('courseGradeMulti');
    const menu = document.getElementById('courseGradeMenu');
    const label = document.getElementById('courseGradeLabel');
    if (!host || !menu || !label) return;

    let grades = getGradesByLevel(levelId);
    const allowedByTeacher = getTeacherGradeIds(teacherId, levelId);
    if (allowedByTeacher.length) {
        const allowedSet = new Set(allowedByTeacher.map(String));
        grades = grades.filter(g => allowedSet.has(String(g.id)));
    }

    const availableIds = new Set((grades || []).map(g => String(g.id)));
    modalState.courseCreate.gradeIds = (modalState.courseCreate.gradeIds || []).map(String).filter(id => availableIds.has(id));
    const selected = new Set((modalState.courseCreate.gradeIds || []).map(String));
    menu.innerHTML = grades.length
        ? grades.map(g => `<label class="multi-check-option"><input type="checkbox" value="${escapeHtml(String(g.id))}" ${selected.has(String(g.id)) ? 'checked' : ''}> ${escapeHtml(g.name || 'Grado')}</label>`).join('')
        : '<div class="muted" style="padding:8px 10px">No hay grados disponibles para el nivel seleccionado.</div>';

    menu.querySelectorAll('input[type="checkbox"]').forEach(chk => {
        chk.addEventListener('change', () => {
            modalState.courseCreate.gradeIds = Array.from(menu.querySelectorAll('input[type="checkbox"]:checked')).map(x => String(x.value));
            updateCourseGradeLabel();
            saveCourseCreateDraft();
        });
    });
    updateCourseGradeLabel();
}

function updateCourseGradeLabel() {
    const label = document.getElementById('courseGradeLabel');
    if (!label) return;
    const selected = (modalState.courseCreate.gradeIds || []).map(String);
    if (!selected.length) {
        label.textContent = 'Seleccionar grados';
        return;
    }
    const names = selected
        .map(id => (state.academicGrades || []).find(g => String(g.id) === String(id)))
        .filter(Boolean)
        .map(g => g.name);
    label.textContent = names.length ? names.join(', ') : 'Seleccionar grados';
}

function toggleCourseGradeMenu() {
    const host = document.getElementById('courseGradeMulti');
    if (!host) return;
    modalState.courseCreate.menuOpen = !host.classList.contains('open');
    host.classList.toggle('open', modalState.courseCreate.menuOpen);
}

function renderAssignTeacherGradeOptions() {
    const levelId = String((document.getElementById('assignTeacherLevel') || {}).value || '');
    const host = document.getElementById('assignTeacherGradeMulti');
    const menu = document.getElementById('assignTeacherGradeMenu');
    const label = document.getElementById('assignTeacherGradeLabel');
    if (!host || !menu || !label) return;

    const grades = getGradesByLevel(levelId);
    const availableIds = new Set((grades || []).map(g => String(g.id)));
    modalState.teacherAssign.gradeIds = (modalState.teacherAssign.gradeIds || []).map(String).filter(id => availableIds.has(id));
    const selected = new Set((modalState.teacherAssign.gradeIds || []).map(String));
    menu.innerHTML = grades.length
        ? grades.map(g => `<label class="multi-check-option"><input type="checkbox" value="${escapeHtml(String(g.id))}" ${selected.has(String(g.id)) ? 'checked' : ''}> ${escapeHtml(g.name || 'Grado')}</label>`).join('')
        : '<div class="muted" style="padding:8px 10px">No hay grados para este nivel.</div>';

    menu.querySelectorAll('input[type="checkbox"]').forEach(chk => {
        chk.addEventListener('change', () => {
            modalState.teacherAssign.gradeIds = Array.from(menu.querySelectorAll('input[type="checkbox"]:checked')).map(x => String(x.value));
            updateAssignTeacherGradeLabel();
        });
    });
    updateAssignTeacherGradeLabel();
}

function updateAssignTeacherGradeLabel() {
    const label = document.getElementById('assignTeacherGradeLabel');
    if (!label) return;
    const selected = (modalState.teacherAssign.gradeIds || []).map(String);
    if (!selected.length) {
        label.textContent = 'Seleccionar grados';
        return;
    }
    const names = selected
        .map(id => (state.academicGrades || []).find(g => String(g.id) === String(id)))
        .filter(Boolean)
        .map(g => g.name);
    label.textContent = names.length ? names.join(', ') : 'Seleccionar grados';
}

function toggleAssignTeacherGradeMenu() {
    const host = document.getElementById('assignTeacherGradeMulti');
    if (!host) return;
    modalState.teacherAssign.menuOpen = !host.classList.contains('open');
    host.classList.toggle('open', modalState.teacherAssign.menuOpen);
}

async function createAcademicLevel() {
    const nameEl = document.getElementById('levelName');
    const descEl = document.getElementById('levelDescription');
    const name = String((nameEl || {}).value || '').trim();
    const description = String((descEl || {}).value || '').trim();
    if (!name) return showToast('Ingresa el nombre del nivel', 'error');
    const exists = (state.academicLevels || []).some(l => String(l.name || '').toLowerCase() === name.toLowerCase());
    if (exists) return showToast('Ese nivel ya existe', 'error');

    try {
        const created = await api('/api/academic-levels', { method: 'POST', headers: headers(), body: JSON.stringify({ name, description }) });
        state.academicLevels.push({ id: String(created.id), name: created.name, description: created.description });
    } catch (e) {
        showToast('Error al guardar nivel', 'error');
        return;
    }
    if (nameEl) nameEl.value = '';
    if (descEl) descEl.value = '';
    saveLevelsState();
    renderCoursesSection();
    showToast('Nivel creado', 'success');
}

async function createAcademicGrade() {
    const levelId = String((document.getElementById('gradeLevel') || {}).value || '').trim();
    const gradeNameEl = document.getElementById('gradeName');
    const raw = String((gradeNameEl || {}).value || '').trim();
    if (!levelId) return showToast('Selecciona un nivel para el grado', 'error');
    if (!raw) return showToast('Ingresa al menos un grado', 'error');

    const parsed = raw
        .split(',')
        .map(x => x.trim())
        .filter(Boolean);
    if (!parsed.length) return showToast('Formato inválido. Ej: 3A,3B,3C', 'error');

    const existing = new Set(
        (state.academicGrades || [])
            .filter(g => String(g.levelId) === levelId)
            .map(g => String(g.name || '').toLowerCase())
    );

    let created = 0;
    let skipped = 0;
    for (const name of parsed) {
        const key = String(name || '').toLowerCase();
        if (!key || existing.has(key)) {
            skipped += 1;
            continue;
        }
        try {
            const res = await api('/api/academic-grades', { method: 'POST', headers: headers(), body: JSON.stringify({ levelId: parseInt(levelId, 10), name }) });
            state.academicGrades.push({ id: String(res.id), levelId: String(res.levelId), name: res.name });
            existing.add(key);
            created += 1;
        } catch (e) {
            skipped += 1;
        }
    }

    if (!created) return showToast('No se crearon grados (todos duplicados o inválidos)', 'error');
    if (gradeNameEl) gradeNameEl.value = '';
    saveLevelsState();
    renderCoursesSection();
    showToast(`Grados creados: ${created}${skipped ? ` | Omitidos: ${skipped}` : ''}`, 'success');
}

function buildCompactNames(names, maxItems) {
    const list = (names || []).filter(Boolean);
    if (!list.length) return 'Sin registros';
    const top = list.slice(0, maxItems);
    const extra = list.length - top.length;
    return extra > 0 ? `${top.join(', ')} (+${extra})` : top.join(', ');
}

function openLevelDetailsModal(levelId) {
    const id = String(levelId || '');
    const level = (state.academicLevels || []).find(l => String(l.id) === id);
    if (!level) return;
    const grades = (state.academicGrades || []).filter(g => String(g.levelId) === id);
    const courses = (state.courses || []).filter(c => String((state.courseLevels || {})[String(c.id)] || '') === id).map(c => c.name || 'Curso');
    const teachers = (state.teachers || []).filter(t => (state.teacherLevels[String(t.id)] || []).map(String).includes(id)).map(t => userNameFrom(t));
    openModal(`Detalle: ${escapeHtml(level.name || 'Nivel')}`, `
        <div class="assign-col" style="margin-bottom:10px">
            <div class="assign-head">Grados (${grades.length})</div>
            <div>${grades.length ? grades.map(g => `
                <span class="card-check" style="display:inline-flex;align-items:center;gap:6px;margin:4px 4px 0 0">
                    <span>${escapeHtml(g.name || 'Grado')}</span>
                    <button type="button" class="btn btn-sm btn-outline" style="padding:2px 8px" onclick="deleteAcademicGradeFromDetails('${escapeJsSingle(String(g.id))}','${escapeJsSingle(id)}')">Eliminar</button>
                </span>
            `).join('') : '<span class="muted">Sin grados</span>'}</div>
        </div>
        <div class="assign-col" style="margin-bottom:10px">
            <div class="assign-head">Cursos (${courses.length})</div>
            <div>${courses.length ? courses.map(c => `<span class="card-check" style="display:inline-flex;margin:4px 4px 0 0">${escapeHtml(c)}</span>`).join('') : '<span class="muted">Sin cursos</span>'}</div>
        </div>
        <div class="assign-col">
            <div class="assign-head">Docentes (${teachers.length})</div>
            <div>${teachers.length ? teachers.map(t => `<span class="card-check" style="display:inline-flex;margin:4px 4px 0 0">${escapeHtml(t)}</span>`).join('') : '<span class="muted">Sin docentes</span>'}</div>
        </div>
    `);
}

async function deleteAcademicGradeFromDetails(gradeId, levelId) {
    const target = (state.academicGrades || []).find(g => String(g.id) === String(gradeId));
    if (!target) return;
    await deleteAcademicGrade(gradeId);
    openLevelDetailsModal(levelId);
}

function assignTeacherToLevel() {
    const levelId = String((document.getElementById('assignTeacherLevel') || {}).value || '').trim();
    const teacherId = String((document.getElementById('assignLevelTeacher') || {}).value || '').trim();
    const gradeIds = (modalState.teacherAssign.gradeIds || []).map(String).filter(Boolean);
    if (!levelId || !teacherId) return showToast('Selecciona nivel y docente', 'error');

    const currentLevels = new Set((state.teacherLevels[teacherId] || []).map(String));
    currentLevels.add(levelId);
    state.teacherLevels[teacherId] = Array.from(currentLevels);
    if (!state.teacherGrades[teacherId]) state.teacherGrades[teacherId] = {};
    state.teacherGrades[teacherId][levelId] = gradeIds;

    saveLevelsState();
    renderCoursesSection();
    showToast('Docente asignado al nivel', 'success');
}

async function createRole() {
    const roleNameEl = document.getElementById('roleName');
    const name = String((roleNameEl || {}).value || '').trim();
    if (!name) return showToast('Ingresa el nombre del rol', 'error');
    if ((state.roles || []).some(r => String(r.name || '').toLowerCase() === name.toLowerCase())) {
        return showToast('Ese rol ya existe', 'error');
    }

    let created = null;
    try {
        created = await api('/api/roles', {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ name })
        });
    } catch (e) {
        showToast('No se pudo crear el rol en servidor', 'error');
        return;
    }

    state.roles.push(created);
    if (roleNameEl) roleNameEl.value = '';
    renderRolesSection();
    showToast('Rol creado', 'success');
}

function normalizeAdminUsersQuery(user) {
    const roleName = String((((user || {}).role || {}).name) || '');
    return `${String((user || {}).name || '')} ${String((user || {}).email || '')} ${roleName}`.toLowerCase();
}

function getAdminUsersRoleFilterValue(user) {
    const roleId = String((((user || {}).role || {}).id) || '').trim();
    return roleId || 'no-role';
}

function matchesAdminUsersRoleFilter(user, filterValue) {
    const value = String(filterValue || 'all');
    const roleId = String((((user || {}).role || {}).id) || '').trim();
    if (value === 'all') return true;
    if (value === 'no-role') return !roleId;
    if (value === 'with-role') return !!roleId;
    return roleId === value;
}

function buildAdminUsersRoleFilterOptions() {
    const base = [
        { id: 'all', name: 'Todos los usuarios' },
        { id: 'no-role', name: 'Sin rol asignado' },
        { id: 'with-role', name: 'Con cualquier rol' }
    ];
    const roleOptions = asArray(state.roles).map(r => ({ id: String(r.id), name: 'Rol: ' + String(r.name || 'Sin nombre') }));
    return base.concat(roleOptions);
}

function renderAdminUsersRoleFilterSelect() {
    const select = document.getElementById('adminUsersRoleFilter');
    if (!select) return;
    const options = buildAdminUsersRoleFilterOptions();
    select.innerHTML = options.map(opt => `<option value="${escapeHtml(String(opt.id))}">${escapeHtml(String(opt.name))}</option>`).join('');
    const valid = new Set(options.map(opt => String(opt.id)));
    const current = String(state.ui.adminUsersRoleFilter || 'all');
    select.value = valid.has(current) ? current : 'all';
    state.ui.adminUsersRoleFilter = select.value;
}

function renderAdminUsersBulkRoleSelect() {
    fillSelect(
        'adminUsersBulkRole',
        asArray(state.roles),
        role => `<option value="${String(role.id)}">${escapeHtml(role.name || 'Rol')}</option>`,
        'Selecciona rol'
    );
}

function toggleAdminUserSelection(userId, checked) {
    const id = String(userId || '');
    const selected = new Set(asArray(state.ui.adminUsersSelectedIds).map(String));
    if (checked) selected.add(id);
    else selected.delete(id);
    state.ui.adminUsersSelectedIds = Array.from(selected);
    renderRolesSection();
}

function selectCurrentPageAdminUsers() {
    const selected = new Set(asArray(state.ui.adminUsersSelectedIds).map(String));
    asArray(state.ui.adminUsersCurrentPageIds).forEach(id => selected.add(String(id)));
    state.ui.adminUsersSelectedIds = Array.from(selected);
    renderRolesSection();
}

function selectFilteredAdminUsers() {
    const selected = new Set(asArray(state.ui.adminUsersSelectedIds).map(String));
    asArray(state.ui.adminUsersFilteredIds).forEach(id => selected.add(String(id)));
    state.ui.adminUsersSelectedIds = Array.from(selected);
    renderRolesSection();
}

function clearAdminUsersSelection() {
    state.ui.adminUsersSelectedIds = [];
    renderRolesSection();
}

async function persistAdminUserRoleStatus(user, roleId, status) {
    const role = asArray(state.roles).find(r => String(r.id) === String(roleId || ''));
    if (!role) throw new Error('Rol inválido');
    try {
        return await api('/api/users/' + String(user.id), {
            method: 'PUT',
            headers: headers(),
            body: JSON.stringify({
                name: user.name,
                email: user.email,
                roleId: role.id,
                status,
                documentId: user.documentId || '',
                phone: user.phone || ''
            })
        });
    } catch (e) {
        throw e;
    }
}

async function assignRoleToSelectedAdminUsers() {
    const roleId = String((document.getElementById('adminUsersBulkRole') || {}).value || '');
    const selectedIds = new Set(asArray(state.ui.adminUsersSelectedIds).map(String));
    if (!roleId) return showToast('Selecciona el rol a asignar', 'error');
    if (!selectedIds.size) return showToast('Selecciona al menos un usuario', 'error');

    const users = asArray(state.users).filter(u => selectedIds.has(String((u || {}).id || '')));
    if (!users.length) return showToast('No hay usuarios válidos seleccionados', 'error');

    let updated = 0;
    for (let i = 0; i < users.length; i += 1) {
        const user = users[i];
        const status = (user || {}).status === false ? false : true;
        try {
            const saved = await persistAdminUserRoleStatus(user, roleId, status);
            upsertUserInState(saved);
            updated += 1;
        } catch (e) {
            // continuar con los demás
        }
    }

    if (updated) {
        showToast('Rol asignado a ' + updated + ' usuario(s)', 'success');
        renderRolesSection();
        return;
    }
    showToast('No se pudo asignar el rol', 'error');
}

function getRoleOptionsHtml(selectedRoleId) {
    const selected = String(selectedRoleId || '');
    return asArray(state.roles)
        .map(r => `<option value="${String(r.id)}" ${String(r.id) === selected ? 'selected' : ''}>${escapeHtml(r.name || 'Rol')}</option>`)
        .join('');
}

function clearAdminUserForm() {
    const ids = ['adminUserName', 'adminUserEmail', 'adminUserPassword', 'adminUserDocument', 'adminUserPhone'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const statusEl = document.getElementById('adminUserStatus');
    if (statusEl) statusEl.value = 'true';
}

function upsertUserInState(user) {
    const id = String((user || {}).id || '');
    if (!id) return;
    const idx = asArray(state.users).findIndex(u => String((u || {}).id || '') === id);
    if (idx >= 0) {
        state.users[idx] = user;
        return;
    }
    state.users.unshift(user);
}

function fillAdminUserRoleSelect() {
    fillSelect(
        'adminUserRole',
        asArray(state.roles),
        role => `<option value="${String(role.id)}">${escapeHtml(role.name || 'Rol')}</option>`,
        'Selecciona rol'
    );
}

async function createAdminUser() {
    const name = String((document.getElementById('adminUserName') || {}).value || '').trim();
    const email = String((document.getElementById('adminUserEmail') || {}).value || '').trim().toLowerCase();
    const password = String((document.getElementById('adminUserPassword') || {}).value || '');
    const documentId = String((document.getElementById('adminUserDocument') || {}).value || '').trim();
    const phone = String((document.getElementById('adminUserPhone') || {}).value || '').trim();
    const roleId = String((document.getElementById('adminUserRole') || {}).value || '');
    const status = String((document.getElementById('adminUserStatus') || {}).value || 'true') === 'true';

    if (!name) return showToast('Ingresa el nombre del usuario', 'error');
    if (!email) return showToast('Ingresa el correo del usuario', 'error');
    if (password.length < 8) return showToast('La contraseña debe tener mínimo 8 caracteres', 'error');
    if (!roleId) return showToast('Selecciona un rol para el usuario', 'error');

    const role = asArray(state.roles).find(r => String(r.id) === roleId);
    if (!role) return showToast('Rol inválido', 'error');

    let created = null;
    try {
        created = await api('/api/users', {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ name, email, password, roleId: role.id, status, documentId, phone })
        });
    } catch (e) {
        showToast('No se pudo crear el usuario en servidor', 'error');
        return;
    }

    upsertUserInState(created);
    clearAdminUserForm();
    state.ui.adminUsersPage = 1;
    renderRolesSection();
    showToast('Usuario creado correctamente', 'success');
}

async function saveAdminUserRow(userId) {
    const user = asArray(state.users).find(u => String((u || {}).id || '') === String(userId || ''));
    if (!user) return showToast('Usuario no encontrado', 'error');

    const roleEl = document.getElementById('adminUserRoleRow-' + String(user.id));
    const statusEl = document.getElementById('adminUserStatusRow-' + String(user.id));
    const roleId = String((roleEl || {}).value || '');
    const status = String((statusEl || {}).value || 'true') === 'true';
    if (!roleId) return showToast('Selecciona un rol', 'error');

    let saved = null;
    try {
        saved = await persistAdminUserRoleStatus(user, roleId, status);
    } catch (e) {
        return showToast('Rol inválido', 'error');
    }

    upsertUserInState(saved);
    renderRolesSection();
    showToast('Usuario actualizado', 'success');
}

function deleteAdminUser(userId) {
    const id = String(userId || '');
    const user = asArray(state.users).find(u => String((u || {}).id || '') === id);
    if (!user) return;
    openConfirmModal('Eliminar usuario', '¿Eliminar usuario ' + String(user.name || user.email || '') + '?', async () => {
        try {
            await api('/api/users/' + id, { method: 'DELETE', headers: headers(false) });
            state.users = asArray(state.users).filter(u => String((u || {}).id || '') !== id);
            delete state.userPortalAccess[id];
            renderUsersSection();
            showToast('Usuario eliminado', 'success');
        } catch (e) {
            showToast('No se pudo eliminar el usuario en servidor', 'error');
        }
    }, 'Eliminar');
}

function renderAdminUsersSection() {
    fillAdminUserRoleSelect();
    renderAdminUsersRoleFilterSelect();
    renderAdminUsersBulkRoleSelect();

    const host = document.getElementById('adminUsersList');
    if (!host) return;
    const summaryEl = document.getElementById('adminUsersSelectionSummary');

    const query = String(state.ui.adminUsersSearch || '').trim().toLowerCase();
    const roleFilter = String(state.ui.adminUsersRoleFilter || 'all');
    const filtered = asArray(state.users).filter(u => {
        const textOk = !query || normalizeAdminUsersQuery(u).includes(query);
        const roleOk = matchesAdminUsersRoleFilter(u, roleFilter);
        return textOk && roleOk;
    });

    const validIds = new Set(asArray(state.users).map(u => String((u || {}).id || '')));
    state.ui.adminUsersSelectedIds = asArray(state.ui.adminUsersSelectedIds).map(String).filter(id => validIds.has(id));
    state.ui.adminUsersFilteredIds = asArray(filtered).map(u => String((u || {}).id || ''));

    const paged = paginateItems(filtered, state.ui.adminUsersPage, state.ui.adminUsersPageSize || 8);
    state.ui.adminUsersPage = paged.page;
    state.ui.adminUsersCurrentPageIds = asArray(paged.items).map(u => String((u || {}).id || ''));
    setPagerInfo('adminUsersPageInfo', paged.page, paged.totalPages);
    const selectedSet = new Set(asArray(state.ui.adminUsersSelectedIds).map(String));

    host.innerHTML = paged.items.length
        ? paged.items.map(u => {
            const id = String((u || {}).id || '');
            const roleId = String((((u || {}).role || {}).id) || '');
            const roleName = String((((u || {}).role || {}).name) || 'Sin rol');
            const email = String((u || {}).email || 'Sin correo');
            const statusValue = (u || {}).status === false ? 'false' : 'true';
            const statusText = statusValue === 'true' ? 'Activo' : 'Inactivo';
            const docText = String((u || {}).documentId || '').trim();
            const phoneText = String((u || {}).phone || '').trim();
            const details = [
                email,
                'Rol: ' + roleName,
                'Estado: ' + statusText,
                docText ? ('Documento: ' + docText) : '',
                phoneText ? ('Tel: ' + phoneText) : ''
            ].filter(Boolean).join(' | ');
            return `<div class="admin-user-item">
                <div>
                    <div class="admin-user-title"><label style="display:inline-flex;align-items:center;gap:8px"><input type="checkbox" ${selectedSet.has(id) ? 'checked' : ''} onchange="toggleAdminUserSelection('${escapeJsSingle(id)}', this.checked)">${escapeHtml(String((u || {}).name || 'Usuario'))}</label></div>
                    <div class="admin-user-meta">${escapeHtml(details)}</div>
                </div>
                <div class="admin-user-actions">
                    <select class="form-input" id="adminUserRoleRow-${escapeHtml(id)}">${getRoleOptionsHtml(roleId)}</select>
                    <select class="form-input" id="adminUserStatusRow-${escapeHtml(id)}">
                        <option value="true" ${statusValue === 'true' ? 'selected' : ''}>Activo</option>
                        <option value="false" ${statusValue === 'false' ? 'selected' : ''}>Inactivo</option>
                    </select>
                    <button class="btn btn-sm btn-outline" onclick="saveAdminUserRow('${escapeJsSingle(id)}')">Guardar</button>
                    <button class="btn btn-sm btn-outline" onclick="deleteAdminUser('${escapeJsSingle(id)}')">Eliminar</button>
                </div>
            </div>`;
        }).join('')
        : '<div class="muted">No hay usuarios para mostrar.</div>';

    if (summaryEl) {
        summaryEl.textContent = `Seleccionados: ${selectedSet.size} | Filtrados: ${filtered.length} | Mostrando: ${paged.items.length}`;
    }
}

function getRolePerms() {
    const roleId = String((document.getElementById('permRole') || {}).value || '');
    return roleId ? ((state.rolePerms[roleId] || []).map(String)) : [];
}

function getUserPerms() {
    const userId = String((document.getElementById('permUser') || {}).value || '');
    return userId ? ((state.userPerms[userId] || []).map(String)) : [];
}

function getPermissionKeys() {
    const keys = asArray(state.permissionCatalog).map(p => String((p || {}).key || '')).filter(Boolean);
    return keys.length ? keys : PERMISSIONS;
}

function getPermissionLabel(key) {
    const fromCatalog = asArray(state.permissionCatalog).find(p => String((p || {}).key || '') === String(key || ''));
    if (fromCatalog && fromCatalog.label) return fromCatalog.label;
    return PERMISSION_LABELS[key] || key;
}

async function fetchUsersForPermissionSelector(query) {
    const q = String(query || '').trim();
    try {
        const path = q ? ('/api/users?q=' + encodeURIComponent(q) + '&limit=80') : '/api/users?limit=80';
        const result = await api(path);
        state.users = asArray(result);
    } catch (e) {
        showToast('No se pudo consultar usuarios por correo en servidor', 'error');
    }
    renderRolesSection();
}

function toggleRolePerm(permission, checked) {
    const roleId = String((document.getElementById('permRole') || {}).value || '');
    if (!roleId) return;
    const selected = new Set(asArray(state.rolePerms[roleId]).map(String));
    if (checked) selected.add(String(permission));
    else selected.delete(String(permission));
    state.rolePerms[roleId] = Array.from(selected);
}

function toggleUserPerm(permission, checked) {
    const userId = String((document.getElementById('permUser') || {}).value || '');
    if (!userId) return;
    const selected = new Set(asArray(state.userPerms[userId]).map(String));
    if (checked) selected.add(String(permission));
    else selected.delete(String(permission));
    state.userPerms[userId] = Array.from(selected);
}

function renderPermissionChecklist(containerId, selectedPerms, mode) {
    const host = document.getElementById(containerId);
    if (!host) return;
    const selected = new Set((selectedPerms || []).map(String));
    const isRoleMode = mode === 'roleperm';
    const pageKey = isRoleMode ? 'permRoleChecklistPage' : 'permUserChecklistPage';
    const sizeKey = isRoleMode ? 'permRoleChecklistPageSize' : 'permUserChecklistPageSize';
    const pagerId = isRoleMode ? 'permissionsChecklistPager' : 'userPermissionsChecklistPager';
    const permissionKeys = getPermissionKeys();
    const paged = paginateItems(permissionKeys, state.ui[pageKey], state.ui[sizeKey] || 10);
    state.ui[pageKey] = paged.page;
    const onChangeFn = isRoleMode ? 'toggleRolePerm' : 'toggleUserPerm';
    host.innerHTML = paged.items.map(p => `
        <label class="card-check" style="border:1px solid rgba(11,31,58,0.08);border-radius:8px;margin-bottom:6px">
            <input type="checkbox" value="${escapeHtml(p)}" ${selected.has(p) ? 'checked' : ''} onchange="${onChangeFn}('${escapeJsSingle(p)}', this.checked)">
            <span>${escapeHtml(getPermissionLabel(p))}</span>
        </label>
    `).join('');

    const pager = document.getElementById(pagerId);
    if (pager) {
        const prevFn = isRoleMode ? 'permRoleChecklistPrevPage' : 'permUserChecklistPrevPage';
        const nextFn = isRoleMode ? 'permRoleChecklistNextPage' : 'permUserChecklistNextPage';
        pager.innerHTML = `
            <button class="btn btn-sm btn-outline" ${paged.page <= 1 ? 'disabled' : ''} onclick="${prevFn}()">Anterior</button>
            <span>${paged.page}/${paged.totalPages}</span>
            <button class="btn btn-sm btn-outline" ${paged.page >= paged.totalPages ? 'disabled' : ''} onclick="${nextFn}()">Siguiente</button>
        `;
    }
}

function permRoleChecklistPrevPage() {
    state.ui.permRoleChecklistPage = Math.max(1, (state.ui.permRoleChecklistPage || 1) - 1);
    renderRolesSection();
}

function permRoleChecklistNextPage() {
    state.ui.permRoleChecklistPage = (state.ui.permRoleChecklistPage || 1) + 1;
    renderRolesSection();
}

function permUserChecklistPrevPage() {
    state.ui.permUserChecklistPage = Math.max(1, (state.ui.permUserChecklistPage || 1) - 1);
    renderRolesSection();
}

function permUserChecklistNextPage() {
    state.ui.permUserChecklistPage = (state.ui.permUserChecklistPage || 1) + 1;
    renderRolesSection();
}

async function saveRolePerms() {
    const roleId = String((document.getElementById('permRole') || {}).value || '');
    if (!roleId) return showToast('Selecciona un rol', 'error');
    try {
        const saved = await api('/api/admin/access/roles/' + encodeURIComponent(roleId) + '/permissions', {
            method: 'PUT',
            headers: headers(),
            body: JSON.stringify({ permissions: asArray(state.rolePerms[roleId]) })
        });
        state.rolePerms[roleId] = asArray(saved).map(String);
    } catch (e) {
        return showToast('No se pudo guardar permisos del rol en servidor', 'error');
    }
    showToast('Permisos de rol guardados', 'success');
}

async function saveUserPerms() {
    const userId = String((document.getElementById('permUser') || {}).value || '');
    if (!userId) return showToast('Selecciona un usuario', 'error');
    const perms = asArray(state.userPerms[userId]).map(String);
    try {
        const saved = await api('/api/admin/access/users/' + encodeURIComponent(userId) + '/permissions', {
            method: 'PUT',
            headers: headers(),
            body: JSON.stringify({ permissions: perms })
        });
        state.userPerms[userId] = asArray(saved).map(String);
    } catch (e) {
        console.error('Error guardando permisos de usuario:', e);
        return showToast('No se pudo guardar permisos del usuario en servidor: ' + (e && e.message ? e.message : 'Error desconocido'), 'error');
    }
    showToast('Permisos de usuario guardados', 'success');
}

function getPortalAccessForSelectedUser() {
    const userId = String((document.getElementById('permUser') || {}).value || '');
    if (!userId) return { admin: false, teacher: false, student: false };
    const current = asObject(state.userPortalAccess[userId]);
    return {
        admin: !!current.admin,
        teacher: !!current.teacher,
        student: !!current.student
    };
}

function toggleUserPortalAccess(portalKey, checked) {
    const userId = String((document.getElementById('permUser') || {}).value || '');
    if (!userId) return;
    const current = getPortalAccessForSelectedUser();
    if (portalKey === 'portal.admin') current.admin = !!checked;
    if (portalKey === 'portal.teacher') current.teacher = !!checked;
    if (portalKey === 'portal.student') current.student = !!checked;
    state.userPortalAccess[userId] = current;
}

function renderUserPortalAccessChecklist() {
    const host = document.getElementById('userPortalAccessChecklist');
    if (!host) return;
    const selected = getPortalAccessForSelectedUser();
    host.innerHTML = PORTAL_PERMISSIONS.map(p => {
        const checked = (p === 'portal.admin' && selected.admin) || (p === 'portal.teacher' && selected.teacher) || (p === 'portal.student' && selected.student);
        return `<label class="card-check" style="border:1px solid rgba(11,31,58,0.08);border-radius:8px;margin-bottom:6px">
            <input type="checkbox" value="${escapeHtml(p)}" ${checked ? 'checked' : ''} onchange="toggleUserPortalAccess('${escapeJsSingle(p)}', this.checked)">
            <span>${escapeHtml(getPermissionLabel(p))}</span>
        </label>`;
    }).join('');
}

async function saveUserPortalAccess() {
    const userId = String((document.getElementById('permUser') || {}).value || '');
    if (!userId) return showToast('Selecciona un usuario', 'error');
    const payload = getPortalAccessForSelectedUser();
    try {
        const saved = await api('/api/admin/access/users/' + encodeURIComponent(userId) + '/portals', {
            method: 'PUT',
            headers: headers(),
            body: JSON.stringify(payload)
        });
        state.userPortalAccess[userId] = asObject(saved);
    } catch (e) {
        return showToast('No se pudo guardar accesos de portal en servidor', 'error');
    }
    showToast('Accesos a portales actualizados', 'success');
}

function deleteRole(roleId) {
    state.roles = (state.roles || []).filter(r => String(r.id) !== String(roleId));
    delete state.rolePerms[String(roleId)];
    renderRolesSection();
}

function renderRolesSection() {
    const roles = (state.roles || []).filter(r => normalizedIncludes(r.name, state.ui.rolesSearch || ''));
    const paged = paginateItems(roles, state.ui.rolesPage, state.ui.rolesPageSize);
    state.ui.rolesPage = paged.page;
    setPagerInfo('rolesPageInfo', paged.page, paged.totalPages);
    const list = document.getElementById('rolesList');
    if (list) {
        list.innerHTML = paged.items.length
            ? paged.items.map(r => `<div class="card-check" style="justify-content:space-between"><span>${escapeHtml(r.name || '')}</span><button class="btn btn-sm btn-outline" onclick="deleteRole('${String(r.id)}')">Eliminar</button></div>`).join('')
            : '<div class="muted">Sin roles</div>';
    }

    const roleFiltered = (state.roles || []).filter(r => normalizedIncludes(r.name, state.ui.permRoleSearch || ''));
    const rolePaged = paginateItems(roleFiltered, state.ui.permRolePage, state.ui.permRolePageSize);
    state.ui.permRolePage = rolePaged.page;
    setPagerInfo('permRolePageInfo', rolePaged.page, rolePaged.totalPages);
    fillPagedSelect('permRole', rolePaged.items, r => `<option value="${r.id}">${escapeHtml(r.name || '')}</option>`, 'Selecciona rol', true);

    const usersFiltered = (state.users || []).filter(u => normalizedIncludes(u.name, state.ui.permUserSearch || '') || normalizedIncludes(u.email, state.ui.permUserSearch || ''));
    const usersPaged = paginateItems(usersFiltered, state.ui.permUserPage, state.ui.permUserPageSize);
    state.ui.permUserPage = usersPaged.page;
    setPagerInfo('permUserPageInfo', usersPaged.page, usersPaged.totalPages);
    fillPagedSelect('permUser', usersPaged.items, u => `<option value="${u.id}">${escapeHtml(u.name || u.email || 'Usuario')}</option>`, 'Selecciona usuario', true);

    renderPermissionChecklist('permissionsChecklist', getRolePerms(), 'roleperm');
    renderPermissionChecklist('userPermissionsChecklist', getUserPerms(), 'userperm');
    renderUserPortalAccessChecklist();
    renderAdminUsersSection();
}

function normalizeEnrollmentRequestStatus(rawStatus) {
    const value = String(rawStatus || '').toLowerCase();
    if (value.includes('aproba') || value === 'approved') return 'approved';
    if (value.includes('rechaza') || value === 'rejected') return 'rejected';
    return 'pending-review';
}

function enrollmentStatusLabel(status) {
    const s = normalizeEnrollmentRequestStatus(status);
    if (s === 'approved') return 'Aprobada';
    if (s === 'rejected') return 'Rechazada';
    return 'Pendiente por revision';
}

function readEnrollmentRequestsStorage() {
    let raw = null;
    try {
        raw = localStorage.getItem('educat_enrollment_requests');
    } catch (e) { raw = null; }
    return asArray(raw ? JSON.parse(raw) : []).map((item, idx) => {
        const row = asObject(item);
        return {
            ...row,
            id: String(row.id || ('enr-' + idx + '-' + Date.now())),
            createdAt: String(row.createdAt || ''),
            status: normalizeEnrollmentRequestStatus(row.status),
            student: asObject(row.student),
            academic: asObject(row.academic),
            guardian: asObject(row.guardian),
            review: asObject(row.review),
            documents: asObject(row.documents),
            extra: asArray(row.extra),
            notes: String(row.notes || ''),
            formConfigSnapshot: asArray(row.formConfigSnapshot)
        };
    });
}

function saveEnrollmentRequestsStorage(items) {
    try {
        localStorage.setItem('educat_enrollment_requests', JSON.stringify(asArray(items)));
    } catch (e) {
        showToast('No se pudieron guardar los cambios en las solicitudes.', 'error');
        throw e;
    }
}

function setEnrollmentReviewSearch(value) {
    state.ui.enrollmentReviewSearch = String(value || '');
    state.ui.enrollmentReviewPage = 1;
    renderEnrollmentReviewSection();
}

function setEnrollmentReviewStatusFilter(value) {
    state.ui.enrollmentReviewStatusFilter = String(value || 'pending-review');
    state.ui.enrollmentReviewPage = 1;
    renderEnrollmentReviewSection();
}

function setEnrollmentReviewLevelFilter(value) {
    state.ui.enrollmentReviewLevelFilter = String(value || 'all');
    state.ui.enrollmentReviewPage = 1;
    renderEnrollmentReviewSection();
}

function setEnrollmentReviewFromDate(value) {
    state.ui.enrollmentReviewFromDate = String(value || '');
    state.ui.enrollmentReviewPage = 1;
    renderEnrollmentReviewSection();
}

function setEnrollmentReviewToDate(value) {
    state.ui.enrollmentReviewToDate = String(value || '');
    state.ui.enrollmentReviewPage = 1;
    renderEnrollmentReviewSection();
}

function enrollmentReviewPrevPage() {
    state.ui.enrollmentReviewPage = Math.max(1, parseInt(state.ui.enrollmentReviewPage || '1', 10) - 1);
    renderEnrollmentReviewSection();
}

function enrollmentReviewNextPage() {
    state.ui.enrollmentReviewPage = parseInt(state.ui.enrollmentReviewPage || '1', 10) + 1;
    renderEnrollmentReviewSection();
}

function toggleEnrollmentReviewSelection(enrollmentId, checked) {
    const id = String(enrollmentId || '');
    const selected = new Set(asArray(state.ui.enrollmentReviewSelectedIds).map(String));
    if (checked) selected.add(id);
    else selected.delete(id);
    state.ui.enrollmentReviewSelectedIds = Array.from(selected);
    renderEnrollmentReviewSection();
}

function selectCurrentPageEnrollmentReviews() {
    const selected = new Set(asArray(state.ui.enrollmentReviewSelectedIds).map(String));
    asArray(state.ui.enrollmentReviewCurrentPageIds).forEach(id => selected.add(String(id)));
    state.ui.enrollmentReviewSelectedIds = Array.from(selected);
    renderEnrollmentReviewSection();
}

function selectFilteredEnrollmentReviews() {
    const selected = new Set(asArray(state.ui.enrollmentReviewSelectedIds).map(String));
    asArray(state.ui.enrollmentReviewFilteredIds).forEach(id => selected.add(String(id)));
    state.ui.enrollmentReviewSelectedIds = Array.from(selected);
    renderEnrollmentReviewSection();
}

function clearEnrollmentReviewSelection() {
    state.ui.enrollmentReviewSelectedIds = [];
    renderEnrollmentReviewSection();
}

function updateEnrollmentRequestsByIds(ids, updater) {
    const target = new Set(asArray(ids).map(String));
    if (!target.size) return 0;
    const list = readEnrollmentRequestsStorage();
    let changed = 0;
    const updated = list.map(item => {
        const id = String(item.id || '');
        if (!target.has(id)) return item;
        changed += 1;
        return updater(item);
    });
    saveEnrollmentRequestsStorage(updated);
    state.ui.enrollmentReviewSelectedIds = asArray(state.ui.enrollmentReviewSelectedIds)
        .map(String)
        .filter(id => !target.has(id));
    return changed;
}

async function approveEnrollmentRequests(ids) {
    const targetIds = asArray(ids).map(String).filter(Boolean);
    if (!targetIds.length) return showToast('No hay solicitudes seleccionadas', 'error');

    const studentRole = asArray(state.roles).find(r => {
        const name = String(r.name || '').toUpperCase();
        return name === 'ESTUDIANTE' || name === 'STUDENT';
    });
    if (!studentRole) {
        return showToast('No se encontró el rol ESTUDIANTE en el sistema. Contacta al administrador.', 'error');
    }
    const studentRoleId = studentRole.id;

    const list = readEnrollmentRequestsStorage();
    const toApprove = list.filter(item => targetIds.has(String(item.id || '')));

    let approvedCount = 0;
    let createdCount = 0;

    for (const item of toApprove) {
        const s = asObject(item.student);
        const g = asObject(item.guardian);
        const studentEmail = String(s.email || '').trim();
        const studentName = String(s.name || '').trim();
        const studentLastName = String(s.lastName || '').trim();
        const studentDoc = String(s.document || '').trim();

        if (!studentEmail) {
            showToast(`La solicitud de ${studentName || 'estudiante'} no tiene correo electrónico. No se puede crear el usuario.`, 'error');
            continue;
        }

        try {
            const existingUser = asArray(state.users).find(u => String(u.email || '').toLowerCase() === studentEmail.toLowerCase());
            let userId = existingUser ? existingUser.id : null;

            if (!userId) {
                const userPayload = {
                    name: `${studentName} ${studentLastName}`.trim() || studentEmail,
                    email: studentEmail,
                    password: studentDoc || 'EducaT2024!',
                    documentId: studentDoc || '',
                    phone: String(g.phone || '').trim(),
                    roleId: parseInt(studentRoleId, 10),
                    status: true
                };
                const createdUser = await api('/api/users', { method: 'POST', headers: headers(), body: JSON.stringify(userPayload) });
                userId = createdUser.id;
                state.users.push(createdUser);
            }

            const existingStudent = asArray(state.students).find(st => String(st.user && st.user.id) === String(userId));
            let studentId = existingStudent ? existingStudent.id : null;

            if (!studentId) {
                const studentCode = formatStudentCode(getNextStudentCodeSeed() + createdCount);
                const studentPayload = {
                    userId: parseInt(userId, 10),
                    studentCode: studentCode
                };
                const createdStudent = await api('/api/students', { method: 'POST', headers: headers(), body: JSON.stringify(studentPayload) });
                studentId = createdStudent.id;
                state.students.push(createdStudent);
                createdCount++;
            }

            item.status = 'approved';
            item.review = {
                ...asObject(item.review),
                decision: 'approved',
                reason: '',
                correction: '',
                reviewedAt: new Date().toISOString(),
                studentId: studentId,
                userId: userId
            };
            item.studentId = studentId;
            item.userId = userId;
            approvedCount++;
        } catch (e) {
            console.error('Error al crear usuario/estudiante:', e);
            showToast(`Error al procesar solicitud de ${studentName}: ${e.message || 'Error desconocido'}`, 'error');
        }
    }

    saveEnrollmentRequestsStorage(list);
    renderEnrollmentReviewSection();

    if (approvedCount) {
        showToast(`Solicitudes aprobadas: ${approvedCount}. Estudiantes creados: ${createdCount}.`, 'success');
    } else {
        showToast('No se pudo aprobar ninguna solicitud.', 'error');
    }
}

async function approveEnrollmentRequest(enrollmentId) {
    await approveEnrollmentRequests([enrollmentId]);
}

async function approveSelectedEnrollmentRequests() {
    await approveEnrollmentRequests(state.ui.enrollmentReviewSelectedIds);
}

function rejectEnrollmentRequests(ids, reason, correction) {
    const cleanReason = normalize(reason);
    const cleanCorrection = normalize(correction);
    if (!cleanReason && !cleanCorrection) {
        return showToast('Debes indicar motivo y/o correccion', 'error');
    }
    const changed = updateEnrollmentRequestsByIds(ids, item => ({
        ...item,
        status: 'rejected',
        review: {
            ...asObject(item.review),
            decision: 'rejected',
            reason: cleanReason,
            correction: cleanCorrection,
            reviewedAt: new Date().toISOString()
        }
    }));
    if (!changed) return showToast('No hay solicitudes seleccionadas', 'error');
    renderEnrollmentReviewSection();
    showToast('Solicitudes rechazadas: ' + changed, 'success');
}

function openEnrollmentRejectModal(ids) {
    const targetIds = asArray(ids).map(String).filter(Boolean);
    if (!targetIds.length) return showToast('Selecciona al menos una solicitud', 'error');
    modalState.enrollmentRejectIds = targetIds;
    openModal('Rechazar matricula(s)', `
        <div class="form-group">
            <label class="form-label">Motivo del rechazo</label>
            <textarea class="form-input" id="enrollmentRejectReason" style="min-height:100px" placeholder="Describe por qué se rechaza la solicitud..."></textarea>
        </div>
        <div class="form-group">
            <label class="form-label">Correccion solicitada</label>
            <textarea class="form-input" id="enrollmentRejectCorrection" style="min-height:90px" placeholder="Indica qué debe corregir el acudiente/estudiante..."></textarea>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px">
            <button class="btn btn-outline" type="button" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-teal" type="button" onclick="confirmEnrollmentRejectModal()">Confirmar rechazo</button>
        </div>
    `);
}

function rejectEnrollmentRequest(enrollmentId) {
    openEnrollmentRejectModal([enrollmentId]);
}

function confirmEnrollmentRejectModal() {
    const reason = normalize((document.getElementById('enrollmentRejectReason') || {}).value || '');
    const correction = normalize((document.getElementById('enrollmentRejectCorrection') || {}).value || '');
    const ids = asArray(modalState.enrollmentRejectIds).map(String).filter(Boolean);
    if (!reason && !correction) return showToast('Debes indicar motivo y/o correccion', 'error');
    rejectEnrollmentRequests(ids, reason, correction);
    modalState.enrollmentRejectIds = [];
    closeModal();
}

function rejectSelectedEnrollmentRequests() {
    openEnrollmentRejectModal(state.ui.enrollmentReviewSelectedIds);
}

function getEnrollmentReviewDocumentsCount(item) {
    const docs = asObject(item.documents);
    const standard = ['schoolCertificate', 'guardianIdentityCopy', 'studentIdentityCard', 'healthAffiliationCertificate']
        .filter(k => !!String((docs[k] || {}).name || '').trim()).length;
    const additional = asArray(docs.additional).filter(a => !!String((a.file || {}).name || '').trim()).length;
    return standard + additional;
}

function enrollmentFormatBytes(bytes) {
    const value = Math.max(0, parseInt(bytes || '0', 10) || 0);
    if (value < 1024) return value + ' B';
    if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB';
    return (value / (1024 * 1024)).toFixed(1) + ' MB';
}

function openDataUrlViewer(dataUrl, title) {
    const url = String(dataUrl || '');
    const isImage = /^data:image\//i.test(url);
    const isPdf = /^data:application\/pdf/i.test(url);
    if (!isImage && !isPdf) {
        return window.open(url, '_blank');
    }
    if (isImage) {
        openModal(escapeHtml(title || 'Vista previa'), `
            <div style="text-align:center">
                <img src="${escapeHtml(url)}" style="max-width:100%;max-height:70vh;border-radius:8px;" alt="${escapeHtml(title || '')}">
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
                <a class="btn btn-teal" href="${escapeHtml(url)}" download="${escapeHtml(title || 'adjunto')}">Descargar</a>
                <button class="btn btn-outline" onclick="closeModal()">Cerrar</button>
            </div>
        `);
    } else {
        openModal(escapeHtml(title || 'Vista previa PDF'), `
            <div style="width:100%;height:60vh;border:1px solid var(--border);border-radius:8px;overflow:hidden">
                <iframe src="${escapeHtml(url)}" style="width:100%;height:100%;border:0"></iframe>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
                <a class="btn btn-teal" href="${escapeHtml(url)}" download="${escapeHtml(title || 'adjunto.pdf')}">Descargar</a>
                <button class="btn btn-outline" onclick="closeModal()">Cerrar</button>
            </div>
        `);
    }
}

function openEnrollmentAttachmentsModal(enrollmentId) {
    const id = String(enrollmentId || '');
    const item = readEnrollmentRequestsStorage().find(x => String((x || {}).id || '') === id);
    if (!item) return showToast('Solicitud no encontrada', 'error');
    const docs = asObject(item.documents);

    const standardDefs = [
        { key: 'schoolCertificate', label: 'Certificado de escolaridad' },
        { key: 'guardianIdentityCopy', label: 'Documento de identidad del acudiente' },
        { key: 'studentIdentityCard', label: 'Tarjeta de identidad' },
        { key: 'healthAffiliationCertificate', label: 'Certificado de afiliación a salud (opcional)' }
    ];

    const cards = [];

    standardDefs.forEach(def => {
        const file = asObject(docs[def.key]);
        const hasFile = !!String(file.name || '').trim();
        const hasDataUrl = hasFile && /^data:/i.test(String(file.dataUrl || ''));
        const meta = hasFile ? `${escapeHtml(String(file.type || 'archivo'))} · ${enrollmentFormatBytes(file.size)}` : 'No adjunto';

        let preview = '';
        if (hasDataUrl) {
            const isImage = /^data:image\//i.test(String(file.dataUrl || ''));
            const isPdf = /^data:application\/pdf/i.test(String(file.dataUrl || ''));
            if (isImage) {
                preview = `<div style="height:160px;background:#f6f7f9;border-radius:8px;overflow:hidden;cursor:pointer" onclick="openDataUrlViewer('${escapeJsSingle(String(file.dataUrl || ''))}', '${escapeJsSingle(def.label)}')"><img src="${escapeHtml(String(file.dataUrl || ''))}" style="width:100%;height:100%;object-fit:cover"></div>`;
            } else if (isPdf) {
                preview = `<div style="height:160px;background:#f6f7f9;border-radius:8px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer" onclick="openDataUrlViewer('${escapeJsSingle(String(file.dataUrl || ''))}', '${escapeJsSingle(def.label)}')"><svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg><span style="font-size:13px;color:var(--text-dark)">Ver PDF</span></div>`;
            } else {
                preview = `<div style="height:160px;background:#f6f7f9;border-radius:8px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer" onclick="openDataUrlViewer('${escapeJsSingle(String(file.dataUrl || ''))}', '${escapeJsSingle(def.label)}')"><svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span style="font-size:13px;color:var(--text-dark)">Ver archivo</span></div>`;
            }
        } else {
            preview = `<div style="height:160px;background:#f6f7f9;border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--text-light);font-size:13px">Sin vista previa</div>`;
        }

        const actions = hasDataUrl
            ? `<div style="display:flex;gap:6px;margin-top:10px"><a class="btn btn-sm btn-outline" href="${escapeHtml(String(file.dataUrl || ''))}" download="${escapeHtml(String(file.name || 'adjunto'))}">Descargar</a><button class="btn btn-sm btn-outline" onclick="openDataUrlViewer('${escapeJsSingle(String(file.dataUrl || ''))}', '${escapeJsSingle(def.label)}')">Ver</button></div>`
            : (hasFile ? `<div style="display:flex;gap:6px;margin-top:10px"><span class="muted" style="font-size:12px">Archivo demasiado grande para vista previa</span></div>` : `<div style="display:flex;gap:6px;margin-top:10px"><span class="muted" style="font-size:12px">No adjunto</span></div>`);

        cards.push(`<div style="border:1px solid var(--border);border-radius:10px;padding:12px;background:#fff">
            <div style="font-weight:600;font-size:13px;margin-bottom:8px">${escapeHtml(def.label)}</div>
            ${preview}
            <div style="margin-top:8px;font-size:12px;color:var(--text-light)">${hasFile ? escapeHtml(String(file.name || '')) + ' · ' + escapeHtml(meta) : escapeHtml(meta)}</div>
            ${actions}
        </div>`);
    });

    asArray(docs.additional).forEach((addItem, idx) => {
        const file = asObject((addItem || {}).file);
        const label = String((addItem || {}).label || `Adjunto adicional ${idx + 1}`);
        const hasFile = !!String(file.name || '').trim();
        const hasDataUrl = hasFile && /^data:/i.test(String(file.dataUrl || ''));
        const meta = hasFile ? `${escapeHtml(String(file.type || 'archivo'))} · ${enrollmentFormatBytes(file.size)}` : 'No adjunto';

        let preview = '';
        if (hasDataUrl) {
            const isImage = /^data:image\//i.test(String(file.dataUrl || ''));
            const isPdf = /^data:application\/pdf/i.test(String(file.dataUrl || ''));
            if (isImage) {
                preview = `<div style="height:160px;background:#f6f7f9;border-radius:8px;overflow:hidden;cursor:pointer" onclick="openDataUrlViewer('${escapeJsSingle(String(file.dataUrl || ''))}', '${escapeJsSingle(label)}')"><img src="${escapeHtml(String(file.dataUrl || ''))}" style="width:100%;height:100%;object-fit:cover"></div>`;
            } else if (isPdf) {
                preview = `<div style="height:160px;background:#f6f7f9;border-radius:8px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer" onclick="openDataUrlViewer('${escapeJsSingle(String(file.dataUrl || ''))}', '${escapeJsSingle(label)}')"><svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg><span style="font-size:13px;color:var(--text-dark)">Ver PDF</span></div>`;
            } else {
                preview = `<div style="height:160px;background:#f6f7f9;border-radius:8px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer" onclick="openDataUrlViewer('${escapeJsSingle(String(file.dataUrl || ''))}', '${escapeJsSingle(label)}')"><svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span style="font-size:13px;color:var(--text-dark)">Ver archivo</span></div>`;
            }
        } else {
            preview = `<div style="height:160px;background:#f6f7f9;border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--text-light);font-size:13px">Sin vista previa</div>`;
        }

        const actions = hasDataUrl
            ? `<div style="display:flex;gap:6px;margin-top:10px"><a class="btn btn-sm btn-outline" href="${escapeHtml(String(file.dataUrl || ''))}" download="${escapeHtml(String(file.name || 'adjunto'))}">Descargar</a><button class="btn btn-sm btn-outline" onclick="openDataUrlViewer('${escapeJsSingle(String(file.dataUrl || ''))}', '${escapeJsSingle(label)}')">Ver</button></div>`
            : (hasFile ? `<div style="display:flex;gap:6px;margin-top:10px"><span class="muted" style="font-size:12px">Archivo demasiado grande para vista previa</span></div>` : `<div style="display:flex;gap:6px;margin-top:10px"><span class="muted" style="font-size:12px">No adjunto</span></div>`);

        cards.push(`<div style="border:1px solid var(--border);border-radius:10px;padding:12px;background:#fff">
            <div style="font-weight:600;font-size:13px;margin-bottom:8px">${escapeHtml(label)}</div>
            ${preview}
            <div style="margin-top:8px;font-size:12px;color:var(--text-light)">${hasFile ? escapeHtml(String(file.name || '')) + ' · ' + escapeHtml(meta) : escapeHtml(meta)}</div>
            ${actions}
        </div>`);
    });

    const grid = cards.length
        ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">${cards.join('')}</div>`
        : '<div class="muted">No hay adjuntos en esta solicitud.</div>';

    openModal('Adjuntos de matrícula', grid);
}

function openEnrollmentDetailModal(enrollmentId) {
    const id = String(enrollmentId || '');
    const item = readEnrollmentRequestsStorage().find(x => String((x || {}).id || '') === id);
    if (!item) return showToast('Solicitud no encontrada', 'error');

    const s = asObject(item.student);
    const a = asObject(item.academic);
    const g = asObject(item.guardian);
    const extra = asArray(item.extra);
    const notes = String(item.notes || '');
    const created = item.createdAt ? new Date(item.createdAt).toLocaleString('es-CO') : '-';
    const status = enrollmentStatusLabel(item.status);

    const field = (label, value) => `<div style="margin-bottom:6px"><span style="color:var(--text-light);font-size:12px">${escapeHtml(label)}</span><div style="font-size:13px;color:var(--text-dark);font-weight:500">${escapeHtml(String(value || '—'))}</div></div>`;

    let extraHtml = '';
    if (extra.length) {
        extraHtml = `<div style="margin-top:12px"><div style="font-weight:700;font-size:13px;margin-bottom:8px;color:var(--gold)">Campos adicionales</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${extra.map(e => field(e.label || e.id, e.value)).join('')}</div></div>`;
    }

    const notesHtml = notes ? `<div style="margin-top:12px"><div style="font-weight:700;font-size:13px;margin-bottom:8px;color:var(--gold)">Observaciones</div><div style="font-size:13px;color:var(--text-dark);background:#f8f9fb;border-radius:6px;padding:10px">${escapeHtml(notes)}</div></div>` : '';

    const html = `
        <div style="margin-bottom:12px">
            <span style="display:inline-block;padding:4px 10px;border-radius:20px;background:rgba(184,147,58,0.12);color:var(--gold);font-size:12px;font-weight:600">${escapeHtml(status)}</span>
            <span style="font-size:12px;color:var(--text-light);margin-left:8px">${escapeHtml(created)}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div style="border:1px solid var(--border);border-radius:10px;padding:14px;background:#fff">
                <div style="font-weight:700;font-size:13px;margin-bottom:10px;color:var(--gold)">Estudiante</div>
                ${field('Nombre', s.name)}
                ${field('Apellidos', s.lastName)}
                ${field('Documento', s.document)}
                ${field('Fecha de nacimiento', s.birthDate)}
                ${field('Género', s.gender)}
            </div>
            <div style="border:1px solid var(--border);border-radius:10px;padding:14px;background:#fff">
                <div style="font-weight:700;font-size:13px;margin-bottom:10px;color:var(--gold)">Datos académicos</div>
                ${field('Nivel', a.level)}
                ${field('Grado', a.grade)}
            </div>
            <div style="border:1px solid var(--border);border-radius:10px;padding:14px;background:#fff;grid-column:1 / -1">
                <div style="font-weight:700;font-size:13px;margin-bottom:10px;color:var(--gold)">Acudiente</div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
                    ${field('Nombre', g.name)}
                    ${field('Parentesco', g.relation)}
                    ${field('Teléfono', g.phone)}
                    ${field('Correo', g.email)}
                    ${field('Dirección', g.address)}
                </div>
            </div>
        </div>
        ${notesHtml}
        ${extraHtml}
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">
            <button class="btn btn-outline" onclick="closeModal()">Cerrar</button>
            <button class="btn btn-teal" onclick="openEnrollmentAttachmentsModal('${escapeJsSingle(id)}');closeModal()">Ver adjuntos</button>
        </div>
    `;

    openModal('Detalle de solicitud de matrícula', html);
}

function renderEnrollmentReviewSection() {
    const tableEl = document.getElementById('enrollmentReviewTable');
    if (!tableEl) return;
    const pagerEl = document.getElementById('enrollmentReviewPager');
    const summaryEl = document.getElementById('enrollmentReviewSummary');
    const searchEl = document.getElementById('enrollmentReviewSearch');
    const statusEl = document.getElementById('enrollmentReviewStatusFilter');
    const levelEl = document.getElementById('enrollmentReviewLevelFilter');
    const fromEl = document.getElementById('enrollmentReviewFromDate');
    const toEl = document.getElementById('enrollmentReviewToDate');

    const all = readEnrollmentRequestsStorage();
    const levelOptions = Array.from(new Set(all.map(r => String(((r.academic || {}).level) || '').trim()).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    fillSelect('enrollmentReviewLevelFilter', levelOptions.map(v => ({ id: v, name: v })), l => `<option value="${escapeHtml(l.id)}">${escapeHtml(l.name)}</option>`, 'Todos los niveles');

    if (searchEl) searchEl.value = String(state.ui.enrollmentReviewSearch || '');
    if (statusEl) statusEl.value = String(state.ui.enrollmentReviewStatusFilter || 'pending-review');
    if (levelEl) {
        const selectedLevel = String(state.ui.enrollmentReviewLevelFilter || 'all');
        levelEl.value = selectedLevel === 'all' ? '' : selectedLevel;
    }
    if (fromEl) fromEl.value = String(state.ui.enrollmentReviewFromDate || '');
    if (toEl) toEl.value = String(state.ui.enrollmentReviewToDate || '');

    const query = String(state.ui.enrollmentReviewSearch || '').trim().toLowerCase();
    const statusFilter = String(state.ui.enrollmentReviewStatusFilter || 'pending-review');
    const levelFilter = String(state.ui.enrollmentReviewLevelFilter || 'all');
    const fromDate = String(state.ui.enrollmentReviewFromDate || '');
    const toDate = String(state.ui.enrollmentReviewToDate || '');

    const filtered = all.filter(item => {
        const status = normalizeEnrollmentRequestStatus(item.status);
        const statusOk = statusFilter === 'all' ? true : status === statusFilter;
        const level = String(((item.academic || {}).level) || '').trim();
        const levelOk = levelFilter === 'all' ? true : level === levelFilter;
        const created = String(item.createdAt || '').slice(0, 10);
        const fromOk = !fromDate || (created && created >= fromDate);
        const toOk = !toDate || (created && created <= toDate);
        const studentName = String(((item.student || {}).name) || '');
        const studentDoc = String(((item.student || {}).document) || '');
        const guardianName = String(((item.guardian || {}).name) || '');
        const text = `${studentName} ${studentDoc} ${guardianName} ${level}`.toLowerCase();
        const queryOk = !query || text.includes(query);
        return statusOk && levelOk && fromOk && toOk && queryOk;
    });

    const validIds = new Set(all.map(x => String(x.id || '')));
    state.ui.enrollmentReviewSelectedIds = asArray(state.ui.enrollmentReviewSelectedIds).map(String).filter(id => validIds.has(id));
    state.ui.enrollmentReviewFilteredIds = filtered.map(x => String(x.id || ''));

    const paged = paginateItems(filtered, state.ui.enrollmentReviewPage, state.ui.enrollmentReviewPageSize || 8);
    state.ui.enrollmentReviewPage = paged.page;
    state.ui.enrollmentReviewCurrentPageIds = paged.items.map(x => String(x.id || ''));
    const selected = new Set(asArray(state.ui.enrollmentReviewSelectedIds).map(String));

    tableEl.innerHTML = paged.items.length
        ? `<table class="simple-table"><thead><tr>
            <th style="width:40px"></th>
            <th>Fecha</th>
            <th>Estudiante</th>
            <th>Nivel/Grado</th>
            <th>Acudiente</th>
            <th>Estado</th>
            <th>Revision</th>
            <th>Adjuntos</th>
            <th>Acciones</th>
        </tr></thead><tbody>${paged.items.map(item => {
            const id = String(item.id || '');
            const created = item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-CO') : '-';
            const studentName = String(((item.student || {}).name) || 'Sin nombre');
            const studentDoc = String(((item.student || {}).document) || '-');
            const level = String(((item.academic || {}).level) || 'Sin nivel');
            const grade = String(((item.academic || {}).grade) || 'Sin grado');
            const guardian = String(((item.guardian || {}).name) || 'Sin acudiente');
            const status = normalizeEnrollmentRequestStatus(item.status);
            const statusLabel = enrollmentStatusLabel(status);
            const review = asObject(item.review);
            const reviewText = status === 'rejected'
                ? [String(review.reason || '').trim(), String(review.correction || '').trim()].filter(Boolean).join(' | ')
                : (status === 'approved' ? 'Aprobada' : 'Pendiente');
            const docsCount = getEnrollmentReviewDocumentsCount(item);
            return `<tr>
                <td><input type="checkbox" ${selected.has(id) ? 'checked' : ''} onchange="toggleEnrollmentReviewSelection('${escapeJsSingle(id)}', this.checked)"></td>
                <td>${escapeHtml(created)}</td>
                <td><div>${escapeHtml(studentName)}</div><div class="muted">Doc: ${escapeHtml(studentDoc)} | Adjuntos: ${docsCount}</div></td>
                <td>${escapeHtml(level)} · ${escapeHtml(grade)}</td>
                <td>${escapeHtml(guardian)}</td>
                <td>${escapeHtml(statusLabel)}</td>
                <td>${escapeHtml(reviewText || '-')}</td>
                <td><button class="btn btn-sm btn-outline" onclick="openEnrollmentAttachmentsModal('${escapeJsSingle(id)}')">Adjuntos (${docsCount})</button></td>
                <td style="white-space:nowrap">
                    <button class="btn btn-sm btn-outline" onclick="openEnrollmentDetailModal('${escapeJsSingle(id)}')">Detalle</button>
                    <button class="btn btn-sm btn-outline" onclick="approveEnrollmentRequest('${escapeJsSingle(id)}')">Aprobar</button>
                    <button class="btn btn-sm btn-outline" onclick="rejectEnrollmentRequest('${escapeJsSingle(id)}')">Rechazar</button>
                </td>
            </tr>`;
        }).join('')}</tbody></table>`
        : '<div class="muted" style="padding:10px">No hay solicitudes para este filtro.</div>';

    if (pagerEl) {
        pagerEl.innerHTML = `
            <button class="btn btn-sm btn-outline" ${paged.page <= 1 ? 'disabled' : ''} onclick="enrollmentReviewPrevPage()">Anterior</button>
            <span>${paged.page}/${paged.totalPages}</span>
            <button class="btn btn-sm btn-outline" ${paged.page >= paged.totalPages ? 'disabled' : ''} onclick="enrollmentReviewNextPage()">Siguiente</button>
        `;
    }

    if (summaryEl) {
        summaryEl.textContent = `Seleccionadas: ${selected.size} | Filtradas: ${filtered.length} | Mostrando: ${paged.items.length}`;
    }
}

function cloneEnrollmentField(field) {
    const item = asObject(field);
    if (String(item.id || '') === 'schedule') {
        return {
            id: 'studentLastName',
            section: 'Datos del estudiante',
            type: 'text',
            label: 'Apellidos del estudiante',
            placeholder: 'Apellidos del estudiante',
            required: true,
            options: []
        };
    }
    return {
        id: String(item.id || ('f-' + Date.now() + '-' + Math.floor(Math.random() * 1000))),
        section: String(item.section || 'General'),
        type: String(item.type || 'text'),
        label: String(item.label || 'Campo').trim(),
        placeholder: String(item.placeholder || ''),
        required: item.required !== false,
        immutable: !!item.immutable,
        options: asArray(item.options).map(String)
    };
}

function mergeEnrollmentFields(stored) {
    const defaults = DEFAULT_ENROLLMENT_FORM_FIELDS.map(cloneEnrollmentField);
    const storedMap = new Map((stored || []).map(f => [String((f || {}).id || ''), cloneEnrollmentField(f)]));
    const merged = defaults.map(def => {
        const storedField = storedMap.get(def.id);
        if (!storedField) return def;
        if (def.immutable) {
            return { ...def, required: def.required };
        }
        return { ...def, ...storedField, id: def.id, immutable: def.immutable };
    });
    const defaultIds = new Set(defaults.map(f => f.id));
    (stored || []).forEach(f => {
        const id = String((f || {}).id || '');
        if (id && !defaultIds.has(id)) {
            merged.push(cloneEnrollmentField(f));
        }
    });
    return merged;
}

function hardenEnrollmentFormFields(fields) {
    const list = (fields || []).map(cloneEnrollmentField);
    const emailIdx = list.findIndex(f => f.id === 'studentEmail');
    if (emailIdx >= 0) {
        list[emailIdx].required = true;
        list[emailIdx].immutable = true;
    }
    const lastNameIdx = list.findIndex(f => f.id === 'studentLastName');
    if (lastNameIdx >= 6) {
        const [item] = list.splice(lastNameIdx, 1);
        list.splice(1, 0, item);
    } else if (lastNameIdx < 0) {
        const def = DEFAULT_ENROLLMENT_FORM_FIELDS.find(f => f.id === 'studentLastName');
        if (def) list.splice(1, 0, cloneEnrollmentField(def));
    }
    // Forzar nivel y grado a select siempre
    ['level', 'grade'].forEach(key => {
        const idx = list.findIndex(f => f.id === key);
        if (idx >= 0) {
            list[idx].type = 'select';
            list[idx].options = [];
        }
    });
    let fileSlots = ENROLLMENT_FORM_MAX_FILE_FIELDS;
    return list.filter(f => {
        if (f.type !== 'file') return true;
        if (fileSlots <= 0) return false;
        fileSlots -= 1;
        return true;
    });
}

function getEnrollmentFormConfigDraft() {
    const current = asArray(state.ui.enrollmentFormBuilderDraft);
    if (current.length) return current; // devolver referencia mutable directamente
    const stored = asArray(state.ui.enrollmentFormConfigLoaded).map(cloneEnrollmentField);
    const baseline = stored.length ? stored : DEFAULT_ENROLLMENT_FORM_FIELDS.map(cloneEnrollmentField);
    const hardened = hardenEnrollmentFormFields(baseline);
    state.ui.enrollmentFormBuilderDraft = hardened;
    return hardened;
}

function countEnrollmentFileFields(fields) {
    return asArray(fields).filter(f => String((f || {}).type || '') === 'file').length;
}

function normalizeEnrollmentFormDraft(fields) {
    const normalized = asArray(fields).map(cloneEnrollmentField);
    const fileCount = countEnrollmentFileFields(normalized);
    if (fileCount <= ENROLLMENT_FORM_MAX_FILE_FIELDS) return normalized;
    let allowed = ENROLLMENT_FORM_MAX_FILE_FIELDS;
    return normalized.filter(f => {
        if (String((f || {}).type || '') !== 'file') return true;
        if (allowed <= 0) return false;
        allowed -= 1;
        return true;
    });
}

function saveEnrollmentFormBuilderDraft() {
    const draft = getEnrollmentFormConfigDraft();
    const normalized = hardenEnrollmentFormFields(normalizeEnrollmentFormDraft(draft));
    // Asegurar que el draft mutable también refleje la normalización
    state.ui.enrollmentFormBuilderDraft = normalized;
    // Guardar en localStorage para que el estudiante lo reciba en tiempo real via storage event
    try {
        localStorage.setItem(STORAGE_KEYS.enrollmentFormConfig, JSON.stringify(normalized));
    } catch (e) {
        // ignorar errores de quota
    }
    api('/api/config/enrollment-form-config', { method: 'PUT', headers: headers(), body: JSON.stringify(normalized) }).catch(() => {});
}

function addEnrollmentFormField(type) {
    const nextType = String(type || 'text');
    const draft = state.ui.enrollmentFormBuilderDraft;
    if (!Array.isArray(draft) || !draft.length) {
        // Inicializar si está vacío
        state.ui.enrollmentFormBuilderDraft = hardenEnrollmentFormFields(DEFAULT_ENROLLMENT_FORM_FIELDS.map(cloneEnrollmentField));
    }
    const effectiveDraft = state.ui.enrollmentFormBuilderDraft;
    if (nextType === 'file' && countEnrollmentFileFields(effectiveDraft) >= ENROLLMENT_FORM_MAX_FILE_FIELDS) {
        showToast('Máximo 4 campos de adjuntos. Para más archivos, usa campo URL.', 'error');
        return;
    }
    effectiveDraft.push(cloneEnrollmentField({
        id: 'custom-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        section: 'Campos adicionales',
        type: nextType,
        label: nextType === 'file' ? 'Nuevo adjunto' : 'Nueva pregunta',
        placeholder: nextType === 'url' ? 'https://...' : '',
        required: false,
        options: []
    }));
    state.ui.enrollmentFormBuilderPage = Math.max(1, Math.ceil(effectiveDraft.length / (state.ui.enrollmentFormBuilderPageSize || 6)));
    renderEnrollmentFormBuilderSection();
}

function updateEnrollmentFormField(index, key, value, rerender) {
    const draft = state.ui.enrollmentFormBuilderDraft;
    if (!Array.isArray(draft)) return;
    const idx = parseInt(index || '-1', 10);
    if (idx < 0 || idx >= draft.length) return;
    const field = draft[idx];
    if (!field) return;
    if (key === 'required') {
        field.required = !!value;
    } else if (key === 'options') {
        field.options = String(value || '').split(',').map(x => x.trim()).filter(Boolean);
    } else if (key === 'type') {
        const nextType = String(value || 'text');
        const currentType = String(field.type || 'text');
        if (nextType === 'file' && currentType !== 'file' && countEnrollmentFileFields(draft) >= ENROLLMENT_FORM_MAX_FILE_FIELDS) {
            showToast('Máximo 4 campos de adjuntos. Usa URL para archivos adicionales.', 'error');
            renderEnrollmentFormBuilderSection();
            return;
        }
        field.type = nextType;
        if (nextType !== 'select') field.options = [];
    } else {
        field[key] = String(value || '');
    }
    if (rerender !== false) renderEnrollmentFormBuilderSection();
}

function deleteEnrollmentFormField(index) {
    const draft = state.ui.enrollmentFormBuilderDraft;
    if (!Array.isArray(draft)) return;
    const idx = parseInt(index || '-1', 10);
    if (idx < 0 || idx >= draft.length) return;
    if (draft[idx].immutable) {
        showToast('Este campo es obligatorio del sistema y no se puede eliminar.', 'error');
        return;
    }
    draft.splice(idx, 1);
    state.ui.enrollmentFormBuilderPage = Math.max(1, state.ui.enrollmentFormBuilderPage || 1);
    renderEnrollmentFormBuilderSection();
}

function enrollmentFormBuilderPrevPage() {
    state.ui.enrollmentFormBuilderPage = Math.max(1, parseInt(state.ui.enrollmentFormBuilderPage || '1', 10) - 1);
    renderEnrollmentFormBuilderSection();
}

function enrollmentFormBuilderNextPage() {
    state.ui.enrollmentFormBuilderPage = parseInt(state.ui.enrollmentFormBuilderPage || '1', 10) + 1;
    renderEnrollmentFormBuilderSection();
}

function resetEnrollmentFormBuilderDefault() {
    state.ui.enrollmentFormBuilderDraft = hardenEnrollmentFormFields(DEFAULT_ENROLLMENT_FORM_FIELDS.map(cloneEnrollmentField));
    state.ui.enrollmentFormBuilderPage = 1;
    renderEnrollmentFormBuilderSection();
    showToast('Formulario por defecto cargado en editor', 'info');
}

function persistEnrollmentFormBuilder() {
    saveEnrollmentFormBuilderDraft();
    showToast('Formulario de matrículas actualizado', 'success');
}

/* ── Gestión de horarios de estudiantes ───────────────────────── */

const ENROLLMENT_SCHEDULE_PAGE_SIZE = 8;
const ADMIN_SCHEDULE_MODAL_PAGE_SIZE = 5;

let adminScheduleModalState = {
    studentId: null,
    currentPage: 1,
    pageSize: ADMIN_SCHEDULE_MODAL_PAGE_SIZE
};

function getAllStudentsForSchedule() {
    return asArray(state.students);
}

function getEnrollmentStudentSearch() {
    return String((document.getElementById('enrollmentScheduleSearch') || {}).value || '').trim().toLowerCase();
}

function getEnrollmentStudentLevelFilter() {
    return String((document.getElementById('enrollmentScheduleLevelFilter') || {}).value || 'all');
}

function setEnrollmentScheduleSearch(value) {
    renderEnrollmentScheduleSection();
}

function setEnrollmentScheduleLevelFilter(value) {
    renderEnrollmentScheduleSection();
}

async function openStudentScheduleModal(studentId) {
    const sid = parseInt(studentId, 10);
    if (!sid) return showToast('Estudiante no válido', 'error');
    const student = asArray(state.students).find(s => String(s.id) === String(sid));
    if (!student) return showToast('Estudiante no encontrado', 'error');

    const enrollments = await api('/api/enrollments/student/' + sid).catch(() => []);
    const schedules = await api('/api/schedules/student/' + sid).catch(() => []);
    const allCourses = asArray(state.courses);

    const enrolledCourseIds = new Set(asArray(enrollments).map(e => String(e.courseId || (e.course && e.course.id) || '')));

    // Filtrar cursos por grado del estudiante
    const studentGradeId = String((state.studentGrades || {})[String(sid)] || '');
    const gradeName = studentGradeId ? getGradeNameById(studentGradeId) : '';
    const availableCourses = allCourses.filter(c => {
        const cid = String(c.id || '');
        if (enrolledCourseIds.has(cid)) return false;
        if (!studentGradeId) return true; // Si no tiene grado asignado, mostrar todos
        const courseGradeId = String((state.courseGrades || {})[cid] || '');
        return !courseGradeId || courseGradeId === studentGradeId;
    });

    // Obtener schedules de cursos disponibles para mostrar opciones
    const courseSchedulesMap = {};
    await Promise.all(availableCourses.map(async c => {
        const sch = await api('/api/schedules/course/' + c.id).catch(() => []);
        courseSchedulesMap[c.id] = Array.isArray(sch) ? sch : [];
    }));

    // Paginado de matriculaciones actuales
    if (adminScheduleModalState.studentId !== sid) {
        adminScheduleModalState.studentId = sid;
        adminScheduleModalState.currentPage = 1;
    }
    const pageSize = adminScheduleModalState.pageSize;
    const allScheduleRows = asArray(schedules).map(sch => {
        const courseName = sch.course ? sch.course.name : (allCourses.find(c => String(c.id) === String((sch.course || {}).id || sch.courseId)) || {}).name || 'Curso';
        return {
            html: `<tr>
                <td>${escapeHtml(courseName)}</td>
                <td>${escapeHtml(sch.day || '-')}</td>
                <td>${escapeHtml(String(sch.startTime || '').slice(0, 5))} - ${escapeHtml(String(sch.endTime || '').slice(0, 5))}</td>
                <td style="white-space:nowrap">
                    <button class="btn btn-sm btn-outline" onclick="adminRemoveStudentEnrollment(${sid}, ${sch.course ? sch.course.id : sch.courseId || 0})">Retirar</button>
                    <button class="btn btn-sm btn-outline" onclick="adminChangeStudentCourse(${sid}, ${sch.course ? sch.course.id : sch.courseId || 0})">Cambiar</button>
                </td>
            </tr>`,
            sortKey: String(courseName)
        };
    });
    const totalPages = Math.max(1, Math.ceil(allScheduleRows.length / pageSize));
    const safePage = Math.max(1, Math.min(totalPages, adminScheduleModalState.currentPage));
    adminScheduleModalState.currentPage = safePage;
    const startIdx = (safePage - 1) * pageSize;
    const pagedRows = allScheduleRows.slice(startIdx, startIdx + pageSize);
    const scheduleRows = pagedRows.map(r => r.html).join('');
    const pagerControls = allScheduleRows.length > pageSize
        ? `<div class="pager" style="margin-top:8px">
            <button class="btn btn-sm btn-outline" ${safePage <= 1 ? 'disabled' : ''} onclick="adminScheduleModalPrevPage(${sid})">Anterior</button>
            <span>${safePage}/${totalPages}</span>
            <button class="btn btn-sm btn-outline" ${safePage >= totalPages ? 'disabled' : ''} onclick="adminScheduleModalNextPage(${sid})">Siguiente</button>
        </div>`
        : '';

    const courseOptions = availableCourses.map(c => `<option value="${c.id}">${escapeHtml(c.name)} (${escapeHtml(c.courseCode || 'Sin código')})</option>`).join('');

    openModal(`Horario de ${escapeHtml(userNameFrom(student))}${gradeName ? ' — ' + escapeHtml(gradeName) : ''}`, `
        <div style="margin-bottom:14px">
            <div style="font-weight:700;font-size:13px;margin-bottom:8px;color:var(--gold)">Matriculaciones actuales</div>
            ${scheduleRows ? `<table class="simple-table"><thead><tr><th>Curso</th><th>Día</th><th>Hora</th><th>Acción</th></tr></thead><tbody>${scheduleRows}</tbody></table>${pagerControls}` : '<div class="muted">Sin matriculaciones.</div>'}
        </div>
        <div style="border-top:1px solid var(--border);padding-top:14px">
            <div style="font-weight:700;font-size:13px;margin-bottom:10px;color:var(--gold)">Agregar curso</div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Curso</label>
                    <select class="form-input" id="adminAddCourseSelect" onchange="adminRenderScheduleOptionsForCourse(this.value, ${sid})">${courseOptions || '<option value="">Sin cursos disponibles</option>'}</select>
                </div>
                <div class="form-group" id="adminScheduleSelectGroup" style="display:none">
                    <label class="form-label">Horario</label>
                    <select class="form-input" id="adminAddScheduleSelect"></select>
                </div>
            </div>
            <div id="adminScheduleConflictMsg" class="alert alert-error" style="display:none;margin-top:10px"></div>
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px">
                <button class="btn btn-outline" onclick="closeModal()">Cerrar</button>
                <button class="btn btn-teal" id="adminAddEnrollmentBtn" onclick="adminAddStudentEnrollment(${sid})" ${!courseOptions ? 'disabled' : ''}>Agregar matrícula</button>
            </div>
        </div>
    `);

    // Pre-renderizar schedules para el primer curso disponible
    if (availableCourses.length) {
        adminRenderScheduleOptionsForCourse(availableCourses[0].id, sid);
    }
}

function adminScheduleModalPrevPage(studentId) {
    adminScheduleModalState.currentPage = Math.max(1, parseInt(adminScheduleModalState.currentPage || '1', 10) - 1);
    openStudentScheduleModal(studentId);
}

function adminScheduleModalNextPage(studentId) {
    adminScheduleModalState.currentPage = parseInt(adminScheduleModalState.currentPage || '1', 10) + 1;
    openStudentScheduleModal(studentId);
}

function adminSchColor(index) {
    const PALETTE = [
        { bg: 'rgba(74,111,165,0.12)', border: '#4A6FA5', text: '#2E4A6E' },
        { bg: 'rgba(42,157,143,0.12)', border: '#2A9D8F', text: '#1D6B62' },
        { bg: 'rgba(233,196,106,0.18)', border: '#C8962E', text: '#7A5A1D' },
        { bg: 'rgba(155,89,182,0.12)', border: '#9B59B6', text: '#5B2577' },
        { bg: 'rgba(39,174,96,0.12)', border: '#27AE60', text: '#1A6B3C' },
        { bg: 'rgba(231,76,60,0.10)', border: '#E74C3C', text: '#7B1D13' },
        { bg: 'rgba(52,152,219,0.12)', border: '#3498DB', text: '#1A5276' },
        { bg: 'rgba(243,156,18,0.12)', border: '#F39C12', text: '#7A4B00' }
    ];
    return PALETTE[(index || 0) % PALETTE.length];
}

function adminRenderScheduleCalendar(schedules, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const DAY_ORDER = ['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'];
    const DAY_SHORT = {Lunes:'Lun',Martes:'Mar',Miercoles:'Mié',Jueves:'Jue',Viernes:'Vie',Sabado:'Sáb'};
    function toMin(t) { if(!t)return 0; const[h,m]=t.split(':').map(Number); return h*60+(m||0); }

    const hasSchedules = schedules && schedules.length > 0;
    const allMins = hasSchedules ? schedules.flatMap(s => [toMin(s.startTime),toMin(s.endTime)]) : [];
    const startHour = hasSchedules ? Math.min(6, Math.floor(Math.min(...allMins)/60)) : 7;
    const endHour = hasSchedules ? Math.max(20, Math.ceil(Math.max(...allMins)/60)) : 19;
    const minTime = startHour*60, maxTime = endHour*60, PX = 2.4, totalH = (maxTime-minTime)*PX;

    const courseIds = [...new Set(schedules.map(s=>s.course&&s.course.id).filter(Boolean))];
    const colorMap = {}; courseIds.forEach((id,i) => colorMap[id]=adminSchColor(i));

    let guideHtml='', timeLabelsHtml='';
    for (let h=startHour;h<=endHour;h++) {
        const top=(h*60-minTime)*PX;
        guideHtml+=`<div class="wcal-guide" style="top:${top}px"></div>`;
        timeLabelsHtml+=`<div class="wcal-time-label" style="top:${top}px">${String(h).padStart(2,'0')}:00</div>`;
    }
    for (let h=startHour;h<=endHour;h++) {
        const top=((h*60+30)-minTime)*PX;
        if (top < totalH) guideHtml+=`<div class="wcal-guide" style="top:${top}px;opacity:0.5"></div>`;
    }

    let colsHtml='';
    DAY_ORDER.forEach(day => {
        const daySch=schedules.filter(s=>s.day===day); let blocksHtml='';
        daySch.forEach(s => {
            const sMin=(toMin(s.startTime)-minTime)*PX;
            const height=Math.max((toMin(s.endTime)-toMin(s.startTime))*PX-2,22);
            const c=colorMap[s.course&&s.course.id]||adminSchColor(0);
            const name=s.course?s.course.name:'\u2014';
            const code=s.courseCode || s.code || '';
            blocksHtml+=`<div class="wcal-block" style="top:${sMin}px;height:${height}px;background:${c.bg};border-left:3px solid ${c.border};" title="${escapeHtml(name)}${code?' \u00b7 '+escapeHtml(code):''}\n${s.startTime} \u2013 ${s.endTime}">
                <span class="wcal-block-name" style="color:${c.text}">${escapeHtml(name)}</span>
                <span class="wcal-block-time">${s.startTime} \u2013 ${s.endTime}</span>
                ${code?`<span class="wcal-block-teacher">${escapeHtml(code)}</span>`:''}
            </div>`;
        });
        colsHtml+=`<div class="wcal-day-col"><div class="wcal-day-header"><span class="wcal-day-full">${day}</span><span class="wcal-day-short">${DAY_SHORT[day]||day}</span></div><div class="wcal-day-body" style="height:${totalH}px">${guideHtml}${blocksHtml}</div></div>`;
    });

    container.innerHTML = `<div class="wcal-root"><div class="wcal-time-col" style="width:56px"><div class="wcal-corner" style="height:48px"></div><div class="wcal-time-track" style="height:${totalH}px">${timeLabelsHtml}</div></div><div class="wcal-grid">${colsHtml}</div></div>`;
}

function adminCheckScheduleConflict(newSch, existingSchedules) {
    if (!newSch || !newSch.day || !newSch.startTime || !newSch.endTime) return null;
    const toMin = (t) => { if(!t)return 0; const[h,m]=t.split(':').map(Number); return h*60+(m||0); };
    const newStart = toMin(newSch.startTime);
    const newEnd = toMin(newSch.endTime);
    for (const ex of existingSchedules) {
        if (ex.day !== newSch.day) continue;
        const exStart = toMin(ex.startTime);
        const exEnd = toMin(ex.endTime);
        if (newStart < exEnd && newEnd > exStart) {
            return ex;
        }
    }
    return null;
}

async function adminRenderScheduleOptionsForCourse(courseId, studentId) {
    const scheduleGroup = document.getElementById('adminScheduleSelectGroup');
    const scheduleSelect = document.getElementById('adminAddScheduleSelect');
    const conflictMsg = document.getElementById('adminScheduleConflictMsg');
    const addBtn = document.getElementById('adminAddEnrollmentBtn');
    if (!scheduleGroup || !scheduleSelect) return;

    const cid = parseInt(courseId, 10);
    if (!cid) {
        scheduleGroup.style.display = 'none';
        if (addBtn) addBtn.disabled = true;
        return;
    }

    // Cargar horarios actuales del estudiante para detectar conflictos
    const currentSchedules = await api('/api/schedules/student/' + studentId).catch(() => []);

    api('/api/schedules/course/' + cid).then(sch => {
        const schedules = Array.isArray(sch) ? sch : [];
        if (!schedules.length) {
            scheduleGroup.style.display = 'none';
            scheduleSelect.innerHTML = '<option value="">Sin horarios</option>';
            if (addBtn) addBtn.disabled = true;
            return;
        }

        let allConflict = true;
        scheduleSelect.innerHTML = schedules.map((s, idx) => {
            const conflict = adminCheckScheduleConflict(s, asArray(currentSchedules));
            if (!conflict) allConflict = false;
            const time = `${escapeHtml(String(s.startTime || '').slice(0, 5))} - ${escapeHtml(String(s.endTime || '').slice(0, 5))}`;
            const conflictLabel = conflict ? ' (CONFlicto)' : '';
            return `<option value="${s.id}" data-conflict="${conflict ? '1' : '0'}">${escapeHtml(s.day || '-')} \u00b7 ${time}${conflictLabel}</option>`;
        }).join('');

        if (schedules.length > 1) {
            scheduleGroup.style.display = '';
        } else {
            scheduleGroup.style.display = 'none';
        }

        // Seleccionar automáticamente el primer horario sin conflicto
        const firstNonConflict = schedules.findIndex(s => !adminCheckScheduleConflict(s, asArray(currentSchedules)));
        if (firstNonConflict >= 0) {
            scheduleSelect.selectedIndex = firstNonConflict;
        }

        // Mostrar mensaje de conflicto si todos los horarios chocan
        if (allConflict) {
            if (conflictMsg) {
                conflictMsg.style.display = '';
                conflictMsg.textContent = 'Todos los horarios de este curso se cruzan con los actuales del estudiante. Selecciona otro curso.';
            }
            if (addBtn) addBtn.disabled = true;
        } else {
            if (conflictMsg) conflictMsg.style.display = 'none';
            if (addBtn) addBtn.disabled = false;
        }

        // Validar conflicto al cambiar la selección manualmente
        scheduleSelect.onchange = function() {
            const selectedOpt = scheduleSelect.options[scheduleSelect.selectedIndex];
            const hasConflict = selectedOpt && selectedOpt.dataset.conflict === '1';
            if (hasConflict) {
                if (conflictMsg) {
                    conflictMsg.style.display = '';
                    conflictMsg.textContent = 'El horario seleccionado se cruza con una clase actual del estudiante.';
                }
                if (addBtn) addBtn.disabled = true;
            } else {
                if (conflictMsg) conflictMsg.style.display = 'none';
                if (addBtn) addBtn.disabled = false;
            }
        };
    }).catch(() => {
        scheduleGroup.style.display = 'none';
        if (addBtn) addBtn.disabled = true;
    });
}

async function adminChangeStudentCourse(studentId, oldCourseId) {
    const sid = parseInt(studentId, 10);
    const oldCid = parseInt(oldCourseId, 10);
    if (!sid || !oldCid) return showToast('Datos incompletos', 'error');

    const student = asArray(state.students).find(s => String(s.id) === String(sid));
    if (!student) return showToast('Estudiante no encontrado', 'error');

    const allCourses = asArray(state.courses);
    const enrollments = await api('/api/enrollments/student/' + sid).catch(() => []);
    const enrolledCourseIds = new Set(asArray(enrollments).map(e => String(e.courseId || (e.course && e.course.id) || '')));

    const studentGradeId = String((state.studentGrades || {})[String(sid)] || '');
    const availableCourses = allCourses.filter(c => {
        const cid = String(c.id || '');
        if (enrolledCourseIds.has(cid)) return false;
        if (cid === String(oldCid)) return false;
        if (!studentGradeId) return true;
        const courseGradeId = String((state.courseGrades || {})[cid] || '');
        return !courseGradeId || courseGradeId === studentGradeId;
    });

    const courseOptions = availableCourses.map(c => `<option value="${c.id}">${escapeHtml(c.name)} (${escapeHtml(c.courseCode || 'Sin código')})</option>`).join('');

    openModal(`Cambiar curso de ${escapeHtml(userNameFrom(student))}`, `
        <div style="margin-bottom:14px">
            <div class="alert alert-info">Se retirará al estudiante del curso actual y se matriculará en el nuevo curso seleccionado.</div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Nuevo curso</label>
                    <select class="form-input" id="adminChangeCourseSelect">${courseOptions || '<option value="">Sin cursos disponibles</option>'}</select>
                </div>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px">
                <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
                <button class="btn btn-teal" onclick="adminDoChangeCourse(${sid}, ${oldCid})" ${!courseOptions ? 'disabled' : ''}>Confirmar cambio</button>
            </div>
        </div>
    `);
}

async function adminDoChangeCourse(studentId, oldCourseId) {
    const select = document.getElementById('adminChangeCourseSelect');
    if (!select || !select.value) return showToast('Selecciona un curso', 'error');
    const newCourseId = parseInt(select.value, 10);
    try {
        // 1. Eliminar matrícula anterior
        const enrollments = await api('/api/enrollments/student/' + studentId).catch(() => []);
        const target = asArray(enrollments).find(e => String(e.courseId || (e.course && e.course.id)) === String(oldCourseId));
        if (target && target.id) {
            await api('/api/enrollments/' + target.id, { method: 'DELETE', headers: headers() });
        }
        // 2. Crear nueva matrícula
        await api('/api/enrollments', {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({
                studentId: parseInt(studentId, 10),
                courseId: newCourseId,
                enrollmentDate: new Date().toISOString()
            })
        });
        showToast('Curso cambiado correctamente', 'success');
        await openStudentScheduleModal(studentId);
        renderEnrollmentScheduleSection();
    } catch (e) {
        showToast('Error al cambiar curso: ' + (e.message || ''), 'error');
    }
}

async function adminRemoveStudentEnrollment(studentId, courseId) {
    if (!studentId || !courseId) return showToast('Datos incompletos', 'error');
    try {
        const enrollments = await api('/api/enrollments/student/' + studentId).catch(() => []);
        const target = asArray(enrollments).find(e => String(e.courseId || (e.course && e.course.id)) === String(courseId));
        if (target && target.id) {
            await api('/api/enrollments/' + target.id, { method: 'DELETE', headers: headers() });
            showToast('Matrícula eliminada', 'success');
        }
        await openStudentScheduleModal(studentId);
        renderEnrollmentScheduleSection();
    } catch (e) {
        showToast('Error al eliminar matrícula: ' + (e.message || ''), 'error');
    }
}

async function adminAddStudentEnrollment(studentId) {
    const select = document.getElementById('adminAddCourseSelect');
    if (!select || !select.value) return showToast('Selecciona un curso', 'error');
    try {
        await api('/api/enrollments', {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({
                studentId: parseInt(studentId, 10),
                courseId: parseInt(select.value, 10),
                enrollmentDate: new Date().toISOString()
            })
        });
        showToast('Matrícula agregada', 'success');
        await openStudentScheduleModal(studentId);
        renderEnrollmentScheduleSection();
    } catch (e) {
        showToast('Error al agregar matrícula: ' + (e.message || ''), 'error');
    }
}

async function adminResetStudentSchedule(studentId) {
    const sid = parseInt(studentId, 10);
    if (!sid) return;
    openConfirmModal('Reiniciar horario', '¿Eliminar todas las matriculaciones de este estudiante? Podrá volver a escoger horario desde su portal.', async () => {
        try {
            const enrollments = await api('/api/enrollments/student/' + sid).catch(() => []);
            for (const enr of asArray(enrollments)) {
                if (enr.id) {
                    await api('/api/enrollments/' + enr.id, { method: 'DELETE', headers: headers() }).catch(() => {});
                }
            }
            showToast('Horario reiniciado correctamente', 'success');
            renderEnrollmentScheduleSection();
        } catch (e) {
            showToast('Error al reiniciar horario', 'error');
        }
    }, 'Reiniciar');
}

function renderEnrollmentScheduleSection() {
    const tableEl = document.getElementById('enrollmentScheduleTable');
    const pagerEl = document.getElementById('enrollmentSchedulePager');
    if (!tableEl) return;

    const allStudents = getAllStudentsForSchedule();
    const query = getEnrollmentStudentSearch();
    const levelFilter = getEnrollmentStudentLevelFilter();

    const levelOptions = Array.from(new Set(allStudents.map(s => {
        const sid = String(s.id || '');
        const levelId = String((state.studentLevels || {})[sid] || '');
        return levelId ? getLevelNameById(levelId) : '';
    }).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

    fillSelect('enrollmentScheduleLevelFilter', levelOptions.map(v => ({ id: v, name: v })), l => `<option value="${escapeHtml(l.id)}">${escapeHtml(l.name)}</option>`, 'Todos los niveles');
    const levelEl = document.getElementById('enrollmentScheduleLevelFilter');
    if (levelEl) levelEl.value = levelFilter === 'all' ? '' : levelFilter;

    const filtered = allStudents.filter(s => {
        const sid = String(s.id || '');
        const name = userNameFrom(s);
        const code = String(s.studentCode || '');
        const searchOk = !query || `${name} ${code}`.toLowerCase().includes(query);
        const levelId = String((state.studentLevels || {})[sid] || '');
        const levelName = levelId ? getLevelNameById(levelId) : '';
        const levelOk = levelFilter === 'all' || levelName === levelFilter;
        return searchOk && levelOk;
    });

    const paged = paginateItems(filtered, state.ui.enrollmentSchedulePage, ENROLLMENT_SCHEDULE_PAGE_SIZE);
    state.ui.enrollmentSchedulePage = paged.page;

    tableEl.innerHTML = paged.items.length
        ? `<table class="simple-table"><thead><tr>
            <th>Estudiante</th>
            <th>Código</th>
            <th>Nivel/Grado</th>
            <th>Matriculaciones</th>
            <th>Acciones</th>
        </tr></thead><tbody>${paged.items.map(s => {
            const sid = String(s.id || '');
            const name = userNameFrom(s);
            const code = String(s.studentCode || 'Sin código');
            const levelId = String((state.studentLevels || {})[sid] || '');
            const gradeId = String((state.studentGrades || {})[sid] || '');
            const level = levelId ? getLevelNameById(levelId) : 'Sin nivel';
            const grade = gradeId ? getGradeNameById(gradeId) : 'Sin grado';
            const enrCount = asArray(state.enrollments).filter(e => String(e.studentId || ((e.student || {}).id)) === sid).length;
            return `<tr>
                <td>${escapeHtml(name)}</td>
                <td>${escapeHtml(code)}</td>
                <td>${escapeHtml(level)} · ${escapeHtml(grade)}</td>
                <td>${enrCount} curso(s)</td>
                <td style="white-space:nowrap">
                    <button class="btn btn-sm btn-outline" onclick="openStudentScheduleModal(${sid})">Ver horario</button>
                    <button class="btn btn-sm btn-outline" onclick="adminResetStudentSchedule(${sid})">Reiniciar</button>
                </td>
            </tr>`;
        }).join('')}</tbody></table>`
        : '<div class="muted" style="padding:10px">No hay estudiantes registrados.</div>';

    if (pagerEl) {
        pagerEl.innerHTML = `
            <button class="btn btn-sm btn-outline" ${paged.page <= 1 ? 'disabled' : ''} onclick="enrollmentSchedulePrevPage()">Anterior</button>
            <span>${paged.page}/${paged.totalPages}</span>
            <button class="btn btn-sm btn-outline" ${paged.page >= paged.totalPages ? 'disabled' : ''} onclick="enrollmentScheduleNextPage()">Siguiente</button>
        `;
    }
}

function enrollmentSchedulePrevPage() {
    state.ui.enrollmentSchedulePage = Math.max(1, parseInt(state.ui.enrollmentSchedulePage || '1', 10) - 1);
    renderEnrollmentScheduleSection();
}

function enrollmentScheduleNextPage() {
    state.ui.enrollmentSchedulePage = parseInt(state.ui.enrollmentSchedulePage || '1', 10) + 1;
    renderEnrollmentScheduleSection();
}

function renderEnrollmentFormBuilderSection() {
    const listEl = document.getElementById('enrollmentFormBuilderList');
    if (!listEl) return;
    const pagerEl = document.getElementById('enrollmentFormBuilderPager');
    const summaryEl = document.getElementById('enrollmentFormBuilderSummary');
    const previewEl = document.getElementById('enrollmentFormBuilderPreview');
    const draft = getEnrollmentFormConfigDraft();
    const paged = paginateItems(draft, state.ui.enrollmentFormBuilderPage, state.ui.enrollmentFormBuilderPageSize || 6);
    state.ui.enrollmentFormBuilderPage = paged.page;
    const pageSize = state.ui.enrollmentFormBuilderPageSize || 6;
    const offset = (paged.page - 1) * pageSize;

    const typeOptions = ['text', 'textarea', 'email', 'tel', 'date', 'select', 'file', 'url'];
    listEl.innerHTML = paged.items.length
        ? paged.items.map((item, relativeIdx) => {
            const absoluteIndex = offset + relativeIdx;
            const isSelect = String(item.type) === 'select';
            const isImmutable = !!item.immutable;
            const disabledAttr = isImmutable ? 'disabled' : '';
            const sectionInput = isImmutable
                ? `<input class="form-input" value="${escapeHtml(item.section)}" disabled title="Campo del sistema">`
                : `<input class="form-input" value="${escapeHtml(item.section)}" oninput="updateEnrollmentFormField('${absoluteIndex}','section',this.value,false)">`;
            const typeInput = isImmutable
                ? `<select class="form-input" disabled title="Campo del sistema">${typeOptions.map(t => `<option value="${t}" ${String(item.type) === t ? 'selected' : ''}>${t}</option>`).join('')}</select>`
                : `<select class="form-input" onchange="updateEnrollmentFormField('${absoluteIndex}','type',this.value)">${typeOptions.map(t => `<option value="${t}" ${String(item.type) === t ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
            const labelInput = isImmutable
                ? `<input class="form-input" value="${escapeHtml(item.label)}" disabled title="Campo del sistema">`
                : `<input class="form-input" value="${escapeHtml(item.label)}" oninput="updateEnrollmentFormField('${absoluteIndex}','label',this.value,false)">`;
            const placeholderInput = isImmutable
                ? `<input class="form-input" value="${escapeHtml(item.placeholder)}" disabled title="Campo del sistema">`
                : `<input class="form-input" value="${escapeHtml(item.placeholder)}" oninput="updateEnrollmentFormField('${absoluteIndex}','placeholder',this.value,false)">`;
            const optionsInput = isSelect && !isImmutable
                ? `<div class="form-group" style="margin-bottom:6px"><label class="form-label">Opciones (coma)</label><input class="form-input" value="${escapeHtml(asArray(item.options).join(', '))}" oninput="updateEnrollmentFormField('${absoluteIndex}','options',this.value,false)"></div>`
                : (isSelect ? `<div class="form-group" style="margin-bottom:6px"><label class="form-label">Opciones (coma)</label><input class="form-input" value="${escapeHtml(asArray(item.options).join(', '))}" disabled title="Campo del sistema"></div>` : '');
            const requiredCheckbox = isImmutable
                ? `<label class="card-check" style="margin:0" title="Campo obligatorio del sistema"><input type="checkbox" checked disabled><span>Obligatorio</span></label>`
                : `<label class="card-check" style="margin:0"><input type="checkbox" ${item.required ? 'checked' : ''} onchange="updateEnrollmentFormField('${absoluteIndex}','required',this.checked,false)"><span>Obligatorio</span></label>`;
            const deleteBtn = isImmutable
                ? `<span style="font-size:12px;color:var(--text-light);padding:4px 10px;border:1px solid var(--border);border-radius:6px;background:#fafafa">Campo del sistema</span>`
                : `<button class="btn btn-sm btn-outline" type="button" onclick="deleteEnrollmentFormField('${absoluteIndex}')">Eliminar</button>`;
            return `<div class="card-check" style="display:block;padding:10px;margin-bottom:8px;${isImmutable ? 'border-left:3px solid var(--gold)' : ''}">
                <div class="form-row" style="margin-bottom:6px">
                    <div class="form-group"><label class="form-label">Sección</label>${sectionInput}</div>
                    <div class="form-group"><label class="form-label">Tipo</label>${typeInput}</div>
                </div>
                <div class="form-row" style="margin-bottom:6px">
                    <div class="form-group"><label class="form-label">Etiqueta</label>${labelInput}</div>
                    <div class="form-group"><label class="form-label">Placeholder</label>${placeholderInput}</div>
                </div>
                ${optionsInput}
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                    ${requiredCheckbox}
                    ${deleteBtn}
                </div>
            </div>`;
        }).join('')
        : '<div class="muted">Sin campos en el formulario.</div>';

    if (pagerEl) {
        pagerEl.innerHTML = `
            <button class="btn btn-sm btn-outline" ${paged.page <= 1 ? 'disabled' : ''} onclick="enrollmentFormBuilderPrevPage()">Anterior</button>
            <span>${paged.page}/${paged.totalPages}</span>
            <button class="btn btn-sm btn-outline" ${paged.page >= paged.totalPages ? 'disabled' : ''} onclick="enrollmentFormBuilderNextPage()">Siguiente</button>
        `;
    }

    if (summaryEl) {
        summaryEl.textContent = `Campos: ${draft.length} | Adjuntos: ${countEnrollmentFileFields(draft)}/${ENROLLMENT_FORM_MAX_FILE_FIELDS}`;
    }

    if (previewEl) {
        previewEl.innerHTML = `<div class="muted" style="padding:8px 0">Vista rápida: ${draft.slice(0, 8).map(f => `${f.label}${f.required ? ' *' : ''}`).join(' • ') || 'Sin campos'}</div>`;
    }
}

function getLevelNameById(levelId) {
    const level = asArray(state.academicLevels).find(l => String(l.id) === String(levelId));
    return String((level && level.name) || 'Sin nivel');
}

function getGradeNameById(gradeId) {
    const grade = asArray(state.academicGrades).find(g => String(g.id) === String(gradeId));
    return String((grade && grade.name) || 'Sin grado');
}

function getCourseNameById(courseId) {
    const course = asArray(state.courses).find(c => String(c.id) === String(courseId));
    return String((course && course.name) || 'Curso');
}

function getCertificateStudentRecords() {
    const coursesByStudent = {};
    asArray(state.enrollments).forEach(e => {
        const sid = String((e && (e.studentId || ((e.student || {}).id))) || '');
        const cid = String((e && (e.courseId || ((e.course || {}).id))) || '');
        if (!sid || !cid) return;
        if (!coursesByStudent[sid]) coursesByStudent[sid] = [];
        if (!coursesByStudent[sid].includes(cid)) coursesByStudent[sid].push(cid);
    });
    return asArray(state.students).map(s => {
        const sid = String((s && s.id) || '');
        const courseIds = asArray(coursesByStudent[sid]).map(String);
        const inferredLevel = courseIds.map(cid => String((state.courseLevels || {})[cid] || '')).find(Boolean) || '';
        const inferredGrade = courseIds.map(cid => String((state.courseGrades || {})[cid] || '')).find(Boolean) || '';
        const levelId = String((state.studentLevels || {})[sid] || inferredLevel || '');
        const gradeId = String((state.studentGrades || {})[sid] || inferredGrade || '');
        const courseNames = courseIds.map(getCourseNameById);
        const levelName = levelId ? getLevelNameById(levelId) : 'Sin nivel';
        const gradeName = gradeId ? getGradeNameById(gradeId) : 'Sin grado';
        const name = userNameFrom(s);
        const code = String(s.studentCode || '');
        return {
            id: sid,
            name,
            code,
            levelId,
            levelName,
            gradeId,
            gradeName,
            courseIds,
            courseNames,
            searchText: `${name} ${code} ${levelName} ${gradeName} ${courseNames.join(' ')}`.toLowerCase()
        };
    });
}

function setCertFilterLevel(levelId) {
    state.ui.certFilterLevel = String(levelId || '');
    state.ui.certGradePage = 1;
    state.ui.certCoursePage = 1;
    state.ui.certFilterCourse = '';
    state.ui.certFilterCourses = [];
    state.ui.certFilterGrade = '';
    state.ui.certFilterGrades = [];
    state.ui.certStudentsPage = 1;
    renderCertificatesSection();
}

function setCertFilterGrade(gradeId) {
    const gid = String(gradeId || '');
    if (!gid) {
        state.ui.certFilterGrade = '';
        state.ui.certFilterGrades = [];
        state.ui.certCoursePage = 1;
        state.ui.certFilterCourse = '';
        state.ui.certFilterCourses = [];
        state.ui.certStudentsPage = 1;
        renderCertificatesSection();
        return;
    }
    const selected = new Set(asArray(state.ui.certFilterGrades).map(String));
    if (selected.has(gid)) selected.delete(gid);
    else selected.add(gid);
    state.ui.certFilterGrades = Array.from(selected);
    state.ui.certFilterGrade = state.ui.certFilterGrades.length ? state.ui.certFilterGrades[0] : '';
    state.ui.certCoursePage = 1;
    state.ui.certFilterCourse = '';
    state.ui.certFilterCourses = [];
    state.ui.certStudentsPage = 1;
    renderCertificatesSection();
}

function toggleCertFilterGrade(gradeId, checked) {
    const gid = String(gradeId || '');
    if (!gid) return;
    const selected = new Set(asArray(state.ui.certFilterGrades).map(String));
    const shouldCheck = typeof checked === 'boolean' ? checked : !selected.has(gid);
    if (shouldCheck) selected.add(gid);
    else selected.delete(gid);
    state.ui.certFilterGrades = Array.from(selected);
    state.ui.certFilterGrade = state.ui.certFilterGrades.length ? state.ui.certFilterGrades[0] : '';
    state.ui.certCoursePage = 1;
    state.ui.certFilterCourse = '';
    state.ui.certFilterCourses = [];
    state.ui.certStudentsPage = 1;
    renderCertificatesSection();
}

function clearCertFilterGrades() {
    state.ui.certFilterGrade = '';
    state.ui.certFilterGrades = [];
    state.ui.certCoursePage = 1;
    state.ui.certFilterCourse = '';
    state.ui.certFilterCourses = [];
    state.ui.certStudentsPage = 1;
    renderCertificatesSection();
}

function setCertFilterCourse(courseId) {
    const cid = String(courseId || '');
    if (!cid) {
        state.ui.certFilterCourse = '';
        state.ui.certFilterCourses = [];
        state.ui.certStudentsPage = 1;
        renderCertificatesSection();
        return;
    }
    const selected = new Set(asArray(state.ui.certFilterCourses).map(String));
    if (selected.has(cid)) selected.delete(cid);
    else selected.add(cid);
    state.ui.certFilterCourses = Array.from(selected);
    state.ui.certFilterCourse = state.ui.certFilterCourses.length ? state.ui.certFilterCourses[0] : '';
    state.ui.certStudentsPage = 1;
    renderCertificatesSection();
}

function toggleCertFilterCourse(courseId, checked) {
    const cid = String(courseId || '');
    if (!cid) return;
    const selected = new Set(asArray(state.ui.certFilterCourses).map(String));
    const shouldCheck = typeof checked === 'boolean' ? checked : !selected.has(cid);
    if (shouldCheck) selected.add(cid);
    else selected.delete(cid);
    state.ui.certFilterCourses = Array.from(selected);
    state.ui.certFilterCourse = state.ui.certFilterCourses.length ? state.ui.certFilterCourses[0] : '';
    state.ui.certStudentsPage = 1;
    renderCertificatesSection();
}

function clearCertFilterCourses() {
    state.ui.certFilterCourse = '';
    state.ui.certFilterCourses = [];
    state.ui.certStudentsPage = 1;
    renderCertificatesSection();
}

function setCertGradeQuery(query) {
    state.ui.certGradeQuery = String(query || '');
    state.ui.certGradePage = 1;
    renderCertificatesSection();
}

function setCertCourseQuery(query) {
    state.ui.certCourseQuery = String(query || '');
    state.ui.certCoursePage = 1;
    renderCertificatesSection();
}

function certGradePrevPage() {
    state.ui.certGradePage = Math.max(1, parseInt(state.ui.certGradePage || '1', 10) - 1);
    renderCertificatesSection();
}

function certGradeNextPage() {
    state.ui.certGradePage = parseInt(state.ui.certGradePage || '1', 10) + 1;
    renderCertificatesSection();
}

function certCoursePrevPage() {
    state.ui.certCoursePage = Math.max(1, parseInt(state.ui.certCoursePage || '1', 10) - 1);
    renderCertificatesSection();
}

function certCourseNextPage() {
    state.ui.certCoursePage = parseInt(state.ui.certCoursePage || '1', 10) + 1;
    renderCertificatesSection();
}

function setCertStudentQuery(query) {
    state.ui.certStudentQuery = String(query || '');
    state.ui.certStudentsPage = 1;
    renderCertificatesSection();
}

function toggleCertStudentSelection(studentId, checked) {
    const sid = String(studentId || '');
    const selected = new Set(asArray(state.ui.certSelectedStudentIds).map(String));
    if (checked) selected.add(sid);
    else selected.delete(sid);
    state.ui.certSelectedStudentIds = Array.from(selected);
    renderCertificatesSection();
}

function selectAllFilteredCertStudents() {
    const selected = new Set(asArray(state.ui.certSelectedStudentIds).map(String));
    asArray(state.ui.certFilteredStudentIds).forEach(id => selected.add(String(id)));
    state.ui.certSelectedStudentIds = Array.from(selected);
    renderCertificatesSection();
}

function selectCurrentPageCertStudents() {
    const selected = new Set(asArray(state.ui.certSelectedStudentIds).map(String));
    asArray(state.ui.certCurrentPageStudentIds).forEach(id => selected.add(String(id)));
    state.ui.certSelectedStudentIds = Array.from(selected);
    renderCertificatesSection();
}

function clearCertStudentSelection() {
    state.ui.certSelectedStudentIds = [];
    renderCertificatesSection();
}

function certStudentsPrevPage() {
    state.ui.certStudentsPage = Math.max(1, parseInt(state.ui.certStudentsPage || '1', 10) - 1);
    renderCertificatesSection();
}

function certStudentsNextPage() {
    state.ui.certStudentsPage = parseInt(state.ui.certStudentsPage || '1', 10) + 1;
    renderCertificatesSection();
}

function setCertTableSearch(value) {
    state.ui.certTableSearch = String(value || '');
    state.ui.certTablePage = 1;
    renderCertificatesSection();
}

function certTablePrevPage() {
    state.ui.certTablePage = Math.max(1, parseInt(state.ui.certTablePage || '1', 10) - 1);
    renderCertificatesSection();
}

function certTableNextPage() {
    state.ui.certTablePage = parseInt(state.ui.certTablePage || '1', 10) + 1;
    renderCertificatesSection();
}

function renderCertificatesSection() {
    const levelEl = document.getElementById('certFilterLevel');
    const gradeQueryEl = document.getElementById('certGradeQuery');
    const gradeCardsEl = document.getElementById('certFilterGradeCards');
    const gradePagerEl = document.getElementById('certFilterGradePager');
    const courseQueryEl = document.getElementById('certCourseQuery');
    const courseCardsEl = document.getElementById('certFilterCourseCards');
    const coursePagerEl = document.getElementById('certFilterCoursePager');
    const queryEl = document.getElementById('certStudentQuery');
    const pickerEl = document.getElementById('certStudentPicker');
    const pickerPagerEl = document.getElementById('certStudentPickerPager');
    const summaryEl = document.getElementById('certSelectionSummary');
    const host = document.getElementById('certificatesTable');
    if (!host) return;

    fillSelect('certFilterLevel', asArray(state.academicLevels), l => `<option value="${l.id}">${escapeHtml(l.name || 'Nivel')}</option>`, 'Todos los niveles');
    if (levelEl) levelEl.value = String(state.ui.certFilterLevel || '');

    const gradeBaseOptions = state.ui.certFilterLevel
        ? getGradesByLevel(state.ui.certFilterLevel)
        : asArray(state.academicGrades);
    const certGradeQuery = String(state.ui.certGradeQuery || '').trim().toLowerCase();
    const gradeOptions = asArray(gradeBaseOptions)
        .slice()
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es', { sensitivity: 'base' }))
        .filter(g => !certGradeQuery || String(g.name || '').toLowerCase().includes(certGradeQuery));
    const validGradeIds = new Set(asArray(gradeBaseOptions).map(g => String(g.id)));
    const selectedGradeIds = new Set(
        asArray(state.ui.certFilterGrades)
            .map(String)
            .filter(gid => validGradeIds.has(gid))
    );
    state.ui.certFilterGrades = Array.from(selectedGradeIds);
    state.ui.certFilterGrade = state.ui.certFilterGrades.length ? state.ui.certFilterGrades[0] : '';
    const gradePaged = paginateItems(gradeOptions, state.ui.certGradePage, state.ui.certFilterCardsPageSize || 8);
    state.ui.certGradePage = gradePaged.page;
    if (gradeQueryEl) gradeQueryEl.value = String(state.ui.certGradeQuery || '');
    if (gradeCardsEl) {
        const gradeCards = gradePaged.items.map(g => {
            const gid = String(g.id || '');
            const selected = selectedGradeIds.has(gid);
            return `<label class="cert-filter-card ${selected ? 'selected' : ''}">
                <span class="cert-filter-card-row">
                    <input type="checkbox" class="cert-filter-card-check" ${selected ? 'checked' : ''} onchange="toggleCertFilterGrade('${escapeHtml(gid)}', this.checked)">
                    <span class="cert-filter-card-title">${escapeHtml(g.name || 'Grado')}</span>
                </span>
            </label>`;
        }).join('');
        const selectedCount = selectedGradeIds.size;
        gradeCardsEl.innerHTML = `<button type="button" class="cert-filter-card ${selectedCount === 0 ? 'selected' : ''}" onclick="clearCertFilterGrades()">
                <span class="cert-filter-card-title">Todos los grados ${selectedCount ? `(limpiar ${selectedCount})` : ''}</span>
            </button>${gradeCards || '<div class="muted" style="padding:8px">No hay grados para este filtro.</div>'}`;
    }
    if (gradePagerEl) {
        gradePagerEl.innerHTML = `<div class="pager cert-picker-pager">
            <button class="btn btn-sm btn-outline" ${gradePaged.page <= 1 ? 'disabled' : ''} onclick="certGradePrevPage()">Anterior</button>
            <span>${gradePaged.page}/${gradePaged.totalPages}</span>
            <button class="btn btn-sm btn-outline" ${gradePaged.page >= gradePaged.totalPages ? 'disabled' : ''} onclick="certGradeNextPage()">Siguiente</button>
        </div>`;
    }

    const courseBaseOptions = asArray(state.courses).filter(c => {
        const cid = String(c.id || '');
        const levelOk = !state.ui.certFilterLevel || String((state.courseLevels || {})[cid] || '') === String(state.ui.certFilterLevel);
        const gradeOk = !selectedGradeIds.size || selectedGradeIds.has(String((state.courseGrades || {})[cid] || ''));
        return levelOk && gradeOk;
    });
    const certCourseQuery = String(state.ui.certCourseQuery || '').trim().toLowerCase();
    const courseOptions = asArray(courseBaseOptions)
        .slice()
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es', { sensitivity: 'base' }))
        .filter(c => {
            const teacher = c.teacher ? userNameFrom(c.teacher) : '';
            const text = `${String(c.name || '')} ${String(c.courseCode || '')} ${teacher}`.toLowerCase();
            return !certCourseQuery || text.includes(certCourseQuery);
        });
    const validCourseIds = new Set(asArray(courseBaseOptions).map(c => String(c.id)));
    const selectedCourseIds = new Set(
        asArray(state.ui.certFilterCourses)
            .map(String)
            .filter(cid => validCourseIds.has(cid))
    );
    state.ui.certFilterCourses = Array.from(selectedCourseIds);
    state.ui.certFilterCourse = state.ui.certFilterCourses.length ? state.ui.certFilterCourses[0] : '';
    const coursePaged = paginateItems(courseOptions, state.ui.certCoursePage, state.ui.certCourseCardsPageSize || 6);
    state.ui.certCoursePage = coursePaged.page;
    if (courseQueryEl) courseQueryEl.value = String(state.ui.certCourseQuery || '');
    if (courseCardsEl) {
        const courseCards = coursePaged.items.map(c => {
            const cid = String(c.id || '');
            const selected = selectedCourseIds.has(cid);
            const meta = c.courseCode ? `Código: ${c.courseCode}` : 'Sin código';
            return `<label class="cert-filter-card ${selected ? 'selected' : ''}">
                <span class="cert-filter-card-row">
                    <input type="checkbox" class="cert-filter-card-check" ${selected ? 'checked' : ''} onchange="toggleCertFilterCourse('${escapeHtml(cid)}', this.checked)">
                    <span class="cert-filter-card-title">${escapeHtml(c.name || 'Curso')}</span>
                </span>
                <span class="cert-filter-card-meta">${escapeHtml(meta)}</span>
            </label>`;
        }).join('');
        const selectedCount = selectedCourseIds.size;
        courseCardsEl.innerHTML = `<button type="button" class="cert-filter-card ${selectedCount === 0 ? 'selected' : ''}" onclick="clearCertFilterCourses()">
                <span class="cert-filter-card-title">Todos los cursos ${selectedCount ? `(limpiar ${selectedCount})` : ''}</span>
            </button>${courseCards || '<div class="muted" style="padding:8px">No hay cursos para este filtro.</div>'}`;
    }
    if (coursePagerEl) {
        coursePagerEl.innerHTML = `<div class="pager cert-picker-pager">
            <button class="btn btn-sm btn-outline" ${coursePaged.page <= 1 ? 'disabled' : ''} onclick="certCoursePrevPage()">Anterior</button>
            <span>${coursePaged.page}/${coursePaged.totalPages}</span>
            <button class="btn btn-sm btn-outline" ${coursePaged.page >= coursePaged.totalPages ? 'disabled' : ''} onclick="certCourseNextPage()">Siguiente</button>
        </div>`;
    }

    if (queryEl) queryEl.value = String(state.ui.certStudentQuery || '');

    const records = getCertificateStudentRecords();
    const query = String(state.ui.certStudentQuery || '').trim().toLowerCase();
    const selectedCourseFilter = new Set(asArray(state.ui.certFilterCourses).map(String));
    const filtered = records.filter(rec => {
        const levelOk = !state.ui.certFilterLevel || String(rec.levelId) === String(state.ui.certFilterLevel);
        const gradeOk = !selectedGradeIds.size || selectedGradeIds.has(String(rec.gradeId || ''));
        const courseOk = !selectedCourseFilter.size || asArray(rec.courseIds).some(cid => selectedCourseFilter.has(String(cid)));
        const textOk = !query || rec.searchText.includes(query);
        return levelOk && gradeOk && courseOk && textOk;
    });

    const validIds = new Set(records.map(r => String(r.id)));
    state.ui.certSelectedStudentIds = asArray(state.ui.certSelectedStudentIds).map(String).filter(id => validIds.has(id));
    state.ui.certFilteredStudentIds = filtered.map(r => String(r.id));
    const paged = paginateItems(filtered, state.ui.certStudentsPage, state.ui.certStudentsPageSize || 8);
    state.ui.certStudentsPage = paged.page;
    state.ui.certCurrentPageStudentIds = asArray(paged.items).map(r => String(r.id));
    const selectedSet = new Set(asArray(state.ui.certSelectedStudentIds).map(String));

    if (pickerEl) {
        pickerEl.innerHTML = paged.items.length
            ? paged.items.map(rec => `<label class="cert-student-item">
                <input type="checkbox" ${selectedSet.has(String(rec.id)) ? 'checked' : ''} onchange="toggleCertStudentSelection('${escapeHtml(String(rec.id))}', this.checked)">
                <div class="cert-student-main">
                    <div class="cert-student-name">${escapeHtml(rec.name)}</div>
                    <div class="cert-student-meta">${escapeHtml(rec.code || 'Sin código')} · ${escapeHtml(rec.levelName)} · ${escapeHtml(rec.gradeName)}</div>
                    <div class="cert-student-courses">${rec.courseNames.length ? rec.courseNames.slice(0, 3).map(n => `<span class='preview-chip'>${escapeHtml(n)}</span>`).join('') : '<span class="muted">Sin curso</span>'}</div>
                </div>
            </label>`).join('')
            : '<div class="muted" style="padding:10px">No hay estudiantes con ese filtro.</div>';
    }

    if (pickerPagerEl) {
        pickerPagerEl.innerHTML = `<div class="pager cert-picker-pager">
            <button class="btn btn-sm btn-outline" ${paged.page <= 1 ? 'disabled' : ''} onclick="certStudentsPrevPage()">Anterior</button>
            <span>${paged.page}/${paged.totalPages}</span>
            <button class="btn btn-sm btn-outline" ${paged.page >= paged.totalPages ? 'disabled' : ''} onclick="certStudentsNextPage()">Siguiente</button>
        </div>`;
    }

    if (summaryEl) {
        summaryEl.textContent = `Seleccionados: ${selectedSet.size} | Filtrados: ${filtered.length} | Mostrando: ${paged.items.length}`;
    }

    // ── Tabla de certificados emitidos con búsqueda y paginación ──
    const tableSearch = String(state.ui.certTableSearch || '').trim().toLowerCase();
    const tableCerts = (state.certificates || []).filter(c => {
        if (!tableSearch) return true;
        const student = (state.students || []).find(s => String(s.id) === String(c.studentId || (c.student || {}).id || ''));
        const studentName = student ? userNameFrom(student).toLowerCase() : '';
        const certName = String(c.name || '').toLowerCase();
        return studentName.includes(tableSearch) || certName.includes(tableSearch);
    });
    const tablePaged = paginateItems(tableCerts, state.ui.certTablePage, state.ui.certTablePageSize || 8);
    state.ui.certTablePage = tablePaged.page;

    const rows = tablePaged.items.map(c => {
        const student = (state.students || []).find(s => String(s.id) === String(c.studentId || (c.student || {}).id || ''));
        const dateRaw = c.createdAt || c.issuedAt || '';
        const date = dateRaw ? new Date(dateRaw).toLocaleDateString('es-CO') : '-';
        const fileLabel = c.fileName || (c.filePath ? 'Adjunto' : '-');
        return `<tr><td>${escapeHtml(student ? userNameFrom(student) : 'Sin estudiante')}</td><td>${escapeHtml(c.name || 'Sin nombre')}</td><td>${escapeHtml(fileLabel)}</td><td>${escapeHtml(date)}</td><td><button class="btn btn-sm btn-outline" onclick="deleteCertificate('${String(c.id)}')">Eliminar</button></td></tr>`;
    }).join('');

    const tablePager = tableCerts.length > (state.ui.certTablePageSize || 8)
        ? `<div class="pager" style="margin-top:10px">
            <button class="btn btn-sm btn-outline" ${tablePaged.page <= 1 ? 'disabled' : ''} onclick="certTablePrevPage()">Anterior</button>
            <span>${tablePaged.page}/${tablePaged.totalPages}</span>
            <button class="btn btn-sm btn-outline" ${tablePaged.page >= tablePaged.totalPages ? 'disabled' : ''} onclick="certTableNextPage()">Siguiente</button>
           </div>`
        : '';

    host.innerHTML = `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap">
            <input class="form-input" style="max-width:260px" placeholder="Buscar por alumno o certificado" value="${escapeHtml(state.ui.certTableSearch || '')}" oninput="setCertTableSearch(this.value)">
        </div>
        ${rows
            ? `<table class="table"><thead><tr><th>Estudiante</th><th>Certificado</th><th>Archivo</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table>${tablePager}`
            : '<div class="muted">No hay certificados registrados.</div>'}
    `;
}

async function createCertificate() {
    const selectedStudentIds = asArray(state.ui.certSelectedStudentIds).map(String).filter(Boolean);
    const name = String((document.getElementById('certName') || {}).value || '').trim();
    const fileInput = document.getElementById('certFileInput');
    const file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
    if (!selectedStudentIds.length || !name) return showToast('Selecciona estudiantes y nombre del certificado', 'error');
    if (!file) return showToast('Adjunta un archivo para el certificado', 'error');

    const filePath = await readFileAsDataUrl(file);
    if (!filePath) return showToast('No se pudo leer el archivo del certificado', 'error');

    let created = 0;
    let failed = 0;
    let lastError = '';
    for (const studentId of selectedStudentIds) {
        try {
            const saved = await api('/api/certificates', {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify({
                    studentId: parseInt(studentId, 10),
                    name,
                    filePath,
                    issuedAt: new Date().toISOString().split('T')[0],
                    status: 'available'
                })
            });
            if (saved && typeof saved === 'object') saved.fileName = file.name || '';
            if (saved) state.certificates.unshift(saved);
            created += 1;
        } catch (e) {
            failed += 1;
            lastError = e.message || 'Error desconocido';
        }
    }

    document.getElementById('certName').value = '';
    if (fileInput) fileInput.value = '';
    state.ui.certSelectedStudentIds = [];
    renderCertificatesSection();
    renderOverview();
    if (failed > 0) {
        showToast(`Certificados emitidos: ${created}. Fallidos: ${failed}. ${lastError}`, 'error');
        return;
    }
    showToast(`Certificados emitidos: ${created}`, 'success');
}

async function deleteCertificate(certId) {
    const id = String(certId || '').trim();
    if (!id) return;
    try {
        await api('/api/certificates/' + encodeURIComponent(id), { method: 'DELETE', headers: headers(false) });
    } catch (e) {
        showToast('No se pudo eliminar el certificado en backend', 'error');
        return;
    }
    state.certificates = (state.certificates || []).filter(c => String(c.id) !== id);
    renderCertificatesSection();
    renderOverview();
    showToast('Certificado eliminado', 'success');
}

function renderGuidesSection() {
    const host = document.getElementById('guidesList');
    if (!host) return;
    host.innerHTML = (state.guides || []).length
        ? state.guides.map(g => `
            <div class="assign-col" style="margin-top:10px">
                <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">
                    <div>
                        <div style="font-weight:700">${escapeHtml(g.title || 'Instructivo')}</div>
                        <div class="muted" style="font-size:12px">${escapeHtml(g.detail || '')}</div>
                        <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
                            ${g.hasText ? '<span class="preview-chip">Texto</span>' : ''}
                            ${g.hasPdf ? '<span class="preview-chip">PDF</span>' : ''}
                            ${normalizeGuideAttachments(g.attachments).length ? `<span class="preview-chip">Adjuntos: ${normalizeGuideAttachments(g.attachments).length}</span>` : ''}
                        </div>
                    </div>
                    <div style="display:flex;gap:6px">
                        <button class="btn btn-sm btn-outline" onclick="openGuideForm('${String(g.id)}')">Editar</button>
                        <button class="btn btn-sm btn-outline" onclick="deleteGuide('${String(g.id)}')">Eliminar</button>
                    </div>
                </div>
            </div>
        `).join('')
        : '<div class="muted" style="margin-top:12px">No hay instructivos creados.</div>';
}

function guideFormatBytes(bytes) {
    const n = Math.max(0, parseInt(bytes || '0', 10) || 0);
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

function renderGuideAttachmentDraftList() {
    const host = document.getElementById('guideAttachmentsList');
    if (!host) return;
    const files = normalizeGuideAttachments(modalState.guideAttachments);
    host.innerHTML = files.length
        ? `<div class="guide-attachment-list">${files.map(file => `
            <div class="guide-attachment-item">
                <div>
                    <div class="guide-attachment-name">${escapeHtml(file.name)}</div>
                    <div class="guide-attachment-meta">${escapeHtml(file.type || 'archivo')} · ${guideFormatBytes(file.size)}</div>
                </div>
                <button class="btn btn-sm btn-outline" type="button" onclick="removeGuideAttachmentDraft('${escapeHtml(String(file.id))}')">Quitar</button>
            </div>
        `).join('')}</div>`
        : '<div class="muted">Sin adjuntos.</div>';
}

function removeGuideAttachmentDraft(attachmentId) {
    modalState.guideAttachments = normalizeGuideAttachments(modalState.guideAttachments).filter(file => String(file.id) !== String(attachmentId));
    renderGuideAttachmentDraftList();
}

async function handleGuideAttachmentsSelection(files) {
    const current = normalizeGuideAttachments(modalState.guideAttachments);
    const picked = Array.from(files || []);
    for (let i = 0; i < picked.length; i += 1) {
        const file = picked[i];
        if (!file) continue;
        if ((file.size || 0) > (8 * 1024 * 1024)) {
            showToast('Adjunto omitido por tamaño (>8MB): ' + (file.name || 'archivo'), 'error');
            continue;
        }
        try {
            const dataUrl = await readFileAsDataUrl(file);
            current.push({
                id: 'gatt-' + Date.now() + '-' + i,
                name: file.name || 'archivo',
                type: file.type || 'application/octet-stream',
                size: Math.max(0, parseInt(file.size || '0', 10) || 0),
                dataUrl
            });
        } catch (e) {
            showToast('No se pudo adjuntar: ' + (file.name || 'archivo'), 'error');
        }
    }
    modalState.guideAttachments = current.slice(0, 10);
    renderGuideAttachmentDraftList();
}

async function handleGuidePdfSelection(files) {
    const file = files && files[0] ? files[0] : null;
    if (!file) return;
    if ((file.type && file.type !== 'application/pdf') && !String(file.name || '').toLowerCase().endsWith('.pdf')) {
        showToast('Solo se permite archivo PDF', 'error');
        return;
    }
    if ((file.size || 0) > (12 * 1024 * 1024)) {
        showToast('El PDF supera el límite de 12MB', 'error');
        return;
    }
    try {
        modalState.guidePdfDataUrl = await readFileAsDataUrl(file);
        modalState.guidePdfName = file.name || 'archivo.pdf';
        const label = document.getElementById('guidePdfPickedName');
        if (label) label.textContent = 'PDF cargado: ' + modalState.guidePdfName;
    } catch (e) {
        showToast('No se pudo leer el PDF', 'error');
    }
}

const trtState = {
    savedRangeByEditor: {},
    activeImageByEditor: {},
    draggedImage: null,
    resizingImage: null,
    resizeListenersBound: false
};

function buildRichEditorHtml(editorId) {
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
                <button class="trt-btn" type="button" title="Insertar texto debajo de imagen" onclick="trtInsertTextAfterImage('${editorId}')">Texto +</button>
                <button class="trt-btn" type="button" title="Quitar imagen seleccionada" onclick="trtRemoveActiveImage('${editorId}')">Quitar Img</button>
            </div>
            <span class="trt-sep"></span>
            <div class="trt-toolbar-group">
                <button class="trt-btn" type="button" title="Deshacer" onclick="trtCmd('${editorId}','undo')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 14L4 9l5-5"/><path d="M20 20a8 8 0 00-8-8H4"/></svg></button>
                <button class="trt-btn" type="button" title="Rehacer" onclick="trtCmd('${editorId}','redo')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 14l5-5-5-5"/><path d="M4 20a8 8 0 018-8h8"/></svg></button>
                <button class="trt-btn" type="button" title="Limpiar formato" onclick="trtCmd('${editorId}','removeFormat')">Limpiar</button>
            </div>
        </div>
        <div id="${editorId}" class="rich-editor-content" contenteditable="true" onfocus="trtEnsureEditor('${editorId}')"></div>
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
    el.addEventListener('mousedown', ev => {
        const handle = ev.target.closest('.trt-image-resize');
        if (!handle) return;
        const wrap = handle.closest('.trt-image-wrap');
        const img = wrap ? wrap.querySelector('img') : null;
        if (!wrap || !img) return;
        ev.preventDefault();
        ev.stopPropagation();
        trtSelectImage(editorId, wrap);
        trtState.resizingImage = { editorId, wrap, img, startX: ev.clientX, startWidth: img.getBoundingClientRect().width };
    });
    el.addEventListener('keydown', ev => {
        const selected = trtState.activeImageByEditor[editorId];
        if (!selected) return;
        if (ev.key === 'Delete' || ev.key === 'Backspace') {
            ev.preventDefault();
            selected.remove();
            trtState.activeImageByEditor[editorId] = null;
            return;
        }
        if (ev.key === 'Enter') {
            ev.preventDefault();
            trtInsertTextAfterImage(editorId);
            return;
        }
        if (ev.altKey && (ev.key === 'ArrowUp' || ev.key === 'ArrowDown')) {
            ev.preventDefault();
            trtMoveImageByLine(editorId, ev.key === 'ArrowUp' ? -1 : 1);
        }
    });

    if (!trtState.resizeListenersBound) {
        trtState.resizeListenersBound = true;
        document.addEventListener('mousemove', ev => {
            const rs = trtState.resizingImage;
            if (!rs) return;
            const editor = document.getElementById(rs.editorId);
            if (!editor || !rs.img) return;
            const maxWidth = Math.max(140, editor.clientWidth - 24);
            const next = Math.max(120, Math.min(maxWidth, rs.startWidth + (ev.clientX - rs.startX)));
            rs.img.style.width = `${next}px`;
            rs.img.style.maxWidth = 'none';
        });
        document.addEventListener('mouseup', () => {
            if (!trtState.resizingImage) return;
            const editorIdActive = trtState.resizingImage.editorId;
            trtState.resizingImage = null;
            trtSaveSelection(editorIdActive);
        });
    }

    el.addEventListener('paste', async ev => {
        const cd = ev.clipboardData;
        if (!cd) return;
        const imageFiles = Array.from(cd.files || []).filter(f => String((f || {}).type || '').startsWith('image/'));
        if (imageFiles.length) {
            ev.preventDefault();
            for (const file of imageFiles) {
                if (!file) continue;
                if (file.size > 15 * 1024 * 1024) {
                    showToast('La imagen pegada supera 15MB', 'error');
                    continue;
                }
                const dataUrl = await trtReadFileAsDataUrl(file);
                if (dataUrl) trtInsertImageFromSource(editorId, dataUrl, file.name || 'imagen pegada');
            }
            return;
        }
        const imageItems = Array.from(cd.items || []).filter(it => String(it.type || '').startsWith('image/'));
        if (imageItems.length) {
            ev.preventDefault();
            for (const item of imageItems) {
                const file = item.getAsFile ? item.getAsFile() : null;
                if (!file) continue;
                if (file.size > 15 * 1024 * 1024) {
                    showToast('La imagen pegada supera 15MB', 'error');
                    continue;
                }
                const dataUrl = await trtReadFileAsDataUrl(file);
                if (dataUrl) trtInsertImageFromSource(editorId, dataUrl, file.name || 'imagen pegada');
            }
            return;
        }
        const html = cd.getData('text/html') || '';
        if (html && /<img\b/i.test(html)) {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const sources = Array.from(doc.querySelectorAll('img'))
                .map(img => ({ src: String(img.getAttribute('src') || '').trim(), alt: String(img.getAttribute('alt') || '').trim() }))
                .filter(x => /^https?:\/\//i.test(x.src) || /^data:image\//i.test(x.src) || /^blob:/i.test(x.src));
            if (sources.length) {
                ev.preventDefault();
                for (const img of sources.slice(0, 5)) {
                    const safeSrc = await trtNormalizeImageSourceForEmbedding(img.src);
                    if (safeSrc) trtInsertImageFromSource(editorId, safeSrc, img.alt || 'imagen pegada');
                }
                return;
            }
        }
        const plainText = String(cd.getData('text/plain') || '').trim();
        if (/^https?:\/\//i.test(plainText) && /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(plainText)) {
            ev.preventDefault();
            const safeSrc = await trtNormalizeImageSourceForEmbedding(plainText);
            if (safeSrc) trtInsertImageFromSource(editorId, safeSrc, 'imagen pegada');
        }
    });
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
    if (el.contains(range.commonAncestorContainer)) trtState.savedRangeByEditor[editorId] = range.cloneRange();
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

function trtCmd(editorId, cmd) { trtFocus(editorId); trtRestoreSelection(editorId); document.execCommand(cmd, false, null); trtSaveSelection(editorId); }
function trtSetBlock(editorId, tag) { trtFocus(editorId); trtRestoreSelection(editorId); document.execCommand('formatBlock', false, tag); trtSaveSelection(editorId); }
function trtSetFont(editorId, font) { trtFocus(editorId); trtRestoreSelection(editorId); document.execCommand('fontName', false, font); trtSaveSelection(editorId); }
function trtSetFontSize(editorId, size) { trtFocus(editorId); trtRestoreSelection(editorId); document.execCommand('fontSize', false, size); trtSaveSelection(editorId); }
function trtApplyForeColor(editorId, color) { if (!color) return; trtFocus(editorId); trtRestoreSelection(editorId); document.execCommand('foreColor', false, color); trtSaveSelection(editorId); }
function trtApplyHighlightColor(editorId, color) { if (!color) return; trtFocus(editorId); trtRestoreSelection(editorId); document.execCommand('hiliteColor', false, color); trtSaveSelection(editorId); }
function trtUnlink(editorId) { trtFocus(editorId); trtRestoreSelection(editorId); document.execCommand('unlink', false, null); trtSaveSelection(editorId); }

function trtInsertImageLink(editorId) {
    trtSaveSelection(editorId);
    trtOpenMiniDialog('Insertar imagen por enlace', `
        <div class="form-group">
            <label class="form-label" for="trtImgUrl">URL de imagen</label>
            <input type="url" class="form-input" id="trtImgUrl" placeholder="https://...">
            <div style="font-size:12px;color:var(--text-muted);margin-top:6px">Tambien puedes pegar una imagen con Ctrl+V.</div>
        </div>
        <div class="form-group">
            <label class="form-label" for="trtImgAltInput">Texto alternativo (opcional)</label>
            <input type="text" class="form-input" id="trtImgAltInput" placeholder="Descripcion de la imagen">
        </div>
        <button class="btn btn-teal" style="width:100%" onclick="trtApplyImage('${editorId}')">Insertar imagen</button>
    `);
}

async function trtNormalizeImageSourceForEmbedding(src) {
    const raw = String(src || '').trim();
    if (!raw) return '';
    if (/^data:image\//i.test(raw)) return raw;
    if (!/^https?:\/\//i.test(raw) && !/^blob:/i.test(raw)) return '';
    try {
        const response = await fetch(raw);
        if (!response.ok) return /^blob:/i.test(raw) ? '' : raw;
        const blob = await response.blob();
        if (!String(blob.type || '').startsWith('image/')) return /^blob:/i.test(raw) ? '' : raw;
        if (blob.size > 15 * 1024 * 1024) return /^blob:/i.test(raw) ? '' : raw;
        const file = new File([blob], 'pasted-image', { type: blob.type || 'image/png' });
        const dataUrl = await trtReadFileAsDataUrl(file);
        return dataUrl || (/^blob:/i.test(raw) ? '' : raw);
    } catch (e) {
        return /^blob:/i.test(raw) ? '' : raw;
    }
}

function trtInsertLink(editorId) {
    trtSaveSelection(editorId);
    trtOpenMiniDialog('Insertar enlace', `<div class="form-group"><label class="form-label" for="trtLinkUrl">URL</label><input type="url" class="form-input" id="trtLinkUrl" placeholder="https://..."></div><div class="form-group"><label class="form-label" for="trtLinkText">Texto (opcional)</label><input type="text" class="form-input" id="trtLinkText" placeholder="Texto visible"></div><button class="btn btn-teal" style="width:100%" onclick="trtApplyLink('${editorId}')">Insertar enlace</button>`);
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
    const alt = ((document.getElementById('trtImgAltInput') || {}).value || '').trim();
    if (!url) { showToast('Ingresa la URL de la imagen', 'error'); return; }
    trtInsertImageFromSource(editorId, url, alt || 'imagen');
    trtCloseMiniDialog();
    trtSaveSelection(editorId);
}

function trtReadFileAsDataUrl(file) {
    return new Promise(resolve => {
        try {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
        } catch (e) {
            resolve('');
        }
    });
}

function trtInsertImageFromSource(editorId, src, alt) {
    if (!src) return;
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
    wrap.innerHTML = `<img src="${src}" alt="${alt || 'imagen'}" style="max-width:100%;height:auto;display:block;border-radius:8px"><span class="trt-image-grip" title="Arrastra para mover">::</span><span class="trt-image-resize" title="Arrastra para redimensionar"></span>`;
    range.insertNode(wrap);
    const spacer = document.createTextNode(' ');
    wrap.after(spacer);
    range.setStartAfter(spacer);
    range.collapse(true);
    if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
    }
    trtSelectImage(editorId, wrap);
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

function trtInsertTextAfterImage(editorId) {
    const imgWrap = trtState.activeImageByEditor[editorId];
    const editor = document.getElementById(editorId);
    if (!imgWrap || !editor) return;
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    if (imgWrap.nextSibling) imgWrap.parentNode.insertBefore(p, imgWrap.nextSibling);
    else imgWrap.parentNode.appendChild(p);
    const range = document.createRange();
    range.setStart(p, 0);
    range.collapse(true);
    const sel = window.getSelection();
    if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
    }
    trtSelectImage(editorId, null);
    trtSaveSelection(editorId);
}

function trtMoveImageByLine(editorId, direction) {
    const imgWrap = trtState.activeImageByEditor[editorId];
    if (!imgWrap || !imgWrap.parentNode) return;
    const parent = imgWrap.parentNode;
    const sibling = direction < 0 ? imgWrap.previousSibling : imgWrap.nextSibling;
    if (!sibling) return;
    if (direction < 0) parent.insertBefore(imgWrap, sibling);
    else parent.insertBefore(sibling, imgWrap);
    trtSaveSelection(editorId);
}

function trtGetHtml(editorId) {
    const el = document.getElementById(editorId);
    return el ? el.innerHTML.trim() : '';
}

function htmlEscape(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function stripHtmlToText(value) {
    const div = document.createElement('div');
    div.innerHTML = String(value || '');
    return String(div.textContent || div.innerText || '').trim();
}

function sanitizeRichHtml(value) {
    const div = document.createElement('div');
    div.innerHTML = String(value || '');
    div.querySelectorAll('script,style,iframe,object,embed').forEach(el => el.remove());
    div.querySelectorAll('*').forEach(el => {
        Array.from(el.attributes || []).forEach(attr => {
            const name = String(attr.name || '').toLowerCase();
            const val = String(attr.value || '');
            if (name.startsWith('on')) el.removeAttribute(attr.name);
            if ((name === 'href' || name === 'src') && /^\s*javascript:/i.test(val)) el.removeAttribute(attr.name);
        });
    });
    return div.innerHTML;
}

function toRichHtml(value) {
    const raw = String(value || '');
    if (!raw.trim()) return '';
    if (/<\/?[a-z][\s\S]*>/i.test(raw)) return sanitizeRichHtml(raw);
    return htmlEscape(raw).replace(/\n/g, '<br>');
}

function openGuideForm(guideId) {
    const guide = (state.guides || []).find(g => String(g.id) === String(guideId)) || {};
    modalState.guideAttachments = normalizeGuideAttachments(guide.attachments);
    modalState.guidePdfDataUrl = '';
    modalState.guidePdfName = '';
    openModal(guideId ? 'Editar instructivo' : 'Nuevo instructivo', `
        <div class="form-group"><label class="form-label">Título</label><input class="form-input" id="guideTitle" value="${escapeHtml(guide.title || '')}"></div>
        <div class="form-group"><label class="form-label">Detalle corto</label><textarea class="form-input" id="guideDetail" style="min-height:90px">${escapeHtml(guide.detail || '')}</textarea></div>
        <div class="form-group">
            <label class="form-label">Audiencia</label>
            <select class="form-input" id="guideAudience">
                <option value="ESTUDIANTE" ${(!guide.audienceJson || String(guide.audienceJson).includes('ESTUDIANTE')) ? 'selected' : ''}>Estudiantes</option>
                <option value="DOCENTE" ${String(guide.audienceJson || '').includes('DOCENTE') ? 'selected' : ''}>Docentes</option>
                <option value="TODOS" ${String(guide.audienceJson || '').includes('TODOS') ? 'selected' : ''}>Todos</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Contenido del instructivo (editor de texto)</label>
            ${buildRichEditorHtml('guideRichEditor')}
        </div>
        <div class="guide-editor-meta">
            <div class="form-group">
                <label class="form-label">URL PDF (opcional)</label>
                <input class="form-input" id="guidePdfUrl" value="${escapeHtml(guide.pdfUrl || '')}" placeholder="https://... o data:application/pdf...">
                <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
                    <input type="file" id="guidePdfInput" accept="application/pdf,.pdf" style="display:none" onchange="handleGuidePdfSelection(this.files); this.value='';">
                    <button class="btn btn-sm btn-outline" type="button" onclick="document.getElementById('guidePdfInput').click()">Subir PDF</button>
                    <span class="muted" id="guidePdfPickedName"></span>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Adjuntos (archivos de apoyo)</label>
                <input type="file" id="guideAttachmentsInput" class="form-input" multiple onchange="handleGuideAttachmentsSelection(this.files); this.value='';">
                <div class="muted" style="margin-top:6px">Máx. 10 archivos, 8MB por archivo.</div>
            </div>
        </div>
        <div class="form-group"><label class="form-label">Adjuntos cargados</label><div id="guideAttachmentsList"></div></div>
        <div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn btn-outline" onclick="closeModal()">Cancelar</button><button class="btn btn-teal" onclick="saveGuideFromModal('${guideId || ''}')">Guardar</button></div>
    `);
    const editor = document.getElementById('guideRichEditor');
    if (editor) {
        editor.style.minHeight = '220px';
        editor.innerHTML = toRichHtml(guide.richHtml || '');
        trtEnsureEditor('guideRichEditor');
    }
    setAdminModalSize('xxl');
    renderGuideAttachmentDraftList();
}

async function saveGuideFromModal(guideId) {
    const title = String((document.getElementById('guideTitle') || {}).value || '').trim();
    const detail = String((document.getElementById('guideDetail') || {}).value || '').trim();
    const pdfUrlInput = String((document.getElementById('guidePdfUrl') || {}).value || '').trim();
    const pdfUrl = String(modalState.guidePdfDataUrl || pdfUrlInput || '').trim();
    const richHtml = sanitizeRichHtml(trtGetHtml('guideRichEditor'));
    const attachments = normalizeGuideAttachments(modalState.guideAttachments);
    const audience = String((document.getElementById('guideAudience') || {}).value || 'ESTUDIANTE');
    if (!title) return showToast('Título requerido', 'error');
    const payload = {
        title,
        detail,
        pdfUrl,
        hasPdf: !!pdfUrl,
        hasText: !!(richHtml || detail),
        textSections: [],
        richHtml,
        attachments,
        sectionsJson: JSON.stringify([]),
        audienceJson: JSON.stringify([audience])
    };
    try {
        if (guideId && !isNaN(parseInt(guideId, 10))) {
            await api('/api/guides/' + parseInt(guideId, 10), { method: 'PUT', headers: headers(), body: JSON.stringify(payload) });
            state.guides = (state.guides || []).map(g => String(g.id) === String(guideId) ? { ...g, ...payload, id: String(guideId) } : g);
        } else {
            const created = await api('/api/guides', { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
            state.guides.unshift({ ...payload, id: String(created.id), textSections: JSON.parse(created.sectionsJson || '[]') });
        }
    } catch (e) {
        showToast('Error al guardar instructivo', 'error');
        return;
    }
    closeModal();
    renderGuidesSection();
    showToast('Instructivo guardado', 'success');
}

async function deleteGuide(guideId) {
    const id = parseInt(guideId, 10);
    if (!isNaN(id)) {
        try { await api('/api/guides/' + id, { method: 'DELETE', headers: headers() }); } catch (e) {}
    }
    state.guides = (state.guides || []).filter(g => String(g.id) !== String(guideId));
    renderGuidesSection();
    showToast('Instructivo eliminado', 'success');
}

function questionNeedsOptions(type) {
    return type === 'single' || type === 'multiselect';
}

function getSearchParam(name) {
    const params = new URLSearchParams(window.location.search || '');
    return String(params.get(name) || '');
}

function getActiveUser() {
    if (activeSessionUser && activeSessionUser.id !== undefined && activeSessionUser.id !== null) {
        const byId = asArray(state.users).find(u => String((u && u.id) || '') === String(activeSessionUser.id));
        return byId || activeSessionUser;
    }
    return null;
}

function getActiveUserRoleName() {
    return String((((getActiveUser() || {}).role || {}).name) || '');
}

function getSurveyDeviceKey() {
    const keyName = 'educat_survey_device_key';
    let key = String(storageService.getItem(keyName) || '').trim();
    if (!key) {
        key = 'dv-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
        storageService.setItem(keyName, key);
    }
    return key;
}

function getSurveyVoterKey(survey, activeUser) {
    const authRequired = (survey || {}).authRequired !== false;
    if (activeUser && activeUser.id !== undefined && activeUser.id !== null) {
        return 'usr:' + String(activeUser.id);
    }
    if (activeUser && activeUser.email) {
        return 'mail:' + String(activeUser.email).toLowerCase();
    }
    if (authRequired) return '';
    return 'dev:' + getSurveyDeviceKey();
}

function getDefaultSurveyRoleName() {
    const names = asArray(state.roles).map(r => String((r && r.name) || '').toUpperCase());
    if (names.includes('ESTUDIANTE')) return 'ESTUDIANTE';
    return 'ESTUDIANTE';
}

function surveyAllowsNoRole(survey) {
    return asArray((survey || {}).roles).map(String).includes(SURVEY_NO_ROLE);
}

function parseDateMs(value) {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const ms = new Date(raw).getTime();
    return Number.isFinite(ms) ? ms : null;
}

function formatSurveyDate(value) {
    const ms = parseDateMs(value);
    if (ms === null) return 'Sin fecha';
    return new Date(ms).toLocaleString('es-CO');
}

function isSurveyOpenForVoting(survey) {
    if (!survey || String(survey.status || '') === 'closed') return false;
    const now = Date.now();
    const startMs = parseDateMs(survey.startsAt);
    const endMs = parseDateMs(survey.endsAt);
    if (startMs !== null && now < startMs) return false;
    if (endMs !== null && now > endMs) return false;
    return true;
}

function isSurveyInHistory(survey) {
    if (!survey) return false;
    if (String(survey.status || '') === 'closed') return true;
    const endMs = parseDateMs(survey.endsAt);
    return endMs !== null && Date.now() > endMs;
}

function isBaseFormKey(key) {
    return key === 'eval' || key === 'autoeval';
}

function isCustomFormKey(key) {
    return String(key || '').startsWith('custom:');
}

function getCustomFormIdFromKey(key) {
    return String(key || '').replace(/^custom:/, '');
}

function getCustomFormByKey(key) {
    if (!isCustomFormKey(key)) return null;
    const id = getCustomFormIdFromKey(key);
    return (state.customForms || []).find(f => String(f.id) === id) || null;
}

function getAllFormOptions() {
    const base = [
        { key: 'eval', title: 'Evaluación docente', builtIn: true },
        { key: 'autoeval', title: 'Autoevaluación', builtIn: true }
    ];
    const custom = asArray(state.customForms).map(f => ({
        key: 'custom:' + String(f.id),
        title: String(f.title || 'Formulario personalizable'),
        builtIn: false
    }));
    return base.concat(custom);
}

function refreshFormTypeOptions(preferredKey) {
    const select = document.getElementById('formType');
    if (!select) return;
    const previous = String(preferredKey || select.value || 'eval');
    const options = getAllFormOptions();
    select.innerHTML = options.map(opt => `<option value="${escapeHtml(opt.key)}">${escapeHtml(opt.title)}</option>`).join('');
    const target = options.some(opt => opt.key === previous) ? previous : 'eval';
    select.value = target;
}

function getActiveFormConfig() {
    const key = getBuilderType();
    if (isBaseFormKey(key)) {
        return {
            key,
            builtIn: true,
            title: String((((state.formsMeta || {})[key] || {}).title) || ''),
            questions: cloneQuestions((state.forms || {})[key] || []),
            audience: { mode: 'registered', roles: [] }
        };
    }
    const custom = getCustomFormByKey(key);
    if (custom) {
        return {
            key,
            builtIn: false,
            title: String(custom.title || ''),
            questions: cloneQuestions(custom.questions || []),
            audience: {
                mode: String(((custom.audience || {}).mode) || 'registered'),
                roles: asArray((custom.audience || {}).roles).map(String)
            }
        };
    }
    return {
        key: 'eval',
        builtIn: true,
        title: String((((state.formsMeta || {}).eval || {}).title) || 'Evaluacion docente'),
        questions: cloneQuestions((state.forms || {}).eval || []),
        audience: { mode: 'registered', roles: [] }
    };
}

function isBuilderWindow() {
    return getSearchParam('builderFull') === '1';
}

function questionDisplayLabel(question) {
    const text = String((question || {}).text || '').trim();
    if (text) return text;
    return String((question || {}).label || 'Pregunta').trim() || 'Pregunta';
}

function sanitizeQuestionHtml(html) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = String(html || '');
    wrapper.querySelectorAll('script,style').forEach(node => node.remove());
    wrapper.querySelectorAll('*').forEach(el => {
        Array.from(el.attributes).forEach(attr => {
            const n = String(attr.name || '').toLowerCase();
            if (n.startsWith('on')) el.removeAttribute(attr.name);
        });
    });
    return wrapper.innerHTML;
}

function getTextFromQuestionHtml(html) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = String(html || '');
    return String(wrapper.textContent || '').replace(/\s+/g, ' ').trim();
}

function normalizeQuestionImages(rawImages) {
    return asArray(rawImages).map((img, idx) => ({
        id: img && img.id ? String(img.id) : ('img-' + Date.now() + '-' + idx),
        name: String((img && img.name) || 'imagen'),
        dataUrl: String((img && img.dataUrl) || '')
    })).filter(img => String(img.dataUrl || '').startsWith('data:image/'));
}

function normalizeGuideAttachments(rawAttachments) {
    return asArray(rawAttachments).map((file, idx) => ({
        id: file && file.id ? String(file.id) : ('gatt-' + Date.now() + '-' + idx),
        name: String((file && file.name) || 'archivo'),
        type: String((file && file.type) || 'application/octet-stream'),
        size: Math.max(0, parseInt((file && file.size) || '0', 10) || 0),
        dataUrl: String((file && file.dataUrl) || '')
    })).filter(file => file.dataUrl.startsWith('data:'));
}

function normalizeSurveyQuestionMedia(media) {
    if (!media || !String((media || {}).dataUrl || '').startsWith('data:')) return null;
    return {
        name: String((media && media.name) || 'media'),
        type: String((media && media.type) || ''),
        dataUrl: String((media && media.dataUrl) || '')
    };
}

function normalizeSurveyOptionDraft(option) {
    if (typeof option === 'string') return { text: String(option || ''), media: null };
    return {
        text: String((option && option.text) || ''),
        media: normalizeSurveyQuestionMedia(option && option.media)
    };
}

function renderQuestionPrompt(question, maxThumbs) {
    const rich = sanitizeQuestionHtml((question || {}).richText || '');
    const textFallback = String((question || {}).text || '').trim();
    const safeContent = rich || (textFallback ? `<p>${escapeHtml(textFallback)}</p>` : '<p class="muted">Sin contenido</p>');
    const richHost = document.createElement('div');
    richHost.innerHTML = safeContent;
    richHost.querySelectorAll('img').forEach(img => {
        const src = String(img.getAttribute('src') || '');
        img.classList.add('question-inline-image');
        img.style.maxWidth = '100%';
        if (!img.style.width) img.style.width = '320px';
        img.style.height = 'auto';
        img.style.cursor = 'zoom-in';
        img.setAttribute('onclick', `openQuestionImagePreview(${JSON.stringify(src)}); return false;`);
    });
    const images = normalizeQuestionImages((question || {}).images);
    const limit = Math.max(1, parseInt(maxThumbs || '3', 10) || 3);
    const thumbs = images.slice(0, limit).map(img => `<button type="button" class="question-image-thumb" onclick="openQuestionImagePreview(${JSON.stringify(img.dataUrl)})"><img src="${escapeHtml(img.dataUrl)}" alt="${escapeHtml(img.name)}"></button>`).join('');
    const extra = images.length > limit ? `<span class="preview-chip">+${images.length - limit}</span>` : '';
    const gallery = images.length ? `<div class="question-image-strip">${thumbs}${extra}</div>` : '';
    return `<div class="question-rich-content">${richHost.innerHTML}</div>${gallery}`;
}

function ensureQuestionHasOptions(question) {
    if (!questionNeedsOptions((question || {}).type)) return;
    const clean = asArray(question.options).map(opt => String(opt || '').trim()).filter(Boolean);
    question.options = clean.length ? clean : ['Opcion 1', 'Opcion 2'];
}

function cloneQuestions(rawQuestions) {
    return asArray(rawQuestions).map((q, idx) => ({
        id: q && q.id ? String(q.id) : ('q-' + Date.now() + '-' + idx),
        richText: sanitizeQuestionHtml((q && q.richText) || (q && q.text) || (q && q.label) || ''),
        label: String((q && q.text) || (q && q.label) || ('Pregunta ' + (idx + 1))).trim(),
        text: String((q && q.text) || (q && q.label) || '').trim(),
        type: String((q && q.type) || 'open'),
        required: q && q.required !== false,
        options: asArray(q && q.options).map(opt => String(opt || '').trim()).filter(Boolean),
        images: normalizeQuestionImages(q && q.images)
    })).map(question => {
        question.text = getTextFromQuestionHtml(question.richText) || question.text;
        question.label = question.text || question.label;
        ensureQuestionHasOptions(question);
        return question;
    });
}

function getBuilderType() {
    return String((document.getElementById('formType') || {}).value || 'eval');
}

function ensureFormDraft() {
    const type = getBuilderType();
    const current = state.ui.formDraft || {};
    if (current.type === type && Array.isArray(current.questions)) return;
    const active = getActiveFormConfig();
    state.ui.formDraft = {
        type: active.key,
        title: String(active.title || ''),
        questions: cloneQuestions(active.questions || []),
        audience: {
            mode: String(((active.audience || {}).mode) || 'registered'),
            roles: asArray((active.audience || {}).roles).map(String)
        }
    };
}

function renderFormLivePreview() {
    const host = document.getElementById('formLivePreview');
    if (!host) return;
    if (!isBuilderWindow()) {
        host.style.display = 'none';
        host.innerHTML = '';
        return;
    }
    host.style.display = '';
    const draft = state.ui.formDraft || { questions: [] };
    const blocks = (draft.questions || []).map((q, idx) => {
        let body = '<div class="muted">Sin vista previa para este tipo.</div>';
        if (q.type === 'binary') {
            body = ['si', 'no'].map(v => `<label class="preview-option-row"><input type="radio" disabled><span>${v === 'si' ? 'Si' : 'No'}</span></label>`).join('');
        }
        if (q.type === 'rating5') {
            body = [1, 2, 3, 4, 5].map(v => `<label class="preview-option-row"><input type="radio" disabled><span>${v}</span></label>`).join('');
        }
        if (q.type === 'rating10') {
            body = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => `<label class="preview-option-row"><input type="radio" disabled><span>${v}</span></label>`).join('');
        }
        if (q.type === 'open') body = '<div class="preview-textarea">Respuesta abierta...</div>';
        if (questionNeedsOptions(q.type)) {
            const isMulti = q.type === 'multiselect';
            const opts = (q.options || []).map(opt => `<label class="preview-option-row"><input type="${isMulti ? 'checkbox' : 'radio'}" disabled><span>${escapeHtml(opt)}</span></label>`).join('');
            body = opts || '<div class="muted">Agrega opciones para esta pregunta.</div>';
        }
        return `<div class="form-preview-question"><div><strong>${idx + 1}. ${escapeHtml(questionDisplayLabel(q))}</strong>${q.required ? ' *' : ''}</div>${renderQuestionPrompt(q, 2)}${body}</div>`;
    }).join('');
    host.innerHTML = `<div class="assign-head" style="margin-bottom:10px">Vista previa en tiempo real</div>${blocks || '<div class="muted">Añade preguntas para ver la vista previa.</div>'}`;
}

function renderFormBuilderQuestions() {
    const host = document.getElementById('questionsList');
    if (!host) return;
    ensureFormDraft();
    const draft = state.ui.formDraft;
    const allQuestions = asArray(draft.questions);
    const pageSize = Math.max(1, parseInt(state.ui.formBuilderPageSize || '5', 10) || 5);
    const totalPages = Math.max(1, Math.ceil(allQuestions.length / pageSize));
    state.ui.formBuilderPage = Math.max(1, Math.min(totalPages, parseInt(state.ui.formBuilderPage || '1', 10) || 1));
    const start = (state.ui.formBuilderPage - 1) * pageSize;
    const pageItems = allQuestions.slice(start, start + pageSize).map((q, i) => ({ q, idx: start + i }));
    const pager = allQuestions.length
        ? `<div class="pager" style="margin-top:10px"><button class="btn btn-sm btn-outline" ${state.ui.formBuilderPage <= 1 ? 'disabled' : ''} onclick="formBuilderPrevPage()">Anterior</button><span>${state.ui.formBuilderPage}/${totalPages}</span><button class="btn btn-sm btn-outline" ${state.ui.formBuilderPage >= totalPages ? 'disabled' : ''} onclick="formBuilderNextPage()">Siguiente</button></div>`
        : '';
    if (!isBuilderWindow()) {
        host.style.display = 'none';
        host.innerHTML = '';
        renderFormLivePreview();
        return;
    }
    host.style.display = '';
    const typeOptions = QUESTION_TYPES.map(t => `<option value="${t.id}">${escapeHtml(t.label)}</option>`).join('');
    host.innerHTML = pageItems.map(item => {
        const q = item.q;
        const idx = item.idx;
        const optionsEditor = questionNeedsOptions(q.type)
            ? `<div class="form-group"><label class="form-label">Opciones</label>
                <div class="builder-options-list">${asArray(q.options).map((opt, optIdx) => `
                    <div class="builder-option-row">
                        <span class="builder-option-dot" aria-hidden="true"></span>
                        <input class="form-input" value="${escapeHtml(opt || '')}" placeholder="Opcion ${optIdx + 1}" oninput="updateBuilderQuestionOptionText(${idx}, ${optIdx}, this.value)">
                        <button class="btn btn-sm btn-outline" onclick="removeBuilderQuestionOption(${idx}, ${optIdx})">Quitar</button>
                    </div>
                `).join('')}</div>
                <button class="btn btn-sm btn-outline" style="margin-top:8px" onclick="addBuilderQuestionOption(${idx})">Agregar opcion</button>
            </div>`
            : '';
        return `<div class="builder-question-card">
            <div class="form-row builder-top-row">
                <div class="form-group"><label class="form-label">Tipo</label><select class="form-input" data-q-type="${idx}" onchange="updateBuilderQuestionType(${idx}, this.value)">${typeOptions}</select></div>
                <div class="form-group builder-required-group"><label class="form-label">Obligatoria</label><select class="form-input" onchange="updateBuilderQuestionRequired(${idx}, this.value)"><option value="true" ${q.required ? 'selected' : ''}>Si</option><option value="false" ${!q.required ? 'selected' : ''}>No</option></select></div>
                <div class="form-group" style="align-self:end;display:flex;gap:8px"><button class="btn btn-sm btn-outline" onclick="removeBuilderQuestion(${idx})">Eliminar</button></div>
            </div>
                <div class="form-group"><label class="form-label">Pregunta</label>
                    <div class="question-editor-toolbar">
                        <div class="question-toolbar-row">
                            <select class="form-input toolbar-select" onchange="applyQuestionFormatControl(${idx}, 'block', this.value)">
                                <option value="p">Parrafo</option>
                                <option value="h2">Titulo</option>
                                <option value="blockquote">Cita</option>
                            </select>
                            <select class="form-input toolbar-select" onchange="applyQuestionFormatControl(${idx}, 'font', this.value)">
                                <option value="Calibri">Calibri</option>
                                <option value="Arial">Arial</option>
                                <option value="Georgia">Georgia</option>
                                <option value="Verdana">Verdana</option>
                            </select>
                            <select class="form-input toolbar-select" onchange="applyQuestionFormatControl(${idx}, 'size', this.value)">
                                <option value="3">Normal</option>
                                <option value="2">Pequeno</option>
                                <option value="4">Grande</option>
                                <option value="5">Muy grande</option>
                            </select>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'bold')"><strong>B</strong></button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'italic')"><em>I</em></button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'underline')"><u>U</u></button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'strike')"><s>S</s></button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'sup')">x<sup>2</sup></button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'sub')">x<sub>2</sub></button>
                        </div>
                        <div class="question-toolbar-row">
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'ul')">• Lista</button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'ol')">1. Lista</button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'alignLeft')">Izq</button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'alignCenter')">Cen</button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'alignRight')">Der</button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'justify')">Just</button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'link')">Link</button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'unlink')">Quitar link</button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'hr')">-</button>
                        </div>
                        <div class="question-toolbar-row">
                            <button type="button" class="btn btn-sm btn-outline" onclick="applyQuestionFormatControl(${idx}, 'foreColor', '#0b1f3a')">A</button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="applyQuestionFormatControl(${idx}, 'hiliteColor', '#fff3a8')">Res</button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'imgLeft')">Img L</button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'imgCenter')">Img C</button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'imgRight')">Img R</button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'imgGrow')">Texto +</button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'imgRemove')">Quitar Img</button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'undo')">↶</button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'redo')">↷</button>
                            <button type="button" class="btn btn-sm btn-outline" onclick="formatBuilderQuestionText(${idx}, 'clear')">Limpiar</button>
                        </div>
                    </div>
                    <div id="questionEditor-${idx}" class="question-rich-editor" contenteditable="true" onpaste="handleQuestionEditorPaste(event, ${idx})" onclick="bindEditorImageSelection(${idx}, event)" oninput="updateBuilderQuestionRichText(${idx}, this.innerHTML)">${q.richText || ''}</div>
                <div class="question-image-strip editor-strip">${normalizeQuestionImages(q.images).map(img => `<div class="question-image-item"><button type="button" class="question-image-thumb" onclick="openQuestionImagePreview(${JSON.stringify(img.dataUrl)})"><img src="${escapeHtml(img.dataUrl)}" alt="${escapeHtml(img.name)}"></button><button type="button" class="btn btn-sm btn-outline question-image-remove" onclick="removeBuilderQuestionImage(${idx}, '${String(img.id)}')">Quitar</button></div>`).join('') || '<span class="muted">Sin imágenes.</span>'}</div>
                <input type="file" id="questionImageInput-${idx}" accept="image/*" multiple style="display:none" onchange="addQuestionImages(${idx}, this.files); this.value='';">
                <div style="margin-top:8px"><button type="button" class="btn btn-sm btn-outline" onclick="document.getElementById('questionImageInput-${idx}').click()">Añadir imagen</button></div>
            </div>
            ${optionsEditor}
        </div>`;
    }).join('') + pager || '<div class="muted">No hay preguntas. Usa "Añadir pregunta".</div>';
    (host.querySelectorAll('select[data-q-type]') || []).forEach((sel, idx) => {
        const question = draft.questions[idx];
        if (question) sel.value = question.type;
    });
    renderFormLivePreview();
}

function updateBuilderQuestionLabel(index, value) {
    ensureFormDraft();
    if (!state.ui.formDraft.questions[index]) return;
    state.ui.formDraft.questions[index].label = String(value || '');
    renderFormLivePreview();
}

function updateBuilderQuestionText(index, value) {
    ensureFormDraft();
    if (!state.ui.formDraft.questions[index]) return;
    const text = String(value || '');
    state.ui.formDraft.questions[index].text = text;
    state.ui.formDraft.questions[index].label = text;
    state.ui.formDraft.questions[index].richText = sanitizeQuestionHtml(`<p>${escapeHtml(text)}</p>`);
    renderFormLivePreview();
}

function updateBuilderQuestionRichText(index, html) {
    ensureFormDraft();
    const q = state.ui.formDraft.questions[index];
    if (!q) return;
    const clean = sanitizeQuestionHtml(html);
    q.richText = clean;
    q.text = getTextFromQuestionHtml(clean);
    q.label = q.text;
    renderFormLivePreview();
}

function applyQuestionFormatControl(index, control, value) {
    const editor = document.getElementById('questionEditor-' + index);
    if (!editor) return;
    editor.focus();
    if (control === 'block') {
        document.execCommand('formatBlock', false, String(value || 'p'));
    } else if (control === 'font') {
        document.execCommand('fontName', false, String(value || 'Calibri'));
    } else if (control === 'size') {
        document.execCommand('fontSize', false, String(value || '3'));
    } else if (control === 'foreColor') {
        document.execCommand('foreColor', false, String(value || '#0b1f3a'));
    } else if (control === 'hiliteColor') {
        document.execCommand('hiliteColor', false, String(value || '#fff3a8'));
    }
    updateBuilderQuestionRichText(index, editor.innerHTML);
}

function getSelectedImageInEditor(index) {
    const editor = document.getElementById('questionEditor-' + index);
    if (!editor) return null;
    return editor.querySelector('img.question-inline-image.selected') || null;
}

function bindEditorImageSelection(index, ev) {
    const editor = document.getElementById('questionEditor-' + index);
    if (!editor) return;
    editor.querySelectorAll('img.question-inline-image').forEach(img => img.classList.remove('selected'));
    const target = ev && ev.target;
    if (target && target.tagName === 'IMG' && target.classList.contains('question-inline-image')) {
        target.classList.add('selected');
    }
}

function normalizeInlineImageSize(img) {
    if (!img) return;
    img.classList.add('question-inline-image');
    img.style.maxWidth = '100%';
    if (!img.style.width) img.style.width = '320px';
    img.style.height = 'auto';
    img.style.cursor = 'zoom-in';
}

async function handleQuestionEditorPaste(ev, index) {
    const items = Array.from(((ev || {}).clipboardData || {}).items || []);
    const imgItem = items.find(it => String((it || {}).type || '').startsWith('image/'));
    if (!imgItem) return;
    ev.preventDefault();
    const file = imgItem.getAsFile();
    if (!file) return;
    try {
        const raw = await readFileAsDataUrl(file);
        const compact = await compressImageDataUrl(raw, 1400, 0.78);
        const editor = document.getElementById('questionEditor-' + index);
        if (!editor) return;
        document.execCommand('insertHTML', false, `<img src="${compact}" alt="imagen" class="question-inline-image" style="width:320px;max-width:100%;height:auto;cursor:zoom-in">`);
        editor.querySelectorAll('img.question-inline-image').forEach(normalizeInlineImageSize);
        updateBuilderQuestionRichText(index, editor.innerHTML);
    } catch (e) {
        // ignore paste image error
    }
}

function formatBuilderQuestionText(index, action) {
    const editor = document.getElementById('questionEditor-' + index);
    if (!editor) return;
    editor.focus();
    if (action === 'ul') document.execCommand('insertUnorderedList');
    else if (action === 'ol') document.execCommand('insertOrderedList');
    else if (action === 'h2') document.execCommand('formatBlock', false, 'h2');
    else if (action === 'quote') document.execCommand('formatBlock', false, 'blockquote');
    else if (action === 'strike') document.execCommand('strikeThrough');
    else if (action === 'sup') document.execCommand('superscript');
    else if (action === 'sub') document.execCommand('subscript');
    else if (action === 'alignLeft') document.execCommand('justifyLeft');
    else if (action === 'alignCenter') document.execCommand('justifyCenter');
    else if (action === 'alignRight') document.execCommand('justifyRight');
    else if (action === 'justify') document.execCommand('justifyFull');
    else if (action === 'unlink') document.execCommand('unlink');
    else if (action === 'hr') document.execCommand('insertHorizontalRule');
    else if (action === 'undo') document.execCommand('undo');
    else if (action === 'redo') document.execCommand('redo');
    else if (action === 'imgLeft' || action === 'imgCenter' || action === 'imgRight') {
        const img = getSelectedImageInEditor(index);
        if (img) {
            img.style.display = 'block';
            img.style.marginTop = '8px';
            img.style.marginBottom = '8px';
            if (action === 'imgLeft') {
                img.style.marginLeft = '0';
                img.style.marginRight = 'auto';
            }
            if (action === 'imgCenter') {
                img.style.marginLeft = 'auto';
                img.style.marginRight = 'auto';
            }
            if (action === 'imgRight') {
                img.style.marginLeft = 'auto';
                img.style.marginRight = '0';
            }
        }
    }
    else if (action === 'imgGrow') {
        const img = getSelectedImageInEditor(index);
        if (img) {
            const current = parseInt(String(img.style.width || '320').replace('px', ''), 10) || 320;
            const next = Math.min(1800, Math.round(current * 1.2));
            img.style.width = next + 'px';
            img.style.maxWidth = '100%';
        } else {
            document.execCommand('fontSize', false, '4');
        }
    }
    else if (action === 'imgRemove') {
        const img = getSelectedImageInEditor(index);
        if (img) img.remove();
    }
    else if (action === 'link') {
        const url = prompt('Ingresa la URL');
        if (url) document.execCommand('createLink', false, url);
    } else if (action === 'clear') {
        document.execCommand('removeFormat');
        document.execCommand('unlink');
    } else {
        document.execCommand(action, false, null);
    }
    editor.querySelectorAll('img').forEach(normalizeInlineImageSize);
    updateBuilderQuestionRichText(index, editor.innerHTML);
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
        reader.readAsDataURL(file);
    });
}

function compressImageDataUrl(dataUrl, maxSide, quality) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const ratio = Math.min(1, (maxSide || 1200) / Math.max(img.width || 1, img.height || 1));
            const w = Math.max(1, Math.round((img.width || 1) * ratio));
            const h = Math.max(1, Math.round((img.height || 1) * ratio));
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(dataUrl);
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', quality || 0.72));
        };
        img.onerror = () => reject(new Error('No se pudo procesar la imagen'));
        img.src = dataUrl;
    });
}

async function addQuestionImages(index, files) {
    ensureFormDraft();
    const q = state.ui.formDraft.questions[index];
    if (!q) return;
    const current = normalizeQuestionImages(q.images);
    const slots = Math.max(0, 6 - current.length);
    const picked = Array.from(files || []).slice(0, slots);
    for (let i = 0; i < picked.length; i += 1) {
        try {
            const raw = await readFileAsDataUrl(picked[i]);
            const compact = await compressImageDataUrl(raw, 1100, 0.72);
            current.push({ id: 'img-' + Date.now() + '-' + i, name: picked[i].name || 'imagen', dataUrl: compact });
        } catch (e) {
            // skip invalid image
        }
    }
    q.images = current;
    renderFormBuilderQuestions();
}

function removeBuilderQuestionImage(index, imageId) {
    ensureFormDraft();
    const q = state.ui.formDraft.questions[index];
    if (!q) return;
    q.images = normalizeQuestionImages(q.images).filter(img => String(img.id) !== String(imageId));
    renderFormBuilderQuestions();
}

function openQuestionImagePreview(dataUrl) {
    const src = String(dataUrl || '');
    if (!src) return;
    const modal = document.getElementById('modalBackdrop');
    if (modal) {
        openModal('Imagen', `<div style="display:flex;justify-content:center"><img src="${escapeHtml(src)}" alt="Imagen" style="max-width:100%;max-height:75vh;border-radius:10px"></div>`);
        return;
    }
    window.open(src, '_blank');
}

function updateBuilderQuestionType(index, value) {
    ensureFormDraft();
    const q = state.ui.formDraft.questions[index];
    if (!q) return;
    q.type = String(value || 'open');
    if (!questionNeedsOptions(q.type)) q.options = [];
    if (questionNeedsOptions(q.type)) ensureQuestionHasOptions(q);
    renderFormBuilderQuestions();
}

function updateBuilderQuestionRequired(index, value) {
    ensureFormDraft();
    if (!state.ui.formDraft.questions[index]) return;
    state.ui.formDraft.questions[index].required = String(value) === 'true';
    renderFormLivePreview();
}

function updateBuilderQuestionOptions(index, value) {
    ensureFormDraft();
    if (!state.ui.formDraft.questions[index]) return;
    state.ui.formDraft.questions[index].options = String(value || '').split('\n').map(x => x.trim()).filter(Boolean);
    renderFormLivePreview();
}

function updateBuilderQuestionOptionText(index, optionIndex, value) {
    ensureFormDraft();
    const q = state.ui.formDraft.questions[index];
    if (!q || !questionNeedsOptions(q.type)) return;
    q.options[optionIndex] = String(value || '');
    renderFormLivePreview();
}

function addBuilderQuestionOption(index) {
    ensureFormDraft();
    const q = state.ui.formDraft.questions[index];
    if (!q || !questionNeedsOptions(q.type)) return;
    q.options = asArray(q.options);
    q.options.push('');
    renderFormBuilderQuestions();
}

function removeBuilderQuestionOption(index, optionIndex) {
    ensureFormDraft();
    const q = state.ui.formDraft.questions[index];
    if (!q || !questionNeedsOptions(q.type)) return;
    q.options = asArray(q.options).filter((_, idx) => idx !== optionIndex);
    if (!q.options.length) q.options = [''];
    renderFormBuilderQuestions();
}

function addBuilderQuestion() {
    ensureFormDraft();
    state.ui.formDraft.questions.push({
        id: 'q-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        label: '',
        text: '',
        richText: '',
        type: 'open',
        required: true,
        options: [],
        images: []
    });
    const total = state.ui.formDraft.questions.length;
    const pageSize = Math.max(1, parseInt(state.ui.formBuilderPageSize || '5', 10) || 5);
    state.ui.formBuilderPage = Math.max(1, Math.ceil(total / pageSize));
    renderFormBuilderQuestions();
}

function removeBuilderQuestion(index) {
    ensureFormDraft();
    state.ui.formDraft.questions = (state.ui.formDraft.questions || []).filter((_, idx) => idx !== index);
    renderFormBuilderQuestions();
}
function formBuilderPrevPage() {
    state.ui.formBuilderPage = Math.max(1, (state.ui.formBuilderPage || 1) - 1);
    renderFormBuilderQuestions();
}

function formBuilderNextPage() {
    state.ui.formBuilderPage = (state.ui.formBuilderPage || 1) + 1;
    renderFormBuilderQuestions();
}

async function saveFormBuilder() {
    ensureFormDraft();
    const type = getBuilderType();
    const titleInput = document.getElementById('formTitleInput');
    const title = String((titleInput || {}).value || '').trim() || (type === 'eval' ? 'Evaluacion docente' : 'Autoevaluacion');
    const sanitized = cloneQuestions(state.ui.formDraft.questions || []).map(q => ({ ...q, label: String(q.text || '').trim() })).filter(q => q.text);
    if (!sanitized.length) return showToast('Agrega al menos una pregunta valida', 'error');
    if (isBaseFormKey(type)) {
        state.forms[type] = sanitized;
        state.formsMeta[type] = { ...(state.formsMeta[type] || {}), title };
        const formId = state.formsMeta[type] && state.formsMeta[type].id;
        const payload = { type, title, questionsJson: JSON.stringify(sanitized) };
        try {
            if (formId && !isNaN(parseInt(formId, 10))) {
                await api('/api/evaluation-forms/' + parseInt(formId, 10), { method: 'PUT', headers: headers(), body: JSON.stringify(payload) });
            } else {
                const created = await api('/api/evaluation-forms', { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
                state.formsMeta[type] = { ...(state.formsMeta[type] || {}), title, id: created.id };
            }
        } catch (e) {
            showToast('Error al guardar formulario', 'error');
            return;
        }
    } else {
        const custom = getCustomFormByKey(type);
        if (!custom) return showToast('Formulario personalizado no encontrado', 'error');
        const audience = state.ui.formDraft.audience || { mode: 'registered', roles: [] };
        if (audience.mode === 'roles' && !asArray(audience.roles).length) {
            return showToast('Selecciona al menos un rol o usa "todos los registrados"/"cualquiera"', 'error');
        }
        custom.title = title;
        custom.questions = sanitized;
        custom.audience = {
            mode: String(audience.mode || 'registered'),
            roles: asArray(audience.roles).map(String)
        };
        saveStorage(STORAGE_KEYS.customForms, state.customForms);
    }
    state.ui.formDraft = {
        type,
        title,
        questions: cloneQuestions(sanitized),
        audience: {
            mode: String((((state.ui.formDraft || {}).audience || {}).mode) || 'registered'),
            roles: asArray(((state.ui.formDraft || {}).audience || {}).roles).map(String)
        }
    };
    renderFormBuilderQuestions();
    renderFormResponsesBoard();
    openFormPreviewPopup();
    showToast('Formulario actualizado', 'success');
}

function openFormBuilderWindow() {
    const url = new URL(window.location.href);
    url.searchParams.set('section', 'formularios');
    url.searchParams.set('builderFull', '1');
    const win = window.open(url.toString(), '_blank');
    if (!win) showToast('El navegador bloqueó la ventana. Habilita popups para este sitio.', 'error');
}

function applyBuilderFullscreenModeIfNeeded() {
    if (getSearchParam('builderFull') !== '1') return;
    document.body.classList.add('builder-fullscreen-mode');
    navigateTo('formularios');
}

function buildLivePreviewMarkup(questions) {
    return asArray(questions).map((q, idx) => {
        let input = '<div class="muted">Sin vista previa.</div>';
        if (q.type === 'binary') input = ['si', 'no'].map(v => `<label class="preview-option-row"><input type="radio" disabled><span>${v === 'si' ? 'Si' : 'No'}</span></label>`).join('');
        if (q.type === 'rating5') input = [1, 2, 3, 4, 5].map(v => `<label class="preview-option-row"><input type="radio" disabled><span>${v}</span></label>`).join('');
        if (q.type === 'rating10') input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => `<label class="preview-option-row"><input type="radio" disabled><span>${v}</span></label>`).join('');
        if (q.type === 'open') input = '<div class="preview-textarea">Respuesta abierta...</div>';
        if (questionNeedsOptions(q.type)) {
            const isMulti = q.type === 'multiselect';
            input = asArray(q.options).map(opt => `<label class="preview-option-row"><input type="${isMulti ? 'checkbox' : 'radio'}" disabled><span>${escapeHtml(opt || 'Opcion')}</span></label>`).join('') || '<div class="muted">Sin opciones configuradas.</div>';
        }
        return `<div class="form-preview-question"><div><strong>${idx + 1}. ${escapeHtml(questionDisplayLabel(q))}</strong>${q.required ? ' *' : ''}</div>${renderQuestionPrompt(q, 2)}${input}</div>`;
    }).join('');
}

function openFormPreviewPopup() {
    ensureFormDraft();
    const type = getBuilderType();
    const title = String((document.getElementById('formTitleInput') || {}).value || state.ui.formDraft.title || (type === 'eval' ? 'Evaluacion docente' : 'Autoevaluacion'));
    openModal('Previsualizacion del formulario', `<div class="form-live-preview"><div class="assign-head">${escapeHtml(title)}</div>${buildLivePreviewMarkup(state.ui.formDraft.questions || [])}</div>`);
}

function getPublicFormLink(type) {
    if (isBaseFormKey(type)) {
        showToast('Evaluación docente y autoevaluación se publican automáticamente en el área personal del estudiante.', 'info');
        return '';
    }
    const token = 'sh-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);
    state.formShares[token] = { type, expiresAt };
    saveStorage(STORAGE_KEYS.formShares, state.formShares);
    const url = new URL(window.location.href);
    url.searchParams.delete('builderFull');
    url.searchParams.delete('section');
    url.searchParams.set('publicForm', type);
    url.searchParams.set('token', token);
    return url.toString();
}

async function shareFormLink() {
    const type = getBuilderType();
    const link = getPublicFormLink(type);
    if (!link) return;
    const token = getSearchParam('token');
    const linkToken = new URL(link).searchParams.get('token') || token;
    const share = (state.formShares || {})[linkToken] || null;
    const exp = share && share.expiresAt ? new Date(share.expiresAt).toLocaleString('es-CO') : 'N/A';
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(link);
            showToast('Link copiado. Expira: ' + exp, 'success');
            return;
        }
    } catch (e) {
        // fallback to modal
    }
    openModal('Compartir formulario', `<div class="form-group"><label class="form-label">Copia este link</label><input class="form-input" value="${escapeHtml(link)}" readonly></div><div class="muted">Expira: ${escapeHtml(exp)}</div>`);
}

function renderFormResponsesBoard() {
    const host = document.getElementById('formResponsesBoard');
    if (!host) return;
    const type = getBuilderType();
    const questions = asArray((getActiveFormConfig() || {}).questions);
    const fromDate = String((document.getElementById('responsesFromDate') || {}).value || '');
    const toDate = String((document.getElementById('responsesToDate') || {}).value || '');
    const fromTime = fromDate ? new Date(fromDate + 'T00:00:00').getTime() : 0;
    const toTime = toDate ? new Date(toDate + 'T23:59:59').getTime() : Number.MAX_SAFE_INTEGER;
    const responses = asArray(state.formResponses)
        .filter(r => String(r.formType || '') === type)
        .filter(r => {
            const created = new Date(r.createdAt || 0).getTime();
            return created >= fromTime && created <= toTime;
        });
    if (!responses.length) {
        host.innerHTML = '<div class="muted">Sin respuestas para el filtro seleccionado.</div>';
        return;
    }
    const global = questions.map(q => {
        const counts = {};
        responses.forEach(r => {
            const value = (r.answers || {})[q.id];
            if (Array.isArray(value)) {
                value.forEach(item => {
                    const key = String(item || '');
                    if (key) counts[key] = (counts[key] || 0) + 1;
                });
                return;
            }
            const key = String(value || '').trim();
            if (key) counts[key] = (counts[key] || 0) + 1;
        });
        const chips = Object.keys(counts).length
            ? Object.keys(counts).map(k => `<span class="preview-chip">${escapeHtml(k)}: ${counts[k]}</span>`).join('')
            : '<span class="muted">Sin datos agregables.</span>';
        return `<div class="form-preview-question"><strong>${escapeHtml(questionDisplayLabel(q))}</strong><div class="muted">Resultados globales</div><div>${chips}</div></div>`;
    }).join('');
    const individual = responses.slice().reverse().slice(0, 30).map(r => {
        const who = escapeHtml(String(r.responder || 'Anonimo'));
        const when = r.createdAt ? new Date(r.createdAt).toLocaleString('es-CO') : '-';
        return `<div class="form-preview-question"><div style="font-weight:700">${who}</div><div class="muted">${escapeHtml(when)}</div></div>`;
    }).join('');
    host.innerHTML = `<div class="assign-head">Global (${responses.length})</div>${global}<div class="assign-head" style="margin-top:10px">Individuales</div>${individual}`;
}

function viewFormResponses() {
    renderFormResponsesBoard();
    const host = document.getElementById('formResponsesBoard');
    if (host) host.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function exportFormResponsesCsv() {
    const type = getBuilderType();
    const questionsById = {};
    asArray((getActiveFormConfig() || {}).questions).forEach(q => { questionsById[String(q.id)] = questionDisplayLabel(q); });
    const rows = ['formType,responder,fecha,preguntaId,respuesta'];
    asArray(state.formResponses)
        .filter(r => String(r.formType || '') === type)
        .forEach(r => {
            const answers = asObject(r.answers || {});
            Object.keys(answers).forEach(qid => {
                const value = answers[qid];
                const text = Array.isArray(value) ? value.join('|') : String(value || '');
                rows.push([
                    JSON.stringify(type),
                    JSON.stringify(String(r.responder || 'Anonimo')),
                    JSON.stringify(String(r.createdAt || '')),
                    JSON.stringify(String(qid) + ' - ' + String(questionsById[String(qid)] || 'Pregunta')),
                    JSON.stringify(text)
                ].join(','));
            });
        });
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respuestas-${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function setPublicResponderName(value) {
    publicFormRuntime.responder = String(value || '');
}

function setPublicAnswer(questionId, value) {
    publicFormRuntime.answers[String(questionId)] = value;
}

function togglePublicMultiAnswer(questionId, option, checked) {
    const key = String(questionId);
    const arr = asArray(publicFormRuntime.answers[key]).map(String);
    const val = String(option || '');
    const idx = arr.indexOf(val);
    if (checked && idx < 0) arr.push(val);
    if (!checked && idx >= 0) arr.splice(idx, 1);
    publicFormRuntime.answers[key] = arr;
}

function publicFormPrevPage() {
    publicFormRuntime.page = Math.max(1, (publicFormRuntime.page || 1) - 1);
    renderPublicFormPageContent();
}

function publicFormNextPage() {
    const totalPages = Math.max(1, Math.ceil(asArray(publicFormRuntime.questions).length / Math.max(1, publicFormRuntime.pageSize || 5)));
    publicFormRuntime.page = Math.min(totalPages, (publicFormRuntime.page || 1) + 1);
    renderPublicFormPageContent();
}

function submitPublicForm(type) {
    const questions = asArray(publicFormRuntime.questions);
    const responder = String(publicFormRuntime.responder || '').trim() || 'Anonimo';
    const answers = asObject(publicFormRuntime.answers);
    for (const q of questions) {
        const value = answers[q.id];
        const empty = Array.isArray(value) ? value.length === 0 : String(value || '').trim() === '';
        if (q.required !== false && empty) {
            showToast('Responde todas las preguntas obligatorias.', 'warning');
            return;
        }
    }
    state.formResponses.push({
        id: 'resp-' + Date.now(),
        formType: type,
        responder,
        answers,
        createdAt: new Date().toISOString()
    });
    saveStorage(STORAGE_KEYS.formResponses, state.formResponses);
    showToast('Respuesta enviada. Gracias.', 'success');
}

function renderPublicFormPageContent() {
    const questions = asArray(publicFormRuntime.questions);
    const pageSize = Math.max(1, publicFormRuntime.pageSize || 5);
    const totalPages = Math.max(1, Math.ceil(questions.length / pageSize));
    publicFormRuntime.page = Math.max(1, Math.min(totalPages, publicFormRuntime.page || 1));
    const start = (publicFormRuntime.page - 1) * pageSize;
    const pageItems = questions.slice(start, start + pageSize);
    const body = pageItems.map(q => {
        const key = String(q.id);
        const current = publicFormRuntime.answers[key];
        let input = '';
        if (q.type === 'open') {
            input = `<textarea id="pub-${q.id}" class="form-input" rows="3" oninput="setPublicAnswer('${String(q.id)}', this.value)">${escapeHtml(String(current || ''))}</textarea>`;
        }
        if (q.type === 'rating5') {
            input = [1, 2, 3, 4, 5].map(n => `<label class="preview-option-row"><input type="radio" name="pub-${q.id}" value="${n}" ${String(current || '') === String(n) ? 'checked' : ''} onchange="setPublicAnswer('${String(q.id)}', '${n}')"><span>${n}</span></label>`).join('');
        }
        if (q.type === 'rating10') {
            input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<label class="preview-option-row"><input type="radio" name="pub-${q.id}" value="${n}" ${String(current || '') === String(n) ? 'checked' : ''} onchange="setPublicAnswer('${String(q.id)}', '${n}')"><span>${n}</span></label>`).join('');
        }
        if (q.type === 'binary') {
            input = ['si', 'no'].map(v => `<label class="preview-option-row"><input type="radio" name="pub-${q.id}" value="${v}" ${String(current || '') === v ? 'checked' : ''} onchange="setPublicAnswer('${String(q.id)}', '${v}')"><span>${v === 'si' ? 'Si' : 'No'}</span></label>`).join('');
        }
        if (q.type === 'single') {
            input = asArray(q.options).map(v => `<label class="preview-option-row"><input type="radio" name="pub-${q.id}" value="${escapeHtml(v)}" ${String(current || '') === String(v) ? 'checked' : ''} onchange="setPublicAnswer('${String(q.id)}', ${JSON.stringify(String(v))})"><span>${escapeHtml(v)}</span></label>`).join('');
        }
        if (q.type === 'multiselect') {
            const selected = new Set(asArray(current).map(String));
            input = asArray(q.options).map(v => `<label class="preview-option-row"><input type="checkbox" name="pub-${q.id}" value="${escapeHtml(v)}" ${selected.has(String(v)) ? 'checked' : ''} onchange="togglePublicMultiAnswer('${String(q.id)}', ${JSON.stringify(String(v))}, this.checked)"><span>${escapeHtml(v)}</span></label>`).join('');
        }
        return `<div class="form-preview-question"><div><strong>${escapeHtml(questionDisplayLabel(q))}</strong>${q.required ? ' *' : ''}</div>${renderQuestionPrompt(q, 3)}<div style="margin-top:8px">${input}</div></div>`;
    }).join('') || '<div class="muted">No hay preguntas publicadas para este formulario.</div>';

    document.body.innerHTML = `
        <div style="max-width:920px;margin:20px auto;padding:0 16px">
            <div class="card">
                <div class="card-header"><span class="card-title">${escapeHtml(publicFormRuntime.title || 'Formulario')}</span></div>
                <div class="card-body">
                    <div class="form-group"><label class="form-label">Nombre (opcional)</label><input id="publicResponderName" class="form-input" value="${escapeHtml(publicFormRuntime.responder || '')}" placeholder="Tu nombre" oninput="setPublicResponderName(this.value)"></div>
                    ${body}
                    <div class="pager" style="margin-top:10px"><button class="btn btn-sm btn-outline" ${publicFormRuntime.page <= 1 ? 'disabled' : ''} onclick="publicFormPrevPage()">Anterior</button><span>${publicFormRuntime.page}/${totalPages}</span><button class="btn btn-sm btn-outline" ${publicFormRuntime.page >= totalPages ? 'disabled' : ''} onclick="publicFormNextPage()">Siguiente</button></div>
                    <div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn btn-teal" onclick="submitPublicForm('${publicFormRuntime.type}')">Enviar respuestas</button></div>
                </div>
            </div>
        </div>
    `;
}

function renderPublicFormPage(type) {
    if (isBaseFormKey(type)) {
        document.body.innerHTML = '<div style="max-width:720px;margin:50px auto;padding:0 16px"><div class="card"><div class="card-body"><div class="alert alert-info">Este formulario ya está disponible automáticamente para estudiantes autenticados en el área personal.</div></div></div></div>';
        return;
    }
    if (!isCustomFormKey(type)) return;
    const token = getSearchParam('token');
    const share = (state.formShares || {})[token] || null;
    if (!share || String(share.type || '') !== String(type) || (parseInt(share.expiresAt || '0', 10) || 0) < Date.now()) {
        document.body.innerHTML = '<div style="max-width:720px;margin:50px auto;padding:0 16px"><div class="card"><div class="card-body"><div class="alert alert-error">Este enlace no es válido o ya expiró.</div></div></div></div>';
        return;
    }
    const custom = getCustomFormByKey(type);
    if (!custom) {
        document.body.innerHTML = '<div style="max-width:720px;margin:50px auto;padding:0 16px"><div class="card"><div class="card-body"><div class="alert alert-error">Formulario personalizado no encontrado.</div></div></div></div>';
        return;
    }
    const title = String(custom.title || 'Formulario personalizable');
    const questions = asArray(custom.questions || []);
    const audience = custom.audience || { mode: 'registered', roles: [] };
    const activeUser = getActiveUser();
    if (audience.mode === 'registered' && !activeUser) {
        document.body.innerHTML = '<div style="max-width:720px;margin:50px auto;padding:0 16px"><div class="card"><div class="card-body"><div class="alert alert-error">Debes iniciar sesión con un usuario registrado para responder este formulario.</div></div></div></div>';
        return;
    }
    if (audience.mode === 'roles') {
        if (!activeUser) {
            document.body.innerHTML = '<div style="max-width:720px;margin:50px auto;padding:0 16px"><div class="card"><div class="card-body"><div class="alert alert-error">Debes iniciar sesión para responder este formulario.</div></div></div></div>';
            return;
        }
        const roleName = String((((activeUser || {}).role || {}).name) || '');
        const allowedRoles = asArray(audience.roles).map(String);
        if (!allowedRoles.includes(roleName)) {
            document.body.innerHTML = '<div style="max-width:720px;margin:50px auto;padding:0 16px"><div class="card"><div class="card-body"><div class="alert alert-error">Tu rol no tiene acceso a este formulario.</div></div></div></div>';
            return;
        }
    }
    publicFormRuntime.type = type;
    publicFormRuntime.title = title;
    publicFormRuntime.questions = questions;
    publicFormRuntime.page = 1;
    publicFormRuntime.answers = {};
    publicFormRuntime.responder = '';
    renderPublicFormPageContent();
}

function showPublicSurveyModal(htmlContent, onCloseAction) {
    let overlay = document.getElementById('publicSurveyModal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'publicSurveyModal';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(11,31,58,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .25s ease';
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
        <div style="background:#fff;border-radius:14px;box-shadow:0 24px 64px rgba(11,31,58,0.28);max-width:420px;width:100%;max-height:90vh;overflow:auto;transform:scale(.94);transition:transform .25s ease" id="publicSurveyModalBox">
            <div style="padding:28px 22px">${htmlContent}</div>
        </div>
    `;
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        document.getElementById('publicSurveyModalBox').style.transform = 'scale(1)';
    });
    overlay.onclick = function(e) {
        if (e.target === overlay) closePublicSurveyModal(onCloseAction);
    };
}

function closePublicSurveyModal(onCloseAction) {
    const overlay = document.getElementById('publicSurveyModal');
    if (!overlay) return;
    overlay.style.opacity = '0';
    const box = document.getElementById('publicSurveyModalBox');
    if (box) box.style.transform = 'scale(.94)';
    setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (onCloseAction) onCloseAction();
    }, 260);
}

function showVoteSuccessModal(message, onClose) {
    const html = `
        <div style="text-align:center">
            <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);display:flex;align-items:center;justify-content:center;margin:0 auto 18px;box-shadow:0 8px 24px rgba(16,185,129,0.28)">
                <svg width="36" height="36" fill="none" stroke="#fff" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:700;color:var(--text-dark);margin-bottom:8px">¡Gracias!</div>
            <div style="font-size:15px;color:var(--text-body);max-width:320px;margin:0 auto;line-height:1.5">${escapeHtml(message || 'Tu voto ha sido registrado correctamente.')}</div>
            <button class="btn btn-teal" style="margin-top:22px;min-width:140px" onclick="closePublicSurveyModal(function(){${onClose ? onClose : ''}})">Aceptar</button>
        </div>
    `;
    showPublicSurveyModal(html);
}

function showAlreadyVotedModal(message, onClose) {
    const html = `
        <div style="text-align:center">
            <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#2563eb);display:flex;align-items:center;justify-content:center;margin:0 auto 18px;box-shadow:0 8px 24px rgba(59,130,246,0.28)">
                <svg width="36" height="36" fill="none" stroke="#fff" stroke-width="3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:700;color:var(--text-dark);margin-bottom:8px">Voto registrado</div>
            <div style="font-size:15px;color:var(--text-body);max-width:320px;margin:0 auto;line-height:1.5">${escapeHtml(message || 'Ya has participado en esta encuesta.')}</div>
            <button class="btn btn-primary" style="margin-top:22px;min-width:140px" onclick="closePublicSurveyModal(function(){${onClose ? onClose : ''}})">Aceptar</button>
        </div>
    `;
    showPublicSurveyModal(html);
}

function showVoteErrorModal(message, onClose) {
    const html = `
        <div style="text-align:center">
            <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#ef4444,#dc2626);display:flex;align-items:center;justify-content:center;margin:0 auto 18px;box-shadow:0 8px 24px rgba(239,68,68,0.28)">
                <svg width="36" height="36" fill="none" stroke="#fff" stroke-width="3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:700;color:var(--text-dark);margin-bottom:8px">No se pudo votar</div>
            <div style="font-size:15px;color:var(--text-body);max-width:320px;margin:0 auto;line-height:1.5">${escapeHtml(message || 'Ocurrió un error al registrar tu voto.')}</div>
            <button class="btn btn-outline" style="margin-top:22px;min-width:140px" onclick="closePublicSurveyModal(function(){${onClose ? onClose : ''}})">Aceptar</button>
        </div>
    `;
    showPublicSurveyModal(html);
}

async function submitPublicSurveyVote(surveyId) {
    const survey = asArray(state.surveys).find(s => String(s.id) === String(surveyId));
    const roleName = getActiveUserRoleName();
    const optionId = String(modalState.surveyVoteSelections[String(surveyId)] || '');
    if (!optionId) {
        showVoteErrorModal('Selecciona una opción antes de registrar tu voto.');
        return;
    }
    const result = await registerVoteForSurvey(survey, roleName, optionId);
    if (!result.ok) {
        const msg = result.message || '';
        const isAlreadyVoted = msg.toLowerCase().includes('ya registraste') || msg.toLowerCase().includes('already voted');
        if (isAlreadyVoted) {
            showAlreadyVotedModal('Ya has emitido tu voto en esta encuesta. No es posible votar más de una vez.', "renderPublicSurveyPage('" + escapeJsSingle(String(surveyId || '')) + "')");
        } else {
            showVoteErrorModal(msg || 'No se pudo registrar el voto. Intenta de nuevo más tarde.');
        }
        return;
    }
    showVoteSuccessModal('¡Gracias! Tu voto ha sido registrado correctamente.', "renderPublicSurveyPage('" + escapeJsSingle(String(surveyId || '')) + "')");
}

function getPublicSurveyVotePage(surveyId, totalPages) {
    const sid = String(surveyId || '');
    const safeTotal = Math.max(1, parseInt(totalPages || '1', 10) || 1);
    const current = parseInt((modalState.surveyVotePages || {})[sid] || '1', 10) || 1;
    return Math.max(1, Math.min(safeTotal, current));
}

function setPublicSurveyVotePage(surveyId, page) {
    const sid = String(surveyId || '');
    if (!sid) return;
    modalState.surveyVotePages[sid] = Math.max(1, parseInt(page || '1', 10) || 1);
    renderPublicSurveyPage(sid);
}

function renderPublicSurveyLiveBars(survey) {
    const options = asArray((survey || {}).options);
    if (!options.length) return '<div class="muted">Aun no hay opciones disponibles en esta encuesta.</div>';
    const bars = renderSurveyBars(survey);
    return bars || '<div class="muted">Aun no hay votos registrados.</div>';
}

function getSurveyLiveSignature(survey) {
    if (!survey) return '';
    const opts = asArray(survey.options).map(opt => `${String(opt.id || '')}:${parseInt(opt.votes || '0', 10) || 0}`).join('|');
    return [
        String(survey.id || ''),
        String(survey.status || ''),
        String(survey.startsAt || ''),
        String(survey.endsAt || ''),
        opts
    ].join('#');
}

function renderStorageMonitorSection() {
    const panel = document.getElementById('storageMonitorPanel');
    if (!panel) return;
    if (!storageMonitorState.timer) {
        storageMonitorState.timer = setInterval(() => loadStorageDetails(false), storageMonitorState.refreshMs);
    }
    loadStorageDetails(true);
    loadStorageSettings();
}

async function loadStorageDetails(force) {
    if (storageMonitorState.loading) return;
    const now = Date.now();
    if (!force && storageMonitorState.lastLoaded && (now - storageMonitorState.lastLoaded) < (storageMonitorState.refreshMs / 2)) {
        return;
    }
    storageMonitorState.loading = true;
    try {
        storageMonitorState.details = await api('/api/admin/storage/details');
        storageMonitorState.lastLoaded = Date.now();
        renderStorageMonitorPanel();
    } catch (e) {
        // Evitar spam: solo avisar si no hay datos previos.
        if (!storageMonitorState.details) {
            showToast('No se pudieron cargar métricas de almacenamiento.', 'error');
        }
    } finally {
        storageMonitorState.loading = false;
    }
}

function renderStorageMonitorPanel() {
    const data = storageMonitorState.details;
    if (!data) return;

    const summary = data.summary || {};
    const used = Math.max(0, Number(summary.totalBytesUsed) || 0);
    const limit = Math.max(0, Number(summary.totalBytesLimit) || 0);
    const pct = limit > 0 ? (used / limit) * 100 : 0;
    const usageText = document.getElementById('storageUsageText');
    if (usageText) {
        usageText.textContent = limit > 0
            ? `${formatBytes(used)} / ${formatBytes(limit)} (${pct.toFixed(1)}%)`
            : `${formatBytes(used)} usados`;
    }
    const usageBar = document.getElementById('storageUsageBar');
    if (usageBar) {
        const fillPct = clampPercent(pct);
        usageBar.style.width = `${fillPct}%`;
        usageBar.className = `progress-bar-fill ${fillPct >= 90 ? 'danger' : (fillPct >= 75 ? 'warning' : '')}`;
    }

    const compressedCount = Number(summary.compressedFilesCount) || 0;
    const compressionRatio = (Number(summary.compressionRatio) || 0) * 100;
    const statCompression = document.getElementById('statCompression');
    if (statCompression) statCompression.textContent = `${compressedCount} · ${compressionRatio.toFixed(1)}%`;
    const statOrphaned = document.getElementById('statOrphaned');
    if (statOrphaned) statOrphaned.textContent = String(Number(summary.orphanedFiles) || 0);
    const statDedupSavings = document.getElementById('statDedupSavings');
    if (statDedupSavings) statDedupSavings.textContent = formatBytes(Number(summary.deduplicationSavings) || 0);
    const statAuditLogs = document.getElementById('statAuditLogs');
    if (statAuditLogs) statAuditLogs.textContent = `${Number(summary.auditLogsCount) || 0} · ${formatBytes(Number(summary.auditLogsSizeEstimate) || 0)}`;

    const byTypeHost = document.getElementById('storageByType');
    if (byTypeHost) {
        const rows = asArray(data.byFileType).map(item => {
            const pctVal = clampPercent(item.percentage);
            return `<div class="storage-chart-row"><div class="storage-chart-label">${escapeHtml(item.extension || 'Otro')}</div><div class="storage-chart-bar-wrap"><div class="storage-chart-bar" style="width:${pctVal}%"></div></div><div class="storage-chart-value">${formatBytes(Number(item.totalSize) || 0)}</div></div>`;
        });
        byTypeHost.innerHTML = rows.length ? rows.join('') : '<div class="muted">Sin datos de tipos.</div>';
    }

    const byModuleHost = document.getElementById('storageByModule');
    if (byModuleHost) {
        const rows = asArray(data.byModule).map(item => {
            const pctVal = clampPercent(item.percentage);
            const label = escapeHtml(item.entityType || 'Zona');
            return `<div class="storage-chart-row"><div class="storage-chart-label" title="${label}">${label}</div><div class="storage-chart-bar-wrap"><div class="storage-chart-bar" style="width:${pctVal}%"></div></div><div class="storage-chart-value">${formatBytes(Number(item.totalSize) || 0)}</div></div>`;
        });
        byModuleHost.innerHTML = rows.length ? rows.join('') : '<div class="muted">Sin datos por zona.</div>';
    }

    renderStoragePieChart(data.byModule);
    renderCleanupModuleCards(data.byModule);

    const topFilesHost = document.getElementById('storageTopFiles');
    if (topFilesHost) {
        const rows = asArray(data.topFiles).map(item => {
            const pctVal = clampPercent(item.percentage);
            const name = escapeHtml(item.fileName || 'Archivo');
            const refs = Number(item.referenceCount) || 0;
            const zones = asArray(item.entityTypes).length ? asArray(item.entityTypes).map(z => escapeHtml(z)).join(', ') : 'N/A';
            return `<div class="storage-topfile-item">
                <div class="storage-topfile-head">
                    <div class="storage-topfile-name" title="${name}">${name}</div>
                    <div class="storage-topfile-meta">${formatBytes(Number(item.storedSize) || 0)} · ${refs} refs · ${zones}</div>
                </div>
                <div class="storage-topfile-bar-wrap"><div class="storage-topfile-bar" style="width:${pctVal}%"></div></div>
            </div>`;
        });
        topFilesHost.innerHTML = rows.length ? `<div class="storage-topfile-list">${rows.join('')}</div>` : '<div class="muted">Sin datos de archivos.</div>';
    }

    const dailyHost = document.getElementById('storageDailyChart');
    if (dailyHost) {
        const series = asArray(data.last7Days);
        const maxVal = Math.max(1, ...series.map(d => Number(d.bytesAdded) || 0));
        dailyHost.innerHTML = series.length ? `<div class="storage-daily-chart">${series.map(d => {
            const val = Math.max(0, Number(d.bytesAdded) || 0);
            const height = Math.round((val / maxVal) * 100);
            const label = String(d.date || '').slice(5) || 'N/A';
            return `<div class="storage-daily-col" title="${formatBytes(val)}"><div class="storage-daily-bar" style="height:${height}%"></div><div class="storage-daily-label">${escapeHtml(label)}</div></div>`;
        }).join('')}</div>` : '<div class="muted">Sin datos recientes.</div>';
    }

    const retentionInfo = document.getElementById('storageRetentionInfo');
    if (retentionInfo) {
        const retention = data.retention || {};
        retentionInfo.textContent = `Auditoría: ${retention.auditRetentionDays || 0} días · Entregas: ${retention.submissionRetentionDays || 0} días · Certificados: ${retention.certificateRetentionDays || 0} días`;
    }
    const alertsHost = document.getElementById('storageAlerts');
    if (alertsHost) {
        const alerts = asArray(data.alerts);
        alertsHost.innerHTML = alerts.length
            ? alerts.map(a => `<div class="storage-alert ${escapeHtml(a.level || 'info')}"><strong>${escapeHtml(a.title || 'ALERTA')}</strong> · ${escapeHtml(a.message || '')}</div>`).join('')
            : '<div class="muted">Sin alertas activas.</div>';
    }
}

function renderStoragePieChart(moduleData) {
    const canvas = document.getElementById('storagePieChart');
    const tooltip = document.getElementById('storagePieTooltip');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const items = asArray(moduleData).filter(m => Number(m.totalSize) > 0);
    if (!items.length) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Sin datos', canvas.width / 2, canvas.height / 2);
        return;
    }

    const colors = [
        '#0b2138', '#1a4a7a', '#b8933a', '#10b981', '#ef4444',
        '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#6366f1'
    ];

    const total = items.reduce((s, it) => s + (Number(it.totalSize) || 0), 0);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(cx, cy) - 14;
    const innerRadius = radius * 0.45;

    let startAngle = -0.5 * Math.PI;
    const slices = items.map((it, i) => {
        const size = Number(it.totalSize) || 0;
        const angle = (size / total) * 2 * Math.PI;
        const endAngle = startAngle + angle;
        const slice = {
            entityType: String(it.entityType || 'Otro'),
            totalSize: size,
            percentage: total > 0 ? (size / total) * 100 : 0,
            color: colors[i % colors.length],
            startAngle,
            endAngle,
            midAngle: startAngle + angle / 2
        };
        startAngle = endAngle;
        return slice;
    });

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        slices.forEach(s => {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, s.startAngle, s.endAngle);
            ctx.closePath();
            ctx.fillStyle = s.color;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#fff';
            ctx.stroke();
        });
        // donut hole
        ctx.beginPath();
        ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // center text
        ctx.fillStyle = '#0b2138';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(formatBytes(total), cx, cy - 7);
        ctx.fillStyle = '#64748b';
        ctx.font = '10px sans-serif';
        ctx.fillText('Total', cx, cy + 8);
    }
    draw();

    let activeIndex = -1;
    function hitTest(ev) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (ev.clientX - rect.left) * scaleX - cx;
        const y = (ev.clientY - rect.top) * scaleY - cy;
        const dist = Math.sqrt(x * x + y * y);
        if (dist < innerRadius || dist > radius) return -1;
        let angle = Math.atan2(y, x);
        if (angle < -0.5 * Math.PI) angle += 2 * Math.PI;
        if (angle < -0.5 * Math.PI) angle += 2 * Math.PI; // normalize
        // Adjust because startAngle starts at -0.5 PI
        const norm = angle + 0.5 * Math.PI;
        let acc = 0;
        for (let i = 0; i < slices.length; i++) {
            const sliceAngle = slices[i].endAngle - slices[i].startAngle;
            if (norm >= acc && norm < acc + sliceAngle) return i;
            acc += sliceAngle;
        }
        return -1;
    }

    canvas.onmousemove = function(ev) {
        const idx = hitTest(ev);
        if (idx !== activeIndex) {
            activeIndex = idx;
            draw();
            if (idx >= 0) {
                const s = slices[idx];
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, radius + 4, s.startAngle, s.endAngle);
                ctx.closePath();
                ctx.fillStyle = s.color;
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#fff';
                ctx.stroke();
                // redraw hole
                ctx.beginPath();
                ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.fillStyle = '#0b2138';
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(formatBytes(total), cx, cy - 7);
                ctx.fillStyle = '#64748b';
                ctx.font = '10px sans-serif';
                ctx.fillText('Total', cx, cy + 8);
            }
        }
        if (idx >= 0 && tooltip) {
            const s = slices[idx];
            tooltip.style.display = 'block';
            tooltip.textContent = `${escapeHtml(s.entityType)}: ${formatBytes(s.totalSize)} (${s.percentage.toFixed(1)}%)`;
            const rect = canvas.getBoundingClientRect();
            const wrap = canvas.parentElement.getBoundingClientRect();
            tooltip.style.left = (ev.clientX - wrap.left + 12) + 'px';
            tooltip.style.top = (ev.clientY - wrap.top - 8) + 'px';
        } else if (tooltip) {
            tooltip.style.display = 'none';
        }
    };

    canvas.onmouseleave = function() {
        activeIndex = -1;
        if (tooltip) tooltip.style.display = 'none';
        draw();
    };
}

let storageCleanupPreviewData = [];
let cleanupSort = 'sizeDesc';
let cleanupPage = 1;
let cleanupPageSize = 20;
let cleanupSelectedIds = new Set();
let cleanupTotalCount = 0;
let cleanupTotalPages = 1;

function getCleanupItemKey(item) {
    return String(item.storedFileId || '') + ':' + String(item.entityType || 'UNKNOWN') + ':' + String(item.entityId || '');
}

function getCleanupFilters() {
    const modules = Array.from(document.querySelectorAll('.cleanup-module:checked')).map(cb => cb.value);
    const minSizeVal = parseFloat(document.getElementById('cleanupMinSize').value || '0') || 0;
    const unit = parseInt(document.getElementById('cleanupSizeUnit').value || '1024', 10) || 1024;
    const minSizeBytes = Math.floor(minSizeVal * unit);
    const olderThan = parseInt(document.getElementById('cleanupOlderThan').value || '0', 10) || 0;
    return { modules, minSizeBytes, olderThanDays: olderThan > 0 ? olderThan : null };
}

async function previewStorageCleanup(targetPage) {
    const { modules, minSizeBytes, olderThanDays } = getCleanupFilters();
    const params = new URLSearchParams();
    modules.forEach(m => params.append('modules', m));
    if (minSizeBytes > 0) params.set('minSizeBytes', String(minSizeBytes));
    if (olderThanDays) params.set('olderThanDays', String(olderThanDays));
    params.set('includeOrphaned', 'true');
    params.set('includeEmbedded', 'true');
    params.set('page', String(targetPage || 1));
    params.set('pageSize', String(cleanupPageSize));

    try {
        const response = await api('/api/admin/storage/files?' + params.toString());
        storageCleanupPreviewData = asArray(response.items);
        cleanupTotalCount = response.totalCount || 0;
        cleanupTotalPages = response.totalPages || 1;
        cleanupPage = response.page || 1;
        cleanupSelectedIds.clear();
        renderCleanupPreview(storageCleanupPreviewData);
    } catch (e) {
        showToast('Error cargando vista previa: ' + (e.message || ''), 'error');
    }
}

function sortCleanupPreview(sortBy) {
    cleanupSort = sortBy;
    storageCleanupPreviewData.sort((a, b) => {
        switch (cleanupSort) {
            case 'sizeDesc': return (Number(b.sizeBytes) || 0) - (Number(a.sizeBytes) || 0);
            case 'sizeAsc': return (Number(a.sizeBytes) || 0) - (Number(b.sizeBytes) || 0);
            case 'name': return String(a.fileName || '').localeCompare(String(b.fileName || ''));
            case 'module': return String(a.entityType || '').localeCompare(String(b.entityType || ''));
            case 'date': return String(b.uploadedAt || '').localeCompare(String(a.uploadedAt || ''));
            default: return 0;
        }
    });
    renderCleanupPreview(storageCleanupPreviewData);
}

function toggleSelectAllCleanup(checked) {
    storageCleanupPreviewData.forEach(item => {
        const key = getCleanupItemKey(item);
        if (checked) cleanupSelectedIds.add(key); else cleanupSelectedIds.delete(key);
    });
    renderCleanupPreview(storageCleanupPreviewData);
    updateCleanupSelectionCount();
}

function onCleanupItemCheck(itemKey, checked) {
    if (checked) cleanupSelectedIds.add(itemKey); else cleanupSelectedIds.delete(itemKey);
    updateCleanupSelectionCount();
    const allPageSelected = storageCleanupPreviewData.length > 0 && storageCleanupPreviewData.every(it => cleanupSelectedIds.has(getCleanupItemKey(it)));
    const selectAll = document.getElementById('cleanupSelectAll');
    if (selectAll) selectAll.checked = allPageSelected;
}

function updateCleanupSelectionCount() {
    const el = document.getElementById('cleanupSelectedCount');
    if (el) el.textContent = cleanupSelectedIds.size + ' seleccionado' + (cleanupSelectedIds.size !== 1 ? 's' : '');
}

function renderCleanupPagination() {
    const host = document.getElementById('cleanupPagination');
    if (!host) return;
    if (cleanupTotalPages <= 1) { host.innerHTML = ''; return; }

    let html = '<div class="cleanup-pagination">';
    html += '<button class="btn btn-sm btn-ghost" ' + (cleanupPage <= 1 ? 'disabled' : 'onclick="changeCleanupPage(' + (cleanupPage - 1) + ')"') + '>&laquo; Ant.</button>';
    html += '<span class="cleanup-page-info">Página <strong>' + cleanupPage + '</strong> de ' + cleanupTotalPages + ' (' + cleanupTotalCount + ' archivos)</span>';
    html += '<button class="btn btn-sm btn-ghost" ' + (cleanupPage >= cleanupTotalPages ? 'disabled' : 'onclick="changeCleanupPage(' + (cleanupPage + 1) + ')"') + '>Sig. &raquo;</button>';
    html += '<select class="form-input" style="min-width:70px;padding:4px 8px;font-size:12px" onchange="setCleanupPageSize(this.value)">'
        + '<option value="10"' + (cleanupPageSize == 10 ? ' selected' : '') + '>10</option>'
        + '<option value="20"' + (cleanupPageSize == 20 ? ' selected' : '') + '>20</option>'
        + '<option value="50"' + (cleanupPageSize == 50 ? ' selected' : '') + '>50</option>'
        + '<option value="100"' + (cleanupPageSize == 100 ? ' selected' : '') + '>100</option>'
        + '</select>';
    html += '</div>';
    host.innerHTML = html;
}

function changeCleanupPage(page) {
    previewStorageCleanup(page);
}

function setCleanupPageSize(size) {
    cleanupPageSize = parseInt(size, 10) || 20;
    previewStorageCleanup(1);
}

function renderCleanupPreview(items) {
    const listHost = document.getElementById('storageCleanupList');
    const summary = document.getElementById('storageCleanupSummary');
    const toolbar = document.getElementById('cleanupToolbar');
    if (!listHost) return;

    const pageItems = asArray(items);
    const totalBytes = pageItems.reduce((s, it) => s + (Number(it.sizeBytes) || 0), 0);
    if (summary) {
        summary.textContent = cleanupTotalCount + ' archivos encontrados · ' + formatBytes(totalBytes) + ' en esta página';
    }

    if (!pageItems.length) {
        if (toolbar) toolbar.style.display = 'none';
        listHost.innerHTML = '<div class="muted" style="padding:12px 0">Ningun archivo coincide con los filtros.</div>';
        renderCleanupPagination();
        return;
    }

    if (toolbar) toolbar.style.display = 'flex';

    const allPageSelected = pageItems.length > 0 && pageItems.every(it => cleanupSelectedIds.has(getCleanupItemKey(it)));
    const selectAll = document.getElementById('cleanupSelectAll');
    if (selectAll) selectAll.checked = allPageSelected;

    const rows = pageItems.map(item => {
        const name = escapeHtml(item.fileName || 'Archivo');
        const type = escapeHtml(item.entityType || 'Otro');
        const size = formatBytes(Number(item.sizeBytes) || 0);
        const embedded = item.embedded ? '<span class="cleanup-file-tag warn">embebido</span>' : '';
        const refs = item.referenceCount != null ? '<span class="cleanup-file-tag">' + item.referenceCount + ' refs</span>' : '';
        const date = item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString() : '';
        const key = getCleanupItemKey(item);
        const checked = cleanupSelectedIds.has(key) ? 'checked' : '';
        return '<div class="cleanup-file-item ' + (cleanupSelectedIds.has(key) ? 'selected' : '') + '">'
            + '<input type="checkbox" class="cleanup-select cleanup-file-checkbox" ' + checked + ' onchange="onCleanupItemCheck(\'' + key + '\', this.checked)">'
            + '<div class="cleanup-file-info">'
            + '<div class="cleanup-file-name" title="' + name + '">' + name + '</div>'
            + '<div class="cleanup-file-tags">'
            + '<span class="cleanup-file-tag">' + type + '</span>'
            + embedded
            + refs
            + '</div></div>'
            + '<div class="cleanup-file-size">' + size + '</div>'
            + '<div class="cleanup-file-date">' + date + '</div>'
            + '</div>';
    });
    listHost.innerHTML = '<div class="cleanup-file-list">' + rows.join('') + '</div>';
    renderCleanupPagination();
    updateCleanupSelectionCount();
}

async function runStorageCleanup() {
    const { modules, minSizeBytes, olderThanDays } = getCleanupFilters();
    const previewCount = storageCleanupPreviewData.length;
    if (!previewCount) {
        showToast('Primero usa "Vista previa" para revisar los archivos a limpiar.', 'info');
        return;
    }
    const totalBytes = storageCleanupPreviewData.reduce((s, it) => s + (Number(it.sizeBytes) || 0), 0);
    const selectedCount = cleanupSelectedIds.size;
    const extra = selectedCount > 0 ? ' (' + selectedCount + ' seleccionados)' : '';

    openConfirmModal('Confirmar limpieza',
        'Se eliminaran archivos de los modulos seleccionados (' + previewCount + ' archivos' + extra + ' · ' + formatBytes(totalBytes) + '). Esta accion no se puede deshacer.',
        async () => {
            try {
                const response = await api('/api/admin/storage/cleanup', {
                    method: 'POST',
                    headers: headers(),
                    body: JSON.stringify({
                        modules,
                        minSizeBytes: minSizeBytes > 0 ? minSizeBytes : null,
                        olderThanDays,
                        includeOrphaned: modules.includes('ORPHANED'),
                        includeEmbedded: true,
                        dryRun: false
                    })
                });
                const dryRunText = response.dryRun ? ' (simulacion)' : '';
                showToast('Limpieza completa' + dryRunText + ': ' + response.deletedFiles + ' archivos · ' + formatBytes(response.freedBytes) + ' liberados', 'success');
                if (response.errors && response.errors.length) {
                    showToast(response.errors.length + ' errores. Revisa consola.', 'warning');
                }
                loadStorageDetails(true);
                storageCleanupPreviewData = [];
                renderCleanupPreview([]);
                const toolbar = document.getElementById('cleanupToolbar');
                if (toolbar) toolbar.style.display = 'none';
            } catch (e) {
                showToast('Error en limpieza: ' + (e.message || ''), 'error');
            }
        },
        'Limpiar'
    );
}

async function cleanupOrphanedFiles() {
    openConfirmModal('Limpiar archivos huerfanos',
        'Se eliminaran todos los archivos sin referencias del sistema de archivos.',
        async () => {
            try {
                const response = await api('/api/admin/storage/cleanup/orphaned', {
                    method: 'POST',
                    headers: headers(false)
                });
                showToast('Huerfanos eliminados: ' + response.deletedFiles + ' · ' + formatBytes(response.freedBytes) + ' liberados', 'success');
                loadStorageDetails(true);
            } catch (e) {
                showToast('Error limpiando huerfanos: ' + (e.message || ''), 'error');
            }
        },
        'Limpiar huerfanos'
    );
}

function updateCleanupChips() {
    document.querySelectorAll('.cleanup-chip').forEach(chip => {
        const cb = chip.querySelector('.cleanup-module');
        if (cb) chip.classList.toggle('active', cb.checked);
    });
}

function filterCleanupByModule(module) {
    if (!module) return;
    document.querySelectorAll('.cleanup-module').forEach(cb => cb.checked = (cb.value === module));
    updateCleanupChips();
    previewStorageCleanup();
}

async function cleanupModule(module) {
    if (!module) return;
    document.querySelectorAll('.cleanup-module').forEach(cb => cb.checked = (cb.value === module));
    updateCleanupChips();
    document.getElementById('cleanupMinSize').value = '0';
    document.getElementById('cleanupSizeUnit').value = '1024';
    document.getElementById('cleanupOlderThan').value = '0';
    await previewStorageCleanup();
    const count = storageCleanupPreviewData.length;
    if (!count) {
        showToast('No hay archivos para limpiar en ' + module, 'info');
        return;
    }
    const totalBytes = storageCleanupPreviewData.reduce((s, it) => s + (Number(it.sizeBytes) || 0), 0);
    openConfirmModal('Limpiar seccion: ' + module,
        'Se eliminaran ' + count + ' archivos (' + formatBytes(totalBytes) + ') del modulo ' + module + '. Esta accion no se puede deshacer.',
        async () => {
            try {
                const response = await api('/api/admin/storage/cleanup', {
                    method: 'POST',
                    headers: headers(),
                    body: JSON.stringify({
                        modules: [module],
                        minSizeBytes: null,
                        olderThanDays: null,
                        includeOrphaned: module === 'ORPHANED',
                        includeEmbedded: true,
                        dryRun: false
                    })
                });
                showToast(module + ': ' + response.deletedFiles + ' archivos eliminados · ' + formatBytes(response.freedBytes) + ' liberados', 'success');
                loadStorageDetails(true);
                storageCleanupPreviewData = [];
                renderCleanupPreview([]);
                const toolbar = document.getElementById('cleanupToolbar');
                if (toolbar) toolbar.style.display = 'none';
            } catch (e) {
                showToast('Error: ' + (e.message || ''), 'error');
            }
        },
        'Limpiar ' + count + ' archivos'
    );
}

function renderCleanupModuleCards(byModule) {
    const host = document.getElementById('cleanupModuleCards');
    if (!host) return;
    const rows = asArray(byModule).map(item => {
        const label = escapeHtml(item.entityType || 'Zona');
        const size = formatBytes(Number(item.totalSize) || 0);
        const pct = clampPercent(item.percentage);
        return '<div class="cleanup-module-card">'
            + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px">'
            + '<div class="cleanup-module-name">' + label + '</div>'
            + '<div style="font-size:11px;font-weight:700;color:var(--text-dark)">' + size + '</div>'
            + '</div>'
            + '<div class="cleanup-module-bar"><div style="width:' + pct + '%"></div></div>'
            + '<div class="cleanup-module-meta">' + pct.toFixed(1) + '% del total</div>'
            + '<div class="cleanup-module-actions">'
            + '<button class="btn btn-sm btn-ghost" onclick="filterCleanupByModule(\'' + (item.entityType || '') + '\')">Ver archivos</button>'
            + '<button class="btn btn-sm btn-danger" onclick="cleanupModule(\'' + (item.entityType || '') + '\')">Limpiar seccion</button>'
            + '</div></div>';
    });
    host.innerHTML = rows.length ? rows.join('') : '<div class="muted">Sin datos por modulo.</div>';
}

async function loadStorageSettings() {
    try {
        const settings = await api('/api/admin/storage/settings');
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        const setChecked = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };
        setVal('storageGlobalLimitGb', ((settings.globalLimitBytes || 0) / 1073741824).toFixed(0));
        setVal('storageWarningThreshold', settings.warningThresholdPercent || 75);
        setVal('storageDangerThreshold', settings.dangerThresholdPercent || 90);
        setVal('storageAuditRetention', settings.auditRetentionDays || 90);
        setVal('storageSubmissionRetention', settings.submissionRetentionDays || 180);
        setVal('storageCertificateRetention', settings.certificateRetentionDays || 730);
        setChecked('storageAutoCompression', settings.autoCompressionEnabled);
        setChecked('storageAutoDeduplication', settings.autoDeduplicationEnabled);
        setChecked('storageEcoMode', settings.ecoModeEnabled);
        setChecked('storageOrphanCleanup', settings.orphanCleanupEnabled);
    } catch (e) {
        // ignore, keep defaults
    }
}

async function saveStorageSettings() {
    const getVal = (id) => { const el = document.getElementById(id); return el ? parseInt(el.value, 10) || 0 : 0; };
    const getChecked = (id) => { const el = document.getElementById(id); return el ? el.checked : false; };
    const body = {
        globalLimitBytes: Math.round(parseFloat(document.getElementById('storageGlobalLimitGb').value || '100') * 1073741824),
        warningThresholdPercent: getVal('storageWarningThreshold'),
        dangerThresholdPercent: getVal('storageDangerThreshold'),
        auditRetentionDays: getVal('storageAuditRetention'),
        submissionRetentionDays: getVal('storageSubmissionRetention'),
        certificateRetentionDays: getVal('storageCertificateRetention'),
        autoCompressionEnabled: getChecked('storageAutoCompression'),
        autoDeduplicationEnabled: getChecked('storageAutoDeduplication'),
        ecoModeEnabled: getChecked('storageEcoMode'),
        orphanCleanupEnabled: getChecked('storageOrphanCleanup')
    };
    try {
        await api('/api/admin/storage/settings', { method: 'POST', headers: headers(), body: JSON.stringify(body) });
        showToast('Configuracion guardada.', 'success');
        loadStorageDetails(true);
    } catch (e) {
        showToast('Error guardando configuracion: ' + (e.message || ''), 'error');
    }
}

async function runStorageOptimize() {
    openConfirmModal('Optimizar almacenamiento',
        'Se ejecutara limpieza de huerfanos, compresion de PDFs y deduplicacion. Puede tardar unos segundos.',
        async () => {
            try {
                const res = await api('/api/admin/storage/optimize', { method: 'POST', headers: headers() });
                const parts = [];
                if (res.orphanedDeleted) parts.push(res.orphanedDeleted + ' huerfanos');
                if (res.compressedFiles) parts.push(res.compressedFiles + ' PDFs comprimidos');
                if (res.duplicatesRemoved) parts.push(res.duplicatesRemoved + ' duplicados eliminados');
                showToast('Optimizacion completa: ' + parts.join(', ') + ' · ' + formatBytes(res.totalFreedBytes) + ' liberados.', 'success');
                loadStorageDetails(true);
            } catch (e) {
                showToast('Error en optimizacion: ' + (e.message || ''), 'error');
            }
        },
        'Optimizar ahora'
    );
}

async function runStorageCompress() {
    try {
        const res = await api('/api/admin/storage/compress', { method: 'POST', headers: headers() });
        showToast('Compresion: ' + res.compressedFiles + ' archivos · ' + formatBytes(res.compressionSavedBytes) + ' ahorrados.', 'success');
        loadStorageDetails(true);
    } catch (e) {
        showToast('Error en compresion: ' + (e.message || ''), 'error');
    }
}

async function runStorageDedup() {
    try {
        const res = await api('/api/admin/storage/dedup', { method: 'POST', headers: headers() });
        showToast('Deduplicacion: ' + res.duplicatesRemoved + ' duplicados · ' + formatBytes(res.dedupSavedBytes) + ' ahorrados.', 'success');
        loadStorageDetails(true);
    } catch (e) {
        showToast('Error en deduplicacion: ' + (e.message || ''), 'error');
    }
}

document.addEventListener('click', e => {
    const chip = e.target.closest('.cleanup-chip');
    if (!chip) return;
    const cb = chip.querySelector('.cleanup-module');
    if (!cb) return;
    cb.checked = !cb.checked;
    chip.classList.toggle('active', cb.checked);
});

function bindStorageListeners() {
    if (storageListenersBound) return;
    storageListenersBound = true;
    window.addEventListener('storage', ev => {
        if (ev.key === 'educat_enrollment_requests') {
            const panel = document.getElementById('panel-matriculas');
            if (panel && panel.classList.contains('active')) {
                renderEnrollmentReviewSection();
                showToast('Nueva solicitud de matrícula recibida', 'success');
            }
        }
        if (ev.key === 'educat_enrollment_form_config') {
            const panel = document.getElementById('panel-matriculas');
            if (panel && panel.classList.contains('active')) {
                showToast('Configuración del formulario de matrículas actualizada', 'info');
            }
        }
    });
}

function startPublicSurveyLiveSync(surveyId) {
    const sid = String(surveyId || '');
    if (!sid) return;
    if (publicSurveyLiveTimer) clearInterval(publicSurveyLiveTimer);
    let lastSignature = getSurveyLiveSignature(asArray(state.surveys).find(s => String(s.id) === sid));
    publicSurveyLiveTimer = setInterval(async () => {
        try {
            state.surveys = asArray(await api('/api/surveys').catch(() => [])).map(s => ({
                ...s,
                options: s.optionsJson ? JSON.parse(s.optionsJson) : [],
                roles: s.rolesJson ? JSON.parse(s.rolesJson) : [],
                questionMedia: s.questionMediaJson ? JSON.parse(s.questionMediaJson) : null,
                voteLedger: s.voteLedgerJson ? JSON.parse(s.voteLedgerJson) : {},
                startsAt: s.startsAt || '',
                endsAt: s.endsAt || '',
                createdAt: s.createdAt || ''
            }));
        } catch (e) {}
        const survey = asArray(state.surveys).find(s => String(s.id) === sid);
        const currentSignature = getSurveyLiveSignature(survey);
        if (currentSignature !== lastSignature) {
            lastSignature = currentSignature;
            renderPublicSurveyPage(sid);
        }
    }, 2200);
}

function renderPublicSurveyPage(surveyId) {
    const survey = asArray(state.surveys).find(s => String(s.id) === String(surveyId));
    if (!survey) {
        document.body.innerHTML = '<div style="max-width:720px;margin:50px auto;padding:0 16px"><div class="card"><div class="card-body"><div class="alert alert-error">Encuesta no encontrada.</div></div></div></div>';
        return;
    }
    const activeUser = getActiveUser();
    const roleName = String((((activeUser || {}).role || {}).name) || '');
    if (survey.authRequired !== false && !activeUser) {
        document.body.innerHTML = '<div style="max-width:720px;margin:50px auto;padding:0 16px"><div class="card"><div class="card-body"><div class="alert alert-error">Debes iniciar sesión para votar en esta encuesta.</div></div></div></div>';
        return;
    }
    if (!surveyAllowsNoRole(survey) && activeUser && !asArray(survey.roles).includes(roleName)) {
        document.body.innerHTML = '<div style="max-width:720px;margin:50px auto;padding:0 16px"><div class="card"><div class="card-body"><div class="alert alert-error">Tu rol no está autorizado para esta encuesta.</div></div></div></div>';
        return;
    }
    if (!isSurveyOpenForVoting(survey)) {
        document.body.innerHTML = '<div style="max-width:720px;margin:50px auto;padding:0 16px"><div class="card"><div class="card-body"><div class="alert alert-info">La encuesta no está dentro de la ventana de votación.</div></div></div></div>';
        return;
    }
    const selectedOption = String(modalState.surveyVoteSelections[String(survey.id || '')] || '');
    const allOptions = asArray(survey.options);
    const optionsPerPage = 8;
    const totalPages = Math.max(1, Math.ceil(allOptions.length / optionsPerPage));
    const currentPage = getPublicSurveyVotePage(survey.id, totalPages);
    modalState.surveyVotePages[String(survey.id || '')] = currentPage;
    const pageStart = (currentPage - 1) * optionsPerPage;
    const visibleOptions = allOptions.slice(pageStart, pageStart + optionsPerPage);
    const options = visibleOptions.map(opt => {
        const oid = String(opt.id || '');
        const media = normalizeSurveyQuestionMedia(opt.media);
        const sid = escapeJsSingle(String(survey.id || ''));
        const safeOid = escapeJsSingle(oid);
        return `<button type="button" class="survey-vote-option ${selectedOption === oid ? 'selected' : ''}" onclick="setSurveyVoteOption('${sid}', '${safeOid}'); renderPublicSurveyPage('${sid}'); return false;">
            <span class="survey-vote-option-indicator"></span>
            ${media ? `<span class="survey-vote-media"><img src="${escapeHtml(media.dataUrl)}" alt="${escapeHtml(media.name)}"></span>` : ''}
            <span class="survey-vote-option-text">${escapeHtml(opt.text || 'Opcion')}</span>
        </button>`;
    }).join('');
    const qMedia = normalizeSurveyQuestionMedia(survey.questionMedia);
    const selectedOptionText = allOptions.find(opt => String(opt.id || '') === selectedOption);
    const totalVotes = surveyVotesTotal(survey);
    const authLabel = survey.authRequired !== false ? 'Requerida' : 'Pública';
    const sidSafe = escapeJsSingle(String(survey.id || ''));
    const pager = allOptions.length > optionsPerPage
        ? `<div class="pager public-survey-option-pager">
            <button class="btn btn-sm btn-outline" ${currentPage <= 1 ? 'disabled' : ''} onclick="setPublicSurveyVotePage('${sidSafe}', ${currentPage - 1})">Anterior</button>
            <span>Página ${currentPage}/${totalPages}</span>
            <button class="btn btn-sm btn-outline" ${currentPage >= totalPages ? 'disabled' : ''} onclick="setPublicSurveyVotePage('${sidSafe}', ${currentPage + 1})">Siguiente</button>
        </div>`
        : '';
    document.body.innerHTML = `
        <div class="public-survey-shell">
            <div class="public-survey-card">
                <div class="public-survey-info">
                    <div class="public-survey-kicker">Encuesta en tiempo real</div>
                    <h1 class="public-survey-title">${escapeHtml(String(survey.question || 'Encuesta'))}</h1>
                    ${qMedia ? `<div class="public-survey-media"><img src="${escapeHtml(qMedia.dataUrl)}" alt="${escapeHtml(qMedia.name)}"></div>` : ''}
                    <div class="public-survey-meta">
                        <span class="preview-chip">Autenticación: ${escapeHtml(authLabel)}</span>
                        <span class="preview-chip">Rol detectado: ${escapeHtml(roleName || 'No autenticado')}</span>
                        <span class="preview-chip">Votos: ${totalVotes}</span>
                        <span class="preview-chip">Inicio: ${escapeHtml(formatSurveyDate(survey.startsAt))}</span>
                        <span class="preview-chip">Fin: ${escapeHtml(formatSurveyDate(survey.endsAt))}</span>
                    </div>
                    <div class="public-survey-live-panel">
                        <div class="assign-head" style="margin-bottom:10px">Resultados en tiempo real</div>
                        <div class="survey-bars public-survey-live-bars">${renderPublicSurveyLiveBars(survey)}</div>
                    </div>
                </div>
                <div class="public-survey-vote">
                    <div class="assign-head" style="margin-bottom:8px">Selecciona una opción</div>
                    <div class="survey-vote-grid public-survey-grid">${options || '<div class="muted">No hay opciones disponibles.</div>'}</div>
                    ${pager}
                    <div class="muted public-survey-selection-note">${selectedOptionText ? `Seleccionada: ${escapeHtml(selectedOptionText.text || 'Opción')}` : 'Aún no has seleccionado opción.'}</div>
                    <div class="survey-vote-submit"><button class="btn btn-teal" onclick="submitPublicSurveyVote('${escapeHtml(String(survey.id || ''))}')">Registrar voto</button></div>
                    <div class="muted" style="margin-top:8px">Tu selección se resalta antes de enviar.</div>
                </div>
            </div>
        </div>
    `;
}

function ensureSurveyDraft() {
    if (!state.ui.surveyDraft || !Array.isArray(state.ui.surveyDraft.options)) {
        state.ui.surveyDraft = {
            options: [{ text: '', media: null }],
            roles: [getDefaultSurveyRoleName()],
            startsAt: '',
            endsAt: '',
            authRequired: true,
            questionMedia: null
        };
    }
    state.ui.surveyDraft.options = asArray(state.ui.surveyDraft.options).map(normalizeSurveyOptionDraft);
    if (!state.ui.surveyDraft.options.length) state.ui.surveyDraft.options = [{ text: '', media: null }];
    if (!Array.isArray(state.ui.surveyDraft.roles) || !state.ui.surveyDraft.roles.length) {
        state.ui.surveyDraft.roles = [getDefaultSurveyRoleName()];
    }
    if (typeof state.ui.surveyDraft.startsAt !== 'string') state.ui.surveyDraft.startsAt = '';
    if (typeof state.ui.surveyDraft.endsAt !== 'string') state.ui.surveyDraft.endsAt = '';
    if (typeof state.ui.surveyDraft.authRequired !== 'boolean') state.ui.surveyDraft.authRequired = true;
    state.ui.surveyDraft.questionMedia = normalizeSurveyQuestionMedia(state.ui.surveyDraft.questionMedia);
}

function setSurveyStartsAt(value) {
    ensureSurveyDraft();
    state.ui.surveyDraft.startsAt = String(value || '');
}

function setSurveyEndsAt(value) {
    ensureSurveyDraft();
    state.ui.surveyDraft.endsAt = String(value || '');
}

function setSurveyAuthRequired(value) {
    ensureSurveyDraft();
    state.ui.surveyDraft.authRequired = String(value) !== 'false';
}

function toggleSurveyRole(roleName, checked) {
    ensureSurveyDraft();
    const selected = new Set(asArray(state.ui.surveyDraft.roles).map(String));
    const value = String(roleName || '');
    if (checked) {
        if (value === SURVEY_NO_ROLE) {
            selected.clear();
            selected.add(SURVEY_NO_ROLE);
        } else {
            selected.delete(SURVEY_NO_ROLE);
            selected.add(value);
        }
    } else {
        selected.delete(value);
    }
    if (!selected.size) selected.add(getDefaultSurveyRoleName());
    state.ui.surveyDraft.roles = Array.from(selected);
}

function toggleSurveyRoleById(roleId, checked) {
    const role = (state.roles || []).find(r => String(r.id) === String(roleId));
    if (!role) return;
    toggleSurveyRole(String(role.name || ''), checked);
}

function setSurveyOptionText(index, value) {
    ensureSurveyDraft();
    if (!state.ui.surveyDraft.options[index]) return;
    state.ui.surveyDraft.options[index].text = String(value || '');
}

function addSurveyOption() {
    ensureSurveyDraft();
    state.ui.surveyDraft.options.push({ text: '', media: null });
    renderSurveyOptionsBuilder();
}

function removeSurveyOption(index) {
    ensureSurveyDraft();
    state.ui.surveyDraft.options = asArray(state.ui.surveyDraft.options).filter((_, idx) => idx !== index);
    if (!state.ui.surveyDraft.options.length) state.ui.surveyDraft.options = [{ text: '', media: null }];
    renderSurveyOptionsBuilder();
}

async function setSurveyQuestionMedia(files) {
    ensureSurveyDraft();
    const file = files && files[0] ? files[0] : null;
    if (!file) return;
    try {
        const raw = await readFileAsDataUrl(file);
        const maybeImg = String(file.type || '').startsWith('image/');
        const dataUrl = maybeImg && !String(file.name || '').toLowerCase().endsWith('.svg')
            ? await compressImageDataUrl(raw, 820, 0.8)
            : raw;
        state.ui.surveyDraft.questionMedia = {
            name: file.name || 'media',
            type: file.type || '',
            dataUrl
        };
        renderSurveyQuestionMediaPreview();
    } catch (e) {
        showToast('No se pudo cargar la imagen/icono de la pregunta', 'error');
    }
}

function clearSurveyQuestionMedia() {
    ensureSurveyDraft();
    state.ui.surveyDraft.questionMedia = null;
    renderSurveyQuestionMediaPreview();
}

function renderSurveyQuestionMediaPreview() {
    const host = document.getElementById('surveyQuestionMediaPreview');
    if (!host) return;
    ensureSurveyDraft();
    const media = normalizeSurveyQuestionMedia(state.ui.surveyDraft.questionMedia);
    host.innerHTML = media
        ? `<div class="survey-question-media-preview"><img src="${escapeHtml(media.dataUrl)}" alt="${escapeHtml(media.name)}"></div>`
        : '<span class="muted">Sin imagen/icono para la pregunta.</span>';
}

async function setSurveyOptionMedia(index, files) {
    ensureSurveyDraft();
    const option = state.ui.surveyDraft.options[index];
    const file = files && files[0] ? files[0] : null;
    if (!option || !file) return;
    try {
        const raw = await readFileAsDataUrl(file);
        const maybeImg = String(file.type || '').startsWith('image/');
        option.media = {
            name: file.name || 'media',
            type: file.type || '',
            dataUrl: maybeImg && !String(file.name || '').toLowerCase().endsWith('.svg')
                ? await compressImageDataUrl(raw, 620, 0.82)
                : raw
        };
        renderSurveyOptionsBuilder();
    } catch (e) {
        showToast('No se pudo cargar la imagen/icono de la opción', 'error');
    }
}

function clearSurveyOptionMedia(index) {
    ensureSurveyDraft();
    const option = state.ui.surveyDraft.options[index];
    if (!option) return;
    option.media = null;
    renderSurveyOptionsBuilder();
}

function renderSurveyRoleSelector() {
    const host = document.getElementById('surveyRoleSelector');
    if (!host) return;
    ensureSurveyDraft();
    const selected = new Set(asArray(state.ui.surveyDraft.roles).map(String));
    const noRoleCard = `<label class="card-check"><input type="checkbox" ${selected.has(SURVEY_NO_ROLE) ? 'checked' : ''} onchange="toggleSurveyRole('${SURVEY_NO_ROLE}', this.checked)"><span>No necesita rol</span></label>`;
    const roleCards = (state.roles || []).map(role => {
        const roleName = String(role.name || 'ROL');
        return `<label class="card-check"><input type="checkbox" ${selected.has(roleName) ? 'checked' : ''} onchange="toggleSurveyRoleById('${String(role.id)}', this.checked)"><span>${escapeHtml(roleName)}</span></label>`;
    }).join('');
    host.innerHTML = noRoleCard + (roleCards || '<div class="muted" style="padding:8px">No hay roles registrados.</div>');
}

function renderSurveyOptionsBuilder() {
    const host = document.getElementById('surveyOptionsBuilder');
    if (!host) return;
    ensureSurveyDraft();
    host.innerHTML = `<div class="survey-draft-options">${asArray(state.ui.surveyDraft.options).map((opt, idx) => {
        const media = normalizeSurveyQuestionMedia(opt && opt.media);
        return `<div class="survey-option-card">
            <div class="form-group" style="margin-bottom:10px">
                <label class="form-label">Opción ${idx + 1}</label>
                <input class="form-input" value="${escapeHtml((opt && opt.text) || '')}" placeholder="Escribe la opción" oninput="setSurveyOptionText(${idx}, this.value)">
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                <input type="file" id="surveyOptionMediaInput-${idx}" accept="image/*,.svg" style="display:none" onchange="setSurveyOptionMedia(${idx}, this.files); this.value='';">
                <button class="btn btn-sm btn-outline" type="button" onclick="document.getElementById('surveyOptionMediaInput-${idx}').click()">Añadir foto/icono</button>
                <button class="btn btn-sm btn-outline" type="button" onclick="clearSurveyOptionMedia(${idx})">Quitar media</button>
                <button class="btn btn-sm btn-outline" type="button" onclick="removeSurveyOption(${idx})">Quitar opción</button>
            </div>
            ${media ? `<div class="survey-option-media-preview"><img src="${escapeHtml(media.dataUrl)}" alt="${escapeHtml(media.name)}"></div>` : '<div class="muted" style="margin-top:8px">Sin foto/icono.</div>'}
        </div>`;
    }).join('')}</div>`;
}

function previewSurveyDraft() {
    ensureSurveyDraft();
    const question = String((document.getElementById('surveyQuestion') || {}).value || '').trim() || 'Pregunta de ejemplo';
    const options = asArray(state.ui.surveyDraft.options)
        .map(normalizeSurveyOptionDraft)
        .filter(opt => String(opt.text || '').trim());
    const roles = asArray(state.ui.surveyDraft.roles).map(r => r === SURVEY_NO_ROLE ? 'No necesita rol' : r);
    const authLabel = state.ui.surveyDraft.authRequired ? 'Requiere login' : 'No requiere login';
    const qMedia = normalizeSurveyQuestionMedia(state.ui.surveyDraft.questionMedia);
    openModal('Previsualización de encuesta', `
        <div class="card-list" style="gap:10px">
            <div><strong>${escapeHtml(question)}</strong></div>
            ${qMedia ? `<div class="survey-question-media-preview"><img src="${escapeHtml(qMedia.dataUrl)}" alt="${escapeHtml(qMedia.name)}"></div>` : ''}
            <div class="muted">${escapeHtml(authLabel)} | Roles: ${escapeHtml(roles.join(', '))}</div>
            <div class="muted">Inicio: ${escapeHtml(formatSurveyDate(state.ui.surveyDraft.startsAt))} | Fin: ${escapeHtml(formatSurveyDate(state.ui.surveyDraft.endsAt))}</div>
            <div class="survey-vote-grid">${(options.length ? options : [{ text: 'Opción 1' }, { text: 'Opción 2' }]).map((opt, idx) => {
                const media = normalizeSurveyQuestionMedia(opt.media);
                return `<div class="survey-vote-option ${idx === 0 ? 'selected' : ''}">
                    <span class="survey-vote-option-indicator"></span>
                    ${media ? `<span class="survey-vote-media"><img src="${escapeHtml(media.dataUrl)}" alt="${escapeHtml(media.name)}"></span>` : ''}
                    <span class="survey-vote-option-text">${escapeHtml(opt.text || 'Opción')}</span>
                </div>`;
            }).join('')}</div>
        </div>
    `);
}

async function createSurvey() {
    const question = String((document.getElementById('surveyQuestion') || {}).value || '').trim();
    const startsAt = String((document.getElementById('surveyStartsAt') || {}).value || '').trim();
    const endsAt = String((document.getElementById('surveyEndsAt') || {}).value || '').trim();
    ensureSurveyDraft();
    const options = asArray(state.ui.surveyDraft.options)
        .map(normalizeSurveyOptionDraft)
        .map(opt => ({ ...opt, text: String(opt.text || '').trim() }))
        .filter(opt => opt.text);
    const roles = asArray(state.ui.surveyDraft.roles).map(String);
    const authRequired = state.ui.surveyDraft.authRequired !== false;
    const questionMedia = normalizeSurveyQuestionMedia(state.ui.surveyDraft.questionMedia);
    const startMs = parseDateMs(startsAt);
    const endMs = parseDateMs(endsAt);
    if (!question) return showToast('Ingresa la pregunta de la encuesta', 'error');
    if (options.length < 2) return showToast('Agrega al menos 2 opciones', 'error');
    if (!roles.length) return showToast('Selecciona al menos un rol autorizado', 'error');
    if (!authRequired && !roles.includes(SURVEY_NO_ROLE)) return showToast('Para encuestas públicas habilita "No necesita rol"', 'error');
    if (startMs === null && startsAt) return showToast('Fecha/hora de inicio inválida', 'error');
    if (endMs === null && endsAt) return showToast('Fecha/hora de finalización inválida', 'error');
    if (startMs !== null && endMs !== null && endMs <= startMs) return showToast('La finalización debe ser posterior al inicio', 'error');
    const payload = {
        question,
        optionsJson: JSON.stringify(options.map((opt, idx) => ({ ...opt, id: opt.id || ('opt-' + Date.now() + '-' + idx) }))),
        rolesJson: JSON.stringify(roles),
        startsAt: startsAt || null,
        endsAt: endsAt || null,
        authRequired,
        questionMediaJson: JSON.stringify(questionMedia),
        status: 'active'
    };
    try {
        const created = await api('/api/surveys', { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
        state.surveys.unshift({
            id: String(created.id),
            question: created.question,
            roles: JSON.parse(created.rolesJson || '[]'),
            authRequired: created.authRequired,
            voteLedger: JSON.parse(created.voteLedgerJson || '{}'),
            status: created.status || 'active',
            createdAt: created.createdAt || new Date().toISOString(),
            startsAt: created.startsAt || '',
            endsAt: created.endsAt || '',
            questionMedia: JSON.parse(created.questionMediaJson || 'null'),
            options: JSON.parse(created.optionsJson || '[]').map(opt => ({
                id: opt.id || ('opt-' + Date.now()),
                text: String(opt.text || '').trim(),
                votes: Math.max(0, parseInt(opt.votes || '0', 10) || 0),
                media: normalizeSurveyQuestionMedia(opt.media)
            })).filter(opt => opt.text),
            closedAt: '',
            closedManually: false
        });
    } catch (e) {
        showToast('Error al guardar encuesta', 'error');
        return;
    }
    document.getElementById('surveyQuestion').value = '';
    const startsAtEl = document.getElementById('surveyStartsAt');
    const endsAtEl = document.getElementById('surveyEndsAt');
    const authRequiredEl = document.getElementById('surveyAuthRequired');
    const questionMediaInput = document.getElementById('surveyQuestionMediaInput');
    if (startsAtEl) startsAtEl.value = '';
    if (endsAtEl) endsAtEl.value = '';
    if (authRequiredEl) authRequiredEl.value = 'true';
    if (questionMediaInput) questionMediaInput.value = '';
    state.ui.surveyDraft = {
        options: [{ text: '', media: null }],
        roles: [getDefaultSurveyRoleName()],
        startsAt: '',
        endsAt: '',
        authRequired: true,
        questionMedia: null
    };
    renderSurveyRoleSelector();
    renderSurveyQuestionMediaPreview();
    renderSurveyOptionsBuilder();
    renderSurveyBoards();
    showToast('Encuesta creada', 'success');
}

function surveyVotesTotal(survey) {
    return asArray(survey.options).reduce((acc, opt) => acc + (parseInt(opt.votes || '0', 10) || 0), 0);
}

function renderSurveyBars(survey) {
    const total = surveyVotesTotal(survey);
    return asArray(survey.options).map(opt => {
        const votes = parseInt(opt.votes || '0', 10) || 0;
        const pct = total > 0 ? Math.round((votes * 100) / total) : 0;
        return `<div class="survey-bar-item"><div class="survey-bar-label"><span>${escapeHtml(opt.text || 'Opcion')}</span><strong>${votes} votos (${pct}%)</strong></div><div class="survey-bar-track"><div class="survey-bar-fill" style="width:${pct}%"></div></div></div>`;
    }).join('');
}

function renderSurveyVoteOptions(survey, selectedOption, rerenderFn) {
    return asArray((survey || {}).options).map(opt => {
        const oid = String(opt.id || '');
        const media = normalizeSurveyQuestionMedia(opt.media);
        return `<button type="button" class="survey-vote-option ${selectedOption === oid ? 'selected' : ''}" onclick="setSurveyVoteOption('${escapeHtml(String((survey || {}).id || ''))}','${escapeHtml(oid)}');${rerenderFn}">
            <span class="survey-vote-option-indicator"></span>
            ${media ? `<span class="survey-vote-media"><img src="${escapeHtml(media.dataUrl)}" alt="${escapeHtml(media.name)}"></span>` : ''}
            <span class="survey-vote-option-text">${escapeHtml(opt.text || 'Opcion')}</span>
        </button>`;
    }).join('');
}

function setSurveyVoteOption(surveyId, optionId) {
    const sid = String(surveyId || '');
    if (!sid) return;
    modalState.surveyVoteSelections[sid] = String(optionId || '');
}

async function registerVoteForSurvey(survey, roleName, optionId) {
    if (!survey) return { ok: false, message: 'Encuesta no encontrada' };
    if (!isSurveyOpenForVoting(survey)) return { ok: false, message: 'La encuesta no está habilitada para votar en este momento' };
    const activeUser = getActiveUser();
    const authRequired = survey.authRequired !== false;
    const roleValue = String(roleName || ((((activeUser || {}).role || {}).name) || ''));
    const optionValue = String(optionId || '');
    if (!optionValue) return { ok: false, message: 'Selecciona una opción válida para registrar voto' };
    if (authRequired && !activeUser) return { ok: false, message: 'Esta encuesta requiere iniciar sesión' };
    const voterKey = getSurveyVoterKey(survey, activeUser);
    if (!voterKey) return { ok: false, message: 'No se pudo identificar al votante' };
    if (!survey.voteLedger) survey.voteLedger = {};
    if (survey.voteLedger[voterKey]) {
        return { ok: false, message: 'Ya registraste un voto en esta encuesta' };
    }
    if (!surveyAllowsNoRole(survey) && !(survey.roles || []).includes(roleValue)) {
        return { ok: false, message: 'Tu rol no tiene permiso para votar en esta encuesta' };
    }
    const id = parseInt(survey.id, 10);
    if (!isNaN(id)) {
        const payload = { optionId: optionValue };
        const url = '/api/surveys/' + id + '/vote';
        console.log('[Vote] Sending POST to', url, 'payload:', payload, 'headers:', headers());
        try {
            await api(url, { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
            // Sync local state after successful vote
            survey.options = asArray(survey.options).map(opt => String(opt.id) === optionValue
                ? { ...opt, votes: (parseInt(opt.votes || '0', 10) || 0) + 1 }
                : opt);
            survey.voteLedger[voterKey] = {
                optionId: optionValue,
                at: new Date().toISOString()
            };
        } catch (e) {
            console.error('[Vote] Server error:', e.message || e);
            return { ok: false, message: 'Error al registrar el voto en el servidor: ' + (e.message || '') };
        }
    } else {
        // Fallback for offline/local surveys
        survey.options = asArray(survey.options).map(opt => String(opt.id) === optionValue
            ? { ...opt, votes: (parseInt(opt.votes || '0', 10) || 0) + 1 }
            : opt);
        survey.voteLedger[voterKey] = {
            optionId: optionValue,
            at: new Date().toISOString()
        };
    }
    return { ok: true };
}

async function submitSurveyVote(surveyId) {
    const survey = (state.surveys || []).find(s => String(s.id) === String(surveyId));
    const optionId = String(modalState.surveyVoteSelections[String(surveyId)] || '');
    const roleName = getActiveUserRoleName();
    const result = await registerVoteForSurvey(survey, roleName, optionId);
    if (!result.ok) return showToast(result.message, 'error');
    modalState.surveyVoteSelections[String(surveyId)] = optionId;
    renderSurveyBoards();
    showVoteSuccessModal('Tu voto ha sido registrado correctamente.');
}

function closeSurvey(surveyId) {
    openConfirmModal('Finalizar encuesta', '¿Deseas finalizar manualmente esta encuesta ahora?', async () => {
        const survey = asArray(state.surveys).find(s => String(s.id) === String(surveyId));
        const id = parseInt(surveyId, 10);
        if (survey && !isNaN(id)) {
            try {
                await api('/api/surveys/' + id, { method: 'PUT', headers: headers(), body: JSON.stringify({
                    question: survey.question,
                    optionsJson: JSON.stringify(survey.options || []),
                    rolesJson: JSON.stringify(survey.roles || []),
                    startsAt: survey.startsAt || null,
                    endsAt: survey.endsAt || null,
                    authRequired: survey.authRequired !== false,
                    questionMediaJson: JSON.stringify(survey.questionMedia || null),
                    status: 'closed'
                }) });
            } catch (e) {
                showToast('Error al cerrar encuesta', 'error');
                return;
            }
        }
        state.surveys = asArray(state.surveys).map(s => String(s.id) === String(surveyId)
            ? { ...s, status: 'closed', closedAt: new Date().toISOString(), closedManually: true }
            : s);
        renderSurveyBoards();
        showToast('Encuesta finalizada', 'success');
    }, 'Finalizar');
}

async function deleteSurvey(surveyId) {
    const id = parseInt(surveyId, 10);
    if (!isNaN(id)) {
        try { await api('/api/surveys/' + id, { method: 'DELETE', headers: headers() }); } catch (e) {}
    }
    state.surveys = asArray(state.surveys).filter(s => String(s.id) !== String(surveyId));
    delete modalState.surveyVoteSelections[String(surveyId)];
    renderSurveyBoards();
    showToast('Encuesta eliminada del historial', 'success');
}

function shareSurveyLink(surveyId) {
    const sid = String(surveyId || '');
    if (!sid) return;
    const url = `${window.location.origin}/public-survey?publicSurvey=${encodeURIComponent(sid)}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
            .then(() => showToast('Link copiado al portapapeles', 'success'))
            .catch(() => window.prompt('Copia este link', url));
        return;
    }
    window.prompt('Copia este link', url);
}

function renderSurveyPieLegend(survey) {
    const total = surveyVotesTotal(survey);
    const colors = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'];
    return asArray(survey.options).map((opt, idx) => {
        const votes = parseInt(opt.votes || '0', 10) || 0;
        const pct = total > 0 ? Math.round((votes * 100) / total) : 0;
        const color = colors[idx % colors.length];
        return `<div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><span><span style="display:inline-block;width:10px;height:10px;border-radius:99px;background:${color};margin-right:6px"></span>${escapeHtml(opt.text || 'Opcion')}</span><strong>${votes} (${pct}%)</strong></div>`;
    }).join('');
}

function openSurveyReportModal(surveyId) {
    const survey = asArray(state.surveys).find(s => String(s.id) === String(surveyId));
    if (!survey) return showToast('Encuesta no encontrada', 'error');
    const total = surveyVotesTotal(survey);
    openModal('Reporte de encuesta', `
        <div class="card-list" style="gap:10px">
            <div><strong>${escapeHtml(survey.question || '')}</strong></div>
            <div class="muted">Total votos: ${total} | Estado: ${escapeHtml(String(survey.status || 'active'))}</div>
            <div class="survey-bars">${renderSurveyBars(survey)}</div>
            <div class="card-list" style="gap:6px">${renderSurveyPieLegend(survey)}</div>
        </div>
    `);
}

function exportSurveyResultsExcel(surveyId) {
    const items = surveyId
        ? asArray(state.surveys).filter(s => String(s.id) === String(surveyId))
        : asArray(state.surveys);
    if (!items.length) return showToast('No hay resultados para exportar', 'error');
    if (typeof XLSX === 'undefined') return showToast('No se encontró librería XLSX para exportar Excel', 'error');

    const nowLabel = new Date().toLocaleString('es-CO');
    const summaryRows = [];
    const detailRows = [];
    const chartRows = [];

    const summaryHeaders = ['Pregunta', 'Estado', 'Autenticacion', 'Roles', 'Total votos', 'Inicio', 'Fin', 'Cierre manual'];
    const detailHeaders = ['Pregunta', 'Opcion', 'Votos', 'Porcentaje'];
    const chartHeaders = ['Encuesta', 'Opcion', 'Votos', 'Porcentaje', 'Barra'];

    summaryRows.push(['REPORTE DE ENCUESTAS - EDUCAT']);
    summaryRows.push([`Generado: ${nowLabel}`]);
    summaryRows.push([]);
    summaryRows.push(summaryHeaders);

    detailRows.push(['DETALLE DE OPCIONES POR ENCUESTA']);
    detailRows.push([`Generado: ${nowLabel}`]);
    detailRows.push([]);
    detailRows.push(detailHeaders);

    chartRows.push(['DATOS PARA GRAFICOS (EXCEL)']);
    chartRows.push(['Inserta un grafico de columnas usando esta tabla para una visual estetica.']);
    chartRows.push([]);
    chartRows.push(chartHeaders);
    items.forEach(s => {
        const totalVotes = surveyVotesTotal(s);
        summaryRows.push([
            String(s.question || ''),
            String(s.status || 'active'),
            s.authRequired !== false ? 'Requerida' : 'No requerida',
            asArray(s.roles).map(r => r === SURVEY_NO_ROLE ? 'No necesita rol' : r).join('|'),
            totalVotes,
            formatSurveyDate(s.startsAt),
            formatSurveyDate(s.endsAt),
            s.closedManually ? 'Si' : 'No'
        ]);
        asArray(s.options).forEach(opt => {
            const votes = parseInt(opt.votes || '0', 10) || 0;
            const pct = totalVotes > 0 ? Math.round((votes * 10000) / totalVotes) / 100 : 0;
            detailRows.push([
                String(s.question || ''),
                String(opt.text || ''),
                votes,
                pct / 100
            ]);
            chartRows.push([
                String(s.question || ''),
                String(opt.text || ''),
                votes,
                pct / 100,
                '█'.repeat(Math.max(1, Math.round(pct / 5)))
            ]);
        });
    });

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
    const wsChartData = XLSX.utils.aoa_to_sheet(chartRows);

    wsSummary['!cols'] = [
        { wch: 54 }, { wch: 14 }, { wch: 18 }, { wch: 36 }, { wch: 12 }, { wch: 21 }, { wch: 21 }, { wch: 14 }
    ];
    wsDetail['!cols'] = [
        { wch: 48 }, { wch: 32 }, { wch: 12 }, { wch: 14 }
    ];
    wsChartData['!cols'] = [
        { wch: 48 }, { wch: 30 }, { wch: 12 }, { wch: 14 }, { wch: 24 }
    ];

    wsSummary['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }];
    wsDetail['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }];
    wsChartData['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }];

    wsSummary['!autofilter'] = { ref: `A4:H${summaryRows.length}` };
    wsDetail['!autofilter'] = { ref: `A4:D${detailRows.length}` };
    wsChartData['!autofilter'] = { ref: `A4:E${chartRows.length}` };

    // Estilo básico de encabezados (si el motor XLSX lo soporta en tiempo de ejecución).
    const headerStyle = {
        font: { bold: true, color: { rgb: 'FFFFFFFF' } },
        fill: { fgColor: { rgb: '1F4E78' } },
        alignment: { horizontal: 'center', vertical: 'center' }
    };
    const titleStyle = {
        font: { bold: true, sz: 14, color: { rgb: '0B1F3A' } },
        alignment: { horizontal: 'center', vertical: 'center' }
    };
    const subtitleStyle = {
        font: { italic: true, color: { rgb: '4F4F4F' } },
        alignment: { horizontal: 'center', vertical: 'center' }
    };

    function applyStyle(ws, cellAddress, style) {
        if (ws[cellAddress]) ws[cellAddress].s = style;
    }

    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4'].forEach(a => applyStyle(wsSummary, a, headerStyle));
    ['A4', 'B4', 'C4', 'D4'].forEach(a => applyStyle(wsDetail, a, headerStyle));
    ['A4', 'B4', 'C4', 'D4', 'E4'].forEach(a => applyStyle(wsChartData, a, headerStyle));
    applyStyle(wsSummary, 'A1', titleStyle);
    applyStyle(wsDetail, 'A1', titleStyle);
    applyStyle(wsChartData, 'A1', titleStyle);
    applyStyle(wsSummary, 'A2', subtitleStyle);
    applyStyle(wsDetail, 'A2', subtitleStyle);
    applyStyle(wsChartData, 'A2', subtitleStyle);

    for (let r = 5; r <= detailRows.length; r += 1) {
        const pctCell = wsDetail[`D${r}`];
        if (pctCell) pctCell.z = '0.00%';
    }
    for (let r = 5; r <= chartRows.length; r += 1) {
        const pctCell = wsChartData[`D${r}`];
        if (pctCell) pctCell.z = '0.00%';
    }

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');
    XLSX.utils.book_append_sheet(wb, wsDetail, 'DetalleOpciones');
    XLSX.utils.book_append_sheet(wb, wsChartData, 'DatosGraficos');
    XLSX.writeFile(wb, surveyId ? `encuesta-${surveyId}.xlsx` : 'encuestas-resultados.xlsx');
    showToast('Reporte Excel generado', 'success');
}

function exportSurveyResultsCsv(surveyId) {
    exportSurveyResultsExcel(surveyId);
}

function renderSurveyBoards() {
    const activeHost = document.getElementById('surveyActiveBoard');
    const historyHost = document.getElementById('surveyHistoryBoard');
    const all = asArray(state.surveys);
    const active = all.filter(s => !isSurveyInHistory(s));
    const closed = all.filter(s => isSurveyInHistory(s));
    const historyPaged = paginateItems(closed, state.ui.surveyHistoryPage, state.ui.surveyHistoryPageSize);
    state.ui.surveyHistoryPage = historyPaged.page;
    const activeRole = getActiveUserRoleName();
    const activeUser = getActiveUser();

    if (activeHost) {
        activeHost.innerHTML = active.length
            ? active.map(s => {
                const sid = String(s.id || '');
                const selectedOption = String(modalState.surveyVoteSelections[sid] || '');
                const open = isSurveyOpenForVoting(s);
                const needsAuth = s.authRequired !== false;
                const noRole = surveyAllowsNoRole(s);
                const canVote = open
                    && (!needsAuth || !!activeUser)
                    && (noRole || (!!activeRole && asArray(s.roles).includes(activeRole)));
                const qMedia = normalizeSurveyQuestionMedia(s.questionMedia);
                return `<div class="survey-card">
                    <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">
                        <div>
                            <div style="font-weight:700">${escapeHtml(s.question || '')}</div>
                            ${qMedia ? `<div class="survey-question-media-preview" style="margin-top:8px"><img src="${escapeHtml(qMedia.dataUrl)}" alt="${escapeHtml(qMedia.name)}"></div>` : ''}
                            <div class="muted">Roles: ${escapeHtml(asArray(s.roles).map(r => r === SURVEY_NO_ROLE ? 'No necesita rol' : r).join(', '))}</div>
                            <div class="muted">Inicio: ${escapeHtml(formatSurveyDate(s.startsAt))} | Fin: ${escapeHtml(formatSurveyDate(s.endsAt))}</div>
                            <div class="muted">Autenticación: ${s.authRequired !== false ? 'Requerida' : 'No requerida'}</div>
                            <div class="muted">Tu rol detectado: ${escapeHtml(activeRole || 'No autenticado')}</div>
                        </div>
                        <div style="display:flex;gap:6px;flex-wrap:wrap">
                            <button class="btn btn-sm btn-outline" onclick="shareSurveyLink('${sid}')">Compartir link</button>
                            <button class="btn btn-sm btn-outline" onclick="openSurveyReportModal('${sid}')">Ver reporte</button>
                            <button class="btn btn-sm btn-outline" onclick="exportSurveyResultsExcel('${sid}')">Excel</button>
                            <button class="btn btn-sm btn-outline" onclick="closeSurvey('${sid}')">Finalizar ahora</button>
                        </div>
                    </div>
                    <div class="survey-bars">${renderSurveyBars(s)}</div>
                    <div class="survey-vote-grid">${renderSurveyVoteOptions(s, selectedOption, 'renderSurveyBoards()')}</div>
                    <div class="survey-vote-submit">
                        <button class="btn btn-teal" ${canVote ? '' : 'disabled'} onclick="submitSurveyVote('${sid}')">Registrar voto</button>
                    </div>
                    ${!open ? '<div class="muted" style="margin-top:6px">Esta encuesta está fuera de la ventana de votación programada.</div>' : ''}
                    ${open && needsAuth && !activeUser ? '<div class="muted" style="margin-top:6px">Inicia sesión para votar.</div>' : ''}
                    ${open && !noRole && activeUser && activeRole && !asArray(s.roles).includes(activeRole) ? '<div class="muted" style="margin-top:6px">Tu rol no está autorizado para votar en esta encuesta.</div>' : ''}
                </div>`;
            }).join('')
            : '<div class="muted">No hay encuestas activas.</div>';
    }

    if (historyHost) {
        historyHost.innerHTML = historyPaged.items.length
            ? `${historyPaged.items.map(s => `<div class="card-check" style="justify-content:space-between;gap:10px;align-items:center"><span><strong>${escapeHtml(s.question || '')}</strong> <span class="muted">(${surveyVotesTotal(s)} votos)</span>${s.closedManually ? ' <span class="muted">[Finalizada manualmente]</span>' : ''}</span><span style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-sm btn-outline" onclick="shareSurveyLink('${String(s.id)}')">Compartir link</button><button class="btn btn-sm btn-outline" onclick="openSurveyReportModal('${String(s.id)}')">Reporte</button><button class="btn btn-sm btn-outline" onclick="exportSurveyResultsExcel('${String(s.id)}')">Excel</button><button class="btn btn-sm btn-outline" onclick="deleteSurvey('${String(s.id)}')">Eliminar</button></span></div>`).join('')}
               <div class="pager" style="margin-top:10px">
                    <button class="btn btn-sm btn-outline" ${historyPaged.page <= 1 ? 'disabled' : ''} onclick="surveyHistoryPrevPage()">Anterior</button>
                    <span>${historyPaged.page}/${historyPaged.totalPages}</span>
                    <button class="btn btn-sm btn-outline" ${historyPaged.page >= historyPaged.totalPages ? 'disabled' : ''} onclick="surveyHistoryNextPage()">Siguiente</button>
               </div>`
            : '<div class="muted">Aun no hay encuestas cerradas.</div>';
    }
}

function openNewCustomFormModal() {
    openModal('Nuevo formulario personalizable', `
        <div class="form-group"><label class="form-label">Nombre del formulario</label><input class="form-input" id="newCustomFormTitle" placeholder="Ej: Registro de bienestar"></div>
        <div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn btn-outline" onclick="closeModal()">Cancelar</button><button class="btn btn-teal" onclick="createCustomFormFromModal()">Crear</button></div>
    `);
}

function createCustomFormFromModal() {
    const title = String((document.getElementById('newCustomFormTitle') || {}).value || '').trim();
    if (!title) return showToast('Ingresa un nombre para el formulario', 'error');
    const created = {
        id: 'custom-' + Date.now(),
        title,
        questions: [],
        audience: { mode: 'registered', roles: [] }
    };
    state.customForms.unshift(created);
    saveStorage(STORAGE_KEYS.customForms, state.customForms);
    closeModal();
    refreshFormTypeOptions('custom:' + created.id);
    renderFormsSection();
    showToast('Formulario personalizable creado', 'success');
}

function setCustomAudienceMode(mode) {
    ensureFormDraft();
    if (isBaseFormKey(getBuilderType())) return;
    if (!state.ui.formDraft.audience) state.ui.formDraft.audience = { mode: 'registered', roles: [] };
    state.ui.formDraft.audience.mode = String(mode || 'registered');
    if (state.ui.formDraft.audience.mode !== 'roles') state.ui.formDraft.audience.roles = [];
    renderCustomAudiencePanel();
}

function toggleCustomAudienceRoleById(roleId, checked) {
    ensureFormDraft();
    if (isBaseFormKey(getBuilderType())) return;
    const role = asArray(state.roles).find(r => String(r.id) === String(roleId));
    if (!role) return;
    if (!state.ui.formDraft.audience) state.ui.formDraft.audience = { mode: 'roles', roles: [] };
    const roles = new Set(asArray(state.ui.formDraft.audience.roles).map(String));
    const roleName = String(role.name || '');
    if (checked) roles.add(roleName);
    else roles.delete(roleName);
    state.ui.formDraft.audience.mode = 'roles';
    state.ui.formDraft.audience.roles = Array.from(roles);
    renderCustomAudiencePanel();
}

function renderCustomAudiencePanel() {
    const panel = document.getElementById('customAudiencePanel');
    const modeInput = document.getElementById('formAudienceMode');
    const rolesHost = document.getElementById('formAudienceRoles');
    if (!panel || !modeInput || !rolesHost) return;
    const activeKey = getBuilderType();
    const show = isCustomFormKey(activeKey);
    panel.style.display = show ? '' : 'none';
    if (!show) return;
    ensureFormDraft();
    const audience = state.ui.formDraft.audience || { mode: 'registered', roles: [] };
    modeInput.value = String(audience.mode || 'registered');
    const selected = new Set(asArray(audience.roles).map(String));
    rolesHost.innerHTML = asArray(state.roles).map(role => {
        const roleName = String(role.name || 'ROL');
        return `<label class="card-check"><input type="checkbox" ${audience.mode !== 'roles' ? 'disabled' : ''} ${selected.has(roleName) ? 'checked' : ''} onchange="toggleCustomAudienceRoleById('${String(role.id)}', this.checked)"><span>${escapeHtml(roleName)}</span></label>`;
    }).join('') || '<div class="muted" style="padding:8px">No hay roles para seleccionar.</div>';
}

function renderFormsSection() {
    refreshFormTypeOptions(getBuilderType());
    ensureFormDraft();
    const type = getBuilderType();
    const titleInput = document.getElementById('formTitleInput');
    if (titleInput) {
        titleInput.value = String((((state.formsMeta || {})[type] || {}).title) || state.ui.formDraft.title || '');
    }
    const canEditHere = isBuilderWindow();
    const btnAdd = document.getElementById('btnAddBuilderQuestion');
    const btnSave = document.getElementById('btnSaveFormBuilder');
    const btnShare = document.getElementById('btnShareFormLink');
    const btnPreview = document.getElementById('btnOpenFormPreviewPopup');
    const bottomAddWrap = document.querySelector('.form-builder-bottom-actions');
    const typeHint = document.getElementById('formTypeHint');
    const hint = document.getElementById('formBuilderReadOnlyHint');
    if (btnAdd) btnAdd.style.display = '';
    if (btnSave) btnSave.style.display = '';
    if (btnPreview) btnPreview.style.display = '';
    if (bottomAddWrap) bottomAddWrap.style.display = '';
    if (btnShare) btnShare.style.display = isCustomFormKey(type) ? '' : 'none';
    if (typeHint) {
        typeHint.textContent = isBaseFormKey(type)
            ? 'Este formulario se publica automáticamente en Area personal de estudiantes autenticados.'
            : 'Formulario personalizable: puedes compartir link y controlar acceso por roles, todos los registrados o cualquiera.';
    }
    if (hint) hint.textContent = 'Editas preguntas y guardas desde este panel.';
    renderCustomAudiencePanel();
    renderFormBuilderQuestions();
    renderFormResponsesBoard();
    ensureSurveyDraft();
    renderSurveyRoleSelector();
    renderSurveyQuestionMediaPreview();
    renderSurveyOptionsBuilder();
    const startsAtEl = document.getElementById('surveyStartsAt');
    const endsAtEl = document.getElementById('surveyEndsAt');
    const authRequiredEl = document.getElementById('surveyAuthRequired');
    if (startsAtEl) startsAtEl.value = String((state.ui.surveyDraft || {}).startsAt || '');
    if (endsAtEl) endsAtEl.value = String((state.ui.surveyDraft || {}).endsAt || '');
    if (authRequiredEl) authRequiredEl.value = (state.ui.surveyDraft && state.ui.surveyDraft.authRequired === false) ? 'false' : 'true';
    renderSurveyBoards();
}

function setFormBuilderTitle(value) {
    ensureFormDraft();
    state.ui.formDraft.title = String(value || '');
}

function openQuestionForm() {
    addBuilderQuestion();
}

function deleteQuestion(formType, questionId) {
    const type = String(formType || getBuilderType());
    if (type !== getBuilderType()) {
        document.getElementById('formType').value = type;
        ensureFormDraft();
    }
    state.ui.formDraft.questions = asArray(state.ui.formDraft.questions).filter(q => String(q.id) !== String(questionId));
    renderFormBuilderQuestions();
}

function exportResponsesCsv() {
    const type = getBuilderType();
    const rows = asArray(state.forms[type]).map(q => [
        JSON.stringify(type),
        JSON.stringify(String(q.id || '')),
        JSON.stringify(String(questionDisplayLabel(q))),
        JSON.stringify(String(q.text || '')),
        JSON.stringify(String(q.type || 'open')),
        JSON.stringify(asArray(q.options).join('|')),
        q.required === false ? 'false' : 'true'
    ].join(','));
    const csv = ['formulario,preguntaId,etiqueta,texto,tipo,opciones,requerida'].concat(rows).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formularios-${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('No se pudo leer el archivo de texto'));
        reader.readAsText(file, 'utf-8');
    });
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('No se pudo leer el archivo binario'));
        reader.readAsArrayBuffer(file);
    });
}

function parseCsvLine(line, delimiter) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }
        if (ch === delimiter && !inQuotes) {
            values.push(current.trim());
            current = '';
            continue;
        }
        current += ch;
    }
    values.push(current.trim());
    return values;
}

function parseCsvText(text, delimiter) {
    const rows = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter(r => String(r).trim().length > 0);
    if (!rows.length) return { headers: [], rows: [] };
    const headersRaw = parseCsvLine(rows[0], delimiter);
    const selectedIndexes = headersRaw
        .map((h, idx) => ({ idx, name: String(h || '').trim() }))
        .filter(x => x.name.length > 0);
    if (!selectedIndexes.length) return { headers: [], rows: [] };
    const headers = selectedIndexes.map(x => x.name);
    const body = rows.slice(1).map(line => {
        const cols = parseCsvLine(line, delimiter);
        const item = {};
        selectedIndexes.forEach((x, idx) => { item[headers[idx]] = String(cols[x.idx] || '').trim(); });
        return item;
    });
    return { headers, rows: body };
}

function parseExcelData(buffer) {
    if (typeof XLSX === 'undefined') {
        throw new Error('No se encontró la librería XLSX en la página');
    }
    const wb = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[firstSheetName];
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!matrix.length) return { headers: [], rows: [] };
    const firstRow = matrix[0] || [];
    const selectedIndexes = firstRow
        .map((h, idx) => ({ idx, name: String(h || '').trim() }))
        .filter(x => x.name.length > 0);
    if (!selectedIndexes.length) return { headers: [], rows: [] };
    const headers = selectedIndexes.map(x => x.name);
    const body = (matrix.slice(1) || [])
        .filter(row => (row || []).some(col => String(col || '').trim() !== ''))
        .map(row => {
            const item = {};
            selectedIndexes.forEach((x, idx) => { item[headers[idx]] = String((row || [])[x.idx] || '').trim(); });
            return item;
        });
    return { headers, rows: body };
}

function guessColumn(headers, aliases) {
    const normalized = (headers || []).map(h => ({ raw: h, key: String(h || '').toLowerCase() }));
    for (const alias of aliases) {
        const hit = normalized.find(h => h.key.includes(alias));
        if (hit) return hit.raw;
    }
    return '';
}

function setImportMappingOptions(headers) {
    const mappingFields = [
        { id: 'mapStudentCode', aliases: ['codigo', 'id', 'identificacion', 'documento', 'studentcode'] },
        { id: 'mapName', aliases: ['nombre', 'name', 'estudiante'] },
        { id: 'mapLevel', aliases: ['nivel', 'level'] },
        { id: 'mapGrade', aliases: ['grado', 'grade', 'curso_grado'] },
        { id: 'mapCourse', aliases: ['curso', 'course'] },
        { id: 'mapAssignmentMode', aliases: ['asignacion', 'modo', 'assignment'] }
    ];
    mappingFields.forEach(field => {
        fillSelect(field.id, headers.map(h => ({ id: h, name: h })), h => `<option value="${escapeHtml(String(h.id))}">${escapeHtml(String(h.name))}</option>`, 'Sin columna');
        const guessed = guessColumn(headers, field.aliases);
        const el = document.getElementById(field.id);
        if (el && guessed) el.value = guessed;
    });
}

function getNextStudentCodeSeed() {
    let maxCode = 1000;
    (state.students || []).forEach(s => {
        const raw = String(s.studentCode || '').trim();
        const m = raw.match(/(\d+)$/);
        if (!m) return;
        const n = parseInt(m[1], 10);
        if (Number.isFinite(n)) maxCode = Math.max(maxCode, n);
    });
    return maxCode + 1;
}

function formatStudentCode(n) {
    return `EST-${String(n).padStart(4, '0')}`;
}

function readImportMappingFromDom() {
    return {
        studentCode: String((document.getElementById('mapStudentCode') || {}).value || '').trim(),
        name: String((document.getElementById('mapName') || {}).value || '').trim(),
        level: String((document.getElementById('mapLevel') || {}).value || '').trim(),
        grade: String((document.getElementById('mapGrade') || {}).value || '').trim(),
        course: String((document.getElementById('mapCourse') || {}).value || '').trim(),
        assignmentMode: String((document.getElementById('mapAssignmentMode') || {}).value || '').trim()
    };
}

function mapImportRow(row, mapping) {
    const pick = key => (key && row[key] !== undefined ? String(row[key] || '').trim() : '');
    return {
        studentCode: pick(mapping.studentCode),
        name: pick(mapping.name),
        level: pick(mapping.level),
        grade: pick(mapping.grade),
        course: pick(mapping.course),
        assignmentMode: pick(mapping.assignmentMode)
    };
}

function updateImportSummary(validation) {
    const summary = document.getElementById('importValidationSummary');
    if (!summary) return;
    summary.textContent = `Total: ${validation.total} | Válidos: ${validation.valid} | Inválidos: ${validation.invalid} | Duplicados: ${validation.duplicates} | Faltantes: ${validation.missing}`;
}

async function analyzeImportFile() {
    try {
        const files = (document.getElementById('importFileInput') || {}).files;
        const file = files && files[0] ? files[0] : null;
        if (!file) return showToast('Selecciona un archivo para analizar', 'error');

        const selectedType = String((document.getElementById('importFileType') || {}).value || 'auto');
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        const type = selectedType === 'auto' ? ((ext === 'xlsx' || ext === 'xls') ? 'excel' : 'csv') : selectedType;
        let parsed = { headers: [], rows: [] };

        if (type === 'excel') {
            const buffer = await readFileAsArrayBuffer(file);
            parsed = parseExcelData(buffer);
        } else {
            const delimiterRaw = String((document.getElementById('importCsvDelimiter') || {}).value || ',');
            const delimiter = delimiterRaw === '\\t' ? '\t' : delimiterRaw;
            const text = await readFileAsText(file);
            parsed = parseCsvText(text, delimiter);
        }

        importState.headers = parsed.headers || [];
        importState.rows = parsed.rows || [];
        importState.mappedRows = [];
        importState.validation = { total: importState.rows.length, valid: 0, invalid: 0, duplicates: 0, missing: 0 };

        if (!importState.headers.length) {
            showToast('No se detectaron columnas en el archivo', 'error');
            return;
        }

        setImportMappingOptions(importState.headers);
        importState.mapping = readImportMappingFromDom();

        const mapRow = document.getElementById('importMappingRow');
        if (mapRow) mapRow.style.display = '';
        const previewHost = document.getElementById('importPreviewTable');
        if (previewHost) previewHost.innerHTML = '<div class="muted">Archivo analizado. Configura/ajusta mapeo y pulsa Vista previa.</div>';
        const summary = document.getElementById('importValidationSummary');
        if (summary) summary.textContent = `Archivo analizado: ${file.name}. Filas detectadas: ${importState.rows.length}.`;
        showToast('Archivo analizado correctamente', 'success');
    } catch (e) {
        showToast(e && e.message ? e.message : 'Error al analizar archivo', 'error');
    }
}

function previewImport() {
    if (!importState.rows.length) return showToast('Primero analiza un archivo', 'error');
    const mapping = readImportMappingFromDom();
    if (!mapping.name) {
        return showToast('Mapea al menos la columna de Nombre para continuar', 'error');
    }
    importState.mapping = mapping;
    const seenCodes = new Set();
    const existingCodes = new Set((state.students || []).map(s => String(s.studentCode || '').toLowerCase()));
    let duplicates = 0;
    let missing = 0;
    let nextCode = getNextStudentCodeSeed();
    const mapped = importState.rows.map(row => mapImportRow(row, mapping)).map(item => {
        if (!item.studentCode) {
            item.studentCode = formatStudentCode(nextCode);
            nextCode += 1;
        }
        const hasRequired = !!item.name;
        if (!hasRequired) missing += 1;
        const key = String(item.studentCode || '').toLowerCase();
        let duplicate = false;
        if (key) {
            if (seenCodes.has(key) || existingCodes.has(key)) {
                duplicate = true;
                duplicates += 1;
            } else {
                seenCodes.add(key);
            }
        }
        return { ...item, _valid: hasRequired && !duplicate, _duplicate: duplicate };
    });
    importState.mappedRows = mapped;
    const valid = mapped.filter(m => m._valid).length;
    importState.validation = {
        total: mapped.length,
        valid,
        invalid: mapped.length - valid,
        duplicates,
        missing
    };
    updateImportSummary(importState.validation);

    const host = document.getElementById('importPreviewTable');
    if (!host) return;
    const rows = mapped.slice(0, 60).map(r => `
        <tr>
            <td>${escapeHtml(r.studentCode)}</td>
            <td>${escapeHtml(r.name)}</td>
            <td>${escapeHtml(r.level)}</td>
            <td>${escapeHtml(r.grade)}</td>
            <td>${escapeHtml(r.course)}</td>
            <td>${escapeHtml(r.assignmentMode)}</td>
            <td>${r._valid ? '<span style="color:#137333">OK</span>' : '<span style="color:#b3261e">Revisar</span>'}</td>
        </tr>
    `).join('');
    host.innerHTML = mapped.length
        ? `<table class="table"><thead><tr><th>Código</th><th>Nombre</th><th>Nivel</th><th>Grado</th><th>Curso</th><th>Asignación</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table>`
        : '<div class="muted">No hay filas para previsualizar.</div>';
}

async function importStudentsBatch() {
    if (!importState.mappedRows.length) {
        previewImport();
    }
    const validRows = (importState.mappedRows || []).filter(r => r._valid);
    if (!validRows.length) return showToast('No hay filas válidas para importar', 'error');

    let imported = 0;
    let updated = 0;
    let createdLevels = 0;
    let createdGrades = 0;
    for (let idx = 0; idx < validRows.length; idx++) {
        const row = validRows[idx];
        if (!row.studentCode) {
            row.studentCode = formatStudentCode(getNextStudentCodeSeed() + idx);
        }
        const exists = (state.students || []).find(s => String(s.studentCode || '').toLowerCase() === String(row.studentCode || '').toLowerCase());
        if (!exists) {
            state.students.push({
                id: Date.now() + idx,
                studentCode: row.studentCode,
                user: { id: Date.now() + idx + 1, name: row.name }
            });
            imported += 1;
        } else if (row.name) {
            if (!exists.user) exists.user = {};
            exists.user.name = row.name;
            updated += 1;
        }

        const studentRef = exists || (state.students || []).find(s => String(s.studentCode || '').toLowerCase() === String(row.studentCode || '').toLowerCase());
        const levelBefore = (state.academicLevels || []).length;
        const gradeBefore = (state.academicGrades || []).length;
        const level = row.level ? await ensureAcademicLevelByName(row.level) : null;
        if ((state.academicLevels || []).length > levelBefore) createdLevels += 1;
        const grade = (level && row.grade) ? await ensureAcademicGradeByName(level.id, row.grade) : null;
        if ((state.academicGrades || []).length > gradeBefore) createdGrades += 1;

        if (studentRef) {
            const sid = String(studentRef.id || '');
            if (sid && level) state.studentLevels[sid] = String(level.id);
            if (sid) {
                if (grade) state.studentGrades[sid] = String(grade.id);
                else if (row.level && !row.grade) delete state.studentGrades[sid];
            }
        }
    }
    saveStudentGradesToBackend();

    cleanupStudentAcademicLinks();
    cleanupAssistantSelections();
    saveLevelsState();
    renderCoursesSection();
    renderImportSection();
    renderOverview();
    showToast(`Importación completada. Nuevos: ${imported} | Actualizados: ${updated} | Niveles creados: ${createdLevels} | Grados creados: ${createdGrades}`, 'success');
}

function createAssignmentRule() {
    const name = String((document.getElementById('ruleName') || {}).value || '').trim();
    const gradesRaw = String((document.getElementById('ruleGrades') || {}).value || '').trim();
    const mode = String((document.getElementById('ruleMode') || {}).value || 'balanced');
    const active = String((document.getElementById('ruleActive') || {}).value || 'true') === 'true';
    if (!name) return showToast('Nombre de regla requerido', 'error');
    const grades = gradesRaw.split(',').map(x => x.trim()).filter(Boolean);
    state.assignmentRules.push({ id: 'rule-' + Date.now(), name, grades, mode, active });
    saveLevelsState();
    renderImportSection();
    showToast('Regla creada', 'success');
}

function applyRulesToStudents() {
    showToast('Reglas guardadas. Puedes aplicarlas al flujo de importación.', 'info');
}

function updateImportFormatUI() {
    const type = String((document.getElementById('importFileType') || {}).value || 'auto');
    const group = document.getElementById('csvDelimiterGroup');
    if (group) group.style.display = type === 'excel' ? 'none' : '';
}

function renderImportSection() {
    updateImportFormatUI();
    const list = document.getElementById('rulesList');
    if (!list) return;
    list.innerHTML = (state.assignmentRules || []).length
        ? (state.assignmentRules || []).map(r => `<div class="card-check" style="justify-content:space-between"><span><strong>${escapeHtml(r.name || '')}</strong> - ${escapeHtml((r.grades || []).join(', ') || 'Sin grados')}</span><button class="btn btn-sm btn-outline" onclick="deleteAssignmentRule('${String(r.id)}')">Eliminar</button></div>`).join('')
        : '<div class="muted">No hay reglas creadas.</div>';
}

function deleteAssignmentRule(ruleId) {
    state.assignmentRules = (state.assignmentRules || []).filter(r => String(r.id) !== String(ruleId));
    saveLevelsState();
    renderImportSection();
}

function renderGradePolicySection() {
    const p = state.gradePolicy || { ...DEFAULT_POLICY };
    const model = document.getElementById('gradingModel');
    const allow = document.getElementById('allowTeacherCustom');
    const forced = document.getElementById('forcedModel');
    const min = document.getElementById('examMinPercent');
    const max = document.getElementById('examMaxPercent');
    const scheduleMode = document.getElementById('scheduleSelectionMode');
    if (model) model.value = p.selectedMethod || 'simple';
    if (allow) allow.value = p.allowTeacherCustom ? 'true' : 'false';
    if (forced) forced.value = p.forcedModel || '';
    if (min) min.value = String(p.examMinPercent ?? 0);
    if (max) max.value = String(p.examMaxPercent ?? 100);
    if (scheduleMode) scheduleMode.value = String(p.scheduleSelectionMode || 'free');
    const guide = document.getElementById('gradingGuide');
    if (guide) guide.innerHTML = '<div class="muted">Configura la política y guarda cambios.</div>';
}

function saveGradePolicy() {
    const selectedMethod = String((document.getElementById('gradingModel') || {}).value || 'simple');
    const allowTeacherCustom = String((document.getElementById('allowTeacherCustom') || {}).value || 'true') === 'true';
    const forcedModel = String((document.getElementById('forcedModel') || {}).value || '');
    const examMinPercent = Math.max(0, Math.min(100, parseInt((document.getElementById('examMinPercent') || {}).value || '0', 10) || 0));
    const examMaxPercent = Math.max(0, Math.min(100, parseInt((document.getElementById('examMaxPercent') || {}).value || '100', 10) || 100));
    const scheduleSelectionMode = String((document.getElementById('scheduleSelectionMode') || {}).value || 'free') === 'admin' ? 'admin' : 'free';
    state.gradePolicy = { selectedMethod, allowTeacherCustom, forcedModel, examMinPercent, examMaxPercent, scheduleSelectionMode };
    api('/api/config/grade-policy', { method: 'PUT', headers: headers(), body: JSON.stringify(state.gradePolicy) }).catch(() => {});
    renderOverview();
    showToast('Política de calificación guardada', 'success');
}

function renderCutPeriodsSection() {
    const host = document.getElementById('cutPeriodsList');
    if (!host) return;
    const periods = asArray(state.cutPeriods);
    if (!periods.length) {
        host.innerHTML = '<div class="muted" style="padding:8px 0">No hay periodos configurados.</div>';
        return;
    }
    host.innerHTML = periods.map((p, i) => `
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr auto;gap:8px;align-items:end;margin-bottom:10px;padding:10px;border:1px solid rgba(11,31,58,0.08);border-radius:8px" data-cut-index="${i}">
            <div class="form-group" style="margin:0">
                <label class="form-label" style="font-size:11px">Nombre</label>
                <input type="text" class="form-input cut-period-name" value="${escapeHtml(p.name || '')}" placeholder="Ej: Primer corte">
            </div>
            <div class="form-group" style="margin:0">
                <label class="form-label" style="font-size:11px">Inicio</label>
                <input type="date" class="form-input cut-period-start" value="${escapeHtml(p.startDate || '')}">
            </div>
            <div class="form-group" style="margin:0">
                <label class="form-label" style="font-size:11px">Cierre</label>
                <input type="date" class="form-input cut-period-end" value="${escapeHtml(p.endDate || '')}">
            </div>
            <div class="form-group" style="margin:0">
                <label class="form-label" style="font-size:11px">Habilitar desde</label>
                <input type="date" class="form-input cut-period-enabled" value="${escapeHtml(p.enabledFrom || '')}">
            </div>
            <button class="btn btn-sm btn-danger" onclick="removeCutPeriod(${i})" title="Eliminar">×</button>
        </div>
    `).join('');
}

function addCutPeriod() {
    state.cutPeriods = asArray(state.cutPeriods);
    state.cutPeriods.push({ name: '', startDate: '', endDate: '', enabledFrom: '' });
    renderCutPeriodsSection();
}

function removeCutPeriod(index) {
    state.cutPeriods = asArray(state.cutPeriods);
    state.cutPeriods.splice(index, 1);
    renderCutPeriodsSection();
}

function saveCutPeriods() {
    const host = document.getElementById('cutPeriodsList');
    if (!host) return;
    const rows = host.querySelectorAll('[data-cut-index]');
    const periods = [];
    rows.forEach(row => {
        const name = String((row.querySelector('.cut-period-name') || {}).value || '').trim();
        const startDate = String((row.querySelector('.cut-period-start') || {}).value || '').trim();
        const endDate = String((row.querySelector('.cut-period-end') || {}).value || '').trim();
        const enabledFrom = String((row.querySelector('.cut-period-enabled') || {}).value || '').trim();
        if (name) periods.push({ name, startDate, endDate, enabledFrom });
    });
    state.cutPeriods = periods;
    api('/api/config/cut-periods', { method: 'PUT', headers: headers(), body: JSON.stringify(periods) }).catch(() => {});
    renderCutPeriodsSection();
    showToast('Periodos de corte guardados', 'success');
}

function renderEnrollmentsTable() {
    const host = document.getElementById('courseEnrollmentList');
    if (!host) return;

    const enrollmentRows = (state.enrollments || []).map(e => {
        const studentObj = e.student || (state.students || []).find(s => String(s.id) === String(e.studentId || '')) || {};
        const courseObj = e.course || (state.courses || []).find(c => String(c.id) === String(e.courseId || '')) || {};
        const courseId = String(courseObj.id || e.courseId || '');
        const levelId = String((state.courseLevels || {})[courseId] || '');
        const gradeId = String((state.courseGrades || {})[courseId] || '');
        const level = (state.academicLevels || []).find(l => String(l.id) === levelId);
        const grade = (state.academicGrades || []).find(g => String(g.id) === gradeId);
        const teacherName = courseObj.teacher ? userNameFrom(courseObj.teacher) : 'Sin docente';
        const dateText = e.enrollmentDate ? new Date(e.enrollmentDate).toLocaleDateString('es-CO') : 'N/A';
        return {
            student: userNameFrom(studentObj),
            studentCode: studentObj.studentCode || 'N/A',
            courseName: courseObj.name || 'Sin curso',
            courseCode: courseObj.courseCode || 'Sin código',
            teacherName,
            levelName: level ? level.name : 'Sin nivel',
            gradeName: grade ? grade.name : 'Sin grado',
            dateText
        };
    });

    const paged = paginateItems(enrollmentRows, modalState.enrollmentSummary.page, modalState.enrollmentSummary.pageSize);
    modalState.enrollmentSummary.page = paged.page;
    const rows = paged.items.map(r => `
        <tr>
            <td>
                <div style="font-weight:600">${escapeHtml(r.student)}</div>
                <div class="muted" style="font-size:12px">${escapeHtml(r.studentCode)}</div>
            </td>
            <td>
                <div style="font-weight:600">${escapeHtml(r.courseName)}</div>
                <div class="muted" style="font-size:12px">${escapeHtml(r.courseCode)}</div>
            </td>
            <td>${escapeHtml(r.levelName)}</td>
            <td>${escapeHtml(r.gradeName)}</td>
            <td>${escapeHtml(r.teacherName)}</td>
            <td>${escapeHtml(r.dateText)}</td>
        </tr>
    `).join('');

    host.innerHTML = enrollmentRows.length
        ? `
            <table class="table">
                <thead>
                    <tr>
                        <th>Estudiante</th>
                        <th>Curso</th>
                        <th>Nivel</th>
                        <th>Grado</th>
                        <th>Docente</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <div class="pager" style="margin-top:10px">
                <button class="btn btn-sm btn-outline" ${paged.page <= 1 ? 'disabled' : ''} onclick="enrollmentPrevPage()">Anterior</button>
                <span>${paged.page}/${paged.totalPages}</span>
                <button class="btn btn-sm btn-outline" ${paged.page >= paged.totalPages ? 'disabled' : ''} onclick="enrollmentNextPage()">Siguiente</button>
            </div>
        `
        : '<div class="muted">No hay matrículas registradas.</div>';
}

function enrollmentPrevPage() {
    modalState.enrollmentSummary.page = Math.max(1, (modalState.enrollmentSummary.page || 1) - 1);
    renderEnrollmentsTable();
}

function enrollmentNextPage() {
    modalState.enrollmentSummary.page = (modalState.enrollmentSummary.page || 1) + 1;
    renderEnrollmentsTable();
}

function renderLevelsTable() {
    const host = document.getElementById('levelsTable');
    if (!host) return;
    const query = String(modalState.levelsSummary.query || '').trim().toLowerCase();
    const filter = String(modalState.levelsSummary.filter || 'all');
    const levelRows = (state.academicLevels || []).map(level => {
        const id = String(level.id);
        const grades = (state.academicGrades || []).filter(g => String(g.levelId) === id);
        const courses = (state.courses || []).filter(c => String((state.courseLevels || {})[String(c.id)] || '') === id);
        const teachers = (state.teachers || []).filter(t => (state.teacherLevels[String(t.id)] || []).map(String).includes(id));
        return {
            level,
            grades,
            courses,
            teachers,
            gradeNames: grades.map(g => g.name),
            courseNames: courses.map(c => c.name || 'Curso'),
            teacherNames: teachers.map(t => userNameFrom(t)),
            gradesText: grades.map(g => g.name).join(', ') || 'Sin grados',
            coursesText: courses.map(c => c.name || 'Curso').join(', ') || 'Sin cursos',
            teachersText: teachers.map(t => userNameFrom(t)).join(', ') || 'Sin docentes'
        };
    }).filter(item => {
        if (query) {
            const matches = normalizedIncludes(item.level.name, query)
                || normalizedIncludes(item.level.description, query)
                || normalizedIncludes(item.gradesText, query)
                || normalizedIncludes(item.coursesText, query)
                || normalizedIncludes(item.teachersText, query);
            if (!matches) return false;
        }
        if (filter === 'with-courses') return item.courses.length > 0;
        if (filter === 'without-courses') return item.courses.length === 0;
        if (filter === 'with-teachers') return item.teachers.length > 0;
        if (filter === 'without-teachers') return item.teachers.length === 0;
        return true;
    });

    const paged = paginateItems(levelRows, modalState.levelsSummary.page, modalState.levelsSummary.pageSize);
    modalState.levelsSummary.page = paged.page;
    const rows = paged.items.map(item => `
        <tr>
            <td>
                <div style="font-weight:600">${escapeHtml(item.level.name || '')}</div>
                <div class="muted" style="font-size:12px">${escapeHtml(item.level.description || 'Sin descripción')}</div>
            </td>
            <td>
                <div>${item.grades.length}</div>
                <div class="muted" style="font-size:12px">${escapeHtml(buildCompactNames(item.gradeNames, 5))}</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${item.grades.slice(0, 5).map(g => `<span style="display:inline-flex;align-items:center;gap:4px;background:#eef4fb;border-radius:999px;padding:2px 8px;font-size:11px">${escapeHtml(g.name)} <button type="button" style="border:none;background:transparent;color:#8a1529;cursor:pointer" onclick="deleteAcademicGrade('${escapeJsSingle(String(g.id))}')">x</button></span>`).join('')}${item.grades.length > 5 ? `<button class="btn btn-sm btn-outline" onclick="openLevelDetailsModal('${String(item.level.id)}')">Ver más</button>` : ''}</div>
            </td>
            <td>
                <div>${item.courses.length}</div>
                <div class="muted" style="font-size:12px">${escapeHtml(buildCompactNames(item.courseNames, 4))}</div>
            </td>
            <td>
                <div>${item.teachers.length}</div>
                <div class="muted" style="font-size:12px">${escapeHtml(buildCompactNames(item.teacherNames, 4))}</div>
            </td>
            <td>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                    <button class="btn btn-sm btn-outline" onclick="openLevelDetailsModal('${String(item.level.id)}')">Detalles</button>
                    <button class="btn btn-sm btn-outline" onclick="editAcademicLevel('${String(item.level.id)}')">Editar</button>
                    <button class="btn btn-sm btn-outline" onclick="addGradeToLevel('${String(item.level.id)}')">Añadir grado</button>
                    <button class="btn btn-sm btn-outline" onclick="deleteAcademicLevel('${String(item.level.id)}')">Eliminar</button>
                </div>
            </td>
        </tr>
    `).join('');

    host.innerHTML = levelRows.length
        ? `
            <table class="table">
                <thead>
                    <tr><th>Nivel</th><th>Grados</th><th>Cursos</th><th>Docentes</th><th>Gestionar</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <div class="pager" style="margin-top:10px">
                <button class="btn btn-sm btn-outline" ${paged.page <= 1 ? 'disabled' : ''} onclick="levelsPrevPage()">Anterior</button>
                <span>${paged.page}/${paged.totalPages}</span>
                <button class="btn btn-sm btn-outline" ${paged.page >= paged.totalPages ? 'disabled' : ''} onclick="levelsNextPage()">Siguiente</button>
            </div>
        `
        : '<div class="muted">No hay niveles para mostrar con el filtro actual.</div>';
}

function levelsPrevPage() {
    modalState.levelsSummary.page = Math.max(1, (modalState.levelsSummary.page || 1) - 1);
    renderLevelsTable();
}

function levelsNextPage() {
    modalState.levelsSummary.page = (modalState.levelsSummary.page || 1) + 1;
    renderLevelsTable();
}

function editAcademicLevel(levelId) {
    const level = (state.academicLevels || []).find(l => String(l.id) === String(levelId));
    if (!level) return;
    openModal('Editar nivel', `
        <div class="form-group"><label class="form-label">Nombre</label><input id="editLevelName" class="form-input" value="${escapeHtml(level.name || '')}"></div>
        <div class="form-group"><label class="form-label">Descripción</label><input id="editLevelDescription" class="form-input" value="${escapeHtml(level.description || '')}"></div>
        <div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn btn-outline" onclick="closeModal()">Cancelar</button><button class="btn btn-teal" onclick="saveAcademicLevelEdit('${String(level.id)}')">Guardar</button></div>
    `);
}

function saveAcademicLevelEdit(levelId) {
    const name = String((document.getElementById('editLevelName') || {}).value || '').trim();
    const description = String((document.getElementById('editLevelDescription') || {}).value || '').trim();
    if (!name) return showToast('Nombre del nivel requerido', 'error');
    state.academicLevels = (state.academicLevels || []).map(l => String(l.id) === String(levelId) ? { ...l, name, description } : l);
    saveLevelsState();
    closeModal();
    renderCoursesSection();
}

function addGradeToLevel(levelId) {
    openModal('Añadir grado', `
        <div class="form-group"><label class="form-label">Nombre del grado</label><input id="newGradeForLevelName" class="form-input" placeholder="Ej: 7A"></div>
        <div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn btn-outline" onclick="closeModal()">Cancelar</button><button class="btn btn-teal" onclick="saveNewGradeForLevel('${String(levelId)}')">Añadir</button></div>
    `);
}

function saveNewGradeForLevel(levelId) {
    const raw = String((document.getElementById('newGradeForLevelName') || {}).value || '').trim();
    if (!raw) return showToast('Nombre del grado requerido', 'error');
    const parsed = raw.split(',').map(x => x.trim()).filter(Boolean);
    const existing = new Set(
        (state.academicGrades || [])
            .filter(g => String(g.levelId) === String(levelId))
            .map(g => String(g.name || '').toLowerCase())
    );
    let created = 0;
    parsed.forEach((name, idx) => {
        const key = String(name || '').toLowerCase();
        if (!key || existing.has(key)) return;
        state.academicGrades.push({ id: 'gr-' + Date.now() + '-' + idx, levelId: String(levelId), name });
        existing.add(key);
        created += 1;
    });
    if (!created) return showToast('No se agregaron grados (duplicados o vacíos)', 'error');
    saveLevelsState();
    closeModal();
    renderCoursesSection();
    showToast(`Grados agregados: ${created}`, 'success');
}

async function deleteAcademicGrade(gradeId) {
    const target = (state.academicGrades || []).find(g => String(g.id) === String(gradeId));
    if (!target) return;
    const doDelete = async () => {
        let serverError = null;
        try {
            const id = parseInt(gradeId, 10);
            if (!isNaN(id)) {
                const res = await fetch(API + '/api/academic-grades/' + id, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: { ...headers(false) }
                });
                if (!res.ok && res.status !== 404) {
                    const body = await res.text().catch(() => '');
                    let msg = '';
                    try { msg = JSON.parse(body).error || ''; } catch (e) {}
                    if (res.status === 409) {
                        serverError = msg || 'El grado está en uso y no se puede eliminar.';
                    } else {
                        serverError = msg || ('HTTP ' + res.status);
                    }
                }
            }
        } catch (e) {
            serverError = 'Error de red';
        }
        // Siempre eliminar localmente para mantener la UI sincronizada
        state.academicGrades = (state.academicGrades || []).filter(g => String(g.id) !== String(gradeId));
        Object.keys(state.courseGrades || {}).forEach(cid => {
            if (String(state.courseGrades[cid]) === String(gradeId)) delete state.courseGrades[cid];
        });
        Object.keys(state.teacherGrades || {}).forEach(tid => {
            const byLevel = state.teacherGrades[tid] || {};
            Object.keys(byLevel).forEach(lid => {
                byLevel[lid] = (byLevel[lid] || []).filter(gid => String(gid) !== String(gradeId));
            });
        });
        Object.keys(state.studentGrades || {}).forEach(sid => {
            if (String(state.studentGrades[sid]) === String(gradeId)) delete state.studentGrades[sid];
        });
        cleanupStudentAcademicLinks();
        cleanupAssistantSelections();
        saveLevelsState();
        saveCourseGradesToBackend();
        saveStudentGradesToBackend();
        renderCoursesSection();
        if (serverError) {
            showToast(serverError, 'error');
        } else {
            showToast(`Grado eliminado: ${target.name || 'N/A'}`, 'success');
        }
    };
    openConfirmModal('Eliminar grado', `¿Eliminar el grado <strong>${escapeHtml(target.name || '')}</strong>?`, doDelete, 'Eliminar');
}

async function deleteAcademicLevel(levelId) {
    const target = (state.academicLevels || []).find(l => String(l.id) === String(levelId));
    if (!target) return;
    const doDelete = async () => {
        let serverError = null;
        const id = String(levelId);
        const numericId = parseInt(levelId, 10);
        if (!isNaN(numericId)) {
            try {
                const res = await fetch(API + '/api/academic-levels/' + numericId, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: { ...headers(false) }
                });
                if (!res.ok && res.status !== 404) {
                    const body = await res.text().catch(() => '');
                    let msg = '';
                    try { msg = JSON.parse(body).error || ''; } catch (e) {}
                    if (res.status === 409) {
                        serverError = msg || 'El nivel tiene grados o registros vinculados y no se puede eliminar.';
                    } else {
                        serverError = msg || ('HTTP ' + res.status);
                    }
                }
            } catch (e) {
                serverError = 'Error de red';
            }
        }
        const removedGrades = new Set((state.academicGrades || []).filter(g => String(g.levelId) === id).map(g => String(g.id)));
        state.academicLevels = (state.academicLevels || []).filter(l => String(l.id) !== id);
        state.academicGrades = (state.academicGrades || []).filter(g => String(g.levelId) !== id);
        Object.keys(state.courseLevels || {}).forEach(cid => {
            if (String(state.courseLevels[cid]) === id) {
                delete state.courseLevels[cid];
                delete state.courseGrades[cid];
            }
        });
        Object.keys(state.teacherLevels || {}).forEach(tid => {
            state.teacherLevels[tid] = (state.teacherLevels[tid] || []).filter(lid => String(lid) !== id);
        });
        Object.keys(state.teacherGrades || {}).forEach(tid => {
            const byLevel = state.teacherGrades[tid] || {};
            delete byLevel[id];
            Object.keys(byLevel).forEach(lid => {
                byLevel[lid] = (byLevel[lid] || []).filter(gid => !removedGrades.has(String(gid)));
            });
        });
        Object.keys(state.studentLevels || {}).forEach(sid => {
            if (String(state.studentLevels[sid]) === id) {
                delete state.studentLevels[sid];
                delete state.studentGrades[sid];
            }
        });
        cleanupStudentAcademicLinks();
        cleanupAssistantSelections();
        saveLevelsState();
        saveCourseGradesToBackend();
        saveStudentGradesToBackend();
        renderCoursesSection();
        if (serverError) {
            showToast(serverError, 'error');
        } else {
            showToast('Nivel eliminado', 'success');
        }
    };
    openConfirmModal('Eliminar nivel', `¿Eliminar el nivel <strong>${escapeHtml(target.name || '')}</strong>? Esto también eliminará todos sus grados localmente.`, doDelete, 'Eliminar');
}

function applyLevelsSummaryFilters() {
    const queryEl = document.getElementById('levelsSearch');
    const filterEl = document.getElementById('levelsFilter');
    modalState.levelsSummary.query = String((queryEl || {}).value || '').trim();
    modalState.levelsSummary.filter = String((filterEl || {}).value || 'all');
    modalState.levelsSummary.page = 1;
    renderLevelsTable();
}

function getEnrollmentStudentId(enrollment) {
    return String((enrollment.student || {}).id || enrollment.studentId || '');
}

function getEnrollmentCourseId(enrollment) {
    return String((enrollment.course || {}).id || enrollment.courseId || '');
}

function getCourseAssignedCount(courseId) {
    const cid = String(courseId || '');
    return (state.enrollments || []).filter(e => getEnrollmentCourseId(e) === cid).length;
}

function isAlreadyEnrolled(studentId, courseId) {
    const sid = String(studentId || '');
    const cid = String(courseId || '');
    return (state.enrollments || []).some(e => getEnrollmentStudentId(e) === sid && getEnrollmentCourseId(e) === cid);
}

function getAssistantFilteredStudents() {
    const query = String(modalState.studentCourse.queryStudent || '').toLowerCase();
    const onlyWithoutCourse = !!modalState.studentCourse.onlyWithoutCourse;
    const levelId = String(modalState.studentCourse.levelId || '');
    const gradeId = String((modalState.studentCourse.gradeIds || [])[0] || '');
    return (state.students || []).filter(s => {
        const sid = String(s.id || '');
        const name = String(userNameFrom(s) || '').toLowerCase();
        const code = String(s.studentCode || '').toLowerCase();
        const hasCourse = (state.enrollments || []).some(e => getEnrollmentStudentId(e) === sid);
        if (levelId && String((state.studentLevels || {})[sid] || '') !== levelId) return false;
        if (gradeId && String((state.studentGrades || {})[sid] || '') !== gradeId) return false;
        if (onlyWithoutCourse && hasCourse) return false;
        return !query || name.includes(query) || code.includes(query);
    });
}

function getAssistantFilteredCourses() {
    const query = String(modalState.studentCourse.queryCourse || '').toLowerCase();
    const levelId = String(modalState.studentCourse.levelId || '');
    const gradeId = String((modalState.studentCourse.gradeIds || [])[0] || '');
    return (state.courses || []).filter(c => {
        const cid = String(c.id);
        const byName = String(c.name || '').toLowerCase();
        const byCode = String(c.courseCode || '').toLowerCase();
        if (query && !byName.includes(query) && !byCode.includes(query)) return false;
        if (levelId && String((state.courseLevels || {})[cid] || '') !== levelId) return false;
        if (gradeId && String((state.courseGrades || {})[cid] || '') !== gradeId) return false;
        return true;
    });
}

function renderStudentCourseAssistant() {
    const studentItems = getAssistantFilteredStudents();
    const courseItems = getAssistantFilteredCourses();
    const gradesByLevel = modalState.studentCourse.levelId ? getGradesByLevel(modalState.studentCourse.levelId) : (state.academicGrades || []);
    const gradesPaged = paginateItems(gradesByLevel, modalState.studentCourse.gradePage, modalState.studentCourse.gradePageSize);
    const studentsPaged = paginateItems(studentItems, modalState.studentCourse.pageStudents, modalState.studentCourse.pageSize);
    const coursesPaged = paginateItems(courseItems, modalState.studentCourse.pageCourses, modalState.studentCourse.pageSize);
    modalState.studentCourse.gradePage = gradesPaged.page;
    modalState.studentCourse.pageStudents = studentsPaged.page;
    modalState.studentCourse.pageCourses = coursesPaged.page;

    const selectedStudents = Object.keys(modalState.studentCourse.selectedStudents || {}).filter(k => modalState.studentCourse.selectedStudents[k]);
    const selectedCourses = Object.keys(modalState.studentCourse.selectedCourses || {}).filter(k => modalState.studentCourse.selectedCourses[k]);

    const levelOptions = `<option value="">Todos los niveles</option>` + (state.academicLevels || []).map(l => `<option value="${l.id}" ${String(modalState.studentCourse.levelId || '') === String(l.id) ? 'selected' : ''}>${escapeHtml(l.name || '')}</option>`).join('');

    const gradeSelected = String((modalState.studentCourse.gradeIds || [])[0] || '');
    const gradesCards = gradesPaged.items.map(g => {
        const active = gradeSelected === String(g.id);
        return `<button type="button" class="btn btn-sm ${active ? 'btn-teal' : 'btn-outline'}" onclick="setAssistantGradeFilter('${String(g.id)}')">${escapeHtml(g.name || 'Grado')}</button>`;
    }).join('') || '<span class="muted">Sin grados en este nivel.</span>';

    const studentsHtml = studentsPaged.items.map(s => {
        const sid = String(s.id);
        const checked = modalState.studentCourse.selectedStudents[sid] ? 'checked' : '';
        return `<label class="card-check"><input type="checkbox" ${checked} onchange="toggleAssistantStudent('${sid}', this.checked)"><span>${escapeHtml(userNameFrom(s))} <small class="muted">(${escapeHtml(s.studentCode || 'N/A')})</small></span></label>`;
    }).join('') || '<div class="muted">Sin estudiantes para el filtro.</div>';

    const coursesHtml = coursesPaged.items.map(c => {
        const cid = String(c.id);
        const checked = modalState.studentCourse.selectedCourses[cid] ? 'checked' : '';
        const assigned = getCourseAssignedCount(cid);
        const capacity = parseInt((state.courseCapacity || {})[cid] || '0', 10) || 0;
        const seat = capacity > 0 ? `${assigned}/${capacity}` : `${assigned}`;
        return `<label class="card-check"><input type="checkbox" ${checked} onchange="toggleAssistantCourse('${cid}', this.checked)"><span>${escapeHtml(c.name || 'Curso')} <small class="muted">(${escapeHtml(c.courseCode || 'Sin código')} - ${seat})</small></span></label>`;
    }).join('') || '<div class="muted">Sin cursos para el filtro.</div>';

    openModal('Asistente de asignación de cursos', `
        <div class="form-row">
            <div class="form-group"><label class="form-label">Buscar estudiante</label><input id="assistantStudentQuery" class="form-input" value="${escapeHtml(modalState.studentCourse.queryStudent || '')}" placeholder="Nombre o código"></div>
            <div class="form-group"><label class="form-label">Buscar curso</label><input id="assistantCourseQuery" class="form-input" value="${escapeHtml(modalState.studentCourse.queryCourse || '')}" placeholder="Nombre o código"></div>
            <div class="form-group"><label class="form-label">Nivel</label><select id="assistantLevelFilter" class="form-input">${levelOptions}</select></div>
        </div>
        <div class="form-group" style="margin-top:4px;display:flex;align-items:center;gap:8px">
            <input type="checkbox" id="assistantOnlyWithoutCourse" ${modalState.studentCourse.onlyWithoutCourse ? 'checked' : ''}>
            <label class="form-label" for="assistantOnlyWithoutCourse" style="margin:0">Solo estudiantes sin curso</label>
        </div>
        <div class="form-group" style="margin-top:4px">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
                <label class="form-label" style="margin:0">Grados</label>
                <div style="display:flex;gap:6px;align-items:center">
                    <button class="btn btn-sm btn-outline" onclick="setAssistantGradeFilter('')">Todos</button>
                    <button class="btn btn-sm btn-outline" ${gradesPaged.page <= 1 ? 'disabled' : ''} onclick="assistantGradesPrevPage()">Anterior</button>
                    <span style="font-size:12px;color:var(--text-muted)">${gradesPaged.page}/${gradesPaged.totalPages}</span>
                    <button class="btn btn-sm btn-outline" ${gradesPaged.page >= gradesPaged.totalPages ? 'disabled' : ''} onclick="assistantGradesNextPage()">Siguiente</button>
                </div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${gradesCards}</div>
        </div>
        <div class="assign-grid">
            <div class="assign-col">
                <div class="assign-head">Estudiantes (${selectedStudents.length} seleccionados)</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
                    <button class="btn btn-sm btn-outline" onclick="selectAllAssistantStudentsPage()">Seleccionar página</button>
                    <button class="btn btn-sm btn-outline" onclick="selectAllAssistantStudentsFiltered()">Seleccionar filtrados</button>
                    <button class="btn btn-sm btn-outline" onclick="clearAssistantStudentsSelection()">Deseleccionar todos</button>
                </div>
                <div class="card-list">${studentsHtml}</div>
                <div class="pager" style="margin-top:8px">
                    <button class="btn btn-sm btn-outline" ${studentsPaged.page <= 1 ? 'disabled' : ''} onclick="assistantStudentsPrevPage()">Anterior</button>
                    <span>${studentsPaged.page}/${studentsPaged.totalPages}</span>
                    <button class="btn btn-sm btn-outline" ${studentsPaged.page >= studentsPaged.totalPages ? 'disabled' : ''} onclick="assistantStudentsNextPage()">Siguiente</button>
                </div>
            </div>
            <div class="assign-col">
                <div class="assign-head">Cursos (${selectedCourses.length} seleccionados)</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
                    <button class="btn btn-sm btn-outline" onclick="selectAllAssistantCoursesPage()">Seleccionar página</button>
                    <button class="btn btn-sm btn-outline" onclick="selectAllAssistantCoursesFiltered()">Seleccionar todos los cursos</button>
                    <button class="btn btn-sm btn-outline" onclick="clearAssistantCoursesSelection()">Deseleccionar todos</button>
                </div>
                <div class="card-list">${coursesHtml}</div>
                <div class="pager" style="margin-top:8px">
                    <button class="btn btn-sm btn-outline" ${coursesPaged.page <= 1 ? 'disabled' : ''} onclick="assistantCoursesPrevPage()">Anterior</button>
                    <span>${coursesPaged.page}/${coursesPaged.totalPages}</span>
                    <button class="btn btn-sm btn-outline" ${coursesPaged.page >= coursesPaged.totalPages ? 'disabled' : ''} onclick="assistantCoursesNextPage()">Siguiente</button>
                </div>
            </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">
            <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-outline" onclick="removeStudentCourseAssignments()">Desasignar seleccionados</button>
            <button class="btn btn-teal" onclick="applyStudentCourseAssignments()">Asignar seleccionados</button>
        </div>
    `);

    const studentQuery = document.getElementById('assistantStudentQuery');
    if (studentQuery) studentQuery.addEventListener('input', ev => {
        modalState.studentCourse.queryStudent = String(ev.target.value || '');
        modalState.studentCourse.pageStudents = 1;
        renderStudentCourseAssistant();
    });
    const courseQuery = document.getElementById('assistantCourseQuery');
    if (courseQuery) courseQuery.addEventListener('input', ev => {
        modalState.studentCourse.queryCourse = String(ev.target.value || '');
        modalState.studentCourse.pageCourses = 1;
        renderStudentCourseAssistant();
    });
    const levelSel = document.getElementById('assistantLevelFilter');
    if (levelSel) levelSel.addEventListener('change', ev => {
        modalState.studentCourse.levelId = String(ev.target.value || '');
        modalState.studentCourse.gradeIds = [];
        modalState.studentCourse.gradePage = 1;
        modalState.studentCourse.pageCourses = 1;
        renderStudentCourseAssistant();
    });
    const onlyWithoutCourse = document.getElementById('assistantOnlyWithoutCourse');
    if (onlyWithoutCourse) onlyWithoutCourse.addEventListener('change', ev => {
        modalState.studentCourse.onlyWithoutCourse = !!ev.target.checked;
        modalState.studentCourse.pageStudents = 1;
        renderStudentCourseAssistant();
    });
}

function toggleAssistantStudent(studentId, checked) {
    modalState.studentCourse.selectedStudents[String(studentId)] = !!checked;
}

function toggleAssistantCourse(courseId, checked) {
    modalState.studentCourse.selectedCourses[String(courseId)] = !!checked;
}

function assistantStudentsPrevPage() {
    modalState.studentCourse.pageStudents = Math.max(1, (modalState.studentCourse.pageStudents || 1) - 1);
    renderStudentCourseAssistant();
}

function assistantStudentsNextPage() {
    modalState.studentCourse.pageStudents = (modalState.studentCourse.pageStudents || 1) + 1;
    renderStudentCourseAssistant();
}

function assistantCoursesPrevPage() {
    modalState.studentCourse.pageCourses = Math.max(1, (modalState.studentCourse.pageCourses || 1) - 1);
    renderStudentCourseAssistant();
}

function assistantCoursesNextPage() {
    modalState.studentCourse.pageCourses = (modalState.studentCourse.pageCourses || 1) + 1;
    renderStudentCourseAssistant();
}

function assistantGradesPrevPage() {
    modalState.studentCourse.gradePage = Math.max(1, (modalState.studentCourse.gradePage || 1) - 1);
    renderStudentCourseAssistant();
}

function assistantGradesNextPage() {
    modalState.studentCourse.gradePage = (modalState.studentCourse.gradePage || 1) + 1;
    renderStudentCourseAssistant();
}

function setAssistantGradeFilter(gradeId) {
    const val = String(gradeId || '');
    modalState.studentCourse.gradeIds = val ? [val] : [];
    modalState.studentCourse.pageCourses = 1;
    renderStudentCourseAssistant();
}

function selectAllAssistantStudentsPage() {
    const page = paginateItems(getAssistantFilteredStudents(), modalState.studentCourse.pageStudents, modalState.studentCourse.pageSize);
    (page.items || []).forEach(s => { modalState.studentCourse.selectedStudents[String(s.id)] = true; });
    renderStudentCourseAssistant();
}

function selectAllAssistantStudentsFiltered() {
    (getAssistantFilteredStudents() || []).forEach(s => { modalState.studentCourse.selectedStudents[String(s.id)] = true; });
    renderStudentCourseAssistant();
}

function clearAssistantStudentsSelection() {
    modalState.studentCourse.selectedStudents = {};
    renderStudentCourseAssistant();
}

function selectAllAssistantCoursesPage() {
    const page = paginateItems(getAssistantFilteredCourses(), modalState.studentCourse.pageCourses, modalState.studentCourse.pageSize);
    (page.items || []).forEach(c => { modalState.studentCourse.selectedCourses[String(c.id)] = true; });
    renderStudentCourseAssistant();
}

function selectAllAssistantCoursesFiltered() {
    (getAssistantFilteredCourses() || []).forEach(c => { modalState.studentCourse.selectedCourses[String(c.id)] = true; });
    renderStudentCourseAssistant();
}

function clearAssistantCoursesSelection() {
    modalState.studentCourse.selectedCourses = {};
    renderStudentCourseAssistant();
}

async function applyStudentCourseAssignments() {
    const studentIds = Object.keys(modalState.studentCourse.selectedStudents || {}).filter(k => modalState.studentCourse.selectedStudents[k]);
    const courseIds = Object.keys(modalState.studentCourse.selectedCourses || {}).filter(k => modalState.studentCourse.selectedCourses[k]);
    if (!studentIds.length || !courseIds.length) return showToast('Selecciona estudiantes y cursos', 'error');

    let created = 0;
    let skipped = 0;
    for (const sid of studentIds) {
        for (const cid of courseIds) {
            if (isAlreadyEnrolled(sid, cid)) {
                skipped += 1;
                continue;
            }
            try {
                const saved = await api('/api/enrollments', {
                    method: 'POST',
                    headers: headers(),
                    body: JSON.stringify({ studentId: parseInt(sid, 10), courseId: parseInt(cid, 10) })
                });
                state.enrollments.push(saved);
            } catch (e) {
                showToast('No se pudo crear asignación en backend: ' + (e && e.message ? e.message : 'error desconocido'), 'error');
                continue;
            }
            created += 1;
        }
    }

    closeModal();
    renderCoursesSection();
    renderOverview();
    showToast(`Asignaciones creadas: ${created}. Omitidas: ${skipped}.`, 'success');
}

async function removeStudentCourseAssignments() {
    const studentIds = Object.keys(modalState.studentCourse.selectedStudents || {}).filter(k => modalState.studentCourse.selectedStudents[k]);
    const courseIds = Object.keys(modalState.studentCourse.selectedCourses || {}).filter(k => modalState.studentCourse.selectedCourses[k]);
    if (!studentIds.length || !courseIds.length) return showToast('Selecciona estudiantes y cursos', 'error');

    const studentsSet = new Set(studentIds.map(String));
    const coursesSet = new Set(courseIds.map(String));
    const targets = (state.enrollments || []).filter(e => studentsSet.has(getEnrollmentStudentId(e)) && coursesSet.has(getEnrollmentCourseId(e)));
    if (!targets.length) return showToast('No hay asignaciones para eliminar con esa selección', 'info');

    let removed = 0;
    let failed = 0;
    const removedIds = new Set();

    for (const enrollment of targets) {
        const id = String((enrollment || {}).id || '').trim();
        if (!id) continue;
        try {
            await api('/api/enrollments/' + encodeURIComponent(id), {
                method: 'DELETE',
                headers: headers(false)
            });
            removedIds.add(id);
            removed += 1;
        } catch (e) {
            failed += 1;
        }
    }

    state.enrollments = (state.enrollments || []).filter(e => {
        const id = String((e || {}).id || '').trim();
        if (id) return !removedIds.has(id);
        return !(studentsSet.has(getEnrollmentStudentId(e)) && coursesSet.has(getEnrollmentCourseId(e)));
    });

    const removedLocal = targets.filter(e => !String((e || {}).id || '').trim()).length;
    removed += removedLocal;

    closeModal();
    renderCoursesSection();
    renderOverview();
    if (failed > 0) {
        showToast(`Asignaciones eliminadas: ${removed}. Fallidas: ${failed}.`, 'error');
        return;
    }
    showToast(`Asignaciones eliminadas: ${removed}.`, 'success');
}

function openStudentCourseModal() {
    cleanupStudentAcademicLinks();
    cleanupAssistantSelections();
    modalState.studentCourse.queryStudent = '';
    modalState.studentCourse.queryCourse = '';
    modalState.studentCourse.onlyWithoutCourse = false;
    modalState.studentCourse.gradePage = 1;
    modalState.studentCourse.pageStudents = 1;
    modalState.studentCourse.pageCourses = 1;
    modalState.studentCourse.selectedStudents = modalState.studentCourse.selectedStudents || {};
    modalState.studentCourse.selectedCourses = modalState.studentCourse.selectedCourses || {};
    renderStudentCourseAssistant();
}

function openCourseLevelModal() {
    showToast('La asignación curso-nivel se realiza desde el formulario de creación de curso.', 'info');
}

function openDeleteAllUsersModal() {
    openModal('Borrar todos los usuarios', `
        <p style="font-size:13px;color:var(--text-body)">Esta acción elimina datos locales de usuarios, estudiantes y matrículas del panel.</p>
        <p style="font-size:12px;color:var(--text-muted);margin-top:8px">Escribe <strong>ELIMINAR</strong> para confirmar.</p>
        <input class="form-input" id="confirmDeleteAllUsersText" placeholder="ELIMINAR" style="margin-top:8px">
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
            <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-danger" onclick="confirmDeleteAllUsers()">Borrar todo</button>
        </div>
    `);
}

function confirmDeleteAllUsers() {
    const confirmText = String((document.getElementById('confirmDeleteAllUsersText') || {}).value || '').trim().toUpperCase();
    if (confirmText !== 'ELIMINAR') {
        return showToast('Confirmación inválida. Debes escribir ELIMINAR.', 'error');
    }
    state.users = [];
    state.students = [];
    state.enrollments = [];
    state.studentLevels = {};
    state.studentGrades = {};
    cleanupAssistantSelections();
    saveLevelsState();
    saveStudentGradesToBackend();
    closeModal();
    renderOverview();
    renderEnrollmentsTable();
    showToast('Usuarios y matrículas locales eliminados', 'success');
}

function bindClickIfFn(id, fnName) {
    const fn = globalThis[fnName];
    if (typeof fn !== 'function') return;
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
}

function callIfFn(fnName, ...args) {
    const fn = globalThis[fnName];
    if (typeof fn === 'function') return fn(...args);
    return undefined;
}

function bindEvents() {
    const bindClick = (id, handler) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', handler);
    };

    document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => navigateTo(btn.dataset.section)));
    bindClick('menuToggle', () => {
        document.getElementById('sidebar').classList.add('show');
        document.getElementById('sidebarOverlay').classList.add('show');
    });
    bindClick('sidebarCloseBtn', () => {
        document.getElementById('sidebar').classList.remove('show');
        document.getElementById('sidebarOverlay').classList.remove('show');
    });
    document.getElementById('sidebarOverlay').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('show');
        document.getElementById('sidebarOverlay').classList.remove('show');
    });

    bindClick('modalClose', closeModal);
    document.getElementById('modalBackdrop').addEventListener('click', (e) => {
        if (e.target.id === 'modalBackdrop') closeModal();
    });

    bindClick('logoutBtn', () => {
        sessionService.removeItem(ADMIN_NAV_SESSION_KEY);
        fetch(API + '/api/auth/logout', { method: 'POST', credentials: 'include' }).finally(() => {
            window.location.href = '/login';
        });
    });

    bindAuditEvents();
    bindClick('btnCreateCourse', createCourse);
    bindClickIfFn('btnCreateTestTeachers', 'createTestTeachers');
    bindClickIfFn('btnCreateLevel', 'createAcademicLevel');
    bindClickIfFn('btnCreateGrade', 'createAcademicGrade');
    bindClickIfFn('btnOpenCourseLevelModal', 'openCourseLevelModal');
    bindClickIfFn('btnAssignTeacherLevel', 'assignTeacherToLevel');
    bindClickIfFn('btnOpenStudentCourseModal', 'openStudentCourseModal');
    bindClickIfFn('btnDeleteAllUsers', 'openDeleteAllUsersModal');
    ['courseName', 'courseDescription', 'courseCapacity'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', saveCourseCreateDraft);
    });
    const courseTeacherSel = document.getElementById('courseTeacher');
    if (courseTeacherSel) courseTeacherSel.addEventListener('change', () => {
        saveCourseCreateDraft();
        renderCourseLevelOptions();
        renderCourseGradeOptions();
        saveCourseCreateDraft();
    });
    const courseLevelSel = document.getElementById('courseLevel');
    if (courseLevelSel) courseLevelSel.addEventListener('change', () => {
        saveCourseCreateDraft();
        modalState.courseCreate.menuOpen = false;
        const host = document.getElementById('courseGradeMulti');
        if (host) host.classList.remove('open');
        renderCourseGradeOptions();
        saveCourseCreateDraft();
    });
    const assignTeacherLevel = document.getElementById('assignTeacherLevel');
    if (assignTeacherLevel) assignTeacherLevel.addEventListener('change', () => {
        modalState.teacherAssign.gradeIds = [];
        modalState.teacherAssign.menuOpen = false;
        const host = document.getElementById('assignTeacherGradeMulti');
        if (host) host.classList.remove('open');
        renderAssignTeacherGradeOptions();
    });
    const assignLevelTeacher = document.getElementById('assignLevelTeacher');
    if (assignLevelTeacher) assignLevelTeacher.addEventListener('change', () => {
        renderAssignTeacherGradeOptions();
    });
    const surveyStartsAt = document.getElementById('surveyStartsAt');
    if (surveyStartsAt) surveyStartsAt.addEventListener('change', ev => callIfFn('setSurveyStartsAt', (ev.target || {}).value));
    const surveyEndsAt = document.getElementById('surveyEndsAt');
    if (surveyEndsAt) surveyEndsAt.addEventListener('change', ev => callIfFn('setSurveyEndsAt', (ev.target || {}).value));
    const surveyAuthRequired = document.getElementById('surveyAuthRequired');
    if (surveyAuthRequired) surveyAuthRequired.addEventListener('change', ev => callIfFn('setSurveyAuthRequired', (ev.target || {}).value));
    document.addEventListener('click', (ev) => {
        const host = document.getElementById('courseGradeMulti');
        if (!host || !host.classList.contains('open')) return;
        if (!host.contains(ev.target)) {
            host.classList.remove('open');
            modalState.courseCreate.menuOpen = false;
        }
    });
    document.addEventListener('click', (ev) => {
        const host = document.getElementById('assignTeacherGradeMulti');
        if (!host || !host.classList.contains('open')) return;
        if (!host.contains(ev.target)) {
            host.classList.remove('open');
            modalState.teacherAssign.menuOpen = false;
        }
    });
    const levelsSearch = document.getElementById('levelsSearch');
    if (levelsSearch) levelsSearch.addEventListener('input', () => callIfFn('applyLevelsSummaryFilters'));
    const levelsFilter = document.getElementById('levelsFilter');
    if (levelsFilter) levelsFilter.addEventListener('change', () => callIfFn('applyLevelsSummaryFilters'));

    bindClickIfFn('btnCreateRole', 'createRole');
    const rolesSearch = document.getElementById('rolesSearch');
    if (rolesSearch) rolesSearch.addEventListener('input', () => {
        state.ui.rolesSearch = rolesSearch.value.trim();
        state.ui.rolesPage = 1;
        callIfFn('renderRolesSection');
    });
    bindClick('rolesPrevPage', () => {
        state.ui.rolesPage = Math.max(1, (state.ui.rolesPage || 1) - 1);
        callIfFn('renderRolesSection');
    });
    bindClick('rolesNextPage', () => {
        state.ui.rolesPage = (state.ui.rolesPage || 1) + 1;
        callIfFn('renderRolesSection');
    });

    const permRoleSearch = document.getElementById('permRoleSearch');
    if (permRoleSearch) permRoleSearch.addEventListener('input', () => {
        state.ui.permRoleSearch = permRoleSearch.value.trim();
        state.ui.permRolePage = 1;
        callIfFn('renderRolesSection');
    });
    bindClick('permRolePrevPage', () => {
        state.ui.permRolePage = Math.max(1, (state.ui.permRolePage || 1) - 1);
        callIfFn('renderRolesSection');
    });
    bindClick('permRoleNextPage', () => {
        state.ui.permRolePage = (state.ui.permRolePage || 1) + 1;
        callIfFn('renderRolesSection');
    });

    const permUserSearch = document.getElementById('permUserSearch');
    if (permUserSearch) permUserSearch.addEventListener('input', () => {
        state.ui.permUserSearch = permUserSearch.value.trim();
        state.ui.permUserPage = 1;
        callIfFn('renderRolesSection');
    });
    bindClick('permUserPrevPage', () => {
        state.ui.permUserPage = Math.max(1, (state.ui.permUserPage || 1) - 1);
        callIfFn('renderRolesSection');
    });
    bindClick('permUserNextPage', () => {
        state.ui.permUserPage = (state.ui.permUserPage || 1) + 1;
        callIfFn('renderRolesSection');
    });

    const permRole = document.getElementById('permRole');
    if (permRole) permRole.addEventListener('change', () => {
        state.ui.permRoleChecklistPage = 1;
        const perms = callIfFn('getRolePerms') || [];
        callIfFn('renderPermissionChecklist', 'permissionsChecklist', perms, 'roleperm');
    });
    const permUser = document.getElementById('permUser');
    if (permUser) permUser.addEventListener('change', () => {
        state.ui.permUserChecklistPage = 1;
        const perms = callIfFn('getUserPerms') || [];
        callIfFn('renderPermissionChecklist', 'userPermissionsChecklist', perms, 'userperm');
        callIfFn('renderUserPortalAccessChecklist');
    });
    bindClickIfFn('btnSavePerms', 'saveRolePerms');
    bindClickIfFn('btnSaveUserPerms', 'saveUserPerms');
    bindClickIfFn('btnSaveUserPortals', 'saveUserPortalAccess');

    bindClickIfFn('btnCreateAdminUser', 'createAdminUser');
    const adminUsersSearch = document.getElementById('adminUsersSearch');
    if (adminUsersSearch) adminUsersSearch.addEventListener('input', () => {
        state.ui.adminUsersSearch = adminUsersSearch.value.trim();
        state.ui.adminUsersPage = 1;
        callIfFn('renderRolesSection');
    });
    const adminUsersRoleFilter = document.getElementById('adminUsersRoleFilter');
    if (adminUsersRoleFilter) adminUsersRoleFilter.addEventListener('change', () => {
        state.ui.adminUsersRoleFilter = String(adminUsersRoleFilter.value || 'all');
        state.ui.adminUsersPage = 1;
        callIfFn('renderRolesSection');
    });
    bindClick('adminUsersPrevPage', () => {
        state.ui.adminUsersPage = Math.max(1, (state.ui.adminUsersPage || 1) - 1);
        callIfFn('renderRolesSection');
    });
    bindClick('adminUsersNextPage', () => {
        state.ui.adminUsersPage = (state.ui.adminUsersPage || 1) + 1;
        callIfFn('renderRolesSection');
    });

    const enrollmentReviewSearch = document.getElementById('enrollmentReviewSearch');
    if (enrollmentReviewSearch) enrollmentReviewSearch.addEventListener('input', ev => callIfFn('setEnrollmentReviewSearch', (ev.target || {}).value));
    const enrollmentReviewStatusFilter = document.getElementById('enrollmentReviewStatusFilter');
    if (enrollmentReviewStatusFilter) enrollmentReviewStatusFilter.addEventListener('change', ev => callIfFn('setEnrollmentReviewStatusFilter', (ev.target || {}).value));
    const enrollmentReviewLevelFilter = document.getElementById('enrollmentReviewLevelFilter');
    if (enrollmentReviewLevelFilter) enrollmentReviewLevelFilter.addEventListener('change', ev => callIfFn('setEnrollmentReviewLevelFilter', (ev.target || {}).value || 'all'));
    const enrollmentReviewFromDate = document.getElementById('enrollmentReviewFromDate');
    if (enrollmentReviewFromDate) enrollmentReviewFromDate.addEventListener('change', ev => callIfFn('setEnrollmentReviewFromDate', (ev.target || {}).value));
    const enrollmentReviewToDate = document.getElementById('enrollmentReviewToDate');
    if (enrollmentReviewToDate) enrollmentReviewToDate.addEventListener('change', ev => callIfFn('setEnrollmentReviewToDate', (ev.target || {}).value));
    bindClickIfFn('btnEnrollmentSelectPage', 'selectCurrentPageEnrollmentReviews');
    bindClickIfFn('btnEnrollmentSelectFiltered', 'selectFilteredEnrollmentReviews');
    bindClickIfFn('btnEnrollmentClearSelection', 'clearEnrollmentReviewSelection');
    bindClickIfFn('btnEnrollmentApproveSelected', 'approveSelectedEnrollmentRequests');
    bindClickIfFn('btnEnrollmentRejectSelected', 'rejectSelectedEnrollmentRequests');
    bindClick('btnEnrollmentFormAddField', () => callIfFn('addEnrollmentFormField', 'text'));
    bindClick('btnEnrollmentFormAddFile', () => callIfFn('addEnrollmentFormField', 'file'));
    bindClickIfFn('btnEnrollmentFormResetDefault', 'resetEnrollmentFormBuilderDefault');
    bindClickIfFn('btnEnrollmentFormSave', 'persistEnrollmentFormBuilder');
    const enrollmentScheduleSearch = document.getElementById('enrollmentScheduleSearch');
    if (enrollmentScheduleSearch) enrollmentScheduleSearch.addEventListener('input', () => callIfFn('renderEnrollmentScheduleSection'));
    const enrollmentScheduleLevelFilter = document.getElementById('enrollmentScheduleLevelFilter');
    if (enrollmentScheduleLevelFilter) enrollmentScheduleLevelFilter.addEventListener('change', () => callIfFn('renderEnrollmentScheduleSection'));
    bindClickIfFn('btnSelectAdminUsersPage', 'selectCurrentPageAdminUsers');
    bindClickIfFn('btnSelectAdminUsersFiltered', 'selectFilteredAdminUsers');
    bindClickIfFn('btnClearAdminUsersSelection', 'clearAdminUsersSelection');
    bindClickIfFn('btnAssignRoleToSelectedUsers', 'assignRoleToSelectedAdminUsers');

    bindClickIfFn('btnCreateCert', 'createCertificate');

    bindClick('btnNewGuide', () => callIfFn('openGuideForm'));

    bindClickIfFn('btnAnalyzeImport', 'analyzeImportFile');
    bindClickIfFn('btnPreviewImport', 'previewImport');
    bindClickIfFn('btnImportStudents', 'importStudentsBatch');
    bindClickIfFn('btnCreateRule', 'createAssignmentRule');
    bindClickIfFn('btnApplyRules', 'applyRulesToStudents');
    const importFileType = document.getElementById('importFileType');
    if (importFileType) importFileType.addEventListener('change', () => callIfFn('updateImportFormatUI'));

    const formType = document.getElementById('formType');
    if (formType) formType.addEventListener('change', () => {
        state.ui.formBuilderPage = 1;
        callIfFn('renderFormsSection');
    });
    const formTitleInput = document.getElementById('formTitleInput');
    if (formTitleInput) formTitleInput.addEventListener('input', ev => callIfFn('setFormBuilderTitle', ev.target.value));
    bindClickIfFn('btnNewCustomForm', 'openNewCustomFormModal');
    bindClickIfFn('btnOpenFormBuilderWindow', 'openFormBuilderWindow');
    bindClickIfFn('btnAddBuilderQuestion', 'addBuilderQuestion');
    bindClickIfFn('btnSaveFormBuilder', 'saveFormBuilder');
    bindClickIfFn('btnOpenFormPreviewPopup', 'openFormPreviewPopup');
    bindClickIfFn('btnShareFormLink', 'shareFormLink');
    bindClickIfFn('btnViewFormResponses', 'viewFormResponses');
    bindClickIfFn('btnExportFormResponses', 'exportFormResponsesCsv');
    const responsesFromDate = document.getElementById('responsesFromDate');
    if (responsesFromDate) responsesFromDate.addEventListener('change', () => callIfFn('renderFormResponsesBoard'));
    const responsesToDate = document.getElementById('responsesToDate');
    if (responsesToDate) responsesToDate.addEventListener('change', () => callIfFn('renderFormResponsesBoard'));
    bindClickIfFn('btnExportResponses', 'exportResponsesCsv');
    bindClickIfFn('btnAddSurveyOption', 'addSurveyOption');
    bindClickIfFn('btnPreviewSurveyDraft', 'previewSurveyDraft');
    bindClickIfFn('btnCreateSurvey', 'createSurvey');
    bindClick('btnExportSurveyResults', () => callIfFn('exportSurveyResultsExcel'));

    bindClickIfFn('btnSaveGrading', 'saveGradePolicy');
    bindClickIfFn('btnAddCutPeriod', 'addCutPeriod');
    bindClickIfFn('btnSaveCutPeriods', 'saveCutPeriods');

    bindClick('btnSaveAboutContent', saveAboutContent);
    bindClick('btnResetAboutContent', resetAboutContent);
}

const adminEvalReportState = { data: [], filtered: [], page: 1, pageSize: 6, query: '', teacherFilter: 'all', courseFilter: 'all' };

function computeTeacherStats(evalItems) {
    const byTeacher = {};
    evalItems.forEach(item => {
        const teacherName = ((item.course || {}).teacher || {}).user ? ((item.course || {}).teacher || {}).user.name : (((item.course || {}).teacher || {}).name || 'Sin docente');
        const courseName = (item.course || {}).name || 'Curso';
        const key = teacherName + '|' + courseName;
        if (!byTeacher[key]) byTeacher[key] = { teacherName, courseName, answers: {}, count: 0, totalScore: 0, scoreCount: 0 };
        byTeacher[key].count++;
        const ans = item.answers || {};
        Object.entries(ans).forEach(([k, v]) => {
            const num = parseFloat(v);
            if (!isNaN(num)) {
                byTeacher[key].answers[k] = (byTeacher[key].answers[k] || 0) + num;
                byTeacher[key].totalScore += num;
                byTeacher[key].scoreCount++;
            }
        });
    });
    const evalLabels = {};
    (state.forms.eval || []).forEach(q => { if (q && q.id) evalLabels[String(q.id)] = String(q.text || q.label || q.id).trim(); });
    return Object.values(byTeacher).map(t => {
        const avgMap = {};
        Object.entries(t.answers).forEach(([k, sum]) => { avgMap[k] = (sum / t.count).toFixed(1); });
        const overallAvg = t.scoreCount ? (t.totalScore / t.scoreCount).toFixed(1) : '0.0';
        const positiveCount = t.scoreCount ? Object.values(t.answers).filter(sum => (sum / t.count) >= 6).length : 0;
        const totalQuestions = Object.keys(t.answers).length;
        return { ...t, avgMap, overallAvg, positiveCount, totalQuestions, evalLabels };
    }).sort((a, b) => parseFloat(b.overallAvg) - parseFloat(a.overallAvg));
}

function renderAdminEvalReportList() {
    const container = document.getElementById('adminEvaluationReportList');
    if (!container) return;
    const s = adminEvalReportState;
    let items = s.filtered;
    if (s.teacherFilter !== 'all') items = items.filter(t => t.teacherName === s.teacherFilter);
    if (s.courseFilter !== 'all') items = items.filter(t => t.courseName === s.courseFilter);
    if (s.query) {
        const q = s.query.toLowerCase();
        items = items.filter(t => t.teacherName.toLowerCase().includes(q) || t.courseName.toLowerCase().includes(q));
    }
    const totalPages = Math.max(1, Math.ceil(items.length / s.pageSize));
    s.page = Math.min(Math.max(1, s.page), totalPages);
    const pageItems = items.slice((s.page - 1) * s.pageSize, s.page * s.pageSize);

    if (!items.length) {
        container.innerHTML = '<div class="empty-state" style="padding:24px 0"><div class="empty-state-title">Sin resultados</div><div class="empty-state-text">No hay datos para los filtros seleccionados.</div></div>';
        return;
    }

    const rows = pageItems.map((t, idx) => {
        const avgEntries = Object.entries(t.avgMap).map(([k, avg]) => {
            const label = t.evalLabels[k] || k;
            const num = parseFloat(avg);
            let color = 'var(--text-body)';
            if (num >= 8) color = 'var(--success)';
            else if (num >= 6) color = 'var(--gold)';
            else color = 'var(--error)';
            return `<span style="display:inline-block;background:var(--cream);border:1px solid rgba(11,31,58,0.08);border-radius:6px;padding:4px 8px;margin:2px;font-size:12px">${escapeHtml(label)}: <strong style="color:${color}">${avg}</strong></span>`;
        }).join('');
        const positiveRate = t.totalQuestions ? Math.round((t.positiveCount / t.totalQuestions) * 100) : 0;
        const overallColor = parseFloat(t.overallAvg) >= 8 ? 'var(--success)' : (parseFloat(t.overallAvg) >= 6 ? 'var(--gold)' : 'var(--error)');
        return `<div class="card" style="margin-bottom:14px">
            <div class="card-header" style="padding:14px 18px">
                <div>
                    <div style="font-size:14px;font-weight:700">${escapeHtml(t.teacherName)}</div>
                    <div style="font-size:12px;color:var(--text-muted)">${escapeHtml(t.courseName)} · ${t.count} evaluacion(es)</div>
                </div>
                <div style="display:flex;align-items:center;gap:10px">
                    <span style="font-size:18px;font-weight:700;color:${overallColor}">${t.overallAvg}</span>
                    <span class="badge ${positiveRate >= 70 ? 'badge-success' : (positiveRate >= 50 ? 'badge-gold' : 'badge-error')}" style="font-size:11px">${positiveRate}% positivas</span>
                </div>
            </div>
            <div class="card-body" style="padding:16px 18px">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);letter-spacing:1px;margin-bottom:8px">Promedios por pregunta</div>
                <div style="display:flex;flex-wrap:wrap;gap:4px">${avgEntries}</div>
            </div>
        </div>`;
    }).join('');

    const pager = `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px;flex-wrap:wrap">
        <span style="font-size:12px;color:var(--text-muted)">Mostrando ${(s.page - 1) * s.pageSize + 1}-${Math.min(s.page * s.pageSize, items.length)} de ${items.length}</span>
        <div style="display:flex;gap:6px">
            <button class="btn btn-sm btn-outline" ${s.page === 1 ? 'disabled' : ''} onclick="changeAdminEvalReportPage(-1)">Anterior</button>
            <button class="btn btn-sm btn-outline" ${s.page === totalPages ? 'disabled' : ''} onclick="changeAdminEvalReportPage(1)">Siguiente</button>
        </div>
    </div>`;

    container.innerHTML = rows + pager;
}

function changeAdminEvalReportPage(delta) {
    adminEvalReportState.page += delta;
    renderAdminEvalReportList();
}

function renderAdminEvalGlobalSummary(stats) {
    const el = document.getElementById('adminEvalGlobalSummary');
    if (!el || !stats.length) return;
    const best = stats[0];
    const globalAvg = stats.length ? (stats.reduce((s, t) => s + parseFloat(t.overallAvg), 0) / stats.length).toFixed(1) : '0.0';
    const top3 = stats.slice(0, 3);
    const podium = top3.map((t, i) => {
        const medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : '🥉');
        return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fff;border-radius:8px;border:1px solid rgba(11,31,58,0.08)">
            <div style="font-size:20px">${medal}</div>
            <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(t.teacherName)}</div>
                <div style="font-size:11px;color:var(--text-muted)">${escapeHtml(t.courseName)}</div>
            </div>
            <div style="font-size:15px;font-weight:700;color:var(--success)">${t.overallAvg}</div>
        </div>`;
    }).join('');
    el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:14px">
        <div style="background:linear-gradient(135deg,#0B1F3A,#1A3A6B);color:#fff;border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:22px;font-weight:700">${globalAvg}</div>
            <div style="font-size:11px;opacity:0.8;margin-top:4px">Promedio global</div>
        </div>
        <div style="background:var(--cream);border:1px solid rgba(11,31,58,0.08);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:22px;font-weight:700;color:var(--success)">${escapeHtml(best.teacherName)}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Mejor docente</div>
        </div>
        <div style="background:var(--cream);border:1px solid rgba(11,31,58,0.08);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:22px;font-weight:700;color:var(--teal)">${stats.length}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Docentes evaluados</div>
        </div>
    </div>
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);letter-spacing:1px;margin-bottom:10px">Podio de docentes</div>
    <div style="display:flex;flex-direction:column;gap:8px">${podium}</div>`;
}

function renderEvaluationReportSection() {
    const container = document.getElementById('adminEvaluationReportOverview');
    if (!container) return;
    const perms = Array.isArray((activeSessionUser || {}).permissions) ? activeSessionUser.permissions : [];
    const canView = isCurrentUserAdmin() || perms.includes('evaluacion.ver-reporte-admin');
    if (!canView) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = '<div class="card"><div class="card-header"><span class="card-title">Reporte de Evaluacion Docente</span></div><div class="card-body"><div class="loading"><div class="spinner"></div>Cargando reporte...</div></div></div>';
    fetchEvaluationReport().then(data => {
        const items = Array.isArray(data) ? data : (data && Array.isArray(data.content) ? data.content : []);
        if (!items.length) {
            container.innerHTML = '<div class="card"><div class="card-header"><span class="card-title">Reporte de Evaluacion Docente</span></div><div class="card-body"><div class="alert alert-info">No hay evaluaciones enviadas aun.</div></div></div>';
            return;
        }
        const evalItems = items.filter(x => String((x || {}).evaluationType || '').toUpperCase() === 'EVAL');
        const stats = computeTeacherStats(evalItems);
        adminEvalReportState.data = stats;
        adminEvalReportState.filtered = stats.slice();
        const teachers = [...new Set(stats.map(t => t.teacherName))].sort();
        const courses = [...new Set(stats.map(t => t.courseName))].sort();

        container.innerHTML = `<div class="card">
            <div class="card-header">
                <span class="card-title">Reporte de Evaluacion Docente</span>
            </div>
            <div class="card-body">
                <div id="adminEvalGlobalSummary" style="margin-bottom:16px"></div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px">
                    <input class="form-input" id="adminEvalQuery" placeholder="Buscar docente o curso..." style="min-width:220px;flex:1">
                    <select class="form-input" id="adminEvalTeacherFilter" style="width:auto;padding:7px 12px;font-size:13px">
                        <option value="all">Todos los docentes</option>
                        ${teachers.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('')}
                    </select>
                    <select class="form-input" id="adminEvalCourseFilter" style="width:auto;padding:7px 12px;font-size:13px">
                        <option value="all">Todos los cursos</option>
                        ${courses.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}
                    </select>
                    <select class="form-input" id="adminEvalPageSize" style="width:auto;padding:7px 12px;font-size:13px">
                        <option value="6">6 por pagina</option>
                        <option value="10">10 por pagina</option>
                        <option value="20">20 por pagina</option>
                    </select>
                </div>
                <div id="adminEvaluationReportList"></div>
            </div>
        </div>`;

        setTimeout(() => {
            const qEl = document.getElementById('adminEvalQuery');
            const tEl = document.getElementById('adminEvalTeacherFilter');
            const cEl = document.getElementById('adminEvalCourseFilter');
            const pEl = document.getElementById('adminEvalPageSize');
            if (qEl) qEl.oninput = () => { adminEvalReportState.query = qEl.value || ''; adminEvalReportState.page = 1; renderAdminEvalReportList(); };
            if (tEl) tEl.onchange = () => { adminEvalReportState.teacherFilter = tEl.value || 'all'; adminEvalReportState.page = 1; renderAdminEvalReportList(); };
            if (cEl) cEl.onchange = () => { adminEvalReportState.courseFilter = cEl.value || 'all'; adminEvalReportState.page = 1; renderAdminEvalReportList(); };
            if (pEl) pEl.onchange = () => { adminEvalReportState.pageSize = Math.max(1, parseInt(pEl.value || '6', 10) || 6); adminEvalReportState.page = 1; renderAdminEvalReportList(); };
            renderAdminEvalGlobalSummary(stats);
            renderAdminEvalReportList();
        }, 0);
    }).catch(() => {
        container.innerHTML = '<div class="card"><div class="card-header"><span class="card-title">Reporte de Evaluacion Docente</span></div><div class="card-body"><div class="alert alert-error">No se pudo cargar el reporte.</div></div></div>';
    });
}

async function fetchEvaluationReport() {
    return await api('/api/admin/evaluation-report?page=0&size=500');
}

function isCurrentUserAdmin() {
    const roleName = String((((activeSessionUser || {}).role || {}).name) || '').toUpperCase();
    return roleName === 'ADMIN' || roleName === 'ADMINISTRADOR';
}

function renderAll() {
    renderOverview();
    renderCoursesSection();
    callIfFn('renderRolesSection');
    callIfFn('renderCertificatesSection');
    callIfFn('renderEnrollmentReviewSection');
    callIfFn('renderEnrollmentScheduleSection');
    callIfFn('renderEnrollmentFormBuilderSection');
    callIfFn('renderGuidesSection');
    callIfFn('renderFormsSection');
    callIfFn('renderImportSection');
    callIfFn('renderGradePolicySection');
    callIfFn('renderCutPeriodsSection');
    callIfFn('renderStorageMonitorSection');
}

function hideInitialBootLoader() {
    const body = document.body;
    const loader = document.getElementById('bootLoader');
    if (!body || !loader) return;
    if (!body.classList.contains('app-booting')) return;
    loader.classList.add('is-leaving');
    setTimeout(() => {
        body.classList.remove('app-booting');
        if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
    }, 230);
}

const auditState = {
    page: 0,
    pageSize: 20,
    totalPages: 0,
    logs: [],
    action: '',
    entityType: '',
    actor: '',
    fromDate: '',
    toDate: ''
};

async function loadAuditLogs() {
    const params = new URLSearchParams();
    params.set('page', String(auditState.page));
    params.set('size', String(auditState.pageSize));
    if (auditState.action) params.set('action', auditState.action);
    if (auditState.entityType) params.set('entityType', auditState.entityType);
    if (auditState.actor) params.set('actorEmail', auditState.actor);
    if (auditState.fromDate) params.set('fromDate', auditState.fromDate + 'T00:00:00');
    if (auditState.toDate) params.set('toDate', auditState.toDate + 'T23:59:59');
    try {
        const result = await api('/api/admin/audit/logs?' + params.toString());
        auditState.logs = asArray((result || {}).content);
        auditState.totalPages = (result || {}).totalPages || 1;
        auditState.page = (result || {}).number || 0;
    } catch (e) {
        auditState.logs = [];
        auditState.totalPages = 1;
        showToast('No se pudieron cargar los logs de auditoría', 'error');
    }
    renderAuditLogs();
}

function formatAuditDate(iso) {
    if (!iso) return '-';
    try {
        const d = new Date(iso);
        return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' });
    } catch (e) { return iso; }
}

function renderAuditLogs() {
    const host = document.getElementById('auditTableWrap');
    const pager = document.getElementById('auditPager');
    if (!host) return;
    const rows = auditState.logs.map(log => `
        <tr>
            <td style="white-space:nowrap">${escapeHtml(formatAuditDate(log.createdAt))}</td>
            <td>${escapeHtml(log.actorEmail || 'system')}</td>
            <td><span class="badge badge-info">${escapeHtml(log.action || '')}</span></td>
            <td>${escapeHtml(log.entityType || '')}</td>
            <td>${escapeHtml(log.entityId || '')}</td>
            <td style="max-width:400px;overflow:hidden;text-overflow:ellipsis">${escapeHtml(log.details || '')}</td>
        </tr>
    `).join('');
    host.innerHTML = auditState.logs.length
        ? `<table class="table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Actor</th>
                    <th>Acción</th>
                    <th>Entidad</th>
                    <th>ID Entidad</th>
                    <th>Detalles</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`
        : '<div class="muted">No hay registros de auditoría para los filtros seleccionados.</div>';
    if (pager) {
        pager.innerHTML = `
            <button class="btn btn-sm btn-outline" ${auditState.page <= 0 ? 'disabled' : ''} onclick="auditPrevPage()">Anterior</button>
            <span>Página ${auditState.page + 1} de ${auditState.totalPages}</span>
            <button class="btn btn-sm btn-outline" ${auditState.page + 1 >= auditState.totalPages ? 'disabled' : ''} onclick="auditNextPage()">Siguiente</button>
        `;
    }
}

function auditPrevPage() {
    if (auditState.page > 0) {
        auditState.page -= 1;
        loadAuditLogs();
    }
}

function auditNextPage() {
    if (auditState.page + 1 < auditState.totalPages) {
        auditState.page += 1;
        loadAuditLogs();
    }
}

function bindAuditEvents() {
    const btnSearch = document.getElementById('btnAuditSearch');
    const btnClear = document.getElementById('btnAuditClear');
    if (btnSearch) btnSearch.addEventListener('click', () => {
        auditState.action = String((document.getElementById('auditActionFilter') || {}).value || '');
        auditState.entityType = String((document.getElementById('auditEntityFilter') || {}).value || '');
        auditState.actor = String((document.getElementById('auditActorFilter') || {}).value || '').trim();
        auditState.fromDate = String((document.getElementById('auditFromDate') || {}).value || '');
        auditState.toDate = String((document.getElementById('auditToDate') || {}).value || '');
        auditState.page = 0;
        loadAuditLogs();
    });
    if (btnClear) btnClear.addEventListener('click', () => {
        const af = document.getElementById('auditActionFilter');
        const ef = document.getElementById('auditEntityFilter');
        const ac = document.getElementById('auditActorFilter');
        const fd = document.getElementById('auditFromDate');
        const td = document.getElementById('auditToDate');
        if (af) af.value = '';
        if (ef) ef.value = '';
        if (ac) ac.value = '';
        if (fd) fd.value = '';
        if (td) td.value = '';
        auditState.action = '';
        auditState.entityType = '';
        auditState.actor = '';
        auditState.fromDate = '';
        auditState.toDate = '';
        auditState.page = 0;
        loadAuditLogs();
    });
}

async function init() {
    try {
        const me = await api('/api/auth/me').catch(() => null);
        if (!me || !me.id) {
            window.location.href = '/login?role=staff&redirect=/admin-dashboard';
            return;
        }
        activeSessionUser = me;
        try {
            const effectiveAccess = await api('/api/access/me');
            currentEffectivePermissions = asArray((effectiveAccess || {}).permissions).map(String);
        } catch (e) {
            currentEffectivePermissions = [];
        }
        const publicForm = getSearchParam('publicForm');
        const publicSurvey = getSearchParam('publicSurvey');
        bindEvents();
        modalState.courseCreate.draft = {
            ...modalState.courseCreate.draft,
            ...asObject(readStorage(STORAGE_KEYS.courseCreateDraft, {}))
        };
        modalState.courseCreate.gradeIds = Array.isArray(modalState.courseCreate.draft.gradeIds)
            ? modalState.courseCreate.draft.gradeIds.map(String)
            : [];
        document.getElementById('currentDate').textContent = new Date().toLocaleDateString('es-CO', {
            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
        });
        document.getElementById('sidebarUserName').textContent = me.name || 'Administrador';

        await loadData();
        bindStorageListeners();
        if (publicForm) {
            renderPublicFormPage(publicForm);
            return;
        }
        if (publicSurvey) {
            renderPublicSurveyPage(publicSurvey);
            startPublicSurveyLiveSync(publicSurvey);
            return;
        }
        renderAll();
        applyAdminPermissionVisibility();
        navigateTo(readAdminNavigationState(), { skipPersist: false });
        applyBuilderFullscreenModeIfNeeded();
        if (!surveyLiveTimer) {
            surveyLiveTimer = setInterval(async () => {
                try {
                    state.surveys = asArray(await api('/api/surveys').catch(() => [])).map(s => ({
                        ...s,
                        options: s.optionsJson ? JSON.parse(s.optionsJson) : [],
                        roles: s.rolesJson ? JSON.parse(s.rolesJson) : [],
                        questionMedia: s.questionMediaJson ? JSON.parse(s.questionMediaJson) : null,
                        voteLedger: s.voteLedgerJson ? JSON.parse(s.voteLedgerJson) : {},
                        startsAt: s.startsAt || '',
                        endsAt: s.endsAt || '',
                        createdAt: s.createdAt || ''
                    }));
                } catch (e) {}
                renderSurveyBoards();
            }, 2500);
        }

        const activeUser = state.users.find(u => String(u.id || '') === String(me.id || ''));
        if (activeUser) document.getElementById('sidebarUserName').textContent = activeUser.name;
    } finally {
        hideInitialBootLoader();
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
   CERTIFICATE TEMPLATE MANAGER
   ═══════════════════════════════════════════════════════════════════════════ */

const CERT_TEMPLATE_FIELDS = [
    { key: 'STUDENT_NAME', label: 'Nombre del estudiante', desc: 'Nombre completo del estudiante registrado en el sistema.', example: 'Valentina Pardo' },
    { key: 'STUDENT_CODE', label: 'Código del estudiante', desc: 'Código único asignado al estudiante.', example: 'EST-1001' },
    { key: 'STUDENT_EMAIL', label: 'Email del estudiante', desc: 'Correo electrónico registrado en la plataforma.', example: 'valentina.pardo@ejemplo.com' },
    { key: 'GRADE_NAME', label: 'Grado académico', desc: 'Grado o curso en el que está matriculado.', example: '6A' },
    { key: 'LEVEL_NAME', label: 'Nivel académico', desc: 'Nivel educativo al que pertenece el grado.', example: 'Secundaria' },
    { key: 'COURSE_NAME', label: 'Nombre del curso', desc: 'Nombre del curso asignado al estudiante.', example: 'Matemáticas 6A' },
    { key: 'TEACHER_NAME', label: 'Nombre del docente', desc: 'Docente asignado al curso del estudiante.', example: 'Prof. Laura Méndez' },
    { key: 'AVERAGE_GRADE', label: 'Promedio general', desc: 'Promedio ponderado de todas las calificaciones.', example: '4.5' },
    { key: 'DATE', label: 'Fecha actual', desc: 'Fecha de emisión en formato dd/MM/yyyy.', example: '11/05/2026' }
];

const CERT_TEMPLATE_CONDITIONS = [
    { key: 'minAverageGrade', label: 'Promedio general mínimo', type: 'number' },
    { key: 'minCourseCompletion', label: 'Completó al menos ___% del curso', type: 'percent' },
    { key: 'maxAbsences', label: 'Máximo de inasistencias permitidas', type: 'number' },
    { key: 'passingAllPeriods', label: 'Aprobó todos los periodos académicos', type: 'boolean' },
    { key: 'passingAllUnits', label: 'Aprobó todas las unidades', type: 'boolean' },
    { key: 'passingAllCuts', label: 'Aprobó todos los cortes', type: 'boolean' }
];

let certTemplateDraft = {
    id: null,
    name: '',
    description: '',
    headerText: '',
    subtitleText: '',
    bodyLines: [],
    footerText: '',
    conditions: {},
    signatureImageData: '',
    signatureType: 'none',
    signatureLabel: 'Firma del Director(a)',
    signatureImageData2: '',
    signatureType2: 'none',
    signatureLabel2: 'Firma del Coordinador(a)',
    docxFilePath: '',
    detectedVariables: []
};

let certTemplateFocusedLineIdx = -1;

function readCertTemplateDraftFromDom() {
    return {
        id: certTemplateDraft.id,
        name: String((document.getElementById('ctName') || {}).value || '').trim(),
        description: String((document.getElementById('ctDesc') || {}).value || '').trim(),
        conditions: certTemplateDraft.conditions,        conditions: certTemplateDraft.conditions,
        signatureImageData: certTemplateDraft.signatureImageData,
        signatureType: certTemplateDraft.signatureType,
        signatureLabel: certTemplateDraft.signatureLabel,
        signatureImageData2: certTemplateDraft.signatureImageData2,
        signatureType2: certTemplateDraft.signatureType2,
        signatureLabel2: certTemplateDraft.signatureLabel2,
        docxFilePath: certTemplateDraft.docxFilePath,
        detectedVariables: certTemplateDraft.detectedVariables
    };
}

function renderBodyLinesEditor() {
    const lines = asArray(certTemplateDraft.bodyLines);
    if (!lines.length) {
        certTemplateDraft.bodyLines = [''];
    }
    const container = document.getElementById('ctBodyLinesEditor');
    if (!container) return;

    const html = certTemplateDraft.bodyLines.map((line, idx) => {
        const canMoveUp = idx > 0;
        const canMoveDown = idx < certTemplateDraft.bodyLines.length - 1;
        return `
        <div class="ct-body-line-row" style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <input type="text" class="form-input ct-body-line-input" data-idx="${idx}" value="${escapeHtml(line)}" 
                placeholder="Escribe aquí el texto de esta línea..."
                onfocus="certTemplateFocusedLineIdx=${idx}"
                oninput="updateBodyLineFromDom()" style="flex:1">
            <div style="display:flex;gap:4px;flex-shrink:0">
                <button type="button" class="btn btn-sm btn-outline" title="Subir" ${canMoveUp ? '' : 'disabled'} onclick="moveBodyLine(${idx},-1)" style="padding:4px 8px;min-height:28px;font-size:11px">▲</button>
                <button type="button" class="btn btn-sm btn-outline" title="Bajar" ${canMoveDown ? '' : 'disabled'} onclick="moveBodyLine(${idx},1)" style="padding:4px 8px;min-height:28px;font-size:11px">▼</button>
                <button type="button" class="btn btn-sm btn-outline" title="Eliminar línea" onclick="removeBodyLine(${idx})" style="padding:4px 10px;min-height:28px;font-size:11px;color:#b91c1c">×</button>
            </div>
        </div>`;
    }).join('');

    container.innerHTML = html;
}

function updateBodyLineFromDom() {
    const lineInputs = document.querySelectorAll('.ct-body-line-input');
    const newLines = [];
    lineInputs.forEach(inp => {
        newLines.push(String(inp.value || ''));
    });
    certTemplateDraft.bodyLines = newLines;
    scheduleCertTemplatePreview();
}

function addBodyLine() {
    certTemplateDraft.bodyLines.push('');
    renderBodyLinesEditor();
    scheduleCertTemplatePreview();
    // Focus the new line
    setTimeout(() => {
        const inputs = document.querySelectorAll('.ct-body-line-input');
        if (inputs.length) {
            inputs[inputs.length - 1].focus();
            certTemplateFocusedLineIdx = inputs.length - 1;
        }
    }, 50);
}

function removeBodyLine(idx) {
    certTemplateDraft.bodyLines.splice(idx, 1);
    if (!certTemplateDraft.bodyLines.length) certTemplateDraft.bodyLines = [''];
    renderBodyLinesEditor();
    scheduleCertTemplatePreview();
}

function moveBodyLine(idx, direction) {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= certTemplateDraft.bodyLines.length) return;
    const temp = certTemplateDraft.bodyLines[idx];
    certTemplateDraft.bodyLines[idx] = certTemplateDraft.bodyLines[newIdx];
    certTemplateDraft.bodyLines[newIdx] = temp;
    renderBodyLinesEditor();
    scheduleCertTemplatePreview();
}

function insertPlaceholderIntoFocusedLine(placeholder) {
    const editor = document.getElementById('ctHtmlEditor');
    if (!editor) return;
    editor.focus();
    const sel = window.getSelection();

    // Resolve the actual value from example student
    const fieldKey = placeholder.replace('{{', '').replace('}}', '');
    const exampleStudent = asArray(state.students)[0];
    let displayValue = placeholder;
    if (exampleStudent) {
        const map = buildFrontendPlaceholders(exampleStudent);
        if (map[fieldKey]) displayValue = map[fieldKey];
    }

    const span = createCertFieldSpan(fieldKey, displayValue);

    if (!sel.rangeCount) {
        editor.appendChild(span);
        editor.appendChild(document.createTextNode(' '));
        scheduleCertTemplatePreview();
        return;
    }
    const range = sel.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;

    range.deleteContents();
    range.insertNode(span);
    range.setStartAfter(span);
    range.setEndAfter(span);
    sel.removeAllRanges();
    sel.addRange(range);
    scheduleCertTemplatePreview();
}

function createCertFieldSpan(fieldKey, displayValue) {
    const span = document.createElement('span');
    span.className = 'cert-field';
    span.setAttribute('data-field', fieldKey);
    span.setAttribute('contenteditable', 'true');
    span.textContent = displayValue;
    return span;
}

function buildFrontendPlaceholders(student) {
    const map = {};
    map['STUDENT_NAME'] = student.user ? student.user.name : 'Nombre del Estudiante';
    map['STUDENT_CODE'] = student.studentCode || 'COD-0000';
    map['STUDENT_EMAIL'] = student.user ? student.user.email : 'email@ejemplo.com';
    map['DATE'] = new Date().toLocaleDateString('es-ES');
    map['GRADE_NAME'] = 'Grado';
    map['COURSE_NAME'] = 'Curso';
    map['TEACHER_NAME'] = 'Docente';
    map['AVERAGE_GRADE'] = '4.5';
    map['LEVEL_NAME'] = 'Nivel';
    return map;
}

async function onChangeBaseDocx(resourceName) {
    certTemplateDraft.baseDocxResource = resourceName;
    certTemplateDraft.editableHtml = '<p style="text-align:center;color:#999">Cargando plantilla...</p>';
    renderCertificateTemplateEditor();
    try {
        const res = await api('/api/certificate-templates/base-docx-html/' + resourceName);
        certTemplateDraft.editableHtml = res.html || '';
        const editor = document.getElementById('ctHtmlEditor');
        if (editor) editor.innerHTML = certTemplateDraft.editableHtml;
        scheduleCertTemplatePreview();
    } catch (e) {
        showToast('Error cargando plantilla base', 'error');
    }
}

const CERT_TEMPLATE_PRESETS = {
    'pdf-modern-vintage': {
        headerFontSize: 32, headerColor: '#2c1810',
        bodyFontSize: 14, bodyColor: '#4a3b32',
        footerFontSize: 11, footerColor: '#5c4a3d',
        alignment: 'center', preset: 'pdf-modern-vintage',
        basePdfResource: 'pdf-modern-vintage'
    },
    'pdf-vintage-beige-dorado': {
        headerFontSize: 34, headerColor: '#1a3a6b',
        bodyFontSize: 14, bodyColor: '#333333',
        footerFontSize: 11, footerColor: '#666666',
        alignment: 'center', preset: 'pdf-vintage-beige-dorado',
        basePdfResource: 'pdf-vintage-beige-dorado'
    },
    'pdf-negro-dorado': {
        headerFontSize: 32, headerColor: '#c8962e',
        bodyFontSize: 14, bodyColor: '#e0e0e0',
        footerFontSize: 11, footerColor: '#aaaaaa',
        alignment: 'center', preset: 'pdf-negro-dorado',
        basePdfResource: 'pdf-negro-dorado'
    },
    'pdf-beige-negro': {
        headerFontSize: 32, headerColor: '#1a1a1a',
        bodyFontSize: 14, bodyColor: '#2c2c2c',
        footerFontSize: 11, footerColor: '#555555',
        alignment: 'center', preset: 'pdf-beige-negro',
        basePdfResource: 'pdf-beige-negro'
    }
};

function applyCertTemplatePreset(presetKey) {
    const preset = CERT_TEMPLATE_PRESETS[presetKey] || CERT_TEMPLATE_PRESETS['pdf-modern-vintage'];
    certTemplateDraft.styleConfig = { ...certTemplateDraft.styleConfig, ...preset };
    certTemplateDraft.basePdfResource = preset.basePdfResource || presetKey;
    renderCertificateTemplateEditor();
}

function ctExecCmd(command, value) {
    document.execCommand(command, false, value || null);
    const editor = document.getElementById('ctHtmlEditor');
    if (editor) editor.focus();
    scheduleCertTemplatePreview();
}

function changeCertTemplateSigType(type) {
    certTemplateDraft.signatureType = type;
    const uploadWrap = document.getElementById('ctSigUploadWrap');
    const drawWrap = document.getElementById('ctSigDrawWrap');
    if (uploadWrap) uploadWrap.style.display = type === 'upload' ? 'block' : 'none';
    if (drawWrap) drawWrap.style.display = type === 'draw' ? 'block' : 'none';
    if (type === 'draw') {
        setTimeout(initCertTemplateSignatureCanvas, 50);
    }
    scheduleCertTemplatePreview();
}

function changeCertTemplateSigType2(type) {
    certTemplateDraft.signatureType2 = type;
    const uploadWrap = document.getElementById('ctSigUploadWrap2');
    const drawWrap = document.getElementById('ctSigDrawWrap2');
    if (uploadWrap) uploadWrap.style.display = type === 'upload' ? 'block' : 'none';
    if (drawWrap) drawWrap.style.display = type === 'draw' ? 'block' : 'none';
    if (type === 'draw') {
        setTimeout(initCertTemplateSignatureCanvas2, 50);
    }
    scheduleCertTemplatePreview();
}

function onCertTemplateSignatureFileSelected(input) {
    const file = input.files && input.files[0] ? input.files[0] : null;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        certTemplateDraft.signatureImageData = reader.result;
        certTemplateDraft.signatureType = 'upload';
        const preview = document.getElementById('ctSigPreview');
        if (preview) preview.innerHTML = '<img src="' + reader.result + '" style="max-width:200px;max-height:80px;border-radius:6px;border:1px solid rgba(11,31,58,0.12)">';
        scheduleCertTemplatePreview();
    };
    reader.readAsDataURL(file);
}

function onCertTemplateSignatureFileSelected2(input) {
    const file = input.files && input.files[0] ? input.files[0] : null;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        certTemplateDraft.signatureImageData2 = reader.result;
        certTemplateDraft.signatureType2 = 'upload';
        const preview = document.getElementById('ctSigPreview2');
        if (preview) preview.innerHTML = '<img src="' + reader.result + '" style="max-width:200px;max-height:80px;border-radius:6px;border:1px solid rgba(11,31,58,0.12)">';
        scheduleCertTemplatePreview();
    };
    reader.readAsDataURL(file);
}

let ctSigCanvasCtx = null;
let ctSigDrawing = false;
let ctSigCanvasCtx2 = null;
let ctSigDrawing2 = false;

function initCertTemplateSignatureCanvas() {
    const canvas = document.getElementById('ctSigCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctSigCanvasCtx = ctx;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0b2138';

    // Load existing signature if any
    if (certTemplateDraft.signatureImageData && certTemplateDraft.signatureType === 'draw') {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        img.src = certTemplateDraft.signatureImageData;
    }

    canvas.addEventListener('mousedown', (e) => {
        ctSigDrawing = true;
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    });
    canvas.addEventListener('mousemove', (e) => {
        if (!ctSigDrawing) return;
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    });
    canvas.addEventListener('mouseup', () => { ctSigDrawing = false; });
    canvas.addEventListener('mouseleave', () => { ctSigDrawing = false; });

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        ctSigDrawing = true;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        ctx.beginPath();
        ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!ctSigDrawing) return;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
        ctx.stroke();
    }, { passive: false });
    canvas.addEventListener('touchend', () => { ctSigDrawing = false; });
}

function initCertTemplateSignatureCanvas2() {
    const canvas = document.getElementById('ctSigCanvas2');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctSigCanvasCtx2 = ctx;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0b2138';

    // Load existing signature if any
    if (certTemplateDraft.signatureImageData2 && certTemplateDraft.signatureType2 === 'draw') {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        img.src = certTemplateDraft.signatureImageData2;
    }

    canvas.addEventListener('mousedown', (e) => {
        ctSigDrawing2 = true;
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    });
    canvas.addEventListener('mousemove', (e) => {
        if (!ctSigDrawing2) return;
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    });
    canvas.addEventListener('mouseup', () => { ctSigDrawing2 = false; });
    canvas.addEventListener('mouseleave', () => { ctSigDrawing2 = false; });

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        ctSigDrawing2 = true;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        ctx.beginPath();
        ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!ctSigDrawing2) return;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
        ctx.stroke();
    }, { passive: false });
    canvas.addEventListener('touchend', () => { ctSigDrawing2 = false; });
}

function clearCertTemplateSignatureCanvas() {
    const canvas = document.getElementById('ctSigCanvas');
    if (!canvas || !ctSigCanvasCtx) return;
    ctSigCanvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    certTemplateDraft.signatureImageData = '';
    scheduleCertTemplatePreview();
}

function clearCertTemplateSignatureCanvas2() {
    const canvas = document.getElementById('ctSigCanvas2');
    if (!canvas || !ctSigCanvasCtx2) return;
    ctSigCanvasCtx2.clearRect(0, 0, canvas.width, canvas.height);
    certTemplateDraft.signatureImageData2 = '';
    scheduleCertTemplatePreview();
}

function saveCertTemplateSignatureCanvas() {
    const canvas = document.getElementById('ctSigCanvas');
    if (!canvas) return;
    certTemplateDraft.signatureImageData = canvas.toDataURL('image/png');
    certTemplateDraft.signatureType = 'draw';
    showToast('Firma aplicada', 'success');
    scheduleCertTemplatePreview();
}

function saveCertTemplateSignatureCanvas2() {
    const canvas = document.getElementById('ctSigCanvas2');
    if (!canvas) return;
    certTemplateDraft.signatureImageData2 = canvas.toDataURL('image/png');
    certTemplateDraft.signatureType2 = 'draw';
    showToast('Firma 2 aplicada', 'success');
    scheduleCertTemplatePreview();
}

async function openCertificateTemplateManager() {
    await loadCertificateTemplates();
    renderCertificateTemplateList();
}

async function loadCertificateTemplates() {
    state.certTemplates = asArray(await api('/api/certificate-templates').catch(() => []));
}

function renderCertificateTemplateList() {
    const items = asArray(state.certTemplates);
    const listHtml = items.length
        ? items.map(t => `<div class="card-check" style="justify-content:space-between;gap:10px;align-items:center">
            <span><strong>${escapeHtml(t.name)}</strong> <span class="muted">${escapeHtml(t.description || '')}</span></span>
            <span style="display:flex;gap:6px;flex-wrap:wrap">
                <button class="btn btn-sm btn-outline" onclick="openCertificateTemplateEditor(${t.id})">Editar</button>
                <button class="btn btn-sm btn-teal" onclick="generateFromTemplateModal(${t.id})">Usar plantilla</button>
                <button class="btn btn-sm btn-outline" onclick="autoIssueFromTemplateModal(${t.id})">Auto-emitir</button>
                <button class="btn btn-sm btn-outline" onclick="deleteCertificateTemplate(${t.id})">Eliminar</button>
            </span>
        </div>`).join('')
        : '<div class="muted">No hay plantillas de certificado creadas.</div>';

    const html = `
        <div style="padding:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
                <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:700">Plantillas de certificado</div>
                <button class="btn btn-teal" onclick="openCertificateTemplateEditor()">+ Nueva plantilla</button>
            </div>
            <div class="card-list">${listHtml}</div>
        </div>
    `;
    openModal('Plantillas', html);
}

async function openCertificateTemplateEditor(templateId) {
    certTemplateLastSavedId = null;
    const existing = templateId ? asArray(state.certTemplates).find(t => String(t.id) === String(templateId)) : null;
    if (existing) {
        certTemplateDraft = {
            id: existing.id,
            name: existing.name || '',
            description: existing.description || '',
            conditions: safeJsonParse(existing.conditionsJson, {}),
            signatureImageData: existing.signatureImageData || '',
            signatureType: existing.signatureType || 'none',
            signatureLabel: existing.signatureLabel || 'Firma del Director(a)',
            signatureImageData2: existing.signatureImageData2 || '',
            signatureType2: existing.signatureType2 || 'none',
            signatureLabel2: existing.signatureLabel2 || 'Firma del Coordinador(a)',
            docxFilePath: existing.docxFilePath || '',
            detectedVariables: []
        };
    } else {
        certTemplateDraft = {
            id: null,
            name: '',
            description: '',
            conditions: {},
            signatureImageData: '',
            signatureType: 'none',
            signatureLabel: 'Firma del Director(a)',
            signatureImageData2: '',
            signatureType2: 'none',
            signatureLabel2: 'Firma del Coordinador(a)',
            docxFilePath: '',
            detectedVariables: []
        };
    }
    renderCertificateTemplateEditor();
}

let certTemplatePreviewTimer = null;
let certTemplateLastSavedId = null;

function renderCertificateTemplateEditor() {
    const exampleStudent = asArray(state.students)[0];

    const detectedSet = new Set(asArray(certTemplateDraft.detectedVariables));
    const standardVarsHtml = CERT_TEMPLATE_FIELDS.map(f => {
        const isDetected = detectedSet.has(f.key);
        const badge = isDetected
            ? `<span style="display:inline-block;background:var(--teal);color:#fff;font-size:10px;padding:1px 6px;border-radius:10px;margin-left:6px">Detectada</span>`
            : '';
        return `<tr style="border-bottom:1px solid rgba(11,31,58,0.06)">
            <td style="padding:8px 6px;font-size:13px;white-space:nowrap;font-family:monospace;color:var(--navy)"><b>{${escapeHtml(f.key)}}</b>${badge}</td>
            <td style="padding:8px 6px;font-size:12px;color:var(--text-body)">${escapeHtml(f.label)}<div class="muted" style="font-size:11px;margin-top:2px">${escapeHtml(f.desc)}</div></td>
            <td style="padding:8px 6px;font-size:12px;color:var(--text-muted);white-space:nowrap">${escapeHtml(f.example)}</td>
        </tr>`;
    }).join('');

    const unknownDetected = asArray(certTemplateDraft.detectedVariables).filter(v => !CERT_TEMPLATE_FIELDS.some(f => f.key === v));
    const unknownVarsHtml = unknownDetected.length
        ? `<div style="margin-top:10px"><div class="muted" style="font-size:12px;margin-bottom:6px">Variables detectadas sin descripcion conocida:</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px">${unknownDetected.map(v => `<span class="cert-field-chip" style="cursor:default">${escapeHtml('{' + v + '}')}</span>`).join('')}</div></div>`
        : '';

    const variablesHtml = `
        <div style="max-height:260px;overflow:auto;border:1px solid rgba(11,31,58,0.08);border-radius:8px;background:#fff">
            <table style="width:100%;border-collapse:collapse">
                <thead style="position:sticky;top:0;background:#f8f9fb">
                    <tr>
                        <th style="padding:8px 6px;text-align:left;font-size:12px;color:var(--text-muted);font-weight:600;width:1%">Variable</th>
                        <th style="padding:8px 6px;text-align:left;font-size:12px;color:var(--text-muted);font-weight:600">Significado</th>
                        <th style="padding:8px 6px;text-align:left;font-size:12px;color:var(--text-muted);font-weight:600;width:1%">Ejemplo</th>
                    </tr>
                </thead>
                <tbody>${standardVarsHtml}</tbody>
            </table>
        </div>
        ${unknownVarsHtml}
        <div class="muted" style="font-size:12px;margin-top:8px">Escribe cualquiera de las variables entre llaves <code>{ }</code> en tu documento .docx. Se reemplazaran automaticamente al generar el certificado.</div>
    `;

    const conditionsHtml = CERT_TEMPLATE_CONDITIONS.map(cond => {
        const enabled = !!certTemplateDraft.conditions[cond.key];
        const val = certTemplateDraft.conditions[cond.key];
        const inputWrapStyle = 'width:140px;flex-shrink:0;display:flex;align-items:center;justify-content:flex-end';
        let inputHtml = '';
        if (cond.type === 'boolean') {
            inputHtml = `<div style="${inputWrapStyle}"><input type="checkbox" id="ctCond_${cond.key}" ${enabled ? 'checked' : ''} onchange="updateCertTemplateCondition('${cond.key}', this.checked)" style="width:18px;height:18px;cursor:pointer"></div>`;
        } else if (cond.type === 'percent') {
            inputHtml = `<div style="${inputWrapStyle}"><input type="number" class="form-input" style="width:100%" min="0" max="100" id="ctCond_${cond.key}" value="${escapeHtml(val !== undefined ? String(val) : '')}" placeholder="%" oninput="updateCertTemplateCondition('${cond.key}', this.value)"></div>`;
        } else {
            inputHtml = `<div style="${inputWrapStyle}"><input type="number" class="form-input" style="width:100%" step="0.1" id="ctCond_${cond.key}" value="${escapeHtml(val !== undefined ? String(val) : '')}" placeholder="Valor" oninput="updateCertTemplateCondition('${cond.key}', this.value)"></div>`;
        }
        return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <div style="flex:1;font-size:13px">${escapeHtml(cond.label)}</div>
            ${inputHtml}
        </div>`;
    }).join('');

    const html = `
        <div style="padding:24px;max-height:88vh;overflow:auto">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                <div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:700">Editor de plantilla</div>
                <div style="display:flex;gap:10px">
                    <button class="btn btn-sm btn-outline" onclick="openCertificateTemplateManager()">Volver</button>
                </div>
            </div>
            <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:20px">
                <div class="form-group" style="flex:1;min-width:260px;margin-bottom:0">
                    <label class="form-label">Nombre de la plantilla</label>
                    <input class="form-input" id="ctName" value="${escapeHtml(certTemplateDraft.name)}" placeholder="Ej: Certificado de promocion">
                </div>
                <div class="form-group" style="flex:1;min-width:260px;margin-bottom:0">
                    <label class="form-label">Estudiante de ejemplo</label>
                    <select class="form-input" id="ctExampleStudent">
                        ${asArray(state.students).map(s => `<option value="${s.id}" ${exampleStudent && s.id === exampleStudent.id ? 'selected' : ''}>${escapeHtml(s.user ? s.user.name : 'Estudiante')}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group" style="margin-bottom:16px">
                <label class="form-label">Descripcion</label>
                <textarea class="form-input" id="ctDesc" rows="2" placeholder="Describe el uso de esta plantilla...">${escapeHtml(certTemplateDraft.description)}</textarea>
            </div>
            <div style="display:flex;gap:24px;flex-wrap:wrap">
                <div style="flex:1;min-width:360px;max-width:560px">
                    <div class="form-group" style="margin-bottom:14px">
                        <label class="form-label">Archivo de plantilla (.docx)</label>
                        <div style="border:1px dashed rgba(11,31,58,0.25);border-radius:10px;padding:14px;background:rgba(11,31,58,0.02)">
                            <input type="file" id="ctDocxFile" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onchange="onCertTemplateDocxSelected(this)" style="display:block;margin-bottom:8px">
                            <div id="ctDocxInfo">
                                ${certTemplateDraft.docxFilePath ? `<div style="font-size:13px;margin-bottom:4px"><strong>Archivo:</strong> <span class="muted">${escapeHtml(certTemplateDraft.docxFilePath.split(/[\\/]/).pop())}</span></div>` : ''}
                                ${variablesHtml}
                            </div>
                        </div>
                    </div>

                    <div class="assign-head" style="margin-bottom:10px;font-size:14px">Condiciones de emision automatica</div>
                    <div style="background:#fff;border:1px solid rgba(11,31,58,0.08);border-radius:10px;padding:12px;margin-bottom:14px">
                        ${conditionsHtml}
                    </div>

                    <div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap">
                        <button class="btn btn-teal" onclick="saveCertificateTemplate()">Guardar plantilla</button>
                    </div>
                </div>
                <div style="flex:1;min-width:360px;max-width:560px;display:flex;flex-direction:column;gap:12px">
                    <div class="assign-head" style="margin:0;font-size:14px">Acciones</div>
                    <div style="background:#fff;border:1px solid rgba(11,31,58,0.08);border-radius:10px;padding:16px">
                        <div style="font-size:13px;color:var(--text-body);margin-bottom:12px;line-height:1.6">
                            <strong>Como funciona:</strong>
                            <ol style="margin:8px 0 0 18px;padding:0">
                                <li>Sube tu archivo .docx con variables como <code>{STUDENT_NAME}</code></li>
                                <li>Guarda la plantilla</li>
                                <li>Selecciona un estudiante de ejemplo</li>
                                <li>Descarga el certificado para ver el resultado</li>
                            </ol>
                        </div>
                        <div style="display:flex;gap:10px;flex-wrap:wrap">
                            <button class="btn btn-teal" onclick="downloadCertTemplateDocx()">Descargar DOCX</button>
                            <button class="btn btn-sm btn-outline" onclick="emitCertTemplatePreview()">Emitir certificado (ejemplo)</button>
                        </div>
                        <div id="ctDownloadStatus" class="muted" style="font-size:12px;margin-top:10px"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    openModal(certTemplateDraft.id ? 'Editar plantilla' : 'Nueva plantilla de certificado', html, 'xxl');
}
function changeCertTemplateExampleStudent(studentId) {
    // No-op: preview removed, student selection is only used for downloads
}

function downloadCertTemplateDocx() {
    const draft = readCertTemplateDraftFromDom();
    const exampleStudent = asArray(state.students)[0];
    if (!exampleStudent) return showToast('No hay estudiante de ejemplo', 'error');
    if (!certTemplateLastSavedId && !draft.id) return showToast('Guarda la plantilla primero', 'error');
    const templateId = certTemplateLastSavedId || draft.id;
    const url = '/api/certificate-templates/' + templateId + '/generate-docx/' + exampleStudent.id;
    const a = document.createElement('a');
    a.href = url;
    a.download = (draft.name || 'certificado') + '.docx';
    document.body.appendChild(a);
    a.click();
    a.remove();
}

async function emitCertTemplatePreview() {
    const draft = readCertTemplateDraftFromDom();
    const exampleStudent = asArray(state.students)[0];
    if (!exampleStudent) return showToast('No hay estudiante de ejemplo', 'error');
    if (!certTemplateLastSavedId && !draft.id) return showToast('Guarda la plantilla primero', 'error');

    const templateId = certTemplateLastSavedId || draft.id;
    try {
        const blob = await fetchBlob('/api/certificate-templates/' + templateId + '/generate-docx/' + exampleStudent.id);
        const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        await api('/api/certificates', {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({
                studentId: exampleStudent.id,
                name: draft.name || 'Certificado',
                filePath: base64,
                issuedAt: new Date().toISOString().split('T')[0],
                status: 'available'
            })
        });
        showToast('Certificado emitido para ' + (exampleStudent.user ? exampleStudent.user.name : 'estudiante'), 'success');
        await api('/api/certificates').then(data => { state.certificates = asArray(data); renderCertificatesSection(); renderOverview(); }).catch(() => {});
    } catch (e) {
        showToast('Error emitiendo certificado: ' + (e.message || ''), 'error');
    }
}

async function saveCertificateTemplate() {
    const draft = readCertTemplateDraftFromDom();
    if (!draft.name) return showToast('Ingresa un nombre para la plantilla', 'error');

    const payload = {
        name: draft.name,
        description: draft.description,
        conditionsJson: JSON.stringify(draft.conditions),
        docxFilePath: draft.docxFilePath || ''
    };

    try {
        if (draft.id) {
            await api('/api/certificate-templates/' + draft.id, { method: 'PUT', headers: headers(), body: JSON.stringify(payload) });
            certTemplateLastSavedId = draft.id;
        } else {
            const saved = await api('/api/certificate-templates', { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
            certTemplateDraft.id = saved.id;
            certTemplateLastSavedId = saved.id;
        }
        showToast('Plantilla guardada', 'success');
        await loadCertificateTemplates();
        openCertificateTemplateManager();
    } catch (e) {
        showToast('Error guardando plantilla: ' + (e.message || ''), 'error');
    }
}

async function deleteCertificateTemplate(id) {
    openConfirmModal('Eliminar plantilla', '¿Eliminar esta plantilla de certificado? Esta acción no se puede deshacer.', async () => {
        try {
            await api('/api/certificate-templates/' + id, { method: 'DELETE', headers: headers(false) });
            showToast('Plantilla eliminada', 'success');
            await loadCertificateTemplates();
            renderCertificateTemplateList();
        } catch (e) {
            showToast('Error eliminando plantilla', 'error');
        }
    }, 'Eliminar');
}

async function previewCertificateTemplate() {
    showToast('Vista previa en vivo desactivada. Descarga el DOCX para ver el resultado.', 'info');
}

function generateFromTemplateModal(templateId) {
    const template = asArray(state.certTemplates).find(t => String(t.id) === String(templateId));
    if (!template) return showToast('Plantilla no encontrada', 'error');

    const selectedStudentIds = asArray(state.ui.certSelectedStudentIds).map(String).filter(Boolean);

    const html = `
        <div style="padding:8px">
            <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:700;margin-bottom:8px">${escapeHtml(template.name)}</div>
            <div class="muted" style="margin-bottom:14px">${escapeHtml(template.description || '')}</div>
            <div class="assign-head">Estudiantes seleccionados</div>
            <div class="muted" style="margin-bottom:12px">${selectedStudentIds.length} estudiante(s) seleccionado(s) desde el panel de certificados.</div>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
                <button class="btn btn-teal" onclick="generateCertificatesFromTemplate(${templateId})">Generar certificados</button>
                <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
            </div>
            <div id="ctGenResult" style="margin-top:14px"></div>
        </div>
    `;
    openModal('Generar certificados', html);
}

async function generateCertificatesFromTemplate(templateId) {
    const selectedStudentIds = asArray(state.ui.certSelectedStudentIds).map(String).filter(Boolean);
    if (!selectedStudentIds.length) return showToast('Selecciona estudiantes primero en el panel de certificados', 'error');

    const resultWrap = document.getElementById('ctGenResult');
    if (resultWrap) resultWrap.innerHTML = '<div class="loading"><div class="spinner"></div>Generando...</div>';

    let created = 0;
    let failed = 0;
    const errors = [];

    for (const studentId of selectedStudentIds) {
        try {
            const blob = await fetchBlob('/api/certificate-templates/' + templateId + '/generate-docx/' + studentId);
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            const student = asArray(state.students).find(s => String(s.id) === String(studentId));
            const template = asArray(state.certTemplates).find(t => String(t.id) === String(templateId));
            await api('/api/certificates', {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify({
                    studentId: parseInt(studentId, 10),
                    name: template ? template.name : 'Certificado',
                    filePath: base64,
                    issuedAt: new Date().toISOString().split('T')[0],
                    status: 'available'
                })
            });
            created++;
        } catch (e) {
            failed++;
            errors.push(e.message || 'Error');
        }
    }

    if (resultWrap) {
        resultWrap.innerHTML = `<div class="alert ${failed > 0 ? 'alert-warning' : 'alert-success'}">
            <strong>${created}</strong> certificado(s) generado(s). ${failed > 0 ? '<strong>' + failed + '</strong> fallido(s).' : ''}
        </div>`;
    }

    if (failed > 0) showToast(`Generados: ${created}. Fallidos: ${failed}.`, 'error');
    else showToast(`${created} certificado(s) generado(s)`, 'success');

    await api('/api/certificates').then(data => { state.certificates = asArray(data); renderCertificatesSection(); renderOverview(); }).catch(() => {});
}

function updateCertTemplateCondition(key, value) {
    if (value === false || value === '' || value === null || value === undefined) {
        delete certTemplateDraft.conditions[key];
    } else {
        const cond = CERT_TEMPLATE_CONDITIONS.find(c => c.key === key);
        if (cond && cond.type === 'boolean') {
            certTemplateDraft.conditions[key] = true;
        } else if (cond && cond.type === 'percent') {
            const num = parseInt(value, 10);
            certTemplateDraft.conditions[key] = isNaN(num) ? '' : num;
        } else {
            const num = parseFloat(value);
            certTemplateDraft.conditions[key] = isNaN(num) ? '' : num;
        }
    }
}

async function onCertTemplateDocxSelected(input) {
    const file = input.files && input.files[0] ? input.files[0] : null;
    if (!file) return;
    console.log('[Upload] Selected file:', file.name, 'size:', file.size, 'type:', file.type);
    
    const isNew = !certTemplateDraft.id;
    const url = isNew
        ? '/api/certificate-templates/upload-docx'
        : '/api/certificate-templates/' + certTemplateDraft.id + '/upload-docx';
    console.log('[Upload] URL:', API + url);
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        console.log('[Upload] Sending request...');
        const res = await fetch(API + url, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        console.log('[Upload] Response status:', res.status);
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error('[Upload] Server error:', errorText);
            throw new Error('HTTP ' + res.status + ': ' + errorText);
        }
        
        const data = await res.json();
        console.log('[Upload] Response data:', data);
        
        if (data.error) throw new Error(data.error);
        
        certTemplateDraft.docxFilePath = data.filePath || '';
        certTemplateDraft.detectedVariables = asArray(data.variables);
        renderCertificateTemplateEditor();
        showToast('Archivo .docx subido y variables detectadas', 'success');
    } catch (e) {
        console.error('[Upload] Error:', e);
        showToast('Error subiendo .docx: ' + (e.message || 'Error de conexion'), 'error');
    }
}

function autoIssueFromTemplateModal(templateId) {
    const template = asArray(state.certTemplates).find(t => String(t.id) === String(templateId));
    if (!template) return showToast('Plantilla no encontrada', 'error');
    const html = `
        <div style="padding:8px">
            <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:700;margin-bottom:8px">${escapeHtml(template.name)}</div>
            <div class="muted" style="margin-bottom:14px">${escapeHtml(template.description || '')}</div>
            <div class="assign-head">Ambito de emision automatica</div>
            <div style="margin-bottom:14px">
                <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:8px;cursor:pointer">
                    <input type="radio" name="autoIssueScope" value="all" checked> Todos los estudiantes
                </label>
                <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
                    <input type="radio" name="autoIssueScope" value="selected"> Solo estudiantes seleccionados (${state.ui.certSelectedStudentIds.length})
                </label>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
                <button class="btn btn-teal" onclick="executeAutoIssue(${templateId})">Ejecutar emision automatica</button>
                <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
            </div>
            <div id="ctAutoIssueResult" style="margin-top:14px"></div>
        </div>
    `;
    openModal('Emision automatica por condiciones', html);
}

async function executeAutoIssue(templateId) {
    const scope = document.querySelector('input[name="autoIssueScope"]:checked');
    const mode = scope ? scope.value : 'all';
    const resultWrap = document.getElementById('ctAutoIssueResult');
    if (resultWrap) resultWrap.innerHTML = '<div class="loading"><div class="spinner"></div>Evaluando condiciones y generando...</div>';

    let studentIds = null;
    if (mode === 'selected') {
        studentIds = asArray(state.ui.certSelectedStudentIds).map(s => parseInt(s, 10)).filter(Boolean);
        if (!studentIds.length) {
            if (resultWrap) resultWrap.innerHTML = '<div class="alert alert-warning">No hay estudiantes seleccionados.</div>';
            return;
        }
    }

    try {
        const res = await api('/api/certificate-templates/' + templateId + '/mass-generate', {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(studentIds)
        });
        if (resultWrap) {
            resultWrap.innerHTML = `<div class="alert ${res.failed > 0 ? 'alert-warning' : 'alert-success'}">
                <strong>${res.created}</strong> certificado(s) creado(s).
                <strong>${res.skipped}</strong> omitido(s) por no cumplir condiciones.
                ${res.failed > 0 ? '<strong>' + res.failed + '</strong> fallido(s).' : ''}
            </div>`;
        }
        if (res.failed > 0) showToast(`Creados: ${res.created}. Omitidos: ${res.skipped}. Fallidos: ${res.failed}.`, 'error');
        else showToast(`${res.created} certificado(s) creado(s). ${res.skipped} omitido(s).`, 'success');
        await api('/api/certificates').then(data => { state.certificates = asArray(data); renderCertificatesSection(); renderOverview(); }).catch(() => {});
    } catch (e) {
        if (resultWrap) resultWrap.innerHTML = '<div class="alert alert-warning">Error: ' + escapeHtml(e.message || '') + '</div>';
        showToast('Error en emision automatica: ' + (e.message || ''), 'error');
    }
}

// ==================== Gestión de Contenido Institucional ====================

let contentStateAdmin = {
    news: [],
    events: [],
    articles: []
};

async function loadContentSection() {
    try {
        const [news, events, articles] = await Promise.all([
            api('/api/news').catch(() => []),
            api('/api/events').catch(() => []),
            api('/api/articles').catch(() => [])
        ]);
        contentStateAdmin.news = asArray(news);
        contentStateAdmin.events = asArray(events);
        contentStateAdmin.articles = asArray(articles);
        renderAdminContentLists();
        loadAboutContentEditor();
    } catch (e) {
        showToast('Error cargando contenido institucional', 'error');
    }
}

const defaultAboutContent = {
    sectionTitle: 'Quiénes somos',
    mission: { title: 'Formación con excelencia', text: 'Formar profesionales íntegros con excelencia académica, valores humanos sólidos y capacidad de transformar positivamente su entorno social y profesional mediante una educación innovadora y pertinente.' },
    vision: { title: 'Líderes en innovación', text: 'Ser reconocida en el año 2030 como la institución educativa líder en innovación pedagógica y formación de competencias digitales, referente de calidad y transformación educativa en la región.' },
    values: { title: 'Principios que nos guían', text: 'Nuestros valores orientan cada decisión e iniciativa institucional.', tags: ['Excelencia','Integridad','Innovación','Inclusión','Responsabilidad','Compromiso'] },
    location: { address: 'Carrera 45 #76-103, Barranquilla, Atlántico, Colombia', schedule: 'Lun–Vie 7:00 AM – 6:00 PM · Sáb 8:00 AM – 12:00 PM' },
    contact: { phone: '+57 (5) 360-0000', email: 'info@educat.edu.co', website: 'www.educat.edu.co' }
};

async function loadAboutContentEditor() {
    try {
        const res = await api('/api/config/about-content');
        const data = res && res.value ? JSON.parse(res.value) : { ...defaultAboutContent };
        document.getElementById('aboutSectionTitle').value = data.sectionTitle || '';
        document.getElementById('aboutMissionTitle').value = data.mission?.title || '';
        document.getElementById('aboutMissionText').value = data.mission?.text || '';
        document.getElementById('aboutVisionTitle').value = data.vision?.title || '';
        document.getElementById('aboutVisionText').value = data.vision?.text || '';
        document.getElementById('aboutValuesTitle').value = data.values?.title || '';
        document.getElementById('aboutValuesText').value = data.values?.text || '';
        document.getElementById('aboutValuesTags').value = (data.values?.tags || []).join(', ');
        document.getElementById('aboutAddress').value = data.location?.address || '';
        document.getElementById('aboutSchedule').value = data.location?.schedule || '';
        document.getElementById('aboutPhone').value = data.contact?.phone || '';
        document.getElementById('aboutEmail').value = data.contact?.email || '';
        document.getElementById('aboutWebsite').value = data.contact?.website || '';
    } catch (e) {
        console.error('Error cargando about content', e);
    }
}

async function saveAboutContent() {
    const payload = {
        sectionTitle: document.getElementById('aboutSectionTitle').value.trim(),
        mission: { title: document.getElementById('aboutMissionTitle').value.trim(), text: document.getElementById('aboutMissionText').value.trim() },
        vision: { title: document.getElementById('aboutVisionTitle').value.trim(), text: document.getElementById('aboutVisionText').value.trim() },
        values: { title: document.getElementById('aboutValuesTitle').value.trim(), text: document.getElementById('aboutValuesText').value.trim(), tags: document.getElementById('aboutValuesTags').value.split(',').map(s => s.trim()).filter(Boolean) },
        location: { address: document.getElementById('aboutAddress').value.trim(), schedule: document.getElementById('aboutSchedule').value.trim() },
        contact: { phone: document.getElementById('aboutPhone').value.trim(), email: document.getElementById('aboutEmail').value.trim(), website: document.getElementById('aboutWebsite').value.trim() }
    };
    console.log('Saving about-content payload:', payload);
    try {
        const res = await api('/api/config/about-content', { method: 'PUT', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
        console.log('Save about-content response:', res);
        showToast('Contenido institucional guardado correctamente', 'success');
    } catch (e) {
        console.error('Save about-content error:', e);
        showToast('Error guardando contenido institucional', 'error');
    }
}

function resetAboutContent() {
    document.getElementById('aboutSectionTitle').value = defaultAboutContent.sectionTitle;
    document.getElementById('aboutMissionTitle').value = defaultAboutContent.mission.title;
    document.getElementById('aboutMissionText').value = defaultAboutContent.mission.text;
    document.getElementById('aboutVisionTitle').value = defaultAboutContent.vision.title;
    document.getElementById('aboutVisionText').value = defaultAboutContent.vision.text;
    document.getElementById('aboutValuesTitle').value = defaultAboutContent.values.title;
    document.getElementById('aboutValuesText').value = defaultAboutContent.values.text;
    document.getElementById('aboutValuesTags').value = defaultAboutContent.values.tags.join(', ');
    document.getElementById('aboutAddress').value = defaultAboutContent.location.address;
    document.getElementById('aboutSchedule').value = defaultAboutContent.location.schedule;
    document.getElementById('aboutPhone').value = defaultAboutContent.contact.phone;
    document.getElementById('aboutEmail').value = defaultAboutContent.contact.email;
    document.getElementById('aboutWebsite').value = defaultAboutContent.contact.website;
}

function renderAdminContentLists() {
    renderAdminNewsList();
    renderAdminEventsList();
    renderAdminArticlesList();
}

function renderAdminNewsList() {
    const host = document.getElementById('adminNewsList');
    if (!host) return;
    const items = contentStateAdmin.news;
    if (!items.length) {
        host.innerHTML = '<div class="muted" style="padding:12px 0">No hay noticias registradas.</div>';
        return;
    }
    host.innerHTML = `<div class="table-wrap"><table class="simple-table">
        <thead><tr><th>Título</th><th>Autor</th><th>Publicación</th><th style="width:120px">Acciones</th></tr></thead>
        <tbody>${items.map(n => `<tr>
            <td><strong>${escapeHtml(n.title)}</strong></td>
            <td>${escapeHtml(n.author || '—')}</td>
            <td>${formatContentDate(n.publishedAt)}</td>
            <td style="display:flex;gap:6px">
                <button class="btn btn-sm btn-outline" onclick="editContentItem('news', ${n.id})">Editar</button>
                <button class="btn btn-sm btn-outline" onclick="deleteContentItem('news', ${n.id})">Eliminar</button>
            </td>
        </tr>`).join('')}</tbody>
    </table></div>`;
}

function renderAdminEventsList() {
    const host = document.getElementById('adminEventsList');
    if (!host) return;
    const items = contentStateAdmin.events;
    if (!items.length) {
        host.innerHTML = '<div class="muted" style="padding:12px 0">No hay eventos registrados.</div>';
        return;
    }
    host.innerHTML = `<div class="table-wrap"><table class="simple-table">
        <thead><tr><th>Título</th><th>Lugar</th><th>Fecha del evento</th><th style="width:120px">Acciones</th></tr></thead>
        <tbody>${items.map(e => `<tr>
            <td><strong>${escapeHtml(e.title)}</strong></td>
            <td>${escapeHtml(e.location || '—')}</td>
            <td>${formatContentDate(e.eventDate)}</td>
            <td style="display:flex;gap:6px">
                <button class="btn btn-sm btn-outline" onclick="editContentItem('event', ${e.id})">Editar</button>
                <button class="btn btn-sm btn-outline" onclick="deleteContentItem('event', ${e.id})">Eliminar</button>
            </td>
        </tr>`).join('')}</tbody>
    </table></div>`;
}

function renderAdminArticlesList() {
    const host = document.getElementById('adminArticlesList');
    if (!host) return;
    const items = contentStateAdmin.articles;
    if (!items.length) {
        host.innerHTML = '<div class="muted" style="padding:12px 0">No hay artículos registrados.</div>';
        return;
    }
    host.innerHTML = `<div class="table-wrap"><table class="simple-table">
        <thead><tr><th>Título</th><th>Autor</th><th>Publicación</th><th style="width:120px">Acciones</th></tr></thead>
        <tbody>${items.map(a => `<tr>
            <td><strong>${escapeHtml(a.title)}</strong></td>
            <td>${escapeHtml(a.author || '—')}</td>
            <td>${formatContentDate(a.publishedAt)}</td>
            <td style="display:flex;gap:6px">
                <button class="btn btn-sm btn-outline" onclick="editContentItem('article', ${a.id})">Editar</button>
                <button class="btn btn-sm btn-outline" onclick="deleteContentItem('article', ${a.id})">Eliminar</button>
            </td>
        </tr>`).join('')}</tbody>
    </table></div>`;
}

function formatContentDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d) ? '—' : d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function openContentEditor(type, id) {
    const isEdit = !!id;
    let item = null;
    if (isEdit) {
        const list = type === 'news' ? contentStateAdmin.news : type === 'event' ? contentStateAdmin.events : contentStateAdmin.articles;
        item = list.find(x => x.id === id);
        if (!item) return showToast('Elemento no encontrado', 'error');
    }

    const title = isEdit ? 'Editar ' + typeLabel(type) : 'Crear ' + typeLabel(type);
    const fields = buildContentFormFields(type, item);
    openModal(title, `
        <div style="display:flex;flex-direction:column;gap:14px">
            ${fields}
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">
                <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
                <button class="btn btn-teal" onclick="saveContentItem('${type}', ${isEdit ? id : 'null'})">Guardar</button>
            </div>
        </div>
    `, 'lg');
}

function typeLabel(type) {
    return type === 'news' ? 'noticia' : type === 'event' ? 'evento' : 'artículo';
}

function buildContentFormFields(type, item) {
    const title = escapeHtml(item ? item.title : '');
    const cover = escapeHtml(item ? item.coverImage || '' : '');
    const location = escapeHtml(item && item.location ? item.location : '');
    const eventDate = item && item.eventDate ? item.eventDate.substring(0, 16) : '';
    const author = escapeHtml(item && item.author ? item.author : '');
    const summary = escapeHtml(item && item.summary ? item.summary : '');
    const content = escapeHtml(item && item.content ? item.content : '');

    let html = '';
    html += `<div class="form-group"><label class="form-label">Título</label><input class="form-input" id="contentTitle" value="${title}" placeholder="Título"></div>`;

    html += `<div class="form-group">
        <label class="form-label">Portada (imagen)</label>
        <div style="display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap">
            <input type="file" class="form-input" id="contentCoverFile" accept="image/*" style="flex:1;min-width:200px" onchange="handleContentCoverPreview()">
            <input type="hidden" id="contentCover" value="${cover}">
        </div>
        <div id="contentCoverPreviewWrap" style="margin-top:8px;display:${cover ? 'block' : 'none'}">
            <img id="contentCoverPreview" src="${cover}" style="max-width:100%;max-height:180px;border-radius:8px;border:1px solid rgba(11,31,58,0.1)" onerror="this.style.display='none'">
        </div>
    </div>`;

    if (type === 'event') {
        html += `<div class="form-row"><div class="form-group"><label class="form-label">Lugar</label><input class="form-input" id="contentLocation" value="${location}" placeholder="Lugar del evento"></div><div class="form-group"><label class="form-label">Fecha y hora del evento</label><input class="form-input" id="contentEventDate" type="datetime-local" value="${eventDate}"></div></div>`;
    } else {
        html += `<div class="form-row"><div class="form-group"><label class="form-label">Autor</label><input class="form-input" id="contentAuthor" value="${author}" placeholder="Nombre del autor"></div></div>`;
        html += `<div class="form-group"><label class="form-label">Resumen</label><textarea class="form-input" id="contentSummary" rows="2" placeholder="Breve resumen">${summary}</textarea></div>`;
        html += `<div class="form-group"><label class="form-label">Contenido</label><textarea class="form-input" id="contentBody" rows="6" placeholder="Cuerpo completo">${content}</textarea></div>`;
    }
    return html;
}

function handleContentCoverPreview() {
    const input = document.getElementById('contentCoverFile');
    const preview = document.getElementById('contentCoverPreview');
    const wrap = document.getElementById('contentCoverPreviewWrap');
    if (input && input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            if (preview) { preview.src = e.target.result; preview.style.display = ''; }
            if (wrap) wrap.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function uploadContentCoverFile() {
    const input = document.getElementById('contentCoverFile');
    if (!input || !input.files || !input.files[0]) return null;
    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'CONTENT');
    formData.append('entityId', 'temp');
    formData.append('fieldName', 'coverImage');

    const res = await fetch(API + '/api/files/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
    });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || ('HTTP ' + res.status));
    }
    const stored = await res.json();
    return stored && stored.id ? (API + '/api/files/view/' + stored.id) : null;
}

async function saveContentItem(type, id) {
    const title = document.getElementById('contentTitle').value.trim();
    if (!title) return showToast('El título es obligatorio', 'error');

    let coverImage = document.getElementById('contentCover').value.trim();
    try {
        const uploadedUrl = await uploadContentCoverFile();
        if (uploadedUrl) coverImage = uploadedUrl;
    } catch (e) {
        return showToast('Error subiendo imagen: ' + (e.message || ''), 'error');
    }

    let payload = { title, coverImage };
    let endpoint = '';
    let method = id ? 'PUT' : 'POST';

    if (type === 'news') {
        payload.content = document.getElementById('contentBody').value;
        payload.summary = document.getElementById('contentSummary').value;
        payload.author = document.getElementById('contentAuthor').value;
        endpoint = id ? '/api/news/' + id : '/api/news';
    } else if (type === 'article') {
        payload.content = document.getElementById('contentBody').value;
        payload.summary = document.getElementById('contentSummary').value;
        payload.author = document.getElementById('contentAuthor').value;
        endpoint = id ? '/api/articles/' + id : '/api/articles';
    } else if (type === 'event') {
        payload.location = document.getElementById('contentLocation').value;
        payload.eventDate = document.getElementById('contentEventDate').value;
        endpoint = id ? '/api/events/' + id : '/api/events';
    }

    try {
        await api(endpoint, { method, headers: headers(), body: JSON.stringify(payload) });
        showToast((id ? 'Actualizado' : 'Creado') + ' correctamente', 'success');
        closeModal();
        await loadContentSection();
    } catch (e) {
        showToast('Error al guardar: ' + (e.message || ''), 'error');
    }
}

async function editContentItem(type, id) {
    openContentEditor(type, id);
}

async function deleteContentItem(type, id) {
    openConfirmModal('Confirmar eliminación', '¿Eliminar este ' + typeLabel(type) + '? Esta acción no se puede deshacer.', async () => {
        let endpoint = '';
        if (type === 'news') endpoint = '/api/news/' + id;
        else if (type === 'event') endpoint = '/api/events/' + id;
        else if (type === 'article') endpoint = '/api/articles/' + id;
        try {
            await api(endpoint, { method: 'DELETE' });
            showToast('Eliminado correctamente', 'success');
            await loadContentSection();
        } catch (e) {
            showToast('Error al eliminar: ' + (e.message || ''), 'error');
        }
    }, 'Eliminar');
}

init();

