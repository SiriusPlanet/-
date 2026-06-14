# 🧪 Финальный план: Карточки товаров, акций и новостей — одно и то же

## 📅 Дата: 2026-06-14
## 🎯 Цель: Реализовать единую архитектуру для всех типов контента

---

## 🧠 Уточненное понимание архитектуры

### 1. Карточки товаров, акций и новостей — **одно и то же**
- **Единая JSON-структура** в `data/news/*.json`
- **Единый JS-рендерер** (`NewsCardConstructor` или `NewsPageConstructor`)
- **Разница только в CSS-классах и фильтрации**:
  - Новости: `news-card` + `news-grid`
  - Товары/Акции: `product-card` + `products-grid`
  - Все используют `data-category` или field `category`

### 2. Данные уже есть
```json
// data/news/news-1.json
{
  "id": "news-1",
  "title": "Супер скидка 25% на всю технику!",
  "category": "Акции",
  "discount": 25,
  ...
}

// data/news/news-2.json
{
  "id": "news-2",
  "title": "Новинка: Умные часы Pro X",
  "category": "Техника",
  "discount": 10,
  ...
}
```

### 3. Как работает текущая архитектура:
```
Сервер (siss.py) → сохраняет в data/news/{id}.json
     ↓
NewsManager → загружает все из data/news/*.json
     ↓
NewsCardConstructor → рендерит карточку (HTML)
     ↓
NewsPageConstructor → раскладывает карточки по сетке (grid)
     ↓
Разные страницы:
  - news.html → показывает все (category: любая)
  - actions.html → показывает только "Акции" (category: "Акции")
  - catalog.html → показывает только "Товары" (category: "Товары" или undefined)
  - index.html → показывает первые 3 (или все) для бегущей строки
```

---

## 📋 Финальный план действий

### 📌 Этап 1: Подготовка (10 минут)

#### 1.1. Проверить структуру данных
**Папка:** `data/news/`

**Файлы:**
- `news-1.json` — акция (category: "Акции", discount: 25%)
- `news-2.json` — новинка (category: "Техника", discount: 10%)
- `1781019147250.json` — тестовая новость (без category и discount)

**Проверить:**
- ✅ Всё есть
- ✅ Структура правильная
- ⏳ Добавить `category` в старые файлы (если нужно)

---

### 📌 Этап 2: Обновить `actions.html` (20 минут)

#### 2.1. Удалить статические карточки
**Сейчас в `actions.html`:**
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

#### 2.2. Подключить JS-скрипт
```html
<script type="module" src="static/js/actions-page-constructor.js"></script>
```

#### 2.3. Создать `actions-page-constructor.js`
**Файл:** `static/js/actions-page-constructor.js`

```javascript
import { NewsPageConstructor } from './news-page-constructor.js';

export class ActionsPageConstructor extends NewsPageConstructor {
    constructor() {
        super({
            containerSelector: '.products-grid',
            tickerContainerSelector: null // на странице акций нет бегущей строки
        });
    }

    async loadNews() {
        await super.loadNews();
        // Фильтруем только акции (category === 'Акции' ИЛИ есть поле discount)
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

---

### 📌 Этап 3: Обновить `catalog.html` (15 минут)

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

#### 3.2. Подключить JS-скрипт
```html
<script type="module" src="static/js/catalog-page-constructor.js"></script>
```

#### 3.3. Создать `catalog-page-constructor.js`
**Файл:** `static/js/catalog-page-constructor.js`

```javascript
import { NewsPageConstructor } from './news-page-constructor.js';

export class CatalogPageConstructor extends NewsPageConstructor {
    constructor() {
        super({
            containerSelector: '.products-grid',
            tickerContainerSelector: null // на странице каталога нет бегущей строки
        });
    }

    async loadNews() {
        await super.loadNews();
        // Фильтруем только товары (category === 'Товары' ИЛИ category === undefined)
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

### 📌 Этап 4: Обновить `index.html` (10 минут)

#### 4.1. Проверить, что бегущая строка работает
**Сейчас в `index.html`:**
```html
<div class="ticker-container">
    <div id="news-ticker">Загрузка хроник...</div>
</div>
```

#### 4.2. Обновить `NewsPageConstructor` для главной страницы
**Файл:** `static/js/news-page-constructor.js`

```javascript
// Добавить метод: renderTickerOnly()
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
```

---

### 📌 Этап 5: Тестирование (15 минут)

#### 5.1. Тест `actions.html`
**Тесты:**
1. Открыть `actions.html` → проверить, что загружаются только акции
2. Удалить `news-1.json` → проверить, что карточка исчезла
3. Добавить новую акцию через форму → проверить, что она появилась
4. Проверить, что бейдж скидки отображается

#### 5.2. Тест `catalog.html`
**Тесты:**
1. Открыть `catalog.html` → проверить, что загружаются только товары
2. Удалить `news-2.json` → проверить, что карточка исчезла
3. Добавить новый товар через форму → проверить, что он появился

#### 5.3. Тест `news.html`
**Тесты:**
1. Открыть `news.html` → проверить, что загружаются все новости
2. Удалить любую новость → проверить, что она исчезла
3. Проверить, что бегущая строка обновляется

#### 5.4. Тест `index.html`
**Тесты:**
1. Открыть `index.html` → проверить, что бегущая строка показывает первые 3 новости
2. Добавить новость → проверить, что бегущая строка обновилась

---

### 📌 Этап 6: Доработки (опционально, 30 минут)

#### 6.1. Улучшить дизайн карточек акций
- Добавить больше стилей для `product-card` (отличие от `news-card`)
- Добавить анимации при наведении
- Добавить кнопки "Купить" и "В корзину"

#### 6.2. Добавить фильтрацию по дате
- Показывать только акции за последний месяц
- Показывать только товары за последний год

#### 6.3. Добавить поиск
- Поиск по названию
- Поиск по категории

---

## 📊 Итоговая структура

```
MySite/
├── static/
│   └── js/
│       ├── news-page-constructor.js      # ← Рендер новостей
│       ├── actions-page-constructor.js   # ← Рендер акций (НОВЫЙ)
│       ├── catalog-page-constructor.js   # ← Рендер товаров (НОВЫЙ)
│       └── ...
├── data/
│   └── news/
│       ├── news-1.json                   # ← Акция (category: "Акции")
│       ├── news-2.json                   # ← Товар (category: "Товары")
│       ├── 1781019147250.json            # ← Тестовая новость
│       └── ...
├── actions.html                          # ← Страница акций (обновляется)
├── catalog.html                          # ← Каталог товаров (обновляется)
├── news.html                             # ← Страница новостей (уже работает)
└── index.html                            # ← Главная (уже работает)
```

---

## 🎯 Критерии успеха

- ✅ **Единая архитектура**: все типы контента используют одну JSON-структуру
- ✅ **Фильтрация по категории**: `actions.html` показывает только акции, `catalog.html` — только товары
- ✅ **Динамическая загрузка**: карточки не прописаны в HTML, а загружаются из JSON
- ✅ **Бейджи скидок**: отображаются на карточках акций
- ✅ **Адаптивность**: карточки раскладываются по сетке на всех разрешениях
- ✅ **Бегущая строка**: обновляется на главной странице

---

## 📝 Примечания

- **Карточки товаров и новостей — это одно и то же** — разница только в CSS-классах и фильтрации
- **Данные хранятся в `data/news/*.json`** — единый формат для всех типов контента
- **JS-рендереры используют `NewsPageConstructor`** — базовый класс, который можно наследовать
- **Фильтрация происходит в `loadNews()`** — каждый конструктор фильтрует данные под себя

---

**Статус:** Готов к реализации  \n**Автор:** GigaCode  \n**Версия:** 2.0 (Единая архитектура)
