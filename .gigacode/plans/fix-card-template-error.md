# 🐛 Исправление ошибки в card-template.html

## 🔍 Проблема
В файле `templates/card-constructor/card-template.html` на строке 11 есть синтаксическая ошибка JavaScript:

```html
<button class="read-more-btn" onclick="window.openNews({{id}})">ЧИТАТЬ ПОЛНОСТЬЮ</button>
```

**Ошибка:** `Property assignment expected` и `',' expected`

**Причина:** Template-переменная `{{id}}` внутри атрибута `onclick` не заключена в кавычки, поэтому JavaScript-парсер думает, что это JavaScript-код.

## ✅ Решение

Изменить строку 11 на:

```html
<button class="read-more-btn" onclick="window.openNews('{{id}}')">ЧИТАТЬ ПОЛНОСТЬЮ</button>
```

Теперь `{{id}}` будет интерпретироваться как строка при рендеринге шаблона.

## 📝 Дополнительно

Также нужно обновить план `news-card-constructor.md`, чтобы в будущем не возникало подобных ошибок.

## 🎯 Статус
Исправлено ✅
