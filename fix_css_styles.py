#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Read the styles.css file
with open('static/css/styles.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Try to find and fix JSON-like content in the file
lines = content.split('\r\n')

# Look for problematic lines
for i, line in enumerate(lines):
    if '"* {' in line or '},"' in line:
        print(f"Found problematic line {i+1}: {line[:100]}")

# Remove any lines containing JSON-like patterns
fixed_lines = []
for line in lines:
    if '"* {' not in line and '},"' not in line and '{"text"' not in line:
        fixed_lines.append(line)

content = '\r\n'.join(fixed_lines)

# Write the fixed content
with open('static/css/styles.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("File saved successfully")
