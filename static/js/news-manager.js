// static/js/news-manager.js
import { Logger } from './logger.js';
import { NewsForm } from './news-form.js';

export class NewsManager {
    constructor(permissionManager) {
        if (!permissionManager) {
            throw new Error('PermissionManager не передан в NewsManager');
        }

        this.pm = permissionManager;
        this.newsList = [];
    }

    // Инициализация менеджера новостей
    async init() {
        try {
            await this.loadNews();
            //this.setupEventListeners();
            console.log('✅ NewsManager инициализирован');
        } catch (error) {
            Logger.error('Ошибка инициализации NewsManager', error);
        }
    }
    
    // Загрузка новостей
    async loadNews() {
        if (!this.pm.hasPermission()) {
            console.warn('⚠️ Доступ не предоставлен. Невозможно загружать новости.');
            this.newsList = [];
            return;
        }

        try {
            const res = await fetch('/get-news');
            if (!res.ok) throw new Error('Не удалось загрузить новости');
            const data = await res.json();

            this.newsList = data.news;
            this.updateLastUpdate(data.last_update);
            this.renderNews();
        } catch (e) {
            Logger.error('Ошибка загрузки новостей', e);
            this.newsList = [];
        }
    }

    // Сохранение новости
    async saveNews(formData) {
        if (!this.pm.hasPermission()) {
            console.error('❌ Доступ не предоставлен. Невозможно сохранить новость.');
            return { success: false, error: 'Нет разрешения' };
        }

        try {
            const res = await fetch('/save-news', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Ошибка сохранения');
            return await res.json();
        } catch (error) {
            Logger.error('Ошибка сохранения', error);
            return { success: false, error: error.message };
        }
    }

    // Удаление новости
    async deleteNews(newsId) {
        if (!this.pm.hasPermission()) {
            return { success: false, error: 'Нет разрешения' };
        }

        try {
            const res = await fetch(`/delete-news/${newsId}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error('Ошибка удаления');
            
            this.newsList = this.newsList.filter(item => item.id !== newsId);
            this.renderNews();
            return { success: true };
        } catch (error) {
            Logger.error('Ошибка удаления новости', error);
            return { success: false, error: error.message };
        }
    }

    // Обновление новости
    async updateNews(newsId, formData) {
        if (!this.pm.hasPermission()) {
            return { success: false, error: 'Нет разрешения' };
        }

        try {
            const res = await fetch(`/update-news/${newsId}`, {
                method: 'PUT',
                body: formData
            });

            if (!res.ok) throw new Error('Ошибка обновления');
            
            this.loadNews();
            return { success: true };
        } catch (error) {
            Logger.error('Ошибка обновления новости', error);
            return { success: false, error: error.message };
        }
    }

    // Поиск новостей
    async searchNews(query) {
        if (!this.pm.hasPermission()) {
            return { success: false, error: 'Нет разрешения' };
        }

        try {
            const res = await fetch(`/search-news?q=${query}`);
            if (!res.ok) throw new Error('Ошибка поиска');
            
            const data = await res.json();
            this.newsList = data.news;
            this.renderNews();
            return { success: true };
        } catch (error) {
            Logger.error('Ошибка поиска новостей', error);
            return { success: false, error: error.message };
        }
    }

    // Рендеринг новостей
    renderNews() {
        const container = document.querySelector('.news-grid');
        if (!container) return;

        // Очищаем контейнер
        container.innerHTML = '';

        // Создаем индикатор загрузки
        container.innerHTML = '<div class="loading">Загрузка новостей...</div>';

        // Загружаем только первые X новостей (0, X);
        const visibleNews = this.newsList.slice(0, this.newsList.length);
        
        // Создаем фрагмент для оптимизации
        const fragment = document.createDocumentFragment();
        
        visibleNews.forEach((item, index) => {
            console.log(`🖼 Карточка #${index}: id=${item.id}, image=${item.image}`);
            const card = document.createElement('div');
            card.classList.add('news-card');
            card.dataset.id = item.id;
            
            // Добавляем атрибут для ленивой загрузки
            card.dataset.lazy = true;
            
            card.innerHTML = `
                <div class="news-card-image-wrapper">
                    ${item.image ? `<img src="/images/img_n/${item.image}" alt="Изображение события" class="news-image" loading="lazy">` : ''}
                </div>
                <div class="news-card-content">
                    <h3 class="news-card-title">${this.escapeHtml(item.title)}</h3>
                    <p class="news-card-description">${this.escapeHtml(item.preview)}</p>
                    <button class="read-more-btn" onclick="window.openNews(${item.id})">ЧИТАТЬ ПОЛНОСТЬЮ</button>
                </div>
            `;
            
            fragment.appendChild(card);
        });

        // Добавляем все элементы сразу
        container.innerHTML = '';
        container.appendChild(fragment);
        
        // Убираем индикатор загрузки
        const loader = container.querySelector('.loading');
        if (loader) loader.remove();
        
        // Добавляем стили для сетки 3 колонки
        container.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            justify-items: center;
        `;
        
        // Добавляем анимацию появления
        this.showNewsWithAnimation();
    }

    // Ленивая загрузка изображений
    initLazyLoad() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                }
            });
        });

        images.forEach(image => {
            observer.observe(image);
        });
    }

    // Анимация появления карточек
    showNewsWithAnimation() {
        const cards = document.querySelectorAll('.news-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('show');
            }, index * 150);
        });
    }

    // Экранирование HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Обновление даты последнего обновления
    updateLastUpdate(lastUpdate) {
        const el = document.querySelector('.update-date');
        if (el && lastUpdate) {
            el.textContent = new Date(lastUpdate).toLocaleString('ru-RU');
        }
    }

    // Уведомления об ошибках
    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification error';
        toast.textContent = '❌ ' + message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    // Успешные уведомления
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification success';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}
