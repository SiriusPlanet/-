// static/js/main.js
import { Logger } from './logger.js';
import { PermissionManager } from './permission-manager.js';
import { NewsManager } from './news-manager.js';
import { NewsForm } from './news-form.js';

class MainApp {
    constructor() {
        this.pm = new PermissionManager();
        this.newsManager = null;
        this.newsForm = null;
    }

    async init() {
        try {
            if (!this.pm.hasPermission()) {
                Logger.warn('Нет прав доступа');
                return;
            }

            await this.initComponents();
            this.initEventListeners();
            Logger.log('Приложение успешно инициализировано');
        } catch (error) {
            Logger.error('Ошибка инициализации', error);
        }
    }

    initComponents() {
        // Инициализируем только если ��ы на странице новостей
        const addBtn = document.querySelector('.add-news-btn');
        const modal = document.getElementById('addNewsModal');
        
        if (!addBtn || !modal) {
            // Это не страница новостей — не инициализируем
            return;
        }
        
        this.newsManager = new NewsManager(this.pm);
        this.newsManager.init();
        this.newsForm = new NewsForm(this.newsManager);
        this.newsForm.init();
    }

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
            if (!this.pm.hasPermission()) {
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
            Logger.error('Ошибка отправки формы', error);
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
        Logger.error('Глобальная ошибка', error);
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

// Точка входа
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const app = new MainApp();
        await app.init();
    } catch (error) {
        console.error('Критическая ошибка при инициализации:', error);
    }
});
