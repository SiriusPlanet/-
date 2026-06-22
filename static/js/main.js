// static/js/main.js — главный скрипт приложения
// Инициализирует Publisher, бегущую строку, скругление шапок, обработку форм

import { Publisher } from './publisher.js';

// P1-5: Количество новостей в бегущей строке
const TICKER_NEWS_COUNT = 5;

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
            this.initTicker();          // P1-5: бегущая строка
            this.initBottomRadius();    // P1-6: скругление шапок
            this.initCartBadge();       // P1-3: счётчик корзины
            console.log('[MainApp] Инициализирован');
        } catch (error) {
            console.error('[MainApp] Ошибка инициализации:', error);
        }
    }

    detectPage() {
        const path = window.location.pathname;
        if (path.endsWith('index.html') || path === '/' || path === '') {
            this.currentPage = 'index';
            this.container = document.getElementById('topLotsContainer');
        } else if (path.includes('news.html')) {
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

        const options = this.currentPage === 'index'
            ? { cardClass: 'card-compact' }
            : (this.currentPage === 'actions' ? { cardClass: 'card-large' } : {});

        await this.publisher.publish(this.currentPage, this.container, options);
    }

    // ===== P1-5: Бегущая строка из новостей =====
    async initTicker() {
        const ticker = document.getElementById('news-ticker');
        if (!ticker) return;

        try {
            const res = await fetch('/get-news');
            if (!res.ok) throw new Error('Ошибка загрузки');
            const data = await res.json();
            const allNews = (data.news || []).filter(n => n.lotType === 'news');

            // Берём N последних
            const latest = allNews.slice(0, TICKER_NEWS_COUNT);

            if (latest.length === 0) {
                ticker.textContent = '✦ Хроники пусты. Воспоминания ещё не записаны. ✦';
                return;
            }

            // Формируем строку: дата → заголовок → кратко
            const items = latest.map(n => {
                const date = n.date || '????-??-??';
                const title = n.title || 'Без названия';
                const preview = (n.preview || n.content || '').slice(0, 80);
                return `📅 ${date} · ${title} · ${preview}`;
            });

            // Дублируем для плавной прокрутки (чтобы создать бесконечный эффект)
            const tickerContent = '✦ ' + items.join(' ✦ ✦ ') + ' ✦';
            ticker.textContent = tickerContent + ' ' + tickerContent;
        } catch (e) {
            console.warn('[MainApp] Ошибка загрузки для бегущей строки:', e);
            ticker.textContent = '✦ Хроники временно недоступны. Попробуйте вспомнить позже. ✦';
        }
    }

    // ===== P1-6: Адаптивное скругление нижних углов шапки =====
    initBottomRadius() {
        const mainNav = document.querySelector('.main-nav');
        if (!mainNav) return;

        let lastAppliedState = null;
        let rafId;

        function applyBottomRadius() {
            const visibleChildren = Array.from(mainNav.children)
                .filter(child =>
                    child.offsetParent !== null &&
                    window.getComputedStyle(child).display !== 'none'
                );

            const lastVisibleChild = visibleChildren[visibleChildren.length - 1];
            const currentState = {
                hasVisibleChildren: visibleChildren.length > 0,
                lastChild: lastVisibleChild
            };

            if (JSON.stringify(currentState) === JSON.stringify(lastAppliedState)) {
                return;
            }

            lastAppliedState = currentState;

            // Сбрасываем скругления у всех
            Array.from(mainNav.children).forEach(child => {
                child.style.borderBottomLeftRadius = '';
                child.style.borderBottomRightRadius = '';
            });

            if (lastVisibleChild) {
                lastVisibleChild.style.borderBottomLeftRadius = '10px';
                lastVisibleChild.style.borderBottomRightRadius = '10px';
            } else {
                mainNav.style.borderBottomLeftRadius = '10px';
                mainNav.style.borderBottomRightRadius = '10px';
            }
        }

        function handleScroll() {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(applyBottomRadius);
        }

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleScroll);
        window.addEventListener('DOMContentLoaded', applyBottomRadius);
        // Также запускаем сразу
        setTimeout(applyBottomRadius, 100);
    }

    // ===== P1-3: Счётчик корзины =====
    initCartBadge() {
        this.updateCartBadge();
        // Обновляем при изменении localStorage (другие вкладки)
        window.addEventListener('storage', (e) => {
            if (e.key === 'mySiteCart') this.updateCartBadge();
        });
    }

    updateCartBadge() {
        const badge = document.getElementById('cartBadge');
        const totalEl = document.getElementById('cartTotal');
        if (!badge) return;

        try {
            const stored = localStorage.getItem('mySiteCart');
            const cart = stored ? JSON.parse(stored) : [];
            const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
            const total = cart.reduce((sum, item) => sum + parseFloat(item.price || 0) * (item.quantity || 1), 0);

            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
            if (totalEl) {
                totalEl.textContent = count > 0 ? `${total.toFixed(2)} ₽` : '';
            }
        } catch (e) {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    }

    // ===== Остальные методы (без изменений) =====
    setupAddButton() {
        const addBtn = document.querySelector('.add-news-btn');
        const modal = document.getElementById('addNewsModal');
        if (!addBtn || !modal) return;

        addBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            modal.classList.add('is-visible');
            document.body.style.overflow = 'hidden';
        });

        const cancelBtn = modal.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal(modal));
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal(modal);
        });

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

        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            delete form.dataset.editId;
            delete form.dataset.originalLotType;
        }

        const submitBtn = modal.querySelector('.btn-submit');
        if (submitBtn) submitBtn.textContent = 'Имплантировать';

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
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const lotType = tab.dataset.lottype;
                const isProduct = lotType === 'product';

                const priceGroup = document.getElementById('priceGroup');
                if (priceGroup) priceGroup.classList.toggle('hidden', !isProduct);

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

        this.setupFormTabs();

        const defaultLotType = this.currentPage === 'catalog' ? 'product' : 'news';
        const defaultTab = document.querySelector(`.form-tab[data-lottype="${defaultLotType}"]`);
        if (defaultTab) {
            document.querySelectorAll('.form-tab').forEach(t => t.classList.remove('active'));
            defaultTab.classList.add('active');
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
                formData.append('id', editId);
                url = '/api/update-news';
                options = { method: 'POST', body: formData };
            } else {
                url = '/save-news';
                options = { method: 'POST', body: formData };
            }

            const res = await fetch(url, options);

            if (!res.ok) throw new Error('Ошибка сохранения');
            const result = await res.json();

            if (result.success) {
                this.showToast(editId ? 'Запись обновлена' : 'Запись сохранена');
                this.closeModal(document.getElementById('addNewsModal'));
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

// Экспортируем updateCartBadge для card-constructor.js
window.updateCartBadge = function() {
    const app = window.__mainApp;
    if (app) app.updateCartBadge();
};

document.addEventListener('DOMContentLoaded', async () => {
    const app = new MainApp();
    window.__mainApp = app;
    await app.init();
});