// static/js/main.js
import { Logger } from './logger.js';
import { NewsManager } from './news-manager.js';
import { NewsForm } from './news-form.js';

class MainApp {
    constructor() {
        // PermissionManager инициализируется в access-init.js
        // Здесь только ссылка на уже инициализированный объект
        this.pm = window.permissionManager || null;
        this.newsManager = null;
        this.newsForm = null;
        
        console.log('[MainApp] Конструктор вызван, pm =', this.pm ? 'OK' : 'null');
    }

    async init() {
        try {
            // Проверяем, есть ли PermissionManager
            if (!this.pm) {
                Logger.warn('[MainApp] PermissionManager не найден. Проверьте access-init.js');
                // Продолжаем без PermissionManager (для страниц без новостей)
            }

            await this.initComponents();
            this.initEventListeners();
            Logger.log('[MainApp] Приложение успешно инициализировано');
        } catch (error) {
            Logger.error('[MainApp] Ошибка инициализации', error);
        }
    }

{"text": "    async initComponents() {
        // Инициализируем только если мы на странице новостей
        const addBtn = document.querySelector('.add-news-btn');
        const modal = document.getElementById('addNewsModal');
        
        if (!addBtn || !modal) {
            // Это не страница новостей — не инициализируем компоненты новостей
            console.log('[MainApp] Это не страница новостей, пропускаем инициализацию');
            return;
        }
        
        console.log('[MainApp] Инициализация компонентов новостей...');
        
        if (!this.pm) {
            Logger.error('[MainApp] PermissionManager не передан в компоненты новостей');
            return;
        }
        
        this.newsManager = new NewsManager(this.pm);
        this.newsManager.init();
        
        // Загружаем новости только на странице новостей
        await this.newsManager.loadNews();
        
        this.newsForm = new NewsForm(this.newsManager);
        this.newsForm.init();
        
        console.log('[MainApp] Компоненты новостей инициализированы');
    }"}

    initEventListeners() {
        this.setupGlobalHandlers();
        
        // Устанавливаем обработчики только если компоненты инициализированы
        if (this.newsManager && this.newsForm) {
            this.setupFormHandlers();
        }
    }

    setupGlobalHandlers() {
        document.addEventListener('keydown', this.handleEscape.bind(this));
        window.addEventListener('error', this.handleError.bind(this));
    }

    setupFormHandlers() {
        const form = document.getElementById('newsForm');
        if (!form) return;

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

// Открытие новости в модальном окне
window.openNews = (id) => {
    const modal = document.getElementById('viewNewsModal');
    if (!modal) return;
    
    // Показываем модальное окно с заглушкой
    // В будущем здесь будет загрузка новости по ID
    modal.classList.remove('hidden');
    modal.classList.add('is-visible');
};

// Экспортируем PermissionManager в глобальную область видимости
// (для использования в других скриптах)
if (typeof window.permissionManager === 'undefined') {
    // Переменная не установлена - значит access-init.js не загружен
    console.warn('[MainApp] window.permissionManager не найден. Загрузите access-init.js первым.');
}

// Точка входа
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const app = new MainApp();
        await app.init();
    } catch (error) {
        console.error('[MainApp] Критическая ошибка при инициализации:', error);
    }
});
