// news-form.js
import { NewsManager } from './news-manager.js';
import { Logger } from './logger.js';

export class NewsForm {
    constructor(newsManager) {
        console.log('Инициализация NewsForm');
        if (!newsManager) {
            throw new Error('NewsManager не передан в NewsForm');
        }
        this.newsManager = newsManager;
        
        this.addBtn = document.querySelector('.add-news-btn');
        this.modal = document.getElementById('addNewsModal');
        this.form = document.getElementById('newsForm');
        
        if (!this.addBtn || !this.modal || !this.form) {
            Logger.error('Не найдены необходимые элементы для инициализации');
            return;
        }
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Открытие модального окна
        this.addBtn.addEventListener('click', () => {
            this.openModal();
        });

        // Закрытие по кнопке
        const cancelBtn = this.modal.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });

        // Закрытие по клику вне модалки
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Отправка формы
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });

        const imageInput = document.getElementById('image');
        const uploadLabelSpan = document.querySelector('.file-upload-label span:last-child');

        if (imageInput && uploadLabelSpan) {
            imageInput.addEventListener('change', () => {
                const file = imageInput.files[0];
                uploadLabelSpan.textContent = file ? file.name : 'Выберите файл для иллюстрации';
            });
        }
    }

    openModal() {
        this.modal.classList.remove('hidden');
        this.modal.classList.add('is-visible');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.modal.classList.remove('is-visible');
        this.modal.classList.add('hidden');
        document.body.style.overflow = '';
        this.resetForm();
    }

    resetForm() {
        this.form.reset();
        this.form.querySelectorAll('input, textarea').forEach(el => el.value = '');
        
        // 🛠 СБРОС ТЕКСТА В КНОПКЕ "Выберите файл"
        const uploadLabelSpan = this.form.querySelector('.file-upload-label span:last-child');
        if (uploadLabelSpan) {
            uploadLabelSpan.textContent = 'Выберите файл для иллюстрации';
        }
    }

    async handleSubmit() {
        try {
            // ✅ СБИРАЕМ ДАННЫЕ В РУЧНУЮ (чтобы FormData не обманывал)
            const title = document.getElementById('title').value;
            const date = document.getElementById('date').value;
            const preview = document.getElementById('preview').value;
            const content = document.getElementById('content').value;
            const imageFile = document.getElementById('image').files[0];

            // Проверяем, что заголовок и текст не пустые
            if (!title.trim() || !content.trim()) {
                this.showError('Заполните заголовок и полный текст');
                return;
            }

            // Формируем FormData вручную
            const formData = new FormData();
            formData.append('title', title);
            formData.append('date', date);
            formData.append('preview', preview);
            formData.append('content', content);
            formData.append('lotType', 'news');
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const result = await this.newsManager.saveNews(formData);
            
            if (result.success) {
                this.showSuccess(`✅ Хронозапись сохранена! ID: ${result.id}`);
                this.closeModal();
                await this.newsManager.loadNews();
            } else {
                this.showError(result.error || 'Неизвестная ошибка');
            }
        } catch (error) {
            Logger.error('Ошибка отправки формы', error);
            this.showError('Произошла ошибка при сохранении');
        }
    }
    
    validateForm(formData) {
        // ✅ УБРАЛИ ВСЕ ОГРАНИЧЕНИЯ — просто проверяем, что есть данные
        const title = formData.get('title')?.trim();
        const date = formData.get('date')?.trim();
        const preview = formData.get('preview')?.trim();
        const content = formData.get('content')?.trim();

        // Если есть хотя бы заголовок и текст — можно сохранять
        return !!(title && content); // ← минимальная проверка
    }

    showSuccess(message) {
        this.newsManager.showToast(message);
    }

    showError(message) {
        this.newsManager.showError(message);
    }
}

// Функция инициализации формы
export async function initNewsForm(newsManager) {
    const newsForm = new NewsForm(newsManager);
    
    try {
        await newsForm.init();
        console.log('Форма новостей успешно инициализирована');
    } catch (error) {
        Logger.error('Ошибка инициализации формы новостей', error);
    }
}