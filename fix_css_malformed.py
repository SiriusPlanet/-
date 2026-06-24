#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Fix malformed CSS file with escaped newlines and empty strings"""

with open('static/css/styles.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the malformed section - remove the empty string "" before .contacts-section .subtitle
# The issue: ""\n.contacts-section .subtitle, should be /* Подзаголовки секций */\n.contacts-section .subtitle,
content = content.replace('""\n.contacts-section .subtitle,', '/* Подзаголовки секций */\n.contacts-section .subtitle,')

# Also fix any remaining malformed patterns
content = content.replace('""\n', '')

with open('static/css/styles.css', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed CSS file!')
