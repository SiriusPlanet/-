#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fix CSS syntax errors in style.css"""

import re

# Read the file
with open('f:\\I0\\002MySiS\\MySite\\static\\css\\style.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern 1: Fix .site-header (line ~108-110)
content = re.sub(
    r'(    padding: 0\.9375rem 1\.25rem;)\nbackground: rgba\(255, 255, 255, 0\.98\);}\n    box-shadow:',
    r'\1\n    background: rgba(255, 255, 255, 0.98);\n    box-shadow:',
    content
)

# Pattern 2: Fix .move-table (line ~592-594)
content = re.sub(
    r'(    padding: 1\.5rem 2rem;)\nbackground: rgba\(255, 255, 255, 0\.98\);}\n    border-radius:',
    r'\1\n    background: rgba(255, 255, 255, 0.98);\n    border-radius:',
    content
)

# Pattern 3: Fix .hero (line ~692-694) - has escaped text that needs removal
content = re.sub(
    r'    padding: 2rem 2rem;\n"    text-align: center;\\\\n    background: rgba\(255, 255, 255, 0\.98\);\\\\n    border-radius: 1rem;"\n    box-shadow:',
    r'    padding: 2rem 2rem;\n    background: rgba(255, 255, 255, 0.98);\n    border-radius: 1rem;\n    box-shadow:',
    content
)

# Pattern 4: Fix .terms (line ~701-703)
content = re.sub(
    r'(    padding: 2\.5rem 2rem;)\nbackground: rgba\(255, 255, 255, 0\.98\);}\n    border-radius:',
    r'\1\n    background: rgba(255, 255, 255, 0.98);\n    border-radius:',
    content
)

# Pattern 5: Fix .news-header-panel (line ~757-759)
content = re.sub(
    r'\nbackground: rgba\(255, 255, 255, 0\.98\);}\n    padding: 1\.25rem;',
    r'\n    background: rgba(255, 255, 255, 0.98);\n    padding: 1.25rem;',
    content
)

# Pattern 6: Fix .site-footer (line ~894-896)
content = re.sub(
    r'\nbackground: rgba\(255, 255, 255, 0\.98\);}\n    padding: 1\.5rem 2rem;',
    r'\n    background: rgba(255, 255, 255, 0.98);\n    padding: 1.5rem 2rem;',
    content
)

# Pattern 7: Fix .contacts-section .contact-card, ... (line ~1373-1375)
content = re.sub(
    r'\nbackground: rgba\(255, 255, 255, 0\.98\);}\n    padding: 2rem;',
    r'\n    background: rgba(255, 255, 255, 0.98);\n    padding: 2rem;',
    content
)

# Pattern 8: Fix .contacts-section .memory-disclaimer, ... (line ~1443-1445)
content = re.sub(
    r'\nbackground: rgba\(255, 255, 255, 0\.98\);}\n    padding: 2rem;',
    r'\n    background: rgba(255, 255, 255, 0.98);\n    padding: 2rem;',
    content
)

# Pattern 9: Fix .memory-fragment (line ~3228-3230)
content = re.sub(
    r'\nbackground: rgba\(255, 255, 255, 0\.98\);}\n    padding: 2rem;',
    r'\n    background: rgba(255, 255, 255, 0.98);\n    padding: 2rem;',
    content
)

# Write the fixed content
with open('f:\\I0\\002MySiS\\MySite\\static\\css\\style.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("CSS errors fixed successfully!")
