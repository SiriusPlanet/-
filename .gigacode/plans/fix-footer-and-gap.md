# План исправления футера и зазоров

## Проблемы
1. Футер пропал (остались только буквы) - отсутствуют стили для `.site-footer`
2. Зазоры от края у футера и хедера - есть `padding: 0 2vw` у body

## Решения

### 1. Исправить стили body (строка ~13)
**Заменить:**
```css
body {
    ...
    min-height: 100vh;
    padding: 0 2vw;
}
```

**На:**
```css
body {
    ...
    min-height: 100vh;
    margin: 0;
    padding: 0;
}
```

### 2. Добавить стили для футера (в конец CSS файла)
```css
/* === ФУТЕР === */
.site-footer {
    background: rgba(255, 255, 255, 0.98);
    padding: 1.5rem 2rem;
    text-align: center;
    border-radius: 1rem 1rem 0 0;
    box-shadow: 0 -0.25rem 0.9375rem rgba(0, 0, 0, 0.12);
    margin: 2.5rem auto 0;
    max-width: 96%;
}

.site-footer p {
    color: #2c3e50;
    font-size: 0.9rem;
    margin-bottom: 1rem;
}

.site-footer ul {
    list-style: none;
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.site-footer ul li a {
    color: #8e44ad;
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.2s;
}

.site-footer ul li a:hover {
    color: #e74c3c;
}
```

### 3. Добавить адаптивные стили для футера в media query (наличие проверить)
Добавить в существующий media query для 768px:
```css
.site-footer {
    padding: 1rem;
    margin: 1rem auto 0;
    max-width: 98%;
}
```
