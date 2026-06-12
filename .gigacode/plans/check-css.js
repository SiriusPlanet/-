const fs = require('fs');

const cssFiles = ['style.css', 'news.css', 'news-form.css', '#privacy.css', 'style02.css'];

cssFiles.forEach(f => {
    try {
        const content = fs.readFileSync('static/css/' + f, 'utf8');
        const openBraces = (content.match(/\{/g) || []).length;
        const closeBraces = (content.match(/\}/g) || []).length;
        console.log(f + ': braces=' + openBraces + '/' + closeBraces + (openBraces === closeBraces ? ' OK' : ' MISMATCH'));
    } catch(e) {
        console.log(f + ': ERROR - ' + e.message);
    }
});
