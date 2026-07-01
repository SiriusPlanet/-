# Скрипт для исправления CSS-файла - удаление ошибочной секции с кавычками

import re

# Читаем файл
with open('c:\\I0\\002MySiS\\MySite\\static\\css\\style.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Паттерн для поиска и удаления ошибочной секции с кавычками
# Ищем строку, начинающуюся с кавычки, за которой следует /* --- Система доступа
pattern = r'\"/\* --- Система доступа --- \*/\\r\\n.*?access-overlay \{.*?\}\r\n\r\n\r\n/\* === Единый стиль'

# Заменяем на корректный CSS-комментарий без кавычек
replacement = '''/* --- Система доступа --- */
#access-overlay {'''

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Сохраняем файл
with open('c:\\I0\\002MySiS\\MySite\\static\\css\\style.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("CSS-файл исправлен!")
