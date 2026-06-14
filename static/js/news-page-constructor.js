/**
 * News Page Constructor - Конструктор 3
 * Собирает страницу из готовых карточек и обновляет бегущую строку
 * Работает с существующим .ticker-container из index.html
 */

class NewsPageConstructor {
    constructor(options = {}) {
        this.cardConstructor = options.cardConstructor || null;
        this.newsContainer = options.newsContainer || null;
        this.tickerContainer = options.tickerContainer || null;
        this.newsUrl = options.newsUrl || '/data/news.json';
        this.init();
    }

    /**
     * Инициализация конструктора страницы
     */
    init() {
        console.log('NewsPageConstructor initialized');

        // Находим существующий контейнер для новостей
        this.newsContainer = this.newsContainer || document.querySelector('.news-grid');
        if (!this.newsContainer) {
            console.warn('news-grid container not found. Creating one...');
            this.createNewsGrid();
        }

        // Находим существующий контейнер для бегущей строки
        this.tickerContainer = this.tickerContainer || document.querySelector('.ticker-container');
        if (this.tickerContainer) {
            console.log('Ticker container found:', this.tickerContainer.id);
        } else {
            console.warn('Ticker container not found. Creating one...');
            this.createTickerContainer();
        }
    }

    /**
     * Создает контейнер для новостей, если не найден
     */
    createNewsGrid() {
        const main = document.querySelector('main');
        if (!main) return;

        this.newsContainer = document.createElement('div');
        this.newsContainer.className = 'news-grid';
        this.newsContainer.style.display = 'grid';
        this.newsContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
        this.newsContainer.style.gap = '20px';
        this.newsContainer.style.padding = '20px';
        this.newsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';

        main.appendChild(this.newsContainer);
    }

    /**
     * Создает контейнер для бегущей строки, если не найден
     */
    createTickerContainer() {
        const header = document.querySelector('.site-header');
        if (!header) return;

        this.tickerContainer = document.createElement('div');
        this.tickerContainer.className = 'ticker-container';
        this.tickerContainer.style.margin = '10px 0';
        this.tickerContainer.style.overflow = 'hidden';
        this.tickerContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.tickerContainer.style.borderRadius = '8px';

        const ticker = document.createElement('div');
        ticker.id = 'news-ticker';
        ticker.textContent = 'Загрузка хроник...';
        ticker.style.display = 'inline-block';
        ticker.style.whiteSpace = 'nowrap';
        ticker.style.padding = '10px 0';

        this.tickerContainer.appendChild(ticker);
        header.appendChild(this.tickerContainer);
    }

    /**
     * Загружает новости из JSON-файла
     * @returns {Promise<Array>} - Массив новостей
     */
    async loadNews() {
        try {
            const response = await fetch(this.newsUrl);
            if (!response.ok) {
                throw new Error(`Failed to load news: ${response.statusText}`);
            }
            const news = await response.json();
            console.log('News loaded:', news);
            return news;
        } catch (error) {
            console.error('Error loading news:', error);
            return [];
        }
    }

    /**
     * Рендерит страницу с новостями
     * @param {Array} newsArray - Массив новостей
     * @returns {Promise<void>}
     */
    async render(newsArray = []) {
        if (!this.newsContainer) {
            console.error('News container not initialized');
            return;
        }

        // Очищаем контейнер
        this.newsContainer.innerHTML = '';

        if (newsArray.length === 0) {
            this.newsContainer.innerHTML = '<p style="color: white; text-align: center;">Нет доступных новостей</p>';
            return;
        }

        // Рендерим карточки через NewsCardConstructor
        if (this.cardConstructor) {
            await this.cardConstructor.renderMultiple(
                newsArray,
                this.newsContainer,
                { delay: 100 }
            );
        } else {
            // Если конструктора нет, рендерим вручную
            newsArray.forEach((news, index) => {
                const card = this.createCardElement(news, index);
                this.newsContainer.appendChild(card);
            });
        }

        // Обновляем бегущую строку
        this.updateTicker(newsArray);
    }

    /**
     * Создает элемент карточки вручную (без шаблона)
     * @param {Object} news - Объект новости
     * @param {number} index - Индекс для анимации
     * @returns {HTMLElement} - Элемент карточки
     */
    createCardElement(news, index) {
        const card = document.createElement('div');
        card.className = 'news-card';
        card.setAttribute('data-id', news.id);
        card.setAttribute('data-category', news.category || 'news');
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 50 + 100);

        // Заголовок и дата
        const header = document.createElement('div');
        header.className = 'news-card-header';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '10px';

        const title = document.createElement('h3');
        title.className = 'news-card-title';
        title.textContent = news.title || 'Новость';
        title.style.color = '#fff';
        title.style.margin = '0';

        const date = document.createElement('span');
        date.className = 'news-card-date';
        date.textContent = news.date || new Date().toLocaleDateString('ru-RU');
        date.style.color = '#aaa';
        date.style.fontSize = '0.9rem';

        header.appendChild(title);
        header.appendChild(date);

        // Тело карточки
        const body = document.createElement('div');
        body.className = 'news-card-body';

        const preview = document.createElement('p');
        preview.className = 'news-card-preview';
        preview.textContent = news.preview || (news.content ? news.content.substring(0, 100) + '...' : '');
        preview.style.color = '#ddd';
        preview.style.margin = '0 0 10px 0';
        preview.style.lineHeight = '1.5';

        body.appendChild(preview);

        // Изображение
        const img = document.createElement('img');
        img.className = 'news-card-image';
        img.src = news.image || '/static/images/default-news.jpg';
        img.alt = news.title || 'Новость';
        img.style.width = '100%';
        img.style.height = '200px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.marginTop = '10px';

        body.appendChild(img);

        // Бейдж скидки
        if (news.discount) {
            const badge = document.createElement('div');
            badge.className = 'news-card-discount-badge';
            badge.textContent = `-${news.discount}%`;
            badge.style.position = 'absolute';
            badge.style.top = '10px';
            badge.style.right = '10px';
            badge.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
            badge.style.color = 'white';
            badge.style.padding = '8px 16px';
            badge.style.fontWeight = 'bold';
            badge.style.fontSize = '1.2rem';
            badge.style.borderRadius = '8px 0 8px 0';
            badge.style.transform = 'rotate(10deg)';
            badge.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.3)';
            badge.style.zIndex = '10';

            card.appendChild(badge);
        }

        card.appendChild(header);
        card.appendChild(body);

        return card;
    }

    /**
     * Обновляет бегущую строку (ticker)
     * @param {Array} newsArray - Массив новостей
     */
    updateTicker(newsArray) {
        if (!this.tickerContainer) return;

        const ticker = this.tickerContainer.querySelector('#news-ticker');
        if (!ticker) return;

        // Берем preview из всех новостей
        const texts = newsArray
            .map(news => news.preview || (news.content ? news.content.substring(0, 100) + '...' : ''))
            .filter(text => text);

        if (texts.length === 0) {
            ticker.textContent = 'Нет новостей для бегущей строки';
            return;
        }

        // Объединяем тексты с разделителем
        const tickerText = texts.join('   •   ');

        // Создаем анимацию бегущей строки
        ticker.style.display = 'inline-block';
        ticker.style.whiteSpace = 'nowrap';
        ticker.style.padding = '10px 0';
        ticker.style.animation = 'none';

        // Сбрасываем анимацию
        void ticker.offsetWidth;

        // Запускаем анимацию
        ticker.style.animation = 'ticker 60s linear infinite';

        // Добавляем стили анимации, если их нет
        this.addTickerStyles();

        // Обновляем текст
        ticker.textContent = tickerText + '   •   ' + tickerText;
    }

    /**
     * Добавляет стили для анимации бегущей строки
     */
    addTickerStyles() {
        const styleId = 'news-ticker-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @keyframes ticker {
                0% {
                    transform: translateX(100%);
                }
                100% {
                    transform: translateX(-100%);
                }
            }
            .ticker-container {
                overflow: hidden;
                background-color: rgba(0, 0, 0, 0.5);
                border-radius: 8px;
                margin: 10px 0;
            }
            .ticker-container #news-ticker {
                display: inline-block;
                white-space: nowrap;
                padding: 10px 0;
                color: #00ffaa;
                font-size: 1.1rem;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Обновляет страницу с новыми данными
     * @param {Array} newsArray - Массив новостей
     */
    async refresh(newsArray = []) {
        await this.render(newsArray);
    }

    /**
     * Добавляет новость в уже отрендеренную страницу
     * @param {Object} news - Объект новости
     */
    addNews(news) {
        if (!this.newsContainer) return;

        const card = this.createCardElement(news, this.newsContainer.children.length);
        this.newsContainer.appendChild(card);

        // Обновляем бегущую строку
        this.updateTicker([news]);
    }

    /**
     * Удаляет новость из страницы
     * @param {string|number} id - ID новости
     */
    removeNews(id) {
        if (!this.newsContainer) return;

        const card = this.newsContainer.querySelector(`.news-card[data-id="${id}"]`);
        if (card) {
            card.style.opacity = '0';
            card.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                card.remove();
            }, 300);
        }
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewsPageConstructor;
}