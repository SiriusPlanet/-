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

            data.news.forEach((item, index) => {
                // Если это товар (lotType === 'product')
                if (item.lotType === 'product' || item.price) {
                    const card = document.createElement('div');
                    card.classList.add('catalog-card');
                    card.dataset.id = item.id;

                    const imageHtml = item.image ? 
                        `<img src="/images/img_n/${item.image}" alt="${this.escapeHtml(item.title)}" class="catalog-image">` : 
                        '<div class="catalog-no-image">Нет изображения</div>';

                    card.innerHTML = `
                        <div class="catalog-card-inner">
                            ${imageHtml}
                        </div>
                        <div class="catalog-card-content">
                            <h3 class="catalog-card-title">${this.escapeHtml(item.title)}</h3>
                            <div class="catalog-card-price">${item.price ? item.price + ' ₽' : 'Цена не указана'}</div>
                            <p class="catalog-card-description">${this.escapeHtml(item.preview || item.content || '')}</p>
                        </div>
                    `;

                    fragment.appendChild(card);
                }
            });

            newsGrid.appendChild(fragment);
            console.log('[CatalogManager] Товары отрендерены');
        } catch (error) {
            Logger.error('[CatalogManager] Ошибка рендеринга товаров', error);
        }
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
                await this.newsManager.loadNews();
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
