#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Fix malformed CSS file by removing JSON section (lines 241-290)

with open('static/css/styles.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines in file: {len(lines)}")

# Get first 230 lines (valid CSS before malformed section)
valid_start = lines[:230]

# Get lines starting from 291 (valid CSS after malformed section)
valid_end = lines[290:]

# Combine them
fixed_content = ''.join(valid_start) + ''.join(valid_end)

print(f"Lines to keep: {len(valid_start)} + {len(valid_end)} = {len(valid_start) + len(valid_end)}")

# Write back with Windows line endings preserved
with open('static/css/styles.css', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(fixed_content)

print("Fixed CSS file successfully!")
