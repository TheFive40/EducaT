const API = 'http://localhost:8080';

function validateEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

document.getElementById('recoverBtn').addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();

    document.getElementById('emailErr').className = 'field-error';
    document.getElementById('email').className = 'form-input';
    document.getElementById('alertError').className = 'alert-box is-error';

    if (!validateEmail(email)) {
        document.getElementById('emailErr').className = 'field-error show';
        document.getElementById('email').className = 'form-input is-error';
        return;
    }

    const btn = document.getElementById('recoverBtn');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
        await fetch(API + '/api/users', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        await new Promise(r => setTimeout(r, 1200));

        document.getElementById('sentEmail').textContent = email;
        document.getElementById('formSection').style.display = 'none';
        document.getElementById('successSection').className = 'success-state show';

        let seconds = 10;
        const cntEl = document.getElementById('countdown');
        cntEl.textContent = 'Redirigiendo al inicio de sesión en ' + seconds + ' segundos...';
        const timer = setInterval(() => {
            seconds--;
            if (seconds <= 0) {
                clearInterval(timer);
                window.location.href = 'login.html';
            } else {
                cntEl.textContent = 'Redirigiendo al inicio de sesión en ' + seconds + ' segundos...';
            }
        }, 1000);
    } catch (e) {
        document.getElementById('alertError').className = 'alert-box is-error show';
        document.getElementById('alertErrorText').textContent = 'No se pudo conectar con el servidor. Intenta más tarde.';
        btn.classList.remove('loading');
        btn.disabled = false;
    }
});

document.getElementById('email').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('recoverBtn').click();
});