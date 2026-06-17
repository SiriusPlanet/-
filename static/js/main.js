// static/js/main.js — упрощённая версия
// Инициализирует Publisher для текущей страницы + обработку формы

import { Publisher } from './publisher.js';

class MainApp {
    constructor() {
        this.pm = null;
        this.publisher = null;
        this.currentPage = null;
        this.container = null;
    }

    async init() {
        try {
            // Ждём глобальной инициализации системы доступа
            if (window.__globalAccessPromise) {
                try {
                    await Promise.race([
                        window.__globalAccessPromise.then(pm => {
                            this.pm = pm;
                        }),
                        new Promise(resolve => setTimeout(resolve, 2000))
                    ]);
                } catch (e) {
                    console.warn('[MainApp] Ошибка ожидания доступа:', e);
                }
            }

            this.detectPage();
            await this.initPublisher();
            this.setupFormHandler();
            this.setupAddButton();
            this.setupScrollHandler();
            console.log('[MainApp] Инициализирован');
        } catch (error) {
            console.error('[MainApp] Ошибка инициализации:', error);
        }
    }

    detectPage() {
        const path = window.location.pathname;
        if (path.includes('news.html')) {
            this.currentPage = 'news';
            this.container = document.querySelector('.news-grid');
        } else if (path.includes('catalog.html')) {
            this.currentPage = 'catalog';
            this.container = document.querySelector('.products-grid');
        } else if (path.includes('actions.html')) {
            this.currentPage = 'actions';
            this.container = document.querySelector('.products-grid');
        }
    }

    async initPublisher() {
        if (!this.currentPage || !this.container) {
            console.log('[MainApp] Не страница с лотами, пропускаем');
            return;
        }

        this.publisher = new Publisher();
        await this.publisher.publish(this.currentPage, this.container);
    }

    setupAddButton() {
        const addBtn = document.querySelector('.add-news-btn');
        const modal = document.getElementById('addNewsModal');
        if (!addBtn || !modal) return;

        addBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            modal.classList.add('is-visible');
            document.body.style.overflow = 'hidden';
        });

        // Закрытие по кнопке отмена
        const cancelBtn = modal.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal(modal));
        }

        // Закрытие по клику вне модалки
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal(modal);
        });

        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                this.closeModal(modal);
            }
        });
    }

    closeModal(modal) {
        modal.classList.remove('is-visible');
        modal.classList.add('hidden');
        document.body.style.overflow = '';

        // Сброс формы
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            delete form.dataset.editId;
            delete form.dataset.originalLotType;
        }

        // Сброс кнопки сабмита
        const submitBtn = modal.querySelector('.btn-submit');
        if (submitBtn) submitBtn.textContent = 'Имплантировать';

        // Снять ⚠️ с табов
        document.querySelectorAll('.form-tab').forEach(t => {
            t.classList.remove('has-warning');
            t.removeAttribute('title');
        });
    }

    setupFormTabs() {
        const tabs = document.querySelectorAll('.form-tab');
        if (!tabs.length) return;

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Переключаем активный таб
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Показываем/скрываем поля в зависимости от типа
                const lotType = tab.dataset.lottype;
                const isProduct = lotType === 'product';

                // Цена — только для товара
                const priceGroup = document.getElementById('priceGroup');
                if (priceGroup) priceGroup.classList.toggle('hidden', !isProduct);

                // Дата — только для новости
                const dateGroup = document.getElementById('dateGroup');
                if (dateGroup) dateGroup.classList.toggle('hidden', isProduct);
            });
        });
    }

    getActiveLotType() {
        const activeTab = document.querySelector('.form-tab.active');
        return activeTab ? activeTab.dataset.lottype : 'news';
    }

    setupFormHandler() {
        const form = document.getElementById('newsForm');
        if (!form) return;

        // Инициализация табов
        this.setupFormTabs();

        // По умолчанию: на странице каталога активен "Товар", иначе "Новость"
        const defaultLotType = this.currentPage === 'catalog' ? 'product' : 'news';
        const defaultTab = document.querySelector(`.form-tab[data-lottype="${defaultLotType}"]`);
        if (defaultTab) {
            document.querySelectorAll('.form-tab').forEach(t => t.classList.remove('active'));
            defaultTab.classList.add('active');
            // Показываем/скрываем поля
            const isProduct = defaultLotType === 'product';
            const priceGroup = document.getElementById('priceGroup');
            if (priceGroup) priceGroup.classList.toggle('hidden', !isProduct);
            const dateGroup = document.getElementById('dateGroup');
            if (dateGroup) dateGroup.classList.toggle('hidden', isProduct);
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit(form);
        });

        // Обновление текста при выборе файла
        const imageInput = document.getElementById('image');
        const uploadLabel = document.querySelector('.file-upload-label span:last-child');
        if (imageInput && uploadLabel) {
            imageInput.addEventListener('change', () => {
                uploadLabel.textContent = imageInput.files[0]
                    ? imageInput.files[0].name
                    : 'Выберите файл для иллюстрации...';
            });
        }
    }

    async handleSubmit(form) {
        const editId = form.dataset.editId;
        const originalLotType = form.dataset.originalLotType;
        const newLotType = this.getActiveLotType();

        // Предупреждение при смене типа лота в режиме редактирования
        if (editId && originalLotType && originalLotType !== newLotType) {
            const typeNames = { news: 'новость', product: 'товар' };
            if (!confirm(`Вы меняете тип лота с «${typeNames[originalLotType] || originalLotType}» на «${typeNames[newLotType] || newLotType}». Продолжить?`)) {
                return;
            }
        }

        const title = document.getElementById('title')?.value?.trim();
        const content = document.getElementById('content')?.value?.trim();

        if (!title || !content) {
            this.showError('Заполните заголовок и полный текст');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('date', document.getElementById('date')?.value || '');
        formData.append('preview', document.getElementById('preview')?.value || '');
        formData.append('content', content);
        formData.append('price', document.getElementById('price')?.value || '');
        formData.append('lotType', newLotType);

        const imageFile = document.getElementById('image')?.files[0];
        if (imageFile) formData.append('image', imageFile);

        try {
            let url, options;

            if (editId) {
                // Режим редактирования
                formData.append('id', editId);
                url = '/api/update-news';
                options = { method: 'POST', body: formData };
            } else {
                // Режим создания
                url = '/save-news';
                options = { method: 'POST', body: formData };
            }

            const res = await fetch(url, options);

            if (!res.ok) throw new Error('Ошибка сохранения');
            const result = await res.json();

            if (result.success) {
                this.showToast(editId ? 'Запись обновлена' : 'Запись сохранена');
                this.closeModal(document.getElementById('addNewsModal'));
                // Перепубликуем
                if (this.publisher && this.currentPage && this.container) {
                    await this.publisher.publish(this.currentPage, this.container);
                }
            } else {
                this.showError(result.error || 'Ошибка сохранения');
            }
        } catch (e) {
            console.error('[MainApp] Ошибка сохранения:', e);
            this.showError('Ошибка при сохранении');
        }
    }

    setupScrollHandler() {
        const panel = document.querySelector('.news-header-panel');
        if (!panel) return;

        let lastScrollTop = 0;
        const threshold = 5;

        window.addEventListener('scroll', () => {
            const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (currentScrollTop > lastScrollTop && currentScrollTop > threshold) {
                panel.classList.add('hidden');
            } else {
                panel.classList.remove('hidden');
            }
            lastScrollTop = currentScrollTop;
        }, { passive: true });
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

document.addEventListener('DOMContentLoaded', async () => {
    const app = new MainApp();
    await app.init();
});