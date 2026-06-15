// Сценарий миграции HTML файлов

## HTML файлы которые уже имеют правильную структуру (access-init.js + main.js):
- ✅ index.html - уже подключает access-init.js
- ✅ news.html - уже подключает access-init.js  
- ✅ about.html - уже подключает access-init.js
- ✅ catalog.html - уже подключает access-init.js
- ✅ actions.html - уже подключает access-init.js

## HTML файлы которые НЕ имеют защиты (нужно добавить):
- ❌ contacts.html - НЕТ access-init.js
- ❌ privacy.html - НЕТ access-init.js  
- ❌ delivery.html - НЕТ access-init.js
- ❌ login.html - НЕТ access-init.js

## Что нужно добавить в недостающие HTML файлы:

### В <head> (после <title> и до </head>):
```html
<script type="module" src="static/js/access-init.js"></script>
<script type="module" src="static/js/main.js"></script>
```

### В <body> (сразу после <body>):
```html
<!-- Затемнение -->
<div id="access-overlay"></div>

<!-- Панель доступа -->
<div class="access-button">
    <button id="fileAccessButton">Получить доступ к файлам</button>
</div>
```

### В <style> (если нет, создать):
```css
/* --- Глобальное затемнение — пока доступ не дан --- */
body:not(.access-granted) {
    overflow: hidden;
}

#access-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(
        circle at 50% 50%,
        rgba(0, 40, 20, 0.94),
        rgba(0, 25, 15, 0.98)
    );
    z-index: 9998;
    pointer-events: auto;
    opacity: 1;
    transition: opacity 0.8s ease-out;
}

.access-granted #access-overlay {
    opacity: 0;
    pointer-events: none;
}

/* --- Кнопка — только если нет доступа --- */
.access-button {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 9999;
    text-align: center;
}

#fileAccessButton {
    padding: 16px 32px;
    font-size: 18px;
    font-weight: bold;
    color: #00ffaa;
    background: transparent;
    border: 2px solid #00ffaa;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 0 15px rgba(0, 255, 170, 0.4);
    transition: all 0.3s ease;
    min-width: 280px;
}

#fileAccessButton:hover {
    background: rgba(0, 255, 170, 0.1);
    box-shadow: 0 0 25px rgba(0, 255, 170, 0.6);
    transform: scale(1.05);
}

/* --- Блокировка контента до доступа --- */
body:not(.access-granted) header,
body:not(.access-granted) main,
body:not(.access-granted) footer {
    filter: blur(8px) brightness(0.2);
    pointer-events: none;
}
```

## Рекомендуемый порядок подключения скриптов:

```html
<head>
    <!-- 1. Система доступа (ВСЕГДА первая) -->
    <script type="module" src="static/js/access-init.js"></script>
    
    <!-- 2. Основные стили -->
    <link rel="stylesheet" href="static/css/style.css">
    
    <!-- 3. Основной скрипт -->
    <script type="module" src="static/js/main.js"></script>
    
    <!-- 4. Дополнительные скрипты (если есть) -->
    <script type="module" src="static/js/news-card-constructor.js"></script>
</head>
<body>
    <!-- Затемнение -->
    <div id="access-overlay"></div>
    
    <!-- Панель доступа -->
    <div class="access-button">
        <button id="fileAccessButton">Получить доступ к файлам</button>
    </div>
    
    <!-- Остальной контент -->
    ...
</body>
```

## Проверка:

После внесения изменений все страницы должны:
1. ✅ Загружаться без ошибок в консоли
2. ✅ Показывать завесу если доступа нет
3. ✅ Показывать контент если доступ дан
4. ✅ Работать корректно на всех страницах (новости, каталог, о нас и т.д.)
