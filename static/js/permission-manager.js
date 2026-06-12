// static/js/permission-manager.js
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

    async checkLocalhostAccess() {
        // Если доступ уже был предоставлен через кнопку, возвращаем true сразу
        if (localStorage.getItem('access_granted_via_button') === 'true') {
            console.log('✅ Доступ уже предоставлен через кнопку, проверка localhost пропущена');
            this.hasLocalhostAccess = true;
            return true;
        }
        
        // Проверяем кэш - результат уже сохранён?
        const cachedChecked = localStorage.getItem('localhost_checked');
        const cachedHasAccess = localStorage.getItem('localhost_has_access');
        
        if (cachedChecked === 'true' && cachedHasAccess !== null) {
            this.hasLocalhostAccess = cachedHasAccess === 'true';
            console.log(this.hasLocalhostAccess ? '✅ Кэш: доступ к localhost есть' : '❌ Кэш: доступ к localhost отсутствует');
            return this.hasLocalhostAccess;
        }
        
        // Если кэша нет, это первый запуск - проверяем доступ
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const response = await fetch('/api/check-access', {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error('Сервер недоступен');
            }
            
            const data = await response.json();
            this.hasLocalhostAccess = true;
            console.log('✅ Доступ к localhost есть (сервер отвечает)');
            
            // Сохраняем результат проверки
            localStorage.setItem('localhost_checked', 'true');
            localStorage.setItem('localhost_has_access', 'true');
            
            if (data.access === true && data.level > 0) {
                this.accessLevels.setLevel(data.level);
            }
            
            return true;
        } catch (error) {
            this.hasLocalhostAccess = false;
            console.warn('⚠️ Доступ к localhost отсутствует (сервер недоступен)');
            console.debug('Ошибка проверки:', error.message);
            
            // Сохраняем результат проверки
            localStorage.setItem('localhost_checked', 'true');
            localStorage.setItem('localhost_has_access', 'false');
            return false;
        }
    }

    async requestAccess() {
        console.log('✅ Кнопка "Дать доступ" нажата - предоставляем локальный доступ');
        
        // В офлайн режиме сразу выдаем уровень 1 без запросов к серверу
        this.accessLevels.setLevel(1);
        
        console.log('✅ Временный доступ (уровень 1) предоставлен');
        return true;
    }

    grantPermission() {
        localStorage.setItem(this.storageKey, 'true');
        // Помечаем, что доступ предоставлен через кнопку, проверка localhost больше не нужна
        localStorage.setItem('access_granted_via_button', 'true');
        localStorage.setItem('localhost_checked', 'true');
        localStorage.setItem('localhost_has_access', 'false');
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
