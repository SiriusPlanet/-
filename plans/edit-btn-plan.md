# План: Кнопка редактирования "re:" на карточках

## 1. Что нужно сделать

Добавить на каждую карточку (рядом с Del, в левом нижнем углу фото) кнопку **"re:"** для редактирования лота.

### Визуал
- Кнопка меньше Del на треть: Del = 44×44px → **re: ≈ 29×29px** (можно 30×30)
- Крепится к низу `.catalog-card-inner`, как и Del
- Слева от Del (или справа — нужно уточнить)
- Текст "re:" внутри
- Цвет: нейтральный, например тёмно-серая `#555` с белой обводкой, чтобы не перетягивать внимание

### Функционал
- Открывает ту же модалку `#addNewsModal`
- Поля предзаполняются данными из JSON-файла карточки (через `fetch` к `/get-news?id=...` или из уже загруженных данных)
- Можно изменить любое поле, включая изображение
- Сохраняется через `POST /api/update-news` (уже существует на сервере)
- Если не выбран новый файл изображения — старое остаётся
- После сохранения — перепубликация страницы

### Смена типа лота (Новость ↔ Товар)
- Если пользователь переключил таб (например, открыл товар как новость) — на неактивном табе появляется **значок-предупреждение** (например, ⚠️)
- При наведении на этот значок — **тултип**: "Изначальный тип: товар" или "Изначальный тип: новость"
- При сохранении с несовпадающим типом — **предупреждение**: "Вы меняете тип лота с «новость» на «товар». Продолжить?"
- После подтверждения — лот сохраняется с новым типом

---

## 2. Архитектура изменений

### 2.1. `static/js/card-constructor.js`

**Добавить** в `createCard()`:
- HTML кнопки `re:` в блок `.catalog-card-inner` (рядом с Del)
- Новый callback `onEdit` в опциях
- Обработчик click на кнопку `re:`, вызывающий `onEdit(item)`

```js
// В createCard(), после delBtnHtml:
const editBtnHtml = `<button class="ctrl-btn edit-btn" data-id="${item.id}" title="Редактировать">re:</button>`;

// В card.innerHTML, после delBtnHtml:
${editBtnHtml}

// Обработчик:
const editBtn = card.querySelector('.edit-btn');
if (editBtn && onEdit) {
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onEdit(item);
    });
}
```

### 2.2. `static/js/publisher.js`

**Добавить** в `publish()`:
- Новый callback `onEdit` в опции `createCard()`
- Метод `editLot(item, container, page)` — открывает модалку с предзаполненными данными

```js
// В publish(), в вызове createCard:
onEdit: (item) => this.editLot(item, container, page)

// Новый метод:
editLot(item, container, page) {
    // Найти модалку
    const modal = document.getElementById('addNewsModal');
    if (!modal) return;
    
    // Заполнить поля
    document.getElementById('title').value = item.title || '';
    document.getElementById('date').value = item.date || '';
    document.getElementById('preview').value = item.preview || '';
    document.getElementById('content').value = item.content || '';
    document.getElementById('price').value = item.price || '';
    
    // Установить активный таб
    const lotType = item.lotType || 'news';
    document.querySelectorAll('.form-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.lottype === lotType);
    });
    
    // Показать/скрыть поля цены/даты
    const isProduct = lotType === 'product';
    const priceGroup = document.getElementById('priceGroup');
    if (priceGroup) priceGroup.classList.toggle('hidden', !isProduct);
    const dateGroup = document.getElementById('dateGroup');
    if (dateGroup) dateGroup.classList.toggle('hidden', isProduct);
    
    // Сохранить ID редактируемого лота в data-атрибут формы
    const form = document.getElementById('newsForm');
    form.dataset.editId = item.id;
    form.dataset.originalLotType = item.lotType || 'news';
    
    // Показать модалку
    modal.classList.remove('hidden');
    modal.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
    
    // Обновить текст кнопки сабмита
    const submitBtn = modal.querySelector('.btn-submit');
    if (submitBtn) submitBtn.textContent = 'Обновить';
}
```

### 2.3. `static/js/main.js`

**Изменить** `handleSubmit()`:
- Проверить `form.dataset.editId` — если есть, то отправлять на `/api/update-news` вместо `/save-news`
- При смене типа — показать предупреждение
- После сохранения — очистить `form.dataset.editId` и вернуть текст кнопки

```js
async handleSubmit(form) {
    const editId = form.dataset.editId;
    const originalLotType = form.dataset.originalLotType;
    const newLotType = this.getActiveLotType();
    
    // Предупреждение при смене типа
    if (editId && originalLotType && originalLotType !== newLotType) {
        const typeNames = { news: 'новость', product: 'товар' };
        if (!confirm(`Вы меняете тип лота с «${typeNames[originalLotType] || originalLotType}» на «${typeNames[newLotType] || newLotType}». Продолжить?`)) {
            return;
        }
    }
    
    // ... сбор данных ...
    
    if (editId) {
        // Режим редактирования
        formData.append('id', editId);
        const res = await fetch('/api/update-news', {
            method: 'POST',
            body: formData  // нужно убедиться, что сервер умеет принимать multipart
        });
        // ... обработка ...
        delete form.dataset.editId;
        delete form.dataset.originalLotType;
        submitBtn.textContent = 'Имплантировать'; // или 'Сохранить'
    } else {
        // Режим создания
        const res = await fetch('/save-news', { method: 'POST', body: formData });
        // ...
    }
}
```

### 2.4. Серверная часть (`siss.py`)

**Доработать** `handle_api_update_news()`:
- Сейчас принимает только JSON (`application/json`)
- Нужно добавить поддержку `multipart/form-data` (для загрузки нового изображения)
- Либо сделать отдельный эндпоинт `/api/update-news-form` для multipart

**Рекомендация**: Сделать поддержку multipart в `handle_api_update_news()` — распарсить так же, как в `/save-news`, но с полем `id`.

### 2.5. `static/css/news.css`

**Добавить** стили для `.edit-btn`:
```css
/* Кнопка re: — рядом с Del */
.catalog-card .edit-btn {
    left: 56px;  /* 8px (отступ) + 44px (Del) + 4px (gap) */
    bottom: 8px;
    top: auto;
    width: 30px;
    height: 30px;
    background: #555;
    border-color: #aaa;
    font-size: 10px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
}

.catalog-card .edit-btn:hover {
    background: #777;
    border-color: #ccc;
    transform: scale(1.15);
}
```

### 2.6. Индикатор смены типа на табах

В `main.js`, в `setupFormTabs()`:
- При открытии модалки в режиме редактирования — добавить класс `has-warning` на таб с исходным типом
- CSS: `.form-tab.has-warning::after { content: ' ⚠️'; }`
- Тултип через `title` атрибут: `tab.title = 'Изначальный тип: товар'`

---

## 3. Файлы для изменений

| Файл | Изменения |
|------|-----------|
| `static/js/card-constructor.js` | Добавить HTML кнопки `re:`, callback `onEdit`, обработчик |
| `static/js/publisher.js` | Добавить метод `editLot()`, передать `onEdit` в `createCard()` |
| `static/js/main.js` | Изменить `handleSubmit()` — поддержка режима редактирования, предупреждение о смене типа, индикатор на табах |
| `static/css/news.css` | Стили для `.edit-btn`, стили для `.form-tab.has-warning` |
| `siss.py` | Доработать `handle_api_update_news()` — поддержка multipart/form-data |

---

## 4. Порядок выполнения

1. **card-constructor.js** — добавить кнопку `re:` и callback
2. **publisher.js** — добавить метод `editLot()`
3. **main.js** — изменить `handleSubmit()` для режима редактирования + предупреждение о смене типа + индикатор
4. **news.css** — стили для `.edit-btn` и `.form-tab.has-warning`
5. **siss.py** — доработать `handle_api_update_news()` для multipart
6. Проверить на всех трёх страницах

---

## 5. Схема потока редактирования

```mermaid
sequenceDiagram
    participant User
    participant Card as Карточка
    participant Publisher
    participant Modal as Модалка
    participant Server

    User->>Card: Клик re:
    Card->>Publisher: onEdit(item)
    Publisher->>Modal: Заполнить поля данными item
    Publisher->>Modal: Установить form.dataset.editId = item.id
    Publisher->>Modal: Установить form.dataset.originalLotType
    Publisher->>Modal: Показать модалку
    User->>Modal: Изменить поля
    User->>Modal: Нажать "Обновить"
    Modal->>main.js: handleSubmit()
    main.js->>main.js: Проверить смену типа
    alt Тип изменён
        main.js->>User: confirm("Сменить тип?")
        User->>main.js: OK
    end
    main.js->>Server: POST /api/update-news (multipart)
    Server->>Server: Обновить JSON-файл
    Server->>main.js: { success: true }
    main.js->>Publisher: publish(page, container)
    Publisher->>Card: Перерисовать карточки