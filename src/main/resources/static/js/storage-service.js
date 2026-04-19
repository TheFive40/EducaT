(function () {
    if (window.storageService && window.sessionService) return;

    function buildMemoryService() {
        const data = Object.create(null);
        const keys = [];
        function upsertKey(key) {
            if (keys.indexOf(key) === -1) keys.push(key);
        }
        function dropKey(key) {
            const idx = keys.indexOf(key);
            if (idx >= 0) keys.splice(idx, 1);
        }
        return {
            getItem: function (key) {
                key = String(key);
                return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
            },
            setItem: function (key, value) {
                key = String(key);
                data[key] = String(value);
                upsertKey(key);
            },
            removeItem: function (key) {
                key = String(key);
                delete data[key];
                dropKey(key);
            },
            clear: function () {
                keys.slice().forEach(k => delete data[k]);
                keys.length = 0;
            },
            key: function (index) {
                index = Number(index);
                if (isNaN(index) || index < 0 || index >= keys.length) return null;
                return keys[index];
            },
            get length() {
                return keys.length;
            }
        };
    }

    window.storageService = buildMemoryService();
    window.sessionService = buildMemoryService();
})();

