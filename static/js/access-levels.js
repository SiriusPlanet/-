// static/js/access-levels.js
import { Logger } from './logger.js';

/**
 * Управление уровнями доступа
 * 
 * Уровни:
 * 0 = без доступа (гость)
 * 1 = пользователь (базовый)
 * 2 = модератор
 * 3 = администратор (максимум)
 */
export class AccessLevels {
    constructor() {
        this.storageKey = 'user_level';
        this.currentLevel = this.loadLevel();
    }

    /**
     * Загружает уровень из localStorage
     */
    loadLevel() {
        const level = parseInt(localStorage.getItem(this.storageKey), 10);
        const result = isNaN(level) ? 0 : Math.max(0, Math.min(3, level));
        Logger.debug(`AccessLevels: загружен уровень ${result} из localStorage`);
        return result;
    }

    /**
     * Сохраняет уровень в localStorage
     */
    saveLevel(level) {
        const clampedLevel = Math.max(0, Math.min(3, level));
        localStorage.setItem(this.storageKey, clampedLevel);
        this.currentLevel = clampedLevel;
        Logger.debug(`AccessLevels: сохранён уровень ${clampedLevel} в localStorage`);
    }

    /**
     * Получает текущий уровень доступа
     */
    getLevel() {
        return this.currentLevel;
    }

    /**
     * Устанавливает уровень доступа (для инициализации)
     */
    setLevel(level) {
        this.saveLevel(level);
        this.currentLevel = level;
        return this.currentLevel;
    }

    /**
     * Проверяет, есть ли доступ >= указанного уровня
     * @param {number} minLevel - минимальный требуемый уровень (0-3)
     * @returns {boolean}
     */
    canAccess(minLevel = 0) {
        const result = this.currentLevel >= minLevel;
        Logger.debug(`AccessLevels: проверка доступа >= ${minLevel}: ${result} (текущий: ${this.currentLevel})`);
        return result;
    }

    /**
     * Проверяет доступ и выбрасывает ошибку если нет
     * @param {number} minLevel - минимальный требуемый уровень
     * @throws {Error} если нет доступа
     */
    requireAccess(minLevel = 0) {
        if (!this.canAccess(minLevel)) {
            const messages = {
                1: 'Требуется авторизация',
                2: 'Требуются права модератора',
                3: 'Требуются права администратора'
            };
            const message = messages[minLevel] || 'Недостаточно прав';
            throw new Error(message);
        }
    }

    /**
     * Синхронизирует уровень с сервером
     * Если сервер недоступен (офлайн), использует локальный уровень
     * @returns {Promise<number>} текущий уровень
     */
    async syncWithServer() {
        try {
            const response = await fetch('/api/check-access');
            if (!response.ok) throw new Error('Сервер недоступен');
            
            const data = await response.json();
            const serverLevel = data.level || 0;
            
            // Сохраняем полученный уровень
            this.saveLevel(serverLevel);
            this.currentLevel = serverLevel;
            
            Logger.log(`AccessLevels: синхронизировано с сервером (уровень ${serverLevel})`);
            return serverLevel;
        } catch (error) {
            Logger.warn('AccessLevels: сервер недоступен, используем локальный уровень');
            Logger.debug(`Ошибка синхронизации: ${error.message}`);
            
            // В офлайне возвращаем текущий локальный уровень
            return this.currentLevel;
        }
    }

    /**
     * Очищает уровень доступа (выход из аккаунта)
     */
    clear() {
        localStorage.removeItem(this.storageKey);
        this.currentLevel = 0;
        Logger.log('AccessLevels: уровень доступа сброшен');
    }
}
