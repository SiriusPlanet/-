# Единый план доработок

## Что уже сделано (из предыдущего плана)

- ✅ Создан [`static/js/card-constructor.js`](static/js/card-constructor.js) — единый конструктор карточек
- ✅ Создан [`static/js/publisher.js`](static/js/publisher.js) — единый публикатор
- ✅ Упрощён [`static/js/main.js`](static/js/main.js) — чистая точка входа
- ✅ Удалены мёртвые JS-файлы: `news-manager.js`, `news-form.js`, `news-page-constructor.js`, `news-card-constructor.js`, `news-template-engine.js`, `catalog.js`, `catalog-page-constructor.js`, `actions-page-constructor.js`
- ✅ `news.html`, `catalog.html`, `actions.html` — скрипты подключены через `main.js`

---

## Что НЕ доделано

### 1. Мёртвые CSS-ссылки в HTML
В [`news.html`](news.html:13) и [`catalog.html`](catalog.html:13) всё ещё подключён `news-form.css`:
```html
<link rel="stylesheet" href="./static/css/news-form.css" />
```
Файл существует, но форма теперь встроена в HTML, отдельный CSS для формы не нужен. Нужно убрать.

### 2. Кнопка Del — перенос в левый нижний угол
План: [`plans/del-btn-discount-badge-plan.md`](plans/del-btn-discount-badge-plan.md)
- [`static/css/news.css`](static/css/news.css:309) — `.del-btn`: `top` → `bottom`, увеличить размер, усилить контраст

### 3. Бейдж скидки — круг с радиальным градиентом
План: [`plans/del-btn-discount-badge-plan.md`](plans/del-btn-discount-badge-plan.md)
- [`static/js/card-constructor.js`](static/js/card-constructor.js:63) — новый HTML бейджа
- [`static/css/news.css`](static/css/news.css:239) — полная замена стилей `.discount-badge`

### 4. Система доступа (завеса)
- [`static/js/permission-manager.js`](static/js/permission-manager.js:140) — `init()` не делает проверку, сразу прячет завесу
- Нужно переписать: сначала проверка (localStorage), потом показ завесы если нет доступа
- [`static/css/style02.css`](static/css/style02.css:36) — завеса описана как видимая, но перебита `!important`

### 5. `main.js` подключён дважды на actions.html
- [`actions.html`](actions.html:14) — в `<head>`, и [`actions.html`](actions.html:114) — перед `</body>`
- Нужно убрать дубль

---

## Порядок выполнения

1. **Бейдж скидки** — [`card-constructor.js`](static/js/card-constructor.js) + [`news.css`](static/css/news.css)
2. **Кнопка Del** — [`news.css`](static/css/news.css)
3. **Убрать `news-form.css`** из [`news.html`](news.html) и [`catalog.html`](catalog.html)
4. **Убрать дубль `main.js`** из [`actions.html`](actions.html)
5. **Система доступа** — [`permission-manager.js`](static/js/permission-manager.js) + [`style02.css`](static/css/style02.css)

---

## Файлы для изменений

| Файл | Что менять |
|------|-----------|
| [`static/js/card-constructor.js`](static/js/card-constructor.js) | Строки 63-66 — HTML бейджа скидки |
| [`static/css/news.css`](static/css/news.css) | Строки 239-278 — бейдж скидки (круг+градиент) |
| [`static/css/news.css`](static/css/news.css) | Строки 309-320 — кнопка Del (позиция+размер) |
| [`news.html`](news.html) | Строка 13 — убрать `news-form.css` |
| [`catalog.html`](catalog.html) | Строка 13 — убрать `news-form.css` |
| [`actions.html`](actions.html) | Строка 14 или 114 — убрать дубль `main.js` |
| [`static/js/permission-manager.js`](static/js/permission-manager.js) | Переписать `init()` — проверка доступа до показа завесы |
| [`static/css/style02.css`](static/css/style02.css) | Строки 35-51 — завеса должна быть `display:none` по умолчанию |