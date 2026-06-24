#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fix malformed comment in CSS file."""

# Read the file with proper encoding
with open('f:\\I0\\002MySiS\\MySite\\static\\css\\styles.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the malformed comment - replace the escaped string with proper comment
old_text = '"/* 2. requisites.html — пастельный золотой (финансовая тема) */\\r\\n.requisites-section {"'
new_text = '/* 2. requisites.html — пастельный золотой (финансовая тема) */\r\n.requisites-section {'

content = content.replace(old_text, new_text)

# Write back
with open('f:\\I0\\002MySiS\\MySite\\static\\css\\styles.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("CSS comment fixed successfully!")
