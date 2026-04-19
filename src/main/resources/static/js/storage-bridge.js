(function () {
    if (window.__educatStorageBridgeReady) return;
    window.__educatStorageBridgeReady = true;

    var nativeStorage = window.localStorage;
    var API_BASE = (window.location && window.location.origin) ? window.location.origin : 'http://localhost:8080';
    var API_ROOT = API_BASE + '/api/app-state';
    var CACHE = Object.create(null);
    var ORDER = [];

    function addKey(key) {
        if (ORDER.indexOf(key) === -1) ORDER.push(key);
    }

    function removeKey(key) {
        var idx = ORDER.indexOf(key);
        if (idx >= 0) ORDER.splice(idx, 1);
    }

    function readAuthToken() {
        var raw = '';
        try {
            raw = sessionStorage.getItem('educat_auth') || CACHE['educat_auth'] || nativeStorage.getItem('educat_auth') || '';
        } catch (e) {
            raw = sessionStorage.getItem('educat_auth') || CACHE['educat_auth'] || '';
        }
        raw = String(raw || '').trim();
        if (!raw) return '';
        if (/^(Basic|Bearer)\s+/i.test(raw)) return raw;
        return 'Basic ' + raw;
    }

    function buildHeaders(json) {
        var headers = {};
        if (json !== false) headers['Content-Type'] = 'application/json';
        var auth = readAuthToken();
        if (auth) headers.Authorization = auth;
        return headers;
    }

    function safeParse(jsonText) {
        try {
            return JSON.parse(jsonText);
        } catch (e) {
            return null;
        }
    }

    function hydrateFromBackendSync() {
        try {
            var req = new XMLHttpRequest();
            req.open('GET', API_ROOT + '?prefix=educat_', false);
            var auth = readAuthToken();
            if (auth) req.setRequestHeader('Authorization', auth);
            req.send(null);
            if (req.status >= 200 && req.status < 300) {
                var data = safeParse(req.responseText);
                if (data && typeof data === 'object') {
                    Object.keys(data).forEach(function (key) {
                        var value = data[key];
                        CACHE[key] = value === null || value === undefined ? null : String(value);
                        addKey(key);
                    });
                }
            }
        } catch (e) {
            // Si backend no responde, se mantiene cache vacio y se sigue operando.
        }
    }

    function migrateBrowserLocalStorage() {
        var keys = [];
        try {
            for (var i = 0; i < nativeStorage.length; i++) {
                var key = nativeStorage.key(i);
                if (key && key.indexOf('educat_') === 0) keys.push(key);
            }
        } catch (e) {
            return;
        }
        keys.forEach(function (key) {
            try {
                var value = nativeStorage.getItem(key);
                if (!(key in CACHE)) {
                    CACHE[key] = value;
                    addKey(key);
                    queueUpsert(key, value);
                }
                nativeStorage.removeItem(key);
            } catch (e) {
                // Ignorar item dañado.
            }
        });
    }

    function queueUpsert(key, value) {
        fetch(API_ROOT + '/' + encodeURIComponent(key), {
            method: 'PUT',
            headers: buildHeaders(true),
            body: JSON.stringify({ value: value === null || value === undefined ? '' : String(value) })
        }).catch(function () {});
    }

    function queueDelete(key) {
        fetch(API_ROOT + '/' + encodeURIComponent(key), {
            method: 'DELETE',
            headers: buildHeaders(false)
        }).catch(function () {});
    }

    hydrateFromBackendSync();
    migrateBrowserLocalStorage();

    var bridgedStorage = {
        get length() {
            return ORDER.length;
        },
        key: function (index) {
            index = Number(index);
            if (isNaN(index) || index < 0 || index >= ORDER.length) return null;
            return ORDER[index];
        },
        getItem: function (key) {
            key = String(key);
            if (!(key in CACHE)) return null;
            var val = CACHE[key];
            return val === null || val === undefined ? null : String(val);
        },
        setItem: function (key, value) {
            key = String(key);
            value = value === null || value === undefined ? 'null' : String(value);
            CACHE[key] = value;
            addKey(key);
            queueUpsert(key, value);
        },
        removeItem: function (key) {
            key = String(key);
            if (!(key in CACHE)) return;
            delete CACHE[key];
            removeKey(key);
            queueDelete(key);
        },
        clear: function () {
            ORDER.slice().forEach(function (key) {
                delete CACHE[key];
                queueDelete(key);
            });
            ORDER = [];
        }
    };

    try {
        Object.defineProperty(window, 'localStorage', {
            value: bridgedStorage,
            configurable: false,
            enumerable: true,
            writable: false
        });
    } catch (e) {
        window.localStorage = bridgedStorage;
    }
})();


