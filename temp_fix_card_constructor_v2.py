#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Убираем _openDiscountModal из card-constructor.js и вызываем onDiscount напрямую

with open('static/js/card-constructor.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Убираем вызов _openDiscountModal и сразу вызываем onDiscount
old_code = '''        const dscBtn = card.querySelector('.discount-btn');
        if (dscBtn && onDiscount) {
            dscBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // P2-7: передаём itemId для установки скидки
                this._openDiscountModal(item, dscBtn, card, onDiscount);
            });
        }'''

new_code = '''        const dscBtn = card.querySelector('.discount-btn');
        if (dscBtn && onDiscount) {
            dscBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Вызываем onDiscount для открытия панели скидки (в publisher.js)
                onDiscount(item.id, btn, card);
            });
        }'''

content = content.replace(old_code, new_code)

# Удаляем метод _openDiscountModal
start = content.find('    /**\n     * P2-7: Открывает модалку установки скидки (только процент)\n     */')
if start != -1:
    end = content.find('\n    /**\n     * P0-2: Перемещает товар в таблицу снятых', start)
    if end != -1:
        content = content[:start] + content[end:]

with open('static/js/card-constructor.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('_openDiscountModal удалён из card-constructor.js')
