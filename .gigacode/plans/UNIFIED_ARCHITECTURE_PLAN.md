# 📋 Финальный план: Единая архитектура карточек (Товары, Акции, Новости)

## 📅 Дата: 2026-06-14 (обновлено)
## 🎯 Цель: Карточки товаров, акций и новостей — это одно и то же (разница только в CSS и фильтрации)

---

## 🧠 Понимание архитектуры (обновлённое)

### 1. Единая структура данных
**Папка:** `data/news/*.json`

**JSON-структура:**
```json
{
  "id": 1781019147250,
  "title": "Супер скидка 25% на всю технику!",
  "date": "2026-06-14",
  "preview": "...",
  "content": "...",
  "image": "tech-sale.jpg",
  "discount": 25,        // ← поле скидки (опционально)
  "category": "Акции",    // ← поле категории
  "lotType": "product",   // ← тип лота: "product" (товар) или "news" (новость)
  "price": 1000          // ← цена (для товаров)
}
```

### 2. Ключевая мысль (обновлённая)
- **Акции — это товары, у которых `discount > 0`**
- **Карточки товаров и новостей — это одно и то же**
- **Разница только в метке `lotType`**:
  - `lotType: "product"` → товар (показывается в catalog.html)
  - `lotType: "news"` или `lotType` не указан → новость (показывается в news.html)
- **Акции** — это товары с `discount > 0`, они показываются на отдельной странице **actions.html**
- **Форма автоматически добавляет `lotType`** в зависимости от выбранной закладки:
  - Вкладка "Новости" → `lotType: "news"`
  - Вкладка "Товары" → `lotType: "product"` + `price`

### 3. Единый JS-рендерер
**Модули:**
- `NewsPageConstructor` — базовый класс для всех страниц
- `CatalogPageConstructor` — рендер товаров (фильтрует по `lotType === 'product'`)
- `ActionsPageConstructor` — рендер акций (фильтрует по `lotType === 'product'` И `discount > 0`)
- `NewsPageConstructor` (для news.html) — показывает всё (без фильтрации)

### 4. Разные CSS-классы
- **Новости:** `news-card` + `news-grid` (на news.html)
- **Товары/Акции:** `catalog-card` + `news-grid` (на catalog.html и actions.html)

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

### 📌 ШАГ 1: Исправить баги в текущей реализации (10 минут)

#### 1.1. Исправить `catalog.js` — добавить `lotType: 'news'` для новостей

**Файл:** `static/js/catalog.js`  
**Строка:** ~120 (метод `handleNewsSubmit`)

**БЫЛО:**
```javascript
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
```

**СТАЛО:**
```javascript
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

        // Добавляем тип лота (новость)
        formData.append('lotType', 'news');

        const result = await this.newsManager.saveNews(formData);
```

#### 1.2. Исправить `siss.py` — сохранять `lotType` явно

**Файл:** `siss.py`  
**Строка:** ~200 (обработка данных)

**БЫЛО:**
```python
lot_type = data.get('lotType', 'news')  # по умолчанию - новость
print(f"[INFO] lotType: {lot_type}")

if lot_type == 'product':
    # Обработка товара
    title = data.get('productName', '').strip()
    price = data.get('productPrice', '').strip()
    content = data.get('productDescription', '').strip()
    preview = content[:100] + ("..." if len(content) > 100 else "") if content else ""
    date = datetime.now().strftime('%Y-%m-%d')
    discount = ''
else:
    # Обработка новости
    title = data.get('title', '').strip()
    date = data.get('date', '').strip()
    preview = data.get('preview', '').strip()
    content = data.get('content', '').strip()
    discount = data.get('discount', '').strip()  # ← НОВОЕ: скидка
```

**СТАЛО:**
```python
lot_type = data.get('lotType', 'news')  # по умолчанию - новость
print(f"[INFO] lotType: {lot_type}")

if lot_type == 'product':
    # Обработка товара
    title = data.get('productName', '').strip()
    price = data.get('productPrice', '').strip()
    content = data.get('productDescription', '').strip()
    preview = content[:100] + ("..." if len(content) > 100 else "") if content else ""
    date = datetime.now().strftime('%Y-%m-%d')
    discount = data.get('discount', '0').strip()  # ← Добавить discount
else:
    # Обработка новости
    title = data.get('title', '').strip()
    date = data.get('date', '').strip()
    preview = data.get('preview', '').strip()
    content = data.get('content', '').strip()
    discount = data.get('discount', '0').strip()  # ← Добавить discount

# ← ДОБАВИТЬ: сохранять lotType явно
news_json = {
    "id": news_id,
    "title": title,
    "date": date or datetime.now().strftime('%Y-%m-%d'),
    "preview": preview,
    "content": content,
    "image": image_path or "400.png",
    "lotType": lot_type,  # ← ДОБАВИТЬ: сохранять lotType явно
    "discount": int(discount) if discount and discount.isdigit() else 0
}
```

**Также в `handle_get_news`** (строка ~450) — убрать автоматическое определение `lotType`:

**БЫЛО:**
```python
news["lotType"] = "product" if "price" in news else "news"
news_list.append(news)
```

**СТАЛО:**
```python
news_list.append(news)
```

---

### 📌 ШАГ 2: Обновить `NewsPageConstructor` (30 минут)

#### 2.1. Обновить `static/js/news-page-constructor.js`

**Проблема:** Сейчас `NewsPageConstructor` использует `this.newsUrl` с дефолтом `/data/news.json`, но у нас API `/get-news`.

**Решение:** Обновить конструктор, чтобы он:
- Использовал `/get-news` по умолчанию
- Принимал `containerSelector` и `tickerContainerSelector` в опциях
- Добавлял `lotTypeFilter` для фильтрации
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
this.lotTypeFilter = options.lotTypeFilter || null; // 'product' или 'news' или null (всё)
this.init();
```

**Код для замены (метод loadNews, примерно строка ~85):**
```javascript
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
        
        // Фильтруем по типу лота, если задано
        if (this.lotTypeFilter) {
            this.newsList = this.newsList.filter(
                n => n.lotType === this.lotTypeFilter
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

---

### 📌 ШАГ 3: Создать `catalog-page-constructor.js` (10 минут)

**Путь:** `static/js/catalog-page-constructor.js`

```javascript
// static/js/catalog-page-constructor.js
// Рендер карточек товаров на странице catalog.html

import { NewsPageConstructor } from './news-page-constructor.js';

export class CatalogPageConstructor extends NewsPageConstructor {
    constructor() {
        super({
            containerSelector: '.news-grid',  // каталог использует .news-grid
            tickerContainerSelector: null, // на странице каталога нет бегущей строки
            newsUrl: '/get-news',
            lotTypeFilter: 'product' // показываем только товары
        });
    }

    async loadNews() {
        await super.loadNews();
        // Дополнительная фильтрация: только товары (lotType === 'product')
        console.log(`[CatalogPageConstructor] Загружено ${this.newsList.length} товаров`);
    }

    createCardElement(news, index) {
        // Создаем карточку как catalog-card (а не news-card)
        const card = super.createCardElement(news, index);
        card.classList.remove('news-card');
        card.classList.add('catalog-card');
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

### 📌 ШАГ 4: Создать `actions-page-constructor.js` (10 минут)

**Путь:** `static/js/actions-page-constructor.js`

```javascript
// static/js/actions-page-constructor.js
// Рендер карточек акций на странице actions.html

import { NewsPageConstructor } from './news-page-constructor.js';

export class ActionsPageConstructor extends NewsPageConstructor {
    constructor() {
        super({
            containerSelector: '.news-grid', // акции показываются в той же сетке
            tickerContainerSelector: null, // на странице акций нет бегущей строки
            newsUrl: '/get-news',
            lotTypeFilter: 'product' // показываем только товары
        });
    }

    async loadNews() {
        await super.loadNews();
        // Дополнительная фильтрация: только акции (discount > 0)
        this.newsList = this.newsList.filter(
            n => n.discount && n.discount > 0
        );
        console.log(`[ActionsPageConstructor] Загружено ${this.newsList.length} акций`);
    }

    createCardElement(news, index) {
        // Создаем карточку как catalog-card (а не news-card)
        const card = super.createCardElement(news, index);
        card.classList.remove('news-card');
        card.classList.add('catalog-card');
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

### 📌 ШАГ 5: Обновить HTML-файлы (5 минут)

#### 5.1. Обновить `catalog.html`

**Добавить подключение скрипта перед `</body>`:**
```html
<script type="module" src="static/js/catalog-page-constructor.js"></script>
```

#### 5.2. Обновить `actions.html`

**Добавить подключение скрипта перед `</body>`:**
```html
<script type="module" src="static/js/actions-page-constructor.js"></script>
```

---

### 📌 ШАГ 6: Тестирование (15 минут)

#### 6.1. Тест `catalog.html`
**Тесты:**
1. Открыть `catalog.html` → проверить, что загружаются товары из `news-2.json`
2. Удалить `news-2.json` → проверить, что карточка исчезла
3. Добавить новый товар через форму → проверить, что он появился
4. Проверить, что карточки используют `catalog-card` (а не `news-card`)

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
│       ├── news-1.json                   # ← Акция (lotType: "product", discount: 25)
│       ├── news-2.json                   # ← Товар (lotType: "product", discount: 0)
│       ├── 1781019147250.json            # ← Тестовая новость (lotType: "news")
│       └── ...
├── catalog.html                          # ← Каталог товаров (обновляется)
├── actions.html                          # ← Страница акций (обновляется)
├── news.html                             # ← Страница новостей (уже работает)
└── index.html                            # ← Главная (обновляется)
```

---

## 🎯 Критерии успеха

- ✅ **Единая архитектура**: все типы контента используют одну JSON-структуру
- ✅ **Фильтрация по типу лота**:
  - `catalog.html` показывает только товары (`lotType === 'product'`)
  - `actions.html` показывает только акции (`lotType === 'product'` И `discount > 0`)
  - `news.html` показывает всё (без фильтрации)
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
- **Карточки товаров имеют `catalog-card`, новости — `news-card`** — разные CSS-классы для разных стилей
- **Форма автоматически добавляет `lotType`** в зависимости от выбранной закладки

---

## 🚫 ВАЖНО: Отключенные функции на текущем этапе

### ✅ Валидация не реализована/отключена
- Даже если валидатор существует (validator.js), он упрощённый и **не подключается к работе**
- Можно реализовать полноценную валидацию, но **не подключать сейчас**
- Формы принимают любые данные без проверки
- **Не чинить и не подключать на текущем этапе!**

### ✅ Проверка доступа/уровней отключена
- Система управления уровнями (permission-manager, access-levels) **существует, но отключена**
- Тестирование требует смены аккаунтов, что неудобно при постоянной проверке
- Будет реализована и протестирована **в самом конце, разом для всех уровней**
- Не нужно постоянно менять аккаунты при тестировании
- **Не чинить и не подключать на текущем этапе!**

Эти функции можно реализовать, но не подключать сейчас — приоритет на основную функциональность.

**Статус:** Готов к реализации  \
**Автор:** GigaCode  \
**Версия:** 6.0 (Единая архитектура + форма с закладками + автоматический lotType + исправление багов)

---

## 🔧 Что исправлено в версии 6.0

### Баги, которые нужно исправить:

1. **`catalog.js`** — не добавляется `lotType: 'news'` для новостей
   - **Исправление:** Добавить `formData.append('lotType', 'news')` в `handleNewsSubmit()`

2. **`siss.py`** — `lotType` не сохраняется явно
   - **Исправление:** Добавить `"lotType": lot_type` в `news_json` и убрать автоматическое определение в `/get-news`

---

## 🔁 Цикл разработки: Форма → Карточки → Фильтрация

### 1. Форма ( частично готова)
- ✅ В `catalog.html` уже есть форма с двумя закладками ("Новости" и "Товары")
- ✅ Вкладка "Товары" сохраняет с `lotType: "product"`
- ❌ Вкладка "Новости" **НЕ** сохраняет с `lotType: "news"` — **ИСПРАВИТЬ**

### 2. Карточки (нужно обновить)
- ✅ Каталог: показывает только товары (`lotType === 'product'`)
- ✅ Акции: показывает только акции (`lotType === 'product'` И `discount > 0`)
- ✅ Новости: показывает всё (без фильтрации)

### 3. Фильтрация (реализована в `news-manager.js`)
- ✅ `NewsManager` уже фильтрует по `lotType` и `discount`

### 4. Итог
- ✅ **Карточки товаров и новостей — это одно и то же**
- ✅ **Разница только в метке `lotType`**
- ✅ **Если `lotType === 'product'` — это товар, если `lotType === 'news'` — это новость**
- ✅ **Если `lotType === 'product'` И `discount > 0` — это акция**

---

## 📌 Следующие шаги (после валидации плана)

1. **Исправить `catalog.js`** — добавить `lotType: 'news'` в `handleNewsSubmit()`
2. **Исправить `siss.py`** — сохранять `lotType` явно
3. **Обновить `news-page-constructor.js`** — добавить фильтрацию по `lotType`
4. **Создать `catalog-page-constructor.js`** — рендер товаров
5. **Создать `actions-page-constructor.js`** — рендер акций
6. **Обновить `catalog.html` и `actions.html`** — добавить подключение скриптов
7. **Протестировать всё** — загрузка, сохранение, фильтрация

---

## 💡 Контекст для следующего сеанса

**Текущее состояние:**
- ✅ Форма с закладками готова (в `catalog.html`)
- ✅ `news-manager.js` уже умеет сохранять и загружать данные
- ✅ `catalog.js` уже рендерит товары (но не использует `NewsPageConstructor`)
- ❌ `catalog.js` **НЕ** добавляет `lotType: 'news'` для новостей — **БАГ**
- ❌ `siss.py` **НЕ** сохраняет `lotType` явно — **БАГ**
- ❌ `news-page-constructor.js` нуждается в обновлении (добавить фильтрацию по `lotType`)
- ❌ `catalog-page-constructor.js` и `actions-page-constructor.js` нужно создать

**Ключевые файлы:**
- `static/js/catalog.js` — исправить (добавить `lotType: 'news'`)
- `siss.py` — исправить (сохранять `lotType` явно)
- `static/js/news-page-constructor.js` — обновить
- `static/js/catalog-page-constructor.js` — создать
- `static/js/actions-page-constructor.js` — создать
- `catalog.html` — добавить подключение скрипта
- `actions.html` — добавить подключение скрипта

**Ключевая мысль:**
> **Карточки товаров и новостей — это одно и то же. Разница только в метке `lotType`.**

**Статус:** План утвержден, готов к реализации (с исправлением багов)

---

## 📋 Чек-лист для следующего сеанса

- [ ] Исправить `catalog.js` — добавить `formData.append('lotType', 'news')` в `handleNewsSubmit()`
- [ ] Исправить `siss.py` — сохранять `lotType` явно в `news_json`
- [ ] Убрать автоматическое определение `lotType` в `/get-news`
- [ ] Обновить `news-page-constructor.js` — добавить `lotTypeFilter`
- [ ] Создать `catalog-page-constructor.js`
- [ ] Создать `actions-page-constructor.js`
- [ ] Добавить подключение скриптов в `catalog.html` и `actions.html`
- [ ] Протестировать всё
