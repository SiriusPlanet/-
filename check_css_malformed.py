#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Check for remaining malformed patterns in CSS"""

with open('static/css/styles.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Check for any remaining escaped newlines
if '\\r\\n' in content:
    print("Found \\r\\n in content!")
    # Find the position
    pos = content.find('\\r\\n')
    print(f"Position: {pos}")
    print(f"Context: {repr(content[max(0, pos-50):pos+100])}")
else:
    print("No \\r\\n found")

# Check for any remaining escaped newlines
if '\\n' in content and '\\r' not in content:
    print("Found \\n (but no \\r)")
    # Find the position
    pos = content.find('\\n')
    print(f"Position: {pos}")
    print(f"Context: {repr(content[max(0, pos-50):pos+100])}")
