#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Скрипт для исправления стилей карточек товаров

css_file = 'static/css/news.css'

with open(css_file, 'r', encoding='utf-8') as f:
    content = f.read()

old_block = '''/* Краткое описание — одна строка, многоточие */
.catalog-card-description {
    font-size: 12px;
    color: #888;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 2px;
}'''

new_block = '''/* Краткое описание — 1-2 строки, многоточие если не влезает */
.catalog-card-description {
    font-size: 12px;
    color: #666;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 4px;
}'''

if old_block in content:
    content = content.replace(old_block, new_block)
    with open(css_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK - стили обновлены')
else:
    print('ERROR - старый блок не найден')
    # Попробуем найти по частям
    if '.catalog-card-description' in content:
        print('Найден .catalog-card-description')
    else:
        print('Не найден .catalog-card-description')
