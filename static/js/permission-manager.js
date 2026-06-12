// static/js/permission-manager.js
// не имеет отношения к регистрациям
// должна делаться но проверять за 2мс если есть доступ локалсторедж завеса с кнопкой не появляется
// это про дотуп сайта к собственному функцианалу

import { AccessLevels } from './access-levels.js';

export class PermissionManager {
    constructor() {
        this.storageKey = 'permissions_granted';
        this.accessLevels = new AccessLevels();
        this.isPaused = false;
        this.hasLocalhostAccess = false;
        this.initElements();
    }

    hasPermission() {
        return this.accessLevels.getLevel() > 0;
    }

    getPermissionLevel() {
        return this.accessLevels.getLevel();
    }

    setPermissionLevel(level) {
        this.accessLevels.setLevel(level);
    }

    initElements() {
        this.button = document.getElementById('fileAccessButton');
        this.overlay = document.getElementById('access-overlay');
        this.container = document.querySelector('.access-button');
    }

    showOverlay() {
        if (!this.overlay) return;
        this.overlay.style.display = 'block';
        this.overlay.style.pointerEvents = 'auto';
        if (this.container) {
            this.container.style.display = 'flex';
        }
    }

    hideOverlay() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
            this.overlay.style.pointerEvents = 'none';
        }
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

{"text": "    async checkLocalhostAccess() {\n        // Проверяем кэш - результат уже сохранён?\n        const cachedChecked = localStorage.getItem('localhost_checked');\n        const cachedHasAccess = localStorage.getItem('localhost_has_access');\n        \n        if (cachedChecked === 'true' && cachedHasAccess !== null) {\n            this.hasLocalhostAccess = cachedHasAccess === 'true';\n            console.log(this.hasLocalhostAccess ? '✅ Кэш: доступ к localhost есть' : '❌ Кэш: доступ к localhost отсутствует');\n            return this.hasLocalhostAccess;\n        }\n        \n        let timeoutId;\n        try {"}
            const controller = new AbortController();
            timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const response = await fetch('/api/check-access', {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error('Сервер недоступен');
            }
            
{"text": "            const data = await response.json();\n            this.hasLocalhostAccess = true;\n            console.log('✅ Доступ к localhost есть (сервер отвечает)');\n            \n            // Сохраняем результат проверки\n            localStorage.setItem('localhost_checked', 'true');\n            localStorage.setItem('localhost_has_access', 'true');\n            \n            if (data.access === true && data.level > 0) {\n                this.accessLevels.setLevel(data.level);\n            }\n            \n            return true;\n        } catch (error) {\n            clearTimeout(timeoutId);\n            this.hasLocalhostAccess = false;\n            console.warn('⚠️ Доступ к localhost отсутствует (сервер недоступен)');\n            console.debug('Ошибка проверки:', error.message);\n            \n            // Сохраняем результат проверки\n            localStorage.setItem('localhost_checked', 'true');\n            localStorage.setItem('localhost_has_access', 'false');\n            return false;\n        }"}
    }

    async requestAccess() {
        console.log('✅ Кнопка "Дать доступ" нажата - предоставляем локальный доступ');
        
        const savedLevel = this.accessLevels.getLevel();
        if (savedLevel > 0) {
            console.log(`✅ Используем сохранённый уровень ${savedLevel}`);
            return true;
        }
        
        console.log('✅ Временный доступ (уровень 1)');
        this.accessLevels.setLevel(1);
        return true;
    }

    grantPermission() {
        localStorage.setItem(this.storageKey, 'true');
        this.hideOverlay();
        document.body.classList.add('access-granted');
        console.log('✅ Доступ предоставлен');
    }

    async init() {
        if (this.isPaused) return;

        await this.checkLocalhostAccess();

        if (this.hasLocalhostAccess) {
            console.log('✅ Доступ к localhost есть — кнопка "Получить доступ" скрыта');
            this.hideOverlay();
            
            if (this.hasPermission()) {
                document.body.classList.add('access-granted');
            }
            return;
        }

        console.log('❌ Доступ к localhost отсутствует — показываем кнопку "Получить доступ"');
        this.showOverlay();

        if (this.button) {
            this.button.addEventListener('click', async () => {
                const hasAccess = await this.requestAccess();
                if (hasAccess) {
                    this.grantPermission();
                }
            });
        }
    }
}

window.permissionManager = null;

document.addEventListener('DOMContentLoaded', () => {
    const pm = new PermissionManager();
    pm.init();
    window.permissionManager = pm;
    console.log('[PermissionManager] Инициализирован и сохранён в window.permissionManager');
});
