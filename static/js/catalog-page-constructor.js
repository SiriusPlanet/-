/**
 * Catalog Page Constructor
 * Рендерит страницу каталога товаров, фильтруя только товары (category === 'Товары' ИЛИ category === undefined)
 */

import { NewsPageConstructor } from './news-page-constructor.js';

export class CatalogPageConstructor extends NewsPageConstructor {
    constructor() {
        super({
            containerSelector: '.news-grid',
            tickerContainerSelector: null // на странице каталога нет бегущей строки
        });
    }

    init() {
        console.log('[CatalogPageConstructor] Инициализация');

        // Ищем контейнер .news-grid
        this.newsContainer = document.querySelector('.news-grid');
        if (!this.newsContainer) {
            console.error('[CatalogPageConstructor] .news-grid not found');
            return;
        }
        console.log('[CatalogPageConstructor] .news-grid found');

        // Находим существующий контейнер для бегущей строки (не нужен на этой странице)
        this.tickerContainer = null;
    }

    async loadNews() {
        const news = await super.loadNews();
        
        // Фильтруем только товары (category === 'Товары' ИЛИ category === undefined)
        this.newsList = news.filter(
            n => n.category === 'Товары' || !n.category
        );
        console.log(`[CatalogPageConstructor] Загружено ${this.newsList.length} товаров из ${news.length} новостей`);
        return this.newsList;
    }

    async render(newsArray = []) {
        if (!this.newsContainer) {
            console.error('[CatalogPageConstructor] News container not initialized');
            return;
        }

        // Очищаем контейнер
        this.newsContainer.innerHTML = '';

        if (newsArray.length === 0) {
            this.newsContainer.innerHTML = '<p style="color: white; text-align: center;">Нет доступных товаров</p>';
            return;
        }

        // Рендерим карточки
        newsArray.forEach((news, index) => {
            const card = this.createCardElement(news, index);
            this.newsContainer.appendChild(card);
        });
    }

    createCardElement(news, index) {
        // Создаем карточку как product-card (а не news-card)
        const card = super.createCardElement(news, index);
        card.classList.remove('news-card');
        card.classList.add('product-card');
        return card;
    }
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    const constructor = new CatalogPageConstructor();
    constructor.init();
    constructor.render();
});
