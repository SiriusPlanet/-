#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Восстанавливаем showDiscountPanel с ползунком, но без поля "причина"

with open('static/js/publisher.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Добавляем showDiscountPanel перед saveDiscountFromCard
old_method = '''    /**
     * Сохраняет скидку из card-constructor.js (без панели)
     */
    async saveDiscountFromCard(item, btn, card, container, page) {'''

new_method = '''    /**
     * Показывает панель управления скидкой (ползунок + поле ввода)
     */
    showDiscountPanel(itemId, btn, card, container, page) {
        const currentDiscount = parseInt(btn.dataset.discount) || 0;

        // Скрываем кнопку %, пока панель открыта
        btn.style.display = 'none';

        // Закрываем другие открытые панели
        card.querySelectorAll('.discount-panel').forEach(p => p.remove());

        const panel = document.createElement('div');
        panel.className = 'discount-panel';
        panel.innerHTML = `
            <label>Скидка %</label>
            <input type="range" min="0" max="100" value="${currentDiscount}" class="discount-slider">
            <input type="number" min="0" max="100" value="${currentDiscount}" class="discount-value-input">
            <div class="discount-actions">
                <button class="discount-save-btn">Сохранить</button>
                <button class="discount-cancel-btn">Отмена</button>
            </div>
        `;

        card.appendChild(panel);

        const slider = panel.querySelector('.discount-slider');
        const numInput = panel.querySelector('.discount-value-input');

        slider.addEventListener('input', () => { numInput.value = slider.value; });
        numInput.addEventListener('input', () => { slider.value = numInput.value; });

        panel.querySelector('.discount-save-btn').addEventListener('click', async () => {
            const discount = parseInt(numInput.value) || 0;
            await this.saveDiscount(itemId, discount, btn, panel, container, page);
        });

        panel.querySelector('.discount-cancel-btn').addEventListener('click', () => {
            if (panel) this.closeDiscountPanel(btn, panel);
        });

        // Закрыть по клику вне панели
        const closeHandler = (e) => {
            if (!panel.contains(e.target) && e.target !== btn) {
                if (panel) this.closeDiscountPanel(btn, panel);
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 100);
    }

    /**
     * Сохраняет скидку из card-constructor.js (без панели)
     */
    async saveDiscountFromCard(item, btn, card, container, page) {'''

content = content.replace(old_method, new_method)

# Меняем onDiscount в publish на вызов showDiscountPanel
old_onDiscount = '''                onDiscount: (item, btn, cardEl) => this.saveDiscountFromCard(item, btn, cardEl, container, page),'''

new_onDiscount = '''                onDiscount: (id, btn, cardEl) => this.showDiscountPanel(id, btn, cardEl, container, page),'''

content = content.replace(old_onDiscount, new_onDiscount)

with open('static/js/publisher.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('showDiscountPanel восстановлен с ползунком, без поля "причина"')
