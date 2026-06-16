/**
 * Actions Page Constructor
 * Рендерит страницу акций, загружая данные из /get-news
 * Показывает товары со скидкой (discount > 0) и новости с category === 'Акции'
 */

export class ActionsPageConstructor {
    constructor() {
        this.newsContainer = null;
        this.newsList = [];
    }

    init() {
        console.log('[ActionsPageConstructor] Инициализация');
        this.newsContainer = document.querySelector('.products-grid');
        if (!this.newsContainer) {
            console.error('[ActionsPageConstructor] .products-grid not found');
            return;
        }
        console.log('[ActionsPageConstructor] .products-grid found');
    }

    async loadNews() {
        try {
            const res = await fetch('/get-news');
            if (!res.ok) throw new Error('Не удалось загрузить данные');
            const data = await res.json();

            // Фильтруем: category === 'Акции' ИЛИ discount > 0
            this.newsList = (data.news || []).filter(
                n => n.category === 'Акции' || (n.discount && parseInt(n.discount) > 0)
            );
            console.log(`[ActionsPageConstructor] Загружено ${this.newsList.length} акций из ${data.news?.length || 0} элементов`);
            return this.newsList;
        } catch (error) {
            console.error('[ActionsPageConstructor] Ошибка загрузки:', error);
            this.newsList = [];
            return [];
        }
    }

    async render(newsArray = []) {
        if (!this.newsContainer) {
            console.error('[ActionsPageConstructor] News container not initialized');
            return;
        }

        this.newsContainer.innerHTML = '';

        const items = newsArray.length > 0 ? newsArray : this.newsList;

        if (items.length === 0) {
            this.newsContainer.innerHTML = '<p style="color: white; text-align: center; padding: 40px;">Нет доступных акций</p>';
            return;
        }

        const fragment = document.createDocumentFragment();

        items.forEach((item) => {
            const card = this.createCardElement(item);
            fragment.appendChild(card);
        });

        this.newsContainer.appendChild(fragment);
    }

    createCardElement(item) {
        const card = document.createElement('div');
        card.classList.add('catalog-card');
        card.dataset.id = item.id;

        const imageHtml = item.image
            ? `<img src="/images/img_n/${item.image}" alt="${this.escapeHtml(item.title || '')}" class="catalog-image">`
            : '<div class="catalog-no-image">Нет изображения</div>';

        // Бейдж скидки
        const discount = item.discount ? parseInt(item.discount) : 0;
        const badgeHtml = discount > 0
            ? `<div class="discount-badge"><div class="discount-badge-inner"><span class="discount-badge-text">${discount}</span></div></div>`
            : '';

        // Если есть цена — показываем как товар, иначе как новость
        const hasPrice = item.price && parseFloat(item.price) > 0;

        card.innerHTML = `
            <div class="catalog-card-inner">
                ${imageHtml}
            </div>
            <div class="catalog-card-content">
                <h3 class="catalog-card-title">${this.escapeHtml(item.title || 'Акция')}</h3>
                ${hasPrice ? `<div class="catalog-card-price">${item.price} ₽</div>` : ''}
                <p class="catalog-card-description">${this.escapeHtml(item.preview || item.content || '')}</p>
            </div>
            ${badgeHtml}
        `;

        return card;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    const constructor = new ActionsPageConstructor();
    constructor.init();
    // Загружаем и рендерим
    constructor.loadNews().then(news => {
        constructor.render(news);
    });
});
