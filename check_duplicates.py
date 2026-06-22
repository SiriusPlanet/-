#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Проверка дублирующихся селекторов в CSS файле"""

import re
from collections import Counter

def check_duplicates(css_path):
    """Проверяет дублирующиеся селекторы в CSS файле."""
    with open(css_path, 'r', encoding='utf-8') as f:
        css = f.read()
    
    # Паттерн для поиска селекторов
    pattern = r'([.#]?\w[\w\-]*\s*(?:,[.#]?\w[\w\-]*)*|@[^\{]+)\s*\{'
    
    # Находим все селекторы
    selectors = re.findall(pattern, css)
    
    # Подсчитываем количество вхождений каждого селектора
    counts = Counter(selectors)
    
    # Находим дубликаты (селекторы, встречающиеся более одного раза)
    dups = {k: v for k, v in counts.items() if v > 1}
    
    print(f'Всего селекторов: {len(selectors)}')
    print(f'Уникальных: {len(counts)}')
    print(f'Дубликатов: {len(dups)}')
    
    if dups:
        print('\nТоп-10 дубликатов:')
        for k, v in sorted(dups.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f'{k}: {v} раз')
    
    return len(selectors), len(counts), len(dups)


if __name__ == '__main__':
    check_duplicates('static/css/style.css')
