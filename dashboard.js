/**
 * Dashboard Main Module
 * Handles UI rendering and interactions
 */

class Dashboard {
    constructor() {
        this.currentPeriod = 1; // months
        this.channels = [];
        this.charts = {};
        this.selectedChannels = new Set(); // Track selected channel IDs
        this.sortColumn = null;
        this.sortDirection = 'desc';
        this.initializeEventListeners();
    }

    async initialize() {
        try {
            // Show loading indicator
            this.updateLoadingStatus(true);

            // Load data
            this.channels = await dataLoader.loadChannels();
            
            // Set reference date in analytics engine
            analyticsEngine.setReferenceDate(this.channels);

            // Hide loading indicator
            this.updateLoadingStatus(false);

            // Render dashboard
            this.renderDashboard();
            this.updatePeriodDateLabel();
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            this.updateLoadingStatus(false, 'Failed to load channels');
        }
    }

    /**
     * Update loading indicator
     */
    updateLoadingStatus(isLoading, message = 'Loading channels...') {
        const indicator = document.getElementById('loadingIndicator');
        if (isLoading) {
            indicator.style.display = 'flex';
            indicator.innerHTML = '<span class="spinner"></span> ' + message;
        } else {
            indicator.style.display = 'none';
        }
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Period selector buttons
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentPeriod = parseInt(e.target.dataset.period);
                this.updatePeriodDateLabel();
                this.renderDashboard();
            });
        });

        // Select All checkbox
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.handleSelectAll(e.target.checked);
            });
        }
        
        // Sortable column headers
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', (e) => {
                const sortColumn = e.currentTarget.dataset.sort;
                this.handleSort(sortColumn);
            });
        });

        // Modal close button
        const modalClose = document.getElementById('modalClose');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }

        // Modal close on background click
        const modal = document.getElementById('channelModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // Tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Projection checkbox
        const projectionCheckbox = document.getElementById('projectionCheckbox');
        if (projectionCheckbox) {
            projectionCheckbox.addEventListener('change', () => {
                // Re-render analytics charts when projection setting changes
                const modal = document.getElementById('channelModal');
                if (modal && modal.classList.contains('active')) {
                    // Find current channel
                    const channelName = document.getElementById('modalChannelName')?.textContent;
                    if (channelName) {
                        const channel = this.channels.find(ch => ch.channel_name === channelName);
                        if (channel) {
                            this.renderModalVolumeActivityChart(channel);
                            this.renderModalContentQualityChart(channel);
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Handle select all checkbox
     */
    handleSelectAll(checked) {
        if (checked) {
            this.channels.forEach(ch => this.selectedChannels.add(ch.channel_id));
        } else {
            this.selectedChannels.clear();
        }
        
        // Update individual checkboxes
        document.querySelectorAll('.channel-checkbox').forEach(cb => {
            cb.checked = checked;
        });
        
        // Update summary and charts
        this.renderGlobalSummary();
        this.renderCharts();
    }
    
    /**
     * Handle individual checkbox change
     */
    handleChannelCheckbox(channelId, checked) {
        if (checked) {
            this.selectedChannels.add(channelId);
        } else {
            this.selectedChannels.delete(channelId);
        }
        
        // Update select all checkbox state
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = this.selectedChannels.size === this.channels.length;
            selectAllCheckbox.indeterminate = this.selectedChannels.size > 0 && this.selectedChannels.size < this.channels.length;
        }
        
        // Update summary and charts
        this.renderGlobalSummary();
        this.renderCharts();
    }
    
    /**
     * Get filtered channels based on selection
     */
    getFilteredChannels() {
        if (this.selectedChannels.size === 0) {
            // If nothing selected, return all channels
            return this.channels;
        }
        return this.channels.filter(ch => this.selectedChannels.has(ch.channel_id));
    }
    
    /**
     * Handle column sorting
     */
    handleSort(column) {
        if (this.sortColumn === column) {
            // Toggle direction
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'desc';
        }
        
        // Sort channels array
        this.sortChannels();
        
        // Re-render table
        this.renderChannelsTable();
        
        // Update sort indicators
        this.updateSortIndicators();
    }
    
    /**
     * Sort channels array
     */
    sortChannels() {
        this.channels.sort((a, b) => {
            let valA, valB;
            
            switch (this.sortColumn) {
                case 'channel':
                    valA = a.channel_name.toLowerCase();
                    valB = b.channel_name.toLowerCase();
                    return this.sortDirection === 'asc' 
                        ? valA.localeCompare(valB)
                        : valB.localeCompare(valA);
                
                case 'genre':
                    // Sort by main genre only
                    const mainGenreA = (a.style || '').split('/')[0].trim().toLowerCase();
                    const mainGenreB = (b.style || '').split('/')[0].trim().toLowerCase();
                    return this.sortDirection === 'asc'
                        ? mainGenreA.localeCompare(mainGenreB)
                        : mainGenreB.localeCompare(mainGenreA);
                
                case 'subscribers':
                    valA = a.subscribers || 0;
                    valB = b.subscribers || 0;
                    return this.sortDirection === 'asc' ? valA - valB : valB - valA;
                
                case 'videos':
                    const kpisA = analyticsEngine.calculateChannelKPIs(a, this.currentPeriod);
                    const kpisB = analyticsEngine.calculateChannelKPIs(b, this.currentPeriod);
                    valA = kpisA.currentPeriod.videoCount;
                    valB = kpisB.currentPeriod.videoCount;
                    return this.sortDirection === 'asc' ? valA - valB : valB - valA;
                
                case 'views':
                    const viewsKpisA = analyticsEngine.calculateChannelKPIs(a, this.currentPeriod);
                    const viewsKpisB = analyticsEngine.calculateChannelKPIs(b, this.currentPeriod);
                    valA = viewsKpisA.currentPeriod.totalViews;
                    valB = viewsKpisB.currentPeriod.totalViews;
                    return this.sortDirection === 'asc' ? valA - valB : valB - valA;
                
                case 'median':
                    const medianKpisA = analyticsEngine.calculateChannelKPIs(a, this.currentPeriod);
                    const medianKpisB = analyticsEngine.calculateChannelKPIs(b, this.currentPeriod);
                    valA = medianKpisA.currentPeriod.medianViews;
                    valB = medianKpisB.currentPeriod.medianViews;
                    return this.sortDirection === 'asc' ? valA - valB : valB - valA;
                
                case 'engagement':
                    const engagementKpisA = analyticsEngine.calculateChannelKPIs(a, this.currentPeriod);
                    const engagementKpisB = analyticsEngine.calculateChannelKPIs(b, this.currentPeriod);
                    valA = engagementKpisA.currentPeriod.medianEngagement;
                    valB = engagementKpisB.currentPeriod.medianEngagement;
                    return this.sortDirection === 'asc' ? valA - valB : valB - valA;
                
                case 'frequency':
                    const freqKpisA = analyticsEngine.calculateChannelKPIs(a, this.currentPeriod);
                    const freqKpisB = analyticsEngine.calculateChannelKPIs(b, this.currentPeriod);
                    valA = parseFloat(analyticsEngine.calculateVideosPerWeek(freqKpisA.currentPeriod.videoCount, this.currentPeriod));
                    valB = parseFloat(analyticsEngine.calculateVideosPerWeek(freqKpisB.currentPeriod.videoCount, this.currentPeriod));
                    return this.sortDirection === 'asc' ? valA - valB : valB - valA;
                
                default:
                    return 0;
            }
        });
    }
    
    /**
     * Update sort indicators in table headers
     */
    updateSortIndicators() {
        document.querySelectorAll('.sortable').forEach(header => {
            const indicator = header.querySelector('.sort-indicator');
            const column = header.dataset.sort;
            
            if (column === this.sortColumn) {
                indicator.textContent = this.sortDirection === 'asc' ? ' ▲' : ' ▼';
            } else {
                indicator.textContent = '';
            }
        });
    }

    /**
     * Main render function
     */
    renderDashboard() {
        this.renderChannelsTable();
        this.renderGlobalSummary();
        this.renderCharts();
    }

    /**
     * Update period date label in header based on reference date
     */
    updatePeriodDateLabel() {
        const el = document.getElementById('periodDateLabel');
        if (!el) return;
        const { startDate, endDate } = analyticsEngine.getPeriodDates(this.currentPeriod);
        const fmt = (d) => d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
        el.textContent = `${fmt(startDate)} - ${fmt(endDate)}`;
    }

    /**
     * Render channels comparison table
     */
    renderChannelsTable() {
        const genreMapping = {
            'Auto': '🚗',
            'Dance': '💃',
            'News': '📰',
            'Retro': '📻',
            'Chanson': '🎸',
            // ...additional genres...
        };

        const tbody = document.getElementById('channelsTableBody');
        tbody.innerHTML = '';

        // Calculate heatmap ranges for all columns
        const ranges = this.calculateHeatmapRanges();

        this.channels.forEach(channel => {
            const kpis = analyticsEngine.calculateChannelKPIs(channel, this.currentPeriod);
            const comparison = kpis.comparison;
            const currentPeriod = kpis.currentPeriod;
            const previousPeriod = kpis.previousPeriod;

            // Check for new channel
            const isNewChannel = !previousPeriod.hasData && currentPeriod.hasData;
            const isChecked = this.selectedChannels.has(channel.channel_id);

            // Split style into main genre and sub-genre
            const rawStyle = channel.style || '';
            const parts = rawStyle.split('/');
            const mainGenre = parts[0] ? parts[0].trim() : '';
            const subGenre = parts.slice(1).join(' / ').trim();
            
            // Extract icon from emoji field (single emoji for Icon column)
            let styleIcon = channel.emoji || '';
            // Apply encoding fix for broken characters
            if (styleIcon && (styleIcon.includes('\uFFFD') || styleIcon.includes('?'))) {
                styleIcon = '';
            }
            // Fallback to genre mapping if no valid emoji
            if (!styleIcon) {
                styleIcon = genreMapping[mainGenre] || '🎵'; // Default icon
            }

            // Clean channel name - remove emojis
            const cleanChannelName = this.removeEmojis(channel.channel_name);
            
            // Build display name with emojis prefix (multiple emojis for Channel column)
            const channelEmojis = channel.emojis || '';
            const displayChannelName = channelEmojis ? `${channelEmojis} ${cleanChannelName}` : cleanChannelName;

            // Subscribers: Dynamic font size and weight, single color
            const subCount = channel.subscribers || 0;
            const subFontStyle = this.getSubscriberFontStyle(subCount);
            const subStyleStr = `font-size: ${subFontStyle.fontSize}; font-weight: ${subFontStyle.fontWeight}; opacity: ${subFontStyle.opacity}; color: var(--text-primary); line-height: 1.2;`;

            // Videos: Heatmap color
            const videosCount = currentPeriod.videoCount || 0;
            const videosColor = this.calculateHeatmapColor(videosCount, ranges.videos.min, ranges.videos.max);
            const videosStyleStr = `color: ${videosColor}; font-weight: 600;`;

            // Views: Heatmap color
            const viewsCount = currentPeriod.totalViews || 0;
            const viewsColor = this.calculateHeatmapColor(viewsCount, ranges.views.min, ranges.views.max);
            const viewsStyleStr = `color: ${viewsColor}; font-weight: 600;`;

            // Median: Heatmap color
            const medianCount = currentPeriod.medianViews || 0;
            const medianColor = this.calculateHeatmapColor(medianCount, ranges.median.min, ranges.median.max);
            const medianStyleStr = `color: ${medianColor}; font-weight: 600;`;

            // Engagement: Heatmap color
            const engagementMedian = currentPeriod.medianEngagement || 0;
            const engagementMax = currentPeriod.maxEngagement || 0;
            const engagementColor = this.calculateHeatmapColor(engagementMedian, ranges.engagement.min, ranges.engagement.max);
            const engagementStyleStr = `color: ${engagementColor}; font-weight: 600;`;

            // Frequency: Heatmap color
            const frequencyValue = parseFloat(analyticsEngine.calculateVideosPerWeek(currentPeriod.videoCount, this.currentPeriod));
            const frequencyColor = this.calculateHeatmapColor(frequencyValue, ranges.frequency.min, ranges.frequency.max);
            const frequencyStyleStr = `color: ${frequencyColor}; font-weight: 600;`;

            // Build row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="col-checkbox">
                    <input type="checkbox" 
                           class="channel-checkbox" 
                           data-channel-id="${channel.channel_id}"
                           ${isChecked ? 'checked' : ''}>
                </td>
                <td class="col-channel">
                    <span class="channel-name-cell" onclick="dashboard.openChannelModal('${channel.channel_id}')" style="display: flex; align-items: center; gap: 8px;">
                        ${channel.thumbnail_url ? `<img src="${this.escapeHtml(channel.thumbnail_url)}" alt="" style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0;">` : ''}
                        ${channelEmojis ? `<span style="font-size: 1rem;">${channelEmojis}</span>` : ''}
                        <span style="font-weight: 600; color: var(--text-primary);">${this.escapeHtml(cleanChannelName)}</span>
                    </span>
                </td>
                <td class="col-icon" style="text-align: center; font-size: 1.8rem;">
                    ${styleIcon}
                </td>
                <td class="col-genre">
                    <div class="genre-cell">
                        <div class="main-genre" data-genre="${this.escapeHtml(mainGenre)}" style="font-weight: 700; color: var(--text-primary); cursor: pointer;">
                            ${this.escapeHtml(mainGenre)}
                        </div>
                        ${subGenre ? `<div class="sub-genre" style="color: #94a3b8; font-size: 0.85rem; margin-top: 2px;">${this.escapeHtml(subGenre)}</div>` : ''}
                    </div>
                </td>
                <td class="col-subscribers">
                    <div class="kpi-cell-subscribers">
                        <span class="kpi-value-large" style="${subStyleStr}">${analyticsEngine.formatNumber(channel.subscribers)}</span>
                    </div>
                </td>
                <td class="col-videos" data-tooltip="videos">
                    <div class="kpi-cell">
                        <span class="kpi-value" style="${videosStyleStr}">${currentPeriod.videoCount} 🎬</span>
                        ${this._renderChangeIndicator(comparison.videoCountChange, 'videos', isNewChannel, currentPeriod.videoCount, previousPeriod.videoCount)}
                    </div>
                </td>
                <td class="col-views" data-tooltip="views">
                    <div class="kpi-cell">
                        ${currentPeriod.hasData 
                            ? `<span class="kpi-value" style="${viewsStyleStr}">${analyticsEngine.formatNumber(currentPeriod.totalViews)}</span>`
                            : `<span class="kpi-value pause-icon">⏸</span>`
                        }
                        ${this._renderChangeIndicator(comparison.viewsChange, 'views', isNewChannel, currentPeriod.totalViews, previousPeriod.totalViews)}
                    </div>
                </td>
                <td class="col-median" data-tooltip="median">
                    <div class="kpi-cell">
                        <span class="kpi-value" style="${medianStyleStr}">${analyticsEngine.formatNumber(currentPeriod.medianViews)}</span>
                        ${this._renderChangeIndicator(comparison.medianViewsChange, 'medianViews', isNewChannel, currentPeriod.medianViews, previousPeriod.medianViews)}
                    </div>
                </td>
                <td class="col-engagement" data-tooltip="engagement">
                    <div class="kpi-cell">
                        <span class="kpi-value" style="${engagementStyleStr}">${engagementMedian.toLocaleString()}</span>
                        <small style="color: #888; margin-left: 4px;">(Max: ${engagementMax.toLocaleString()})</small>
                        ${this._renderChangeIndicator(comparison.medianEngagementChange, 'engagement', isNewChannel, currentPeriod.medianEngagement, previousPeriod.medianEngagement)}
                    </div>
                </td>
                <td class="col-frequency" data-tooltip="frequency">
                    <div class="kpi-cell">
                        <span class="kpi-value" style="${frequencyStyleStr}">${analyticsEngine.calculateVideosPerWeek(currentPeriod.videoCount, this.currentPeriod)}</span>
                        <span class="kpi-change neutral">per week</span>
                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });
        
        // Add checkbox event listeners
        document.querySelectorAll('.channel-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const channelId = e.target.dataset.channelId;
                this.handleChannelCheckbox(channelId, e.target.checked);
            });
        });

        // Add genre filter click handlers
        document.querySelectorAll('.main-genre').forEach(genreElement => {
            genreElement.addEventListener('click', (e) => {
                const genre = e.target.dataset.genre;
                if (genre) {
                    this.filterByGenre(genre);
                }
            });
        });

        // Add tooltip handlers for KPI columns
        document.querySelectorAll('[data-tooltip="videos"]').forEach((cell, index) => {
            const channel = this.channels[index];
            if (channel) {
                tooltipManager.attachTooltipHandlers(cell, 'videos', channel, this.currentPeriod);
            }
        });

        document.querySelectorAll('[data-tooltip="views"]').forEach((cell, index) => {
            const channel = this.channels[index];
            if (channel) {
                tooltipManager.attachTooltipHandlers(cell, 'views', channel, this.currentPeriod);
            }
        });

        document.querySelectorAll('[data-tooltip="median"]').forEach((cell, index) => {
            const channel = this.channels[index];
            if (channel) {
                tooltipManager.attachTooltipHandlers(cell, 'median', channel, this.currentPeriod);
            }
        });

        document.querySelectorAll('[data-tooltip="engagement"]').forEach((cell, index) => {
            const channel = this.channels[index];
            if (channel) {
                tooltipManager.attachTooltipHandlers(cell, 'engagement', channel, this.currentPeriod);
            }
        });

        document.querySelectorAll('[data-tooltip="frequency"]').forEach((cell, index) => {
            const channel = this.channels[index];
            if (channel) {
                tooltipManager.attachTooltipHandlers(cell, 'frequency', channel, this.currentPeriod);
            }
        });
    }

    /**
     * Render change indicator with color coding
     */
    _renderChangeIndicator(change, kpiType, isNewChannel, currentValue, previousValue) {
        if (isNewChannel) {
            return '<span class="kpi-change new" title="Ранее данных не было">🆕 NEW</span>';
        }

        const status = analyticsEngine.getChangeStatus(change, kpiType);
        const changeText = analyticsEngine.formatChange(change);
        
        // For videos and engagement, show exact numbers in tooltip
        let curr, prev;
        if (kpiType === 'videos' || kpiType === 'engagement') {
            curr = (currentValue || 0).toLocaleString();
            prev = (previousValue || 0).toLocaleString();
        } else {
            curr = analyticsEngine.formatNumber(currentValue || 0);
            prev = analyticsEngine.formatNumber(previousValue || 0);
        }
        
        const title = `Было: ${prev} → Стало: ${curr}`;

        return `<span class="kpi-change ${status}" title="${title}">${changeText}</span>`;
    }

    /**
     * Render global summary cards
     */
    renderGlobalSummary() {
        const channelsToSummarize = this.getFilteredChannels();
        const summary = analyticsEngine.calculateGlobalSummary(channelsToSummarize, this.currentPeriod);
        const current = summary.currentPeriod;
        const comparison = summary.comparison;

        document.getElementById('summaryTotalVideos').textContent = current.videoCount;
        document.getElementById('summaryVideoChange').textContent = 
            `${this._getSummaryChangeClass(comparison.videoCountChange, 'videos')}${analyticsEngine.formatChange(comparison.videoCountChange)}`;
        document.getElementById('summaryVideoChange').className = 
            `summary-change ${analyticsEngine.getChangeStatus(comparison.videoCountChange, 'videos')}`;

        document.getElementById('summaryTotalViews').textContent = analyticsEngine.formatNumber(current.totalViews);
        document.getElementById('summaryViewsChange').textContent = 
            analyticsEngine.formatChange(comparison.viewsChange);
        document.getElementById('summaryViewsChange').className = 
            `summary-change ${analyticsEngine.getChangeStatus(comparison.viewsChange, 'views')}`;

        document.getElementById('summaryMedianViews').textContent = analyticsEngine.formatNumber(current.medianViews);
        document.getElementById('summaryMedianChange').textContent = 
            analyticsEngine.formatChange(comparison.medianViewsChange);
        document.getElementById('summaryMedianChange').className = 
            `summary-change ${analyticsEngine.getChangeStatus(comparison.medianViewsChange, 'medianViews')}`;

        document.getElementById('summaryAverageViews').textContent = analyticsEngine.formatNumber(current.averageViews);
        document.getElementById('summaryAverageChange').textContent = 
            analyticsEngine.formatChange(comparison.likesChange);
        document.getElementById('summaryAverageChange').className = 
            `summary-change neutral`;
    }

    _getSummaryChangeClass(change, kpiType) {
        return '';
    }

    /**
     * Render all charts
     */
    renderCharts() {
        this.renderViewsOverTimeChart();
        this.renderFrequencyChart();
        this.renderTopChannelsChart();
        this.renderSubscribersChart();
        this.renderMaxEngagementChart();
        this.renderMedianEngagementChart();
    }

    /**
     * Render views over time chart for top 5 channels or selected channels
     */
    renderViewsOverTimeChart() {
        const filteredChannels = this.getFilteredChannels();
        const topChannels = filteredChannels.slice(0, 5);
        const datasets = [];

        const colors = [
            'rgba(102, 126, 234, 1)',
            'rgba(245, 87, 108, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(168, 85, 247, 1)'
        ];

        // Build labels from analytics granularity
        const channelSeries = topChannels.map(ch => analyticsEngine.getViewsOverTime(ch, this.currentPeriod));
        const labelSet = new Set();
        channelSeries.forEach(res => Object.keys(res.series).forEach(k => labelSet.add(k)));
        const labels = Array.from(labelSet).sort((a,b)=> a.localeCompare(b));

        topChannels.forEach((channel, index) => {
            const res = analyticsEngine.getViewsOverTime(channel, this.currentPeriod);
            const values = labels.map(l => res.series[l] || 0);

            datasets.push({
                label: channel.channel_name,
                data: values,
                borderColor: colors[index],
                backgroundColor: colors[index].replace('1)', '0.1)'),
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                channelId: channel.channel_id // Store for click handling
            });
        });

        const ctx = document.getElementById('viewsChart').getContext('2d');
        
        if (this.charts.viewsChart) {
            this.charts.viewsChart.destroy();
        }

        this.charts.viewsChart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                onClick: (event, activeElements) => {
                    if (activeElements.length > 0) {
                        const datasetIndex = activeElements[0].datasetIndex;
                        const channelId = datasets[datasetIndex].channelId;
                        this.openChannelModal(channelId);
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: { 
                            color: '#cbd5e1', 
                            font: { size: 12 },
                            cursor: 'pointer'
                        },
                        onClick: (e, legendItem, legend) => {
                            const index = legendItem.datasetIndex;
                            const channelId = datasets[index].channelId;
                            this.openChannelModal(channelId);
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    }
                }
            }
        });
    }
    
    /**
     * Get month labels for the given period in YYYY-MM format
     */
    _getMonthLabels(months) {
        const labels = [];
        const referenceDate = analyticsEngine.getReferenceDate();

        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(referenceDate);
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            labels.push(monthKey);
        }

        return labels;
    }

    /**
     * Render publishing frequency chart
     */
    renderFrequencyChart() {
        const filteredChannels = this.getFilteredChannels();
        const channelsToShow = filteredChannels.slice(0, 15);
        const channelLabels = channelsToShow.map(ch => ch.channel_name.substring(0, 15));
        const videoCounts = channelsToShow.map(ch => {
            const kpis = analyticsEngine.calculateChannelKPIs(ch, this.currentPeriod);
            return kpis.currentPeriod.videoCount;
        });
        const channelIds = channelsToShow.map(ch => ch.channel_id);

        const ctx = document.getElementById('frequencyChart').getContext('2d');
        
        if (this.charts.frequencyChart) {
            this.charts.frequencyChart.destroy();
        }

        this.charts.frequencyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: channelLabels,
                datasets: [{
                    label: `Videos (${this.currentPeriod} months)`,
                    data: videoCounts,
                    backgroundColor: 'rgba(102, 126, 234, 0.7)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                onClick: (event, activeElements) => {
                    if (activeElements.length > 0) {
                        const index = activeElements[0].index;
                        const channelId = channelIds[index];
                        this.openChannelModal(channelId);
                    }
                },
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    y: {
                        ticks: { color: '#94a3b8' },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    /**
     * Render top 10 channels by views
     */
    renderTopChannelsChart() {
        const filteredChannels = this.getFilteredChannels();
        
        // Calculate views for the selected period and sort by period views
        const channelsWithPeriodViews = filteredChannels.map(ch => {
            const kpis = analyticsEngine.calculateChannelKPIs(ch, this.currentPeriod);
            return {
                channel: ch,
                periodViews: kpis.currentPeriod.totalViews
            };
        });
        
        // Sort by period views and take top 10
        channelsWithPeriodViews.sort((a, b) => b.periodViews - a.periodViews);
        const topChannels = channelsWithPeriodViews.slice(0, 10);
        
        const labels = topChannels.map(item => item.channel.channel_name.substring(0, 12));
        const data = topChannels.map(item => item.periodViews);
        const channelIds = topChannels.map(item => item.channel.channel_id);

        const ctx = document.getElementById('topChannelsChart').getContext('2d');
        
        if (this.charts.topChannelsChart) {
            this.charts.topChannelsChart.destroy();
        }

        this.charts.topChannelsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(245, 87, 108, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(168, 85, 247, 0.8)',
                        'rgba(236, 72, 153, 0.8)',
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(29, 185, 84, 0.8)',
                        'rgba(249, 115, 22, 0.8)'
                    ],
                    borderColor: '#1e293b',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                onClick: (event, activeElements) => {
                    if (activeElements.length > 0) {
                        const index = activeElements[0].index;
                        const channelId = channelIds[index];
                        this.openChannelModal(channelId);
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: { 
                            color: '#cbd5e1', 
                            font: { size: 11 }, 
                            padding: 15
                        },
                        onClick: (e, legendItem, legend) => {
                            const index = legendItem.index;
                            const channelId = channelIds[index];
                            this.openChannelModal(channelId);
                        }
                    }
                }
            }
        });
    }

    /**
     * Render subscribers distribution with logarithmic scale
     */
    renderSubscribersChart() {
        const filteredChannels = this.getFilteredChannels();
        const topChannels = filteredChannels.slice(0, 10);
        const labels = topChannels.map(ch => ch.channel_name.substring(0, 15));
        const data = topChannels.map(ch => ch.subscribers);
        const channelIds = topChannels.map(ch => ch.channel_id);

        const ctx = document.getElementById('subscribersChart').getContext('2d');
        
        if (this.charts.subscribersChart) {
            this.charts.subscribersChart.destroy();
        }

        this.charts.subscribersChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Subscribers',
                    data,
                    backgroundColor: 'rgba(245, 87, 108, 0.7)',
                    borderColor: 'rgba(245, 87, 108, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                onClick: (event, activeElements) => {
                    if (activeElements.length > 0) {
                        const index = activeElements[0].index;
                        const channelId = channelIds[index];
                        this.openChannelModal(channelId);
                    }
                },
                plugins: { 
                    legend: { display: false }
                },
                scales: {
                    y: {
                        type: 'logarithmic',
                        beginAtZero: false,
                        ticks: { 
                            color: '#94a3b8',
                            callback: function(value) {
                                return analyticsEngine.formatNumber(value);
                            }
                        },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    /**
     * Render Max Engagement Chart - Top 10 channels by max engagement per video
     */
    renderMaxEngagementChart() {
        const filteredChannels = this.getFilteredChannels();
        
        // Calculate engagement metrics for each channel
        const channelsWithEngagement = filteredChannels.map(ch => {
            const kpis = analyticsEngine.calculateChannelKPIs(ch, this.currentPeriod);
            return {
                channel: ch,
                maxEngagement: kpis.currentPeriod.maxEngagement || 0
            };
        });
        
        // Sort by max engagement and take top 10
        channelsWithEngagement.sort((a, b) => b.maxEngagement - a.maxEngagement);
        const topChannels = channelsWithEngagement.slice(0, 10);
        
        const labels = topChannels.map(item => item.channel.channel_name.substring(0, 20));
        const data = topChannels.map(item => item.maxEngagement);
        const channelIds = topChannels.map(item => item.channel.channel_id);

        const ctx = document.getElementById('maxEngagementChart').getContext('2d');
        
        if (this.charts.maxEngagementChart) {
            this.charts.maxEngagementChart.destroy();
        }

        this.charts.maxEngagementChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Max Engagement',
                    data,
                    backgroundColor: 'rgba(168, 85, 247, 0.7)',
                    borderColor: 'rgba(168, 85, 247, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                onClick: (event, activeElements) => {
                    if (activeElements.length > 0) {
                        const index = activeElements[0].index;
                        const channelId = channelIds[index];
                        this.openChannelModal(channelId);
                    }
                },
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Max Engagement: ' + context.parsed.x.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { 
                            color: '#94a3b8',
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    y: {
                        ticks: { color: '#94a3b8' },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    /**
     * Render Median Engagement Chart - Top 10 channels by median engagement
     */
    renderMedianEngagementChart() {
        const filteredChannels = this.getFilteredChannels();
        
        // Calculate engagement metrics for each channel
        const channelsWithEngagement = filteredChannels.map(ch => {
            const kpis = analyticsEngine.calculateChannelKPIs(ch, this.currentPeriod);
            return {
                channel: ch,
                medianEngagement: kpis.currentPeriod.medianEngagement || 0
            };
        });
        
        // Sort by median engagement and take top 10
        channelsWithEngagement.sort((a, b) => b.medianEngagement - a.medianEngagement);
        const topChannels = channelsWithEngagement.slice(0, 10);
        
        const labels = topChannels.map(item => item.channel.channel_name.substring(0, 20));
        const data = topChannels.map(item => item.medianEngagement);
        const channelIds = topChannels.map(item => item.channel.channel_id);

        const ctx = document.getElementById('medianEngagementChart').getContext('2d');
        
        if (this.charts.medianEngagementChart) {
            this.charts.medianEngagementChart.destroy();
        }

        this.charts.medianEngagementChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Median Engagement',
                    data,
                    backgroundColor: 'rgba(236, 72, 153, 0.7)',
                    borderColor: 'rgba(236, 72, 153, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                onClick: (event, activeElements) => {
                    if (activeElements.length > 0) {
                        const index = activeElements[0].index;
                        const channelId = channelIds[index];
                        this.openChannelModal(channelId);
                    }
                },
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Median Engagement: ' + context.parsed.x.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { 
                            color: '#94a3b8',
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    y: {
                        ticks: { color: '#94a3b8' },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    /**
     * Open channel detail modal
     */
    openChannelModal(channelId) {
        const channel = dataLoader.getChannelById(channelId);
        if (!channel) return;

        const modal = document.getElementById('channelModal');
        
        // Fill header
        document.getElementById('modalChannelName').textContent = channel.channel_name;
        document.getElementById('modalChannelEmojis').textContent = channel.emojis;
        document.getElementById('modalChannelId').textContent = channel.channel_id;
        document.getElementById('modalChannelLink').href = `https://www.youtube.com/channel/${channel.channel_id}`;

        // Fill overview tab
        document.getElementById('modalDescription').textContent = channel.description;
        document.getElementById('modalStyle').textContent = channel.style;
        document.getElementById('modalSubscribers').textContent = analyticsEngine.formatNumber(channel.subscribers);
        document.getElementById('modalTotalVideos').textContent = channel.videos.length;
        document.getElementById('modalTotalViews').textContent = analyticsEngine.formatNumber(channel.total_views);
        document.getElementById('modalCreatedAt').textContent = new Date(channel.created_at).toLocaleDateString();

        // Fill period comparison
        this.renderPeriodsComparison(channel);

        // Fill videos tab
        this.renderChannelVideos(channel);

        // Fill analytics tab
        this.renderChannelAnalytics(channel);

        // Show modal
        modal.classList.add('active');
    }

    /**
     * Render periods comparison in modal
     */
    renderPeriodsComparison(channel) {
        const container = document.getElementById('periodsComparison');
        container.innerHTML = '';

        const periods = [1, 3, 6];
        periods.forEach(months => {
            const kpis = analyticsEngine.calculateChannelKPIs(channel, months);
            const current = kpis.currentPeriod;
            const comparison = kpis.comparison;

            const periodDiv = document.createElement('div');
            periodDiv.className = 'period-item';
            periodDiv.innerHTML = `
                <h4>${months}-Month Period</h4>
                <div class="period-metrics">
                    <div class="period-metric">
                        <span class="period-metric-label">Videos</span>
                        <span class="period-metric-value">${current.videoCount}</span>
                    </div>
                    <div class="period-metric">
                        <span class="period-metric-label">Views</span>
                        <span class="period-metric-value">${analyticsEngine.formatNumber(current.totalViews)}</span>
                    </div>
                    <div class="period-metric">
                        <span class="period-metric-label">Median Views</span>
                        <span class="period-metric-value">${analyticsEngine.formatNumber(current.medianViews)}</span>
                    </div>
                    <div class="period-metric">
                        <span class="period-metric-label">Change</span>
                        <span class="period-metric-value">${analyticsEngine.formatChange(comparison.viewsChange)}</span>
                    </div>
                </div>
            `;
            container.appendChild(periodDiv);
        });
    }

    /**
     * Render channel videos in modal
     */
    renderChannelVideos(channel) {
        const topViewsList = document.getElementById('topVideosList');
        const topEngagementList = document.getElementById('topEngagementList');

        const topByViews = analyticsEngine.getTopVideosByMetric(channel, 'views', 6, 5);
        const topByEngagement = analyticsEngine.getTopVideosByMetric(channel, 'engagement', 6, 5);

        topViewsList.innerHTML = topByViews.map(video => this._renderVideoItem(video)).join('');
        topEngagementList.innerHTML = topByEngagement.map(video => this._renderVideoItem(video)).join('');
    }

    /**
     * Render single video item
     */
    _renderVideoItem(video) {
        const engagement = (video.likes || 0) + (video.comments || 0);
        return `
            <a href="${video.url}" target="_blank" class="video-item">
                <div class="video-title">${this.escapeHtml(video.title)}</div>
                <div class="video-stats">
                    <span class="video-stat">
                        <span class="video-stat-label">Views:</span>
                        <span class="video-stat-value">${analyticsEngine.formatNumber(video.views)}</span>
                    </span>
                    <span class="video-stat">
                        <span class="video-stat-label">Engagement:</span>
                        <span class="video-stat-value">${analyticsEngine.formatNumber(engagement)}</span>
                    </span>
                </div>
            </a>
        `;
    }

    /**
     * Render channel analytics in modal
     */
    renderChannelAnalytics(channel) {
        this.renderModalVolumeActivityChart(channel);
        this.renderModalContentQualityChart(channel);
    }

    /**
     * Render "Объем и Активность" chart (Combo: bars + line) за 12 месяцев
     */
    renderModalVolumeActivityChart(channel) {
        const projectionEnabled = document.getElementById('projectionCheckbox')?.checked ?? true;
        const monthlyStats = analyticsEngine.getMonthlyStatistics(channel, projectionEnabled);
        
        const ctx = document.getElementById('modalVolumeActivityChart').getContext('2d');
        
        if (this.charts.modalVolumeActivityChart) {
            this.charts.modalVolumeActivityChart.destroy();
        }

        // Prepare styling for bars based on projection status
        const barBackgroundColors = monthlyStats.videoCount.map((_, i) => 
            monthlyStats.isProjection[i] ? 'rgba(168, 85, 247, 0.4)' : 'rgba(168, 85, 247, 0.7)'
        );
        const barBorderColors = monthlyStats.videoCount.map((_, i) => 
            'rgba(168, 85, 247, 1)'
        );
        const barBorderDash = monthlyStats.videoCount.map((_, i) => 
            monthlyStats.isProjection[i] ? [5, 5] : []
        );

        this.charts.modalVolumeActivityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyStats.labels,
                datasets: [
                    {
                        label: 'Количество видео',
                        data: monthlyStats.videoCount,
                        backgroundColor: barBackgroundColors,
                        borderColor: barBorderColors,
                        borderWidth: 2,
                        yAxisID: 'y',
                        type: 'bar',
                        borderDash: barBorderDash
                    },
                    {
                        label: 'Общее количество просмотров',
                        data: monthlyStats.totalViews,
                        borderColor: 'rgba(102, 126, 234, 1)',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        yAxisID: 'y1',
                        type: 'line',
                        fill: false,
                        segment: {
                            borderDash: ctx => {
                                const idx = ctx.p0DataIndex;
                                if (monthlyStats.isProjection[idx] || monthlyStats.isProjection[idx + 1]) {
                                    return [5, 5];
                                }
                                return [];
                            }
                        }
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: { 
                    mode: 'index', 
                    intersect: false 
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { 
                            color: '#cbd5e1', 
                            font: { size: 13 },
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    // Show raw integer for video count, formatted number for views
                                    if (context.dataset.label === 'Количество видео') {
                                        label += monthlyStats.isProjection[context.dataIndex] 
                                            ? context.parsed.y.toFixed(1) 
                                            : Math.round(context.parsed.y);
                                    } else {
                                        label += analyticsEngine.formatNumber(context.parsed.y);
                                    }
                                }
                                return label;
                            },
                            afterLabel: function(context) {
                                if (monthlyStats.isProjection[context.dataIndex] && analyticsEngine.projectionDateRange) {
                                    const startDate = analyticsEngine.projectionDateRange.start;
                                    const endDate = analyticsEngine.projectionDateRange.end;
                                    const formatDate = (d) => {
                                        const day = d.getDate();
                                        const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
                                        return `${day} ${monthNames[d.getMonth()]}`;
                                    };
                                    return `Прогноз (оценка)\nна основе данных с ${formatDate(startDate)} по ${formatDate(endDate)}`;
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Количество видео',
                            color: '#a78bfa',
                            font: { size: 12 }
                        },
                        ticks: { 
                            color: '#94a3b8',
                            precision: 0,
                            callback: function(value) {
                                // Show raw integers without K formatting
                                return Math.round(value);
                            }
                        },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Просмотры',
                            color: '#667eea',
                            font: { size: 12 }
                        },
                        ticks: { 
                            color: '#94a3b8',
                            callback: function(value) {
                                return analyticsEngine.formatNumber(value);
                            }
                        },
                        grid: { 
                            drawOnChartArea: false 
                        }
                    },
                    x: {
                        ticks: { 
                            color: '#94a3b8',
                            font: { size: 11 }
                        },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    }
                }
            }
        });
    }

    /**
     * Render "Качество Контента" chart (Line: median views) за 12 месяцев
     */
    renderModalContentQualityChart(channel) {
        const projectionEnabled = document.getElementById('projectionCheckbox')?.checked ?? true;
        const monthlyStats = analyticsEngine.getMonthlyStatistics(channel, projectionEnabled);
        
        const ctx = document.getElementById('modalContentQualityChart').getContext('2d');
        
        if (this.charts.modalContentQualityChart) {
            this.charts.modalContentQualityChart.destroy();
        }

        this.charts.modalContentQualityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyStats.labels,
                datasets: [
                    {
                        label: 'Медианные просмотры',
                        data: monthlyStats.medianViews,
                        borderColor: 'rgba(16, 185, 129, 1)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                        pointBorderColor: '#1e293b',
                        pointBorderWidth: 2,
                        segment: {
                            borderDash: ctx => {
                                const idx = ctx.p0DataIndex;
                                if (monthlyStats.isProjection[idx] || monthlyStats.isProjection[idx + 1]) {
                                    return [5, 5];
                                }
                                return [];
                            }
                        }
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: { 
                    mode: 'index', 
                    intersect: false 
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { 
                            color: '#cbd5e1', 
                            font: { size: 13 },
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += analyticsEngine.formatNumber(context.parsed.y);
                                }
                                return label;
                            },
                            afterLabel: function(context) {
                                if (monthlyStats.isProjection[context.dataIndex] && analyticsEngine.projectionDateRange) {
                                    const startDate = analyticsEngine.projectionDateRange.start;
                                    const endDate = analyticsEngine.projectionDateRange.end;
                                    const formatDate = (d) => {
                                        const day = d.getDate();
                                        const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
                                        return `${day} ${monthNames[d.getMonth()]}`;
                                    };
                                    return `Прогноз (оценка)\nна основе данных с ${formatDate(startDate)} по ${formatDate(endDate)}`;
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Медианные просмотры на видео',
                            color: '#10b981',
                            font: { size: 12 }
                        },
                        ticks: { 
                            color: '#94a3b8',
                            callback: function(value) {
                                return analyticsEngine.formatNumber(value);
                            }
                        },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    x: {
                        ticks: { 
                            color: '#94a3b8',
                            font: { size: 11 }
                        },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    }
                }
            }
        });
    }

    /**
     * Switch modal tab
     */
    switchTab(tabName) {
        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.tab === tabName);
        });
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('channelModal');
        modal.classList.remove('active');
    }

    /**
     * Remove emojis from text
     */
    removeEmojis(text) {
        // Remove emoji characters (Unicode ranges)
        return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}\u{FE00}-\u{FE0F}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '').trim();
    }

    /**
     * Get color for numeric value based on threshold
     */
    getValueColor(value) {
        if (value >= 1000000) {
            return '#fbbf24'; // Gold/Orange for >= 1M
        }
        return '#60a5fa'; // Blue for < 1M
    }

    /**
     * Calculate heatmap color for a value based on min/max in dataset
     * @param {number} value - Current value
     * @param {number} min - Minimum value in dataset
     * @param {number} max - Maximum value in dataset
     * @returns {string} - RGB color string
     */
    calculateHeatmapColor(value, min, max) {
        if (max === min) {
            // If all values are the same, use middle color
            return 'rgba(127, 156, 245, 0.85)';
        }
        
        // Normalize value to 0-1 range
        const normalized = (value - min) / (max - min);
        
        // Define color gradient (cold blue to warm yellow/gold)
        const coldColor = { r: 96, g: 165, b: 250 };    // Blue rgba(96, 165, 250, 0.7)
        const warmColor = { r: 251, g: 191, b: 36 };    // Gold/Yellow rgba(251, 191, 36, 1)
        
        // Interpolate between colors
        const r = Math.round(coldColor.r + (warmColor.r - coldColor.r) * normalized);
        const g = Math.round(coldColor.g + (warmColor.g - coldColor.g) * normalized);
        const b = Math.round(coldColor.b + (warmColor.b - coldColor.b) * normalized);
        const a = 0.7 + (0.3 * normalized); // Alpha from 0.7 to 1.0
        
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    /**
     * Get font size and weight based on subscriber count
     * @param {number} subscribers - Subscriber count
     * @returns {object} - Style object with fontSize, fontWeight, opacity
     */
    getSubscriberFontStyle(subscribers) {
        if (subscribers >= 10000000) {
            // > 10M: Огромный
            return { fontSize: '1.8rem', fontWeight: 800, opacity: 1 };
        } else if (subscribers >= 1000000) {
            // 1M - 10M: Крупный
            return { fontSize: '1.5rem', fontWeight: 700, opacity: 1 };
        } else if (subscribers >= 100000) {
            // 100K - 1M: Средний
            return { fontSize: '1.2rem', fontWeight: 600, opacity: 1 };
        } else if (subscribers >= 10000) {
            // 10K - 100K: Стандартный
            return { fontSize: '1.0rem', fontWeight: 500, opacity: 1 };
        } else {
            // < 10K: Маленький
            return { fontSize: '0.9rem', fontWeight: 400, opacity: 0.8 };
        }
    }

    /**
     * Calculate min/max values for heatmap columns
     * @returns {object} - Object with min/max for each column
     */
    calculateHeatmapRanges() {
        const ranges = {
            videos: { min: Infinity, max: -Infinity },
            views: { min: Infinity, max: -Infinity },
            median: { min: Infinity, max: -Infinity },
            engagement: { min: Infinity, max: -Infinity },
            frequency: { min: Infinity, max: -Infinity }
        };

        this.channels.forEach(channel => {
            const kpis = analyticsEngine.calculateChannelKPIs(channel, this.currentPeriod);
            const current = kpis.currentPeriod;
            
            // Videos
            const videos = current.videoCount || 0;
            ranges.videos.min = Math.min(ranges.videos.min, videos);
            ranges.videos.max = Math.max(ranges.videos.max, videos);
            
            // Views
            const views = current.totalViews || 0;
            ranges.views.min = Math.min(ranges.views.min, views);
            ranges.views.max = Math.max(ranges.views.max, views);
            
            // Median
            const median = current.medianViews || 0;
            ranges.median.min = Math.min(ranges.median.min, median);
            ranges.median.max = Math.max(ranges.median.max, median);
            
            // Engagement
            const engagement = current.medianEngagement || 0;
            ranges.engagement.min = Math.min(ranges.engagement.min, engagement);
            ranges.engagement.max = Math.max(ranges.engagement.max, engagement);
            
            // Frequency
            const frequency = parseFloat(analyticsEngine.calculateVideosPerWeek(current.videoCount, this.currentPeriod));
            ranges.frequency.min = Math.min(ranges.frequency.min, frequency);
            ranges.frequency.max = Math.max(ranges.frequency.max, frequency);
        });

        return ranges;
    }

    /**
     * Filter channels by main genre
     */
    filterByGenre(mainGenre) {
        // Clear all selections
        this.selectedChannels.clear();
        
        // Select only channels with matching main genre
        this.channels.forEach(channel => {
            const channelMainGenre = (channel.style || '').split('/')[0].trim();
            if (channelMainGenre.toLowerCase() === mainGenre.toLowerCase()) {
                this.selectedChannels.add(channel.channel_id);
            }
        });
        
        // Update checkboxes
        document.querySelectorAll('.channel-checkbox').forEach(cb => {
            const channelId = cb.dataset.channelId;
            cb.checked = this.selectedChannels.has(channelId);
        });
        
        // Update select all checkbox
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = this.selectedChannels.size === this.channels.length;
            selectAllCheckbox.indeterminate = this.selectedChannels.size > 0 && this.selectedChannels.size < this.channels.length;
        }
        
        // Update summary and charts
        this.renderGlobalSummary();
        this.renderCharts();
    }

    /**
     * Escape HTML special characters
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize dashboard when DOM is ready
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
    dashboard.initialize();
});
