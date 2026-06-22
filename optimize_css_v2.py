#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Оптимизация объединенного CSS файла:
- Удаляет дублирующиеся селекторы (оставляет последнее определение)
- Сохраняет оригинальное форматирование
- Удаляет пустые блоки
"""

import re
from pathlib import Path

def optimize_css(css_content: str) -> str:
    """
    Оптимизирует CSS, удаляя дублирующиеся селекторы.
    
    Args:
        css_content: Исходный CSS код
        
    Returns:
        Оптимизированный CSS код
    """
    # Разбиваем на блоки селектор-стили
    # Паттерн для поиска селекторов и их стилей
    pattern = r'([^{}]+)\{([^{}]*)\}'
    
    # Словарь для хранения селекторов и их стилей
    # Ключ - селектор, значение - список (номер блока, стили)
    selectors = {}
    blocks = []
    
    # Находим все блоки селекторов
    for match in re.finditer(pattern, css_content):
        selector = match.group(1).strip()
        styles = match.group(2)
        
        # Игнорируем пустые селекторы
        if not selector or not styles.strip():
            continue
        
        # Нормализуем селектор (убираем лишние пробелы, приводим к нижнему регистру для @-правил)
        normalized_selector = ' '.join(selector.split())
        
        # Сохраняем блок
        blocks.append({
            'selector': selector,
            'normalized': normalized_selector,
            'styles': styles,
            'start': match.start(),
            'end': match.end(),
            'full_match': match.group(0)
        })
        
        # Добавляем в словарь для отслеживания дубликатов
        if normalized_selector not in selectors:
            selectors[normalized_selector] = []
        selectors[normalized_selector].append(len(blocks) - 1)
    
    # Определяем, какие блоки оставить (последнее определение каждого селектора)
    blocks_to_keep = set()
    for selector, block_indices in selectors.items():
        # Оставляем только последний блок для каждого селектора
        blocks_to_keep.add(block_indices[-1])
    
    # Создаем новый CSS, заменяя дубликаты на комментарии
    result = []
    last_end = 0
    
    for i, block in enumerate(blocks):
        # Добавляем всё между блоками
        if block['start'] > last_end:
            result.append(css_content[last_end:block['start']])
        
        if i in blocks_to_keep:
            # Оставляем этот блок
            result.append(block['full_match'])
        else:
            # Заменяем дубликат на комментарий
            result.append(f'/* Дубликат селектора "{block["selector"]}" удалён */')
        
        last_end = block['end']
    
    # Добавляем остаток
    if last_end < len(css_content):
        result.append(css_content[last_end:])
    
    return ''.join(result)


def remove_empty_blocks(css_content: str) -> str:
    """Удаляет пустые CSS блоки."""
    # Паттерн для поиска пустых блоков
    pattern = r'[^{}]+\{\s*\}'
    return re.sub(pattern, '', css_content)


def main():
    css_path = Path('static/css/style.css')
    backup_path = Path('static/css_backup/style.css.bak')
    output_path = Path('static/css/style_optimized.css')
    
    print(f"Чтение {css_path}...")
    css_content = css_path.read_text(encoding='utf-8')
    original_size = len(css_content)
    
    print("Оптимизация CSS...")
    
    # Сохраняем бэкап
    backup_path.write_text(css_content, encoding='utf-8')
    print(f"Бэкап сохранён в {backup_path}")
    
    # Удаляем дубликаты
    optimized = optimize_css(css_content)
    
    # Удаляем пустые блоки
    optimized = remove_empty_blocks(optimized)
    
    # Записываем результат
    output_path.write_text(optimized, encoding='utf-8')
    
    new_size = len(optimized)
    diff = new_size - original_size
    diff_percent = (diff / original_size) * 100 if original_size > 0 else 0
    
    print(f"\n=== Результаты оптимизации ===")
    print(f"Исходный размер: {original_size} байт")
    print(f"Оптимизированный размер: {new_size} байт")
    print(f"Разница: {diff:+d} байт ({diff_percent:+.1f}%)")
    
    if new_size <= original_size:
        # Заменяем оригинальный файл
        css_path.write_text(optimized, encoding='utf-8')
        print(f"\n{css_path} обновлён успешно!")
    else:
        print(f"\nВНИМАНИЕ: Размер увеличился! Оригинал не изменён.")


if __name__ == '__main__':
    main()
