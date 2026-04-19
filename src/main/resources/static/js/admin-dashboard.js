const API = '';
let activeSessionUser = null;

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
const APP_STATE_PREFIX = 'educat_';
let appStateHydrated = false;
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
    examMaxPercent: 100
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
    { id: 'level', section: 'Datos academicos', type: 'select', label: 'Nivel academico', placeholder: '', required: true, options: ['Preescolar', 'Primaria', 'Secundaria', 'Media'] },
    { id: 'grade', section: 'Datos academicos', type: 'text', label: 'Grado', placeholder: 'Ej: 6A, 9B, 11', required: true },
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

function readStorage(key, fallback) {
    try {
        const raw = storageService.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
}

function persistStorageValueInBackend(key, serializedValue) {
    const storageKey = String(key || '').trim();
    if (!storageKey || storageKey.indexOf(APP_STATE_PREFIX) !== 0) return;
    api('/api/app-state/' + encodeURIComponent(storageKey), {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ value: String(serializedValue || '') })
    }).catch(() => {
        // Si falla la persistencia remota, el estado local sigue disponible en memoria.
    });
}

function saveStorage(key, value) {
    let serialized = 'null';
    try {
        serialized = JSON.stringify(value);
    } catch (e) {
        serialized = 'null';
    }
    storageService.setItem(key, serialized);
    persistStorageValueInBackend(key, serialized);
}

async function hydrateStorageFromBackend() {
    if (appStateHydrated) return;
    try {
        const entries = await api('/api/app-state?prefix=' + encodeURIComponent(APP_STATE_PREFIX), {
            headers: headers(false)
        }).catch(() => ({}));
        Object.keys(entries || {}).forEach(k => {
            const value = entries[k];
            if (typeof value === 'string') storageService.setItem(k, value);
        });
    } finally {
        appStateHydrated = true;
    }
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
        auditoria: 'Auditoria'
    }[section] || 'Administrador';
    document.getElementById('pageTitle').textContent = title;
    if (!opts.skipPersist) writeAdminNavigationState(section, true);
}
window.navigateTo = navigateTo;

function openModal(title, bodyHtml) {
    setAdminModalSize('lg');
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

async function loadData() {
    await hydrateStorageFromBackend();
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

    state.guides = asArray(readStorage(STORAGE_KEYS.guides, []));
    state.forms = asObject(readStorage(STORAGE_KEYS.forms, { eval: [], autoeval: [] }));
    state.formsMeta = asObject(readStorage(STORAGE_KEYS.formsMeta, { eval: { title: 'Evaluacion docente' }, autoeval: { title: 'Autoevaluacion' } }));
    state.customForms = asArray(readStorage(STORAGE_KEYS.customForms, []));
    state.formResponses = asArray(readStorage(STORAGE_KEYS.formResponses, []));
    state.formShares = asObject(readStorage(STORAGE_KEYS.formShares, {}));
    state.surveys = asArray(readStorage(STORAGE_KEYS.surveys, []));
    // Permisos y accesos se gestionan por backend.
    state.gradePolicy = { ...DEFAULT_POLICY, ...readStorage(STORAGE_KEYS.gradePolicy, {}) };
    state.academicLevels = asArray(readStorage(STORAGE_KEYS.academicLevels, []));
    state.academicGrades = asArray(readStorage(STORAGE_KEYS.academicGrades, []));
    state.courseLevels = asObject(readStorage(STORAGE_KEYS.courseLevels, {}));
    state.courseGrades = asObject(readStorage(STORAGE_KEYS.courseGrades, {}));
    state.courseCapacity = asObject(readStorage(STORAGE_KEYS.courseCapacity, {}));
    state.teacherLevels = asObject(readStorage(STORAGE_KEYS.teacherLevels, {}));
    state.teacherGrades = asObject(readStorage(STORAGE_KEYS.teacherGrades, {}));
    state.studentLevels = asObject(readStorage(STORAGE_KEYS.studentLevels, {}));
    state.studentGrades = asObject(readStorage(STORAGE_KEYS.studentGrades, {}));
    state.assignmentRules = asArray(readStorage(STORAGE_KEYS.assignmentRules, []));

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

function ensureAcademicLevelByName(levelName) {
    const raw = String(levelName || '').trim();
    if (!raw) return null;
    const existing = (state.academicLevels || []).find(l => normalizeText(l.name) === normalizeText(raw));
    if (existing) return existing;
    const created = { id: 'lvl-' + Date.now() + '-' + Math.floor(Math.random() * 10000), name: raw, description: '' };
    state.academicLevels.push(created);
    return created;
}

function ensureAcademicGradeByName(levelId, gradeName) {
    const lid = String(levelId || '');
    const raw = String(gradeName || '').trim();
    if (!lid || !raw) return null;
    const existing = (state.academicGrades || []).find(g => String(g.levelId) === lid && normalizeText(g.name) === normalizeText(raw));
    if (existing) return existing;
    const created = { id: 'gr-' + Date.now() + '-' + Math.floor(Math.random() * 10000), levelId: lid, name: raw };
    state.academicGrades.push(created);
    return created;
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

function saveLevelsState() {
    saveStorage(STORAGE_KEYS.academicLevels, state.academicLevels || []);
    saveStorage(STORAGE_KEYS.academicGrades, state.academicGrades || []);
    saveStorage(STORAGE_KEYS.courseLevels, state.courseLevels || {});
    saveStorage(STORAGE_KEYS.courseGrades, state.courseGrades || {});
    saveStorage(STORAGE_KEYS.courseCapacity, state.courseCapacity || {});
    saveStorage(STORAGE_KEYS.teacherLevels, state.teacherLevels || {});
    saveStorage(STORAGE_KEYS.teacherGrades, state.teacherGrades || {});
    saveStorage(STORAGE_KEYS.studentLevels, state.studentLevels || {});
    saveStorage(STORAGE_KEYS.studentGrades, state.studentGrades || {});
    saveStorage(STORAGE_KEYS.assignmentRules, state.assignmentRules || []);
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

function createAcademicLevel() {
    const nameEl = document.getElementById('levelName');
    const descEl = document.getElementById('levelDescription');
    const name = String((nameEl || {}).value || '').trim();
    const description = String((descEl || {}).value || '').trim();
    if (!name) return showToast('Ingresa el nombre del nivel', 'error');

    const exists = (state.academicLevels || []).some(l => String(l.name || '').toLowerCase() === name.toLowerCase());
    if (exists) return showToast('Ese nivel ya existe', 'error');

    state.academicLevels.push({ id: 'lvl-' + Date.now(), name, description });
    if (nameEl) nameEl.value = '';
    if (descEl) descEl.value = '';
    saveLevelsState();
    renderCoursesSection();
    showToast('Nivel creado', 'success');
}

function createAcademicGrade() {
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
    parsed.forEach((name, idx) => {
        const key = String(name || '').toLowerCase();
        if (!key || existing.has(key)) {
            skipped += 1;
            return;
        }
        state.academicGrades.push({ id: 'gr-' + Date.now() + '-' + idx, levelId, name });
        existing.add(key);
        created += 1;
    });

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
                    <button type="button" class="btn btn-sm btn-outline" style="padding:2px 8px" onclick="deleteAcademicGradeFromDetails('${String(g.id)}','${id}')">Eliminar</button>
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

function deleteAcademicGradeFromDetails(gradeId, levelId) {
    const target = (state.academicGrades || []).find(g => String(g.id) === String(gradeId));
    if (!target) return;
    deleteAcademicGrade(gradeId);
    openLevelDetailsModal(levelId);
    showToast(`Grado eliminado: ${target.name || 'N/A'}`, 'success');
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

async function deleteAdminUser(userId) {
    const id = String(userId || '');
    const user = asArray(state.users).find(u => String((u || {}).id || '') === id);
    if (!user) return;
    if (!window.confirm('¿Eliminar usuario ' + String(user.name || user.email || '') + '?')) return;

    try {
        await api('/api/users/' + id, { method: 'DELETE', headers: headers(false) });
    } catch (e) {
        showToast('No se pudo eliminar el usuario en servidor', 'error');
        return;
    }

    state.users = asArray(state.users).filter(u => String((u || {}).id || '') !== id);
    delete state.userPerms[id];
    delete state.userPortalAccess[id];
    renderRolesSection();
    showToast('Usuario eliminado', 'success');
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
    try {
        const saved = await api('/api/admin/access/users/' + encodeURIComponent(userId) + '/permissions', {
            method: 'PUT',
            headers: headers(),
            body: JSON.stringify({ permissions: asArray(state.userPerms[userId]) })
        });
        state.userPerms[userId] = asArray(saved).map(String);
    } catch (e) {
        return showToast('No se pudo guardar permisos del usuario en servidor', 'error');
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
    return asArray(readStorage(STORAGE_KEYS.enrollmentRequests, [])).map((item, idx) => {
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
            documents: asObject(row.documents)
        };
    });
}

function saveEnrollmentRequestsStorage(items) {
    saveStorage(STORAGE_KEYS.enrollmentRequests, asArray(items));
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

function approveEnrollmentRequests(ids) {
    const changed = updateEnrollmentRequestsByIds(ids, item => ({
        ...item,
        status: 'approved',
        review: {
            ...asObject(item.review),
            decision: 'approved',
            reason: '',
            correction: '',
            reviewedAt: new Date().toISOString()
        }
    }));
    if (!changed) return showToast('No hay solicitudes seleccionadas', 'error');
    renderEnrollmentReviewSection();
    showToast('Solicitudes aprobadas: ' + changed, 'success');
}

function approveEnrollmentRequest(enrollmentId) {
    approveEnrollmentRequests([enrollmentId]);
}

function approveSelectedEnrollmentRequests() {
    approveEnrollmentRequests(state.ui.enrollmentReviewSelectedIds);
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
    return ['schoolCertificate', 'guardianIdentityCopy', 'studentIdentityCard', 'healthAffiliationCertificate']
        .filter(k => !!docs[k])
        .length;
}

function enrollmentFormatBytes(bytes) {
    const value = Math.max(0, parseInt(bytes || '0', 10) || 0);
    if (value < 1024) return value + ' B';
    if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB';
    return (value / (1024 * 1024)).toFixed(1) + ' MB';
}

function openEnrollmentAttachmentsModal(enrollmentId) {
    const id = String(enrollmentId || '');
    const item = readEnrollmentRequestsStorage().find(x => String((x || {}).id || '') === id);
    if (!item) return showToast('Solicitud no encontrada', 'error');
    const docs = asObject(item.documents);
    const rows = [
        { key: 'schoolCertificate', label: 'Certificado de escolaridad' },
        { key: 'guardianIdentityCopy', label: 'Documento de identidad del acudiente' },
        { key: 'studentIdentityCard', label: 'Tarjeta de identidad' },
        { key: 'healthAffiliationCertificate', label: 'Certificado de afiliación a salud (opcional)' }
    ].map(def => {
        const file = asObject(docs[def.key]);
        const hasFile = !!String(file.name || '').trim();
        const hasDataUrl = hasFile && /^data:/i.test(String(file.dataUrl || ''));
        const meta = hasFile
            ? `${String(file.type || 'archivo')} · ${enrollmentFormatBytes(file.size)}`
            : 'No adjunto';
        const actions = hasDataUrl
            ? `<a class="btn btn-sm btn-outline" href="${escapeHtml(String(file.dataUrl || ''))}" target="_blank" rel="noopener noreferrer">Abrir</a>
               <a class="btn btn-sm btn-outline" href="${escapeHtml(String(file.dataUrl || ''))}" download="${escapeHtml(String(file.name || 'adjunto'))}">Descargar</a>`
            : '<span class="muted">Sin vista previa</span>';
        return `<tr>
            <td>${escapeHtml(def.label)}</td>
            <td>${hasFile ? escapeHtml(String(file.name || '')) : '<span class="muted">No adjunto</span>'}</td>
            <td>${escapeHtml(meta)}</td>
            <td style="white-space:nowrap">${actions}</td>
        </tr>`;
    }).join('');

    openModal('Adjuntos de matricula', `
        <div class="table-wrap">
            <table class="simple-table">
                <thead><tr><th>Documento</th><th>Archivo</th><th>Detalle</th><th>Acción</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `);
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
                <td><button class="btn btn-sm btn-outline" onclick="openEnrollmentAttachmentsModal('${escapeJsSingle(id)}')">Ver adjuntos (${docsCount})</button></td>
                <td style="white-space:nowrap">
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
        options: asArray(item.options).map(String)
    };
}

function getEnrollmentFormConfigDraft() {
    const draft = asArray(state.ui.enrollmentFormBuilderDraft).map(cloneEnrollmentField);
    if (draft.length) return draft;
    const stored = asArray(readStorage(STORAGE_KEYS.enrollmentFormConfig, [])).map(cloneEnrollmentField);
    const baseline = stored.length ? stored : DEFAULT_ENROLLMENT_FORM_FIELDS.map(cloneEnrollmentField);
    state.ui.enrollmentFormBuilderDraft = baseline;
    return baseline;
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
    const normalized = normalizeEnrollmentFormDraft(getEnrollmentFormConfigDraft());
    state.ui.enrollmentFormBuilderDraft = normalized;
    saveStorage(STORAGE_KEYS.enrollmentFormConfig, normalized);
}

function addEnrollmentFormField(type) {
    const nextType = String(type || 'text');
    const draft = getEnrollmentFormConfigDraft();
    if (nextType === 'file' && countEnrollmentFileFields(draft) >= ENROLLMENT_FORM_MAX_FILE_FIELDS) {
        showToast('Máximo 4 campos de adjuntos. Para más archivos, usa campo URL.', 'error');
        return;
    }
    draft.push(cloneEnrollmentField({
        id: 'custom-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        section: 'Campos adicionales',
        type: nextType,
        label: nextType === 'file' ? 'Nuevo adjunto' : 'Nueva pregunta',
        placeholder: nextType === 'url' ? 'https://...' : '',
        required: false,
        options: []
    }));
    state.ui.enrollmentFormBuilderPage = Math.max(1, Math.ceil(draft.length / (state.ui.enrollmentFormBuilderPageSize || 6)));
    renderEnrollmentFormBuilderSection();
}

function updateEnrollmentFormField(index, key, value, rerender) {
    const draft = getEnrollmentFormConfigDraft();
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
    const draft = getEnrollmentFormConfigDraft();
    const idx = parseInt(index || '-1', 10);
    if (idx < 0 || idx >= draft.length) return;
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
    state.ui.enrollmentFormBuilderDraft = DEFAULT_ENROLLMENT_FORM_FIELDS.map(cloneEnrollmentField);
    state.ui.enrollmentFormBuilderPage = 1;
    renderEnrollmentFormBuilderSection();
    showToast('Formulario por defecto cargado en editor', 'info');
}

function persistEnrollmentFormBuilder() {
    saveEnrollmentFormBuilderDraft();
    showToast('Formulario de matrículas actualizado', 'success');
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

    const typeOptions = ['text', 'textarea', 'email', 'tel', 'date', 'select', 'file', 'url'];
    listEl.innerHTML = paged.items.length
        ? paged.items.map(item => {
            const absoluteIndex = draft.findIndex(f => String(f.id) === String(item.id));
            const isSelect = String(item.type) === 'select';
            return `<div class="card-check" style="display:block;padding:10px;margin-bottom:8px">
                <div class="form-row" style="margin-bottom:6px">
                    <div class="form-group"><label class="form-label">Sección</label><input class="form-input" value="${escapeHtml(item.section)}" oninput="updateEnrollmentFormField('${absoluteIndex}','section',this.value,false)"></div>
                    <div class="form-group"><label class="form-label">Tipo</label><select class="form-input" onchange="updateEnrollmentFormField('${absoluteIndex}','type',this.value)">${typeOptions.map(t => `<option value="${t}" ${String(item.type) === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
                </div>
                <div class="form-row" style="margin-bottom:6px">
                    <div class="form-group"><label class="form-label">Etiqueta</label><input class="form-input" value="${escapeHtml(item.label)}" oninput="updateEnrollmentFormField('${absoluteIndex}','label',this.value,false)"></div>
                    <div class="form-group"><label class="form-label">Placeholder</label><input class="form-input" value="${escapeHtml(item.placeholder)}" oninput="updateEnrollmentFormField('${absoluteIndex}','placeholder',this.value,false)"></div>
                </div>
                ${isSelect ? `<div class="form-group" style="margin-bottom:6px"><label class="form-label">Opciones (coma)</label><input class="form-input" value="${escapeHtml(asArray(item.options).join(', '))}" oninput="updateEnrollmentFormField('${absoluteIndex}','options',this.value,false)"></div>` : ''}
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                    <label class="card-check" style="margin:0"><input type="checkbox" ${item.required ? 'checked' : ''} onchange="updateEnrollmentFormField('${absoluteIndex}','required',this.checked,false)"><span>Obligatorio</span></label>
                    <button class="btn btn-sm btn-outline" type="button" onclick="deleteEnrollmentFormField('${absoluteIndex}')">Eliminar</button>
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

    const rows = (state.certificates || []).map(c => {
        const student = (state.students || []).find(s => String(s.id) === String(c.studentId || (c.student || {}).id || ''));
        const dateRaw = c.createdAt || c.issuedAt || '';
        const date = dateRaw ? new Date(dateRaw).toLocaleDateString('es-CO') : '-';
        const fileLabel = c.fileName || (c.filePath ? 'Adjunto' : '-');
        return `<tr><td>${escapeHtml(student ? userNameFrom(student) : 'Sin estudiante')}</td><td>${escapeHtml(c.name || 'Sin nombre')}</td><td>${escapeHtml(fileLabel)}</td><td>${escapeHtml(date)}</td><td><button class="btn btn-sm btn-outline" onclick="deleteCertificate('${String(c.id)}')">Eliminar</button></td></tr>`;
    }).join('');
    host.innerHTML = rows
        ? `<table class="table"><thead><tr><th>Estudiante</th><th>Certificado</th><th>Archivo</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table>`
        : '<div class="muted">No hay certificados registrados.</div>';
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
        }
    }

    document.getElementById('certName').value = '';
    if (fileInput) fileInput.value = '';
    state.ui.certSelectedStudentIds = [];
    renderCertificatesSection();
    renderOverview();
    if (failed > 0) {
        showToast(`Certificados emitidos: ${created}. Fallidos: ${failed}.`, 'error');
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

function saveGuideFromModal(guideId) {
    const title = String((document.getElementById('guideTitle') || {}).value || '').trim();
    const detail = String((document.getElementById('guideDetail') || {}).value || '').trim();
    const pdfUrlInput = String((document.getElementById('guidePdfUrl') || {}).value || '').trim();
    const pdfUrl = String(modalState.guidePdfDataUrl || pdfUrlInput || '').trim();
    const richHtml = sanitizeRichHtml(trtGetHtml('guideRichEditor'));
    const attachments = normalizeGuideAttachments(modalState.guideAttachments);
    if (!title) return showToast('Título requerido', 'error');
    const payload = {
        id: guideId || ('guide-' + Date.now()),
        title,
        detail,
        pdfUrl,
        hasPdf: !!pdfUrl,
        hasText: !!(richHtml || detail),
        textSections: [],
        richHtml,
        attachments
    };
    if (guideId) {
        state.guides = (state.guides || []).map(g => String(g.id) === String(guideId) ? { ...g, ...payload } : g);
    } else {
        state.guides.unshift(payload);
    }
    saveStorage(STORAGE_KEYS.guides, state.guides || []);
    closeModal();
    renderGuidesSection();
    showToast('Instructivo guardado', 'success');
}

function deleteGuide(guideId) {
    state.guides = (state.guides || []).filter(g => String(g.id) !== String(guideId));
    saveStorage(STORAGE_KEYS.guides, state.guides || []);
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
    if (!isBuilderWindow()) return openFormBuilderWindow();
    ensureFormDraft();
    const q = state.ui.formDraft.questions[index];
    if (!q || !questionNeedsOptions(q.type)) return;
    q.options = asArray(q.options);
    q.options.push('');
    renderFormBuilderQuestions();
}

function removeBuilderQuestionOption(index, optionIndex) {
    if (!isBuilderWindow()) return openFormBuilderWindow();
    ensureFormDraft();
    const q = state.ui.formDraft.questions[index];
    if (!q || !questionNeedsOptions(q.type)) return;
    q.options = asArray(q.options).filter((_, idx) => idx !== optionIndex);
    if (!q.options.length) q.options = [''];
    renderFormBuilderQuestions();
}

function addBuilderQuestion() {
    if (!isBuilderWindow()) return openFormBuilderWindow();
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
    if (!isBuilderWindow()) return openFormBuilderWindow();
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

function saveFormBuilder() {
    if (!isBuilderWindow()) return openFormBuilderWindow();
    ensureFormDraft();
    const type = getBuilderType();
    const titleInput = document.getElementById('formTitleInput');
    const title = String((titleInput || {}).value || '').trim() || (type === 'eval' ? 'Evaluacion docente' : 'Autoevaluacion');
    const sanitized = cloneQuestions(state.ui.formDraft.questions || []).map(q => ({ ...q, label: String(q.text || '').trim() })).filter(q => q.text);
    if (!sanitized.length) return showToast('Agrega al menos una pregunta valida', 'error');
    if (isBaseFormKey(type)) {
        state.forms[type] = sanitized;
        state.formsMeta[type] = { title };
        saveStorage(STORAGE_KEYS.forms, state.forms);
        saveStorage(STORAGE_KEYS.formsMeta, state.formsMeta);
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
            alert('Responde todas las preguntas obligatorias.');
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
    alert('Respuesta enviada. Gracias.');
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

function submitPublicSurveyVote(surveyId) {
    const survey = asArray(state.surveys).find(s => String(s.id) === String(surveyId));
    const roleName = getActiveUserRoleName();
    const optionId = String(modalState.surveyVoteSelections[String(surveyId)] || '');
    const result = registerVoteForSurvey(survey, roleName, optionId);
    if (!result.ok) {
        alert(result.message || 'No se pudo registrar el voto');
        return;
    }
    alert('Voto registrado. Gracias.');
    renderPublicSurveyPage(surveyId);
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

function bindStorageListeners() {
    if (storageListenersBound) return;
    storageListenersBound = true;
    window.addEventListener('storage', () => {
        // backend-only: no sincronización por storage del navegador.
    });
}

function startPublicSurveyLiveSync(surveyId) {
    const sid = String(surveyId || '');
    if (!sid) return;
    if (publicSurveyLiveTimer) clearInterval(publicSurveyLiveTimer);
    let lastSignature = getSurveyLiveSignature(asArray(state.surveys).find(s => String(s.id) === sid));
    publicSurveyLiveTimer = setInterval(() => {
        state.surveys = asArray(readStorage(STORAGE_KEYS.surveys, state.surveys));
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

function createSurvey() {
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
    state.surveys.unshift({
        id: 'srv-' + Date.now(),
        question,
        roles,
        authRequired,
        voteLedger: {},
        status: 'active',
        createdAt: new Date().toISOString(),
        startsAt,
        endsAt,
        questionMedia,
        options: options.map((opt, idx) => ({
            id: 'opt-' + Date.now() + '-' + idx,
            text: opt.text,
            votes: 0,
            media: normalizeSurveyQuestionMedia(opt.media)
        }))
    });
    saveStorage(STORAGE_KEYS.surveys, state.surveys);
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

function registerVoteForSurvey(survey, roleName, optionId) {
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
    survey.options = asArray(survey.options).map(opt => String(opt.id) === optionValue
        ? { ...opt, votes: (parseInt(opt.votes || '0', 10) || 0) + 1 }
        : opt);
    survey.voteLedger[voterKey] = {
        optionId: optionValue,
        at: new Date().toISOString()
    };
    saveStorage(STORAGE_KEYS.surveys, state.surveys);
    return { ok: true };
}

function submitSurveyVote(surveyId) {
    const survey = (state.surveys || []).find(s => String(s.id) === String(surveyId));
    const optionId = String(modalState.surveyVoteSelections[String(surveyId)] || '');
    const roleName = getActiveUserRoleName();
    const result = registerVoteForSurvey(survey, roleName, optionId);
    if (!result.ok) return showToast(result.message, 'error');
    modalState.surveyVoteSelections[String(surveyId)] = optionId;
    renderSurveyBoards();
    showToast('Voto registrado', 'success');
}

function closeSurvey(surveyId) {
    if (!window.confirm('¿Deseas finalizar manualmente esta encuesta ahora?')) return;
    state.surveys = asArray(state.surveys).map(s => String(s.id) === String(surveyId)
        ? { ...s, status: 'closed', closedAt: new Date().toISOString(), closedManually: true }
        : s);
    saveStorage(STORAGE_KEYS.surveys, state.surveys);
    renderSurveyBoards();
    showToast('Encuesta finalizada manualmente', 'success');
}

function deleteSurvey(surveyId) {
    state.surveys = asArray(state.surveys).filter(s => String(s.id) !== String(surveyId));
    delete modalState.surveyVoteSelections[String(surveyId)];
    saveStorage(STORAGE_KEYS.surveys, state.surveys);
    renderSurveyBoards();
    showToast('Encuesta eliminada del historial', 'success');
}

function shareSurveyLink(surveyId) {
    const sid = String(surveyId || '');
    if (!sid) return;
    const url = `${window.location.origin}${window.location.pathname}?publicSurvey=${encodeURIComponent(sid)}`;
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
    if (btnAdd) btnAdd.style.display = canEditHere ? '' : 'none';
    if (btnSave) btnSave.style.display = canEditHere ? '' : 'none';
    if (btnPreview) btnPreview.style.display = canEditHere ? '' : 'none';
    if (bottomAddWrap) bottomAddWrap.style.display = canEditHere ? '' : 'none';
    if (btnShare) btnShare.style.display = isCustomFormKey(type) ? '' : 'none';
    if (typeHint) {
        typeHint.textContent = isBaseFormKey(type)
            ? 'Este formulario se publica automáticamente en Area personal de estudiantes autenticados.'
            : 'Formulario personalizable: puedes compartir link y controlar acceso por roles, todos los registrados o cualquiera.';
    }
    if (hint) hint.textContent = canEditHere ? 'Editas preguntas y guardas desde esta ventana del constructor.' : 'La edición de preguntas se hace solo en la ventana del constructor.';
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

function importStudentsBatch() {
    if (!importState.mappedRows.length) {
        previewImport();
    }
    const validRows = (importState.mappedRows || []).filter(r => r._valid);
    if (!validRows.length) return showToast('No hay filas válidas para importar', 'error');

    let imported = 0;
    let updated = 0;
    let createdLevels = 0;
    let createdGrades = 0;
    validRows.forEach((row, idx) => {
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
        const level = row.level ? ensureAcademicLevelByName(row.level) : null;
        if ((state.academicLevels || []).length > levelBefore) createdLevels += 1;
        const grade = (level && row.grade) ? ensureAcademicGradeByName(level.id, row.grade) : null;
        if ((state.academicGrades || []).length > gradeBefore) createdGrades += 1;

        if (studentRef) {
            const sid = String(studentRef.id || '');
            if (sid && level) state.studentLevels[sid] = String(level.id);
            if (sid) {
                if (grade) state.studentGrades[sid] = String(grade.id);
                else if (row.level && !row.grade) delete state.studentGrades[sid];
            }
        }
    });

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
    if (model) model.value = p.selectedMethod || 'simple';
    if (allow) allow.value = p.allowTeacherCustom ? 'true' : 'false';
    if (forced) forced.value = p.forcedModel || '';
    if (min) min.value = String(p.examMinPercent ?? 0);
    if (max) max.value = String(p.examMaxPercent ?? 100);
    const guide = document.getElementById('gradingGuide');
    if (guide) guide.innerHTML = '<div class="muted">Configura la política y guarda cambios.</div>';
}

function saveGradePolicy() {
    const selectedMethod = String((document.getElementById('gradingModel') || {}).value || 'simple');
    const allowTeacherCustom = String((document.getElementById('allowTeacherCustom') || {}).value || 'true') === 'true';
    const forcedModel = String((document.getElementById('forcedModel') || {}).value || '');
    const examMinPercent = Math.max(0, Math.min(100, parseInt((document.getElementById('examMinPercent') || {}).value || '0', 10) || 0));
    const examMaxPercent = Math.max(0, Math.min(100, parseInt((document.getElementById('examMaxPercent') || {}).value || '100', 10) || 100));
    state.gradePolicy = { selectedMethod, allowTeacherCustom, forcedModel, examMinPercent, examMaxPercent };
    saveStorage(STORAGE_KEYS.gradePolicy, state.gradePolicy);
    renderOverview();
    showToast('Política de calificación guardada', 'success');
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
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${item.grades.slice(0, 5).map(g => `<span style="display:inline-flex;align-items:center;gap:4px;background:#eef4fb;border-radius:999px;padding:2px 8px;font-size:11px">${escapeHtml(g.name)} <button type="button" style="border:none;background:transparent;color:#8a1529;cursor:pointer" onclick="deleteAcademicGrade('${String(g.id)}')">x</button></span>`).join('')}${item.grades.length > 5 ? `<button class="btn btn-sm btn-outline" onclick="openLevelDetailsModal('${String(item.level.id)}')">Ver más</button>` : ''}</div>
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

function deleteAcademicGrade(gradeId) {
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
    renderCoursesSection();
}

function deleteAcademicLevel(levelId) {
    const id = String(levelId);
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
    renderCoursesSection();
    showToast('Nivel eliminado', 'success');
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
}

function renderAll() {
    renderOverview();
    renderCoursesSection();
    callIfFn('renderRolesSection');
    callIfFn('renderCertificatesSection');
    callIfFn('renderEnrollmentReviewSection');
    callIfFn('renderEnrollmentFormBuilderSection');
    callIfFn('renderGuidesSection');
    callIfFn('renderFormsSection');
    callIfFn('renderImportSection');
    callIfFn('renderGradePolicySection');
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

async function init() {
    try {
        const me = await api('/api/auth/me').catch(() => null);
        if (!me || !me.id) {
            window.location.href = '/login?role=staff&redirect=/admin-dashboard';
            return;
        }
        activeSessionUser = me;
        await hydrateStorageFromBackend();
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
        navigateTo(readAdminNavigationState(), { skipPersist: false });
        applyBuilderFullscreenModeIfNeeded();
        if (!surveyLiveTimer) {
            surveyLiveTimer = setInterval(() => {
                state.surveys = asArray(readStorage(STORAGE_KEYS.surveys, state.surveys));
                renderSurveyBoards();
            }, 2500);
        }

        const activeUser = state.users.find(u => String(u.id || '') === String(me.id || ''));
        if (activeUser) document.getElementById('sidebarUserName').textContent = activeUser.name;
    } finally {
        hideInitialBootLoader();
    }
}

init();

