const API = 'http://localhost:8080';

function showToast(msg, type) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast' + (type ? ' ' + type : '') + ' show';
    setTimeout(() => { t.className = 'toast'; }, 3500);
}

function animateCount(el, target, suffix) {
    let current = 0;
    const duration = 1400;
    const step = target / 60;
    const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = Math.floor(current) + (suffix || '');
        if (current >= target) clearInterval(timer);
    }, duration / 60);
}

async function loadPublicData() {
    try {
        const [newsRes, forumsRes] = await Promise.allSettled([
            fetch(API + '/api/news', { headers: { 'Authorization': 'Basic ' + btoa('admin:admin') } }),
            fetch(API + '/api/forums', { headers: { 'Authorization': 'Basic ' + btoa('admin:admin') } })
        ]);

        if (newsRes.status === 'fulfilled' && newsRes.value.ok) {
            const news = await newsRes.value.json();
            document.getElementById('news-count').textContent = news.length || 0;
            const list = document.getElementById('news-list');
            list.innerHTML = '';
            if (!news.length) {
                list.innerHTML = '<div class="loading-text">Sin noticias disponibles</div>';
                return;
            }
            news.slice(0, 3).forEach(n => {
                const d = new Date(n.createdAt);
                const date = isNaN(d) ? '' : (d.getMonth() + 1) + '/' + d.getDate();
                list.innerHTML += `<div class="comm-item"><div class="comm-item-dot"></div><span class="comm-item-text">${n.title}</span><span class="comm-item-date">${date}</span></div>`;
            });
        } else {
            document.getElementById('news-count').textContent = '—';
            document.getElementById('news-list').innerHTML = '<div class="loading-text">No disponible</div>';
        }

        if (forumsRes.status === 'fulfilled' && forumsRes.value.ok) {
            const forums = await forumsRes.value.json();
            document.getElementById('forum-count').textContent = forums.length || 0;
            const list = document.getElementById('forums-list');
            list.innerHTML = '';
            if (!forums.length) {
                list.innerHTML = '<div class="loading-text">Sin foros disponibles</div>';
                return;
            }
            forums.slice(0, 3).forEach(f => {
                list.innerHTML += `<div class="comm-item"><div class="comm-item-dot"></div><span class="comm-item-text">${f.title}</span></div>`;
            });
        } else {
            document.getElementById('forum-count').textContent = '—';
            document.getElementById('forums-list').innerHTML = '<div class="loading-text">No disponible</div>';
        }
    } catch (e) {
        document.getElementById('news-list').innerHTML = '<div class="loading-text">Sin conexión al servidor</div>';
        document.getElementById('forums-list').innerHTML = '<div class="loading-text">Sin conexión al servidor</div>';
    }
}

function checkReveal() {
    document.querySelectorAll('.reveal').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 80) el.classList.add('visible');
    });
}

window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40);
    checkReveal();
});

document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.toggle('open');
});

document.querySelectorAll('.mobile-menu a').forEach(a => {
    a.addEventListener('click', () => {
        document.getElementById('mobileMenu').classList.remove('open');
    });
});

window.addEventListener('load', () => {
    checkReveal();
    loadPublicData();
    setTimeout(() => {
        animateCount(document.getElementById('countStudents'), 1240, '+');
        animateCount(document.getElementById('countCourses'), 87, '');
        animateCount(document.getElementById('countTeachers'), 64, '');
    }, 1000);
});