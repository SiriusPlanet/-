/**
 * Publisher — единый публикатор лотов
 * Загружает все лоты с /get-news и раскладывает по страницам
 * 
 * Правила публикации:
 * - lotType === 'news' → news.html
 * - lotType === 'product' && !discount → catalog.html
 * - discount > 0 (любой lotType) → actions.html
 * 
 * Один лот может попасть на несколько страниц (например, товар со скидкой — и в каталог, и в акции)
 */

import { CardConstructor } from './card-constructor.js';
import { AccessLevels } from './access-levels.js';

export class Publisher {
    constructor() {
        this.cardConstructor = new CardConstructor();
        this.accessLevels = new AccessLevels();
        this.allLots = [];
    }

    /**
     * Загружает все лоты с сервера
     */
    async loadLots() {
        try {
            const res = await fetch('/get-news');
            if (!res.ok) throw new Error('Ошибка загрузки');
            const data = await res.json();
            this.allLots = data.news || [];
            return this.allLots;
        } catch (e) {
            console.error('[Publisher] Ошибка загрузки:', e);
            this.allLots = [];
            return [];
        }
    }

    /**
     * Публикует лоты на текущую страницу
     * @param {string} page - идентификатор страницы: 'news', 'catalog', 'actions'
     * @param {HTMLElement} container - контейнер для карточек
     */
    async publish(page, container) {
        if (!container) {
            console.error(`[Publisher] Контейнер для ${page} не найден`);
            return;
        }

        await this.loadLots();

        const lots = this.filterLots(page);

        container.innerHTML = '';

        if (lots.length === 0) {
            container.innerHTML = `<p style="color: white; text-align: center; padding: 40px;">Нет доступных ${this.getEmptyText(page)}</p>`;
            return;
        }

        const fragment = document.createDocumentFragment();

        lots.forEach(item => {
            const card = this.cardConstructor.createCard(item, {
                accessLevel: 3, // временно: показываем кнопки всем, пока не настроена система доступов
                onDelete: (id) => this.deleteLot(id, container, page),
                onDiscount: (id, btn, cardEl) => this.showDiscountPanel(id, btn, cardEl, container, page)
            });
            fragment.appendChild(card);
        });

        container.appendChild(fragment);
    }

    /**
     * Фильтрует лоты для конкретной страницы
     */
    filterLots(page) {
        switch (page) {
            case 'news':
                return this.allLots.filter(n => n.lotType === 'news');
            case 'catalog':
                return this.allLots.filter(n => n.lotType === 'product');
            case 'actions':
                // В акции попадают только ТОВАРЫ со скидкой
                return this.allLots.filter(n =>
                    n.lotType === 'product' && n.discount && parseInt(n.discount) > 0
                );
            default:
                return [];
        }
    }

    /**
     * Удаляет лот
     */
    async deleteLot(id, container, page) {
        if (!confirm('Удалить запись?')) return;

        try {
            const res = await fetch('/api/delete-news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (!res.ok) throw new Error('Ошибка удаления');

            this.showToast('Запись удалена');
            await this.publish(page, container);
        } catch (e) {
            console.error('[Publisher] Ошибка удаления:', e);
            this.showError('Ошибка при удалении');
        }
    }

    /**
     * Показывает панель управления скидкой
     */
    showDiscountPanel(itemId, btn, card, container, page) {
        const currentDiscount = parseInt(btn.dataset.discount) || 0;

        // Скрываем кнопку %, пока панель открыта
        btn.style.display = 'none';

        // Закрываем другие открытые панели
        card.querySelectorAll('.discount-panel').forEach(p => p.remove());

        const panel = document.createElement('div');
        panel.className = 'discount-panel';
        panel.innerHTML = `
            <label>Скидка %</label>
            <input type="range" min="0" max="100" value="${currentDiscount}" class="discount-slider">
            <input type="number" min="0" max="100" value="${currentDiscount}" class="discount-value-input">
            <div class="discount-actions">
                <button class="discount-save-btn">Сохранить</button>
                <button class="discount-cancel-btn">Отмена</button>
            </div>
        `;

        card.appendChild(panel);

        const slider = panel.querySelector('.discount-slider');
        const numInput = panel.querySelector('.discount-value-input');

        slider.addEventListener('input', () => { numInput.value = slider.value; });
        numInput.addEventListener('input', () => { slider.value = numInput.value; });

        panel.querySelector('.discount-save-btn').addEventListener('click', async () => {
            const discount = parseInt(numInput.value) || 0;
            await this.saveDiscount(itemId, discount, btn, panel, container, page);
        });

        panel.querySelector('.discount-cancel-btn').addEventListener('click', () => {
            this.closeDiscountPanel(btn, panel);
        });

        // Закрыть по клику вне панели
        const closeHandler = (e) => {
            if (!panel.contains(e.target) && e.target !== btn) {
                this.closeDiscountPanel(btn, panel);
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 100);
    }

    /**
     * Сохраняет скидку
     */
    async saveDiscount(itemId, discount, btn, panel, container, page) {
        try {
            const res = await fetch('/api/update-news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: itemId, discount })
            });

            const result = await res.json();
            if (result.success) {
                this.showToast(discount > 0 ? `Скидка ${discount}% установлена` : 'Скидка удалена');
                this.closeDiscountPanel(btn, panel);
                // Перепубликуем — лот со скидкой уйдёт в акции, без скидки вернётся в каталог
                await this.publish(page, container);
            } else {
                this.showError('Ошибка сохранения скидки');
            }
        } catch (e) {
            console.error('[Publisher] Ошибка сохранения скидки:', e);
            this.showError('Ошибка при сохранении скидки');
        }
    }

    closeDiscountPanel(btn, panel) {
        panel.remove();
        btn.style.display = '';
    }

    getEmptyText(page) {
        switch (page) {
            case 'news': return 'новостей';
            case 'catalog': return 'товаров';
            case 'actions': return 'акций';
            default: return 'записей';
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification success';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification error';
        toast.textContent = '❌ ' + message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
}