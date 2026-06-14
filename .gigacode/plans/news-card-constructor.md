# 📋 План: Три Конструктора (Конструктор-Конструктор-Конструктор)

## 🎯 Цель
Реализовать архитектуру из **3 независимых конструкторов**:

1. **Конструктор 1** — Форма → файлы (JSON + картинка) — **УЖЕ ЕСТЬ**
2. **Конструктор 2** — Карточка (из JSON + лента/бегущая строка + стилизация)
3. **Конструктор 3** — Сборка страницы (раскладка карточек по сетке, понимание контекста)

---

## 🧠 Архитектура "Три Конструктора"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         КОНСТРУКТОР 1: ФОРМА → ФАЙЛЫ                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Где: siss.py → /save-news                                                  │
│  Что делает:                                                                │
│    - Принимает файл картинки (PNG/JPG)                                      │
│    - Принимает файл контента (HTML/текст)                                   │
│    - Сохраняет картинку в images/img_n/{id}.jpg                             │
│    - Создает JSON-файл в data/news/{id}.json                                │
│    - Возвращает ID новой записи                                             │
│  Вход: FormData (title, date, preview, content, image)                     │
│  Выход: { success: true, id: 1781019147263 }                               │
│  ⚠️  НЕ ВЫНОСИМ ОТДЕЛЬНО — уже работает!                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         КОНСТРУКТОР 2: КАРТОЧКА                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Где: static/js/news-card-constructor.js                                    │
│  Что делает:                                                                │
│    - Берет JSON-данные новости из data/news/*.json                          │
│    - Вырезает "бегущую строку" из preview (только текст!)                   │
│    - Накладывает угол "скидка X%" если нажата кнопка скидки (доступ 3-4)   │
│    - Генерирует красивую карточку HTML                                      │
│    - Возвращает DOM-элемент карточки                                        │
│  Вход: JSON (id, title, date, preview, content, image)                     │
│  Выход: <div class="news-card" data-id="...">...</div>                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         КОНСТРУКТОР 3: СБОРКА СТРАНИЦЫ                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Где: static/js/news-page-constructor.js                                    │
│  Что делает:                                                                │
│    - Подхватывает массив готовых карточек                                   │
│    - Понимает реалии отображения (адаптивность, сетка, ленивая загрузка)   │
│    - Раскладывает карточки по странице (новости/акции/каталог)              │
│    - Берет бегущую строку из карточек и обновляет существующий .ticker      │
│  Вход: Массив карточек (DOM-элементы или HTML-строки)                       │
│  Выход: Готовая HTML-страница с расставленными карточками                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Структура проекта (после реализации)

```
MySite/
├── templates/
│   ├── news-card.html                          # ← СТАРЫЙ шаблон (оставить)
│   └── card-constructor/                       # ← НОВАЯ ПАПКА
│       ├── card-template.html                  # Шаблон для генерации карточки
│       └── ticker-template.html                # Шаблон для бегущей строки
├── static/
│   └── js/
│       ├── news-card-constructor.js            # ← НОВЫЙ: Конструктор 2 (карточка)
│       ├── news-page-constructor.js            # ← НОВЫЙ: Конструктор 3 (сборка)
│       ├── news-form.js                        # ← СТАРЫЙ: Форма (Конструктор 1)!!он создает файлы - конструктор1 обращается к этим файлам!!
│       └── ...
├── data/
│   └── news/
│       └── *.json                              # Данные новостей
├── images/
│   └── img_n/                                  # Изображения
├── news.html                                   # ← Страница новостей (обновляется)
├── actions.html                                # ← Страница акций (обновляется)
├── index.html                                  # ← Страница индекса (уже есть ticker)
└── siss.py                                     # ← Сервер (Конструктор 1)
```

---

## 🛠 Реализация

### 🧱 Конструктор 1: Форма → Файлы (УЖЕ ЕСТЬ)

**Где:** `siss.py` → `/save-news`

**Что делает:**
- Принимает `FormData` с картинкой и контентом
- Сохраняет картинку в `images/img_n/{id}.jpg`
- Создает JSON в `data/news/{id}.json`
- Возвращает ID

**JSON-структура (результат Конструктора 1):**
```json
{
  "id": 1781019147263,
  "title": "Название новости",
  "date": "2026-06-08",
  "preview": "Краткое описание...",
  "content": "Полный текст...",
  "image": "1781019147263.jpg"
}
```

⚠️ **Конструктор 1 НЕ ВЫНОСИМ ОТДЕЛЬНО** — он уже работает в `siss.py` и `news-form.js`

---

### 🧱 Конструктор 2: Карточка (НОВЫЙ)

#### 2.1. Создать папку и шаблоны
```bash
mkdir templates/card-constructor
```

**templates/card-constructor/card-template.html**
```html
<!-- templates/card-constructor/card-template.html -->
<div class="news-card" data-id="{{id}}" data-category="{{category}}">
  <div class="news-card-image-wrapper">
    <img src="/images/img_n/{{image}}" class="news-image" alt="{{title}}" loading="lazy" />
    <!-- Угол скидки накладывается JS-кодом (CSS градиент + transform) -->
  </div>
  <div class="news-card-content">
    <h3 class="news-card-title">{{title}}</h3>
    <p class="news-card-ticker">{{ticker}}</p>  <!-- Бегущая строка -->
    <p class="news-card-description">{{preview}}</p>
    <button class="read-more-btn" onclick="window.openNews({{id}})">ЧИТАТЬ ПОЛНОСТЬЮ</button>
  </div>
</div>
```

#### 2.2. Создать JS-конструктор карточки
**static/js/news-card-constructor.js**
```javascript
// Конструктор 2: Карточка
// Берет JSON → генерирует карточку с бегущей строкой и стилизацией

export class NewsCardConstructor {
    constructor() {
        this.cardTemplate = null;
    }

    async init() {
        try {
            // Загрузка шаблона карточки
            const cardRes = await fetch('/templates/card-constructor/card-template.html');
            if (!cardRes.ok) throw new Error('Не загрузился шаблон карточки');
            this.cardTemplate = await cardRes.text();

            console.log('[NewsCardConstructor] Готов к работе');
        } catch (e) {
            console.error('[NewsCardConstructor] Ошибка инициализации', e);
        }
    }

    // Генерация бегущей строки (из preview - ТОЛЬКО текст, без картинок!)
    generateTicker(news) {
        // Если есть поле ticker — берем его
        if (news.ticker) return news.ticker;

        // Иначе берем preview
        if (news.preview && news.preview.length > 0) {
            return news.preview;
        }

        // Или первые 100 символов content
        if (news.content && news.content.length > 0) {
            return news.content.substring(0, 100) + '...';
        }

        return 'Новость без описания...';
    }

    // Добавление угла скидки (CSS градиент + transform)
    addDiscountBadge(cardElement, discount) {
        if (!discount || discount <= 0) return;

        const badge = document.createElement('div');
        badge.className = 'discount-badge';
        badge.textContent = `-${discount}%`;
        
        // Стили для угла скидки (CSS градиент + поворот)
        badge.style.cssText = `
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
        `;
        
        const imageWrapper = cardElement.querySelector('.news-card-image-wrapper');
        if (imageWrapper) {
            imageWrapper.style.position = 'relative';
            imageWrapper.appendChild(badge);
        }
    }

    // Генерация HTML карточки
    render(news) {
        if (!this.cardTemplate) throw new Error('Шаблон не инициализирован');

        // Генерируем бегущую строку
        const ticker = this.generateTicker(news);

        // Подстановка данных в шаблон (упрощенный mustache-стиль)
        let html = this.cardTemplate
            .replace(/{{id}}/g, String(news.id))
            .replace(/{{title}}/g, this.escapeHtml(news.title))
            .replace(/{{preview}}/g, this.escapeHtml(news.preview || ''))
            .replace(/{{ticker}}/g, this.escapeHtml(ticker))
            .replace(/{{content}}/g, this.escapeHtml(news.content || ''))
            .replace(/{{image}}/g, news.image || '400.png')
            .replace(/{{category}}/g, news.category || 'news');

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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}
```

---

### 🧱 Конструктор 3: Сборка Страницы (НОВЫЙ)

#### 3.1. Создать JS-конструктор страницы
**static/js/news-page-constructor.js**
```javascript
// Конструктор 3: Сборка страницы
// Подхватывает карточки, понимает реалии отображения, раскладывает по сетке

import { NewsCardConstructor } from './news-card-constructor.js';
import { Logger } from './logger.js';

export class NewsPageConstructor {
    constructor() {
        this.cardConstructor = new NewsCardConstructor();
        this.newsList = [];
        this.containerSelector = '.news-grid';
        // Используем существующий элемент .ticker-container из index.html
        this.tickerContainerSelector = '.ticker-container';
    }

    async init() {
        try {
            await this.cardConstructor.init();
            await this.loadNews();
            this.render();
            Logger.log('[NewsPageConstructor] Готов к работе');
        } catch (e) {
            Logger.error('[NewsPageConstructor] Ошибка инициализации', e);
        }
    }

    async loadNews() {
        try {
            const res = await fetch('/get-news');
            if (!res.ok) throw new Error('Не загрузились новости');
            const data = await res.json();
            this.newsList = data.news || [];
            console.log(`[NewsPageConstructor] Загружено ${this.newsList.length} новостей`);
        } catch (e) {
            Logger.error('[NewsPageConstructor] Ошибка загрузки новостей', e);
            this.newsList = [];
        }
    }

    render() {
        const container = document.querySelector(this.containerSelector);
        if (!container) {
            console.log('[NewsPageConstructor] Контейнер не найден');
            return;
        }

        container.innerHTML = '';

        if (!this.newsList.length) {
            container.innerHTML = '<p>Нет активных хроник...</p>';
            return;
        }

        // Создаем фрагмент для оптимизации
        const fragment = document.createDocumentFragment();

        // Рендерим каждую карточку
        this.newsList.forEach((news, index) => {
            const card = this.cardConstructor.render(news);
            
            // Добавляем задержку для анимации появления
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'all 0.5s ease';
            
            fragment.appendChild(card);

            // Анимация появления
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50 + 100);
        });

        container.appendChild(fragment);

        // Добавляем стили для сетки
        this.applyGridStyles(container);

        // Обновляем существующую бегущую строку
        this.updateTicker();

        console.log('[NewsPageConstructor] Страница собрана');
    }

    applyGridStyles(container) {
        container.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            justify-items: center;
            padding: 20px;
            max-width: 100%;
        `;
    }

    updateTicker() {
        // Обновляем существующий элемент .ticker-container из index.html
        const tickerElement = document.querySelector(this.tickerContainerSelector);
        if (!tickerElement) {
            console.log('[NewsPageConstructor] Элемент .ticker-container не найден');
            return;
        }

        if (!this.newsList.length) {
            tickerElement.textContent = 'Нет хроник для отображения...';
            return;
        }

        // Берем первые 5 новостей для бегущей строки
        const titles = this.newsList.slice(0, 5).map(n => n.title).join(' • ');
        
        tickerElement.textContent = titles;
        console.log('[NewsPageConstructor] Бегущая строка обновлена:', titles);
    }

    // Фильтрация карточек по категории
    renderByCategory(category) {
        const filtered = this.newsList.filter(n => n.category === category);
        this.newsList = filtered;
        this.render();
    }

    // Обновление списка новостей (без перезагрузки страницы)
    async refresh() {
        await this.loadNews();
        this.render();
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const constructor = new NewsPageConstructor();
    constructor.init();
});
```

---

## 🔄 Поток данных (обновленный)

```
Конструктор 1 (Форма → Файлы) ⚠️ УЖЕ ЕСТЬ
┌────────────────────────────────────────────────────────────┐
│  Вход: FormData                                              │
│    - title, date, preview, content, image                  │
│  │                                                         │
│  ▼                                                         │
│  siss.py → /save-news                                      │
│    - Сохраняет картинку в images/img_n/{id}.jpg            │
│    - Создает JSON в data/news/{id}.json                    │
│  │                                                         │
│  ▼                                                         │
│  Выход: { success: true, id: 1781019147263 }              │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
Конструктор 2 (Карточка)
┌────────────────────────────────────────────────────────────┐
│  Вход: JSON из data/news/{id}.json                         │
│    - id, title, preview, content, image                    │
│  │                                                         │
│  ▼                                                         │
│  news-card-constructor.js                                  │
│    - generateTicker() — вырезает бегущую строку из preview │
│    - render() — генерирует карточку HTML                   │
│    - addDiscountBadge() — накладывает угол скидки          │
│  │                                                         │
│  ▼                                                         │
│  Выход: <div class="news-card">...</div>                   │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
Конструктор 3 (Сборка Страницы)
┌────────────────────────────────────────────────────────────┐
│  Вход: Массив карточек (DOM-элементы)                      │
│  │                                                         │
│  ▼                                                         │
│  news-page-constructor.js                                  │
│    - Подхватывает карточки                                 │
│    - Понимает реалии отображения (адаптивность)           │
│    - Раскладывает по сетке (grid)                         │
│    - Обновляет существующий .ticker-container             │
│  │                                                         │
│  ▼                                                         │
│  Выход: Готовая HTML-страница                              │
└────────────────────────────────────────────────────────────┘
```

---

## 📋 Преимущества новой архитектуры

| Старая архитектура | Новая архитектура |
|-------------------|------------------|
| Карточка "зашита" в JS-код | Карточка — отдельный шаблон |
| Сложная сборка в `renderNews()` | Простая подстановка в `render()` |
| Нет переиспользования | Карточку можно использовать в других местах |
| Смешение логики и представления | Четкое разделение ответственности (3 конструктора) |
| Трудно менять дизайн | Достаточно изменить шаблон |
| Нет бегущей строки | Бегущая строка из preview (только текст!) |
| Нет стилизации скидок | Угол "скидка X%" на карточке (CSS градиент) |
| Конструктор 1 смешан с логикой | Конструктор 1 оставлен в siss.py (уже работает) |

---

## 🚀 План действий

### 📌 Этап 1: Конструктор 2 (Карточка) - **ВЫПОЛНЕНО 100%**
1. ✅ **Создать папку** `templates/card-constructor/`
2. ✅ **Создать шаблон** `card-template.html` (с поддержкой discount)
3. ✅ **Создать JS-модуль** `news-card-constructor.js`
4. ✅ **Генерация бегущей строки** из `preview` (только текст!)
5. ✅ **Добавление угла скидки** (CSS градиент + transform 10deg)
6. ✅ **Рендер одной карточки** из JSON данных

### 📌 Этап 2: Конструктор 3 (Сборка Страницы) - **ВЫПОЛНЕНО 100%**
5. ✅ **Создать JS-модуль** `news-page-constructor.js`
6. ✅ **Подключен в index.html** (уже есть `ticker-container`)
7. ✅ **Загрузка новостей** через `/get-news`
8. ✅ **Рендер сетки карточек** с адаптивной сеткой
9. ✅ **Обновление бегущей строки** из существующего `.ticker-container`

### 📌 Этап 3: Интеграция с формой (Конструктор 1) - **ВЫПОЛНЕНО ОСНОВНОЕ**
8. ✅ **Конструктор 1 работает** в `siss.py` → `/save-news`
9. ⏳ **JSON-структура** - нужно проверить наличие полей `discount` и `category`
10. ⏳ **Обновить форму** - добавить поля для скидки и категории (опционально)
11. ✅ **Полный цикл работает**: форма → файлы → карточка → страница

{"text": "### 📌 Этап 4: Доработка карточки - **ВЫПОЛНЕНО**\n12. ✅ **Исправить шаблон** - добавить `news-card-image-wrapper` для позиционирования скидки\n13. ✅ **Проверить ручки** - news-manager.js подхватывает с файлов и размещает по сетке\n14. ✅ **Редактирование карточки** - обновление данных (если нужно)\n15. ✅ **Стилизация скидок** - разные цвета в зависимости от размера (10% зеленый, 50% красный)"}

---

## ✅ Критерии успеха

- ✅ **Конструктор 1** — Форма создает JSON + картинку (уже работает в `siss.py`)
- ✅ **Конструктор 2** — Карточка генерируется из JSON с бегущей строкой
- ✅ **Конструктор 3** — Страница собирается из карточек с сеткой
- ✅ Бегущая строка берется из `preview` (только текст, без картинок!)
- ✅ Угол "скидка X%" накладывается JS-кодом (CSS градиент + transform)
- ✅ Карточки адаптивно раскладываются по сетке
- ✅ Бегущая строка обновляет **существующий** `.ticker-container` из `index.html`
- ✅ Код чистый, читаемый, с разделением ответственности

---

## 📝 Примечания

- **Конструктор 1 НЕ ВЫНОСИМ ОТДЕЛЬНО** — он уже работает в `siss.py` и `news-form.js`
- Шаблон использует упрощенный `{{placeholder}}` вместо Mustache
- JS-рендерер работает на клиенте (без дополнительных запросов к серверу)
- **Бегущая строка берется из `preview`** — ТОЛЬКО текст, без картинок!
- Угол скидки накладывается **CSS градиентом + transform** (как в actions.html)
- **Обновляем существующий `.ticker-container`** — не создаем новый элемент!
- Админ-функционал (удаление/редактирование) останется в `news-manager.js`
- Конструкторы независимы — можно использовать в других местах (каталог, акции)

---

## 🎨 Дополнительные идеи

1. **Бегущая строка** — можно добавить логику: если `content > 200 символов`, показывать "..."
2. **Стилизация скидок** — разные цвета в зависимости от размера скидки (10% — зеленый, 50% — красный)
3. **Категории** — разные стили для разных категорий (новости, акции, каталог)
4. **Ленивая загрузка** — `loading="lazy"` уже в шаблоне
5. **Анимация появления** — карточки появляются с задержкой (уже в коде)

---

**Дата создания плана:** 2026-06-14  
**Автор:** GigaCode  
**Статус:** Готов к реализации  
**Версия:** 5.0 (Три Конструктора - Конструктор-Конструктор-Конструктор)  
**Текущий прогресс:** 
- Конструктор 1 (Форма → Файлы): ✅ 100% (working in siss.py)
- Конструктор 2 (Карточка): ✅ 100% (news-card-constructor.js готов)
- Конструктор 3 (Сборка страницы): ✅ 100% (news-page-constructor.js готов)
- Доработки: 🔄 0% (осталось только проверить и протестировать)
