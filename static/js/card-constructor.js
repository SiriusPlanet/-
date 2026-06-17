/**
 * CardConstructor — единый конструктор карточек для лотов
 * Собирает HTML-карточку из данных лота (новость, товар, акция)
 * 
 * Карточка содержит:
 * - изображение (или заглушку)
 * - заголовок
 * - цену (если есть)
 * - описание (preview)
 * - бейдж скидки (если discount > 0)
 * - кнопку Del (для админа)
 * - кнопку % (для админа, только у товаров)
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
        const { accessLevel = 0, onDelete, onDiscount } = options;
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
                priceHtml = `<div class="catalog-card-price">${this.escapeHtml(item.price)} ₽</div>`;
            }
        }

        // Бейдж скидки (угловой, слева сверху)
        const badgeHtml = discount > 0
            ? `<div class="discount-badge"><div class="discount-badge-inner"><span class="discount-badge-text">${discount}</span></div></div>`
            : '';

        // Кнопка Del — видна всем (временно, пока не настроена система доступов)
        const delBtnHtml = `<button class="ctrl-btn del-btn" data-id="${item.id}" title="Удалить">Del</button>`;

        // Кнопка % — видна всем, только для товаров (временно, пока не настроена система доступов)
        const discountBtnHtml = item.lotType === 'product'
            ? `<button class="ctrl-btn discount-btn" data-id="${item.id}" data-discount="${discount}" data-price="${item.price || ''}" title="Установить скидку">%</button>`
            : '';

        // Кнопка "В корзину" — только для товаров, выровнена вправо
        const cartBtnHtml = item.lotType === 'product'
            ? `<button class="cart-btn" data-id="${item.id}" title="Добавить в корзину">В корзину</button>`
            : '';

        console.log(`[CardConstructor] lotType=${item.lotType}, delBtn=${!!delBtnHtml}, discountBtn=${!!discountBtnHtml}`);

        card.innerHTML = `
            <div class="catalog-card-inner">
                <img src="${imgSrc}" alt="${title}" class="catalog-image" loading="lazy">
            </div>
            <div class="catalog-card-content">
                <h3 class="catalog-card-title">${title}</h3>
                ${priceHtml}
                <p class="catalog-card-description">${desc}</p>
                ${cartBtnHtml}
            </div>
            ${badgeHtml}
            ${delBtnHtml}
            ${discountBtnHtml}
        `;

        // Навешиваем обработчики — видно всем (временно, пока не настроена система доступов)
        const delBtn = card.querySelector('.del-btn');
        if (delBtn && onDelete) {
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                onDelete(item.id);
            });
        }

        const dscBtn = card.querySelector('.discount-btn');
        if (dscBtn && onDiscount) {
            dscBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                onDiscount(item.id, dscBtn, card);
            });
        }

        // Обработчик кнопки "В корзину"
        const cartBtn = card.querySelector('.cart-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addToCart(item);
            });
        }

        return card;
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