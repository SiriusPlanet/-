#!/usr/bin/env python3
"""Fix malformed CSS on line 2117 where \n escape sequences should be actual newlines."""

# Read the file
with open('static/css/styles.css', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
print(f"Total lines: {len(lines)}")

# Find the malformed line
for i, line in enumerate(lines):
    if './*' in line and '\\n' in line:
        print(f"Found malformed line at index {i} (line {i+1})")
        print(f"Line content (first 100 chars): {line[:100]}")
        backslash_n = '\\n'
        print(f"Number of \\n in line: {line.count(backslash_n)}")
        
        # Replace \n with actual newlines
        fixed_line = line.replace('\\n', '\n')
        lines[i] = fixed_line
        print(f"Fixed! Now has {fixed_line.count(chr(10))} newlines")
        break

# Write back
fixed_content = '\n'.join(lines)
with open('static/css/styles.css', 'w', encoding='utf-8') as f:
    f.write(fixed_content)

print("File fixed successfully!")
