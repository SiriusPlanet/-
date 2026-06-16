/**
 * Catalog Page Constructor
 * Рендерит страницу каталога товаров, используя /get-news API
 * Фильтрует товары по lotType === 'product' или наличию price
 */

export class CatalogPageConstructor {
    constructor() {
        this.newsContainer = null;
    }

    init() {
        console.log('[CatalogPageConstructor] Инициализация');
        this.newsContainer = document.querySelector('.news-grid');
        if (!this.newsContainer) {
            console.error('[CatalogPageConstructor] .news-grid not found');
            return;
        }
        console.log('[CatalogPageConstructor] .news-grid found');
    }

    async loadNews() {
        try {
            const res = await fetch('/get-news');
            if (!res.ok) throw new Error('Ошибка загрузки');
            const data = await res.json();
            // Фильтруем только товары
            return (data.news || []).filter(n => n.lotType === 'product');
        } catch (e) {
            console.error('[CatalogPageConstructor] Ошибка загрузки:', e);
            return [];
        }
    }

    async render(newsArray = []) {
        if (!this.newsContainer) return;
        this.newsContainer.innerHTML = '';

        if (newsArray.length === 0) {
            this.newsContainer.innerHTML = '<p style="color: white; text-align: center;">Нет доступных товаров</p>';
            return;
        }

        newsArray.forEach((news) => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.dataset.id = news.id;

            const imgSrc = news.image ? `/images/img_n/${news.image}` : '/images/img_n/400.png';
            const priceHtml = news.price ? `${news.price} ₽` : 'Цена не указана';

            card.innerHTML = `
                <div class="product-card-image">
                    <img src="${imgSrc}" alt="${this.escapeHtml(news.title || '')}" loading="lazy">
                </div>
                <div class="product-card-body">
                    <h3 class="product-card-title">${this.escapeHtml(news.title || '')}</h3>
                    <div class="product-card-price">${priceHtml}</div>
                    <p class="product-card-description">${this.escapeHtml(news.preview || news.content || '')}</p>
                </div>
            `;

            this.newsContainer.appendChild(card);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    const constructor = new CatalogPageConstructor();
    constructor.init();
    constructor.loadNews().then(news => constructor.render(news));
});
