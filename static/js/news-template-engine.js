// static/js/news-template-engine.js
import { Logger } from './logger.js';

export class NewsTemplateEngine {
    constructor() {
        this.template = null;
        this.news = [];
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    async init() {
        try {
            await this.loadTemplate();
            await this.loadNews();
            this.render();
            Logger.log('NewsTemplateEngine готов');
        } catch (e) {
            Logger.error('NewsTemplateEngine failed', e);
        }
    }

    async loadTemplate() {
        const res = await fetch('/templates/news-card.html');
        if (!res.ok) throw new Error('Не загрузился шаблон');
        const parser = new DOMParser();
        this.template = parser.parseFromString(await res.text(), 'text/html').body.firstElementChild;
    }

    async loadNews() {
        const res = await fetch('/get-news');
        if (!res.ok) throw new Error('Не загрузились новости');
        this.news = await res.json();
    }

    escape(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    render() {
        const container = document.querySelector('.news-grid');
        if (!container) return;

        if (!this.news.length) {
            container.innerHTML = '<p>Нет активных хроник...</p>';
            return;
        }

        container.innerHTML = '';
        this.news.forEach(news => {
            const card = this.template.cloneNode(true);
            card.dataset.id = news.id;

            const img = card.querySelector('img');
            img.src = `/images/img_n/${news.image || '400.png'}`;

            card.querySelector('.news-card-title').textContent = this.escape(news.title);
            card.querySelector('.news-card-description').textContent = this.escape(news.preview);

            card.querySelector('.read-more-btn').onclick = () => {
                window.openNews?.(news.id);
            };

            container.appendChild(card);
        });
    }
}