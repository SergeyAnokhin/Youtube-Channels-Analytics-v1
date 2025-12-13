/**
 * Analytics Engine Module
 * Handles all KPI calculations and period comparisons
 */

class AnalyticsEngine {
    constructor() {
        // Configurable neutral thresholds (percentage change)
        this.neutralThresholds = {
            videos: 15,      // ±15%
            views: 10,       // ±10%
            medianViews: 7,  // ±7%
            subscribers: 5   // ±5%
        };
    }

    /**
     * Set neutral threshold for a specific KPI
     */
    setNeutralThreshold(kpi, percentage) {
        if (this.neutralThresholds.hasOwnProperty(kpi)) {
            this.neutralThresholds[kpi] = percentage;
        }
    }

    /**
     * Get videos for a given date range
     */
    getVideosInPeriod(channel, startDate, endDate) {
        return channel.videos.filter(video => {
            const videoDate = new Date(video.published_at);
            return videoDate >= startDate && videoDate < endDate;
        });
    }

    /**
     * Calculate KPIs for a channel and period
     */
    calculateChannelKPIs(channel, months) {
        const today = new Date();
        const endDate = new Date(today);
        const startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - months);

        const prevEndDate = new Date(startDate);
        const prevStartDate = new Date(startDate);
        prevStartDate.setMonth(prevStartDate.getMonth() - months);

        const currentVideos = this.getVideosInPeriod(channel, startDate, endDate);
        const previousVideos = this.getVideosInPeriod(channel, prevStartDate, prevEndDate);

        const currentMetrics = this._calculateMetrics(currentVideos);
        const previousMetrics = this._calculateMetrics(previousVideos);

        return {
            currentPeriod: {
                months,
                startDate,
                endDate,
                ...currentMetrics,
                videoCount: currentVideos.length,
                hasData: currentVideos.length > 0
            },
            previousPeriod: {
                months,
                startDate: prevStartDate,
                endDate: prevEndDate,
                ...previousMetrics,
                videoCount: previousVideos.length,
                hasData: previousVideos.length > 0
            },
            comparison: this._compareMetrics(currentMetrics, previousMetrics, currentVideos.length, previousVideos.length)
        };
    }

    /**
     * Calculate metrics for a set of videos
     */
    _calculateMetrics(videos) {
        if (videos.length === 0) {
            return {
                totalViews: 0,
                totalLikes: 0,
                totalComments: 0,
                medianViews: 0,
                averageViews: 0,
                engagementRate: 0
            };
        }

        const views = videos.map(v => v.views).filter(v => v !== null);
        const totalViews = views.reduce((a, b) => a + b, 0);
        const totalLikes = videos.reduce((a, b) => a + (b.likes || 0), 0);
        const totalComments = videos.reduce((a, b) => a + (b.comments || 0), 0);

        return {
            totalViews,
            totalLikes,
            totalComments,
            medianViews: this._calculateMedian(views),
            averageViews: Math.round(totalViews / videos.length),
            engagementRate: totalViews > 0 ? 
                Math.round(((totalLikes + totalComments) / totalViews) * 100) / 100 : 0
        };
    }

    /**
     * Calculate median value
     */
    _calculateMedian(values) {
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 
            ? sorted[mid] 
            : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
    }

    /**
     * Compare two metric sets and calculate percentage changes
     */
    _compareMetrics(current, previous, currentCount, previousCount) {
        const calculateChange = (current, previous) => {
            if (previous === 0 || previous === null) {
                return null; // N/A for new channels
            }
            return Math.round(((current - previous) / previous) * 1000) / 10;
        };

        return {
            videoCountChange: calculateChange(currentCount, previousCount),
            viewsChange: calculateChange(current.totalViews, previous.totalViews),
            medianViewsChange: calculateChange(current.medianViews, previous.medianViews),
            likesChange: calculateChange(current.totalLikes, previous.totalLikes),
            commentsChange: calculateChange(current.totalComments, previous.totalComments)
        };
    }

    /**
     * Determine status color for a KPI change
     */
    getChangeStatus(percentageChange, kpiType = 'views') {
        if (percentageChange === null) {
            return 'new';
        }

        const threshold = this.neutralThresholds[kpiType] || 10;
        
        if (Math.abs(percentageChange) <= threshold) {
            return 'neutral';
        }
        
        return percentageChange > 0 ? 'positive' : 'negative';
    }

    /**
     * Calculate global summary across all channels
     */
    calculateGlobalSummary(channels, months) {
        const allCurrentVideos = [];
        const allPreviousVideos = [];

        const today = new Date();
        const endDate = new Date(today);
        const startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - months);

        const prevEndDate = new Date(startDate);
        const prevStartDate = new Date(startDate);
        prevStartDate.setMonth(prevStartDate.getMonth() - months);

        channels.forEach(channel => {
            const current = this.getVideosInPeriod(channel, startDate, endDate);
            const previous = this.getVideosInPeriod(channel, prevStartDate, prevEndDate);
            allCurrentVideos.push(...current);
            allPreviousVideos.push(...previous);
        });

        const currentMetrics = this._calculateMetrics(allCurrentVideos);
        const previousMetrics = this._calculateMetrics(allPreviousVideos);
        const comparison = this._compareMetrics(currentMetrics, previousMetrics, allCurrentVideos.length, allPreviousVideos.length);

        return {
            currentPeriod: {
                ...currentMetrics,
                videoCount: allCurrentVideos.length
            },
            previousPeriod: {
                ...previousMetrics,
                videoCount: allPreviousVideos.length
            },
            comparison
        };
    }

    /**
     * Get top videos from a channel for a period
     */
    getTopVideosByMetric(channel, metric = 'views', months = 1, limit = 5) {
        const today = new Date();
        const endDate = new Date(today);
        const startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - months);

        const videos = this.getVideosInPeriod(channel, startDate, endDate);

        if (metric === 'views') {
            return videos
                .sort((a, b) => (b.views || 0) - (a.views || 0))
                .slice(0, limit);
        } else if (metric === 'engagement') {
            return videos
                .map(v => ({
                    ...v,
                    engagement: (v.likes || 0) + (v.comments || 0)
                }))
                .sort((a, b) => b.engagement - a.engagement)
                .slice(0, limit);
        }

        return videos.slice(0, limit);
    }

    /**
     * Format number for display (1.2M, 450K, etc.)
     */
    formatNumber(value) {
        if (value === null || value === undefined) return '0';
        
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (value >= 1000) {
            return (value / 1000).toFixed(0) + 'K';
        }
        return value.toString();
    }

    /**
     * Format percentage change with sign
     */
    formatChange(percentageChange) {
        if (percentageChange === null) return 'N/A';
        const sign = percentageChange >= 0 ? '+' : '';
        return `${sign}${percentageChange.toFixed(1)}%`;
    }

    /**
     * Calculate average videos per week
     */
    calculateVideosPerWeek(videoCount, months) {
        const weeks = (months * 365.25) / 7;
        return (videoCount / weeks).toFixed(2);
    }

    /**
     * Get publishing dates for chart data
     */
    getPublishingDates(channel, months) {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - months);

        const videos = this.getVideosInPeriod(channel, startDate, today);
        
        // Group by month
        const monthlyData = {};
        videos.forEach(video => {
            const date = new Date(video.published_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
        });

        return monthlyData;
    }

    /**
     * Get views over time for chart
     */
    getViewsOverTime(channel, months) {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - months);

        const videos = this.getVideosInPeriod(channel, startDate, today);
        
        // Group by month
        const monthlyViews = {};
        videos.forEach(video => {
            const date = new Date(video.published_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyViews[monthKey] = (monthlyViews[monthKey] || 0) + (video.views || 0);
        });

        return monthlyViews;
    }
}

// Export for use
const analyticsEngine = new AnalyticsEngine();
