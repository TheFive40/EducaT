const API = 'http://localhost:8080';
const STORAGE_KEYS = {
    guides: 'educat_admin_instructivos',
    forms: 'educat_admin_eval_forms',
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
    assignmentRules: 'educat_admin_assignment_rules'
};

const PERMISSIONS = [
    'cursos.crear', 'cursos.editar', 'cursos.eliminar', 'cursos.asignar',
    'niveles.crear', 'niveles.asignar',
    'roles.crear', 'roles.permisos',
    'certificados.emitir', 'certificados.eliminar',
    'instructivos.editar',
    'formularios.editar', 'formularios.reportes',
    'notas.configurar',
    'bienestar.psicologia',
    'bienestar.deportes',
    'bienestar.arte',
    'bienestar.orientacion',
    'bienestar.salud',
    'bienestar.becas',
    'bienestar.publicar',
    'bienestar.editar-publicacion',
    'bienestar.eliminar-publicacion',
    'bienestar.aprobar-publicacion',
    'bienestar.rechazar-publicacion',
    'bienestar.eliminar-comentario',
    'bienestar.eliminar-reaccion'
];

const PERMISSION_LABELS = {
    'cursos.crear': 'Cursos - Crear',
    'cursos.editar': 'Cursos - Editar',
    'cursos.eliminar': 'Cursos - Eliminar',
    'cursos.asignar': 'Cursos - Asignar estudiantes',
    'niveles.crear': 'Niveles - Crear',
    'niveles.asignar': 'Niveles - Asignar cursos/docentes',
    'roles.crear': 'Roles - Crear',
    'roles.permisos': 'Roles - Gestionar permisos',
    'certificados.emitir': 'Certificados - Emitir',
    'certificados.eliminar': 'Certificados - Eliminar',
    'instructivos.editar': 'Instructivos - Editar',
    'formularios.editar': 'Formularios - Editar',
    'formularios.reportes': 'Formularios - Reportes',
    'notas.configurar': 'Notas - Configurar política',
    'bienestar.psicologia': 'Bienestar - Apoyo Psicológico',
    'bienestar.deportes': 'Bienestar - Actividad Física y Deportes',
    'bienestar.arte': 'Bienestar - Arte y Cultura',
    'bienestar.orientacion': 'Bienestar - Orientación Vocacional',
    'bienestar.salud': 'Bienestar - Servicio Médico y Salud',
    'bienestar.becas': 'Bienestar - Apoyos Económicos y Becas',
    'bienestar.publicar': 'Bienestar - Publicar',
    'bienestar.editar-publicacion': 'Bienestar - Editar publicación',
    'bienestar.eliminar-publicacion': 'Bienestar - Eliminar publicación',
    'bienestar.aprobar-publicacion': 'Bienestar - Aprobar solicitud de publicación',
    'bienestar.rechazar-publicacion': 'Bienestar - Denegar solicitud de publicación',
    'bienestar.eliminar-comentario': 'Bienestar - Eliminar comentarios',
    'bienestar.eliminar-reaccion': 'Bienestar - Eliminar reacciones'
};

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
    rolePerms: {},
    userPerms: {},
    gradePolicy: { ...DEFAULT_POLICY },
    academicLevels: [],
    academicGrades: [],
    courseLevels: {},
    courseGrades: {},
    courseCapacity: {},
    teacherLevels: {},
    teacherGrades: {},
    assignmentRules: [],
    ui: {
        rolesSearch: '',
        rolesPage: 1,
        rolesPageSize: 8,
        permRoleSearch: '',
        permRolePage: 1,
        permRolePageSize: 20,
        permUserSearch: '',
        permUserPage: 1,
        permUserPageSize: 20
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
        { id: 801, name: 'Matemáticas 6A', description: 'Números y geometría básica', teacher: { id: 901, user: { name: 'Prof. Laura Méndez' } } },
        { id: 802, name: 'Lengua 7B', description: 'Comprensión lectora y redacción', teacher: { id: 902, user: { name: 'Prof. Andrés Rojas' } } },
        { id: 803, name: 'Ciencias 8A', description: 'Biología y física introductoria', teacher: { id: 903, user: { name: 'Prof. Diana Castro' } } },
        { id: 804, name: 'Álgebra 9A', description: 'Expresiones algebraicas', teacher: { id: 901, user: { name: 'Prof. Laura Méndez' } } }
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
    studentCourse: { levelId: '', gradeIds: [], queryStudent: '', queryCourse: '', pageStudents: 1, pageCourses: 1, pageSize: 8, gradePage: 1, gradePageSize: 8, selectedStudents: {}, selectedCourses: {} },
    courseLevel: { levelId: '', queryCourse: '', pageCourses: 1, pageSize: 10, levelPage: 1, levelPageSize: 8, selectedCourses: {} },
    enrollmentSummary: { page: 1, pageSize: 8 },
    levelsSummary: { page: 1, pageSize: 6, query: '', filter: 'all' },
    courseCreate: { gradeIds: [], menuOpen: false },
    teacherAssign: { gradeIds: [], menuOpen: false }
};

function getAuth() {
    return localStorage.getItem('educat_auth') || sessionStorage.getItem('educat_auth') || '';
}

function headers(json = true) {
    const h = {};
    if (json) h['Content-Type'] = 'application/json';
    const auth = getAuth();
    if (auth) h.Authorization = 'Bearer ' + auth;
    return h;
}

async function api(path, options = {}) {
    const res = await fetch(API + path, options);
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || ('HTTP ' + res.status));
    }
    if (res.status === 204) return null;
    return res.json();
}

function readStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
}

function saveStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
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

function navigateTo(section) {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.section === section));
    document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('panel-' + section);
    if (panel) panel.classList.add('active');
    const title = {
        overview: 'Resumen',
        cursos: 'Cursos y asignaciones',
        roles: 'Roles y permisos',
        certificados: 'Certificados',
        instructivos: 'Instructivos',
        formularios: 'Formularios de evaluacion',
        importacion: 'Importar Datos',
        calificacion: 'Sistema de calificacion'
    }[section] || 'Administrador';
    document.getElementById('pageTitle').textContent = title;
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
    const fallbackUsers = [
        { id: 1, name: 'Admin', email: 'admin@educat.edu.co', role: { id: 1, name: 'ADMIN' } }
    ];
    const calls = [
        api('/api/users').catch(() => fallbackUsers),
        api('/api/teachers').catch(() => []),
        api('/api/students').catch(() => []),
        api('/api/courses').catch(() => []),
        api('/api/enrollments').catch(() => []),
        api('/api/roles').catch(() => []),
        api('/api/certificates').catch(() => [])
    ];
    const [users, teachers, students, courses, enrollments, roles, certificates] = await Promise.all(calls);
    state.users = users || [];
    state.teachers = teachers || [];
    state.students = students || [];
    state.courses = courses || [];
    state.enrollments = enrollments || [];
    state.roles = roles || [];
    state.certificates = certificates || [];

    state.guides = readStorage(STORAGE_KEYS.guides, null) || DEFAULT_GUIDES;
    state.forms = readStorage(STORAGE_KEYS.forms, null) || DEFAULT_FORMS;
    state.rolePerms = readStorage(STORAGE_KEYS.rolePerms, {});
    state.userPerms = readStorage(STORAGE_KEYS.userPerms, {});
    state.gradePolicy = { ...DEFAULT_POLICY, ...readStorage(STORAGE_KEYS.gradePolicy, {}) };
    state.academicLevels = readStorage(STORAGE_KEYS.academicLevels, null) || DEFAULT_LEVELS;
    state.academicGrades = readStorage(STORAGE_KEYS.academicGrades, []);
    state.courseLevels = readStorage(STORAGE_KEYS.courseLevels, {});
    state.courseGrades = readStorage(STORAGE_KEYS.courseGrades, {});
    state.courseCapacity = readStorage(STORAGE_KEYS.courseCapacity, {});
    state.teacherLevels = readStorage(STORAGE_KEYS.teacherLevels, {});
    state.teacherGrades = readStorage(STORAGE_KEYS.teacherGrades, {});
    state.assignmentRules = readStorage(STORAGE_KEYS.assignmentRules, []);

    seedDemoDataIfNeeded();

    await ensureDefaultRoles();
}

function seedDemoDataIfNeeded() {
    if (!state.teachers.length) state.teachers = DEMO_DATA.teachers.map(t => ({ ...t }));
    if (!state.students.length) state.students = DEMO_DATA.students.map(s => ({ ...s }));
    if (!state.courses.length) state.courses = DEMO_DATA.courses.map(c => ({ ...c }));

    if (!state.enrollments.length) {
        state.enrollments = DEMO_DATA.enrollments.map(e => ({
            id: e.id,
            student: state.students.find(s => s.id === e.studentId) || { id: e.studentId },
            course: state.courses.find(c => c.id === e.courseId) || { id: e.courseId },
            enrollmentDate: new Date().toISOString()
        }));
    }

    if (!state.academicLevels.length) state.academicLevels = DEMO_DATA.academicLevels.map(l => ({ ...l }));
    if (!state.academicGrades.length) state.academicGrades = DEMO_DATA.academicGrades.map(g => ({ ...g }));
    if (!Object.keys(state.courseLevels || {}).length) state.courseLevels = { ...DEMO_DATA.courseLevels };
    if (!Object.keys(state.courseGrades || {}).length) state.courseGrades = { ...DEMO_DATA.courseGrades };
    if (!Object.keys(state.courseCapacity || {}).length) state.courseCapacity = { ...DEMO_DATA.courseCapacity };
    if (!Object.keys(state.teacherLevels || {}).length) state.teacherLevels = { ...DEMO_DATA.teacherLevels };
    if (!Object.keys(state.teacherGrades || {}).length) state.teacherGrades = { ...DEMO_DATA.teacherGrades };

    saveLevelsState();
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
    const required = ['ESTUDIANTE', 'PROFESOR'];
    for (const roleName of required) {
        const exists = state.roles.some(r => (r.name || '').toUpperCase() === roleName);
        if (exists) continue;
        try {
            const created = await api('/api/roles', { method: 'POST', headers: headers(), body: JSON.stringify({ name: roleName }) });
            state.roles.push(created);
        } catch (e) {
            // fallback local si el backend no permite creación en este momento
            state.roles.push({ id: Date.now() + Math.floor(Math.random() * 1000), name: roleName });
        }
    }
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

function fillSelect(selectId, items, toOption, firstLabel) {
    const el = document.getElementById(selectId);
    if (!el) return;
    const first = firstLabel ? `<option value="">${firstLabel}</option>` : '';
    el.innerHTML = first + items.map(toOption).join('');
}

function getGradesByLevel(levelId) {
    return (state.academicGrades || []).filter(g => String(g.levelId) === String(levelId));
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

function getCourseGradeIds(courseId) {
    const raw = state.courseGrades[String(courseId)];
    if (Array.isArray(raw)) return raw.map(String);
    if (raw === undefined || raw === null || raw === '') return [];
    return [String(raw)];
}

function setCourseGradeIds(courseId, gradeIds) {
    const ids = (gradeIds || []).map(String).filter(Boolean);
    if (!ids.length) delete state.courseGrades[String(courseId)];
    else state.courseGrades[String(courseId)] = ids;
}

function getGradeNameByCourseId(courseId) {
    const names = getCourseGradeIds(courseId)
        .map(id => (state.academicGrades || []).find(g => String(g.id) === String(id)))
        .filter(Boolean)
        .map(g => g.name);
    if (!names.length) return 'Sin grado';
    return names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', ');
}

function renderCourseGradeOptions() {
    const levelId = (document.getElementById('courseLevel') || {}).value || '';
    const teacherId = (document.getElementById('courseTeacher') || {}).value || '';
    const gradeHost = document.getElementById('courseGradeMenu');
    const gradeLabel = document.getElementById('courseGradeLabel');
    if (!gradeHost || !gradeLabel) return;
    const gradesInLevel = getGradesByLevel(levelId);
    const allowedGradeIds = getTeacherGradeIds(teacherId, levelId);
    const grades = allowedGradeIds.length
        ? gradesInLevel.filter(g => allowedGradeIds.includes(String(g.id)))
        : gradesInLevel;
    const validIds = new Set(grades.map(g => String(g.id)));
    modalState.courseCreate.gradeIds = (modalState.courseCreate.gradeIds || []).filter(id => validIds.has(String(id)));
    gradeHost.innerHTML = grades.length
        ? grades.map(g => `<label class="multi-check-item"><input type="checkbox" ${modalState.courseCreate.gradeIds.includes(String(g.id)) ? 'checked' : ''} onchange="toggleCourseCreateGrade('${g.id}',this.checked)"><span>${escapeHtml(g.name)}</span></label>`).join('')
        : '<div class="muted" style="padding:8px">Sin grados disponibles para este docente</div>';
    const selectedNames = grades.filter(g => modalState.courseCreate.gradeIds.includes(String(g.id))).map(g => g.name);
    gradeLabel.textContent = selectedNames.length
        ? (selectedNames.length > 2 ? `${selectedNames.slice(0, 2).join(', ')} +${selectedNames.length - 2}` : selectedNames.join(', '))
        : 'Seleccionar grados';
}

function renderAssignTeacherGradeOptions() {
    const levelId = (document.getElementById('assignTeacherLevel') || {}).value || '';
    const teacherId = (document.getElementById('assignLevelTeacher') || {}).value || '';
    const host = document.getElementById('assignTeacherGradeMenu');
    const label = document.getElementById('assignTeacherGradeLabel');
    if (!host || !label) return;
    const grades = getGradesByLevel(levelId);
    const stored = getTeacherGradeIds(teacherId, levelId);
    const incoming = (modalState.teacherAssign.gradeIds || []).length ? modalState.teacherAssign.gradeIds : stored;
    const validSet = new Set(grades.map(g => String(g.id)));
    modalState.teacherAssign.gradeIds = incoming.map(String).filter(id => validSet.has(id));
    host.innerHTML = grades.length
        ? grades.map(g => `<label class="multi-check-item"><input type="checkbox" ${modalState.teacherAssign.gradeIds.includes(String(g.id)) ? 'checked' : ''} onchange="toggleAssignTeacherGrade('${g.id}',this.checked)"><span>${escapeHtml(g.name)}</span></label>`).join('')
        : '<div class="muted" style="padding:8px">Sin grados en este nivel</div>';
    const selectedNames = grades.filter(g => modalState.teacherAssign.gradeIds.includes(String(g.id))).map(g => g.name);
    label.textContent = selectedNames.length
        ? (selectedNames.length > 2 ? `${selectedNames.slice(0, 2).join(', ')} +${selectedNames.length - 2}` : selectedNames.join(', '))
        : 'Seleccionar grados';
}

function toggleAssignTeacherGrade(gradeId, checked) {
    const id = String(gradeId);
    const arr = modalState.teacherAssign.gradeIds || [];
    if (checked && !arr.includes(id)) arr.push(id);
    if (!checked) modalState.teacherAssign.gradeIds = arr.filter(x => x !== id);
    renderAssignTeacherGradeOptions();
}

function toggleAssignTeacherGradeMenu() {
    modalState.teacherAssign.menuOpen = !modalState.teacherAssign.menuOpen;
    const host = document.getElementById('assignTeacherGradeMulti');
    if (host) host.classList.toggle('open', modalState.teacherAssign.menuOpen);
}

function toggleCourseCreateGrade(gradeId, checked) {
    const id = String(gradeId);
    const arr = modalState.courseCreate.gradeIds || [];
    if (checked && !arr.includes(id)) arr.push(id);
    if (!checked) modalState.courseCreate.gradeIds = arr.filter(x => x !== id);
    renderCourseGradeOptions();
}

function toggleCourseGradeMenu() {
    modalState.courseCreate.menuOpen = !modalState.courseCreate.menuOpen;
    const host = document.getElementById('courseGradeMulti');
    if (host) host.classList.toggle('open', modalState.courseCreate.menuOpen);
}

function renderCoursesSection() {
    const courseTeacherEl = document.getElementById('courseTeacher');
    const prevTeacher = courseTeacherEl ? String(courseTeacherEl.value || '') : '';
    fillSelect('courseTeacher', state.teachers, t => `<option value="${t.id}">${escapeHtml(userNameFrom(t))}</option>`, 'Selecciona docente');
    if (courseTeacherEl && prevTeacher && (state.teachers || []).some(t => String(t.id) === prevTeacher)) courseTeacherEl.value = prevTeacher;
    renderCourseLevelOptions();
    renderCourseGradeOptions();
    fillSelect('gradeLevel', state.academicLevels, l => `<option value="${l.id}">${escapeHtml(l.name)}</option>`, 'Selecciona nivel');
    fillSelect('assignCourseLevel', state.academicLevels, l => `<option value="${l.id}">${escapeHtml(l.name)}</option>`, 'Selecciona nivel');
    fillSelect('assignTeacherLevel', state.academicLevels, l => `<option value="${l.id}">${escapeHtml(l.name)}</option>`, 'Selecciona nivel');
    fillSelect('assignLevelTeacher', state.teachers, t => `<option value="${t.id}">${escapeHtml(userNameFrom(t))}</option>`, 'Selecciona docente');
    renderAssignTeacherGradeOptions();
    const levelsSearch = document.getElementById('levelsSearch');
    if (levelsSearch) levelsSearch.value = modalState.levelsSummary.query || '';
    const levelsFilter = document.getElementById('levelsFilter');
    if (levelsFilter) levelsFilter.value = modalState.levelsSummary.filter || 'all';
    renderEnrollmentsTable();
    renderLevelsTable();
}

function saveLevelsState() {
    saveStorage(STORAGE_KEYS.academicLevels, state.academicLevels);
    saveStorage(STORAGE_KEYS.academicGrades, state.academicGrades);
    saveStorage(STORAGE_KEYS.courseLevels, state.courseLevels);
    saveStorage(STORAGE_KEYS.courseGrades, state.courseGrades);
    saveStorage(STORAGE_KEYS.courseCapacity, state.courseCapacity);
    saveStorage(STORAGE_KEYS.teacherLevels, state.teacherLevels);
    saveStorage(STORAGE_KEYS.teacherGrades, state.teacherGrades);
}

function compactListCell(items, maxItems) {
    const arr = (items || []).filter(Boolean);
    if (!arr.length) return '<span class="muted">Sin registros</span>';
    const visible = arr.slice(0, maxItems).map(v => `<span class="cell-chip" title="${escapeHtml(v)}">${escapeHtml(v)}</span>`).join('');
    const extra = arr.length > maxItems ? `<span class="cell-chip cell-chip-more" title="${escapeHtml(arr.join(', '))}">+${arr.length - maxItems} más</span>` : '';
    return `<div class="cell-chip-wrap">${visible}${extra}</div>`;
}

function renderLevelsTable() {
    const cfg = modalState.levelsSummary;
    const query = (cfg.query || '').toLowerCase();
    const filter = cfg.filter || 'all';
    const rowsData = (state.academicLevels || []).map(l => {
        const courses = state.courses.filter(c => String(state.courseLevels[String(c.id)] || '') === String(l.id));
        const teachers = state.teachers.filter(t => (state.teacherLevels[String(t.id)] || []).includes(String(l.id)));
        const grades = (state.academicGrades || []).filter(g => String(g.levelId) === String(l.id));
        return {
            level: l,
            courses,
            teachers,
            grades,
            courseNames: courses.map(c => c.name).join(', '),
            teacherNames: teachers.map(t => userNameFrom(t)).join(', '),
            gradeNames: grades.map(g => g.name).join(', ')
        };
    }).filter(r => {
        if (filter === 'with-courses' && !r.courses.length) return false;
        if (filter === 'with-teachers' && !r.teachers.length) return false;
        if (filter === 'without-courses' && r.courses.length) return false;
        if (filter === 'without-teachers' && r.teachers.length) return false;
        if (!query) return true;
        return (r.level.name || '').toLowerCase().includes(query)
            || (r.level.description || '').toLowerCase().includes(query)
            || r.courseNames.toLowerCase().includes(query)
            || r.teacherNames.toLowerCase().includes(query)
            || r.gradeNames.toLowerCase().includes(query);
    });

    const pageSize = cfg.pageSize;
    const totalPages = Math.max(1, Math.ceil(rowsData.length / pageSize));
    cfg.page = Math.min(Math.max(1, cfg.page), totalPages);
    const chunk = rowsData.slice((cfg.page - 1) * pageSize, cfg.page * pageSize);

    const rows = chunk.map(r => `<tr>
        <td><span class="cell-ellipsis" title="${escapeHtml(r.level.name)}">${escapeHtml(r.level.name)}</span></td>
        <td><span class="cell-ellipsis" title="${escapeHtml(r.level.description || '-')}">${escapeHtml(r.level.description || '-')}</span></td>
        <td>${compactListCell(r.grades.map(g => g.name || 'Grado'), 3)}</td>
        <td>${compactListCell(r.courses.map(c => c.name || 'Curso'), 2)}</td>
        <td>${compactListCell(r.teachers.map(t => userNameFrom(t)), 2)}</td>
        <td>
            <div class="cell-actions">
                <button class="btn btn-sm btn-outline" onclick="openLevelAssignmentsModal('${r.level.id}')">Gestionar</button>
            </div>
        </td>
    </tr>`).join('');

    document.getElementById('levelsTable').innerHTML = `
        <table class="simple-table levels-compact-table">
            <thead><tr><th>Nivel</th><th>Descripción</th><th>Grados</th><th>Cursos</th><th>Docentes</th><th>Acciones</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="6" class="muted">Sin niveles registrados</td></tr>'}</tbody>
        </table>
        <div class="pager" style="margin-top:10px">
            <span>Mostrando ${rowsData.length ? ((cfg.page - 1) * pageSize + 1) : 0}-${Math.min(cfg.page * pageSize, rowsData.length)} de ${rowsData.length}</span>
            <div style="display:flex;gap:6px">
                <button class="btn btn-sm btn-outline" ${cfg.page===1?'disabled':''} onclick="changeLevelsSummaryPage(-1)">Anterior</button>
                <button class="btn btn-sm btn-outline" ${cfg.page===totalPages?'disabled':''} onclick="changeLevelsSummaryPage(1)">Siguiente</button>
            </div>
        </div>
    `;
}

function changeLevelsSummaryPage(delta) {
    modalState.levelsSummary.page = Math.max(1, (modalState.levelsSummary.page || 1) + delta);
    renderLevelsTable();
}

function applyLevelsSummaryFilters() {
    const qEl = document.getElementById('levelsSearch');
    const fEl = document.getElementById('levelsFilter');
    modalState.levelsSummary.query = (qEl ? qEl.value : '') || '';
    modalState.levelsSummary.filter = (fEl ? fEl.value : 'all') || 'all';
    modalState.levelsSummary.page = 1;
    renderLevelsTable();
}

function openEditLevelModal(levelId) {
    const level = state.academicLevels.find(l => String(l.id) === String(levelId));
    if (!level) return;
    openModal('Editar nivel académico', `
        <div class="form-group"><label class="form-label">Nombre</label><input id="editLevelName" class="form-input" value="${escapeHtml(level.name)}"></div>
        <div class="form-group"><label class="form-label">Descripción</label><input id="editLevelDescription" class="form-input" value="${escapeHtml(level.description || '')}"></div>
        <div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn btn-outline" onclick="closeModal()">Cancelar</button><button class="btn btn-teal" onclick="saveEditedLevel('${level.id}')">Guardar</button></div>
    `);
}

function saveEditedLevel(levelId) {
    const level = state.academicLevels.find(l => String(l.id) === String(levelId));
    if (!level) return;
    const name = ((document.getElementById('editLevelName') || {}).value || '').trim();
    const description = ((document.getElementById('editLevelDescription') || {}).value || '').trim();
    if (!name) return showToast('El nombre del nivel es obligatorio', 'error');
    level.name = name;
    level.description = description;
    saveLevelsState();
    closeModal();
    renderCoursesSection();
    showToast('Nivel actualizado', 'success');
}

function openDeleteLevelModal(levelId) {
    const level = state.academicLevels.find(l => String(l.id) === String(levelId));
    if (!level) return;
    openModal('Eliminar nivel', `
        <div class="alert alert-error" style="margin-bottom:12px">Esta acción desasignará cursos y docentes asociados al nivel <strong>${escapeHtml(level.name)}</strong>.</div>
        <div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn btn-outline" onclick="closeModal()">Cancelar</button><button class="btn btn-danger" onclick="confirmDeleteLevel('${level.id}')">Eliminar nivel</button></div>
    `);
}

function confirmDeleteLevel(levelId) {
    state.academicLevels = state.academicLevels.filter(l => String(l.id) !== String(levelId));
    const removedGradeIds = (state.academicGrades || []).filter(g => String(g.levelId) === String(levelId)).map(g => String(g.id));
    state.academicGrades = (state.academicGrades || []).filter(g => String(g.levelId) !== String(levelId));
    Object.keys(state.courseLevels || {}).forEach(cid => {
        if (String(state.courseLevels[cid]) === String(levelId)) delete state.courseLevels[cid];
    });
    Object.keys(state.courseGrades || {}).forEach(cid => {
        const left = getCourseGradeIds(cid).filter(gid => !removedGradeIds.includes(String(gid)));
        setCourseGradeIds(cid, left);
    });
    Object.keys(state.teacherLevels || {}).forEach(tid => {
        state.teacherLevels[tid] = (state.teacherLevels[tid] || []).filter(lid => String(lid) !== String(levelId));
    });
    Object.keys(state.teacherGrades || {}).forEach(tid => {
        const byLevel = state.teacherGrades[tid] || {};
        if (byLevel[String(levelId)]) delete byLevel[String(levelId)];
        state.teacherGrades[tid] = byLevel;
    });
    saveLevelsState();
    closeModal();
    renderCoursesSection();
    showToast('Nivel eliminado', 'success');
}

function openLevelAssignmentsModal(levelId) {
    const level = state.academicLevels.find(l => String(l.id) === String(levelId));
    if (!level) return;
    const courses = state.courses.filter(c => String(state.courseLevels[String(c.id)] || '') === String(levelId));
    const teachers = state.teachers.filter(t => (state.teacherLevels[String(t.id)] || []).includes(String(levelId)));
    const grades = (state.academicGrades || []).filter(g => String(g.levelId) === String(levelId));
    openModal('Gestionar asignaciones de nivel', `
        <div class="alert alert-info" style="margin-bottom:10px"><strong>${escapeHtml(level.name)}</strong> — puedes quitar cursos o docentes asociados.</div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:10px"><button class="btn btn-sm btn-outline" onclick="openEditLevelModal('${level.id}')">Editar nivel</button><button class="btn btn-sm btn-outline" onclick="openDeleteLevelModal('${level.id}')">Eliminar nivel</button></div>
        <div class="form-group"><label class="form-label">Grados asociados</label>
            <div class="card-list">${grades.length ? grades.map(g => `<div class="card-check" style="justify-content:space-between"><span>${escapeHtml(g.name || '')}</span><button class="btn btn-sm btn-outline" onclick="removeGradeFromLevel('${level.id}','${g.id}')">Quitar</button></div>`).join('') : '<div class="muted" style="padding:10px">Sin grados asociados</div>'}</div>
        </div>
        <div class="form-group"><label class="form-label">Cursos asociados</label>
            <div class="card-list">${courses.length ? courses.map(c => `<div class="card-check" style="justify-content:space-between"><span>${escapeHtml(c.name || '')}</span><button class="btn btn-sm btn-outline" onclick="removeCourseFromLevel('${level.id}','${c.id}')">Quitar</button></div>`).join('') : '<div class="muted" style="padding:10px">Sin cursos asociados</div>'}</div>
        </div>
        <div class="form-group"><label class="form-label">Docentes asociados</label>
            <div class="card-list">${teachers.length ? teachers.map(t => `<div class="card-check" style="justify-content:space-between"><span>${escapeHtml(userNameFrom(t))}</span><button class="btn btn-sm btn-outline" onclick="removeTeacherFromLevel('${level.id}','${t.id}')">Quitar</button></div>`).join('') : '<div class="muted" style="padding:10px">Sin docentes asociados</div>'}</div>
        </div>
        <div style="display:flex;justify-content:flex-end"><button class="btn btn-outline" onclick="closeModal()">Cerrar</button></div>
    `);
}

function removeGradeFromLevel(levelId, gradeId) {
    state.academicGrades = (state.academicGrades || []).filter(g => String(g.id) !== String(gradeId));
    Object.keys(state.courseGrades || {}).forEach(cid => {
        const left = getCourseGradeIds(cid).filter(gid => String(gid) !== String(gradeId));
        setCourseGradeIds(cid, left);
    });
    saveLevelsState();
    openLevelAssignmentsModal(levelId);
    renderCoursesSection();
    showToast('Grado eliminado del nivel', 'success');
}

function removeCourseFromLevel(levelId, courseId) {
    if (String(state.courseLevels[String(courseId)] || '') === String(levelId)) {
        delete state.courseLevels[String(courseId)];
        saveLevelsState();
        openLevelAssignmentsModal(levelId);
        renderCoursesSection();
        showToast('Curso desasignado del nivel', 'success');
    }
}

function removeTeacherFromLevel(levelId, teacherId) {
    const key = String(teacherId);
    state.teacherLevels[key] = (state.teacherLevels[key] || []).filter(lid => String(lid) !== String(levelId));
    const byLevel = (state.teacherGrades || {})[key] || {};
    if (byLevel[String(levelId)]) delete byLevel[String(levelId)];
    state.teacherGrades[key] = byLevel;
    saveLevelsState();
    openLevelAssignmentsModal(levelId);
    renderCoursesSection();
    showToast('Docente desasignado del nivel', 'success');
}

window.changeLevelsSummaryPage = changeLevelsSummaryPage;
window.toggleCourseCreateGrade = toggleCourseCreateGrade;
window.toggleCourseGradeMenu = toggleCourseGradeMenu;
window.toggleAssignTeacherGrade = toggleAssignTeacherGrade;
window.toggleAssignTeacherGradeMenu = toggleAssignTeacherGradeMenu;
window.openEditLevelModal = openEditLevelModal;
window.saveEditedLevel = saveEditedLevel;
window.openDeleteLevelModal = openDeleteLevelModal;
window.confirmDeleteLevel = confirmDeleteLevel;
window.openLevelAssignmentsModal = openLevelAssignmentsModal;
window.removeGradeFromLevel = removeGradeFromLevel;
window.removeCourseFromLevel = removeCourseFromLevel;
window.removeTeacherFromLevel = removeTeacherFromLevel;
window.toggleRuleActive = toggleRuleActive;
window.deleteRule = deleteRule;

function createAcademicLevel() {
    const name = (document.getElementById('levelName').value || '').trim();
    const description = (document.getElementById('levelDescription').value || '').trim();
    if (!name) return showToast('Ingresa el nombre del nivel', 'error');
    if (state.academicLevels.some(l => (l.name || '').toLowerCase() === name.toLowerCase())) return showToast('Ese nivel ya existe', 'error');
    state.academicLevels.push({ id: 'lvl-' + Date.now(), name, description });
    saveLevelsState();
    document.getElementById('levelName').value = '';
    document.getElementById('levelDescription').value = '';
    renderCoursesSection();
    showToast('Nivel académico creado', 'success');
}

function createAcademicGrade() {
    const levelId = ((document.getElementById('gradeLevel') || {}).value || '').trim();
    const raw = ((document.getElementById('gradeName') || {}).value || '').trim();
    if (!levelId || !raw) return showToast('Selecciona nivel y nombre del grado', 'error');
    const incoming = raw.split(',').map(x => x.trim()).filter(Boolean);
    if (!incoming.length) return showToast('Ingresa al menos un grado válido', 'error');
    let created = 0;
    incoming.forEach(name => {
        const exists = (state.academicGrades || []).some(g => String(g.levelId) === String(levelId) && (g.name || '').toLowerCase() === name.toLowerCase());
        if (!exists) {
            state.academicGrades.push({ id: 'gr-' + Date.now() + '-' + Math.floor(Math.random() * 999), levelId: String(levelId), name });
            created++;
        }
    });
    if (!created) return showToast('Todos los grados ingresados ya existen en ese nivel', 'error');
    saveLevelsState();
    const gradeNameEl = document.getElementById('gradeName');
    if (gradeNameEl) gradeNameEl.value = '';
    renderCoursesSection();
    showToast(`Se crearon ${created} grado(s)`, 'success');
}

function assignCourseToLevel() {
    const levelId = (document.getElementById('assignCourseLevel').value || '').trim();
    const selectedIds = Object.keys(modalState.courseLevel.selectedCourses || {}).filter(k => modalState.courseLevel.selectedCourses[k]);
    if (!levelId || !selectedIds.length) return showToast('Selecciona nivel y al menos un curso', 'error');
    selectedIds.forEach(courseId => {
        state.courseLevels[String(courseId)] = String(levelId);
    });
    saveLevelsState();
    renderLevelsTable();
    showToast('Cursos asignados al nivel', 'success');
}

function assignTeacherToLevel() {
    const levelId = (document.getElementById('assignTeacherLevel').value || '').trim();
    const teacherId = (document.getElementById('assignLevelTeacher').value || '').trim();
    const gradeIds = (modalState.teacherAssign.gradeIds || []).map(String).filter(Boolean);
    if (!levelId || !teacherId) return showToast('Selecciona nivel y docente', 'error');
    if (!gradeIds.length) return showToast('Selecciona al menos un grado para el docente', 'error');
    const key = String(teacherId);
    const list = state.teacherLevels[key] || [];
    if (!list.includes(String(levelId))) list.push(String(levelId));
    state.teacherLevels[key] = list;
    const byLevel = state.teacherGrades[key] || {};
    byLevel[String(levelId)] = gradeIds;
    state.teacherGrades[key] = byLevel;
    saveLevelsState();
    modalState.teacherAssign.menuOpen = false;
    const host = document.getElementById('assignTeacherGradeMulti');
    if (host) host.classList.remove('open');
    renderLevelsTable();
    renderCoursesSection();
    showToast('Docente asignado al nivel y grados', 'success');
}

function openStudentCourseModal() {
    modalState.studentCourse.levelId = modalState.studentCourse.levelId || (state.academicLevels[0] ? String(state.academicLevels[0].id) : '');
    modalState.studentCourse.gradeIds = [];
    modalState.studentCourse.pageStudents = 1;
    modalState.studentCourse.pageCourses = 1;
    modalState.studentCourse.gradePage = 1;
    modalState.studentCourse.selectedStudents = {};
    modalState.studentCourse.selectedCourses = {};
    openModal('Asignar estudiantes a cursos', `
        <div class="alert alert-info" style="margin-bottom:10px">Paso 1: selecciona estudiantes. Paso 2: selecciona nivel y cursos (puedes marcar todos o uno por uno). Luego pulsa asignar.</div>
        <div id="studentCourseWizard"></div>
    `);
    setAdminModalSize('xxl');
    renderStudentCourseWizard();
}

function getPagedItems(items, page, pageSize) {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    return {
        totalPages,
        safePage,
        chunk: items.slice((safePage - 1) * pageSize, safePage * pageSize)
    };
}

function renderStudentCourseWizard() {
    const host = document.getElementById('studentCourseWizard');
    if (!host) return;
    const s = modalState.studentCourse;
    const gradePool = getGradesByLevel(s.levelId);
    const pagedGrades = getPagedItems(gradePool, s.gradePage, s.gradePageSize);
    const activeGradeIds = (s.gradeIds || []).map(String);
    const gradeCards = pagedGrades.chunk.map(g => `<label class="card-check"><input type="checkbox" ${activeGradeIds.includes(String(g.id)) ? 'checked' : ''} onchange="toggleStudentCourseGrade('${g.id}',this.checked)"><span>${escapeHtml(g.name)}</span></label>`).join('');
    const availableCourses = state.courses.filter(c => {
        const cid = String(c.id);
        const inLevel = String(state.courseLevels[cid] || '') === String(s.levelId);
        if (!inLevel) return false;
        if (!activeGradeIds.length) return true;
        const courseGrades = getCourseGradeIds(cid);
        return activeGradeIds.some(gid => courseGrades.includes(String(gid)));
    });
    const studentFiltered = state.students.filter(st => userNameFrom(st).toLowerCase().includes((s.queryStudent || '').toLowerCase()));
    const courseFiltered = availableCourses.filter(c => (c.name || '').toLowerCase().includes((s.queryCourse || '').toLowerCase()));
    const pagedStudents = getPagedItems(studentFiltered, s.pageStudents, s.pageSize);
    const pagedCourses = getPagedItems(courseFiltered, s.pageCourses, s.pageSize);

    host.innerHTML = `
        <div class="assign-grid">
            <div class="assign-col">
                <div class="assign-head">Estudiantes</div>
                <input class="form-input" placeholder="Buscar estudiante..." value="${escapeHtml(s.queryStudent)}" oninput="setStudentCourseQuery('student',this.value)">
                <div class="card-list">${pagedStudents.chunk.map(st => `<label class="card-check"><input type="checkbox" ${s.selectedStudents[String(st.id)] ? 'checked' : ''} onchange="toggleStudentPick('${st.id}',this.checked)"><span>${escapeHtml(userNameFrom(st))}</span></label>`).join('') || '<div class="muted">Sin estudiantes</div>'}</div>
                <div class="pager"><button class="btn btn-sm btn-outline" ${pagedStudents.safePage===1?'disabled':''} onclick="changeStudentCoursePage('student',-1)">Anterior</button><span> ${pagedStudents.safePage}/${pagedStudents.totalPages} </span><button class="btn btn-sm btn-outline" ${pagedStudents.safePage===pagedStudents.totalPages?'disabled':''} onclick="changeStudentCoursePage('student',1)">Siguiente</button></div>
            </div>
            <div class="assign-col">
                <div class="assign-head">Cursos por nivel/grado</div>
                <div class="form-group" style="margin-bottom:8px">
                    <label class="form-label" style="font-size:12px">Nivel académico</label>
                    <select class="form-input" onchange="setStudentCourseLevel(this.value)">
                        ${state.academicLevels.map(l => `<option value="${l.id}" ${String(s.levelId)===String(l.id)?'selected':''}>${escapeHtml(l.name)}</option>`).join('')}
                    </select>
                </div>
                <div class="card-list" style="margin-bottom:8px">${gradeCards || '<div class="muted">Sin grados en este nivel</div>'}</div>
                <div class="pager" style="margin-top:-2px;margin-bottom:8px"><button class="btn btn-sm btn-outline" ${pagedGrades.safePage===1?'disabled':''} onclick="changeStudentGradePage(-1)">Anterior grados</button><span>${pagedGrades.safePage}/${pagedGrades.totalPages}</span><button class="btn btn-sm btn-outline" ${pagedGrades.safePage===pagedGrades.totalPages?'disabled':''} onclick="changeStudentGradePage(1)">Siguiente grados</button></div>
                <input class="form-input" placeholder="Buscar curso..." value="${escapeHtml(s.queryCourse)}" oninput="setStudentCourseQuery('course',this.value)">
                <div style="display:flex;justify-content:space-between;align-items:center;margin:8px 0"><span class="muted">Filtro activo: ${(state.academicLevels.find(l=>String(l.id)===String(s.levelId))||{}).name || 'Nivel'} / ${activeGradeIds.length ? `${activeGradeIds.length} grado(s)` : 'Todos los grados'}</span><button class="btn btn-sm btn-outline" onclick="toggleAllVisibleCourses(${pagedCourses.chunk.length?1:0})">Marcar todos visibles</button></div>
                <div class="card-list">${pagedCourses.chunk.map(c => `<label class="card-check"><input type="checkbox" ${s.selectedCourses[String(c.id)] ? 'checked' : ''} onchange="toggleCoursePick('${c.id}',this.checked)"><span>${escapeHtml(c.name || '')}</span></label>`).join('') || '<div class="muted">No hay cursos en este nivel</div>'}</div>
                <div class="pager"><button class="btn btn-sm btn-outline" ${pagedCourses.safePage===1?'disabled':''} onclick="changeStudentCoursePage('course',-1)">Anterior</button><span> ${pagedCourses.safePage}/${pagedCourses.totalPages} </span><button class="btn btn-sm btn-outline" ${pagedCourses.safePage===pagedCourses.totalPages?'disabled':''} onclick="changeStudentCoursePage('course',1)">Siguiente</button></div>
            </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn btn-outline" onclick="closeModal()">Cancelar</button><button class="btn btn-teal" onclick="applyStudentCourseAssignment()">Asignar seleccionados</button></div>
    `;
}

function changeStudentGradePage(delta) {
    modalState.studentCourse.gradePage = Math.max(1, (modalState.studentCourse.gradePage || 1) + delta);
    renderStudentCourseWizard();
}

function setStudentCourseLevel(levelId) {
    modalState.studentCourse.levelId = String(levelId);
    modalState.studentCourse.gradeIds = [];
    modalState.studentCourse.gradePage = 1;
    modalState.studentCourse.pageCourses = 1;
    modalState.studentCourse.selectedCourses = {};
    renderStudentCourseWizard();
}

function toggleStudentCourseGrade(gradeId, checked) {
    const id = String(gradeId);
    const arr = modalState.studentCourse.gradeIds || [];
    if (checked && !arr.includes(id)) arr.push(id);
    if (!checked) modalState.studentCourse.gradeIds = arr.filter(g => g !== id);
    modalState.studentCourse.pageCourses = 1;
    modalState.studentCourse.selectedCourses = {};
    renderStudentCourseWizard();
}
function setStudentCourseQuery(kind, value) {
    if (kind === 'student') {
        modalState.studentCourse.queryStudent = value || '';
        modalState.studentCourse.pageStudents = 1;
    } else {
        modalState.studentCourse.queryCourse = value || '';
        modalState.studentCourse.pageCourses = 1;
    }
    renderStudentCourseWizard();
}
function changeStudentCoursePage(kind, delta) {
    if (kind === 'student') modalState.studentCourse.pageStudents = Math.max(1, (modalState.studentCourse.pageStudents || 1) + delta);
    else modalState.studentCourse.pageCourses = Math.max(1, (modalState.studentCourse.pageCourses || 1) + delta);
    renderStudentCourseWizard();
}
function toggleStudentPick(id, checked) { modalState.studentCourse.selectedStudents[String(id)] = !!checked; }
function toggleCoursePick(id, checked) { modalState.studentCourse.selectedCourses[String(id)] = !!checked; }
function toggleAllVisibleCourses(enable) {
    const s = modalState.studentCourse;
    const availableCourses = state.courses.filter(c => {
        const cid = String(c.id);
        const inLevel = String(state.courseLevels[cid] || '') === String(s.levelId);
        if (!inLevel) return false;
        const activeGradeIds = (s.gradeIds || []).map(String);
        if (!activeGradeIds.length) return true;
        const courseGrades = getCourseGradeIds(cid);
        return activeGradeIds.some(gid => courseGrades.includes(String(gid)));
    });
    const courseFiltered = availableCourses.filter(c => (c.name || '').toLowerCase().includes((s.queryCourse || '').toLowerCase()));
    const pagedCourses = getPagedItems(courseFiltered, s.pageCourses, s.pageSize);
    pagedCourses.chunk.forEach(c => { s.selectedCourses[String(c.id)] = !!enable; });
    renderStudentCourseWizard();
}

async function applyStudentCourseAssignment() {
    const studentIds = Object.keys(modalState.studentCourse.selectedStudents).filter(k => modalState.studentCourse.selectedStudents[k]);
    const courseIds = Object.keys(modalState.studentCourse.selectedCourses).filter(k => modalState.studentCourse.selectedCourses[k]);
    if (!studentIds.length || !courseIds.length) return showToast('Selecciona al menos un estudiante y un curso.', 'error');
    for (const sid of studentIds) {
        for (const cid of courseIds) {
            const exists = state.enrollments.some(e => String((e.student || {}).id) === String(sid) && String((e.course || {}).id) === String(cid));
            if (exists) continue;
            try {
                const saved = await api('/api/enrollments', {
                    method: 'POST',
                    headers: headers(),
                    body: JSON.stringify({ courseId: parseInt(cid, 10), studentId: parseInt(sid, 10), enrollmentDate: new Date().toISOString() })
                });
                state.enrollments.push(saved);
            } catch (e) {
                state.enrollments.push({
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    course: state.courses.find(c => String(c.id) === String(cid)) || { id: parseInt(cid, 10) },
                    student: state.students.find(st => String(st.id) === String(sid)) || { id: parseInt(sid, 10) }
                });
            }
        }
    }
    closeModal();
    renderEnrollmentsTable();
    showToast('Asignación masiva completada', 'success');
}

function openCourseLevelModal() {
    const levelId = (document.getElementById('assignCourseLevel') || {}).value || '';
    modalState.courseLevel.levelId = String(levelId || (state.academicLevels[0] ? state.academicLevels[0].id : ''));
    modalState.courseLevel.pageCourses = 1;
    modalState.courseLevel.levelPage = 1;
    modalState.courseLevel.queryCourse = '';
    modalState.courseLevel.selectedCourses = {};
    openModal('Asignar cursos a nivel', `<div class="alert alert-info" style="margin-bottom:10px">Selecciona un nivel y marca los cursos que deseas vincular.</div><div id="courseLevelWizard"></div>`);
    setAdminModalSize('xxl');
    renderCourseLevelWizard();
}

function renderCourseLevelWizard() {
    const host = document.getElementById('courseLevelWizard');
    if (!host) return;
    const s = modalState.courseLevel;
    const pagedLevels = getPagedItems(state.academicLevels, s.levelPage, s.levelPageSize);
    const levelCards = pagedLevels.chunk.map(l => `<button class="btn btn-sm ${String(s.levelId) === String(l.id) ? 'btn-teal' : 'btn-outline'}" onclick="setCourseLevelTarget('${l.id}')">${escapeHtml(l.name)}</button>`).join('');
    const filtered = state.courses.filter(c => (c.name || '').toLowerCase().includes((s.queryCourse || '').toLowerCase()));
    const paged = getPagedItems(filtered, s.pageCourses, s.pageSize);
    host.innerHTML = `
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${levelCards || '<span class="muted">Sin niveles</span>'}</div>
        <div class="pager" style="margin-top:-2px;margin-bottom:8px"><button class="btn btn-sm btn-outline" ${pagedLevels.safePage===1?'disabled':''} onclick="changeCourseLevelLevelPage(-1)">Anterior niveles</button><span>${pagedLevels.safePage}/${pagedLevels.totalPages}</span><button class="btn btn-sm btn-outline" ${pagedLevels.safePage===pagedLevels.totalPages?'disabled':''} onclick="changeCourseLevelLevelPage(1)">Siguiente niveles</button></div>
        <input class="form-input" placeholder="Buscar curso..." value="${escapeHtml(s.queryCourse)}" oninput="setCourseLevelQuery(this.value)">
        <div class="card-list" style="margin-top:10px">${paged.chunk.map(c => `<label class="card-check"><input type="checkbox" ${s.selectedCourses[String(c.id)] ? 'checked' : ''} onchange="toggleCourseLevelPick('${c.id}',this.checked)"><span>${escapeHtml(c.name || '')}</span></label>`).join('') || '<div class="muted">Sin cursos</div>'}</div>
        <div class="pager"><button class="btn btn-sm btn-outline" ${paged.safePage===1?'disabled':''} onclick="changeCourseLevelPage(-1)">Anterior</button><span> ${paged.safePage}/${paged.totalPages} </span><button class="btn btn-sm btn-outline" ${paged.safePage===paged.totalPages?'disabled':''} onclick="changeCourseLevelPage(1)">Siguiente</button></div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn btn-outline" onclick="closeModal()">Cancelar</button><button class="btn btn-teal" onclick="applyCourseLevelAssignment()">Asignar cursos al nivel</button></div>
    `;
}

function setCourseLevelTarget(levelId) { modalState.courseLevel.levelId = String(levelId); renderCourseLevelWizard(); }
function setCourseLevelQuery(value) { modalState.courseLevel.queryCourse = value || ''; modalState.courseLevel.pageCourses = 1; renderCourseLevelWizard(); }
function changeCourseLevelPage(delta) { modalState.courseLevel.pageCourses = Math.max(1, (modalState.courseLevel.pageCourses || 1) + delta); renderCourseLevelWizard(); }
function toggleCourseLevelPick(id, checked) { modalState.courseLevel.selectedCourses[String(id)] = !!checked; }

function changeCourseLevelLevelPage(delta) {
    modalState.courseLevel.levelPage = Math.max(1, (modalState.courseLevel.levelPage || 1) + delta);
    renderCourseLevelWizard();
}

function applyCourseLevelAssignment() {
    modalState.courseLevel.selectedCourses = modalState.courseLevel.selectedCourses || {};
    assignCourseToLevel();
    saveLevelsState();
    closeModal();
    renderCoursesSection();
}

window.setStudentCourseLevel = setStudentCourseLevel;
window.setStudentCourseQuery = setStudentCourseQuery;
window.changeStudentCoursePage = changeStudentCoursePage;
window.toggleStudentPick = toggleStudentPick;
window.toggleCoursePick = toggleCoursePick;
window.toggleAllVisibleCourses = toggleAllVisibleCourses;
window.applyStudentCourseAssignment = applyStudentCourseAssignment;
window.changeStudentGradePage = changeStudentGradePage;
window.toggleStudentCourseGrade = toggleStudentCourseGrade;
window.setCourseLevelTarget = setCourseLevelTarget;
window.setCourseLevelQuery = setCourseLevelQuery;
window.changeCourseLevelPage = changeCourseLevelPage;
window.changeCourseLevelLevelPage = changeCourseLevelLevelPage;
window.toggleCourseLevelPick = toggleCourseLevelPick;
window.applyCourseLevelAssignment = applyCourseLevelAssignment;

function renderEnrollmentsTable() {
    const levelById = Object.fromEntries((state.academicLevels || []).map(l => [String(l.id), l]));
    const countByCourse = {};
    (state.enrollments || []).forEach(e => {
        const cid = String((e.course || {}).id || '');
        if (!cid) return;
        countByCourse[cid] = (countByCourse[cid] || 0) + 1;
    });

    const summary = (state.courses || []).map(c => {
        const courseId = String(c.id);
        const levelId = String(state.courseLevels[courseId] || '');
        const level = levelById[levelId];
        const validGradeIds = getCourseGradeIds(courseId).filter(gid => (state.academicGrades || []).some(g => String(g.id) === String(gid)));
        return {
            courseName: c.name || 'Curso',
            teacherName: userNameFrom(c.teacher || {}),
            levelName: level ? level.name : 'Sin nivel',
            gradeName: getGradeNameByCourseId(courseId),
            capacity: parseInt(state.courseCapacity[courseId] || 0, 10) || 0,
            totalStudents: countByCourse[courseId] || 0,
            isValid: !!level && validGradeIds.length > 0
        };
    }).filter(r => r.isValid).sort((a, b) => b.totalStudents - a.totalStudents || a.courseName.localeCompare(b.courseName));

    const pageSize = modalState.enrollmentSummary.pageSize;
    const totalPages = Math.max(1, Math.ceil(summary.length / pageSize));
    modalState.enrollmentSummary.page = Math.min(Math.max(1, modalState.enrollmentSummary.page), totalPages);
    const page = modalState.enrollmentSummary.page;
    const chunk = summary.slice((page - 1) * pageSize, page * pageSize);

    const rows = chunk.map(r => `<tr>
        <td><span class="cell-ellipsis" title="${escapeHtml(r.courseName)}">${escapeHtml(r.courseName)}</span></td>
        <td><span class="cell-ellipsis" title="${escapeHtml(r.levelName)}">${escapeHtml(r.levelName)}</span></td>
        <td><span class="cell-ellipsis" title="${escapeHtml(r.gradeName)}">${escapeHtml(r.gradeName)}</span></td>
        <td><span class="cell-ellipsis" title="${escapeHtml(r.teacherName)}">${escapeHtml(r.teacherName)}</span></td>
        <td>${r.totalStudents}${r.capacity ? ` / ${r.capacity}` : ''}</td>
    </tr>`).join('');

    document.getElementById('courseEnrollmentList').innerHTML = `
        <table class="simple-table">
            <thead><tr><th>Curso</th><th>Nivel</th><th>Grado</th><th>Docente</th><th>Cupo ocupado</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="5" class="muted">Sin asignaciones</td></tr>'}</tbody>
        </table>
        <div class="pager" style="margin-top:10px">
            <span>Resumen de matrículas · Página ${page} de ${totalPages}</span>
            <div style="display:flex;gap:6px">
                <button class="btn btn-sm btn-outline" ${page===1?'disabled':''} onclick="changeEnrollmentSummaryPage(-1)">Anterior</button>
                <button class="btn btn-sm btn-outline" ${page===totalPages?'disabled':''} onclick="changeEnrollmentSummaryPage(1)">Siguiente</button>
            </div>
        </div>
    `;
}

function changeEnrollmentSummaryPage(delta) {
    modalState.enrollmentSummary.page = Math.max(1, (modalState.enrollmentSummary.page || 1) + delta);
    renderEnrollmentsTable();
}
window.changeEnrollmentSummaryPage = changeEnrollmentSummaryPage;

async function createCourse() {
    const name = document.getElementById('courseName').value.trim();
    const description = document.getElementById('courseDescription').value.trim();
    const teacherId = parseInt(document.getElementById('courseTeacher').value || '0', 10);
    const levelId = (document.getElementById('courseLevel').value || '').trim();
    const gradeIds = (modalState.courseCreate.gradeIds || []).map(String).filter(Boolean);
    const capacity = Math.max(1, parseInt(document.getElementById('courseCapacity').value || '35', 10) || 35);
    if (!name || !teacherId) return showToast('Completa nombre y docente', 'error');
    if (!levelId || !gradeIds.length) return showToast('Selecciona nivel y al menos un grado', 'error');
    try {
        const saved = await api('/api/courses', { method: 'POST', headers: headers(), body: JSON.stringify({ name, description, teacherId }) });
        state.courses.push(saved);
        if (levelId) state.courseLevels[String(saved.id)] = String(levelId);
        setCourseGradeIds(String(saved.id), gradeIds);
        state.courseCapacity[String(saved.id)] = capacity;
        saveLevelsState();
        renderCoursesSection();
        renderOverview();
        showToast('Curso creado', 'success');
        document.getElementById('courseName').value = '';
        document.getElementById('courseDescription').value = '';
        modalState.courseCreate.gradeIds = [];
        renderCourseGradeOptions();
        const capacityEl = document.getElementById('courseCapacity');
        if (capacityEl) capacityEl.value = '35';
    } catch (e) {
        showToast('No se pudo crear el curso', 'error');
    }
}

async function enrollStudent() {
    openStudentCourseModal();
}

function renderRolesSection() {
    const ui = state.ui || {};
    const rolesFiltered = (state.roles || []).filter(r => !ui.rolesSearch || normalizedIncludes(r.name, ui.rolesSearch));
    const rolesPage = paginateItems(rolesFiltered, ui.rolesPage, ui.rolesPageSize);
    ui.rolesPage = rolesPage.page;
    document.getElementById('rolesList').innerHTML = rolesPage.items.map(r => `<div class="guide-item"><strong>${escapeHtml(r.name || '')}</strong></div>`).join('') || '<div class="muted">Sin roles</div>';
    setPagerInfo('rolesPageInfo', rolesPage.page, rolesPage.totalPages);

    const permRolesFiltered = (state.roles || []).filter(r => !ui.permRoleSearch || normalizedIncludes(r.name, ui.permRoleSearch));
    const permRolesPage = paginateItems(permRolesFiltered, ui.permRolePage, ui.permRolePageSize);
    ui.permRolePage = permRolesPage.page;
    fillPagedSelect('permRole', permRolesPage.items, r => `<option value="${r.id}">${escapeHtml(r.name || '')}</option>`, 'Selecciona rol', true);
    setPagerInfo('permRolePageInfo', permRolesPage.page, permRolesPage.totalPages);

    const permUsersFiltered = (state.users || []).filter(u => {
        if (!ui.permUserSearch) return true;
        return normalizedIncludes(u.name, ui.permUserSearch) || normalizedIncludes(u.email, ui.permUserSearch);
    });
    const permUsersPage = paginateItems(permUsersFiltered, ui.permUserPage, ui.permUserPageSize);
    ui.permUserPage = permUsersPage.page;
    fillPagedSelect('permUser', permUsersPage.items, u => `<option value="${u.id}">${escapeHtml(u.name || '')} (${escapeHtml(u.email || '')})</option>`, 'Selecciona usuario', true);
    setPagerInfo('permUserPageInfo', permUsersPage.page, permUsersPage.totalPages);

    renderPermissionChecklist('permissionsChecklist', getRolePerms(), 'roleperm');
    renderPermissionChecklist('userPermissionsChecklist', getUserPerms(), 'userperm');
}

function getRolePerms() {
    const roleSelect = document.getElementById('permRole');
    const roleId = roleSelect ? roleSelect.value : '';
    return state.rolePerms[String(roleId)] || [];
}

function getUserPerms() {
    const userSelect = document.getElementById('permUser');
    const userId = userSelect ? userSelect.value : '';
    return state.userPerms[String(userId)] || [];
}

function renderPermissionChecklist(containerId, selected, prefix) {
    const set = new Set(selected || []);
    document.getElementById(containerId).innerHTML = PERMISSIONS.map(p => `
        <label class="perm-item">
            <input type="checkbox" data-perm="${p}" id="${prefix}-${p}" ${set.has(p) ? 'checked' : ''}>
            <span>${PERMISSION_LABELS[p] || p}</span>
        </label>
    `).join('');
}

function saveRolePerms() {
    const roleId = document.getElementById('permRole').value;
    if (!roleId) return showToast('Selecciona un rol', 'error');
    const selected = Array.from(document.querySelectorAll('#permissionsChecklist input[type="checkbox"]:checked')).map(i => i.dataset.perm);
    state.rolePerms[String(roleId)] = selected;
    saveStorage(STORAGE_KEYS.rolePerms, state.rolePerms);
    showToast('Permisos de rol guardados', 'success');
}

function saveUserPerms() {
    const userId = document.getElementById('permUser').value;
    if (!userId) return showToast('Selecciona un usuario', 'error');
    const selected = Array.from(document.querySelectorAll('#userPermissionsChecklist input[type="checkbox"]:checked')).map(i => i.dataset.perm);
    state.userPerms[String(userId)] = selected;
    saveStorage(STORAGE_KEYS.userPerms, state.userPerms);
    showToast('Permisos de usuario guardados', 'success');
}

async function createRole() {
    const name = document.getElementById('roleName').value.trim();
    if (!name) return showToast('Ingresa el nombre del rol', 'error');
    try {
        const saved = await api('/api/roles', { method: 'POST', headers: headers(), body: JSON.stringify({ name }) });
        state.roles.push(saved);
        document.getElementById('roleName').value = '';
        renderRolesSection();
        showToast('Rol creado', 'success');
    } catch (e) {
        showToast('No se pudo crear el rol', 'error');
    }
}

function renderCertificatesSection() {
    fillSelect('certStudent', state.students, s => `<option value="${s.id}">${escapeHtml(userNameFrom(s))}</option>`, 'Selecciona estudiante');
    const rows = state.certificates.map(c => `<tr>
        <td>${escapeHtml(c.name || '')}</td>
        <td>${escapeHtml(userNameFrom(c.student || {}))}</td>
        <td>${escapeHtml(c.filePath || '')}</td>
        <td><button class="btn btn-sm btn-outline" onclick="deleteCertificate(${c.id})">Eliminar</button></td>
    </tr>`).join('');
    document.getElementById('certificatesTable').innerHTML = `<table class="simple-table"><thead><tr><th>Nombre</th><th>Estudiante</th><th>Archivo</th><th>Accion</th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="muted">Sin certificados</td></tr>'}</tbody></table>`;
}

async function createCertificate() {
    const studentId = parseInt(document.getElementById('certStudent').value || '0', 10);
    const name = document.getElementById('certName').value.trim();
    const fileInput = document.getElementById('certFileInput');
    const file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
    if (!studentId || !name || !file) return showToast('Completa todos los datos y selecciona archivo', 'error');

    const filePath = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
    });
    if (!filePath) return showToast('No se pudo leer el archivo', 'error');

    try {
        const saved = await api('/api/certificates', { method: 'POST', headers: headers(), body: JSON.stringify({ studentId, name, filePath }) });
        state.certificates.push(saved);
        renderCertificatesSection();
        renderOverview();
        showToast('Certificado generado', 'success');
        if (fileInput) fileInput.value = '';
    } catch (e) {
        const localCert = {
            id: Date.now(),
            name,
            filePath,
            student: state.students.find(s => s.id === studentId) || { id: studentId }
        };
        state.certificates.push(localCert);
        renderCertificatesSection();
        renderOverview();
        showToast('Certificado guardado localmente (sin sincronizar API)', 'warning');
        if (fileInput) fileInput.value = '';
    }
}

async function deleteCertificate(id) {
    try {
        await api('/api/certificates/' + id, { method: 'DELETE', headers: headers(false) });
    } catch (e) {
        // si falla backend, se intenta igual remover del estado local
    }
    state.certificates = state.certificates.filter(c => c.id !== id);
    renderCertificatesSection();
    renderOverview();
    showToast('Certificado eliminado', 'success');
}
window.deleteCertificate = deleteCertificate;

function renderGuidesSection() {
    document.getElementById('guidesList').innerHTML = state.guides.map(g => `
        <div class="guide-item">
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
                <div>
                    <div><strong>${escapeHtml(g.title)}</strong></div>
                    <div class="muted">${escapeHtml(g.detail || '')}</div>
                    <div class="muted">Modo: ${g.hasText ? 'Texto' : ''}${g.hasText && g.hasPdf ? ' y ' : ''}${g.hasPdf ? 'PDF' : ''}</div>
                </div>
                <div style="display:flex;gap:6px">
                    <button class="btn btn-sm btn-outline" onclick="editGuide('${g.id}')">Editar</button>
                    <button class="btn btn-sm btn-outline" onclick="removeGuide('${g.id}')">Eliminar</button>
                </div>
            </div>
        </div>
    `).join('') || '<div class="muted">No hay instructivos configurados</div>';
}

function openGuideForm(existingId) {
    const guide = state.guides.find(g => g.id === existingId) || {
        id: 'ins-' + Date.now(), title: '', detail: '', hasText: true, hasPdf: false, pdfUrl: '', textSections: [{ heading: '', paragraphs: [], bullets: [] }]
    };
    const sec = guide.textSections && guide.textSections[0] ? guide.textSections[0] : { heading: '', paragraphs: [], bullets: [] };
    openModal('Instructivo', `
        <div class="form-group"><label class="form-label">Titulo</label><input id="g-title" class="form-input" value="${escapeHtml(guide.title)}"></div>
        <div class="form-group"><label class="form-label">Descripcion corta</label><input id="g-detail" class="form-input" value="${escapeHtml(guide.detail || '')}"></div>
        <div class="form-row">
            <div class="form-group"><label class="form-label">Tiene texto</label><select id="g-text" class="form-input"><option value="true" ${guide.hasText ? 'selected' : ''}>Si</option><option value="false" ${!guide.hasText ? 'selected' : ''}>No</option></select></div>
            <div class="form-group"><label class="form-label">Tiene PDF</label><select id="g-pdf" class="form-input"><option value="true" ${guide.hasPdf ? 'selected' : ''}>Si</option><option value="false" ${!guide.hasPdf ? 'selected' : ''}>No</option></select></div>
        </div>
        <div class="form-group"><label class="form-label">URL PDF</label><input id="g-pdf-url" class="form-input" value="${escapeHtml(guide.pdfUrl || '')}" placeholder="/docs/archivo.pdf"></div>
        <div class="form-group"><label class="form-label">Titulo seccion principal</label><input id="g-head" class="form-input" value="${escapeHtml(sec.heading || '')}"></div>
        <div class="form-group"><label class="form-label">Parrafos (una linea por parrafo)</label><textarea id="g-par" class="form-input" style="min-height:80px">${escapeHtml((sec.paragraphs || []).join('\n'))}</textarea></div>
        <div class="form-group"><label class="form-label">Bullets (una linea por item)</label><textarea id="g-bul" class="form-input" style="min-height:80px">${escapeHtml((sec.bullets || []).join('\n'))}</textarea></div>
        <button class="btn btn-teal" onclick="saveGuide('${guide.id}')">Guardar instructivo</button>
    `);
}

function saveGuide(id) {
    const g = {
        id,
        title: document.getElementById('g-title').value.trim(),
        detail: document.getElementById('g-detail').value.trim(),
        hasText: document.getElementById('g-text').value === 'true',
        hasPdf: document.getElementById('g-pdf').value === 'true',
        pdfUrl: document.getElementById('g-pdf-url').value.trim(),
        textSections: [{
            heading: document.getElementById('g-head').value.trim(),
            paragraphs: document.getElementById('g-par').value.split(/\r?\n/).map(x => x.trim()).filter(Boolean),
            bullets: document.getElementById('g-bul').value.split(/\r?\n/).map(x => x.trim()).filter(Boolean)
        }]
    };
    if (!g.title) return showToast('El titulo es obligatorio', 'error');
    const idx = state.guides.findIndex(x => x.id === id);
    if (idx >= 0) state.guides[idx] = g;
    else state.guides.push(g);
    saveStorage(STORAGE_KEYS.guides, state.guides);
    closeModal();
    renderGuidesSection();
    showToast('Instructivo guardado', 'success');
}

function removeGuide(id) {
    state.guides = state.guides.filter(g => g.id !== id);
    saveStorage(STORAGE_KEYS.guides, state.guides);
    renderGuidesSection();
    showToast('Instructivo eliminado', 'success');
}

window.editGuide = openGuideForm;
window.removeGuide = removeGuide;
window.saveGuide = saveGuide;

function renderFormsSection() {
    const type = document.getElementById('formType').value;
    const questions = state.forms[type] || [];
    document.getElementById('questionsList').innerHTML = questions.map(q => `
        <div class="question-item">
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
                <div>
                    <div><strong>${escapeHtml(q.label)}</strong> <span class="muted">(${q.type})</span></div>
                    <div>${escapeHtml(q.text)}</div>
                    ${q.options && q.options.length ? '<div class="muted">Opciones: ' + escapeHtml(q.options.join(', ')) + '</div>' : ''}
                </div>
                <div style="display:flex;gap:6px">
                    <button class="btn btn-sm btn-outline" onclick="editQuestion('${type}','${q.id}')">Editar</button>
                    <button class="btn btn-sm btn-outline" onclick="removeQuestion('${type}','${q.id}')">Eliminar</button>
                </div>
            </div>
        </div>
    `).join('') || '<div class="muted">Sin preguntas configuradas</div>';

    renderResponses(type);
}

function openQuestionForm(type, qid) {
    const q = (state.forms[type] || []).find(x => x.id === qid) || {
        id: type + '-' + Date.now(),
        type: 'rating5',
        label: '',
        text: '',
        required: true,
        options: []
    };
    openModal('Pregunta', `
        <div class="form-row">
            <div class="form-group"><label class="form-label">Etiqueta corta</label><input id="q-label" class="form-input" value="${escapeHtml(q.label)}"></div>
            <div class="form-group"><label class="form-label">Tipo</label><select id="q-type" class="form-input">
                <option value="binary" ${q.type === 'binary' ? 'selected' : ''}>Si/No</option>
                <option value="rating5" ${q.type === 'rating5' ? 'selected' : ''}>Calificacion 1-5</option>
                <option value="rating10" ${q.type === 'rating10' ? 'selected' : ''}>Calificacion 0-10</option>
                <option value="multiselect" ${q.type === 'multiselect' ? 'selected' : ''}>Seleccion multiple</option>
                <option value="open" ${q.type === 'open' ? 'selected' : ''}>Respuesta abierta</option>
            </select></div>
        </div>
        <div class="form-group"><label class="form-label">Texto de la pregunta</label><textarea id="q-text" class="form-input" style="min-height:80px">${escapeHtml(q.text)}</textarea></div>
        <div class="form-group"><label class="form-label">Opciones para seleccion multiple (una por linea)</label><textarea id="q-options" class="form-input" style="min-height:80px">${escapeHtml((q.options || []).join('\n'))}</textarea></div>
        <div class="form-group"><label class="form-label">Obligatoria</label><select id="q-req" class="form-input"><option value="true" ${q.required !== false ? 'selected' : ''}>Si</option><option value="false" ${q.required === false ? 'selected' : ''}>No</option></select></div>
        <button class="btn btn-teal" onclick="saveQuestion('${type}','${q.id}')">Guardar pregunta</button>
    `);
}

function saveQuestion(type, qid) {
    const payload = {
        id: qid,
        label: document.getElementById('q-label').value.trim(),
        type: document.getElementById('q-type').value,
        text: document.getElementById('q-text').value.trim(),
        required: document.getElementById('q-req').value === 'true',
        options: document.getElementById('q-options').value.split(/\r?\n/).map(x => x.trim()).filter(Boolean)
    };
    if (!payload.label || !payload.text) return showToast('Etiqueta y texto son obligatorios', 'error');
    if (payload.type !== 'multiselect') delete payload.options;
    const arr = state.forms[type] || [];
    const idx = arr.findIndex(x => x.id === qid);
    if (idx >= 0) arr[idx] = payload;
    else arr.push(payload);
    state.forms[type] = arr;
    saveStorage(STORAGE_KEYS.forms, state.forms);
    closeModal();
    renderFormsSection();
    showToast('Pregunta guardada', 'success');
}

function removeQuestion(type, qid) {
    state.forms[type] = (state.forms[type] || []).filter(x => x.id !== qid);
    saveStorage(STORAGE_KEYS.forms, state.forms);
    renderFormsSection();
    showToast('Pregunta eliminada', 'success');
}

window.editQuestion = openQuestionForm;
window.removeQuestion = removeQuestion;
window.saveQuestion = saveQuestion;

function parseEvalResponses(prefix) {
    const rows = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith('educat_' + prefix + '_')) continue;
        if (key.endsWith('_sent')) continue;
        const parts = key.split('_');
        if (parts.length < 4) continue;
        const studentId = parseInt(parts[2], 10);
        const courseId = parseInt(parts[3], 10);
        const sent = !!localStorage.getItem(key + '_sent');
        let answers = {};
        try { answers = JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) {}
        rows.push({ key, studentId, courseId, sent, answers });
    }
    return rows;
}

function renderResponses(type) {
    const prefix = type === 'autoeval' ? 'autoeval' : 'eval';
    const rows = parseEvalResponses(prefix);
    const html = rows.map(r => {
        const st = state.students.find(s => s.id === r.studentId);
        const co = state.courses.find(c => c.id === r.courseId);
        const answerCount = Object.keys(r.answers || {}).length;
        return `<tr>
            <td>${escapeHtml(st ? userNameFrom(st) : ('ID ' + r.studentId))}</td>
            <td>${escapeHtml(co ? co.name : ('ID ' + r.courseId))}</td>
            <td>${answerCount}</td>
            <td>${r.sent ? 'Enviada' : 'Borrador'}</td>
            <td><button class="btn btn-sm btn-outline" onclick="deleteResponse('${r.key}')">Eliminar</button></td>
        </tr>`;
    }).join('');
    document.getElementById('responsesList').innerHTML = `<table class="simple-table"><thead><tr><th>Estudiante</th><th>Curso</th><th>Respuestas</th><th>Estado</th><th>Accion</th></tr></thead><tbody>${html || '<tr><td colspan="5" class="muted">Sin respuestas registradas</td></tr>'}</tbody></table>`;
}

function deleteResponse(key) {
    localStorage.removeItem(key);
    localStorage.removeItem(key + '_sent');
    renderFormsSection();
    showToast('Respuesta eliminada', 'success');
}
window.deleteResponse = deleteResponse;

function exportResponsesCsv() {
    const type = document.getElementById('formType').value;
    const prefix = type === 'autoeval' ? 'autoeval' : 'eval';
    const rows = parseEvalResponses(prefix);
    const out = [['tipo', 'studentId', 'courseId', 'sent', 'answersJson']];
    rows.forEach(r => out.push([prefix, r.studentId, r.courseId, r.sent ? '1' : '0', JSON.stringify(r.answers || {})]));
    const csv = out.map(cols => cols.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'reporte-' + prefix + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Reporte descargado', 'success');
}

function parseCsvText(text, delimiter) {
    const lines = String(text || '').split(/\r?\n/).filter(Boolean);
    if (!lines.length) return { headers: [], rows: [] };
    const sep = delimiter || ',';
    const split = (line) => {
        const out = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
                else inQuotes = !inQuotes;
            } else if (ch === sep && !inQuotes) {
                out.push(cur);
                cur = '';
            } else cur += ch;
        }
        out.push(cur);
        return out.map(v => v.trim());
    };
    const headers = split(lines[0]);
    const rows = lines.slice(1).map(split).filter(r => r.some(x => x !== ''));
    return { headers, rows };
}

function fillImportMappingSelects(headers) {
    const options = [`<option value="">Seleccionar columna</option>`].concat(headers.map((h, i) => `<option value="${i}">${escapeHtml(h || ('Columna ' + (i + 1)))}</option>`));
    ['mapStudentCode', 'mapName', 'mapLevel', 'mapGrade', 'mapCourse', 'mapAssignmentMode'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = options.join('');
    });
    const findIdx = (regex) => headers.findIndex(h => regex.test(String(h || '').toLowerCase()));
    const autoMap = {
        mapStudentCode: findIdx(/codigo|id|ident/),
        mapName: findIdx(/nombre|name/),
        mapLevel: findIdx(/nivel|level/),
        mapGrade: findIdx(/grado|grade/),
        mapCourse: findIdx(/curso|course|asignatura|materia/),
        mapAssignmentMode: findIdx(/asignacion|modo|assignment/)
    };
    Object.keys(autoMap).forEach(k => {
        const idx = autoMap[k];
        const el = document.getElementById(k);
        if (el && idx >= 0) el.value = String(idx);
    });
}

function updateImportFormatUI() {
    const type = ((document.getElementById('importFileType') || {}).value || 'auto').toLowerCase();
    const csvGroup = document.getElementById('csvDelimiterGroup');
    if (csvGroup) csvGroup.style.display = type === 'excel' ? 'none' : '';
}

async function analyzeImportFile() {
    const fileInput = document.getElementById('importFileInput');
    const file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
    if (!file) return showToast('Selecciona un archivo CSV o Excel', 'error');
    const type = ((document.getElementById('importFileType') || {}).value || 'auto').toLowerCase();
    const isExcel = type === 'excel' || (type === 'auto' && /\.(xlsx|xls)$/i.test(file.name || ''));
    const delimiterRaw = ((document.getElementById('importCsvDelimiter') || {}).value || ',');
    const delimiter = delimiterRaw === '\\t' ? '\t' : delimiterRaw;
    try {
        if (isExcel) {
            if (typeof XLSX === 'undefined') return showToast('No se pudo cargar el lector de Excel.', 'error');
            const data = await file.arrayBuffer();
            const wb = XLSX.read(data, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
            importState.headers = (matrix[0] || []).map(v => String(v || '').trim());
            importState.rows = matrix.slice(1).filter(r => (r || []).some(x => String(x || '').trim() !== '')).map(r => (r || []).map(v => String(v || '').trim()));
            importState.format = 'excel';
            importState.delimiter = '';
        } else {
            const text = await file.text();
            const parsed = parseCsvText(text, delimiter);
            importState.headers = parsed.headers;
            importState.rows = parsed.rows;
            importState.format = 'csv';
            importState.delimiter = delimiter;
        }
        if (!importState.headers.length || !importState.rows.length) return showToast('El archivo no contiene datos válidos.', 'error');
        fillImportMappingSelects(importState.headers);
        const mapRow = document.getElementById('importMappingRow');
        if (mapRow) mapRow.style.display = '';
        const formatLabel = importState.format === 'excel' ? 'Excel' : `CSV (sep: ${importState.delimiter === '\t' ? 'TAB' : importState.delimiter})`;
        document.getElementById('importValidationSummary').textContent = `Archivo cargado: ${importState.rows.length} registros detectados. Formato: ${formatLabel}.`;
        document.getElementById('importPreviewTable').innerHTML = '';
        showToast('Archivo analizado correctamente', 'success');
    } catch (e) {
        showToast('No se pudo analizar el archivo. Verifica formato CSV/XLSX.', 'error');
    }
}

function getMappedValue(row, idx) {
    if (idx === '' || idx === null || idx === undefined) return '';
    const n = parseInt(idx, 10);
    return Number.isFinite(n) ? String((row[n] || '')).trim() : '';
}

function generateStudentCode(usedCodes, rowIndex) {
    const safeUsed = usedCodes || new Set();
    let attempt = 0;
    while (attempt < 100000) {
        const candidate = `EST-AUTO-${String((rowIndex || 0) + 1 + attempt).padStart(5, '0')}`;
        const key = candidate.toLowerCase();
        if (!safeUsed.has(key)) return candidate;
        attempt++;
    }
    return `EST-AUTO-${Date.now()}`;
}

function findOrCreateLevel(levelName) {
    const name = String(levelName || '').trim();
    if (!name) return null;
    let level = (state.academicLevels || []).find(l => (l.name || '').toLowerCase() === name.toLowerCase());
    if (!level) {
        level = { id: 'lvl-' + Date.now() + '-' + Math.floor(Math.random() * 999), name, description: '' };
        state.academicLevels.push(level);
    }
    return level;
}

function findOrCreateGrade(levelId, gradeName) {
    const name = String(gradeName || '').trim();
    if (!levelId || !name) return null;
    let grade = (state.academicGrades || []).find(g => String(g.levelId) === String(levelId) && (g.name || '').toLowerCase() === name.toLowerCase());
    if (!grade) {
        grade = { id: 'gr-' + Date.now() + '-' + Math.floor(Math.random() * 999), levelId: String(levelId), name };
        state.academicGrades.push(grade);
    }
    return grade;
}

function previewImport() {
    const mapping = {
        studentCode: (document.getElementById('mapStudentCode') || {}).value,
        name: (document.getElementById('mapName') || {}).value,
        level: (document.getElementById('mapLevel') || {}).value,
        grade: (document.getElementById('mapGrade') || {}).value,
        course: (document.getElementById('mapCourse') || {}).value,
        assignmentMode: (document.getElementById('mapAssignmentMode') || {}).value
    };
    const requiredMappings = [mapping.name, mapping.level, mapping.grade];
    if (requiredMappings.some(v => v === '' || v === undefined)) return showToast('Completa el mapeo de columnas obligatorias.', 'error');
    importState.mapping = mapping;

    const codeSet = new Set((state.students || []).map(s => String(s.studentCode || '').toLowerCase()));
    const seen = new Set();
    const mapped = [];
    let missing = 0; let duplicates = 0;

    importState.rows.forEach((row, idx) => {
        let studentCode = getMappedValue(row, mapping.studentCode);
        const name = getMappedValue(row, mapping.name);
        const levelName = getMappedValue(row, mapping.level);
        const gradeName = getMappedValue(row, mapping.grade);
        const courseName = getMappedValue(row, mapping.course);
        const assignmentMode = getMappedValue(row, mapping.assignmentMode);
        const errors = [];
        if (!name || !levelName || !gradeName) { errors.push('Campos obligatorios incompletos'); missing++; }
        if (!studentCode) studentCode = generateStudentCode(new Set([...codeSet, ...seen]), idx);
        const key = studentCode.toLowerCase();
        if (key && (codeSet.has(key) || seen.has(key))) { errors.push('Código duplicado'); duplicates++; }
        seen.add(key);
        mapped.push({ rowIndex: idx + 2, studentCode, name, levelName, gradeName, courseName, assignmentMode, errors, valid: errors.length === 0 });
    });

    importState.mappedRows = mapped;
    importState.validation = {
        total: mapped.length,
        valid: mapped.filter(x => x.valid).length,
        invalid: mapped.filter(x => !x.valid).length,
        duplicates,
        missing
    };

    document.getElementById('importValidationSummary').textContent = `Total: ${importState.validation.total} | Válidos: ${importState.validation.valid} | Inválidos: ${importState.validation.invalid} | Duplicados: ${duplicates}`;
    const rows = mapped.slice(0, 20).map(r => `<tr><td>${r.rowIndex}</td><td>${escapeHtml(r.studentCode)}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.levelName)}</td><td>${escapeHtml(r.gradeName)}</td><td>${escapeHtml(r.courseName || '-')}</td><td>${escapeHtml(r.assignmentMode || '-')}</td><td>${r.valid ? 'OK' : escapeHtml(r.errors.join('; '))}</td></tr>`).join('');
    document.getElementById('importPreviewTable').innerHTML = `<table class="simple-table"><thead><tr><th>Fila</th><th>Código</th><th>Nombre</th><th>Nivel</th><th>Grado</th><th>Curso</th><th>Asignación</th><th>Estado</th></tr></thead><tbody>${rows || '<tr><td colspan="8" class="muted">Sin registros</td></tr>'}</tbody></table>`;
    showToast('Vista previa generada', 'success');
}

function normalizeAssignmentMode(rawValue) {
    const value = String(rawValue || '').trim().toLowerCase();
    if (!value) return '';
    if (/(auto|balance|regla)/.test(value)) return 'auto';
    if (/(no|sin|none|ninguna)/.test(value)) return 'none';
    return 'direct';
}

function findOrCreateCourseByName(courseName) {
    const name = String(courseName || '').trim();
    if (!name) return null;
    let course = (state.courses || []).find(c => (c.name || '').toLowerCase() === name.toLowerCase());
    if (!course) {
        const nextId = (state.courses || []).reduce((mx, c) => Math.max(mx, Number(c.id) || 0), 800) + 1;
        course = { id: nextId, name, description: 'Curso importado', teacher: null };
        state.courses.push(course);
    }
    return course;
}

function assignStudentToCourse(student, course) {
    if (!student || !course) return false;
    const exists = (state.enrollments || []).some(e => String((e.student || {}).id) === String(student.id) && String((e.course || {}).id) === String(course.id));
    if (exists) return false;
    state.enrollments.push({
        id: Date.now() + Math.floor(Math.random() * 9999),
        student,
        course,
        enrollmentDate: new Date().toISOString()
    });
    return true;
}

function assignStudentAutomaticallyByGrade(student, gradeName) {
    const gradeLower = String(gradeName || '').toLowerCase();
    if (!gradeLower) return false;
    const eligible = (state.courses || []).filter(c => {
        const cid = String(c.id);
        const grades = getCourseGradeIds(cid).map(id => {
            const g = (state.academicGrades || []).find(x => String(x.id) === String(id));
            return g ? String(g.name || '').toLowerCase() : '';
        }).filter(Boolean);
        return grades.includes(gradeLower);
    });
    if (!eligible.length) return false;
    const countByCourse = {};
    (state.enrollments || []).forEach(e => {
        const cid = String((e.course || {}).id || '');
        if (!cid) return;
        countByCourse[cid] = (countByCourse[cid] || 0) + 1;
    });
    eligible.sort((a, b) => (countByCourse[String(a.id)] || 0) - (countByCourse[String(b.id)] || 0));
    return assignStudentToCourse(student, eligible[0]);
}

function importStudentsBatch() {
    const validRows = (importState.mappedRows || []).filter(r => r.valid);
    if (!validRows.length) return showToast('No hay registros válidos para importar.', 'error');
    const usedCodes = new Set((state.students || []).map(s => String(s.studentCode || '').toLowerCase()).filter(Boolean));
    let inserted = 0;
    let createdCourses = 0;
    let createdAssignments = 0;
    validRows.forEach(r => {
        const level = findOrCreateLevel(r.levelName);
        const grade = level ? findOrCreateGrade(level.id, r.gradeName) : null;
        let studentCode = String(r.studentCode || '').trim();
        if (!studentCode || usedCodes.has(studentCode.toLowerCase())) {
            studentCode = generateStudentCode(usedCodes, inserted);
        }
        usedCodes.add(studentCode.toLowerCase());
        const nextId = (state.students.reduce((mx, s) => Math.max(mx, Number(s.id) || 0), 0) || 1000) + 1 + inserted;
        const newStudent = {
            id: nextId,
            studentCode,
            user: { id: nextId + 10000, name: r.name },
            academicLevelId: level ? level.id : null,
            academicGradeId: grade ? grade.id : null
        };
        state.students.push(newStudent);

        const courseName = String(r.courseName || '').trim();
        const assignmentMode = normalizeAssignmentMode(r.assignmentMode);
        const shouldSkipAssignment = assignmentMode === 'none';
        let linkedCourse = null;
        if (courseName) {
            const beforeCount = (state.courses || []).length;
            linkedCourse = findOrCreateCourseByName(courseName);
            if ((state.courses || []).length > beforeCount) createdCourses++;
            if (linkedCourse && level) {
                const courseId = String(linkedCourse.id);
                if (!state.courseLevels[courseId]) state.courseLevels[courseId] = String(level.id);
                if (grade) {
                    const currentGradeIds = getCourseGradeIds(courseId);
                    if (!currentGradeIds.includes(String(grade.id))) {
                        setCourseGradeIds(courseId, currentGradeIds.concat(String(grade.id)));
                    }
                }
                if (!state.courseCapacity[courseId]) state.courseCapacity[courseId] = 35;
            }
        }

        if (!shouldSkipAssignment) {
            if (assignmentMode === 'auto') {
                if (assignStudentAutomaticallyByGrade(newStudent, r.gradeName)) createdAssignments++;
                else if (linkedCourse && assignStudentToCourse(newStudent, linkedCourse)) createdAssignments++;
            } else if (linkedCourse && assignStudentToCourse(newStudent, linkedCourse)) {
                createdAssignments++;
            }
        }
        inserted++;
    });
    saveLevelsState();
    renderCoursesSection();
    renderOverview();
    renderImportSection();
    showToast(`Importación completada: ${inserted} estudiante(s), ${createdCourses} curso(s), ${createdAssignments} asignación(es).`, 'success');
}

function renderRulesList() {
    const host = document.getElementById('rulesList');
    if (!host) return;
    host.innerHTML = (state.assignmentRules || []).map(r => `<div class="guide-item" style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><strong>${escapeHtml(r.name)}</strong><div class="muted">Grados: ${escapeHtml((r.grades || []).join(', '))} · Modo: ${escapeHtml(r.mode || 'balanced')}</div></div><div style="display:flex;gap:6px"><button class="btn btn-sm btn-outline" onclick="toggleRuleActive('${r.id}')">${r.active ? 'Desactivar' : 'Activar'}</button><button class="btn btn-sm btn-outline" onclick="deleteRule('${r.id}')">Eliminar</button></div></div>`).join('') || '<div class="muted">Sin reglas registradas.</div>';
}

function createAssignmentRule() {
    const name = ((document.getElementById('ruleName') || {}).value || '').trim();
    const gradesRaw = ((document.getElementById('ruleGrades') || {}).value || '').trim();
    const mode = ((document.getElementById('ruleMode') || {}).value || 'balanced').trim();
    const active = ((document.getElementById('ruleActive') || {}).value || 'true') === 'true';
    const grades = gradesRaw.split(',').map(x => x.trim()).filter(Boolean);
    if (!name || !grades.length) return showToast('Define nombre y al menos un grado en la regla.', 'error');
    state.assignmentRules.push({ id: 'rule-' + Date.now(), name, grades, mode, active });
    saveStorage(STORAGE_KEYS.assignmentRules, state.assignmentRules);
    document.getElementById('ruleName').value = '';
    document.getElementById('ruleGrades').value = '';
    renderRulesList();
    showToast('Regla creada', 'success');
}

function toggleRuleActive(ruleId) {
    const rule = (state.assignmentRules || []).find(r => String(r.id) === String(ruleId));
    if (!rule) return;
    rule.active = !rule.active;
    saveStorage(STORAGE_KEYS.assignmentRules, state.assignmentRules);
    renderRulesList();
}

function deleteRule(ruleId) {
    state.assignmentRules = (state.assignmentRules || []).filter(r => String(r.id) !== String(ruleId));
    saveStorage(STORAGE_KEYS.assignmentRules, state.assignmentRules);
    renderRulesList();
}

function getStudentGradeName(st) {
    if (!st) return '';
    const gid = st.academicGradeId;
    if (gid) {
        const g = (state.academicGrades || []).find(x => String(x.id) === String(gid));
        if (g) return String(g.name || '').trim();
    }
    return String(st.gradeName || '').trim();
}

function applyRulesToStudents() {
    const activeRules = (state.assignmentRules || []).filter(r => r.active);
    if (!activeRules.length) return showToast('No hay reglas activas para aplicar.', 'error');

    const countByCourse = {};
    (state.enrollments || []).forEach(e => {
        const cid = String((e.course || {}).id || '');
        if (!cid) return;
        countByCourse[cid] = (countByCourse[cid] || 0) + 1;
    });

    let assignments = 0;
    (state.students || []).forEach(st => {
        const studentGrade = getStudentGradeName(st).toLowerCase();
        if (!studentGrade) return;
        activeRules.forEach(rule => {
            const match = (rule.grades || []).some(g => studentGrade === String(g || '').toLowerCase());
            if (!match) return;

            const eligible = (state.courses || []).filter(c => {
                const cid = String(c.id);
                const grades = getCourseGradeIds(cid).map(id => {
                    const gr = (state.academicGrades || []).find(x => String(x.id) === String(id));
                    return gr ? String(gr.name || '').toLowerCase() : '';
                }).filter(Boolean);
                if (!grades.includes(studentGrade)) return false;
                const cap = parseInt(state.courseCapacity[cid] || 0, 10) || 0;
                const used = countByCourse[cid] || 0;
                return cap <= 0 || used < cap;
            });
            if (!eligible.length) return;

            eligible.sort((a, b) => (countByCourse[String(a.id)] || 0) - (countByCourse[String(b.id)] || 0));
            const selected = eligible[0];
            const exists = (state.enrollments || []).some(e => String((e.course || {}).id) === String(selected.id) && String((e.student || {}).id) === String(st.id));
            if (exists) return;
            state.enrollments.push({ id: Date.now() + Math.floor(Math.random() * 9999), course: selected, student: st, enrollmentDate: new Date().toISOString() });
            countByCourse[String(selected.id)] = (countByCourse[String(selected.id)] || 0) + 1;
            assignments++;
        });
    });

    renderCoursesSection();
    showToast(`Reglas aplicadas: ${assignments} asignación(es) nueva(s).`, 'success');
}

function renderImportSection() {
    renderRulesList();
    updateImportFormatUI();
}

function openDeleteAllUsersModal() {
    openModal('Confirmar borrado masivo', `
        <div class="alert alert-error" style="margin-bottom:10px">Se eliminarán todos los usuarios/estudiantes y matrículas del panel.</div>
        <div class="form-group">
            <label class="form-label">Escribe <strong>Eliminar datos</strong> para confirmar</label>
            <input class="form-input" id="confirmDeleteAllUsersText" placeholder="Eliminar datos">
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px">
            <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-danger" onclick="confirmDeleteAllUsers()">Eliminar</button>
        </div>
    `);
}

function confirmDeleteAllUsers() {
    const typed = String((document.getElementById('confirmDeleteAllUsersText') || {}).value || '').trim();
    if (typed !== 'Eliminar datos') return showToast('Debes escribir exactamente "Eliminar datos"', 'error');
    state.users = [];
    state.teachers = [];
    state.students = [];
    state.courses = [];
    state.enrollments = [];
    state.certificates = [];
    state.academicLevels = [];
    state.academicGrades = [];
    state.courseLevels = {};
    state.courseGrades = {};
    state.courseCapacity = {};
    state.teacherLevels = {};
    state.teacherGrades = {};
    state.assignmentRules = [];
    state.userPerms = {};

    saveLevelsState();
    saveStorage(STORAGE_KEYS.assignmentRules, state.assignmentRules);
    saveStorage(STORAGE_KEYS.userPerms, state.userPerms);

    importState.headers = [];
    importState.rows = [];
    importState.mappedRows = [];
    importState.validation = { total: 0, valid: 0, invalid: 0, duplicates: 0, missing: 0 };

    closeModal();
    renderAll();
    showToast('Datos eliminados', 'success');
}

window.confirmDeleteAllUsers = confirmDeleteAllUsers;

function renderGradePolicySection() {
    const p = state.gradePolicy;
    document.getElementById('gradingModel').value = p.selectedMethod || 'simple';
    document.getElementById('allowTeacherCustom').value = String(p.allowTeacherCustom !== false);
    document.getElementById('forcedModel').value = p.forcedModel || '';
    document.getElementById('examMinPercent').value = p.examMinPercent;
    document.getElementById('examMaxPercent').value = p.examMaxPercent;

    document.getElementById('gradingGuide').innerHTML = `
        <div class="help-card">
            <h4>¿El docente puede definir su modelo interno?</h4>
            <p>Si activas <strong>"Sí"</strong>, el docente puede seleccionar su propio esquema al finalizar unidad.</p>
            <p>Si activas <strong>"No"</strong>, se aplica el modelo principal institucional o el modelo forzado que definas.</p>
        </div>
        <div class="help-card">
            <h4>Modelos en "Forzar modelo al docente"</h4>
            <ul>
                <li><strong>Promedio simple:</strong> suma todas las notas válidas y divide entre la cantidad.</li>
                <li><strong>Pesos globales por categoría:</strong> distribuye porcentaje por bloques (talleres, parciales, foros, glosarios).</li>
                <li><strong>Porcentajes por ítem:</strong> cada actividad/parcial/foro/glosario tiene su propio porcentaje.</li>
                <li><strong>Ninguno:</strong> no se calcula definitiva automática; el docente exporta y gestiona manual.</li>
            </ul>
        </div>
        <div class="help-card">
            <h4>1) Promedio aritmetico simple</h4>
            <p>Se suman todas las notas de un periodo y se dividen entre la cantidad.</p>
            <p><strong>Ejemplo:</strong> notas 4.2, 3.8 y 4.5 => (4.2 + 3.8 + 4.5) / 3 = 4.17</p>
        </div>
        <div class="help-card">
            <h4>2) Promedio ponderado por porcentajes</h4>
            <p>Cada componente tiene un peso porcentual.</p>
            <p><strong>Ejemplo:</strong> Talleres 40% (4.5) y Parcial 60% (3.8) => (4.5 x 0.40) + (3.8 x 0.60) = 4.08</p>
        </div>
        <div class="help-card">
            <h4>3) Periodos/cortes con peso diferente</h4>
            <p>El promedio final se calcula entre cortes con pesos distintos.</p>
            <p><strong>Ejemplo:</strong> Corte 1 (3.9 x 40%) + Corte 2 (4.3 x 60%) = 4.14</p>
            <p>Tambien aplica al caso 30% + 30% + 40% para obtener la definitiva del semestre.</p>
        </div>
        <div class="help-card">
            <h4>4) Ninguno</h4>
            <p>La plataforma no calcula; el docente o coordinacion carga notas finales manualmente.</p>
        </div>
    `;
}

function saveGradePolicy() {
    const selectedMethod = document.getElementById('gradingModel').value;
    const allowTeacherCustom = document.getElementById('allowTeacherCustom').value === 'true';
    const forcedModel = document.getElementById('forcedModel').value;
    const examMinPercent = Math.max(0, Math.min(100, parseFloat(document.getElementById('examMinPercent').value || '0')));
    const examMaxPercent = Math.max(0, Math.min(100, parseFloat(document.getElementById('examMaxPercent').value || '100')));

    if (examMinPercent > examMaxPercent) return showToast('El minimo no puede superar al maximo', 'error');
    state.gradePolicy = { selectedMethod, allowTeacherCustom, forcedModel, examMinPercent, examMaxPercent };
    saveStorage(STORAGE_KEYS.gradePolicy, state.gradePolicy);
    renderOverview();
    showToast('Politica de calificacion guardada', 'success');
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
        localStorage.removeItem('educat_auth');
        sessionStorage.removeItem('educat_auth');
        window.location.href = '/login';
    });

    bindClick('btnCreateCourse', createCourse);
    bindClick('btnCreateLevel', createAcademicLevel);
    bindClick('btnCreateGrade', createAcademicGrade);
    bindClick('btnOpenCourseLevelModal', openCourseLevelModal);
    bindClick('btnAssignTeacherLevel', assignTeacherToLevel);
    bindClick('btnOpenStudentCourseModal', openStudentCourseModal);
    bindClick('btnDeleteAllUsers', openDeleteAllUsersModal);
    const courseTeacherSel = document.getElementById('courseTeacher');
    if (courseTeacherSel) courseTeacherSel.addEventListener('change', () => {
        modalState.courseCreate.gradeIds = [];
        modalState.courseCreate.menuOpen = false;
        const host = document.getElementById('courseGradeMulti');
        if (host) host.classList.remove('open');
        renderCourseLevelOptions();
        renderCourseGradeOptions();
    });
    const courseLevelSel = document.getElementById('courseLevel');
    if (courseLevelSel) courseLevelSel.addEventListener('change', () => {
        modalState.courseCreate.menuOpen = false;
        const host = document.getElementById('courseGradeMulti');
        if (host) host.classList.remove('open');
        renderCourseGradeOptions();
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
        modalState.teacherAssign.gradeIds = [];
        modalState.teacherAssign.menuOpen = false;
        const host = document.getElementById('assignTeacherGradeMulti');
        if (host) host.classList.remove('open');
        renderAssignTeacherGradeOptions();
    });
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
    if (levelsSearch) levelsSearch.addEventListener('input', applyLevelsSummaryFilters);
    const levelsFilter = document.getElementById('levelsFilter');
    if (levelsFilter) levelsFilter.addEventListener('change', applyLevelsSummaryFilters);

    bindClick('btnCreateRole', createRole);
    const rolesSearch = document.getElementById('rolesSearch');
    if (rolesSearch) rolesSearch.addEventListener('input', () => {
        state.ui.rolesSearch = rolesSearch.value.trim();
        state.ui.rolesPage = 1;
        renderRolesSection();
    });
    bindClick('rolesPrevPage', () => {
        state.ui.rolesPage = Math.max(1, (state.ui.rolesPage || 1) - 1);
        renderRolesSection();
    });
    bindClick('rolesNextPage', () => {
        state.ui.rolesPage = (state.ui.rolesPage || 1) + 1;
        renderRolesSection();
    });

    const permRoleSearch = document.getElementById('permRoleSearch');
    if (permRoleSearch) permRoleSearch.addEventListener('input', () => {
        state.ui.permRoleSearch = permRoleSearch.value.trim();
        state.ui.permRolePage = 1;
        renderRolesSection();
    });
    bindClick('permRolePrevPage', () => {
        state.ui.permRolePage = Math.max(1, (state.ui.permRolePage || 1) - 1);
        renderRolesSection();
    });
    bindClick('permRoleNextPage', () => {
        state.ui.permRolePage = (state.ui.permRolePage || 1) + 1;
        renderRolesSection();
    });

    const permUserSearch = document.getElementById('permUserSearch');
    if (permUserSearch) permUserSearch.addEventListener('input', () => {
        state.ui.permUserSearch = permUserSearch.value.trim();
        state.ui.permUserPage = 1;
        renderRolesSection();
    });
    bindClick('permUserPrevPage', () => {
        state.ui.permUserPage = Math.max(1, (state.ui.permUserPage || 1) - 1);
        renderRolesSection();
    });
    bindClick('permUserNextPage', () => {
        state.ui.permUserPage = (state.ui.permUserPage || 1) + 1;
        renderRolesSection();
    });

    const permRole = document.getElementById('permRole');
    if (permRole) permRole.addEventListener('change', () => renderPermissionChecklist('permissionsChecklist', getRolePerms(), 'roleperm'));
    const permUser = document.getElementById('permUser');
    if (permUser) permUser.addEventListener('change', () => renderPermissionChecklist('userPermissionsChecklist', getUserPerms(), 'userperm'));
    bindClick('btnSavePerms', saveRolePerms);
    bindClick('btnSaveUserPerms', saveUserPerms);

    bindClick('btnCreateCert', createCertificate);

    bindClick('btnNewGuide', () => openGuideForm());

    bindClick('btnAnalyzeImport', analyzeImportFile);
    bindClick('btnPreviewImport', previewImport);
    bindClick('btnImportStudents', importStudentsBatch);
    bindClick('btnCreateRule', createAssignmentRule);
    bindClick('btnApplyRules', applyRulesToStudents);
    const importFileType = document.getElementById('importFileType');
    if (importFileType) importFileType.addEventListener('change', updateImportFormatUI);

    const formType = document.getElementById('formType');
    if (formType) formType.addEventListener('change', renderFormsSection);
    bindClick('btnNewQuestion', () => openQuestionForm((document.getElementById('formType') || {}).value));
    bindClick('btnExportResponses', exportResponsesCsv);

    bindClick('btnSaveGrading', saveGradePolicy);
}

function renderAll() {
    renderOverview();
    renderCoursesSection();
    renderRolesSection();
    renderCertificatesSection();
    renderGuidesSection();
    renderFormsSection();
    renderImportSection();
    renderGradePolicySection();
}

async function init() {
    bindEvents();
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('es-CO', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
    const userEmail = localStorage.getItem('educat_email') || sessionStorage.getItem('educat_email') || '';
    const found = state.users.find(u => (u.email || '').toLowerCase() === userEmail.toLowerCase());
    if (found) document.getElementById('sidebarUserName').textContent = found.name;

    await loadData();
    renderAll();

    const activeUser = state.users.find(u => (u.email || '').toLowerCase() === userEmail.toLowerCase());
    if (activeUser) document.getElementById('sidebarUserName').textContent = activeUser.name;
}

init();

