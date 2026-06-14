/**
 * News Card Constructor - Конструктор 2
 * Генерирует HTML-карточки новостей из JSON-данных
 * С поддержкой бегущей строки и углового бейджа скидки
 */

class NewsCardConstructor {
    constructor(options = {}) {
        this.templatePath = options.templatePath || '/templates/card-constructor/card-template.html';
        this.container = options.container || null;
        this.discountStyle = options.discountStyle || {
            background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
            color: 'white',
            padding: '8px 16px',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            borderRadius: '8px 0 8px 0',
            transform: 'rotate(10deg)',
            boxShadow: '2px 2px 5px rgba(0,0,0,0.3)',
            zIndex: '10',
            position: 'absolute',
            top: '10px',
            right: '10px'
        };
        this.init();
    }

    /**
     * Инициализация конструктора
     */
    init() {
        console.log('NewsCardConstructor initialized');
    }

    /**
     * Генерирует бегущую строку из текста
     * @param {Object} news - Объект новости
     * @returns {string} - HTML для бегущей строки
     */
    generateTicker(news) {
        // Берем preview, если есть, иначе первые 100 символов content
        const text = news.preview || (news.content ? news.content.substring(0, 100) + '...' : '');
        const escapedText = this.escapeHtml(text);
        
        return `<div class="news-ticker">
            <div class="news-ticker-content">
                <span>${escapedText}</span><span>${escapedText}</span>
            </div>
        </div>`;
    }

    /**
     * Добавляет угловой бейдж скидки на карточку
     * @param {HTMLElement} cardElement - Элемент карточки
     * @param {number|string} discount - Размер скидки (например, 10 или "10%")
     */
    addDiscountBadge(cardElement, discount) {
        if (!discount) return;

        const badge = document.createElement('div');
        badge.className = 'news-card-discount-badge';
        badge.textContent = `-${discount}%`;
        
        // Применяем стили из конфигурации
        Object.assign(badge.style, this.discountStyle);
        
        cardElement.appendChild(badge);
    }

    /**
     * Рендерит одну карточку из JSON-данных
     * @param {Object} news - Объект новости
     * @returns {HTMLElement} - Готовый элемент карточки
     */
    async render(news) {
        // Загружаем шаблон
        const response = await fetch(this.templatePath);
        if (!response.ok) {
            throw new Error(`Failed to load template: ${response.statusText}`);
        }
        
        const template = await response.text();
        
        // Подставляем данные в шаблон (упрощенный {{placeholder}})
        let html = template
            .replace('{{id}}', news.id || '')
            .replace('{{title}}', this.escapeHtml(news.title) || '')
            .replace('{{date}}', news.date || '')
            .replace('{{preview}}', this.escapeHtml(news.preview || ''))
            .replace('{{content}}', this.escapeHtml(news.content || ''))
            .replace('{{image}}', news.image || '/static/images/default-news.jpg')
            .replace('{{category}}', news.category || 'news');
        
        // Создаем DOM-элемент
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const cardElement = doc.querySelector('.news-card');
        
        if (!cardElement) {
            throw new Error('Invalid template structure');
        }

        // Добавляем бейдж скидки, если есть
        if (news.discount) {
            this.addDiscountBadge(cardElement, news.discount);
        }

        return cardElement;
    }

    /**
     * Рендерит несколько карточек
     * @param {Array} newsArray - Массив объектов новостей
     * @param {HTMLElement} container - Контейнер для вставки
     * @param {Object} options - Опции рендеринга
     * @returns {Promise<Array>} - Массив созданных элементов
     */
    async renderMultiple(newsArray, container, options = {}) {
        const elements = [];
        
        newsArray.forEach((news, index) => {
            setTimeout(() => {
                this.render(news).then(cardElement => {
                    // Анимация появления
                    cardElement.style.opacity = '0';
                    cardElement.style.transform = 'translateY(20px)';
                    
                    container.appendChild(cardElement);
                    
                    // Запускаем анимацию
                    setTimeout(() => {
                        cardElement.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                        cardElement.style.opacity = '1';
                        cardElement.style.transform = 'translateY(0)';
                    }, options.delay || index * 50 + 100);
                    
                    elements.push(cardElement);
                }).catch(err => {
                    console.error('Error rendering card:', err);
                });
            }, 0);
        });
        
        return elements;
    }

    /**
     * Экранирует HTML-сущности для безопасности
     * @param {string} text - Исходный текст
     * @returns {string} - Экранированный текст
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Получает карточку по ID
     * @param {string|number} id - ID новости
     * @returns {HTMLElement|null} - Найденная карточка
     */
    getCardById(id) {
        return document.querySelector(`.news-card[data-id="${id}"]`);
    }

    /**
     * Обновляет существующую карточку
     * @param {Object} news - Обновленные данные новости
     * @returns {Promise<boolean>} - Успешность обновления
     */
    async updateCard(news) {
        const card = this.getCardById(news.id);
        if (!card) return false;

        // Обновляем данные
        card.setAttribute('data-id', news.id);
        card.setAttribute('data-category', news.category || 'news');
        
        // Обновляем заголовок
        const titleEl = card.querySelector('.news-card-title');
        if (titleEl) titleEl.textContent = news.title;

        // Обновляем дату
        const dateEl = card.querySelector('.news-card-date');
        if (dateEl) dateEl.textContent = news.date;

        // Обновляем preview
        const previewEl = card.querySelector('.news-card-preview');
        if (previewEl) previewEl.textContent = news.preview;

        // Обновляем изображение
        const imgEl = card.querySelector('.news-card-image');
        if (imgEl) imgEl.src = news.image || '/static/images/default-news.jpg';

        // Обновляем бейдж скидки
        const existingBadge = card.querySelector('.news-card-discount-badge');
        if (news.discount) {
            if (existingBadge) {
                existingBadge.textContent = `-${news.discount}%`;
            } else {
                this.addDiscountBadge(card, news.discount);
            }
        } else if (existingBadge) {
            existingBadge.remove();
        }

        return true;
    }

    /**
     * Удаляет карточку по ID
     * @param {string|number} id - ID новости
     * @returns {boolean} - Успешность удаления
     */
    deleteCard(id) {
        const card = this.getCardById(id);
        if (!card) return false;

        card.style.opacity = '0';
        card.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            card.remove();
        }, 300);

        return true;
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewsCardConstructor;
}
