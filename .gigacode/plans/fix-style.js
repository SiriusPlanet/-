const fs = require('fs');

const content = fs.readFileSync('f:/I0/002MySiS/MySite/static/css/style.css', 'utf8');
const lines = content.split('\r\n');

let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('\"/* === ФУТЕР')) {
        startIdx = i;
        console.log('Start at line ' + (i+1));
    }
    if (startIdx !== -1 && lines[i].includes('}\"')) {
        endIdx = i;
        console.log('End at line ' + (i+1));
        break;
    }
}

console.log('startIdx:', startIdx);
console.log('endIdx:', endIdx);

if (startIdx !== -1 && endIdx !== -1) {
    // Извлекаем CSS код из JSON-обёртки
    const wrapperStart = lines[startIdx].indexOf('\"/*');
    const codeStart = lines[startIdx].substring(wrapperStart);
    
    // Собираем CSS код
    const cssLines = [codeStart];
    for (let i = startIdx + 1; i < endIdx; i++) {
        cssLines.push(lines[i]);
    }
    
    // Удаляем лишние кавычки и экранирования
    const fixedLines = cssLines.map(line => line.replace(/^\"/, '').replace(/\\r\\n/g, '\r\n'));
    
    console.log('CSS lines to insert:', fixedLines.length);
    console.log('First line:', fixedLines[0]);
    console.log('Last line:', fixedLines[fixedLines.length-1]);
    
    // Удаляем проблемные строки
    const before = lines.slice(0, startIdx);
    const after = lines.slice(endIdx + 1);
    const fixedContent = before.concat(fixedLines, after).join('\r\n');
    
    fs.writeFileSync('f:/I0/002MySiS/MySite/static/css/style.css', fixedContent, 'utf8');
    console.log('Файл исправлен!');
}
