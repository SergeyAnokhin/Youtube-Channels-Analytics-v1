/**
 * Dashboard Main Module
 * Handles UI rendering and interactions
 */

class Dashboard {
    constructor() {
        this.currentPeriod = 1; // months
        this.channels = [];
        this.charts = {};
        this.initializeEventListeners();
    }

    async initialize() {
        try {
            // Show loading indicator
            this.updateLoadingStatus(true);

            // Load data
            this.channels = await dataLoader.loadChannels();

            // Hide loading indicator
            this.updateLoadingStatus(false);

            // Render dashboard
            this.renderDashboard();
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
                this.renderDashboard();
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
     * Render channels comparison table
     */
    renderChannelsTable() {
        const tbody = document.getElementById('channelsTableBody');
        tbody.innerHTML = '';

        this.channels.forEach(channel => {
            const kpis = analyticsEngine.calculateChannelKPIs(channel, this.currentPeriod);
            const comparison = kpis.comparison;
            const currentPeriod = kpis.currentPeriod;
            const previousPeriod = kpis.previousPeriod;

            // Check for new channel
            const isNewChannel = !previousPeriod.hasData && currentPeriod.hasData;

            // Build row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="col-channel">
                    <span class="channel-name-cell" onclick="dashboard.openChannelModal('${channel.channel_id}')">
                        <span class="channel-emoji">${channel.emojis.split('')[0] || '🎵'}</span>
                        <span>${this.escapeHtml(channel.channel_name)}</span>
                    </span>
                </td>
                <td class="col-style">
                    <div class="style-cell" title="${this.escapeHtml(channel.style)}">
                        <span class="style-emoji">${channel.emojis || '🎵'}</span>
                        <span class="style-text">${this.escapeHtml(channel.style.substring(0, 60))}</span>
                    </div>
                </td>
                <td class="col-subscribers">
                    <div class="kpi-cell">
                        <span class="kpi-value">${analyticsEngine.formatNumber(channel.subscribers)}</span>
                        <span class="kpi-change neutral">—</span>
                    </div>
                </td>
                <td class="col-videos">
                    <div class="kpi-cell">
                        <span class="kpi-value">${currentPeriod.videoCount}</span>
                        ${this._renderChangeIndicator(comparison.videoCountChange, 'videos', isNewChannel)}
                    </div>
                </td>
                <td class="col-views">
                    <div class="kpi-cell">
                        ${currentPeriod.hasData 
                            ? `<span class="kpi-value">${analyticsEngine.formatNumber(currentPeriod.totalViews)}</span>`
                            : `<span class="kpi-value pause-icon">⏸</span>`
                        }
                        ${this._renderChangeIndicator(comparison.viewsChange, 'views', isNewChannel)}
                    </div>
                </td>
                <td class="col-median">
                    <div class="kpi-cell">
                        <span class="kpi-value">${analyticsEngine.formatNumber(currentPeriod.medianViews)}</span>
                        ${this._renderChangeIndicator(comparison.medianViewsChange, 'medianViews', isNewChannel)}
                    </div>
                </td>
                <td class="col-frequency">
                    <div class="kpi-cell">
                        <span class="kpi-value">${analyticsEngine.calculateVideosPerWeek(currentPeriod.videoCount, this.currentPeriod)}</span>
                        <span class="kpi-change neutral">per week</span>
                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    /**
     * Render change indicator with color coding
     */
    _renderChangeIndicator(change, kpiType, isNewChannel) {
        if (isNewChannel) {
            return '<span class="kpi-change new">🆕 NEW</span>';
        }

        const status = analyticsEngine.getChangeStatus(change, kpiType);
        const changeText = analyticsEngine.formatChange(change);

        return `<span class="kpi-change ${status}">${changeText}</span>`;
    }

    /**
     * Render global summary cards
     */
    renderGlobalSummary() {
        const summary = analyticsEngine.calculateGlobalSummary(this.channels, this.currentPeriod);
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
    }

    /**
     * Render views over time chart for top 5 channels
     */
    renderViewsOverTimeChart() {
        const topChannels = this.channels.slice(0, 5);
        const labels = this._getMonthLabels(this.currentPeriod);
        const datasets = [];

        const colors = [
            'rgba(102, 126, 234, 1)',
            'rgba(245, 87, 108, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(168, 85, 247, 1)'
        ];

        topChannels.forEach((channel, index) => {
            const viewsData = analyticsEngine.getViewsOverTime(channel, this.currentPeriod);
            const values = labels.map(label => viewsData[label] || 0);

            datasets.push({
                label: channel.channel_name,
                data: values,
                borderColor: colors[index],
                backgroundColor: colors[index].replace('1)', '0.1)'),
                borderWidth: 2,
                tension: 0.4,
                fill: true
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
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: '#cbd5e1', font: { size: 12 } }
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
     * Render publishing frequency chart
     */
    renderFrequencyChart() {
        const channelLabels = this.channels.map(ch => ch.channel_name.substring(0, 15)).slice(0, 15);
        const videoCounts = this.channels.map(ch => {
            const kpis = analyticsEngine.calculateChannelKPIs(ch, this.currentPeriod);
            return kpis.currentPeriod.videoCount;
        }).slice(0, 15);

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
        const topChannels = this.channels.slice(0, 10);
        const labels = topChannels.map(ch => ch.channel_name.substring(0, 12));
        const data = topChannels.map(ch => ch.total_views);

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
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: { color: '#cbd5e1', font: { size: 11 }, padding: 15 }
                    }
                }
            }
        });
    }

    /**
     * Render subscribers distribution
     */
    renderSubscribersChart() {
        const topChannels = this.channels.slice(0, 10);
        const labels = topChannels.map(ch => ch.channel_name.substring(0, 15));
        const data = topChannels.map(ch => ch.subscribers);

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
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#94a3b8' },
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
     * Get month labels for the given period
     */
    _getMonthLabels(months) {
        const labels = [];
        const today = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setMonth(date.getMonth() - i);
            const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            labels.push(monthYear);
        }

        return labels;
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
        this.renderModalTrendChart(channel);
        this.renderModalPublishingChart(channel);
    }

    /**
     * Render trend chart in modal
     */
    renderModalTrendChart(channel) {
        const labels = this._getMonthLabels(6);
        const viewsData = [];
        const videoData = [];

        labels.forEach((label, index) => {
            const monthsBack = 6 - index - 1;
            const today = new Date();
            const endDate = new Date(today);
            endDate.setMonth(endDate.getMonth() - monthsBack);
            const startDate = new Date(endDate);
            startDate.setMonth(startDate.getMonth() - 1);

            const videos = analyticsEngine.getVideosInPeriod(channel, startDate, endDate);
            const totalViews = videos.reduce((a, b) => a + (b.views || 0), 0);
            viewsData.push(totalViews);
            videoData.push(videos.length);
        });

        const ctx = document.getElementById('modalTrendChart').getContext('2d');
        
        if (this.charts.modalTrendChart) {
            this.charts.modalTrendChart.destroy();
        }

        this.charts.modalTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Views',
                        data: viewsData,
                        borderColor: 'rgba(102, 126, 234, 1)',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Videos',
                        data: videoData,
                        borderColor: 'rgba(245, 87, 108, 1)',
                        backgroundColor: 'rgba(245, 87, 108, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: '#cbd5e1', font: { size: 12 } }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        ticks: { color: '#94a3b8' },
                        grid: { drawOnChartArea: false }
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
     * Render publishing frequency chart in modal
     */
    renderModalPublishingChart(channel) {
        const monthlyPublishing = analyticsEngine.getPublishingDates(channel, 6);
        const months = Object.keys(monthlyPublishing).sort();
        const counts = months.map(m => monthlyPublishing[m]);

        const ctx = document.getElementById('modalPublishingChart').getContext('2d');
        
        if (this.charts.modalPublishingChart) {
            this.charts.modalPublishingChart.destroy();
        }

        this.charts.modalPublishingChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Videos Published',
                    data: counts,
                    backgroundColor: 'rgba(168, 85, 247, 0.7)',
                    borderColor: 'rgba(168, 85, 247, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#94a3b8' },
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
