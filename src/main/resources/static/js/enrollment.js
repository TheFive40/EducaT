const ENROLLMENT_STORAGE_KEY = 'educat_enrollment_requests';

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

function normalize(value) {
    return String(value || '').trim();
}

function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validatePhone(value) {
    const only = String(value || '').replace(/[^0-9]/g, '');
    return only.length >= 7;
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
    const fields = [
        'studentName', 'studentDoc', 'studentBirthDate', 'studentGender',
        'level', 'grade', 'schedule', 'guardianName', 'guardianRelation',
        'contactPhone', 'contactEmail', 'address', 'notes'
    ];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const fileFields = [
        'schoolCertificateFile',
        'guardianDocumentFile',
        'studentIdentityCardFile',
        'healthAffiliationFile'
    ];
    fileFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const policy = document.getElementById('acceptPolicy');
    if (policy) policy.checked = false;
}

function getFirstFile(inputId) {
    const el = document.getElementById(inputId);
    const files = el && el.files ? el.files : null;
    return files && files[0] ? files[0] : null;
}

function mapFileMeta(file) {
    if (!file) return null;
    return {
        name: String(file.name || ''),
        type: String(file.type || ''),
        size: Math.max(0, parseInt(file.size || '0', 10) || 0)
    };
}

function validateForm() {
    const values = {
        studentName: normalize((document.getElementById('studentName') || {}).value),
        studentDoc: normalize((document.getElementById('studentDoc') || {}).value),
        studentBirthDate: normalize((document.getElementById('studentBirthDate') || {}).value),
        studentGender: normalize((document.getElementById('studentGender') || {}).value),
        level: normalize((document.getElementById('level') || {}).value),
        grade: normalize((document.getElementById('grade') || {}).value),
        schedule: normalize((document.getElementById('schedule') || {}).value),
        guardianName: normalize((document.getElementById('guardianName') || {}).value),
        guardianRelation: normalize((document.getElementById('guardianRelation') || {}).value),
        contactPhone: normalize((document.getElementById('contactPhone') || {}).value),
        contactEmail: normalize((document.getElementById('contactEmail') || {}).value),
        address: normalize((document.getElementById('address') || {}).value),
        notes: normalize((document.getElementById('notes') || {}).value)
    };

    const checks = [
        ['studentNameErr', !!values.studentName],
        ['studentDocErr', !!values.studentDoc],
        ['studentBirthDateErr', !!values.studentBirthDate],
        ['studentGenderErr', !!values.studentGender],
        ['levelErr', !!values.level],
        ['gradeErr', !!values.grade],
        ['scheduleErr', !!values.schedule],
        ['guardianNameErr', !!values.guardianName],
        ['guardianRelationErr', !!values.guardianRelation],
        ['contactPhoneErr', validatePhone(values.contactPhone)],
        ['contactEmailErr', validateEmail(values.contactEmail)],
        ['addressErr', !!values.address]
    ];

    const docs = {
        schoolCertificateFile: getFirstFile('schoolCertificateFile'),
        guardianDocumentFile: getFirstFile('guardianDocumentFile'),
        studentIdentityCardFile: getFirstFile('studentIdentityCardFile'),
        healthAffiliationFile: getFirstFile('healthAffiliationFile')
    };

    const docChecks = [
        ['schoolCertificateFileErr', !!docs.schoolCertificateFile],
        ['guardianDocumentFileErr', !!docs.guardianDocumentFile],
        ['studentIdentityCardFileErr', !!docs.studentIdentityCardFile]
    ];

    let valid = true;
    checks.forEach(([id, ok]) => {
        setFieldError(id, !ok);
        if (!ok) valid = false;
    });

    docChecks.forEach(([id, ok]) => {
        setFieldError(id, !ok);
        if (!ok) valid = false;
    });

    const accepted = !!((document.getElementById('acceptPolicy') || {}).checked);
    setFieldError('acceptPolicyErr', !accepted);
    if (!accepted) valid = false;

    return { valid, values, docs };
}

function buildEnrollmentPayload(values, docs) {
    return {
        id: 'enr-' + Date.now(),
        createdAt: new Date().toISOString(),
        status: 'pendiente',
        student: {
            name: values.studentName,
            document: values.studentDoc,
            birthDate: values.studentBirthDate,
            gender: values.studentGender
        },
        academic: {
            level: values.level,
            grade: values.grade,
            schedule: values.schedule
        },
        guardian: {
            name: values.guardianName,
            relation: values.guardianRelation,
            phone: values.contactPhone,
            email: values.contactEmail,
            address: values.address
        },
        notes: values.notes,
        documents: {
            schoolCertificate: mapFileMeta(docs.schoolCertificateFile),
            guardianIdentityCopy: mapFileMeta(docs.guardianDocumentFile),
            studentIdentityCard: mapFileMeta(docs.studentIdentityCardFile),
            healthAffiliationCertificate: mapFileMeta(docs.healthAffiliationFile)
        }
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

    const result = validateForm();
    if (!result.valid) {
        setAlert('alertError', true, 'Por favor completa los campos obligatorios para continuar.');
        return;
    }

    setLoading(true);
    try {
        const payload = buildEnrollmentPayload(result.values, result.docs);
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

const form = document.getElementById('enrollmentForm');
if (form) form.addEventListener('submit', handleSubmit);

