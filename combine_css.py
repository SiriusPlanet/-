#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для объединения всех CSS файлов в один.
"""

import os
import re

def combine_css():
    """Объединить все CSS файлы в один."""
    
    base_path = r'f:\I0\002MySiS\MySite\static\css_backup'
    output_path = r'f:\I0\002MySiS\MySite\static\css\style.css'
    
    # Список файлов для объединения (в порядке приоритета)
    files = [
        ('style.css', 'Основные стили'),
        ('news.css', 'Стили для новостей и каталога'),
        ('about_page_styles.css', 'Стили для страницы о нас'),
        ('#privacy.css', 'Стили для политики конфиденциальности'),
    ]
    
    combined_content = []
    
    for filename, description in files:
        filepath = os.path.join(base_path, filename)
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Добавить заголовок
            combined_content.append('\n/* === ' + description + ' === */\n')
            combined_content.append(content)
            
            print('[OK] Добавлен: ' + filename + ' (' + str(len(content)) + ' символов)')
        else:
            print('[WARN] Файл не найден: ' + filename)
    
    # Объединить всё в один файл
    full_content = ''.join(combined_content)
    
    # Записать в файл
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(full_content)
    
    print('\n[OK] Объединено файлов: ' + str(len(files)))
    print('[OK] Общий размер: ' + str(len(full_content)) + ' символов')
    print('[OK] Выходной файл: ' + output_path)
    
    # Проверить дублирующиеся селекторы
    print('\n--- Проверка на дублирующиеся селекторы ---')
    
    # Выделить все селекторы
    selectors = re.findall(r'^([^{]+)\{', full_content, re.MULTILINE)
    unique_selectors = set()
    duplicates = set()
    
    for selector in selectors:
        selector = selector.strip()
        if selector and not selector.startswith('@'):
            if selector in unique_selectors:
                duplicates.add(selector)
            else:
                unique_selectors.add(selector)
    
    if duplicates:
        print('Найдены дублирующиеся селекторы:')
        for sel in sorted(duplicates):
            print('  - ' + sel)
    else:
        print('Дублирующиеся селекторы не найдены')

if __name__ == '__main__':
    combine_css()
