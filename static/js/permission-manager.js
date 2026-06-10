// .\static\js\permission-manager.js
export class PermissionManager {
    constructor() {
        this.storageKey = 'permissions_granted';
        this.isPaused = false;
        this.initElements();
    }

    hasPermission() {
        // ✅ Простая проверка: есть ли ключ и он равен 'true'?
        return localStorage.getItem(this.storageKey) === 'true';
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
        // ✅ Скрываем без удаления — простоdisplay: none
        if (this.overlay) {
            this.overlay.style.display = 'none';
            this.overlay.style.pointerEvents = 'none';
        }
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    async requestAccess() {
        try {
            const response = await fetch('/api/check-access');
            const data = await response.json();
            return data.access === true;
        } catch (error) {
            console.error('Ошибка запроса доступа:', error);
            return false;
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

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const pm = new PermissionManager();
    pm.init();
});