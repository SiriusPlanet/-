#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Скрипт для очистки CSS от дубликатов селекторов
Сохраняет только последнюю версию каждого селектора
"""

import re
from collections import OrderedDict

def parse_css_blocks(css_content):
    """Разбивает CSS на блоки селектор -> содержимое"""
    blocks = OrderedDict()
    
    # Паттерн для поиска блоков селекторов
    # Ищем селектор { ... }
    pattern = r'([^{]+)\{([^}]*)\}'
    
    for match in re.finditer(pattern, css_content):
        selector = match.group(1).strip()
        content = match.group(2).strip()
        
        # Если это media query, сохраняем его целиком
        if selector.startswith('@media'):
            if selector not in blocks:
                blocks[selector] = []
            blocks[selector].append(content)
        else:
            # Для обычных селекторов сохраняем только последний
            blocks[selector] = content
    
    return blocks

def rebuild_css(blocks):
    """Восстанавливает CSS из блоков"""
    result = []
    
    for selector, content in blocks.items():
        if isinstance(content, list):
            # Media query с несколькими блоками
            for c in content:
                result.append(f"{selector} {{\n{c}\n}}")
        else:
            result.append(f"{selector} {{\n{content}\n}}")
    
    return '\n\n'.join(result)

def main():
    input_file = 'static/css/styles.css'
    output_file = 'static/css/styles_clean.css'
    
    with open(input_file, 'r', encoding='utf-8') as f:
        css_content = f.read()
    
    print(f"Исходный размер: {len(css_content)} байт")
    
    # Разбить на блоки
    blocks = parse_css_blocks(css_content)
    
    print(f"Уникальных селекторов: {len(blocks)}")
    
    # Восстановить CSS
    cleaned_css = rebuild_css(blocks)
    
    print(f"Очищенный размер: {len(cleaned_css)} байт")
    print(f"Экономия: {len(css_content) - len(cleaned_css)} байт ({(1 - len(cleaned_css)/len(css_content))*100:.1f}%)")
    
    # Сохранить
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(cleaned_css)
    
    print(f"\nСохранено в {output_file}")

if __name__ == '__main__':
    main()
