import fs from 'fs';

const filePath = 'static/js/publisher.js';
let content = fs.readFileSync(filePath, 'utf8');

// Удаляем все строки, которые содержат JSON-объекты (начинаются с { и содержат "id": ...)
// Ищем и удаляем строки с JSON-объектами внутри функции filterLots
const lines = content.split('\n');
const cleanedLines = lines.filter(line => {
    // Пропускаем строки, которые являются JSON-объектами
    if (line.trim().startsWith('{') && line.includes('"id":')) {
        return false;
    }
    // Пропускаем строки, которые закрывают JSON-объект
    if (line.trim() === '}' && !line.includes('case ') && !line.includes('return ') && !line.includes('function') && !line.includes('switch')) {
        return false;
    }
    return true;
});

const newContent = cleanedLines.join('\n');

// Проверяем, действительно ли были изменения
if (content === newContent) {
    console.log('⚠️  Изменений не обнаружено. Проверьте ручное исправление.');
} else {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('✅ Файл publisher.js очищен от синтаксического мусора!');
}
