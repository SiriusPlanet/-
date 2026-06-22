#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Read the CSS file
with open('static/css/styles.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the malformed pattern: "}\n\n/* === ГЛАВНЫЙ БАННЕР === */"
# Replace with proper format: }\n\n/* === ГЛАВНЫЙ БАННЕР === */

# The problematic sequence is: "}\n\n/* === ГЛАВНЫЙ БАННЕР === */"
# where \n are literal backslash-n characters, not actual newlines
# and there's a stray quote after the comment

old_pattern = '"}\\n\\n/* === ГЛАВНЫЙ БАННЕР === */"'
new_pattern = '}\n\n/* === ГЛАВНЫЙ БАННЕР === */'

content = content.replace(old_pattern, new_pattern)

# Write back
with open('static/css/styles.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("CSS file fixed successfully!")
