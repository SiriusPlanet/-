#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Read the CSS file
with open('f:\\I0\\002MySiS\\MySite\\static\\css\\styles.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Replace malformed comment on line 415
# The malformed line is: "/* === ГЛАВНЫЙ БАННЕР === */\\r\\n.hero {"
# Should be: /* === ГЛАВНЫЙ БАННЕР === */\n.hero {
content = content.replace(
    '"/* === ГЛАВНЫЙ БАННЕР === */\\r\\n.hero {"',
    '/* === ГЛАВНЫЙ БАННЕР === */\n.hero {'
)

# Fix 2: Remove stray quote before .catalog h2
# Looking for: \n"\n.catalog h2 {
content = content.replace(
    '\n"\n.catalog h2 {',
    '\n.catalog h2 {'
)

# Fix 3: Add standard line-clamp property for vendor prefix warnings
# For .catalog-card.card-large .catalog-card-title
content = content.replace(
    '.catalog-card.card-large .catalog-card-title {\n\n    font-size: 17px;\n    -webkit-line-clamp: 3;\n\n}',
    '.catalog-card.card-large .catalog-card-title {\n\n    font-size: 17px;\n    -webkit-line-clamp: 3;\n    line-clamp: 3;\n\n}'
)

# For .catalog-card.card-large .catalog-card-description
content = content.replace(
    '.catalog-card.card-large .catalog-card-description {\n\n    font-size: 13px;\n    white-space: normal;\n    overflow: visible;\n    text-overflow: clip;\n    -webkit-line-clamp: 2;\n    display: -webkit-box;\n    -webkit-box-orient: vertical;\n\n}',
    '.catalog-card.card-large .catalog-card-description {\n\n    font-size: 13px;\n    white-space: normal;\n    overflow: visible;\n    text-overflow: clip;\n    -webkit-line-clamp: 2;\n    line-clamp: 2;\n    display: -webkit-box;\n    -webkit-box-orient: vertical;\n\n}'
)

# Write the fixed content
with open('f:\\I0\\002MySiS\\MySite\\static\\css\\styles.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("CSS file fixed successfully!")
