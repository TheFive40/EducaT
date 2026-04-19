const API = '';

const params = new URLSearchParams(window.location.search);
const role = params.get('role');
const redirectParam = params.get('redirect');
const ROLE_CLASS = {
    teacher: 'role-teacher',
    student: 'role-student',
    staff: 'role-staff'
};

if (ROLE_CLASS[role]) {
    document.body.classList.add(ROLE_CLASS[role]);
}

if (role) {
    const badge = document.getElementById('roleBadge');
    const text = document.getElementById('roleText');
    badge.style.display = 'inline-flex';
    text.textContent = role === 'teacher'
        ? 'Portal Docente'
        : (role === 'staff' ? 'Portal Funcionarios' : 'Portal Estudiantil');
}

function resolveRedirectTarget() {
    const safe = String(redirectParam || '').trim();
    if (!safe || !safe.startsWith('/')) {
        return role === 'student' ? '/student-dashboard' : (role === 'teacher' ? '/teacher-dashboard' : '/admin-dashboard');
    }
    return safe;
}

function resolveRedirectByUserRole(user) {
    const roleName = String(((user || {}).role || {}).name || '').toUpperCase();
    if (roleName === 'ESTUDIANTE') return '/student-dashboard';
    if (roleName === 'DOCENTE' || roleName === 'TEACHER') return '/teacher-dashboard';
    return '/admin-dashboard';
}

function resolveRedirectByEffectivePortals(access) {
    const portals = access && access.portals ? access.portals : {};
    if (portals.admin) return '/admin-dashboard';
    if (portals.teacher) return '/teacher-dashboard';
    if (portals.student) return '/student-dashboard';
    return '/';
}

document.getElementById('togglePass').addEventListener('click', function () {
    const inp = document.getElementById('password');
    const isPass = inp.type === 'password';
    inp.type = isPass ? 'text' : 'password';
    document.getElementById('eyeIcon').innerHTML = isPass
        ? '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
        : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
});

function setAlert(id, show, msg) {
    const el = document.getElementById(id);
    if (msg) el.querySelector('span:last-child').textContent = msg;
    el.classList.toggle('show', show);
}

function validateEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    document.getElementById('emailErr').className = 'field-error';
    document.getElementById('passErr').className = 'field-error';
    document.getElementById('email').className = 'form-input';
    document.getElementById('password').className = 'form-input';
    setAlert('alertError', false);
    setAlert('alertSuccess', false);

    let valid = true;
    if (!validateEmail(email)) {
        document.getElementById('emailErr').className = 'field-error show';
        document.getElementById('email').className = 'form-input is-error';
        valid = false;
    }
    if (password.length < 8) {
        document.getElementById('passErr').className = 'field-error show';
        document.getElementById('password').className = 'form-input is-error';
        valid = false;
    }
    if (!valid) return;

    const btn = document.getElementById('loginBtn');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
        const res = await fetch(API + '/api/auth/login', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, remember })
        });

        if (res.ok) {
            const user = await res.json();
            setAlert('alertSuccess', true);
            let target = redirectParam ? resolveRedirectTarget() : resolveRedirectByUserRole(user);
            if (!redirectParam) {
                try {
                    const accessRes = await fetch(API + '/api/access/me', { credentials: 'include' });
                    if (accessRes.ok) {
                        const access = await accessRes.json();
                        target = resolveRedirectByEffectivePortals(access);
                    }
                } catch (e) {
                    // Si falla este fetch, se mantiene redirección por rol.
                }
            }
            setTimeout(() => { window.location.href = target; }, 700);
        } else if (res.status === 401 || res.status === 403) {
            setAlert('alertError', true, 'Credenciales incorrectas. Verifica tu correo y contraseña.');
        } else {
            setAlert('alertError', true, 'Error al conectar con el servidor. Intenta de nuevo.');
        }
    } catch (e) {
        setAlert('alertError', true, 'No se pudo conectar con el servidor. Verifica tu conexión.');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
});

document.querySelectorAll('.form-input').forEach(inp => {
    inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('loginBtn').click();
    });
});