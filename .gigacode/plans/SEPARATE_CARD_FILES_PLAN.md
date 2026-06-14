# 📋 ПЛАН: Создание отдельных файлов карточек

## 📅 Дата: 2026-06-14
## 🎯 Цель: Создать отдельные файлы для разных типов карточек

---

## 🧠 Понимание

### Текущая ситуация:
- В `news-page-constructor.js` есть метод `createCardElement()` который создает карточки с классом `news-card`
- Нужно создать отдельные файлы для:
  - `news-card.html` — шаблон карточки новости
  - `product-card.html` — шаблон карточки товара/акции
  - `catalog-page-constructor.js` — рендер товаров
  - `actions-page-constructor.js` — рендер акций

---

## 📁 СТРУКТУРА ПАПОК

```
templates/
├── card-constructor/
│   ├── news-card.html          # ← НОВЫЙ: Шаблон карточки новости
│   └── product-card.html       # ← НОВЫЙ: Шаблон карточки товара/акции
```

---

## 📝 ПЛАН ДЕЙСТВИЙ

### 📌 ШАГ 1: Создать папку `templates/card-constructor/`

```bash
mkdir templates/card-constructor
```

---

### 📌 ШАГ 2: Создать `templates/card-constructor/news-card.html`

**Файл:** `templates/card-constructor/news-card.html`

```html
<!-- templates/card-constructor/news-card.html -->
<div class="news-card" data-id="{{id}}" data-category="{{category}}">
    <div class="news-card-image-wrapper">
        <img src="/images/img_n/{{image}}" class="news-image" alt="{{title}}" loading="lazy" />
        <!-- Бейдж скидки накладывается JS-кодом (CSS градиент + transform) -->
        <div class="news-card-discount-badge" style="display: none;"></div>
    </div>
    <div class="news-card-content">
        <h3 class="news-card-title">{{title}}</h3>
        <p class="news-card-description">{{preview}}</p>
        <button class="read-more-btn" onclick="window.openNews({{id}})">ЧИТАТЬ ПОЛНОСТЬЮ</button>
    </div>
</div>
```

---

### 📌 ШАГ 3: Создать `templates/card-constructor/product-card.html`

**Файл:** `templates/card-constructor/product-card.html`

```html
<!-- templates/card-constructor/product-card.html -->
<div class="product-card" data-id="{{id}}" data-category="{{category}}">
    <div class="news-card-image-wrapper">
        <img src="/images/img_n/{{image}}" class="news-image" alt="{{title}}" loading="lazy" />
        <!-- Бейдж скидки накладывается JS-кодом (CSS градиент + transform) -->
        <div class="news-card-discount-badge" style="display: none;"></div>
    </div>
    <div class="news-card-content">
        <h3 class="news-card-title">{{title}}</h3>
        <p class="news-card-description">{{preview}}</p>
        <p class="price">{{price}}</p>
        <button class="read-more-btn" onclick="window.openNews({{id}})">ПОДРОБНЕЕ</button>
    </div>
</div>
```

---

### 📌 ШАГ 4: Создать `static/js/news-card-constructor.js`

**Файл:** `static/js/news-card-constructor.js`

```javascript
// static/js/news-card-constructor.js
// Конструктор карточек новостей

export class NewsCardConstructor {
    constructor(options = {}) {
        this.templatePath = options.templatePath || '/templates/card-constructor/news-card.html';
        this.discountStyle = options.discountStyle || {
            background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
            color: 'white',
            padding: '8px 16px',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            borderRadius: '8px 0 8px 0',
            transform: 'rotate(10deg)',
            boxShadow: '2px 2px 5px rgba(0,0,0,0.3)',
            zIndex: '10',
            position: 'absolute',
            top: '10px',
            right: '10px'
        };
        this.cardTemplate = null;
    }

    async init() {
        try {
            const response = await fetch(this.templatePath);
            if (!response.ok) throw new Error('Не загрузился шаблон карточки');
            this.cardTemplate = await response.text();
            console.log('[NewsCardConstructor] Готов к работе');
        } catch (e) {
            console.error('[NewsCardConstructor] Ошибка инициализации', e);
        }
    }

    // Добавление угла скидки (CSS градиент + transform)
    addDiscountBadge(cardElement, discount) {
        if (!discount || discount <= 0) return;

        const badge = cardElement.querySelector('.news-card-discount-badge');
        if (!badge) return;

        badge.textContent = `-${discount}%`;
        badge.style.display = 'block';
        
        // Применяем стили из конфигурации
        Object.assign(badge.style, this.discountStyle);
    }

    // Генерация HTML карточки
    render(news) {
        if (!this.cardTemplate) throw new Error('Шаблон не инициализирован');

        // Подстановка данных в шаблон (упрощенный mustache-стиль)
        let html = this.cardTemplate
            .replace(/{{id}}/g, String(news.id))
            .replace(/{{title}}/g, this.escapeHtml(news.title))
            .replace(/{{preview}}/g, this.escapeHtml(news.preview || ''))
            .replace(/{{content}}/g, this.escapeHtml(news.content || ''))
            .replace(/{{image}}/g, news.image || '400.png')
            .replace(/{{category}}/g, news.category || 'news')
            .replace(/{{price}}/g, this.formatPrice(news));

        // Парсинг в DOM-элемент
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const card = doc.body.firstElementChild;

        // Добавляем угол скидки если есть
        if (news.discount && news.discount > 0) {
            this.addDiscountBadge(card, news.discount);
        }

        return card;
    }

    // Форматирование цены
    formatPrice(news) {
        if (news.price) return news.price;
        if (news.discount) {
            // Вычисляем цену со скидкой
            const originalPrice = news.originalPrice || 1000000;
            const discountPrice = originalPrice * (1 - news.discount / 100);
            return this.formatCurrency(discountPrice);
        }
        return '';
    }

    // Форматирование валюты
    formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            maximumFractionDigits: 0
        }).format(amount);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}
```

---

### 📌 ШАГ 5: Создать `static/js/product-card-constructor.js`

**Файл:** `static/js/product-card-constructor.js`

```javascript
// static/js/product-card-constructor.js
// Конструктор карточек товаров/акций

export class ProductCardConstructor {
    constructor(options = {}) {
        this.templatePath = options.templatePath || '/templates/card-constructor/product-card.html';
        this.discountStyle = options.discountStyle || {
            background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
            color: 'white',
            padding: '8px 16px',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            borderRadius: '8px 0 8px 0',
            transform: 'rotate(10deg)',
            boxShadow: '2px 2px 5px rgba(0,0,0,0.3)',
            zIndex: '10',
            position: 'absolute',
            top: '10px',
            right: '10px'
        };
        this.cardTemplate = null;
    }

    async init() {
        try {
            const response = await fetch(this.templatePath);
            if (!response.ok) throw new Error('Не загрузился шаблон карточки');
            this.cardTemplate = await response.text();
            console.log('[ProductCardConstructor] Готов к работе');
        } catch (e) {
            console.error('[ProductCardConstructor] Ошибка инициализации', e);
        }
    }

    // Добавление угла скидки (CSS градиент + transform)
    addDiscountBadge(cardElement, discount) {
        if (!discount || discount <= 0) return;

        const badge = cardElement.querySelector('.news-card-discount-badge');
        if (!badge) return;

        badge.textContent = `-${discount}%`;
        badge.style.display = 'block';
        
        // Применяем стили из конфигурации
        Object.assign(badge.style, this.discountStyle);
    }

    // Генерация HTML карточки
    render(news) {
        if (!this.cardTemplate) throw new Error('Шаблон не инициализирован');

        // Подстановка данных в шаблон (упрощенный mustache-стиль)
        let html = this.cardTemplate
            .replace(/{{id}}/g, String(news.id))
            .replace(/{{title}}/g, this.escapeHtml(news.title))
            .replace(/{{preview}}/g, this.escapeHtml(news.preview || ''))
            .replace(/{{content}}/g, this.escapeHtml(news.content || ''))
            .replace(/{{image}}/g, news.image || '400.png')
            .replace(/{{category}}/g, news.category || 'product')
            .replace(/{{price}}/g, this.formatPrice(news));

        // Парсинг в DOM-элемент
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const card = doc.body.firstElementChild;

        // Добавляем угол скидки если есть
        if (news.discount && news.discount > 0) {
            this.addDiscountBadge(card, news.discount);
        }

        return card;
    }

    // Форматирование цены
    formatPrice(news) {
        if (news.price) return news.price;
        if (news.discount) {
            // Вычисляем цену со скидкой
            const originalPrice = news.originalPrice || 1000000;
            const discountPrice = originalPrice * (1 - news.discount / 100);
            return this.formatCurrency(discountPrice);
        }
        return '';
    }

    // Форматирование валюты
    formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            maximumFractionDigits: 0
        }).format(amount);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}
```

---

### 📌 ШАГ 6: Обновить `catalog-page-constructor.js`

**Файл:** `static/js/catalog-page-constructor.js`

```javascript
// static/js/catalog-page-constructor.js
// Рендер карточек товаров на странице catalog.html

import { ProductCardConstructor } from './product-card-constructor.js';

export class CatalogPageConstructor {
    constructor(options = {}) {
        this.cardConstructor = new ProductCardConstructor();
        this.newsContainer = null;
        this.newsUrl = options.newsUrl || '/get-news';
        this.containerSelector = options.containerSelector || '.products-grid';
        this.categoryFilter = options.categoryFilter || null;
        this.newsList = [];
        this.init();
    }

    init() {
        console.log('CatalogPageConstructor initialized');

        // Находим существующий контейнер для товаров
        this.newsContainer = document.querySelector(this.containerSelector);
        if (!this.newsContainer) {
            console.error(`${this.containerSelector} container not found!`);
        }
    }

    async loadNews() {
        try {
            const response = await fetch(this.newsUrl);
            if (!response.ok) {
                throw new Error(`Failed to load news: ${response.statusText}`);
            }
            const data = await response.json();
            
            // Обрабатываем разные форматы ответа
            if (data.news) {
                this.newsList = data.news;
            } else if (Array.isArray(data)) {
                this.newsList = data;
            } else {
                this.newsList = [data];
            }
            
            // Фильтруем по категории, если задано
            if (this.categoryFilter) {
                if (this.categoryFilter === 'Акции') {
                    // Показываем только акции (category === 'Акции' ИЛИ есть discount)
                    this.newsList = this.newsList.filter(
                        n => n.category === 'Акции' || (n.discount && n.discount > 0)
                    );
                } else {
                    // Показываем только указанную категорию
                    this.newsList = this.newsList.filter(
                        n => n.category === this.categoryFilter
                    );
                }
            } else {
                // Показываем всё, что без category или с category === 'Товары'
                this.newsList = this.newsList.filter(
                    n => n.category === 'Товары' || !n.category
                );
            }
            
            console.log(`[CatalogPageConstructor] Загружено ${this.newsList.length} товаров`);
            return this.newsList;
        } catch (error) {
            console.error('Error loading news:', error);
            this.newsList = [];
            return [];
        }
    }

    async render() {
        if (!this.newsContainer) {
            console.error('News container not initialized');
            return;
        }

        // Очищаем контейнер
        this.newsContainer.innerHTML = '';

        if (this.newsList.length === 0) {
            this.newsContainer.innerHTML = '<p style="color: #333; text-align: center; padding: 20px;">Нет доступных товаров</p>';
            return;
        }

        // Рендерим карточки
        const fragment = document.createDocumentFragment();
        this.newsList.forEach((news, index) => {
            const card = this.cardConstructor.render(news);
            card.classList.add('product-card');
            
            // Анимация появления
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            fragment.appendChild(card);

            // Запускаем анимацию
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50 + 100);
        });

        this.newsContainer.appendChild(fragment);

        console.log('[CatalogPageConstructor] Страница собрана');
    }

    async initAndRender() {
        await this.cardConstructor.init();
        await this.loadNews();
        await this.render();
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const constructor = new CatalogPageConstructor();
    constructor.initAndRender();
});
```

---

### 📌 ШАГ 7: Обновить `actions-page-constructor.js`

**Файл:** `static/js/actions-page-constructor.js`

```javascript
// static/js/actions-page-constructor.js
// Рендер карточек акций на странице actions.html

import { ProductCardConstructor } from './product-card-constructor.js';

export class ActionsPageConstructor {
    constructor(options = {}) {
        this.cardConstructor = new ProductCardConstructor();
        this.newsContainer = null;
        this.newsUrl = options.newsUrl || '/get-news';
        this.containerSelector = options.containerSelector || '.products-grid';
        this.categoryFilter = options.categoryFilter || 'Акции';
        this.newsList = [];
        this.init();
    }

    init() {
        console.log('ActionsPageConstructor initialized');

        // Находим существующий контейнер для товаров
        this.newsContainer = document.querySelector(this.containerSelector);
        if (!this.newsContainer) {
            console.error(`${this.containerSelector} container not found!`);
        }
    }

    async loadNews() {
        try {
            const response = await fetch(this.newsUrl);
            if (!response.ok) {
                throw new Error(`Failed to load news: ${response.statusText}`);
            }
            const data = await response.json();
            
            // Обрабатываем разные форматы ответа
            if (data.news) {
                this.newsList = data.news;
            } else if (Array.isArray(data)) {
                this.newsList = data;
            } else {
                this.newsList = [data];
            }
            
            // Фильтруем по категории, если задано
            if (this.categoryFilter === 'Акции') {
                // Показываем только акции (category === 'Акции' ИЛИ есть discount)
                this.newsList = this.newsList.filter(
                    n => n.category === 'Акции' || (n.discount && n.discount > 0)
                );
            } else {
                // Показываем только указанную категорию
                this.newsList = this.newsList.filter(
                    n => n.category === this.categoryFilter
                );
            }
            
            console.log(`[ActionsPageConstructor] Загружено ${this.newsList.length} акций`);
            return this.newsList;
        } catch (error) {
            console.error('Error loading news:', error);
            this.newsList = [];
            return [];
        }
    }

    async render() {
        if (!this.newsContainer) {
            console.error('News container not initialized');
            return;
        }

        // Очищаем контейнер
        this.newsContainer.innerHTML = '';

        if (this.newsList.length === 0) {
            this.newsContainer.innerHTML = '<p style="color: #333; text-align: center; padding: 20px;">Нет доступных акций</p>';
            return;
        }

        // Рендерим карточки
        const fragment = document.createDocumentFragment();
        this.newsList.forEach((news, index) => {
            const card = this.cardConstructor.render(news);
            card.classList.add('product-card');
            
            // Анимация появления
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            fragment.appendChild(card);

            // Запускаем анимацию
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50 + 100);
        });

        this.newsContainer.appendChild(fragment);

        console.log('[ActionsPageConstructor] Страница собрана');
    }

    async initAndRender() {
        await this.cardConstructor.init();
        await this.loadNews();
        await this.render();
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const constructor = new ActionsPageConstructor();
    constructor.initAndRender();
});
```

---

### 📌 ШАГ 8: Обновить `news-page-constructor.js`

**Файл:** `static/js/news-page-constructor.js`

```javascript
// static/js/news-page-constructor.js
// Рендер карточек новостей на странице news.html

import { NewsCardConstructor } from './news-card-constructor.js';

export class NewsPageConstructor {
    constructor(options = {}) {
        this.cardConstructor = new NewsCardConstructor();
        this.newsContainer = null;
        this.tickerContainer = null;
        this.newsUrl = options.newsUrl || '/get-news';
        this.containerSelector = options.containerSelector || '.news-grid';
        this.tickerContainerSelector = options.tickerContainerSelector || '.ticker-container';
        this.newsList = [];
        this.init();
    }

    init() {
        console.log('NewsPageConstructor initialized');

        // Находим существующий контейнер для новостей
        this.newsContainer = document.querySelector(this.containerSelector);
        if (!this.newsContainer) {
            console.error(`${this.containerSelector} container not found!`);
        }

        // Находим существующий контейнер для бегущей строки
        this.tickerContainer = document.querySelector(this.tickerContainerSelector);
        if (this.tickerContainer) {
            console.log('Ticker container found:', this.tickerContainer.id);
        }
    }

    async loadNews() {
        try {
            const response = await fetch(this.newsUrl);
            if (!response.ok) {
                throw new Error(`Failed to load news: ${response.statusText}`);
            }
            const data = await response.json();
            
            // Обрабатываем разные форматы ответа
            if (data.news) {
                this.newsList = data.news;
            } else if (Array.isArray(data)) {
                this.newsList = data;
            } else {
                this.newsList = [data];
            }
            
            console.log(`[NewsPageConstructor] Загружено ${this.newsList.length} новостей`);
            return this.newsList;
        } catch (error) {
            console.error('Error loading news:', error);
            this.newsList = [];
            return [];
        }
    }

    async render() {
        if (!this.newsContainer) {
            console.error('News container not initialized');
            return;
        }

        // Очищаем контейнер
        this.newsContainer.innerHTML = '';

        if (this.newsList.length === 0) {
            this.newsContainer.innerHTML = '<p style="color: #333; text-align: center; padding: 20px;">Нет доступных новостей</p>';
            return;
        }

        // Рендерим карточки
        const fragment = document.createDocumentFragment();
        this.newsList.forEach((news, index) => {
            const card = this.cardConstructor.render(news);
            card.classList.add('news-card');
            
            // Анимация появления
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            fragment.appendChild(card);

            // Запускаем анимацию
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50 + 100);
        });

        this.newsContainer.appendChild(fragment);

        // Обновляем бегущую строку
        this.updateTicker(this.newsList);

        console.log('[NewsPageConstructor] Страница собрана');
    }

    updateTicker(newsArray) {
        if (!this.tickerContainer) return;

        const ticker = this.tickerContainer.querySelector('#news-ticker');
        if (!ticker) return;

        // Берем preview из всех новостей
        const texts = newsArray
            .map(news => news.preview || (news.content ? news.content.substring(0, 100) + '...' : ''))
            .filter(text => text);

        if (texts.length === 0) {
            ticker.textContent = 'Нет новостей для бегущей строки';
            return;
        }

        // Объединяем тексты с разделителем
        const tickerText = texts.join('   •   ');

        // Создаем анимацию бегущей строки
        ticker.style.display = 'inline-block';
        ticker.style.whiteSpace = 'nowrap';
        ticker.style.padding = '10px 0';
        ticker.style.animation = 'none';

        // Сбрасываем анимацию
        void ticker.offsetWidth;

        // Запускаем анимацию
        ticker.style.animation = 'ticker 60s linear infinite';

        // Добавляем стили анимации, если их нет
        this.addTickerStyles();

        // Обновляем текст
        ticker.textContent = tickerText + '   •   ' + tickerText;
    }

    addTickerStyles() {
        const styleId = 'news-ticker-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @keyframes ticker {
                0% {
                    transform: translateX(100%);
                }
                100% {
                    transform: translateX(-100%);
                }
            }
            .ticker-container {
                overflow: hidden;
                background-color: rgba(0, 0, 0, 0.5);
                border-radius: 8px;
                margin: 10px 0;
            }
            .ticker-container #news-ticker {
                display: inline-block;
                white-space: nowrap;
                padding: 10px 0;
                color: #00ffaa;
                font-size: 1.1rem;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }

    async initAndRender() {
        await this.cardConstructor.init();
        await this.loadNews();
        await this.render();
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const constructor = new NewsPageConstructor();
    constructor.initAndRender();
});
```

---

## 📊 ИТОГОВАЯ СТРУКТУРА ФАЙЛОВ

```
templates/
└── card-constructor/
    ├── news-card.html          # ← НОВЫЙ: Шабл��н карточки новости
    └── product-card.html       # ← НОВЫЙ: Шаблон карточки товара/акции

static/js/
├── news-card-constructor.js      # ← НОВЫЙ: Конструктор карточек новостей
├── product-card-constructor.js   # ← НОВЫЙ: Конструктор карточек товаров
├── news-page-constructor.js      # ← ОБНОВЛЁН: Использует NewsCardConstructor
├── catalog-page-constructor.js   # ← ОБНОВЛЁН: Использует ProductCardConstructor
├── actions-page-constructor.js   # ← ОБНОВЛЁН: Использует ProductCardConstructor
├── news-form.js                  # ← ОСТАЁТСЯ БЕЗ ИЗМЕНЕНИЙ
├── news-manager.js               # ← ОСТАЁТСЯ БЕЗ ИЗМЕНЕНИЙ
└── ...
```

---

## 🎯 ПРЕИМУЩЕСТВА НОВОЙ АРХИТЕКТУРЫ

- ✅ **Разделение ответственности**: каждый тип карточки в отдельном файле
- ✅ **Легкая поддержка**: изменить дизайн одной карточки не влият на другие
- ✅ **Повторное использование**: можно использовать конструкторы в разных местах
- ✅ **Чистый код**: шаблоны отделены от логики
- ✅ **Бегущая строка**: обновляется на главной странице

---

**Статус:** Готов к реализации  \n**Автор:** GigaCode  \n**Версия:** 5.0 (Отдельные файлы карточек)
