// static/js/permission-manager.js
import { AccessLevels } from './access-levels.js';

export class PermissionManager {
    constructor() {
        this.storageKey = 'permissions_granted';
        this.accessLevels = new AccessLevels();
        this.isPaused = false;
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

    async requestAccess() {
        // 🔧 ОФЛАЙН-РЕЖИМ: если сервер недоступен — разрешаем доступ локально
        try {
            const response = await fetch('/api/check-access');
            if (!response.ok) throw new Error('Сервер недоступен');
            const data = await response.json();
            
            if (data.access === true && data.level > 0) {
                this.accessLevels.setLevel(data.level);
                return true;
            }
            return false;
        } catch (error) {
            console.warn('⚠️ Офлайн-режим: недоступен API check-access — разрешаем локально');
            console.debug('Ошибка:', error.message);
            
            // В офлайне проверяем есть ли уже сохранённый уровень
            const savedLevel = this.accessLevels.getLevel();
            if (savedLevel > 0) {
                console.log(`✅ Используем сохранённый уровень ${savedLevel}`);
                return true;
            }
            
            // Если нет сохранённого уровня, разрешаем временный доступ
            console.log('✅ Временный доступ в офлайне (уровень 1)');
            this.accessLevels.setLevel(1);
            return true;
        }
    }

    grantPermission() {
        localStorage.setItem(this.storageKey, 'true');
        this.hideOverlay(); // ← просто скрываем
        document.body.classList.add('access-granted');
        console.log('✅ Доступ предоставлен');
    }

    init() {
        if (this.isPaused) return;

        // ✅ ЕДИНСТВЕННАЯ ПРОВЕРКА — и всё
        if (this.hasPermission()) {
            // Доступ уже есть — сразу разрешаем и выходим
            document.body.classList.add('access-granted');
            return;
        }

        // ✅ Только если access = false — показываем завесу
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
