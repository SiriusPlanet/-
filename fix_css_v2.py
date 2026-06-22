# Read the file
with open('static/css/news.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace literal backslash-r-backslash-n with actual newlines
content = content.replace('\\r\\n', '\n')

# Fix any remaining double newlines that might have been created
content = content.replace('\n\n\n', '\n\n')

# Write back
with open('static/css/news.css', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed escape sequences')
