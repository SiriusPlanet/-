// static/js/access-init.js
// Инициализация системы доступа - запускается ВСЕГДА первым делом

import { PermissionManager } from './permission-manager.js';

// Гарантируем, что PermissionManager инициализируется до main.js
window.__accessInitPromise = new Promise((resolve) => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            resolve();
        });
    } else {
        resolve();
    }
});

console.log('[access-init] Модуль доступа загружен, ждём DOMContentLoaded');
