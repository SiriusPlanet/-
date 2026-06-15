// static/js/access-init.js
// Инициализация системы доступа - запускается ВСЕГДА первым делом
// Теперь работает глобально на всех страницах

import { PermissionManager } from './permission-manager.js';

// Глобальный промис для ожидания инициализации системы доступа
// Все скрипты могут ждать: await window.__globalAccessPromise
window.__globalAccessPromise = new Promise((resolve, reject) => {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            console.log('[access-init] Инициализация PermissionManager...');
            
            const pm = new PermissionManager();
            
            // Инициализируем (проверяет доступ, показывает завесу если нужно)
            await pm.init();
            
            // Сохраняем глобально
            window.permissionManager = pm;
            
            console.log('[access-init] PermissionManager инициализирован и готов');
            resolve(pm);
        } catch (error) {
            console.error('[access-init] Критическая ошибка:', error);
            reject(error);
        }
    });
});
