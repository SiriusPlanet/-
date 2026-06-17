# SIS.SITE — Project Documentation

> **S**imple **I**ntegrated **S**ystem — сувенирный магазин "Магазин воспоминаний"
> Сервер: [`siss.py`](siss.py) (Pure Python, http.server, no frameworks)

---

## ⚡ Важно: работа с сервером

При запуске/перезапуске [`siss.py`](siss.py) могут оставаться **висящие процессы** в терминале.
Если сервер не отвечает или команда не выполняется — проверь активные терминалы и заверши старые процессы.

**Признаки проблемы:**
- Сервер не стартует (порт занят)
- Команда висит без вывода
- Изменения в коде не применяются (старый процесс обслуживает запросы)

**Решение:** завершить старый процесс (`Ctrl+C` или закрыть терминал) и запустить заново.

---

## 🗂️ Структура проекта

```
MySite/
├── siss.py              # HTTP-сервер (единственный бэкенд)
├── index.html            # Главная — Топ 3 товаров
├── about.html            # О нас — юмор, принципы, факты
├── catalog.html          # Каталог товаров (динамика через JS)
├── actions.html          # Акции (товары со скидкой)
├── news.html             # Новости (динамика через JS)
├── contacts.html         # Контакты — ❌ ПУСТО (нет контента)
├── delivery.html         # Доставка и оплата
├── login.html            # Вход / уровни доступа
├── privacy.html          # Политика конфиденциальности
├── requisites.html       # ❌ НЕ СОЗДАН (ссылка есть в меню)
│
├── static/
│   ├── css/
│   │   ├── style.css              # Основные стили (804 строки)
│   │   ├── style02.css            # Альтернативный набор (637 строк)
│   │   ├── news.css               # Стили карточек/новостей (358 строк)
│   │   ├── news-form.css          # Стили модального окна (250 строк)
│   │   ├── about_page_styles.css  # Стили страницы "О нас" (244 строки)
│   │   └── #privacy.css           # Стили для privacy (черновик?)
│   │
│   └── js/
│       ├── main.js                # Точка входа: Publisher + форма (255 строк)
│       ├── publisher.js           # Загрузка/фильтрация лотов (274 строки)
│       ├── card-constructor.js    # Сборка HTML-карточки (190 строк)
│       ├── access-init.js         # Инициализация PermissionManager
│       ├── permission-manager.js  # Система доступа (154 строки)
│       ├── access-levels.js       # Уровни 0-3 (120 строк)
│       ├── validator.js           # Валидация форм
│       ├── logger.js              # Цветной логгер в консоль
│       └── #validator.js          # Черновик?
│
├── templates/
│   ├── news-card.html             # Шаблон карточки новости (старый)
│   └── card-constructor/
│       └── card-template.html     # Шаблон с {{placeholders}}
│
├── data/news/                     # JSON-файлы лотов (новости/товары)
├── images/                        # Изображения товаров
│   └── img_n/                     # Изображения новостей
│
└── plans/
    └── constructor-fix-plan.md    # План по фиксу конструктора
```

---

## 🔧 Сервер ([`siss.py`](siss.py))

- **Порт:** 8000
- **API endpoints:**
  - `GET /get-news` — список всех лотов
  - `POST /save-news` — создание лота (multipart)
  - `POST /api/login` — авторизация
  - `GET /api/check-access` — проверка доступа
  - `POST /api/delete-news` — удаление лота
  - `POST /api/update-news` — обновление лота (скидка и т.д.)
  - `GET /news/<id>` — просмотр одной новости

---

## 📄 Страницы и скрипты

**`main.js` подключён на ВСЕХ страницах.**
**`access-init.js` подключён на ВСЕХ страницах** (кроме [`actions.html`](actions.html) — там `access-init.js` есть, а `main.js` подключён дважды: в `<head>` строка 14 и перед `</body>` строка 114).

Логика [`main.js`](static/js/main.js:41) (`detectPage`):
- Находит контейнер по классу и определяет тип страницы
- Если страница не `news`/`catalog`/`actions` → `currentPage = null` → Publisher не запускается
- На страницах без лотов (`about`, `contacts`, `delivery`, `login`, `privacy`) `main.js` просто завершается без ошибок

| Страница | `access-init` | `main.js` | Publisher | Контент |
|----------|:---:|:---:|:---:|---------|
| [`index.html`](index.html) | ✅ | ✅ | ❌ (нет контейнера) | Топ-3 товара (хардкод) + бегущая строка |
| [`about.html`](about.html) | ✅ | ✅ | ❌ | Юр. уведомление, ответственность, факты, принципы |
| [`catalog.html`](catalog.html) | ✅ | ✅ | ✅ → `catalog` | Динамическая сетка товаров |
| [`actions.html`](actions.html) | ✅ | ✅ **×2** | ✅ → `actions` | Динамическая сетка акций |
| [`news.html`](news.html) | ✅ | ✅ | ✅ → `news` | Динамическая сетка новостей |
| [`contacts.html`](contacts.html) | ✅ | ✅ | ❌ | **❌ ПУСТО** |
| [`delivery.html`](delivery.html) | ✅ | ✅ | ❌ | Доставка, оплата, возврат, гарантии |
| [`login.html`](login.html) | ✅ | ✅ | ❌ | Форма входа + уровни доступа |
| [`privacy.html`](privacy.html) | ✅ | ✅ | ❌ | Политика конфиденциальности |
| [`requisites.html`](requisites.html) | — | — | — | **❌ НЕ СОЗДАН** |

---

## 🧠 Архитектура JS

```
access-init.js (все страницы)
  └─ PermissionManager
       └─ AccessLevels (localStorage, уровни 0-3)

main.js (все страницы, но активен только на news/catalog/actions)
  ├─ detectPage() → определяет страницу по URL
  ├─ initPublisher() → Publisher.publish(page, container)
  │    ├─ loadLots() → GET /get-news
  │    ├─ filterLots(page) → news / catalog / actions
  │    └─ CardConstructor.createCard(item, options)
  │         ├─ карточка с изображением, ценой, скидкой
  │         ├─ кнопки Del / % / В корзину
  │         └─ модалка просмотра (viewNewsModal)
  ├─ setupFormHandler() → обработка формы добавления
  ├─ setupAddButton() → открытие модалки
  └─ setupScrollHandler() → lazy load / scroll
```

**Правила фильтрации** ([`publisher.js`](static/js/publisher.js:79)):
- `lotType === 'news'` → `news.html`
- `lotType === 'product' && !discount` → `catalog.html`
- `discount > 0` (любой тип) → `actions.html`

---

## 🔒 Система доступа (завеса)

### Текущее состояние: ВРЕМЕННО ОТКЛЮЧЕНА

Во всех HTML-файлах inline-стили:
```css
#access-overlay { display: none !important; }
.access-button { display: none !important; }
```

В [`style.css`](static/css/style.css:22) то же самое.
В [`style02.css`](static/css/style02.css:36) завеса описана как видимая (с градиентом), но перебивается `!important`.

### Как работает `init()` сейчас ([`permission-manager.js`](static/js/permission-manager.js:140))

```js
async init() {
    this.initElements();          // находит DOM-элементы
    // СРАЗУ прячет завесу без проверок:
    this.hideOverlay();
    document.body.classList.add('access-granted');
    this.hasLocalhostAccess = true;
    this.grantPermission();       // дублирует hideOverlay()
}
```

Проверка доступа **вообще не выполняется** — сразу `hideOverlay()`.

### Проблема: когда систему включат

Если убрать `display: none !important`, последовательность будет:

```
1. HTML парсится → завеса в DOM, видна (стили style02.css)
2. access-init.js → PermissionManager.init()
3.   initElements() → находит завесу
4.   checkLocalhostAccess() → fetch /api/check-access (ждёт до 2с!)
5.   если доступ есть → grantPermission() → hideOverlay()
```

**Завеса моргает пользователю** на время проверки (до 2 секунд) — сначала рисуется, потом убирается.

### Как должно быть (проверка → потом показ)

```
1. Завеса в DOM, но НЕВИДИМА (display:none в CSS по умолчанию)
2. JS проверяет доступ (мгновенно из localStorage или fetch)
3. Если доступа нет → показать завесу + кнопку
4. Если доступ есть → ничего не делать, завеса остаётся скрытой
```

### Что нужно исправить

1. **CSS:** убрать видимые стили завесы из [`style02.css`](static/css/style02.css:36). Завеса должна быть `display: none` по умолчанию
2. **`init()`:** переписать — сначала быстрая проверка (localStorage), потом если нет доступа — показать завесу
3. **Убрать `!important`** из inline-стилей в HTML, когда система будет включена

---

## ⚠️ TODO / Недоделки

### 🔴 Критические
- [ ] **Создать [`requisites.html`](requisites.html)** — ссылка есть во всех меню, файла нет → 404
- [ ] **Наполнить [`contacts.html`](contacts.html)** — `<main>` пустой, только комментарий "Здесь будет контент"
- [ ] **Переписать логику завесы** ([`permission-manager.js`](static/js/permission-manager.js:140)) — сначала проверка, потом показ. Сейчас: сначала рисует, потом убирает

### 🟡 Контент < 100 слов
- [ ] [`index.html`](index.html) — контента ~50 слов (только hero + 3 товара). Нет описания магазина, нет призыва к действию
- [ ] [`contacts.html`](contacts.html) — 0 слов контента (пустая страница)
- [ ] [`login.html`](login.html) — только форма входа, нет обработчика (кнопка "Войти" не отправляет ничего на сервер — `POST /api/login` есть, но JS-обработчик не подключён)

### 🟡 Функциональные
- [ ] **Система доступа** — временно отключена (`display: none !important` во всех HTML). Кнопки Del/% видны всем
- [ ] **Кнопка "В корзину"** — визуально есть, но корзины как функционала нет
- [ ] **Бегущая строка** на [`index.html`](index.html:61) — загружается через `#news-ticker`, но сам механизм не реализован
- [ ] **Форма логина** — нет JS-обработчика `loginForm.onsubmit`, нет связи с `POST /api/login`
- [ ] **`main.js` подключён дважды** на [`actions.html`](actions.html) (строка 14 и 114) — лишняя загрузка

### 🟢 Косметические
- [ ] Два CSS-файла: [`style.css`](static/css/style.css) и [`style02.css`](static/css/style02.css) — дублирование базовых стилей
- [ ] Файлы [`#privacy.css`](static/css/#privacy.css) и [`#validator.js`](static/js/#validator.js) с `#` в имени — вероятно, черновики
- [ ] Вкладки в меню "Клиентам" → [`login.html`](login.html) — неочевидно для пользователя
- [ ] Футер: в [`privacy.html`](privacy.html:114) копирайт `2+2+2=3`, в остальных `3+3+3+3+3+3=7` — несогласованность