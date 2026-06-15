{"text": "// catalog.js - Работа с каталогом товаров\nimport { NewsManager } from './news-manager.js';\nimport { Logger } from './logger.js';\n\nexport class CatalogManager {\n    constructor(newsManager) {\n        console.log('[CatalogManager] Инициализация');\n        if (!newsManager) {\n            throw new Error('NewsManager не передан в CatalogManager');\n        }\n        this.newsManager = newsManager;\n        this.init();\n    }\n\n    init() {\n        this.setupTabs();\n        this.setupFormHandlers();\n        this.renderProducts();\n    }\n\n    // Рендеринг товаров\n    async renderProducts() {\n        const newsGrid = document.querySelector('.news-grid');\n        if (!newsGrid) return;\n\n        try {\n            const res = await fetch('/get-news');\n            if (!res.ok) throw new Error('Не удалось загрузить товары');\n            const data = await res.json();\n\n            newsGrid.innerHTML = '';\n            const fragment = document.createDocumentFragment();\n\n            data.news.forEach((item, index) => {\n                // Если это товар (lotType === 'product')\n                if (item.lotType === 'product' || item.price) {\n                    const card = document.createElement('div');\n                    card.classList.add('catalog-card');\n                    card.dataset.id = item.id;\n\n                    const imageHtml = item.image ? \n                        `<img src=\"/images/img_n/${item.image}\" alt=\"${this.escapeHtml(item.title)}\" class=\"catalog-image\">` : \n                        '<div class=\"catalog-no-image\">Нет изображения</div>';\n\n                    card.innerHTML = `\n                        <div class=\"catalog-card-inner\">\n                            ${imageHtml}\n                        </div>\n                        <div class=\"catalog-card-content\">\n                            <h3 class=\"catalog-card-title\">${this.escapeHtml(item.title)}</h3>\n                            <div class=\"catalog-card-price\">${item.price ? item.price + ' ₽' : 'Цена не указана'}</div>\n                            <p class=\"catalog-card-description\">${this.escapeHtml(item.preview || item.content || '')}</p>\n                        </div>\n                    `;\n\n                    fragment.appendChild(card);\n                }\n            });\n\n            newsGrid.appendChild(fragment);\n            console.log('[CatalogManager] Товары отрендерены');\n        } catch (error) {\n            Logger.error('[CatalogManager] Ошибка рендеринга товаров', error);\n        }\n    }"}
    
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
        }

        if (productForm) {
            productForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleProductSubmit(e.target);
            });
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
            const formData = new FormData(form);
            
            // Валидация
            const productName = formData.get('productName')?.trim();
            const productPrice = formData.get('productPrice')?.trim();
            const productDescription = formData.get('productDescription')?.trim();

            if (!productName || !productPrice || !productDescription) {
                this.newsManager.showError('Заполните все поля формы товара');
                return;
            }

            // Добавляем тип лота
            formData.append('lotType', 'product');

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
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CatalogManager;
}
