const ENROLLMENT_STORAGE_KEY = 'educat_enrollment_requests';
const ENROLLMENT_FORM_STORAGE_KEY = 'educat_enrollment_form_config';
const ENROLLMENT_MAX_FILE_FIELDS = 4;
const ENROLLMENT_PAGE_SIZE = 6;

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

const runtime = {
    fields: [],
    answers: {},
    files: {},
    page: 1
};

function normalize(value) { return String(value || '').trim(); }

function setAlert(id, show, message) {
    const el = document.getElementById(id);
    if (!el) return;
    if (message) {
        const text = el.querySelector('span:last-child');
        if (text) text.textContent = message;
    }
    el.classList.toggle('show', !!show);
}

function setFieldError(id, show) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('show', !!show);
}

function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
}

function validatePhone(value) {
    return String(value || '').replace(/[^0-9]/g, '').length >= 7;
}

function cloneField(field) {
    if (String((field || {}).id || '') === 'schedule') {
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
        id: normalize(field.id),
        section: normalize(field.section) || 'General',
        type: normalize(field.type) || 'text',
        label: normalize(field.label) || 'Campo',
        placeholder: String(field.placeholder || ''),
        required: field.required !== false,
        options: Array.isArray(field.options) ? field.options.map(String) : []
    };
}

function loadEnrollmentFields() {
    let items = [];
    try {
        items = JSON.parse(localStorage.getItem(ENROLLMENT_FORM_STORAGE_KEY) || '[]');
    } catch (e) {
        items = [];
    }
    const hasStored = Array.isArray(items) && items.length;
    const fields = (hasStored ? items : DEFAULT_ENROLLMENT_FORM_FIELDS)
        .map(cloneField)
        .filter(f => f.id);
    let fileSlots = ENROLLMENT_MAX_FILE_FIELDS;
    const normalized = fields.filter(f => {
        if (f.type !== 'file') return true;
        if (fileSlots <= 0) return false;
        fileSlots -= 1;
        return true;
    });

    if (!hasStored || normalized.length !== items.length) {
        localStorage.setItem(ENROLLMENT_FORM_STORAGE_KEY, JSON.stringify(normalized));
    }

    const allowedIds = new Set(normalized.map(f => f.id));
    Object.keys(runtime.answers).forEach(key => {
        if (!allowedIds.has(key)) delete runtime.answers[key];
    });
    Object.keys(runtime.files).forEach(key => {
        if (!allowedIds.has(key)) delete runtime.files[key];
    });

    runtime.fields = normalized;
}

function renderDynamicField(field) {
    const fid = `enr_${field.id}`;
    const errId = `err_${field.id}`;
    const value = runtime.answers[field.id] || '';
    if (field.type === 'textarea') {
        return `<div class="form-group"><label class="form-label" for="${fid}">${field.label}${field.required ? ' *' : ''}</label><textarea id="${fid}" class="form-input no-icon" style="min-height:100px" placeholder="${field.placeholder}"></textarea><div class="field-error" id="${errId}">Campo obligatorio.</div></div>`;
    }
    if (field.type === 'select') {
        return `<div class="form-group"><label class="form-label" for="${fid}">${field.label}${field.required ? ' *' : ''}</label><select id="${fid}" class="form-select"><option value="">Selecciona</option>${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}</select><div class="field-error" id="${errId}">Campo obligatorio.</div></div>`;
    }
    if (field.type === 'file') {
        return `<div class="form-group"><label class="form-label" for="${fid}">${field.label}${field.required ? ' *' : ''}</label><input id="${fid}" type="file" class="form-input no-icon" accept=".pdf,.jpg,.jpeg,.png,.webp"><div class="field-help">Formatos permitidos: PDF, JPG, PNG, WEBP.</div><div class="field-error" id="${errId}">Adjunta un archivo.</div></div>`;
    }
    const type = ['email', 'tel', 'date', 'url'].includes(field.type) ? field.type : 'text';
    return `<div class="form-group"><label class="form-label" for="${fid}">${field.label}${field.required ? ' *' : ''}</label><input id="${fid}" type="${type}" class="form-input no-icon" placeholder="${field.placeholder}"><div class="field-error" id="${errId}">Campo obligatorio.</div></div>`;
}

function renderEnrollmentFormPage() {
    const host = document.getElementById('enrollmentFormDynamic');
    const pager = document.getElementById('enrollmentFormPager');
    if (!host || !pager) return;
    const totalPages = Math.max(1, Math.ceil(runtime.fields.length / ENROLLMENT_PAGE_SIZE));
    runtime.page = Math.min(Math.max(1, runtime.page), totalPages);
    const start = (runtime.page - 1) * ENROLLMENT_PAGE_SIZE;
    const visible = runtime.fields.slice(start, start + ENROLLMENT_PAGE_SIZE);

    let prevSection = '';
    host.innerHTML = visible.map(field => {
        const sectionHtml = field.section !== prevSection ? `<div class="section-divider">${field.section}</div>` : '';
        prevSection = field.section;
        return sectionHtml + renderDynamicField(field);
    }).join('');

    pager.innerHTML = `
        <button class="enr-pager-btn" type="button" ${runtime.page <= 1 ? 'disabled' : ''} id="enrPrevPage">Anterior</button>
        <span>${runtime.page}/${totalPages}</span>
        <button class="enr-pager-btn" type="button" ${runtime.page >= totalPages ? 'disabled' : ''} id="enrNextPage">Siguiente</button>
    `;

    const prev = document.getElementById('enrPrevPage');
    const next = document.getElementById('enrNextPage');
    if (prev) prev.addEventListener('click', () => { runtime.page -= 1; renderEnrollmentFormPage(); });
    if (next) next.addEventListener('click', () => { runtime.page += 1; renderEnrollmentFormPage(); });

    visible.forEach(field => {
        const input = document.getElementById(`enr_${field.id}`);
        if (!input) return;
        if (field.type === 'file') {
            input.addEventListener('change', () => {
                runtime.files[field.id] = input.files && input.files[0] ? input.files[0] : null;
            });
        } else {
            input.value = String(runtime.answers[field.id] || '');
            input.addEventListener('input', () => { runtime.answers[field.id] = input.value; });
            input.addEventListener('change', () => { runtime.answers[field.id] = input.value; });
        }
    });
}

function readRequests() {
    try {
        const raw = localStorage.getItem(ENROLLMENT_STORAGE_KEY);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list : [];
    } catch (e) {
        return [];
    }
}

function saveRequests(items) {
    localStorage.setItem(ENROLLMENT_STORAGE_KEY, JSON.stringify(items));
}

function clearForm() {
    runtime.answers = {};
    runtime.files = {};
    runtime.page = 1;
    const policy = document.getElementById('acceptPolicy');
    if (policy) policy.checked = false;
    renderEnrollmentFormPage();
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!file) return resolve('');
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
        reader.readAsDataURL(file);
    });
}

async function mapFilePayload(file) {
    if (!file) return null;
    return {
        name: String(file.name || ''),
        type: String(file.type || ''),
        size: Math.max(0, parseInt(file.size || '0', 10) || 0),
        dataUrl: await readFileAsDataUrl(file)
    };
}

function validateForm() {
    let valid = true;
    runtime.fields.forEach(field => {
        const errId = `err_${field.id}`;
        let ok = true;
        if (field.type === 'file') {
            ok = !field.required || !!runtime.files[field.id];
        } else {
            const value = normalize(runtime.answers[field.id]);
            if (field.required && !value) ok = false;
            if (ok && value && field.type === 'email' && !validateEmail(value)) ok = false;
            if (ok && value && field.type === 'tel' && !validatePhone(value)) ok = false;
        }
        setFieldError(errId, !ok);
        if (!ok) valid = false;
    });

    const accepted = !!((document.getElementById('acceptPolicy') || {}).checked);
    setFieldError('acceptPolicyErr', !accepted);
    if (!accepted) valid = false;
    return valid;
}

async function buildEnrollmentPayload() {
    const valueMap = {};
    runtime.fields.forEach(field => {
        if (field.type !== 'file') valueMap[field.id] = normalize(runtime.answers[field.id]);
    });
    return {
        id: 'enr-' + Date.now(),
        createdAt: new Date().toISOString(),
        status: 'pending-review',
        student: {
            name: valueMap.studentName || '',
            lastName: valueMap.studentLastName || '',
            document: valueMap.studentDoc || '',
            birthDate: valueMap.studentBirthDate || '',
            gender: valueMap.studentGender || ''
        },
        academic: {
            level: valueMap.level || '',
            grade: valueMap.grade || ''
        },
        guardian: {
            name: valueMap.guardianName || '',
            relation: valueMap.guardianRelation || '',
            phone: valueMap.contactPhone || '',
            email: valueMap.contactEmail || '',
            address: valueMap.address || ''
        },
        notes: valueMap.notes || '',
        extra: runtime.fields
            .filter(f => !['studentName', 'studentLastName', 'studentDoc', 'studentBirthDate', 'studentGender', 'level', 'grade', 'guardianName', 'guardianRelation', 'contactPhone', 'contactEmail', 'address', 'notes'].includes(f.id) && f.type !== 'file')
            .map(f => ({ id: f.id, label: f.label, type: f.type, value: valueMap[f.id] || '' })),
        documents: {
            schoolCertificate: await mapFilePayload(runtime.files.schoolCertificateFile),
            guardianIdentityCopy: await mapFilePayload(runtime.files.guardianDocumentFile),
            studentIdentityCard: await mapFilePayload(runtime.files.studentIdentityCardFile),
            healthAffiliationCertificate: await mapFilePayload(runtime.files.healthAffiliationFile),
            additional: await Promise.all(runtime.fields
                .filter(f => f.type === 'file' && !['schoolCertificateFile', 'guardianDocumentFile', 'studentIdentityCardFile', 'healthAffiliationFile'].includes(f.id))
                .map(async f => ({ id: f.id, label: f.label, file: await mapFilePayload(runtime.files[f.id]) })))
        },
        formConfigSnapshot: runtime.fields
    };
}

function setLoading(loading) {
    const btn = document.getElementById('enrollmentBtn');
    if (!btn) return;
    btn.classList.toggle('loading', !!loading);
    btn.disabled = !!loading;
}

async function handleSubmit(ev) {
    ev.preventDefault();
    setAlert('alertError', false);
    setAlert('alertSuccess', false);

    if (!validateForm()) {
        setAlert('alertError', true, 'Por favor completa los campos obligatorios para continuar.');
        return;
    }

    setLoading(true);
    try {
        const payload = await buildEnrollmentPayload();
        const requests = readRequests();
        requests.unshift(payload);
        saveRequests(requests);
        clearForm();
        setAlert('alertSuccess', true, 'Solicitud enviada. Pronto recibirás confirmación en el correo de contacto.');
    } catch (e) {
        setAlert('alertError', true, 'No se pudo enviar la solicitud. Intenta nuevamente.');
    } finally {
        setLoading(false);
    }
}

function initEnrollmentForm() {
    loadEnrollmentFields();
    renderEnrollmentFormPage();
    const form = document.getElementById('enrollmentForm');
    if (form) form.addEventListener('submit', handleSubmit);
    window.addEventListener('storage', ev => {
        if (ev.key !== ENROLLMENT_FORM_STORAGE_KEY) return;
        loadEnrollmentFields();
        renderEnrollmentFormPage();
        setAlert('alertSuccess', false);
        setAlert('alertError', true, 'El formulario fue actualizado por administración. Revisa los campos antes de enviar.');
    });
}

initEnrollmentForm();

