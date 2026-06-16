// static/js/main.js - Исправленная версия
// Работает на всех страницах без ошибок

import { Logger } from './logger.js';
import { NewsManager } from './news-manager.js';
import { NewsForm } from './news-form.js';
import { CatalogManager } from './catalog.js';

class MainApp {
    constructor() {
        this.pm = null;
        this.newsManager = null;
        this.newsForm = null;
        this.newsHeaderPanel = null;
        this.catalogManager = null;
        
        console.log('[MainApp] Конструктор вызван, pm будет получен из window.permissionManager');
    }

    async init() {
        try {
            // Ждем глобальной инициализации системы доступа
            if (!window.__globalAccessPromise) {
                Logger.warn('[MainApp] __globalAccessPromise не найден. Проверьте access-init.js');
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
            console.log('[MainApp] Это не страница новостей/каталога, пропускаем инициализацию компонентов');
            return;
        }
        
        console.log('[MainApp] Инициализация компонентов...');
        
        if (!this.pm) {
            Logger.error('[MainApp] PermissionManager не передан в компоненты');
            return;
        }
        
        this.newsManager = new NewsManager(this.pm);
        
        // Определяем тип страницы: catalog.html имеет .tabs-container, news.html — нет
        const isCatalogPage = document.querySelector('.tabs-container') !== null;
        
        if (isCatalogPage) {
            // Страница каталога — используем CatalogManager
            const catalogModule = await import('./catalog.js');
            this.catalogManager = new catalogModule.CatalogManager(this.newsManager);
            console.log('[MainApp] CatalogManager инициализирован');
        } else {
            // Страница новостей — используем NewsManager + NewsForm
            await this.newsManager.loadNews();
            this.newsForm = new NewsForm(this.newsManager);
            this.newsForm.init();
            console.log('[MainApp] NewsForm инициализирован');
        }
    }

    setupScrollHandler() {
        const scrollThreshold = 5;
        let lastScrollTop = 0;
        
        this.newsHeaderPanel = document.querySelector('.news-header-panel');
        if (!this.newsHeaderPanel) {
            console.log('[MainApp] Панель .news-header-panel не найдена');
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

    // Форма теперь обрабатывается в news-form.js и catalog.js
    // setupFormHandlers, handleFormSubmit, validateForm — удалены
    // чтобы не было дублирования отправки

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
if (window.__globalAccessPromise) {
    window.__globalAccessPromise.then(() => {
        console.log('[MainApp] access-init.js завершен, продолжаем инициализацию');
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('[MainApp] Ожидание инициализации PermissionManager...');
        const pm = window.permissionManager;
        console.log('[MainApp] PermissionManager получен:', pm ? 'OK' : 'null (будет получен из access-init.js)');
        
        const app = new MainApp();
        await app.init();
    } catch (error) {
        console.error('[MainApp] Критическая ошибка при инициализации:', error);
    }
});
