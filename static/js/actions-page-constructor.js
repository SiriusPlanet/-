/**
 * Actions Page Constructor
 * Рендерит страницу акций, фильтруя только акции (category === 'Акции' ИЛИ есть поле discount)
 */

import { NewsPageConstructor } from './news-page-constructor.js';

export class ActionsPageConstructor extends NewsPageConstructor {
    constructor() {
        super({
            containerSelector: '.products-grid',
            tickerContainerSelector: null // на странице акций нет бегущей строки
        });
    }

    init() {
        console.log('[ActionsPageConstructor] Инициализация');

        // Ищем контейнер .products-grid
        this.newsContainer = document.querySelector('.products-grid');
        if (!this.newsContainer) {
            console.error('[ActionsPageConstructor] .products-grid not found');
            return;
        }
        console.log('[ActionsPageConstructor] .products-grid found');

        // Находим существующий контейнер для бегущей строки (не нужен на этой странице)
        this.tickerContainer = null;
    }

    async loadNews() {
        const news = await super.loadNews();
        
        // Фильтруем только акции (category === 'Акции' ИЛИ есть поле discount)
        this.newsList = news.filter(
            n => n.category === 'Акции' || (n.discount && n.discount > 0)
        );
        console.log(`[ActionsPageConstructor] Загружено ${this.newsList.length} акций из ${news.length} новостей`);
        return this.newsList;
    }

    async render(newsArray = []) {
        if (!this.newsContainer) {
            console.error('[ActionsPageConstructor] News container not initialized');
            return;
        }

        // Очищаем контейнер
        this.newsContainer.innerHTML = '';

        if (newsArray.length === 0) {
            this.newsContainer.innerHTML = '<p style="color: white; text-align: center;">Нет доступных акций</p>';
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
    const constructor = new ActionsPageConstructor();
    constructor.init();
    constructor.render();
});
