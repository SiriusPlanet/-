# План: Кнопка Del и бейдж скидки

## 1. Кнопка Del — перенос в левый нижний угол фото

**Где менять:**
- [`static/css/news.css`](static/css/news.css:309) — `.catalog-card .del-btn`

**Что меняем:**
- `top: 8px` → `bottom: 8px`
- `left: 8px` — оставляем
- Увеличиваем размер: `width: 44px`, `height: 44px`
- Усиливаем контраст: фон `#cc0000` → `#e60000`, border `#ff6666` → `#ff9999`, добавляем `box-shadow` ярче
- Шрифт: `font-size: 14px` → `16px`

**Итоговый CSS:**
```css
.catalog-card .del-btn {
    left: 8px;
    bottom: 8px;           /* было top: 8px */
    top: auto;             /* сброс */
    width: 44px;           /* было 40px */
    height: 44px;          /* было 40px */
    background: #e60000;   /* было #cc0000 */
    border-color: #ff8888; /* было #ff6666 */
    font-size: 16px;       /* было 14px */
    box-shadow: 0 3px 12px rgba(230, 0, 0, 0.6); /* добавить */
}
```

---

## 2. Бейдж скидки — круг с радиальным градиентом

**Где менять:**
- [`static/js/card-constructor.js`](static/js/card-constructor.js:63) — HTML бейджа
- [`static/css/news.css`](static/css/news.css:239) — стили `.discount-badge`

**Концепция:**
- Круг, центр в левом верхнем углу карточки (фото)
- Радиальный градиент: центр яркий (непрозрачный) → к краям прозрачность нарастает
- В центре круга — цифра процента
- Чистый CSS, без изображений

**HTML (card-constructor.js):**
```js
const badgeHtml = discount > 0
    ? `<div class="discount-badge">
         <span class="discount-badge-text">${discount}<small>%</small></span>
       </div>`
    : '';
```

**CSS (news.css):**
```css
.discount-badge {
    position: absolute;
    top: 0;
    left: 0;
    width: 120px;          /* размер круга */
    height: 120px;
    z-index: 5;
    pointer-events: none;
    overflow: hidden;
}

.discount-badge::before {
    content: '';
    position: absolute;
    top: -60px;            /* смещаем центр в левый верхний угол */
    left: -60px;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: radial-gradient(
        circle at center,
        rgba(255, 50, 50, 0.95) 0%,        /* центр — яркий, плотный */
        rgba(255, 80, 0, 0.85) 30%,
        rgba(255, 120, 0, 0.6) 50%,
        rgba(255, 150, 0, 0.3) 65%,
        rgba(255, 200, 0, 0.1) 80%,
        transparent 100%                     /* полная прозрачность к краю */
    );
    pointer-events: none;
}

.discount-badge-text {
    position: absolute;
    top: 12px;             /* отступ от левого верхнего угла */
    left: 12px;
    color: #fff;
    font-size: 22px;
    font-weight: 900;
    text-shadow: 0 2px 8px rgba(0,0,0,0.7);
    z-index: 6;
    line-height: 1;
}

.discount-badge-text small {
    font-size: 14px;
    font-weight: 700;
}
```

**Визуальный эффект:**
- Центр круга (левый верхний угол фото) — ярко-красный, цифра чётко видна
- К краям круга — плавный переход в оранжевый → жёлтый → прозрачность
- Последняя треть (от 65%) — резкое нарастание прозрачности
- Не перекрывает содержимое карточки, не требует отдельных картинок

---

## 3. Файлы для изменений

| Файл | Что менять |
|------|-----------|
| [`static/css/news.css`](static/css/news.css) | Строки 239-278 — полная замена `.discount-badge` |
| [`static/css/news.css`](static/css/news.css) | Строки 309-320 — правка `.del-btn` (позиция + размер) |
| [`static/js/card-constructor.js`](static/js/card-constructor.js) | Строки 63-66 — правка HTML бейджа |

---

## 4. Проверка

- [ ] Кнопка Del в левом нижнем углу фото, крупнее и контрастнее
- [ ] Бейдж скидки — круг, центр в левом верхнем углу
- [ ] Градиент: центр плотный → прозрачность к краям (особенно с 65%)
- [ ] Цифра процента видна, с `%` рядом
- [ ] Не перекрывает контент карточки (pointer-events: none)
- [ ] Работает на всех карточках (catalog, actions, news)