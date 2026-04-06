const API = 'http://localhost:8080';

function makeEyeToggle(btnId, inputId, iconId) {
    document.getElementById(btnId).addEventListener('click', () => {
        const inp = document.getElementById(inputId);
        const isPass = inp.type === 'password';
        inp.type = isPass ? 'text' : 'password';
        document.getElementById(iconId).innerHTML = isPass
            ? '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
            : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
    });
}

makeEyeToggle('togglePass', 'password', 'eyeIcon');
makeEyeToggle('togglePassConfirm', 'confirmPassword', 'eyeIconConfirm');

document.getElementById('password').addEventListener('input', function () {
    const val = this.value;
    const fill = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const configs = [
        { pct: '0%', color: 'transparent', text: 'Ingresa una contraseña', labelColor: 'var(--text-muted)' },
        { pct: '25%', color: '#E53E3E', text: 'Muy débil', labelColor: '#E53E3E' },
        { pct: '50%', color: '#DD6B20', text: 'Débil', labelColor: '#DD6B20' },
        { pct: '75%', color: '#D69E2E', text: 'Media', labelColor: '#D69E2E' },
        { pct: '100%', color: '#38A169', text: 'Fuerte', labelColor: '#38A169' }
    ];
    const cfg = configs[score];
    fill.style.width = cfg.pct;
    fill.style.background = cfg.color;
    label.textContent = cfg.text;
    label.style.color = cfg.labelColor;
});

function fieldErr(id, show) {
    document.getElementById(id).className = 'field-error' + (show ? ' show' : '');
}

function inputErr(id, show) {
    document.getElementById(id).className = 'form-input' + (show ? ' is-error' : '');
}

function setAlert(id, show, msg) {
    const el = document.getElementById(id);
    if (msg) el.querySelector('span:last-child').textContent = msg;
    el.classList.toggle('show', show);
}

function validateEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

document.getElementById('registerBtn').addEventListener('click', async () => {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirmPassword').value;
    const roleId = parseInt(document.querySelector('input[name=role]:checked').value);
    const terms = document.getElementById('terms').checked;

    ['nameErr', 'emailErr', 'passErr', 'confirmErr'].forEach(id => fieldErr(id, false));
    ['name', 'email', 'password', 'confirmPassword'].forEach(id => inputErr(id, false));
    setAlert('alertError', false);
    setAlert('alertSuccess', false);

    let valid = true;
    if (name.length < 2) { fieldErr('nameErr', true); inputErr('name', true); valid = false; }
    if (!validateEmail(email)) { fieldErr('emailErr', true); inputErr('email', true); valid = false; }
    if (password.length < 8) { fieldErr('passErr', true); inputErr('password', true); valid = false; }
    if (password !== confirm) { fieldErr('confirmErr', true); inputErr('confirmPassword', true); valid = false; }
    if (!terms) { setAlert('alertError', true, 'Debes aceptar los términos y condiciones.'); valid = false; }
    if (!valid) return;

    const btn = document.getElementById('registerBtn');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
        const body = { name, email, password, roleId, status: true };
        const res = await fetch(API + '/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.status === 201 || res.ok) {
            setAlert('alertSuccess', true);
            setTimeout(() => { window.location.href = 'login.html'; }, 2200);
        } else {
            const data = await res.json().catch(() => ({}));
            if (res.status === 409) {
                setAlert('alertError', true, 'Ya existe una cuenta con este correo electrónico.');
                inputErr('email', true);
            } else if (res.status === 400 && data.errors) {
                setAlert('alertError', true, Object.values(data.errors).join(' ') || 'Datos inválidos.');
            } else {
                setAlert('alertError', true, data.message || 'Error al crear la cuenta. Intenta de nuevo.');
            }
        }
    } catch (e) {
        setAlert('alertError', true, 'No se pudo conectar con el servidor. Verifica tu conexión.');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
});