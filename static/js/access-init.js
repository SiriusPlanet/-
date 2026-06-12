// static/js/access-init.js
// Инициализация системы доступа - запускается ВСЕГДА первым делом

import { PermissionManager } from './permission-manager.js';

// Инициализируем PermissionManager при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('[access-init] Запуск инициализации доступа...');
    
    const pm = new PermissionManager();
    pm.init();
    
    console.log('[access-init] Инициализация доступа завершена');
});
