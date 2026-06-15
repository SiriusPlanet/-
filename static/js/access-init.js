// static/js/access-init.js
// Инициализация системы доступа - запускается ВСЕГДА первым делом

import { PermissionManager } from './permission-manager.js';

// Инициализируем PermissionManager сразу
const pm = new PermissionManager();
pm.init();
window.permissionManager = pm;
console.log('[access-init] PermissionManager инициализирован');
