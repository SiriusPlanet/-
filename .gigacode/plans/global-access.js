// static/js/global-access.js
// Глобальная система защиты доступа - работает на ВСЕХ страницах
// Загружается ПЕРВЫМ делом на каждой HTML странице

import { PermissionManager } from './permission-manager.js';

/**
 * Глобальный промис для ожидания инициализации системы доступа
 * Все скрипты могут ждать: await window.__globalAccessPromise
 */
window.__globalAccessPromise = new Promise((resolve, reject) => {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            console.log('[GlobalAccess] Инициализация системы доступа...');
            
            // Создаем менеджер прав
            const pm = new PermissionManager();
            
            // Инициализируем
            await pm.init();
            
            // Сохраняем глобально
            window.permissionManager = pm;
            
            console.log('[GlobalAccess] PermissionManager инициализирован и готов к работе');
            
            // Разрешаем всем ждущим скриптам продолжить
            resolve(pm);
            
        } catch (error) {
            console.error('[GlobalAccess] Критическая ошибка инициализации:', error);
            reject(error);
        }
    });
});
