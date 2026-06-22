import re

# Прочитать файл
with open('static/css/styles.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Удалить дубликаты #access-overlay и .access-button (строки 267-273)
# Найти и удалить блок от '/* --- Система доступа — временно отключена --- */' до следующего комментария
pattern = r'/\*\*\s*---\s*Система\s*доступа\s*—\s*временно\s*отключена\s*---\s*\*/\s*#access-overlay\s*\{[^}]*\}\s*\.access-button\s*\{[^}]*\}\s*'
content = re.sub(pattern, '', content, flags=re.DOTALL)

# Записать обратно
with open('static/css/styles.css', 'w', encoding='utf-8') as f:
    f.write(content)

print('Duplicates removed successfully')
