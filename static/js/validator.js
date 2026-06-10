// static/js/validator.js (упрощённая версия)
export class Validator {
    static validateTitle(title) {
        return title.trim().length >= 5;
    }

    static validateDate(dateString) {
        if (!dateString) return false;
        const date = new Date(dateString);
        return !isNaN(date.getTime()) && date <= new Date();
    }

    static validatePreview(preview) {
        return preview.trim().length >= 10;
    }

    static validateContent(content) {
        return content.trim().length >= 20;
    }

    static validateImage(file) {
        if (!file) return false;
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        return validTypes.includes(file.type) && file.size <= 5 * 1024 * 1024;
    }

    static validateNews(news) {
        const errors = [];
        
        if (!Validator.validateTitle(news.title)) errors.push('Заголовок (минимум 5 символов)');
        if (!Validator.validateDate(news.date)) errors.push('Дата (не позже сегодня)');
        if (!Validator.validatePreview(news.preview)) errors.push('Краткое описание (минимум 10 символов)');
        if (!Validator.validateContent(news.content)) errors.push('Основной текст (минимум 20 символов)');
        
        return errors.length === 0 ? { valid: true } : { valid: false, errors };
    }
}