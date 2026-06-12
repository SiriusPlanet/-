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
        // ✅ Есть доступ, если уровень > 0
        return this.accessLevels.getLevel() > 0;
    }

    getPermissionLevel() {
        // Возвращает текущий уровень доступа (0-3)
        return this.accessLevels.getLevel();
    }

    setPermissionLevel(level) {
        // Устанавливает уровень доступа
        this.accessLevels.setLevel(level);
    }

    initElements() {
        // Находим элементы — если есть
        this.button = document.getElementById('fileAccessButton');
        this.overlay = document.getElementById('access-overlay');
        this.container = document.querySelector('.access-button');
    }

    showOverlay() {
        // ✅ Показываем, если они есть (в HTML)
        if (!this.overlay) return;
        this.overlay.style.display = 'block';
        this.overlay.style.pointerEvents = 'auto';
        if (this.container) {
            this.container.style.display = 'flex';
        }
    }

    hideOverlay() {
        // ✅ Скрываем без удаления — просто display: none
        if (this.overlay) {
            this.overlay.style.display = 'none';
            this.overlay.style.pointerEvents = 'none';
        }
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    async checkLocalhostAccess() {
        // Проверка доступности localhost (сервера)
        let timeoutId;
        try {
            const controller = new AbortController();
            timeoutId = setTimeout(() => controller.abort(), 2000); // 2 секунды таймаут
            
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
            
            if (data.access === true && data.level > 0) {
                this.accessLevels.setLevel(data.level);
            }
            
            return true;
        } catch (error) {
            clearTimeout(timeoutId);
            this.hasLocalhostAccess = false;
            console.warn('⚠️ Доступ к localhost отсутствует (сервер недоступен)');
            console.debug('Ошибка проверки:', error.message);
            return false;
        }
    }

    async requestAccess() {
        // 🔧 ОФЛАЙН-РЕЖИМ: кнопка "Дать доступ" - сразу разрешаем доступ локально
        // Это нужно для обхода CORS, когда сервер не запущен
        console.log('✅ Кнопка "Дать доступ" нажата - предоставляем локальный доступ');
        
        // В офлайне проверяем есть ли уже сохранённый уровень
        const savedLevel = this.accessLevels.getLevel();
        if (savedLevel > 0) {
            console.log(`✅ Используем сохранённый уровень ${savedLevel}`);
            return true;
        }
        
        // Если нет сохранённого уровня, разрешаем временный доступ
        console.log('✅ Временный доступ (уровень 1)');
        this.accessLevels.setLevel(1);
        return true;
    }

    grantPermission() {
        localStorage.setItem(this.storageKey, 'true');
        this.hideOverlay(); // ← просто скрываем
        document.body.classList.add('access-granted');
        console.log('✅ Доступ предоставлен');
    }

    async init() {
        if (this.isPaused) return;

        // ✅ Проверяем доступ к localhost ПЕРВОЙ НАЧАЛО
        await this.checkLocalhostAccess();

        // Если есть доступ к localhost — кнопка НЕ показывается
        if (this.hasLocalhostAccess) {
            console.log('✅ Доступ к localhost есть — кнопка "Получить доступ" скрыта');
            // Скрываем кнопку и оверлей
            this.hideOverlay();
            
            // Если сервер отвечает, проверяем уровень доступа
            if (this.hasPermission()) {
                document.body.classList.add('access-granted');
            }
            return;
        }

        // ❌ Если НЕТ доступа к localhost — показываем кнопку
        console.log('❌ Доступ к localhost отсутствует — показываем кнопку "Получить доступ"');
        this.showOverlay();

        // Подключаем кнопку
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

// Сохраняем ссылку на PermissionManager в глобальной области видимости
window.permissionManager = null;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const pm = new PermissionManager();
    pm.init();
    window.permissionManager = pm;
    console.log('[PermissionManager] Инициализирован и сохранён в window.permissionManager');
});
