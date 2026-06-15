// static/js/access-init.js
// Инициализация системы доступа - запускается ВСЕГДА первым делом

import { PermissionManager } from './permission-manager.js';

// Промис для ожидания инициализации
window.__accessInitPromise = new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', () => {
        const pm = new PermissionManager();
        pm.init();
        window.permissionManager = pm;
        console.log('[access-init] PermissionManager инициализирован');
        resolve(pm);
    });
});
