/**
 * UI Tooltip Manager
 * Управление всплывающими подсказками для колонок таблицы
 */

class UITooltipManager {
    constructor() {
        this.currentTooltip = null;
        this.hideTimeout = null;
        this.initializeStyles();
    }

    /**
     * Инициализация CSS стилей для тултипов
     */
    initializeStyles() {
        if (document.getElementById('tooltip-styles')) return;

        const style = document.createElement('style');
        style.id = 'tooltip-styles';
        style.textContent = `
            .custom-tooltip {
                position: fixed;
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                border: 1px solid #475569;
                border-radius: 8px;
                padding: 12px 16px;
                max-width: 400px;
                max-height: 400px;
                overflow-y: auto;
                z-index: 10000;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
                color: #f1f5f9;
                font-size: 0.9rem;
                line-height: 1.5;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s ease-in-out;
            }

            .custom-tooltip.show {
                opacity: 1;
            }

            .custom-tooltip-title {
                font-weight: 700;
                color: #667eea;
                margin-bottom: 8px;
                font-size: 1rem;
                border-bottom: 1px solid #475569;
                padding-bottom: 6px;
            }

            .custom-tooltip-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .custom-tooltip-list li {
                padding: 6px 0;
                border-bottom: 1px solid rgba(71, 85, 105, 0.3);
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
            }

            .custom-tooltip-list li:last-child {
                border-bottom: none;
            }

            .custom-tooltip-video-title {
                flex: 1;
                color: #cbd5e1;
                font-size: 0.85rem;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .custom-tooltip-video-views {
                color: #60a5fa;
                font-weight: 600;
                font-size: 0.9rem;
                white-space: nowrap;
            }

            .custom-tooltip-formula {
                background: rgba(102, 126, 234, 0.1);
                padding: 10px;
                border-radius: 6px;
                font-family: 'Courier New', monospace;
                color: #a78bfa;
                text-align: center;
                font-size: 1rem;
            }

            .custom-tooltip-median-row {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 8px;
                margin: 8px 0;
            }

            .custom-tooltip-median-value {
                padding: 6px 10px;
                background: rgba(148, 163, 184, 0.2);
                border-radius: 4px;
                font-size: 0.85rem;
                color: #cbd5e1;
            }

            .custom-tooltip-median-value.highlight {
                background: rgba(16, 185, 129, 0.3);
                color: #10b981;
                font-weight: 700;
                font-size: 0.95rem;
            }

            .custom-tooltip-description {
                color: #94a3b8;
                font-size: 0.85rem;
                font-style: italic;
                margin-top: 8px;
                text-align: center;
            }

            /* Scrollbar styling */
            .custom-tooltip::-webkit-scrollbar {
                width: 6px;
            }

            .custom-tooltip::-webkit-scrollbar-track {
                background: rgba(15, 23, 42, 0.5);
                border-radius: 3px;
            }

            .custom-tooltip::-webkit-scrollbar-thumb {
                background: #475569;
                border-radius: 3px;
            }

            .custom-tooltip::-webkit-scrollbar-thumb:hover {
                background: #64748b;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Создать тултип с содержимым
     */
    createTooltip(content) {
        this.removeTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.innerHTML = content;
        document.body.appendChild(tooltip);

        this.currentTooltip = tooltip;
        
        // Показать с небольшой задержкой для плавности
        setTimeout(() => {
            if (this.currentTooltip === tooltip) {
                tooltip.classList.add('show');
            }
        }, 50);

        return tooltip;
    }

    /**
     * Удалить текущий тултип
     */
    removeTooltip() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        if (this.currentTooltip) {
            this.currentTooltip.classList.remove('show');
            const tooltipToRemove = this.currentTooltip;
            setTimeout(() => {
                if (tooltipToRemove.parentNode) {
                    tooltipToRemove.parentNode.removeChild(tooltipToRemove);
                }
            }, 200);
            this.currentTooltip = null;
        }
    }

    /**
     * Позиционировать тултип относительно элемента
     */
    positionTooltip(tooltip, targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        let top = rect.bottom + 10;

        // Проверка границ экрана
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }

        // Если не помещается снизу, показать сверху
        if (top + tooltipRect.height > window.innerHeight - 10) {
            top = rect.top - tooltipRect.height - 10;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    /**
     * Показать тултип для колонки "Videos" (Топ-5 видео)
     */
    showVideosTooltip(channel, period, targetElement) {
        const kpis = analyticsEngine.calculateChannelKPIs(channel, period);
        const videos = channel.videos || [];
        
        // Получить видео за период
        const { startDate, endDate } = analyticsEngine.getPeriodDates(period);
        const periodVideos = videos.filter(v => {
            const videoDate = new Date(v.published_at);
            return videoDate >= startDate && videoDate <= endDate;
        });

        // Сортировать по просмотрам и взять топ-5
        const topVideos = periodVideos
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 5);

        if (topVideos.length === 0) {
            const content = `
                <div class="custom-tooltip-title">📹 Топ видео за период</div>
                <div class="custom-tooltip-description">Нет видео за выбранный период</div>
            `;
            const tooltip = this.createTooltip(content);
            this.positionTooltip(tooltip, targetElement);
            return;
        }

        const videosList = topVideos.map((video, index) => `
            <li>
                <span class="custom-tooltip-video-title">${index + 1}. ${this.escapeHtml(video.title)}</span>
                <span class="custom-tooltip-video-views">${analyticsEngine.formatNumber(video.views || 0)}</span>
            </li>
        `).join('');

        const content = `
            <div class="custom-tooltip-title">📹 Топ-${topVideos.length} видео за период</div>
            <ul class="custom-tooltip-list">
                ${videosList}
            </ul>
        `;

        const tooltip = this.createTooltip(content);
        this.positionTooltip(tooltip, targetElement);
    }

    /**
     * Показать тултип для колонки "Views" (Топ-20 значений)
     */
    showViewsTooltip(channel, period, targetElement) {
        const videos = channel.videos || [];
        
        // Получить видео за период
        const { startDate, endDate } = analyticsEngine.getPeriodDates(period);
        const periodVideos = videos.filter(v => {
            const videoDate = new Date(v.published_at);
            return videoDate >= startDate && videoDate <= endDate;
        });

        // Сортировать по просмотрам и взять топ-20
        const topVideos = periodVideos
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 20);

        if (topVideos.length === 0) {
            const content = `
                <div class="custom-tooltip-title">👁️ Слагаемые суммы просмотров</div>
                <div class="custom-tooltip-description">Нет видео за выбранный период</div>
            `;
            const tooltip = this.createTooltip(content);
            this.positionTooltip(tooltip, targetElement);
            return;
        }

        const viewsList = topVideos.map((video, index) => `
            <li>
                <span class="custom-tooltip-video-title">${index + 1}.</span>
                <span class="custom-tooltip-video-views">${analyticsEngine.formatNumber(video.views || 0)}</span>
            </li>
        `).join('');

        const totalViews = topVideos.reduce((sum, v) => sum + (v.views || 0), 0);
        const allViews = periodVideos.reduce((sum, v) => sum + (v.views || 0), 0);

        const content = `
            <div class="custom-tooltip-title">👁️ Топ-${topVideos.length} просмотров (из ${periodVideos.length})</div>
            <ul class="custom-tooltip-list">
                ${viewsList}
            </ul>
            <div class="custom-tooltip-description">
                Сумма топ-${topVideos.length}: ${analyticsEngine.formatNumber(totalViews)}<br>
                Всего за период: ${analyticsEngine.formatNumber(allViews)}
            </div>
        `;

        const tooltip = this.createTooltip(content);
        this.positionTooltip(tooltip, targetElement);
    }

    /**
     * Показать тултип для колонки "Median" (Визуализация расчета медианы)
     */
    showMedianTooltip(channel, period, targetElement) {
        const videos = channel.videos || [];
        
        // Получить видео за период
        const { startDate, endDate } = analyticsEngine.getPeriodDates(period);
        const periodVideos = videos.filter(v => {
            const videoDate = new Date(v.published_at);
            return videoDate >= startDate && videoDate <= endDate;
        });

        if (periodVideos.length === 0) {
            const content = `
                <div class="custom-tooltip-title">📊 Расчет медианы</div>
                <div class="custom-tooltip-description">Нет видео за выбранный период</div>
            `;
            const tooltip = this.createTooltip(content);
            this.positionTooltip(tooltip, targetElement);
            return;
        }

        // Сортировать просмотры
        const sortedViews = periodVideos
            .map(v => v.views || 0)
            .sort((a, b) => a - b);

        // Найти медиану
        const mid = Math.floor(sortedViews.length / 2);
        const median = sortedViews.length % 2 === 0
            ? (sortedViews[mid - 1] + sortedViews[mid]) / 2
            : sortedViews[mid];

        // Показать ряд чисел с выделением медианы
        let medianRow = '';
        const maxDisplay = 15; // Максимум чисел для отображения
        
        if (sortedViews.length <= maxDisplay) {
            medianRow = sortedViews.map((value, index) => {
                const isMedian = sortedViews.length % 2 === 0
                    ? (index === mid - 1 || index === mid)
                    : (index === mid);
                
                return `<span class="custom-tooltip-median-value ${isMedian ? 'highlight' : ''}">${analyticsEngine.formatNumber(value)}</span>`;
            }).join('');
        } else {
            // Показать первые 3, медиану и последние 3
            const start = sortedViews.slice(0, 3);
            const end = sortedViews.slice(-3);
            const medianValues = sortedViews.length % 2 === 0
                ? [sortedViews[mid - 1], sortedViews[mid]]
                : [sortedViews[mid]];

            medianRow = [
                ...start.map(v => `<span class="custom-tooltip-median-value">${analyticsEngine.formatNumber(v)}</span>`),
                '<span class="custom-tooltip-median-value">...</span>',
                ...medianValues.map(v => `<span class="custom-tooltip-median-value highlight">${analyticsEngine.formatNumber(v)}</span>`),
                '<span class="custom-tooltip-median-value">...</span>',
                ...end.map(v => `<span class="custom-tooltip-median-value">${analyticsEngine.formatNumber(v)}</span>`)
            ].join('');
        }

        const content = `
            <div class="custom-tooltip-title">📊 Расчет медианы (${sortedViews.length} видео)</div>
            <div class="custom-tooltip-median-row">
                ${medianRow}
            </div>
            <div class="custom-tooltip-description">
                Медиана: ${analyticsEngine.formatNumber(median)}<br>
                ${sortedViews.length % 2 === 0 ? 'Среднее двух центральных значений' : 'Центральное значение отсортированного ряда'}
            </div>
        `;

        const tooltip = this.createTooltip(content);
        this.positionTooltip(tooltip, targetElement);
    }

    /**
     * Показать тултип для колонки "Frequency" (Формула расчета)
     */
    showFrequencyTooltip(channel, period, targetElement) {
        const kpis = analyticsEngine.calculateChannelKPIs(channel, period);
        const videoCount = kpis.currentPeriod.videoCount;
        const days = period * 30; // Приблизительное количество дней
        const perWeek = analyticsEngine.calculateVideosPerWeek(videoCount, period);

        const content = `
            <div class="custom-tooltip-title">📅 Формула частоты публикаций</div>
            <div class="custom-tooltip-formula">
                (${videoCount} видео / ${days} дней) × 7 = ${perWeek}
            </div>
            <div class="custom-tooltip-description">
                Среднее количество видео в неделю<br>
                за период ${period} ${period === 1 ? 'месяц' : period < 5 ? 'месяца' : 'месяцев'}
            </div>
        `;

        const tooltip = this.createTooltip(content);
        this.positionTooltip(tooltip, targetElement);
    }

    /**
     * Показать тултип для колонки "Engagement" (Топ-5 по вовлеченности)
     */
    showEngagementTooltip(channel, period, targetElement) {
        const videos = channel.videos || [];
        
        // Получить видео за период
        const { startDate, endDate } = analyticsEngine.getPeriodDates(period);
        const periodVideos = videos.filter(v => {
            const videoDate = new Date(v.published_at);
            return videoDate >= startDate && videoDate <= endDate;
        });

        if (periodVideos.length === 0) {
            const content = `
                <div class="custom-tooltip-title">❤️ Топ по вовлеченности</div>
                <div class="custom-tooltip-description">Нет видео за выбранный период</div>
            `;
            const tooltip = this.createTooltip(content);
            this.positionTooltip(tooltip, targetElement);
            return;
        }

        // Рассчитать вовлеченность и отсортировать
        const videosWithEngagement = periodVideos.map(v => ({
            ...v,
            engagement: (v.likes || 0) + (v.comments || 0)
        })).sort((a, b) => b.engagement - a.engagement);

        // Взять топ-5
        const topVideos = videosWithEngagement.slice(0, 5);

        const videosList = topVideos.map((video, index) => `
            <li>
                <span class="custom-tooltip-video-title">${index + 1}. ${this.escapeHtml(video.title)}</span>
                <span class="custom-tooltip-video-views">${analyticsEngine.formatNumber(video.engagement)}</span>
            </li>
        `).join('');

        const kpis = analyticsEngine.calculateChannelKPIs(channel, period);
        const medianEngagement = kpis.currentPeriod.medianEngagement || 0;

        const content = `
            <div class="custom-tooltip-title">❤️ Топ-${topVideos.length} по вовлеченности</div>
            <ul class="custom-tooltip-list">
                ${videosList}
            </ul>
            <div class="custom-tooltip-description">
                Вовлеченность = Лайки + Комментарии<br>
                Медиана: ${analyticsEngine.formatNumber(medianEngagement)}
            </div>
        `;

        const tooltip = this.createTooltip(content);
        this.positionTooltip(tooltip, targetElement);
    }

    /**
     * Настроить обработчики событий для ячейки
     */
    attachTooltipHandlers(element, tooltipType, channel, period) {
        let isHovering = false;

        element.addEventListener('mouseenter', (e) => {
            isHovering = true;
            
            // Задержка перед показом
            this.hideTimeout = setTimeout(() => {
                if (isHovering) {
                    switch (tooltipType) {
                        case 'videos':
                            this.showVideosTooltip(channel, period, element);
                            break;
                        case 'views':
                            this.showViewsTooltip(channel, period, element);
                            break;
                        case 'median':
                            this.showMedianTooltip(channel, period, element);
                            break;
                        case 'engagement':
                            this.showEngagementTooltip(channel, period, element);
                            break;
                        case 'frequency':
                            this.showFrequencyTooltip(channel, period, element);
                            break;
                    }
                }
            }, 300);
        });

        element.addEventListener('mouseleave', () => {
            isHovering = false;
            if (this.hideTimeout) {
                clearTimeout(this.hideTimeout);
                this.hideTimeout = null;
            }
            this.removeTooltip();
        });

        // Обновление позиции при движении мыши
        element.addEventListener('mousemove', (e) => {
            if (this.currentTooltip && isHovering) {
                this.positionTooltip(this.currentTooltip, element);
            }
        });
    }

    /**
     * Экранирование HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Создать глобальный экземпляр
const tooltipManager = new UITooltipManager();
