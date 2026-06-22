import re

# Читаем файл
with open('f:\\I0\\002MySiS\\MySite\\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Удаляем весь <style>...</style> блок (включая теги)
# Регулярное выражение для удаления style тега и его содержимого
pattern = r'\s*<style>.*?</style>\s*'
content = re.sub(pattern, '', content, flags=re.DOTALL)

# Записываем обратно
with open('f:\\I0\\002MySiS\\MySite\\index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Style tag removed successfully')
