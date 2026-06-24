#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Check line endings in CSS"""

with open('static/css/styles.css', 'rb') as f:
    content = f.read()

# Check for \r\n (Windows line endings)
if b'\r\n' in content:
    print("Found Windows line endings (\\r\\n)")
    count = content.count(b'\r\n')
    print(f"Count: {count}")
    # Find first occurrence
    pos = content.find(b'\r\n')
    print(f"First occurrence at: {pos}")
    # Check context before and after
    before = content[max(0, pos-100):pos].decode('utf-8', errors='replace')
    after = content[pos+2:pos+100].decode('utf-8', errors='replace')
    print(f"Before: {repr(before[-50:])}")
    print(f"After: {repr(after[:50])}")
else:
    print("No Windows line endings found")

# Check for \r (old Mac line endings)
if b'\r' in content:
    print("Found standalone \\r characters")
    count = content.count(b'\r')
    print(f"Count: {count}")
