ок# 📋 Финальный план: Единая архитектура карточек (Товары, Акции, Новости)

## 📅 Дата: 2026-06-14
## 🎯 Цель: Карточки товаров, акций и новостей — это одно и то же (разница только в CSS и фильтрации)

---

## 🧠 Понимание архитектуры

### 1. Единая структура данных
**Папка:** `data/news/*.json`

**JSON-структура:**
```json
{
  "id": "news-1",
  "title": "Супер скидка 25% на всю технику!",
  "date": "2026-06-14",
  "preview": "...",
  "content": "...",
  "image": "tech-sale.jpg",
  "discount": 25,        // ← поле скидки (опционально)
  "category": "Акции"    // ← поле категории
}
```

### 2. Единый JS-рендерер
**Модули:**
- `NewsPageConstructor` — базовый класс для всех страниц
- `CatalogPageConstructor` — рендер товаров (фильтрует по `category === 'Товары'`)
- `ActionsPageConstructor` — рендер акций (фильтрует по `category === 'Акции'` или `discount`)
- `NewsPageConstructor` (для news.html) — показывает все (без фильтрации)

### 3. Разные CSS-классы
- **Новости:** `news-card` + `news-grid`
- **Товары/Акции:** `product-card` + `products-grid`

---

## 📝 План реализации (по шагам)

### 📌 ШАГ 0: Подготовка (5 минут)

#### 0.1. Проверить структуру данных
**Папка:** `data/news/`

**Файлы:**
- ✅ `news-1.json` — акция (category: "Акции", discount: 25)
- ✅ `news-2.json` — новинка (category: "Техника", discount: 10)
- ✅ `1781019147250.json` — тестовая новость (без category и discount)

**Проверить, что:**
- Все файлы существуют
- Структура правильная (есть `category` и `discount`)
- Изображения существуют в `images/`

---

### 📌 ШАГ 1: Обновить `NewsPageConstructor` (30 минут)

#### 1.1. Обновить `static/js/news-page-constructor.js`

**Проблема:** Сейчас `NewsPageConstructor` использует `this.newsUrl` с дефолтом `/data/news.json`, но у нас API `/get-news`.

**Решение:** Обновить конструктор, чтобы он:
- Использовал `/get-news` по умолчанию
- Принимал `containerSelector` и `tickerContainerSelector` в опциях
- Добавлял `categoryFilter` для фильтрации
- Обновлял `this.newsList` после загрузки

**Код для замены (строка ~15):**
```javascript
// БЫЛО:
this.newsUrl = options.newsUrl || '/data/news.json';
this.init();

// СТАЛО:
this.newsUrl = options.newsUrl || '/get-news';
this.containerSelector = options.containerSelector || '.news-grid';
this.tickerContainerSelector = options.tickerContainerSelector || '.ticker-container';
this.categoryFilter = options.categoryFilter || null;
this.init();
```

**Код для замены (метод loadNews, примерно строка ~85):**
```javascript
// БЫЛО:
async loadNews() {
    try {
        const response = await fetch(this.newsUrl);
        if (!response.ok) {
            throw new Error(`Failed to load news: ${response.statusText}`);
        }
        const news = await response.json();
        console.log('News loaded:', news);
        return news;
    } catch (error) {
        console.error('Error loading news:', error);
        return [];
    }
}

// СТАЛО:
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
            this.newsList = this.newsList.filter(
                n => n.category === this.categoryFilter || (this.categoryFilter === 'Акции' && n.discount)
            );
        }
        
        console.log(`[NewsPageConstructor] Загружено ${this.newsList.length} элементов`);
        return this.newsList;
    } catch (error) {
        console.error('Error loading news:', error);
        this.newsList = [];
        return [];
    }
}
```

**Код для замены (метод init, примерно строка ~23):**
```javascript
// БЫЛО:
// Находим существующий контейнер для новостей
this.newsContainer = this.newsContainer || document.querySelector('.news-grid');

// СТАЛО:
// Находим существующий контейнер для новостей (с поддержкой кастомного селектора)
this.newsContainer = this.newsContainer || document.querySelector(this.containerSelector);
```

**Код для замены (метод init, примерно строка ~31):**
```javascript
// БЫЛО:
// Находим существующий контейнер для бегущей строки
this.tickerContainer = this.tickerContainer || document.querySelector('.ticker-container');

// СТАЛО:
// Находим существующий контейнер для бегущей строки
this.tickerContainer = this.tickerContainer || document.querySelector(this.tickerContainerSelector);
```

---

### 📌 ШАГ 2: Обновить `catalog-page-constructor.js` (10 минут)

#### 2.1. Создать `static/js/catalog-page-constructor.js`

**Путь:** `static/js/catalog-page-constructor.js`

```javascript
// static/js/catalog-page-constructor.js
// Рендер карточек товаров на странице catalog.html

import { NewsPageConstructor } from './news-page-constructor.js';

export class CatalogPageConstructor extends NewsPageConstructor {
    constructor() {
        super({
            containerSelector: '.products-grid',
            tickerContainerSelector: null, // на странице каталога нет бегущей строки
            newsUrl: '/get-news',
            categoryFilter: null // показываем всё, что без category или с category === 'Товары'
        });
    }

    async loadNews() {
        await super.loadNews();
        // Дополнительная фильтрация: только товары
        this.newsList = this.newsList.filter(
            n => n.category === 'Товары' || !n.category
        );
        console.log(`[CatalogPageConstructor] Загружено ${this.newsList.length} товаров`);
    }

    createCardElement(news, index) {
        // Создаем карточку как product-card (а не news-card)
        const card = super.createCardElement(news, index);
        card.classList.remove('news-card');
        card.classList.add('product-card');
        return card;
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const constructor = new CatalogPageConstructor();
    constructor.init();
});
```

---

### 📌 ШАГ 3: Обновить `catalog.html` (5 минут)

#### 3.1. Удалить статические карточки

**Сейчас в `catalog.html`:**
```html
<div class="products-grid">
    <div class="product-card">...</div> <!-- Рука Барона Земо -->
    <div class="product-card">...</div> <!-- Перчатка Таноса -->
</div>
```

**Должно стать:**
```html
<div class="products-grid"></div>
```

#### 3.2. Добавить подключение скрипта

**Добавить перед `</body>`:**
```html
<script type="module" src="static/js/catalog-page-constructor.js"></script>
```

---

### 📌 ШАГ 4: Обновить `actions-page-constructor.js` (10 минут)

#### 4.1. Создать `static/js/actions-page-constructor.js`

**Путь:** `static/js/actions-page-constructor.js`

```javascript
// static/js/actions-page-constructor.js
// Рендер карточек акций на странице actions.html

import { NewsPageConstructor } from './news-page-constructor.js';

export class ActionsPageConstructor extends NewsPageConstructor {
    constructor() {
        super({
            containerSelector: '.products-grid',
            tickerContainerSelector: null, // на странице акций нет бегущей строки
            newsUrl: '/get-news',
            categoryFilter: 'Акции' // показываем только акции
        });
    }

    async loadNews() {
        await super.loadNews();
        // Дополнительная фильтрация: только акции (category === 'Акции' ИЛИ есть discount)
        this.newsList = this.newsList.filter(
            n => n.category === 'Акции' || (n.discount && n.discount > 0)
        );
        console.log(`[ActionsPageConstructor] Загружено ${this.newsList.length} акций`);
    }

    createCardElement(news, index) {
        // Создаем карточку как product-card (а не news-card)
        const card = super.createCardElement(news, index);
        card.classList.remove('news-card');
        card.classList.add('product-card');
        return card;
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const constructor = new ActionsPageConstructor();
    constructor.init();
});
```

#### 4.2. Обновить `actions.html`

**Удалить статические карточки:**
```html
<div class="products-grid">
    <div class="product-card">...</div> <!-- Акция 1 -->
    <div class="product-card">...</div> <!-- Акция 2 -->
    ...
</div>
```

**Должно стать:**
```html
<div class="products-grid"></div>
```

**Добавить подключение скрипта перед `</body>`:**
```html
<script type="module" src="static/js/actions-page-constructor.js"></script>
```

---

### 📌 ШАГ 5: Обновить `index.html` для бегущей строки (10 минут)

#### 5.1. Проверить, что бегущая строка работает

**Сейчас в `index.html`:**
```html
<div class="ticker-container">
    <div id="news-ticker">Загрузка хроник...</div>
</div>
```

#### 5.2. Обновить `NewsPageConstructor` для главной страницы

**Добавить метод `updateTicker()` в `NewsPageConstructor`:**

```javascript
updateTicker(newsArray) {
    if (!this.tickerContainer) return;

    const ticker = this.tickerContainer.querySelector('#news-ticker');
    if (!ticker) return;

    // Берем только первые 3 новости для бегущей строки
    const limitedNews = newsArray.slice(0, 3);
    
    const texts = limitedNews
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
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
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
```

---

### 📌 ШАГ 6: Тестирование (15 минут)

#### 6.1. Тест `catalog.html`
**Тесты:**
1. Открыть `catalog.html` → проверить, что загружаются товары из `news-2.json`
2. Удалить `news-2.json` → проверить, что карточка исчезла
3. Добавить новый товар через форму → проверить, что он появился
4. Проверить, что карточки используют `product-card` (а не `news-card`)

#### 6.2. Тест `actions.html`
**Тесты:**
1. Открыть `actions.html` → проверить, что загружаются акции из `news-1.json`
2. Удалить `news-1.json` → проверить, что карточка исчезла
3. Добавить новую акцию через форму → проверить, что она появилась
4. Проверить, что бейдж скидки отображается

#### 6.3. Тест `news.html`
**Тесты:**
1. Открыть `news.html` → проверить, что загружаются все новости
2. Удалить любую новость → проверить, что она исчезла
3. Проверить, что карточки используют `news-card`

#### 6.4. Тест `index.html`
**Тесты:**
1. Открыть `index.html` → проверить, что бегущая строка показывает первые 3 новости
2. Добавить новость → проверить, что бегущая строка обновилась

---

## 📊 Итоговая структура

```
MySite/
├── static/
│   └── js/
│       ├── news-page-constructor.js      # ← Базовый класс (обновляется)
│       ├── catalog-page-constructor.js   # ← Рендер товаров (НОВЫЙ)
│       ├── actions-page-constructor.js   # ← Рендер акций (НОВЫЙ)
│       └── ...
├── data/
│   └── news/
│       ├── news-1.json                   # ← Акция (category: "Акции")
│       ├── news-2.json                   # ← Товар (category: "Товары")
│       ├── 1781019147250.json            # ← Тестовая новость
│       └── ...
├── catalog.html                          # ← Каталог товаров (обновляется)
├── actions.html                          # ← Страница акций (обновляется)
├── news.html                             # ← Страница новостей (уже работает)
└── index.html                            # ← Главная (обновляется)
```

---

## 🎯 Критерии успеха

- ✅ **Единая архитектура**: все типы контента используют одну JSON-структуру
- ✅ **Фильтрация по категории**: `catalog.html` показывает только товары, `actions.html` — только акции
- ✅ **Динамическая загрузка**: карточки не прописаны в HTML, а загружаются из JSON
- ✅ **Бейджи скидок**: отображаются на карточках акций (если есть поле `discount`)
- ✅ **Адаптивность**: карточки раскладываются по сетке на всех разрешениях
- ✅ **Бегущая строка**: обновляется на главной странице (первые 3 новости)

---

## 📝 Примечания

- **Карточки товаров и новостей — это одно и то же** — разница только в CSS-классах и фильтрации
- **Данные хранятся в `data/news/*.json`** — единый формат для всех типов контента
- **JS-рендереры используют `NewsPageConstructor`** — базовый класс, который можно наследовать
- **Фильтрация происходит в `loadNews()`** — каждый конструктор фильтрует данные под себя
- **Карточки товаров имеют `product-card`, новости — `news-card`** — разные CSS-классы для разных стилей

---

**Статус:** Готов к реализации  \n**Автор:** GigaCode  \n**Версия:** 3.0 (Единая архитектура + план действий)
