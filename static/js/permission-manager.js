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
        this.button = null;
        this.overlay = null;
        this.container = null;
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

    hasGrantedPermission() {
        return localStorage.getItem(this.storageKey) === 'true';
    }

    async checkLocalhostAccess() {
        // Если разрешение уже дано - пропускаем проверку
        if (this.hasGrantedPermission()) {
            this.hasLocalhostAccess = true;
            console.log('✅ Разрешение уже дано - пропускаем проверку localhost');
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
        
        let timeoutId;
        try {
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
            if (timeoutId) clearTimeout(timeoutId);
            this.hasLocalhostAccess = false;
            console.warn('⚠️ Доступ к localhost отсутствует (сервер недоступен)');
            console.debug('Ошибка проверки:', error.message);
            
            // Сохраняем результат проверки
            localStorage.setItem('localhost_checked', 'true');
            localStorage.setItem('localhost_has_access', 'false');
            return false;
        }
    }

{"text": "    async requestAccess() {\n        console.log('✅ Кнопка \"Дать доступ\" нажата - предоставляем локальный доступ');\n        \n        const savedLevel = this.accessLevels.getLevel();\n        if (savedLevel > 0) {\n            console.log(`✅ Используем сохранённый уровень ${savedLevel}`);\n        } else {\n            console.log('✅ Временный доступ (уровень 1)');\n            this.accessLevels.setLevel(1);\n        }\n        \n        // Сохраняем флаг, что доступ был запрошен пользователем\n        localStorage.setItem('user_requested_access', 'true');\n        \n        // Сразу убираем завесу\n        this.hideOverlay();\n        document.body.classList.add('access-granted');\n        \n        // Сохраняем разрешение\n        localStorage.setItem(this.storageKey, 'true');\n        \n        console.log('✅ Доступ предоставлен, завеса убрана');\n        return true;\n    }"}

    grantPermission() {
        localStorage.setItem(this.storageKey, 'true');
        this.hideOverlay();
        document.body.classList.add('access-granted');
        console.log('✅ Доступ предоставлен');
    }

    async init() {
        if (this.isPaused) return;

        // Инициализируем DOM элементы
        this.initElements();

        // 1. Быстрая проверка (2мс) — есть ли разрешение?
        if (this.hasGrantedPermission()) {
            console.log('✅ Разрешение уже дано - продолжаем работу');
            this.hideOverlay();
            document.body.classList.add('access-granted');
            return;
        }

        // 2. Быстрая проверка кэша — результат проверки localhost уже есть?
        const cachedHasAccess = localStorage.getItem('localhost_has_access');
        if (cachedHasAccess === 'true') {
            console.log('✅ Кэш: доступ к localhost есть — продолжаем работу');
            this.hasLocalhostAccess = true;
            this.hideOverlay();
            document.body.classList.add('access-granted');
            return;
        }

        // Если кэша нет, проверяем localhost
        // Проверка может быть быстрой (2мс) или медленной (2сек таймаут)
        // Завеса показывается только если доступа НЕТ
        this.hasLocalhostAccess = await this.checkLocalhostAccess();

        // Если доступа нет — показываем завесу
        if (!this.hasLocalhostAccess) {
            console.log('❌ Доступ к localhost отсутствует — показываем завесу');
            this.showOverlay();

            // ВЕШАЕМ СОБЫТИЕ НА КНОПКУ
            if (this.button) {
                this.button.addEventListener('click', async () => {
                    console.log('🎉 Обнаружено нажатие на кнопку "Дать доступ"');
                    const hasAccess = await this.requestAccess();
                    // requestAccess уже вызывает grantPermission(), не нужно повторно
                });
                console.log('✅ Событие click на кнопке "Дать доступ" зарегистрировано');
            } else {
                console.warn('⚠️ Кнопка #fileAccessButton не найдена');
            }
        } else {
            // Если доступ есть, сразу скрываем завесу и добавляем класс
            console.log('✅ Доступ к localhost есть — продолжаем работу');
            this.hideOverlay();
            document.body.classList.add('access-granted');
        }
    }
}
