// static/js/validator.js
export class Validator {
    static async validateNews(news) {
        const errors = [];
        
        if (!news.title || !Validator.validateTitle(news.title)) {
            errors.push('Заголовок должен быть уникальным и содержать минимум 5 символов');
        }
        
        if (!news.date || !Validator.validateDate(news.date)) {
            errors.push('Дата должна быть корректной и не превышать текущую');
        }
        
        if (!news.preview || !Validator.validatePreview(news.preview)) {
            errors.push('Краткое описание должно содержать минимум 10 символов');
        }
        
        if (!news.content || !Validator.validateContent(news.content)) {
            errors.push('Основной текст должен содержать минимум 20 символов');
        }
        
        return errors.length === 0 ? { valid: true } : { valid: false, errors };
    }

    static async validateTitle(title) {
        // Здесь можно добавить асинхронную проверку уникальности
        return title.trim().length >= 5;
    }

    static validateDate(dateString) {
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
}
