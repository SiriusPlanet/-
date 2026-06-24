// Скрипт для исправления publisher.js
// 1. Удалить синтаксический мусор (JSON-объект внутри JavaScript-кода)
// 2. Изменить фильтр для 'actions' (убрать проверку lotType === 'product')
// 3. Изменить saveDiscountFromCard (добавить prompt для ввода новой скидки)
// 4. Изменить эндпоинт в saveDiscount (/api/update-news → /api/news)

const fs = require('fs');

const filePath = 'static/js/publisher.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Удалить синтаксический мусор (JSON-объект внутри JavaScript-кода)
// Найти и удалить строку с JSON-объектом и закрывающую скобку
const brokenCode = `{"text": "                // Перепубликуем текущую страницу, чтобы акции обновились\\r\\n                await this.publish(page, container);\\r\\n\\r\\n                // Если скидка установлена (discount > 0) и мы НЕ на странице акций,\\r\\n                // нужно также обновить страницу акций, чтобы новый акционный товар там появился\\r\\n                if (discount > 0 && page !== \\\"actions\\\") {\\r\\n                    const currentPath = window.location.pathname;\\r\\n                    // Если на catalog.html, обновляем и actions.html\\r\\n                    if (currentPath.includes(\\\"catalog.html\\\")) {\\r\\n                        // Загружаем страницу actions.html и обновляем её контейнер\\r\\n                        try {\\r\\n                            const response = await fetch('/actions.html');\\r\\n                            if (response.ok) {\\r                                const html = await response.text();\\r                                const parser = new DOMParser();\\r                                const doc = parser.parseFromString(html, 'text/html');\\r                                const actionsContainer = doc.querySelector('.products-grid');\\r                                if (actionsContainer) {\\r                                    // Загружаем лоты и публикуем на actions\\r\\n                                    await this.publish('actions', actionsContainer, { cardClass: 'card-large' });\\r                                    // Обновляем DOM на текущей странице (catalog.html)\\r                                    const targetContainer = document.querySelector('.products-grid');\\r                                    if (targetContainer && targetContainer !== actionsContainer) {\\r                                        targetContainer.innerHTML = actionsContainer.innerHTML;\\r                                    }\\r                                }\\r                            }\\r                        } catch (e) {\\r                            console.error('[Publisher] Ошибка обновления акций:', e);\\r                        }\\r                    }\\r                }"}`;

// Удаляем синтаксический мусор (JSON-объект и комментарии)
content = content.replace(brokenCode, '');

// 2. Изменить фильтр для 'actions' (убрать проверку lotType === 'product')
content = content.replace(
    /case 'actions':\s*\/\/ В акции попадают только ТОВАРЫ со скидкой\s*return this\.allLots\.filter\(n =>\s*n\.lotType === 'product' && n\.discount && parseInt\(n\.discount\) > 0\s*\);/,
    `case 'actions':
                // В акции попадают все лоты со скидкой (любой lotType)
                return this.allLots.filter(n =>
                    n.discount && parseInt(n.discount) > 0
                );`
);

// 3. Изменить saveDiscountFromCard (добавить prompt для ввода новой скидки)
content = content.replace(
    /async saveDiscountFromCard\(item, btn, card, container, page\) \{\s*const discount = parseInt\(item\.discount\) \|\| 0;\s*await this\.saveDiscount\(item\.id, discount, btn, null, container, page\);\s*\}/,
    `async saveDiscountFromCard(item, btn, card, container, page) {
        const currentDiscount = parseInt(item.discount) || 0;
        const newDiscount = prompt('Введите скидку (%) для товара "' + item.title + '":', currentDiscount);
        
        if (newDiscount === null) return; // Отмена
        
        let discount = parseInt(newDiscount);
        if (isNaN(discount) || discount < 0 || discount > 100) {
            alert('Некорректная скидка. Введите значение от 0 до 100.');
            return;
        }
        
        await this.saveDiscount(item.id, discount, btn, null, container, page);
    }`
);

// 4. Изменить эндпоинт в saveDiscount (/api/update-news → /api/news)
content = content.replace(
    /const res = await fetch\('\/api\/update-news', \{/,
    `const res = await fetch('/api/news', {`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ Файл publisher.js исправлен!');
