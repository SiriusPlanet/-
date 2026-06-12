// static/js/logger.js
export class Logger {
    static log(message) {
        console.log(`%c[LOG] ${new Date().toLocaleTimeString()}: ${message}`, 'color: #2ecc71');
    }

    static error(action, error) {
        const msg = typeof error === 'string' ? error : error?.message || 'Неизвестная ошибка';
        console.error(`%c[ERROR] ${action}: ${msg}`, 'color: #e74c3c');
    }

    static info(message) {
        console.info(`%c[INFO] ${message}`, 'color: #3498db');
    }
    
    static warn(message) {
        console.warn(`%c[WARN] ${new Date().toLocaleTimeString()}: ${message}`, 'color: #f39c12');
    }

    static debug(message) {
        console.debug(`%c[DEBUG] ${new Date().toLocaleTimeString()}: ${message}`, 'color: #95a5a6');
    }
}
