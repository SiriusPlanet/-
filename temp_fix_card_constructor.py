#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Исправляем card-constructor.js для вызова onDiscount(itemId, btn, card)

with open('static/js/card-constructor.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Меняем вызов onDiscount(item, btn, card) на onDiscount(item.id, btn, card)
old_callback = '''        // Вызываем колбэк
        if (onDiscount) {
            onDiscount(item, btn, card);
        }'''

new_callback = '''        // Вызываем колбэк
        if (onDiscount) {
            onDiscount(item.id, btn, card);
        }'''

content = content.replace(old_callback, new_callback)

# Меняем комментарий
old_comment = '''                // P2-7: передаём item целиком для поля причины скидки'''
new_comment = '''                // P2-7: передаём itemId для установки скидки'''

content = content.replace(old_comment, new_comment)

with open('static/js/card-constructor.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('card-constructor.js обновлен: onDiscount теперь вызывается с itemId')
