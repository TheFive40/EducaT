const ENROLLMENT_STORAGE_KEY = 'educat_enrollment_requests';
const ENROLLMENT_FORM_STORAGE_KEY = 'educat_enrollment_form_config';
const ENROLLMENT_MAX_FILE_FIELDS = 4;
const ENROLLMENT_PAGE_SIZE = 6;
const ENROLLMENT_MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

const DEFAULT_ENROLLMENT_FORM_FIELDS = [
    { id: 'studentName', section: 'Datos del estudiante', type: 'text', label: 'Nombre completo', placeholder: 'Nombre del estudiante', required: true },
    { id: 'studentLastName', section: 'Datos del estudiante', type: 'text', label: 'Apellidos del estudiante', placeholder: 'Apellidos del estudiante', required: true },
    { id: 'studentDoc', section: 'Datos del estudiante', type: 'text', label: 'Documento', placeholder: 'CC / TI / Pasaporte', required: true },
    { id: 'studentBirthDate', section: 'Datos del estudiante', type: 'date', label: 'Fecha de nacimiento', placeholder: '', required: true },
    { id: 'studentGender', section: 'Datos del estudiante', type: 'select', label: 'Genero', placeholder: '', required: true, options: ['Femenino', 'Masculino', 'Otro', 'Prefiero no decirlo'] },
    { id: 'studentEmail', section: 'Datos del estudiante', type: 'email', label: 'Correo electronico del estudiante', placeholder: 'estudiante@dominio.com', required: true, immutable: true },
    { id: 'level', section: 'Datos academicos', type: 'select', label: 'Nivel academico', placeholder: '', required: true, options: [] },
    { id: 'grade', section: 'Datos academicos', type: 'select', label: 'Grado', placeholder: '', required: true, options: [] },
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
    page: 1,
    academicLevels: [],
    academicGrades: []
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
        immutable: !!field.immutable,
        options: Array.isArray(field.options) ? field.options.map(String) : []
    };
}

async function loadAcademicData() {
    try {
        const [levelsRes, gradesRes] = await Promise.all([
            fetch('/api/academic-levels').catch(() => null),
            fetch('/api/academic-grades').catch(() => null)
        ]);
        if (levelsRes && levelsRes.ok) {
            runtime.academicLevels = (await levelsRes.json()) || [];
        }
        if (gradesRes && gradesRes.ok) {
            runtime.academicGrades = (await gradesRes.json()) || [];
        }
    } catch (e) {
        runtime.academicLevels = [];
        runtime.academicGrades = [];
    }
}

function getLevelOptions() {
    return (runtime.academicLevels || []).map(l => String(l.name || '')).filter(Boolean);
}

function getGradeOptionsForLevel(levelName) {
    const level = (runtime.academicLevels || []).find(l => String(l.name || '').trim().toLowerCase() === String(levelName || '').trim().toLowerCase());
    if (!level) return [];
    const levelId = String(level.id || '');
    return (runtime.academicGrades || []).filter(g => String(g.levelId || '') === levelId).map(g => String(g.name || '')).filter(Boolean);
}

function mergeEnrollmentFields(stored) {
    if (!Array.isArray(stored) || !stored.length) {
        return DEFAULT_ENROLLMENT_FORM_FIELDS.map(cloneField);
    }
    const defaults = DEFAULT_ENROLLMENT_FORM_FIELDS.map(cloneField);
    const defaultsMap = new Map(defaults.map(f => [f.id, f]));
    const storedIds = new Set((stored || []).map(f => normalize(f.id)).filter(Boolean));
    // Respetar el orden y la composicion guardada por el admin
    const merged = (stored || []).map(s => {
        const id = normalize(s.id);
        const def = defaultsMap.get(id);
        if (!def) return cloneField(s); // campo custom
        if (def.immutable) {
            return { ...def, required: def.required };
        }
        return { ...def, ...cloneField(s), id: def.id, immutable: def.immutable };
    });
    // Asegurar que los campos inmutables del sistema siempre esten presentes
    defaults.forEach(def => {
        if (def.immutable && !storedIds.has(def.id)) {
            merged.push(def);
        }
    });
    return merged;
}

function hardenEnrollmentFormFields(fields) {
    const list = (fields || []).map(cloneField);
    // Ensure studentEmail exists, is required, immutable
    const emailIdx = list.findIndex(f => f.id === 'studentEmail');
    if (emailIdx >= 0) {
        list[emailIdx].required = true;
        list[emailIdx].immutable = true;
    }
    // Ensure studentLastName exists and is on first page (early in list)
    const lastNameIdx = list.findIndex(f => f.id === 'studentLastName');
    if (lastNameIdx >= 6) {
        const [item] = list.splice(lastNameIdx, 1);
        list.splice(1, 0, item); // Put right after studentName
    } else if (lastNameIdx < 0) {
        const def = DEFAULT_ENROLLMENT_FORM_FIELDS.find(f => f.id === 'studentLastName');
        if (def) list.splice(1, 0, cloneField(def));
    }
    // Forzar nivel y grado a select siempre
    ['level', 'grade'].forEach(key => {
        const idx = list.findIndex(f => f.id === key);
        if (idx >= 0) {
            list[idx].type = 'select';
            list[idx].options = [];
        }
    });
    // Limit file fields
    let fileSlots = ENROLLMENT_MAX_FILE_FIELDS;
    return list.filter(f => {
        if (f.type !== 'file') return true;
        if (fileSlots <= 0) return false;
        fileSlots -= 1;
        return true;
    });
}

function loadEnrollmentFields() {
    let items = [];
    try {
        items = JSON.parse(localStorage.getItem(ENROLLMENT_FORM_STORAGE_KEY) || '[]');
    } catch (e) {
        items = [];
    }
    const hasStored = Array.isArray(items) && items.length;
    const merged = mergeEnrollmentFields(hasStored ? items : []);
    const fields = hardenEnrollmentFormFields(merged);

    if (!hasStored || fields.length !== items.length) {
        localStorage.setItem(ENROLLMENT_FORM_STORAGE_KEY, JSON.stringify(fields));
    }

    const allowedIds = new Set(fields.map(f => f.id));
    Object.keys(runtime.answers).forEach(key => {
        if (!allowedIds.has(key)) delete runtime.answers[key];
    });
    Object.keys(runtime.files).forEach(key => {
        if (!allowedIds.has(key)) delete runtime.files[key];
    });

    runtime.fields = fields;
}

function renderDynamicField(field) {
    const fid = `enr_${field.id}`;
    const errId = `err_${field.id}`;
    const value = runtime.answers[field.id] || '';
    if (field.type === 'textarea') {
        return `<div class="form-group"><label class="form-label" for="${fid}">${field.label}${field.required ? ' *' : ''}</label><textarea id="${fid}" class="form-input no-icon" style="min-height:100px" placeholder="${field.placeholder}"></textarea><div class="field-error" id="${errId}">Campo obligatorio.</div></div>`;
    }
    if (field.type === 'select') {
        let options = [];
        if (field.id === 'level') {
            options = getLevelOptions();
        } else if (field.id === 'grade') {
            const selectedLevel = runtime.answers['level'] || '';
            options = getGradeOptionsForLevel(selectedLevel);
        } else {
            options = field.options || [];
        }
        return `<div class="form-group"><label class="form-label" for="${fid}">${field.label}${field.required ? ' *' : ''}</label><select id="${fid}" class="form-select"><option value="">Selecciona</option>${options.map(opt => `<option value="${opt}" ${String(value) === opt ? 'selected' : ''}>${opt}</option>`).join('')}</select><div class="field-error" id="${errId}">Campo obligatorio.</div></div>`;
    }
    if (field.type === 'file') {
        return `<div class="form-group"><label class="form-label" for="${fid}">${field.label}${field.required ? ' *' : ''}</label><input id="${fid}" type="file" class="form-input no-icon" accept=".pdf,.jpg,.jpeg,.png,.webp"><div class="field-help">Formatos permitidos: PDF, JPG, PNG, WEBP.</div><div class="field-error" id="${errId}">Adjunta un archivo.</div></div>`;
    }
    if (field.type === 'tel') {
        const countryCode = normalize(runtime.answers[`${field.id}_country`] || '+57');
        const phoneValue = normalize(value).replace(/^\+\d+\s*/, '');
        return `<div class="form-group"><label class="form-label" for="${fid}">${field.label}${field.required ? ' *' : ''}</label><div style="display:flex;gap:8px;align-items:center"><select id="${fid}_country" class="form-select" style="max-width:110px;flex-shrink:0"><option value="+57" ${countryCode === '+57' ? 'selected' : ''}>🇨🇴 +57</option><option value="+1" ${countryCode === '+1' ? 'selected' : ''}>🇺🇸 +1</option><option value="+34" ${countryCode === '+34' ? 'selected' : ''}>🇪🇸 +34</option><option value="+52" ${countryCode === '+52' ? 'selected' : ''}>🇲🇽 +52</option><option value="+54" ${countryCode === '+54' ? 'selected' : ''}>🇦🇷 +54</option><option value="+51" ${countryCode === '+51' ? 'selected' : ''}>🇵🇪 +51</option><option value="+56" ${countryCode === '+56' ? 'selected' : ''}>🇨🇱 +56</option><option value="+58" ${countryCode === '+58' ? 'selected' : ''}>🇻🇪 +58</option></select><input id="${fid}" type="tel" class="form-input no-icon" style="flex:1" placeholder="${field.placeholder}" value="${phoneValue}"></div><div class="field-error" id="${errId}">Campo obligatorio.</div></div>`;
    }
    const type = ['email', 'date', 'url'].includes(field.type) ? field.type : 'text';
    return `<div class="form-group"><label class="form-label" for="${fid}">${field.label}${field.required ? ' *' : ''}</label><input id="${fid}" type="${type}" class="form-input no-icon" placeholder="${field.placeholder}" value="${escapeHtml(String(value))}"><div class="field-error" id="${errId}">Campo obligatorio.</div></div>`;
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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
        } else if (field.type === 'tel') {
            const countrySelect = document.getElementById(`enr_${field.id}_country`);
            input.value = String(runtime.answers[field.id] || '').replace(/^\+\d+\s*/, '');
            input.addEventListener('input', () => {
                const code = countrySelect ? normalize(countrySelect.value) : '+57';
                runtime.answers[field.id] = code + ' ' + normalize(input.value);
            });
            input.addEventListener('change', () => {
                const code = countrySelect ? normalize(countrySelect.value) : '+57';
                runtime.answers[field.id] = code + ' ' + normalize(input.value);
            });
            if (countrySelect) {
                countrySelect.addEventListener('change', () => {
                    runtime.answers[`${field.id}_country`] = normalize(countrySelect.value);
                    const code = normalize(countrySelect.value);
                    runtime.answers[field.id] = code + ' ' + normalize(input.value);
                });
            }
        } else if (field.type === 'select' && (field.id === 'level' || field.id === 'grade')) {
            input.value = String(runtime.answers[field.id] || '');
            input.addEventListener('change', () => {
                runtime.answers[field.id] = input.value;
                if (field.id === 'level') {
                    runtime.answers['grade'] = '';
                    renderEnrollmentFormPage();
                }
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

function stripFileDataUrls(payload) {
    if (!payload || !payload.documents) return payload;
    const docs = payload.documents;
    const strip = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        if (obj.dataUrl !== undefined) {
            return { ...obj, dataUrl: '' };
        }
        if (obj.file && obj.file.dataUrl !== undefined) {
            return { ...obj, file: { ...obj.file, dataUrl: '' } };
        }
        return obj;
    };
    return {
        ...payload,
        documents: {
            schoolCertificate: strip(docs.schoolCertificate),
            guardianIdentityCopy: strip(docs.guardianIdentityCopy),
            studentIdentityCard: strip(docs.studentIdentityCard),
            healthAffiliationCertificate: strip(docs.healthAffiliationCertificate),
            additional: Array.isArray(docs.additional) ? docs.additional.map(strip) : []
        }
    };
}

function saveRequests(items) {
    try {
        localStorage.setItem(ENROLLMENT_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
        if (e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014)) {
            const trimmed = items.map(stripFileDataUrls);
            try {
                localStorage.setItem(ENROLLMENT_STORAGE_KEY, JSON.stringify(trimmed));
            } catch (e2) {
                throw new Error('No hay espacio suficiente para guardar la solicitud. Reduce el tamaño de los archivos adjuntos.');
            }
        } else {
            throw e;
        }
    }
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
    const size = Math.max(0, parseInt(file.size || '0', 10) || 0);
    if (size > ENROLLMENT_MAX_FILE_SIZE) {
        return {
            name: String(file.name || ''),
            type: String(file.type || ''),
            size: size,
            dataUrl: '',
            oversized: true
        };
    }
    return {
        name: String(file.name || ''),
        type: String(file.type || ''),
        size: size,
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
            gender: valueMap.studentGender || '',
            email: valueMap.studentEmail || ''
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
        setAlert('alertSuccess', true, 'Solicitud enviada. Pronto recibiras confirmacion en el correo de contacto.');
    } catch (e) {
        console.error('Error al enviar solicitud de matricula:', e);
        const msg = e && e.message ? e.message : 'No se pudo enviar la solicitud. Intenta nuevamente.';
        setAlert('alertError', true, msg);
    } finally {
        setLoading(false);
    }
}

async function syncEnrollmentFormFromBackend() {
    try {
        const res = await fetch('/api/config/enrollment-form-config');
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.value) {
            const parsed = JSON.parse(data.value);
            if (Array.isArray(parsed) && parsed.length) {
                localStorage.setItem(ENROLLMENT_FORM_STORAGE_KEY, JSON.stringify(parsed));
            }
        }
    } catch (e) {
        // ignorar: si falla, usaremos localStorage o defaults
    }
}

async function initEnrollmentForm() {
    await loadAcademicData();
    await syncEnrollmentFormFromBackend();
    loadEnrollmentFields();
    renderEnrollmentFormPage();
    const form = document.getElementById('enrollmentForm');
    if (form) form.addEventListener('submit', handleSubmit);
    window.addEventListener('storage', ev => {
        if (ev.key !== ENROLLMENT_FORM_STORAGE_KEY) return;
        loadEnrollmentFields();
        renderEnrollmentFormPage();
        setAlert('alertSuccess', false);
        setAlert('alertError', true, 'El formulario fue actualizado por administracion. Revisa los campos antes de enviar.');
    });
}

initEnrollmentForm();
