/**
 * Publisher — единый публикатор лотов
 * Загружает все лоты с /get-news и раскладывает по страницам
 *
 * Правила публикации:
 * - lotType === 'news' → news.html
 * - lotType === 'product' → catalog.html (все товары, включая топ)
 * - discount > 0 (любой lotType) → actions.html
 * - page === 'index' → только топ-лоты (Топ 3)
 *
 * Топ-лоты дублируются на index.html и catalog.html — это особенность,
 * гарантирующая их присутствие на главной (юридическая лазейка сохранена).
 */

import { CardConstructor } from './card-constructor.js';
import { AccessLevels } from './access-levels.js';

export class Publisher {
    /**
     * ID топ-лотов для index.html (Топ 3)
     * Эти лоты показываются на главной и в каталоге одновременно
     */
    static TOP_LOT_IDS = ['1781000000001', '1781000000002', '1781000000003'];

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
     * @param {string} page - идентификатор страницы: 'news', 'catalog', 'actions', 'index'
     * @param {HTMLElement} container - контейнер для карточек
     * @param {Object} options - доп. опции
     * @param {string} options.cardClass - CSS-класс для карточки (например, 'card-compact')
     */
    async publish(page, container, options = {}) {
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
                accessLevel: 3,
                onDelete: (id) => this.deleteLot(id, container, page),
                onDiscount: (id, btn, cardEl) => this.showDiscountPanel(id, btn, cardEl, container, page),
                onEdit: (item) => this.editLot(item, container, page)
            });
            // Добавляем CSS-класс для масштабирования, если передан
            if (options.cardClass) {
                card.classList.add(options.cardClass);
            }
            fragment.appendChild(card);
        });

        container.appendChild(fragment);
    }

    /**
     * Фильтрует лоты для конкретной страницы
     * @param {string} page - идентификатор страницы
     */
    filterLots(page) {
        switch (page) {
            case 'news':
                return this.allLots.filter(n => n.lotType === 'news');
            case 'catalog':
                return this.allLots.filter(n => n.lotType === 'product');
            case 'index':
                // Только топ-лоты для главной
                return this.allLots.filter(n =>
                    Publisher.TOP_LOT_IDS.includes(n.id)
                );
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
     * Открывает модалку редактирования лота с предзаполненными данными
     */
    editLot(item, container, page) {
        const modal = document.getElementById('addNewsModal');
        if (!modal) return;

        // Заполняем поля формы
        document.getElementById('title').value = item.title || '';
        document.getElementById('date').value = item.date || '';
        document.getElementById('preview').value = item.preview || '';
        document.getElementById('content').value = item.content || '';
        document.getElementById('price').value = item.price || '';

        // Устанавливаем активный таб по типу лота
        const lotType = item.lotType || 'news';
        document.querySelectorAll('.form-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.lottype === lotType);
        });

        // Показываем/скрываем поля цены/даты
        const isProduct = lotType === 'product';
        const priceGroup = document.getElementById('priceGroup');
        if (priceGroup) priceGroup.classList.toggle('hidden', !isProduct);
        const dateGroup = document.getElementById('dateGroup');
        if (dateGroup) dateGroup.classList.toggle('hidden', isProduct);

        // Сохраняем ID редактируемого лота и исходный тип
        const form = document.getElementById('newsForm');
        form.dataset.editId = item.id;
        form.dataset.originalLotType = item.lotType || 'news';

        // ⚠️ Индикатор на табе с исходным типом
        document.querySelectorAll('.form-tab').forEach(t => {
            t.classList.remove('has-warning');
            t.removeAttribute('title');
        });
        const originalTab = document.querySelector(`.form-tab[data-lottype="${item.lotType || 'news'}"]`);
        if (originalTab) {
            originalTab.classList.add('has-warning');
            const typeNames = { news: 'новость', product: 'товар' };
            originalTab.title = `Изначальный тип: ${typeNames[item.lotType] || item.lotType}`;
        }

        // Показываем модалку
        modal.classList.remove('hidden');
        modal.classList.add('is-visible');
        document.body.style.overflow = 'hidden';

        // Меняем текст кнопки сабмита
        const submitBtn = modal.querySelector('.btn-submit');
        if (submitBtn) submitBtn.textContent = 'Обновить';
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
     * Сохраняет скидку и обновляет цену на карточке без перезагрузки страницы
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

                // Обновляем цену на карточке на месте
                const card = btn.closest('.catalog-card');
                if (card) {
                    this.updateCardPrice(card, discount);
                }

                // Обновляем data-discount на кнопке
                btn.dataset.discount = discount;

                // Перепубликуем текущую страницу, чтобы акции обновились
                await this.publish(page, container);
            } else {
                this.showError('Ошибка сохранения скидки');
            }
        } catch (e) {
            console.error('[Publisher] Ошибка сохранения скидки:', e);
            this.showError('Ошибка при сохранении скидки');
        }
    }

    /**
     * Обновляет отображение цены на карточке при изменении скидки
     */
    updateCardPrice(card, discount) {
        const priceEl = card.querySelector('.catalog-card-price');
        if (!priceEl) return;

        // Берём оригинальную цену из data-price на кнопке %
        const discountBtn = card.querySelector('.discount-btn');
        if (!discountBtn) return;

        const originalPrice = parseFloat(discountBtn.dataset.price);
        if (!originalPrice) return;

        discount = parseInt(discount) || 0;

        if (discount > 0) {
            const discountedPrice = (originalPrice * (100 - discount) / 100).toFixed(2);
            priceEl.innerHTML = `
                <span class="old-price">${originalPrice.toFixed(2)} ₽</span>
                <span class="new-price">${discountedPrice} ₽</span>
            `;
        } else {
            priceEl.innerHTML = `${originalPrice.toFixed(2)} ₽`;
        }

        // Обновляем/добавляем бейдж скидки
        let badge = card.querySelector('.discount-badge');
        if (discount > 0) {
            if (!badge) {
                const wrapper = document.createElement('div');
                wrapper.className = 'discount-badge';
                wrapper.innerHTML = `<div class="discount-badge-inner"><span class="discount-badge-text">${discount}</span></div>`;
                card.appendChild(wrapper);
            } else {
                const textEl = badge.querySelector('.discount-badge-text');
                if (textEl) textEl.textContent = discount;
            }
        } else {
            if (badge) badge.remove();
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