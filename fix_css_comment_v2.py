#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Script to fix malformed comment in styles.css
# The issue is: */"\r\n".requisites-section should be */\r\n.requisites-section

f = open('static/css/styles.css', 'rb')
content = f.read()
f.close()

content_str = content.decode('utf-8')

# Find and display the problematic area
idx = content_str.find('*/"')
if idx != -1:
    print('Found malformed comment at position:', idx)
    print('Context:', repr(content_str[max(0,idx-50):idx+100]))

# Replace the malformed pattern
old_pattern = '*/"\\r\\n".'
new_pattern = '*/\r\n.'

if old_pattern in content_str:
    print('Found old pattern, replacing...')
    content_str = content_str.replace(old_pattern, new_pattern)
    print('Replacement done')
else:
    print('Old pattern not found')
    # Try alternative patterns
    if '*/"' in content_str:
        print('Found */" in file')
        idx = content_str.find('*/"')
        print('Context:', repr(content_str[max(0,idx-30):idx+50]))

"# Write back\nwith open('static/css/styles.css', 'w', encoding='utf-8', newline='') as f:\n    f.write(content_str)"}

print('File updated')

# Verify the fix
f = open('static/css/styles.css', 'rb')
content = f.read()
f.close()
content_str = content.decode('utf-8')

idx = content_str.find('requisites-section')
if idx != -1:
    print('requisites-section found at position:', idx)
    print('Context:', repr(content_str[max(0,idx-50):idx+50]))
