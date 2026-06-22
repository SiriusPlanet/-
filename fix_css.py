import re

# Read the file
with open('static/css/news.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace literal \\r\\n with actual newlines
content = content.replace('\\\\r\\\\n', '\n')

# Fix duplicate closing braces pattern
content = re.sub(r'\}\r\n\r\n\}', '}\n}', content)

# Write back
with open('static/css/news.css', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed escape sequences')
