// static/js/news-manager.js
import { Logger } from './logger.js';
import { AccessLevels } from './access-levels.js';

export class NewsManager {
    constructor(permissionManager) {
        if (!permissionManager) {
            throw new Error('PermissionManager не передан в NewsManager');
        }

        this.pm = permissionManager;
        this.accessLevels = new AccessLevels();
        this.newsList = [];
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
            const res = await fetch('/api/delete-news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: newsId })
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
            const res = await fetch('/api/update-news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: newsId, ...Object.fromEntries(formData) })
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

        container.innerHTML = '';

        // Показываем только новости (lotType === 'news'), товары идут в каталог
        const visibleNews = this.newsList.filter(item => item.lotType === 'news');
        
        const fragment = document.createDocumentFragment();
        
        visibleNews.forEach((item, index) => {
            console.log(`🖼 Карточка #${index}: id=${item.id}, image=${item.image}`);
            const card = document.createElement('div');
            card.classList.add('news-card');
            card.dataset.id = item.id;
            
            card.innerHTML = `
                <div class="news-card-image-wrapper">
                    ${item.image ? `<img src="/images/img_n/${item.image}" alt="${this.escapeHtml(item.title)}" class="news-image" loading="lazy">` : ''}
                </div>
                <div class="news-card-content">
                    <h3 class="news-card-title">${this.escapeHtml(item.title)}</h3>
                    <p class="news-card-description">${this.escapeHtml(item.preview)}</p>
                    <button class="read-more-btn" onclick="window.openNews(${item.id})">ЧИТАТЬ ПОЛНОСТЬЮ</button>
                    ${this.renderDeleteButton(item.id)}
                </div>
            `;
            
            fragment.appendChild(card);
        });

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
        
        this.showNewsWithAnimation();
        this.setupDeleteButtons();
    }

    // Анимация появления карточек новостей
    showNewsWithAnimation() {
        const cards = document.querySelectorAll('.news-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }

    setupDeleteButtons() {
        const deleteBtns = document.querySelectorAll('.delete-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = parseInt(btn.dataset.id, 10);
                if (confirm('Удалить хронозапись?')) {
                    await this.deleteNews(id);
                    this.showToast('Новость удалена');
                }
            });
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

    // Рендер кнопки удаления (только для админов)
    renderDeleteButton(id) {
        const level = this.accessLevels.getLevel();
        if (level < 3) return ''; // Только администратор (уровень 3)

        return `
            <button class="delete-btn" data-id="${id}">🗑️ Удалить</button>
        `;
    }
}
