#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fix CSS syntax errors in style.css - direct string replacement"""

# Read the file
with open('f:\\I0\\002MySiS\\MySite\\static\\css\\style.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Direct string replacements for the problematic sections

# Fix .hero - line ~692-694
old_hero = '    padding: 2rem 2rem;\n"    text-align: center;\\n    background: rgba(255, 255, 255, 0.98);\\n    border-radius: 1rem;"\n    box-shadow:'
new_hero = '    padding: 2rem 2rem;\n    background: rgba(255, 255, 255, 0.98);\n    border-radius: 1rem;\n    box-shadow:'
content = content.replace(old_hero, new_hero)

# Write the fixed content
with open('f:\\I0\\002MySiS\\MySite\\static\\css\\style.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("CSS errors fixed successfully!")
