// static/js/main.js - Исправленная версия
// Работает на всех страницах без ошибок

import { Logger } from './logger.js';
import { NewsManager } from './news-manager.js';
import { NewsForm } from './news-form.js';

class MainApp {
    constructor() {
        this.pm = null;
        this.newsManager = null;
        this.newsForm = null;
        this.newsHeaderPanel = null;
        
        console.log('[MainApp] Конструктор вызван, pm будет получен из window.permissionManager');
    }

    async init() {
        try {
            // Ждем глобальной инициализации системы доступа
            if (!window.__globalAccessPromise) {
                Logger.warn('[MainApp] __globalAccessPromise не найден. Проверьте global-access.js');
            }
            
            // Ждем разрешения или таймаута (чтобы не висеть вечно)
            try {
                await Promise.race([
                    window.__globalAccessPromise?.then(pm => {
                        console.log('[MainApp] Система доступа инициализирована');
                        this.pm = pm;
                    }),
                    new Promise(resolve => setTimeout(resolve, 2000)) // 2 сек таймаут
                ]);
            } catch (e) {
                console.warn('[MainApp] Ошибка ожидания доступа:', e);
            }

            await this.initComponents();
            this.setupFormHandlers();
            this.setupScrollHandler();
            this.setupGlobalHandlers();
            Logger.log('[MainApp] Приложение успешно инициализировано');
        } catch (error) {
            Logger.error('[MainApp] Ошибка инициализации', error);
        }
    }

    async initComponents() {
        const addBtn = document.querySelector('.add-news-btn');
        const modal = document.getElementById('addNewsModal');
        
        if (!addBtn || !modal) {
            console.log('[MainApp] Это не страница новостей, пропускаем инициализацию компонентов новостей');
            // НЕ прерываем инициализацию - просто пропускаем новости
            return;
        }
        
        console.log('[MainApp] Инициализация компонентов новостей...');
        
        if (!this.pm) {
            Logger.error('[MainApp] PermissionManager не передан в компоненты новостей');
            return;
        }
        
        this.newsManager = new NewsManager(this.pm);
        await this.newsManager.loadNews();
        this.newsForm = new NewsForm(this.newsManager);
        this.newsForm.init();
        
        console.log('[MainApp] Компоненты новостей инициализированы');
    }

    setupScrollHandler() {
        const scrollThreshold = 5;
        let lastScrollTop = 0;
        
        this.newsHeaderPanel = document.querySelector('.news-header-panel');
        if (!this.newsHeaderPanel) {
            console.log('[MainApp] Панель .news-header-panel не найдена (не страница новостей)');
            return;
        }
        
        const handleScroll = () => {
            const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (currentScrollTop > lastScrollTop && currentScrollTop > scrollThreshold) {
                // Скролл вниз - скрываем панель
                this.newsHeaderPanel.classList.add('hidden');
            } else {
                // Скролл вверх - показываем панель
                this.newsHeaderPanel.classList.remove('hidden');
            }
            
            lastScrollTop = currentScrollTop;
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        console.log('[MainApp] Слушатель скролла установлен');
    }

    setupGlobalHandlers() {
        document.addEventListener('keydown', this.handleEscape.bind(this));
        window.addEventListener('error', this.handleError.bind(this));
    }

    setupFormHandlers() {
        const form = document.getElementById('newsForm');
        if (!form) {
            console.log('[MainApp] Форма #newsForm не найдена (не страница новостей)');
            return;
        }
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFormSubmit(e.target);
        });
    }

    async handleFormSubmit(form) {
        try {
            if (!this.pm || !this.pm.hasPermission()) {
                throw new Error('Нет прав доступа');
            }

            const formData = new FormData(form);
            const isValid = this.validateForm(formData);
            
            if (!isValid) {
                this.newsManager.showError('Заполните все поля');
                return;
            }

            const response = await this.newsManager.saveNews(formData);
            if (response.success) {
                this.newsManager.showToast('Хроно-запись создана');
                await this.newsManager.loadNews();
                form.reset();
                this.closeModal('addNewsModal');
            } else {
                this.newsManager.showError(response.error);
            }
        } catch (error) {
            Logger.error('[MainApp] Ошибка отправки формы', error);
            if (this.newsManager) {
                this.newsManager.showError(error.message || 'Ошибка отправки');
            }
        }
    }

    validateForm(formData) {
        const title = formData.get('title')?.trim();
        const date = formData.get('date')?.trim();
        const preview = formData.get('preview')?.trim();
        const content = formData.get('content')?.trim();

        return !!(title && date && preview && content);
    }

    toggleModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.toggle('hidden');
            modal.classList.toggle('is-visible');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('is-visible');
        }
    }

    handleEscape(e) {
        if (e.key === 'Escape') {
            this.closeAllModals();
        }
    }

    closeAllModals() {
        ['viewNewsModal', 'addNewsModal'].forEach(id => {
            this.closeModal(id);
        });
    }

    handleError(error) {
        Logger.error('[MainApp] Глобальная ошибка', error);
        if (this.newsManager) {
            this.newsManager.showError(error.message);
        }
    }
}

window.openNews = (id) => {
    const modal = document.getElementById('viewNewsModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('is-visible');
};

// Ждем инициализации access-init.js
if (window.__accessInitPromise) {
    window.__accessInitPromise.then(() => {
        console.log('[MainApp] access-init.js завершен, продолжаем инициализацию');
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('[MainApp] Ожидание инициализации PermissionManager...');
        const pm = window.permissionManager;
        console.log('[MainApp] PermissionManager получен:', pm ? 'OK' : 'null (будет получен из global-access.js)');
        
        const app = new MainApp();
        await app.init();
    } catch (error) {
        console.error('[MainApp] Критическая ошибка при инициализации:', error);
    }
});
