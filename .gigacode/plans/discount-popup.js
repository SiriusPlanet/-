// static/js/discount-popup.js
import { Logger } from './logger.js';

/**
 * Круглая кнопка со скидкой и крестиком для закрытия
 */
export class DiscountPopup {
    constructor() {
        this.storageKey = 'discount_popup_closed';
        this.discountPercent = 15;
        this.isOpen = false;
        
        this.initElements();
        this.setupEventListeners();
        this.checkIfClosed();
    }
    
    initElements() {
        if (!document.querySelector('.discount-popup-container')) {
            this.container = document.createElement('div');
            this.container.className = 'discount-popup-container';
            this.container.innerHTML = `
                <div class="discount-popup">
                    <div class="discount-circle">
                        <span class="discount-percent">-${this.discountPercent}%</span>
                    </div>
                    <button class="discount-close" title="Закрыть">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            `;
            document.body.appendChild(this.container);
            Logger.log('DiscountPopup: контейнер создан');
        } else {
            this.container = document.querySelector('.discount-popup-container');
        }
        
        this.popup = this.container.querySelector('.discount-popup');
        this.closeBtn = this.container.querySelector('.discount-close');
        
        const discountAttr = this.container.getAttribute('data-discount');
        if (discountAttr) {
            this.discountPercent = parseInt(discountAttr, 10);
            if (this.popup) {
                const percentEl = this.popup.querySelector('.discount-percent');
                if (percentEl) {
                    percentEl.textContent = `-${this.discountPercent}%`;
                }
            }
        }
    }
    
    setupEventListeners() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.close();
            });
            Logger.log('DiscountPopup: слушатель на кнопке закрытия установлен');
        }
        
        if (this.container) {
            this.container.addEventListener('click', (e) => {
                if (e.target === this.container) {
                    this.close();
                }
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    checkIfClosed() {
        const isClosed = localStorage.getItem(this.storageKey) === 'true';
        if (isClosed) {
            this.hide();
            Logger.log('DiscountPopup: уже был закрыт');
        } else {
            this.show();
            Logger.log('DiscountPopup: показан впервые');
        }
    }
    
    show() {
        this.isOpen = true;
        if (this.container) {
            this.container.classList.remove('hidden');
            this.container.classList.add('visible');
        }
        Logger.log('DiscountPopup: показан');
    }
    
    hide() {
        this.isOpen = false;
        if (this.container) {
            this.container.classList.remove('visible');
            this.container.classList.add('hidden');
        }
        Logger.log('DiscountPopup: скрыт');
    }
    
    close() {
        this.hide();
        localStorage.setItem(this.storageKey, 'true');
        Logger.log('DiscountPopup: закрыт и сохранён в localStorage');
    }
    
    reopen() {
        localStorage.removeItem(this.storageKey);
        this.show();
        Logger.log('DiscountPopup: повторно показан');
    }
}

window.discountPopup = null;

document.addEventListener('DOMContentLoaded', () => {
    const popup = new DiscountPopup();
    window.discountPopup = popup;
    Logger.log('[DiscountPopup] Инициализирован');
});
