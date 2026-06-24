/**
 * CardConstructor — единый конструктор карточек для лотов
 * Собирает HTML-карточку из данных лота (новость, товар, акция)
 * 
 * Формат карточки (P2-1):
 * - Товар: 1 строка — заголовок, 2-3 строки — описание (с ...),
 *   предпоследняя строка — цена (при скидке базовая + новая),
 *   нижняя строка — кнопки "Узнать больше" + "В корзину"
 * - Новость: 1-2 строки — заголовок (с ...), остальное — краткое содержание (с ...)
 * 
 * Логика снятия (P0-2):
 * - Кнопка H скрывает карточку из каталога и добавляет в moveTable
 * - moveTable видна для уровней 2+
 * - При ↩ карточка возвращается в каталог
 * 
 * Логика скидок (P0-3):
 * - Если discount > 0, карточка отображается ТОЛЬКО на actions.html
 */

export class CardConstructor {
    /**
     * Создаёт DOM-элемент карточки из данных лота
     * @param {Object} item - данные лота { id, title, preview, content, image, price, discount, lotType }
     * @param {Object} options - опции
     * @param {number} options.accessLevel - уровень доступа (3 = админ)
     * @param {Function} options.onDelete - callback при удалении
     * @param {Function} options.onDiscount - callback при изменении скидки
     * @param {string} options.pageContext - контекст страницы ('catalog', 'actions', 'news')
     * @returns {HTMLElement|null} - элемент .catalog-card или null если карточка скрыта
     */
    createCard(item, options = {}) {
        const { accessLevel = 0, onDelete, onDiscount, onEdit, pageContext = 'catalog' } = options;
        const discount = parseInt(item.discount) || 0;

        // P0-3: Если есть скидка и мы НЕ на странице акций — не показываем
        if (discount > 0 && pageContext !== 'actions') {
            return null;
        }

        // P0-2: Если лот в moveTable (localStorage) и мы на каталоге — не показываем
        if (pageContext === 'catalog') {
            const movedIds = this._getMovedIds();
            if (movedIds.includes(item.id)) {
                return null;
            }
        }

        const card = document.createElement('div');
        card.classList.add('catalog-card');
        card.dataset.id = item.id;
        card.dataset.lotType = item.lotType || 'news';

        // Нормализуем путь к изображению
        let imgSrc = '/images/img_n/400.png';
        if (item.image) {
            if (item.image.startsWith('images/') || item.image.startsWith('/images/')) {
                imgSrc = item.image.startsWith('/') ? item.image : '/' + item.image;
            } else {
                imgSrc = `/images/img_n/${item.image}`;
            }
        }

        const title = this.escapeHtml(item.title || '');
        const desc = this.escapeHtml(item.preview || item.content || '');

        // P2-1: Цена — всегда прижата к низу
        let priceHtml = '';
        if (item.price) {
            const originalPrice = parseFloat(item.price);
            if (discount > 0) {
                const discountedPrice = (originalPrice * (100 - discount) / 100).toFixed(2);
                priceHtml = `
                    <div class="catalog-card-price">
                        <span class="old-price">${this.escapeHtml(item.price)} ₽</span>
                        <span class="new-price">${discountedPrice} ₽</span>
                    </div>
                `;
            } else {
                priceHtml = `<div class="catalog-card-price"><span>${this.escapeHtml(item.price)} ₽</span></div>`;
            }
        }

        // Бейдж скидки
        const badgeHtml = discount > 0
            ? `<div class="discount-badge"><span class="discount-badge-text">${discount}<small>%</small></span></div>`
            : '';

        // P2-1: Описание с ограничением по строкам (CSS text-overflow)
        const descClass = item.lotType === 'product' ? 'card-desc card-desc--product' : 'card-desc card-desc--news';

        // Кнопки управления (видимы для админа)
        const moveBtnHtml = accessLevel >= 2
            ? `<button class="ctrl-btn move-btn" data-id="${item.id}" title="Снять с показа">H</button>`
            : '';
        const delBtnHtml = accessLevel >= 3
            ? `<button class="ctrl-btn del-btn" data-id="${item.id}" title="Удалить">Del</button>`
            : '';
        const editBtnHtml = accessLevel >= 2
            ? `<button class="ctrl-btn edit-btn" data-id="${item.id}" title="Редактировать">re:</button>`
            : '';
        const discountBtnHtml = (item.lotType === 'product' && accessLevel >= 2)
            ? `<button class="ctrl-btn discount-btn" data-id="${item.id}" data-discount="${discount}" data-price="${item.price || ''}" title="Установить скидку">%</button>`
            : '';

        // Кнопка "Узнать больше..." — для всех
        const detailBtnHtml = `<button class="detail-btn" data-id="${item.id}" title="Подробнее">Узнать больше...</button>`;

        // Кнопка корзины 🛒 — только для товаров
        const cartIconHtml = item.lotType === 'product'
            ? `<button class="cart-icon-btn" data-id="${item.id}" title="Добавить в корзину">🛒</button>`
            : '';

        // P2-1: Собираем карточку — заголовок, описание, цена, кнопки
        card.innerHTML = `
            <div class="catalog-card-inner">
                <img src="${imgSrc}" alt="${title}" class="catalog-image" loading="lazy">
                ${badgeHtml}
                ${moveBtnHtml}
                ${delBtnHtml}
                ${editBtnHtml}
                ${discountBtnHtml}
            </div>
            <div class="catalog-card-content">
                <div class="catalog-card-header">
                    <h3 class="catalog-card-title" title="${title}">${title}</h3>
                    <div class="${descClass}" title="${desc}">${desc || "Описание отсутствует"}</div>
                </div>
                ${priceHtml}
                <div class="catalog-card-footer">
                    ${detailBtnHtml}
                    ${cartIconHtml}
                </div>
            </div>
        `;
        // Навешиваем обработчики
        const moveBtn = card.querySelector('.move-btn');
        if (moveBtn) {
            moveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.moveToTable(item, card);
            });
        }

        const delBtn = card.querySelector('.del-btn');
        if (delBtn && onDelete) {
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                onDelete(item.id);
            });
        }

        const editBtn = card.querySelector('.edit-btn');
        if (editBtn && onEdit) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                onEdit(item);
            });
        }

        const dscBtn = card.querySelector('.discount-btn');
        if (dscBtn && onDiscount) {
            dscBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Вызываем onDiscount для открытия панели скидки (в publisher.js)
                onDiscount(item, dscBtn, card);
            });
        }

        const detailBtn = card.querySelector('.detail-btn');
        if (detailBtn) {
            detailBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openDetailModal(item);
            });
        }

        const cartIcon = card.querySelector('.cart-icon-btn');
        if (cartIcon) {
            cartIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addToCart(item);
            });
        }

        return card;
    }


    /**
     * P0-2: Перемещает товар в таблицу снятых (#moveTable) и скрывает из каталога
     */
    moveToTable(item, card) {
        const tableBody = document.getElementById('moveTableBody');
        const moveTable = document.getElementById('moveTable');
        if (!tableBody || !moveTable) return;

        // Показываем таблицу
        moveTable.style.display = 'block';

        // Проверяем, нет ли уже такого товара в таблице
        const existingRow = tableBody.querySelector(`tr[data-id="${item.id}"]`);
        if (existingRow) return;

        // Сохраняем ID в localStorage, чтобы при перезагрузке не показывать
        this._addMovedId(item.id);

        // Скрываем карточку из каталога
        card.style.display = 'none';

        const title = this.escapeHtml(item.title || 'Без названия');
        const price = item.price ? `${this.escapeHtml(item.price)} ₽` : '—';

        const row = document.createElement('tr');
        row.dataset.id = item.id;
        row.innerHTML = `
            <td>${title}</td>
            <td>${price}</td>
            <td><button class="move-table-remove-btn" data-id="${item.id}" title="Вернуть в каталог">↩</button></td>
        `;

        // Обработчик кнопки "Вернуть"
        row.querySelector('.move-table-remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            // Удаляем из localStorage
            this._removeMovedId(item.id);
            // Удаляем строку
            row.remove();
            // Показываем карточку снова (если она ещё в DOM)
            card.style.display = '';
            // Если таблица пуста — скрываем
            if (tableBody.children.length === 0) {
                moveTable.style.display = 'none';
            }
            this.showCartToast(`«${title}» возвращён в каталог`);
        });

        tableBody.appendChild(row);
        this.showCartToast(`«${title}» снят с показа`);
    }

    /**
     * P0-2: Сохраняет ID снятого лота в localStorage
     */
    _getMovedIds() {
        try {
            const data = localStorage.getItem('mySiteMovedItems');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    _addMovedId(id) {
        const ids = this._getMovedIds();
        if (!ids.includes(id)) {
            ids.push(id);
            localStorage.setItem('mySiteMovedItems', JSON.stringify(ids));
        }
    }

    _removeMovedId(id) {
        const ids = this._getMovedIds().filter(i => i !== id);
        localStorage.setItem('mySiteMovedItems', JSON.stringify(ids));
    }

    /**
     * Открывает модальное окно с детальной информацией о товаре
     */
    openDetailModal(item) {
        const modal = document.getElementById('detailModal');
        if (!modal) {
            console.warn('[CardConstructor] #detailModal не найден в DOM');
            return;
        }

        const title = this.escapeHtml(item.title || '');
        const desc = this.escapeHtml(item.preview || item.content || '');
        const content = this.escapeHtml(item.content || '');
        const discount = parseInt(item.discount) || 0;

        let imgSrc = '/images/img_n/400.png';
        if (item.image) {
            if (item.image.startsWith('images/') || item.image.startsWith('/images/')) {
                imgSrc = item.image.startsWith('/') ? item.image : '/' + item.image;
            } else {
                imgSrc = `/images/img_n/${item.image}`;
            }
        }

        let priceHtml = '';
        if (item.price) {
            const originalPrice = parseFloat(item.price);
            if (discount > 0) {
                const discountedPrice = (originalPrice * (100 - discount) / 100).toFixed(2);
                priceHtml = `
                    <div class="detail-price">
                        <span class="old-price">${this.escapeHtml(item.price)} ₽</span>
                        <span class="new-price">${discountedPrice} ₽</span>
                    </div>
                `;
            } else {
                priceHtml = `<div class="detail-price">${this.escapeHtml(item.price)} ₽</div>`;
            }
        }

        const fullDesc = content || 'Описание отсутствует';

        const contextHtml = item.lotType === 'product' ? `
            <div class="detail-context">
                <p>🕰️ Данный предмет подвержен <strong>локальной квантовой нестабильности</strong>.
                Это означает, что его временная линия может быть отозвана в любой момент
                без предварительного уведомления.</p>
                <p>📜 Согласно Положению о вневременной торговле (п. 3, ст. 7),
                приобретается не сам предмет, а <strong>воспоминание</strong> о нём.
                Если вы помните этот предмет — претензий нет.
                Если не помните — тем более.</p>
                <p class="hint">⚖️ Юридическая лазейка сохранена.</p>
            </div>
        ` : '';

        const headerEl = modal.querySelector('.modal-header h2');
        const bodyEl = modal.querySelector('.modal-body');
        const footerEl = modal.querySelector('.modal-footer');

        if (headerEl) {
            headerEl.textContent = title;
        }

        if (bodyEl) {
            bodyEl.innerHTML = `
                ${imgSrc ? `<img src="${imgSrc}" alt="${title}" class="detail-image" loading="lazy">` : ''}
                ${priceHtml}
                ${desc ? `<div class="detail-preview">${desc}</div>` : ''}
                <div class="detail-description">${fullDesc}</div>
                ${contextHtml}
            `;
        }

        if (footerEl) {
            const cartBtn = footerEl.querySelector('.cart-btn');
            if (item.lotType === 'product') {
                if (!cartBtn) {
                    const btn = document.createElement('button');
                    btn.className = 'cart-btn';
                    btn.textContent = '🛒 В корзину';
                    btn.addEventListener('click', () => {
                        this.addToCart(item);
                        this.closeDetailModal();
                    });
                    footerEl.appendChild(btn);
                } else {
                    cartBtn.style.display = '';
                    cartBtn.onclick = null;
                    cartBtn.addEventListener('click', () => {
                        this.addToCart(item);
                        this.closeDetailModal();
                    });
                }
            } else {
                if (cartBtn) cartBtn.style.display = 'none';
            }
        }

        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            modal.classList.add('is-visible');
        });
    }

    closeDetailModal() {
        const modal = document.getElementById('detailModal');
        if (!modal) return;
        modal.classList.remove('is-visible');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }

    addToCart(item) {
        const discount = parseInt(item.discount) || 0;
        const originalPrice = parseFloat(item.price) || 0;
        const finalPrice = discount > 0
            ? (originalPrice * (100 - discount) / 100)
            : originalPrice;

        const cartItem = {
            id: item.id,
            title: item.title,
            price: finalPrice.toFixed(2),
            originalPrice: originalPrice.toFixed(2),
            discount: discount,
            image: item.image || '',
            quantity: 1
        };

        let cart = [];
        try {
            const stored = localStorage.getItem('mySiteCart');
            if (stored) cart = JSON.parse(stored);
        } catch (e) {
            cart = [];
        }

        const existing = cart.find(c => c.id === item.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push(cartItem);
        }

        localStorage.setItem('mySiteCart', JSON.stringify(cart));
        this.showCartToast(`«${item.title}» добавлен в корзину`);

        // Обновляем счётчик корзины, если функция есть
        if (window.updateCartBadge) {
            window.updateCartBadge();
        }
    }

    showCartToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification success';
        toast.textContent = '🛒 ' + message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}