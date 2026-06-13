# План исправления шапки сайта

## Цель
Сделать шапку на всю ширину экрана с скруглениями только снизу (для монолитности визуального восприятия).

## Страницы для правки
1. `news.html` (шапка + панель "Хроники измерений")
2. `index.html` (одиночная шапка)
3. Другие страницы с аналогичной структурой

## Изменения в CSS (style.css)

### 1. `.header-group` (для news.html)
**Текущее:**
```css
.header-group {
    width: 100%;
    position: relative;
    z-index: 101;
}
```

**Новое:**
```css
.header-group {
    width: 100%;
    position: relative;
    z-index: 101;
    margin: 0;
    max-width: none;
    border-radius: 0 0 1rem 1rem; /* только нижние углы */
}
```

### 2. `.news-header-panel` (для news.html)
**Текущее:**
```css
.news-header-panel {
    background: rgba(255, 255, 255, 0.98);
    padding: 1.25rem;
    width: 100%;
    max-width: none;
    margin: 0;
    border-radius: 0 0 1rem 1rem; /* ← убрать */
    ...
}
```

**Новое:**
```css
.news-header-panel {
    background: rgba(255, 255, 255, 0.98);
    padding: 1.25rem;
    width: 100%;
    max-width: none;
    margin: 0;
    border-radius: 0; /* убрать скругления */
    overflow: hidden;
    ...
}
```

### 3. `.site-header` (для index.html и других)
**Текущее:**
```css
.site-header {
    display: flex;
    ...
    max-width: 100%;
    margin: 0 auto;
    ...
}
```

**Новое:**
```css
.site-header {
    display: flex;
    ...
    max-width: none;
    margin: 0;
    border-radius: 0 0 1rem 1rem; /* только нижние углы */
    ...
}
```

## Визуальный эффект
- При скролле вниз `.news-header-panel` скрывается под навигацией
- Видны только нижние скругления у `.header-group`
- Это создаёт ощущение "шапка закончилась, под ней что-то спрятано"
- При скролле вверх панель выезжает плавно, не создавая "скачка" скругления
