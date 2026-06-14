# План унификации архитектуры карточек товаров, новостей и акций

**Дата начала:** 2026-06-14  
**Цель:** Унифицировать карточки товаров и новостей в единую систему с разным дизайном, но общей логикой

---

## 📋 ШАГ 0: Подготовка и анализ (ПРОЙДЕНО)

### Что уже изучено:
- ✅ `siss.py` — сервер с эндпоинтом `/get-news`, возвращающим `{news: [...], last_update: "..."}`
- ✅ `news-page-constructor.js` — старый конструктор новостей
- ✅ `catalog.html` — статическая страница с карточками товаров
- ✅ `actions.html` — статическая страница с карточками акций
- ✅ Данные в `data/news/*.json` с полями: `id`, `title`, `date`, `preview`, `content`, `image`

### Что нужно проверить:
- ⏳ Структура JSON-файлов (есть ли `category` и `discount`?)
- ⏳ Существование изображений в `images/img_n/`
- ⏳ Как обрабатывать старые файлы без `category` и `discount`

---

## 📁 ШАГ 1: Создание структуры шаблонов

### 1.1 Создать папку `templates/card-constructor/`
```bash
mkdir templates/card-constructor
```

### 1.2 Создать `templates/card-constructor/news-card.html`
**Назначение:** Шаблон карточки новости  
**Особенности:**
- Класс `news-card`
- Поля: `title`, `date`, `preview`, `content`, `image`
- Бейдж скидки **НЕ добавляется** (новости не продаются)
- Адаптивная сетка

### 1.3 Создать `templates/card-constructor/product-card.html`
**Назначение:** Шаблон карточки товара/акции  
**Особенности:**
- Класс `product-card`
- Поля: `title`, `date`, `preview`, `content`, `image`, `price`, `stock`
- **Бейдж скидки** (если `discount > 0`)
- CSS градиент `linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)`
- `transform: rotate(10deg)`
- Адаптивная сетка

---

## 💻 ШАГ 2: Создание JS-конструкторов

### 2.1 Создать `static/js/news-card-constructor.js`
**Назначение:** Рендер новостных карточек  
**Функции:**
- `render(newsItem, container, options)`
- `renderMultiple(newsArray, container, options)`
- `updateCard(card, newsItem)` — обновление существующей карточки
- `removeCard(card)` — анимированное удаление

**Источник данных:** API `/get-news` (фильтрация по `category` или без фильтра)

### 2.2 Создать `static/js/product-card-constructor.js`
**Назначение:** Рендер товарных карточек  
**Функции:**
- `render(productItem, container, options)`
- `renderMultiple(productArray, container, options)`
- `addDiscountBadge(element, discount)` — добавление бейджа скидки
- `formatPrice(price)` — форматирование цены

**Источник данных:** API `/get-news` (фильтрация по `category === 'Товары'` или `discount > 0`)

---

## 🔄 ШАГ 3: Обновление существующих конструкторов

### 3.1 Обновить `static/js/news-page-constructor.js`
**Изменения:**
- Заменить `this.newsUrl = '/data/news.json'` на `'/get-news'`
- Добавить фильтрацию по категории (опционально)
- Использовать `NewsCardConstructor` для рендеринга
- Сохранить функционал бегущей строки (ticker)

**API вызовы:**
```javascript
// Старый метод
await this.loadNews() // → '/data/news.json'

// Новый метод
const response = await fetch('/get-news');
const data = await response.json();
const newsArray = data.news;
```

### 3.2 Удалить старые статические карточки из HTML

#### 3.2.1 Обновить `catalog.html`
**Что убрать:**
- Статические `<div class="product-card">...</div>`
- Прямые ссылки на `images/1.png`, `images/2.png`

**Что добавить:**
- `<div class="products-grid" id="products-grid"></div>`
- `<script src="static/js/catalog-page-constructor.js"></script>`

#### 3.2.2 Обновить `actions.html`
**Что убрать:**
- Статические `<div class="product-card">...</div>`
- Прямые ссылки на `images/1.png`, `images/2.png`, `images/3.png`

**Что добавить:**
- `<div class="products-grid" id="products-grid"></div>`
- `<script src="static/js/actions-page-constructor.js"></script>`

---

## 🎯 ШАГ 4: Создание конструкторов страниц

### 4.1 Создать `static/js/catalog-page-constructor.js`
**Назначение:** Рендер страницы каталога товаров  
**Логика:**
1. Загрузить данные через `/get-news`
2. Отфильтровать: `category === 'Товары'` или `category === undefined` (товары по умолчанию)
3. Пропустить: `category === 'Акции'` (это отдельная страница)
4. Использовать `ProductCardConstructor` для рендеринга

**Фильтрация:**
```javascript
const products = news.filter(item => {
    const isProduct = item.category === 'Товары' || !item.category;
    const isNotAction = item.category !== 'Акции';
    return isProduct && isNotAction;
});
```

### 4.2 Создать `static/js/actions-page-constructor.js`
**Назначение:** Рендер страницы акций  
**Логика:**
1. Загрузить данные через `/get-news`
2. Отфильтровать: `category === 'Акции'` или `discount > 0`
3. Использовать `ProductCardConstructor` для рендеринга

**Фильтрация:**
```javascript
const actions = news.filter(item => {
    const isAction = item.category === 'Акции';
    const hasDiscount = item.discount && item.discount > 0;
    return isAction || hasDiscount;
});
```

---

## 🔗 ШАГ 5: Обновление главной страницы

### 5.1 Обновить `index.html`
**Что проверить:**
- Бегущая строка (ticker) обновляется из первых 3 новостей
- Используется `NewsPageConstructor`
- Нет дублирования данных

**Изменения:**
- Убедиться, что ticker использует `preview` из новостей
- Проверить анимацию появления карточек (opacity + translateY)

---

## 🧪 ШАГ 6: Тестирование

### 6.1 Тесты для `news-page-constructor.js`
- ✅ Загрузка новостей через `/get-news`
- ✅ Рендер массива новостей
- ✅ Обновление бегущей строки
- ✅ Фильтрация по категории (если реализована)

### 6.2 Тесты для `catalog-page-constructor.js`
- ✅ Загрузка товаров через `/get-news`
- ✅ Фильтрация: `category === 'Товары'` или `undefined`
- ✅ Исключение акций (`category === 'Акции'`)
- ✅ Рендер карточек товаров

### 6.3 Тесты для `actions-page-constructor.js`
- ✅ Загрузка акций через `/get-news`
- ✅ Фильтрация: `category === 'Акции'` или `discount > 0`
- ✅ Рендер карточек с бейджами скидок

### 6.4 Тесты для `news-card-constructor.js`
- ✅ Рендер одной карточки
- ✅ Рендер массива карточек с задержкой
- ✅ Анимация появления (opacity 0.5s, translateY)

### 6.5 Тесты для `product-card-constructor.js`
- ✅ Рендер карточки товара
- ✅ Добавление бейджа скидки
- ✅ Форматирование цены

---

## 🎨 ШАГ 7: CSS-адаптация

### 7.1 Проверить `static/css/style.css`
**Для `news-card`:**
```css
.news-card {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    padding: 20px;
    color: #fff;
    transition: transform 0.3s, box-shadow 0.3s;
}
.news-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.5);
}
```

**Для `product-card`:**
```css
.product-card {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    padding: 20px;
    color: #fff;
    position: relative;
    transition: transform 0.3s, box-shadow 0.3s;
}
.product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.5);
}
.product-card .news-card-discount-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    color: white;
    padding: 8px 16px;
    font-weight: bold;
    font-size: 1.2rem;
    border-radius: 8px 0 8px 0;
    transform: rotate(10deg);
    box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
    z-index: 10;
}
```

### 7.2 Сетка для обеих страниц
```css
.products-grid, .news-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
    gap: 20px;
    padding: 20px;
    background: rgba(0, 0, 0, 0.3);
}
```

---

## 📊 ШАГ 8: Обработка старых данных

### 8.1 Миграция старых JSON-файлов
**Проблема:** Старые файлы в `data/news/*.json` могут не иметь `category` и `discount`

**Решение:**
- Если `category` отсутствует → по умолчанию `'Товары'`
- Если `discount` отсутствует → `0`
- Добавить поле `updated_at` для отслеживания

**Скрипт миграции:**
```javascript
// migrate-old-news.js
const fs = require('fs');
const path = require('path');

const newsDir = path.join(__dirname, 'data', 'news');
const files = fs.readdirSync(newsDir);

files.forEach(file => {
    if (!file.endsWith('.json')) return;
    
    const filePath = path.join(newsDir, file);
    const news = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    const updated = {
        ...news,
        category: news.category || 'Товары',
        discount: news.discount || 0,
        updated_at: new Date().toISOString()
    };
    
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
});
```

---

## 🧩 ШАГ 9: Интеграция с существующим кодом

### 9.1 Проверка зависимостей
**Файлы, которые могут использовать старую структуру:**
- `static/js/main.js`
- `index.html` (ticker)
- `news.html` (страница новостей)

**Что проверить:**
- Нет прямых ссылок на `/data/news.json`
- Нет дублирования карточек
- Анимации работают корректно

### 9.2 Обновление `news.html`
**Текущее состояние:** Статическая страница с карточками

**Изменения:**
- Убрать статические карточки
- Подключить `news-page-constructor.js`
- Добавить контейнер `<div class="news-grid" id="news-grid"></div>`

---

## 📝 ШАГ 10: Документация и чек-лист

### 10.1 Добавить README.md в `templates/card-constructor/`
```markdown
# Card Constructors

## Файлы
- `news-card.html` — шаблон для новостей
- `product-card.html` — шаблон для товаров и акций

## JS-конструкторы
- `news-card-constructor.js` — рендер новостных карточек
- `product-card-constructor.js` — рендер товарных карточек
- `news-page-constructor.js` — страница новостей
- `catalog-page-constructor.js` — страница каталога
- `actions-page-constructor.js` — страница акций

## API
- `/get-news` — получение всех новостей
- `/save-news` — создание новой новости
- `/api/delete-news` — удаление новости
- `/api/update-news` — обновление новости

## Фильтрация
- **Новости:** все карточки
- **Товары:** `category === 'Товары'` или `undefined`
- **Акции:** `category === 'Акции'` или `discount > 0`
```

### 10.2 Чек-лист прогресса

| Шаг | Статус | Примечание |
|-----|--------|------------|
| 0. Подготовка | ✅ | Изучена структура данных |
| 1. Шаблоны | ⏳ | Создать `news-card.html` и `product-card.html` |
| 2. JS-конструкторы | ⏳ | Создать `news-card-constructor.js` и `product-card-constructor.js` |
| 3. Обновление | ⏳ | Обновить `news-page-constructor.js` и HTML-файлы |
| 4. Конструкторы страниц | ⏳ | Создать `catalog-page-constructor.js` и `actions-page-constructor.js` |
| 5. Тестирование | ⏳ | Проверить все страницы |
| 6. CSS | ⏳ | Проверить стили для `.news-card` и `.product-card` |
| 7. Миграция | ⏳ | Обновить старые JSON-файлы |

---

## 🚀 План следующих действий

1. **Создать шаблоны карточек** (ШАГ 1)
2. **Создать JS-конструкторы** (ШАГ 2)
3. **Обновить существующие файлы** (ШАГ 3, 4)
4. **Протестировать** (ШАГ 6)
5. **Адаптировать CSS** (ШАГ 7)
6. **Мигрировать данные** (ШАГ 8)

---

**Примечание:** Все изменения должны быть совместимы с существующим API `/get-news` и не нарушать работу других страниц.
