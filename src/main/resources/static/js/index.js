const API = '';
console.log('>>> EDUCAT INDEX JS V2025 CARGADO <<<');

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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' +
           d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function renderContentCard(item, type) {
    const cover = item.coverImage || '';
    const title = escapeHtml(item.title || 'Sin título');
    const date = type === 'event'
        ? formatDateTime(item.eventDate || item.createdAt)
        : formatDate(item.publishedAt || item.createdAt);
    const location = escapeHtml(item.location || '');
    const summary = escapeHtml((item.summary || '').substring(0, 90));

    const btnStyle = 'margin-top:auto;padding:10px 18px;font-size:13px;font-weight:600;letter-spacing:0.3px;color:#fff;background:#0b2138;border:none;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;align-self:flex-start;';

    let meta = '';
    let actionHtml = '';
    if (type === 'news') {
        meta = `<div class="comm-card-date">${date}</div>`;
        actionHtml = `<button style="${btnStyle}" class="comm-card-btn" data-id="${item.id}" data-type="${type}">Leer noticia
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>`;
    } else if (type === 'article') {
        meta = `<div class="comm-card-date">${date}</div>`;
        actionHtml = `<button style="${btnStyle}" class="comm-card-btn" data-id="${item.id}" data-type="${type}">Leer artículo
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>`;
    } else if (type === 'event') {
        meta = `<div class="comm-card-meta">${location ? location + ' · ' : ''}${date}</div>`;
        actionHtml = `<button style="${btnStyle}" class="comm-card-btn" data-id="${item.id}" data-type="${type}">Ver detalles
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>`;
    }

    const imgHtml = cover
        ? `<img class="comm-card-img" src="${escapeHtml(cover)}" alt="${title}" loading="lazy" onerror="this.style.display='none'">`
        : `<div class="comm-card-img" style="background:linear-gradient(135deg,#eef4fb,#dbeafe)"></div>`;

    return `<div class="comm-card comm-card--content reveal">
        ${imgHtml}
        <div class="comm-card-body">
            ${meta}
            <div class="comm-card-title">${title}</div>
            ${type !== 'event' && summary ? `<div class="comm-card-meta">${summary}...</div>` : ''}
            ${actionHtml}
        </div>
    </div>`;
}

function bindContentCardButtons() {
    document.querySelectorAll('.comm-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const type = btn.dataset.type;
            openContentModal(type, id);
        });
    });
}

function openContentModal(type, id) {
    let endpoint = '';
    if (type === 'news') endpoint = `/api/news/${id}`;
    else if (type === 'article') endpoint = `/api/articles/${id}`;
    else if (type === 'event') endpoint = `/api/events/${id}`;

    fetch(API + endpoint, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
            if (!data) return showToast('No se pudo cargar el contenido', 'error');

            const title = escapeHtml(data.title || '');
            const cover = data.coverImage
                ? `<div style="text-align:center;margin-bottom:20px"><img src="${escapeHtml(data.coverImage)}" style="max-width:100%;height:auto;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1)" onerror="this.style.display='none'"></div>`
                : '';

            if (type === 'event') {
                const location = escapeHtml(data.location || '');
                const eventDateTime = formatDateTime(data.eventDate);
                const modalHtml = `<div style="max-width:720px">
                    ${cover}
                    <h2 style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:700;margin-bottom:14px;color:var(--text-dark)">${title}</h2>
                    <div style="font-size:14px;color:var(--text-body);line-height:1.75;margin-bottom:10px">
                        <strong>Lugar:</strong> ${location || 'Por definir'}<br>
                        <strong>Fecha y hora:</strong> ${eventDateTime || 'Por definir'}
                    </div>
                    <div style="display:flex;justify-content:flex-end;margin-top:20px">
                        <button class="btn btn-outline" onclick="closeContentModal()" style="padding:8px 18px;font-size:13px">Cerrar</button>
                    </div>
                </div>`;
                openModal(title, modalHtml);
                return;
            }

            const body = (data.content || '').replace(/\n/g, '<br>');
            const date = formatDate(data.publishedAt || data.createdAt);
            const author = escapeHtml(data.author || '');
            const modalHtml = `<div style="max-width:720px">
                ${cover}
                <div style="font-size:12px;color:var(--text-light);margin-bottom:6px">${date}${author ? ' · Por ' + author : ''}</div>
                <h2 style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:700;margin-bottom:14px;color:var(--text-dark)">${title}</h2>
                <div style="font-size:14px;color:var(--text-body);line-height:1.75">${body}</div>
                <div style="display:flex;justify-content:flex-end;margin-top:20px">
                    <button class="btn btn-outline" onclick="closeContentModal()" style="padding:8px 18px;font-size:13px">Cerrar</button>
                </div>
            </div>`;
            openModal(title, modalHtml);
        })
        .catch(() => showToast('Error de conexión', 'error'));
}

function openModal(title, bodyHtml) {
    let backdrop = document.getElementById('contentModalBackdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'contentModalBackdrop';
        backdrop.innerHTML = `<div id="contentModalDialog" style="background:#fff;padding:28px;border-radius:12px;max-width:760px;width:90%;max-height:90vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,0.25);position:relative">
            <button onclick="closeContentModal()" style="position:absolute;top:14px;right:14px;background:none;border:none;cursor:pointer;font-size:20px;color:var(--text-light)">&times;</button>
            <div id="contentModalBody"></div>
        </div>`;
        backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(11,31,58,0.55);display:flex;align-items:center;justify-content:center;z-index:10000;opacity:0;transition:opacity 0.25s ease';
        document.body.appendChild(backdrop);
    }
    document.getElementById('contentModalBody').innerHTML = bodyHtml;
    requestAnimationFrame(() => backdrop.style.opacity = '1');
    backdrop.style.display = 'flex';
    backdrop.onclick = (e) => { if (e.target === backdrop) closeContentModal(); };
}

function closeContentModal() {
    const backdrop = document.getElementById('contentModalBackdrop');
    if (!backdrop) return;
    backdrop.style.opacity = '0';
    setTimeout(() => { backdrop.style.display = 'none'; }, 250);
}

const contentState = {
    news: { items: [], visible: 3 },
    events: { items: [], visible: 3 },
    articles: { items: [], visible: 3 }
};

function renderSection(type, itemsContainerId, headerId, countId, moreBtnId) {
    const itemsContainer = document.getElementById(itemsContainerId);
    const header = document.getElementById(headerId);
    const countEl = document.getElementById(countId);
    const moreBtn = document.getElementById(moreBtnId);
    const state = contentState[type];
    if (!itemsContainer) return;

    itemsContainer.innerHTML = '';

    if (!state.items.length) {
        if (header) header.style.display = 'none';
        if (moreBtn) moreBtn.style.display = 'none';
        if (countEl) countEl.textContent = '0';
        return;
    }

    if (header) header.style.display = '';
    if (countEl) countEl.textContent = state.items.length;

    const toShow = state.items.slice(0, state.visible);
    itemsContainer.innerHTML = toShow.map(item => renderContentCard(item, type)).join('');
    bindContentCardButtons();

    if (moreBtn) {
        moreBtn.style.display = state.items.length > state.visible ? '' : 'none';
        moreBtn.onclick = () => {
            state.visible = state.items.length;
            renderSection(type, itemsContainerId, headerId, countId, moreBtnId);
            checkReveal();
        };
    }
}

async function loadPublicData() {
    try {
        const [newsRes, eventsRes, articlesRes] = await Promise.allSettled([
            fetch(API + '/api/news', { credentials: 'include' }),
            fetch(API + '/api/events', { credentials: 'include' }),
            fetch(API + '/api/articles', { credentials: 'include' })
        ]);

        if (newsRes.status === 'fulfilled' && newsRes.value.ok) {
            contentState.news.items = await newsRes.value.json();
        }
        if (eventsRes.status === 'fulfilled' && eventsRes.value.ok) {
            contentState.events.items = await eventsRes.value.json();
        }
        if (articlesRes.status === 'fulfilled' && articlesRes.value.ok) {
            contentState.articles.items = await articlesRes.value.json();
        }

        renderSection('news', 'news-items', 'news-header', 'news-count', 'news-load-more');
        renderSection('events', 'events-items', 'events-header', 'events-count', 'events-load-more');
        renderSection('articles', 'articles-items', 'articles-header', 'articles-count', 'articles-load-more');

        setTimeout(checkReveal, 100);
    } catch (e) {
        document.getElementById('news-items').innerHTML = '<div class="loading-text">Sin conexión al servidor</div>';
        document.getElementById('events-items').innerHTML = '<div class="loading-text">Sin conexión al servidor</div>';
        document.getElementById('articles-items').innerHTML = '<div class="loading-text">Sin conexión al servidor</div>';
    }
}

function checkReveal() {
    document.querySelectorAll('.reveal').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 80) el.classList.add('visible');
    });
}

function getStoredAuth() {
    return localStorage.getItem('educat_auth') || sessionStorage.getItem('educat_auth') || '';
}

function resolveAccessTarget(roleValue, dashboardValue) {
    const role = String(roleValue || '').toLowerCase();
    const dashboard = String(dashboardValue || '').trim();
    const targetDashboard = dashboard || ({
        teacher: '/teacher-dashboard',
        student: '/student-dashboard',
        staff: '/admin-dashboard'
    }[role] || '/');
    return {
        role,
        dashboard: targetDashboard,
        login: '/login?role=' + encodeURIComponent(role) + '&redirect=' + encodeURIComponent(targetDashboard)
    };
}

function handleAccessCardClick(ev) {
    const card = ev.currentTarget;
    const target = resolveAccessTarget(card.dataset.role, card.dataset.dashboard);
    if (getStoredAuth()) {
        ev.preventDefault();
        window.location.href = target.dashboard;
        return;
    }
    card.setAttribute('href', target.login);
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

document.querySelectorAll('.access-card[data-role]').forEach(card => {
    card.addEventListener('click', handleAccessCardClick);
});
