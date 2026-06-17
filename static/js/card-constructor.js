/**
 * CardConstructor — единый конструктор карточек для лотов
 * Собирает HTML-карточку из данных лота (новость, товар, акция)
 * 
 * Карточка содержит:
 * - изображение (или заглушку)
 * - заголовок
 * - цену (если есть)
 * - бейдж скидки (если discount > 0)
 * - кнопку Del (для админа)
 * - кнопку % (для админа, только у товаров)
 * - кнопку "Узнать больше..." (detail-btn)
 * - круглую кнопку корзины 🛒 (cart-icon-btn, только для товаров)
 */

export class CardConstructor {
    /**
     * Создаёт DOM-элемент карточки из данных лота
     * @param {Object} item - данные лота { id, title, preview, content, image, price, discount, lotType }
     * @param {Object} options - опции
     * @param {number} options.accessLevel - уровень доступа (3 = админ)
     * @param {Function} options.onDelete - callback при удалении
     * @param {Function} options.onDiscount - callback при изменении скидки
     * @returns {HTMLElement} - элемент .catalog-card
     */
    createCard(item, options = {}) {
        const { accessLevel = 0, onDelete, onDiscount, onEdit } = options;
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
        const discount = parseInt(item.discount) || 0;

        // Цена: если есть скидка — показываем старую цену зачёркнутой и новую справа
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

        // Бейдж скидки — круг с радиальным градиентом, центр в левом верхнем углу
        const badgeHtml = discount > 0
            ? `<div class="discount-badge"><span class="discount-badge-text">${discount}<small>%</small></span></div>`
            : '';

        // Кнопка Del — видна всем (временно, пока не настроена система доступов)
        const delBtnHtml = `<button class="ctrl-btn del-btn" data-id="${item.id}" title="Удалить">Del</button>`;

        // Кнопка re: — редактирование лота
        const editBtnHtml = `<button class="ctrl-btn edit-btn" data-id="${item.id}" title="Редактировать">re:</button>`;

        // Кнопка % — видна всем, только для товаров (временно, пока не настроена система доступов)
        const discountBtnHtml = item.lotType === 'product'
            ? `<button class="ctrl-btn discount-btn" data-id="${item.id}" data-discount="${discount}" data-price="${item.price || ''}" title="Установить скидку">%</button>`
            : '';

        // Кнопка "Узнать больше..." — для всех типов лотов
        const detailBtnHtml = `<button class="detail-btn" data-id="${item.id}" title="Подробнее">Узнать больше...</button>`;

        // Круглая кнопка корзины 🛒 — только для товаров
        const cartIconHtml = item.lotType === 'product'
            ? `<button class="cart-icon-btn" data-id="${item.id}" title="Добавить в корзину">🛒</button>`
            : '';

        console.log(`[CardConstructor] lotType=${item.lotType}, delBtn=${!!delBtnHtml}, discountBtn=${!!discountBtnHtml}`);

        card.innerHTML = `
            <div class="catalog-card-inner">
                <img src="${imgSrc}" alt="${title}" class="catalog-image" loading="lazy">
                ${badgeHtml}
                ${delBtnHtml}
                ${editBtnHtml}
                ${discountBtnHtml}
            </div>
            <div class="catalog-card-content">
                <h3 class="catalog-card-title">${title}</h3>
                ${priceHtml}
                <div class="catalog-card-footer">
                    ${detailBtnHtml}
                    ${cartIconHtml}
                </div>
            </div>
        `;

        // Навешиваем обработчики — видно всем (временно, пока не настроена система доступов)
        const delBtn = card.querySelector('.del-btn');
        if (delBtn && onDelete) {
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                onDelete(item.id);
            });
        }

        // Обработчик кнопки re:
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
                onDiscount(item.id, dscBtn, card);
            });
        }

        // Обработчик кнопки "Узнать больше..."
        const detailBtn = card.querySelector('.detail-btn');
        if (detailBtn) {
            detailBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openDetailModal(item);
            });
        }

        // Обработчик круглой кнопки корзины
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
     * Открывает модальное окно с детальной информацией о товаре
     * @param {Object} item - данные лота
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

        // Нормализуем путь к изображению
        let imgSrc = '/images/img_n/400.png';
        if (item.image) {
            if (item.image.startsWith('images/') || item.image.startsWith('/images/')) {
                imgSrc = item.image.startsWith('/') ? item.image : '/' + item.image;
            } else {
                imgSrc = `/images/img_n/${item.image}`;
            }
        }

        // Цена
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

        // Полное описание (content) + preview отдельно
        const fullDesc = content || 'Описание отсутствует';

        // Контекст вселенной (для товаров)
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

        // Заполняем модалку
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

        // Кнопка в футере — только для товаров
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

        // Показываем модалку
        modal.classList.remove('hidden');
        // Небольшая задержка для срабатывания transition
        requestAnimationFrame(() => {
            modal.classList.add('is-visible');
        });
    }

    /**
     * Закрывает модальное окно детального просмотра
     */
    closeDetailModal() {
        const modal = document.getElementById('detailModal');
        if (!modal) return;
        modal.classList.remove('is-visible');
        // После завершения анимации скрываем
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }

    /**
     * Добавляет товар в корзину (localStorage)
     */
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

        // Получаем текущую корзину из localStorage
        let cart = [];
        try {
            const stored = localStorage.getItem('mySiteCart');
            if (stored) cart = JSON.parse(stored);
        } catch (e) {
            cart = [];
        }

        // Проверяем, есть ли уже такой товар
        const existing = cart.find(c => c.id === item.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push(cartItem);
        }

        localStorage.setItem('mySiteCart', JSON.stringify(cart));

        // Показываем уведомление
        this.showCartToast(`«${item.title}» добавлен в корзину`);
    }

    /**
     * Показывает toast-уведомление о добавлении в корзину
     */
    showCartToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification success';
        toast.textContent = '🛒 ' + message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    /**
     * Экранирует HTML-сущности
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}