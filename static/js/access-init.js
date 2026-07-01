// static/js/access-init.js
// Инициализация системы доступа - запускается ВСЕГДА первым делом

import { PermissionManager } from './permission-manager.js';

// P1-2: DEV_MODE — тестовый режим
// true: все уровни игнорируются, всё видно (для разработки)
// false: нормальная работа по уровням доступа
const DEV_MODE = false;

/**
 * Сканирует DOM и показывает/скрывает элементы с атрибутом data-access-required
 * в зависимости от текущего уровня доступа пользователя.
 * @param {number} userLevel - текущий уровень доступа (0-3)
 */
function applyAccessRestrictions(userLevel) {
    // P1-2: В DEV_MODE всё видно
    if (DEV_MODE) {
        const restrictedElements = document.querySelectorAll('[data-access-required]');
        restrictedElements.forEach(el => { el.style.display = ''; });
        return;
    }

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

// P1-2: Функция переключения DEV_MODE
window.toggleDevMode = function() {
    const current = localStorage.getItem('mySiteDevMode') === 'true';
    const newVal = !current;
    localStorage.setItem('mySiteDevMode', newVal ? 'true' : 'false');
    location.reload();
};

// Глобальный промис для ожидания инициализации системы доступа
window.__globalAccessPromise = new Promise((resolve, reject) => {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            console.log('[access-init] Инициализация PermissionManager...');
            
            const pm = new PermissionManager();
            
            // Инициализируем (проверяет доступ, показывает завесу если нужно)
            await pm.init();
            
            // Сохраняем глобально
            window.permissionManager = pm;
            
            // P1-2: Проверяем DEV_MODE в localStorage
            const isDevMode = DEV_MODE || localStorage.getItem('mySiteDevMode') === 'true';
            
            // Применяем ограничения доступа к элементам с data-access-required
            const userLevel = pm.getPermissionLevel();
            applyAccessRestrictions(isDevMode ? 3 : userLevel);
            
            // Вешаем слушатель на изменение уровня доступа
            const originalSetLevel = pm.setPermissionLevel.bind(pm);
            pm.setPermissionLevel = function(level) {
                originalSetLevel(level);
                applyAccessRestrictions(isDevMode ? 3 : level);
            };
            
            // Вешаем слушатель на кнопку "Получить доступ"
            if (pm.button) {
                pm.button.addEventListener('click', async () => {
                    console.log('[access-init] Клик по кнопке "Получить доступ"');
                    await pm.requestAccess();
                    // Перезагружаем страницу после получения доступа
                    setTimeout(() => {
                        location.reload();
                    }, 500);
                });
            }
            
            console.log('[access-init] PermissionManager инициализирован и готов');
            resolve(pm);
        } catch (error) {
            console.error('[access-init] Критическая ошибка:', error);
            reject(error);
        }
    });
});
