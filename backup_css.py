#!/usr/bin/env python3
"""
Скрипт резервного копирования CSS-файлов перед рефакторингом
"""
import os
import shutil
from pathlib import Path

# Пути
PROJECT_DIR = Path(r"f:\I0\002MySiS\MySite")
CSS_DIR = PROJECT_DIR / "static" / "css"
BACKUP_DIR = PROJECT_DIR / "css_backup"

# CSS-файлы для резервного копирования
CSS_FILES = [
    "style.css",
    "news.css",
    "about_page_styles.css",
    "news-form.css",
    "#privacy.css",
    "style.css.backup",
    "style02.css",
]

def backup_css_files():
    """Создать резервную копию всех CSS-файлов"""
    # Создать папку резервной копии
    BACKUP_DIR.mkdir(exist_ok=True)
    print(f"Created backup directory: {BACKUP_DIR}")
    
    # Скопировать файлы
    copied = []
    skipped = []
    
    for css_file in CSS_FILES:
        src = CSS_DIR / css_file
        if src.exists():
            dst = BACKUP_DIR / css_file
            shutil.copy2(src, dst)
            copied.append(css_file)
            print(f"  Copied: {css_file}")
        else:
            skipped.append(css_file)
            print(f"  Skipped (not found): {css_file}")
    
    print(f"\n[OK] Backup complete!")
    print(f"   Copied: {len(copied)} files")
    print(f"   Skipped: {len(skipped)} files")
    
    return copied, skipped

if __name__ == "__main__":
    print("Backup CSS files to css_backup/")
    print("=" * 50)
    backup_css_files()
