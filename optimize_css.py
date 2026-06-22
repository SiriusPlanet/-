#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для оптимизации объединенного CSS файла.
Удаляет дублирующиеся селекторы, сохраняя только последнее определение.
"""

import re
import os


def parse_css_with_positions(css_content):
    """
    Разбирает CSS на селекторы и их позиции в файле.
    Возвращает список кортежей (selector, start_pos, end_pos).
    """
    pattern = r'([.#]?[\w\-\s,\n:>+~]+?)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}'
    matches = []
    
    for match in re.finditer(pattern, css_content, re.DOTALL):
        selector = match.group(1).strip()
        content = match.group(2)
        start_pos = match.start()
        end_pos = match.end()
        
        # Исключаем media queries и keyframes из обработки
        if selector.startswith('@media') or selector.startswith('@keyframes') or selector.startswith('@-webkit-keyframes'):
            continue
        
        matches.append((selector, start_pos, end_pos, content))
    
    return matches


def extract_base_selector(selector):
    """
    Извлекает базовый селектор из сложного селектора.
    Например, из '.news-grid:hover' вернет '.news-grid'
    """
    # Удаляем псевдоклассы и псевдоэлементы
    base = re.split(r':{1,2}', selector)[0].strip()
    # Удаляем комбинаторы
    base = re.split(r'[>+~]', base)[0].strip()
    return base


def deduplicate_css(css_content, keep_last=True):
    """
    Удаляет дублирующиеся селекторы из CSS.
    keep_last=True: оставляет последнее определение (по умолчанию)
    keep_last=False: оставляет первое определение
    """
    # Сначала разбираем CSS на селекторы
    selectors = parse_css_with_positions(css_content)
    
    # Группируем селекторы по базовому имени
    groups = {}
    for selector, start, end, content in selectors:
        base = extract_base_selector(selector)
        if base not in groups:
            groups[base] = []
        groups[base].append((selector, start, end, content))
    
    # Для каждой группы оставляем только одно определение
    to_keep = []
    for base, items in groups.items():
        if keep_last:
            # Оставляем последнее определение
            to_keep.append(items[-1])
        else:
            # Оставляем первое определение
            to_keep.append(items[0])
    
    # Сортируем по позиции в файле
    to_keep.sort(key=lambda x: x[1])
    
    # Собираем новый CSS
    result_parts = []
    last_end = 0
    
    for selector, start, end, content in to_keep:
        # Добавляем все между предыдущим и текущим селектором (комментарии и т.д.)
        result_parts.append(css_content[last_end:start])
        # Добавляем текущий селектор с форматированием
        result_parts.append(f'{selector} {{\n{content}\n}}\n')
        last_end = end
    
    # Добавляем остаток файла
    result_parts.append(css_content[last_end:])
    
    return ''.join(result_parts)


def main():
    input_file = 'static/css/style.css'
    output_file = 'static/css/style_optimized.css'
    backup_file = 'static/css_backup/style.css.bak'
    
    # Читаем исходный файл
    print(f'Чтение {input_file}...')
    with open(input_file, 'r', encoding='utf-8') as f:
        css_content = f.read()
    
    # Создаем резервную копию
    print(f'Создание резервной копии в {backup_file}...')
    os.makedirs('static/css_backup', exist_ok=True)
    with open(backup_file, 'w', encoding='utf-8') as f:
        f.write(css_content)
    
    # Оптимизируем CSS
    print('Оптимизация CSS...')
    optimized_css = deduplicate_css(css_content, keep_last=True)
    
    # Записываем результат
    print(f'Запись в {output_file}...')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(optimized_css)
    
    # Выводим статистику
    original_size = len(css_content)
    optimized_size = len(optimized_css)
    saved_bytes = original_size - optimized_size
    saved_percent = (saved_bytes / original_size) * 100 if original_size > 0 else 0
    
    print(f'\n=== Статистика оптимизации ===')
    print(f'Исходный размер: {original_size} байт')
    print(f'Оптимизированный размер: {optimized_size} байт')
    print(f'Экономия: {saved_bytes} байт ({saved_percent:.1f}%)')
    
    # Подсчитываем количество дубликатов
    selectors = parse_css_with_positions(css_content)
    groups = {}
    for selector, start, end, content in selectors:
        base = extract_base_selector(selector)
        if base not in groups:
            groups[base] = []
        groups[base].append(selector)
    
    duplicates = {k: v for k, v in groups.items() if len(v) > 1}
    print(f'\nНайдено и удалено {len(selectors) - len(groups)} дублирующихся селекторов')
    print(f'Осталось уникальных селекторов: {len(groups)}')
    
    # Заменяем исходный файл на оптимизированный
    print(f'\nЗамена {input_file} на оптимизированный вариант...')
    with open(input_file, 'w', encoding='utf-8') as f:
        f.write(optimized_css)
    
    print('Готово!')


if __name__ == '__main__':
    main()
