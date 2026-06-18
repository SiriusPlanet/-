// static/js/access-init.js
// Инициализация системы доступа - запускается ВСЕГДА первым делом
// Теперь работает глобально на всех страницах

import { PermissionManager } from './permission-manager.js';

/**
 * Сканирует DOM и показывает/скрывает элементы с атрибутом data-access-required
 * в зависимости от текущего уровня доступа пользователя.
 * @param {number} userLevel - текущий уровень доступа (0-3)
 */
function applyAccessRestrictions(userLevel) {
    const restrictedElements = document.querySelectorAll('[data-access-required]');
    let count = 0;
    restrictedElements.forEach(el => {
        const requiredLevel = parseInt(el.getAttribute('data-access-required'), 10);
        if (isNaN(requiredLevel)) return;
        
        if (userLevel >= requiredLevel) {
            el.style.display = '';
            count++;
        } else {
            el.style.display = 'none';
        }
    });
    if (count > 0) {
        console.log(`[access-init] Показано ${count} элементов с data-access-required (уровень ${userLevel})`);
    }
}

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
            
            // Применяем ограничения доступа к элементам с data-access-required
            const userLevel = pm.getPermissionLevel();
            applyAccessRestrictions(userLevel);
            
            // Вешаем слушатель на изменение уровня доступа (если кто-то вызовет setLevel)
            const originalSetLevel = pm.setPermissionLevel.bind(pm);
            pm.setPermissionLevel = function(level) {
                originalSetLevel(level);
                applyAccessRestrictions(level);
            };
            
            console.log('[access-init] PermissionManager инициализирован и готов');
            resolve(pm);
        } catch (error) {
            console.error('[access-init] Критическая ошибка:', error);
            reject(error);
        }
    });
});
