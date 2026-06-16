// catalog.js - Работа с каталогом товаров
import { NewsManager } from './news-manager.js';
import { Logger } from './logger.js';

export class CatalogManager {
    constructor(newsManager) {
        console.log('[CatalogManager] Инициализация');
        if (!newsManager) {
            throw new Error('NewsManager не передан в CatalogManager');
        }
        this.newsManager = newsManager;
        this.init();
    }

    init() {
        this.setupTabs();
        this.setupFormHandlers();
        this.renderProducts();
        this.setupAddButton();
    }

    // Рендеринг товаров
    async renderProducts() {
        const newsGrid = document.querySelector('.news-grid');
        if (!newsGrid) return;

        try {
            const res = await fetch('/get-news');
            if (!res.ok) throw new Error('Не удалось загрузить товары');
            const data = await res.json();

            newsGrid.innerHTML = '';
            const fragment = document.createDocumentFragment();

            data.news.forEach((item) => {
                // Если это товар (lotType === 'product') И без скидки (скидочные уходят в Акции)
                if (item.lotType === 'product' && !(item.discount && item.discount > 0)) {
                    const card = this.createProductCard(item);
                    fragment.appendChild(card);
                }
            });

            newsGrid.appendChild(fragment);
            this.setupDiscountButtons();
            console.log('[CatalogManager] Товары отрендерены');
        } catch (error) {
            Logger.error('[CatalogManager] Ошибка рендеринга товаров', error);
        }
    }

    // Создание карточки товара
    createProductCard(item) {
        const card = document.createElement('div');
        card.classList.add('catalog-card');
        card.dataset.id = item.id;

        const imageHtml = item.image ?
            `<img src="/images/img_n/${item.image}" alt="${this.escapeHtml(item.title)}" class="catalog-image">` :
            '<div class="catalog-no-image">Нет изображения</div>';

        // Бейдж скидки, если есть
        const badgeHtml = (item.discount && item.discount > 0)
            ? `<div class="discount-badge"><div class="discount-badge-inner"><span class="discount-badge-text">${item.discount}</span></div></div>`
            : '';

        card.innerHTML = `
            <div class="catalog-card-inner">
                ${imageHtml}
            </div>
            <div class="catalog-card-content">
                <h3 class="catalog-card-title">${this.escapeHtml(item.title)}</h3>
                <div class="catalog-card-price">${item.price ? item.price + ' ₽' : 'Цена не указана'}</div>
                <p class="catalog-card-description">${this.escapeHtml(item.preview || item.content || '')}</p>
            </div>
            <button class="discount-btn" data-id="${item.id}" data-discount="${item.discount || 0}" title="Установить скидку">%</button>
            ${badgeHtml}
        `;

        return card;
    }

    // Настройка кнопок скидки
    setupDiscountButtons() {
        document.querySelectorAll('.discount-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = btn.closest('.catalog-card');
                // Закрываем другие открытые панели
                document.querySelectorAll('.discount-panel').forEach(p => p.remove());
                this.showDiscountPanel(btn, card);
            });
        });
    }

    // Показать панель управления скидкой
    showDiscountPanel(btn, card) {
        const itemId = btn.dataset.id;
        const currentDiscount = parseInt(btn.dataset.discount) || 0;

        // Убираем кнопку %, пока панель открыта
        btn.style.display = 'none';

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

        // Синхронизация ползунка и поля ввода
        slider.addEventListener('input', () => {
            numInput.value = slider.value;
        });
        numInput.addEventListener('input', () => {
            slider.value = numInput.value;
        });

        // Сохранение
        panel.querySelector('.discount-save-btn').addEventListener('click', async () => {
            const discount = parseInt(numInput.value) || 0;
            await this.saveDiscount(itemId, discount, btn, panel, card);
        });

        // Отмена
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

    // Сохранение скидки
    async saveDiscount(itemId, discount, btn, panel, card) {
        try {
            const res = await fetch('/api/update-news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: itemId, discount: discount })
            });

            const result = await res.json();
            if (result.success) {
                this.newsManager.showToast(discount > 0 ? `Скидка ${discount}% установлена` : 'Скидка удалена');
                this.closeDiscountPanel(btn, panel);
                // Перерендериваем каталог (товар со скидкой уйдёт в Акции)
                await this.renderProducts();
            } else {
                this.newsManager.showError('Ошибка сохранения скидки');
            }
        } catch (error) {
            Logger.error('[CatalogManager] Ошибка сохранения скидки', error);
            this.newsManager.showError('Ошибка при сохранении скидки');
        }
    }

    // Закрыть панель скидки
    closeDiscountPanel(btn, panel) {
        panel.remove();
        btn.style.display = '';
    }

    // Настройка переключения закладок
    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;

                // Убираем активный класс у всех кнопок и контентов
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                // Добавляем активный класс текущей кнопке и контенту
                btn.classList.add('active');
                document.getElementById(`tab-${tabName}`).classList.add('active');
            });
        });
    }

    // Настройка обработчиков форм
    setupFormHandlers() {
        const newsForm = document.getElementById('newsForm');
        const productForm = document.getElementById('productForm');

        if (newsForm) {
            newsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleNewsSubmit(e.target);
            });
            
            // Обработка выбора файла для новости
            const newsImageInput = document.getElementById('image');
            const newsUploadLabel = newsForm.querySelector('.file-upload-label span:last-child');
            if (newsImageInput && newsUploadLabel) {
                newsImageInput.addEventListener('change', () => {
                    const file = newsImageInput.files[0];
                    newsUploadLabel.textContent = file ? file.name : 'Выберите файл для иллюстрации...';
                });
            }
        }

        if (productForm) {
            productForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleProductSubmit(e.target);
            });
            
            // Обработка выбора файла для товара
            const productImageInput = document.getElementById('productImage');
            const productUploadLabel = productForm.querySelector('.file-upload-label span:last-child');
            if (productImageInput && productUploadLabel) {
                productImageInput.addEventListener('change', () => {
                    const file = productImageInput.files[0];
                    productUploadLabel.textContent = file ? file.name : 'Выберите файл для иллюстрации...';
                });
            }
        }

        // Кнопка "Отмена" - закрывает модальное окно
        const cancelBtns = document.querySelectorAll('.cancel-btn');
        cancelBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal('addNewsModal');
            });
        });

        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Закрытие по клику вне модалки
        const modal = document.getElementById('addNewsModal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal('addNewsModal');
            }
        });
    }

    // Открытие модального окна
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('is-visible');
            document.body.style.overflow = 'hidden';
        }
    }

    // Закрытие модального окна
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('is-visible');
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    // Закрытие всех модальных окон
    closeAllModals() {
        ['viewNewsModal', 'addNewsModal'].forEach(id => {
            this.closeModal(id);
        });
    }

    // Настройка кнопки "Добавить лот"
    setupAddButton() {
        const addBtn = document.querySelector('.add-news-btn');
        if (!addBtn) return;

        addBtn.addEventListener('click', () => {
            console.log('[CatalogManager] Клик по кнопке "Добавить лот"');
            this.openModal('addNewsModal');
            // Устанавливаем активной вкладку "Товары"
            this.switchToProductTab();
        });
    }

    // Переключение на вкладку "Товары"
    switchToProductTab() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            if (btn.dataset.tab === 'products') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        tabContents.forEach(c => {
            if (c.id === 'tab-products') {
                c.classList.add('active');
            } else {
                c.classList.remove('active');
            }
        });
    }

    // Обработка формы новостей
    async handleNewsSubmit(form) {
        try {
            const formData = new FormData(form);
            
            // Валидация
            const title = formData.get('title')?.trim();
            const preview = formData.get('preview')?.trim();
            const content = formData.get('content')?.trim();

            if (!title || !preview || !content) {
                this.newsManager.showError('Заполните все поля формы');
                return;
            }

            const result = await this.newsManager.saveNews(formData);
            
            if (result.success) {
                this.newsManager.showToast('Новость сохранена');
                this.closeModal('addNewsModal');
                await this.newsManager.loadNews();
                form.reset();
                this.resetUploadLabels(form);
            } else {
                this.newsManager.showError(result.error);
            }
        } catch (error) {
            Logger.error('[CatalogManager] Ошибка сохранения новости', error);
            this.newsManager.showError('Ошибка при сохранении');
        }
    }

    // Обработка формы товаров
    async handleProductSubmit(form) {
        try {
            // Собираем данные вручную, чтобы корректно обработать файл
            const productName = document.getElementById('productName')?.value?.trim();
            const productPrice = document.getElementById('productPrice')?.value?.trim();
            const productDescription = document.getElementById('productDescription')?.value?.trim();
            const productImageFile = document.getElementById('productImage')?.files[0];

            // Валидация
            if (!productName || !productPrice || !productDescription) {
                this.newsManager.showError('Заполните все поля формы товара');
                return;
            }

            // Формируем FormData вручную
            const formData = new FormData();
            formData.append('title', productName);
            formData.append('preview', productDescription);
            formData.append('content', productDescription);
            formData.append('lotType', 'product');
            
            // Добавляем цену
            formData.append('price', productPrice);
            
            // Добавляем изображение если оно есть
            if (productImageFile) {
                formData.append('image', productImageFile);
            }

            const result = await this.newsManager.saveNews(formData);
            
            if (result.success) {
                this.newsManager.showToast('Лот сохранен');
                this.closeModal('addNewsModal');
                await this.renderProducts();
                form.reset();
                this.resetUploadLabels(form);
            } else {
                this.newsManager.showError(result.error);
            }
        } catch (error) {
            Logger.error('[CatalogManager] Ошибка сохранения товара', error);
            this.newsManager.showError('Ошибка при сохранении лота');
        }
    }

    // Сброс текста в кнопках загрузки файлов
    resetUploadLabels(form) {
        const uploadLabels = form.querySelectorAll('.file-upload-label span:last-child');
        uploadLabels.forEach(label => {
            label.textContent = 'Выберите файл для иллюстрации...';
        });
    }

    // Экранирование HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CatalogManager;
}
