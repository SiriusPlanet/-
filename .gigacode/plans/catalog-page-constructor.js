// static/js/catalog-page-constructor.js
// Рендер карточек товаров на странице catalog.html

import { NewsPageConstructor } from './news-page-constructor.js';

export class CatalogPageConstructor extends NewsPageConstructor {
    constructor() {
        super({
            containerSelector: '.products-grid',
            tickerContainerSelector: null // на странице каталога нет бегущей строки
        });
    }

    async loadNews() {
        await super.loadNews();
        // Фильтруем только товары (category === 'Товары' ИЛИ category === undefined)
        this.newsList = this.newsList.filter(
            n => n.category === 'Товары' || !n.category
        );
        console.log(`[CatalogPageConstructor] Загружено ${this.newsList.length} товаров`);
    }

    createCardElement(news, index) {
        // Создаем карточку как product-card (а не news-card)
        const card = super.createCardElement(news, index);
        card.classList.remove('news-card');
        card.classList.add('product-card');
        return card;
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const constructor = new CatalogPageConstructor();
    constructor.init();
});
