/**
 * Data Loader Module
 * Handles loading and normalizing channel JSON data
 */

class DataLoader {
    constructor() {
        this.channels = [];
        this.loadingPromise = null;
    }

    /**
     * Load all channel data from JSON files
     */
    async loadChannels() {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = this._performLoad();
        return this.loadingPromise;
    }

    async _performLoad() {
        try {
            // Get manifest or list of files
            const manifestResponse = await fetch('channel_stats/manifest.json');
            const manifest = await manifestResponse.json();

            // Load each channel file
            const channelPromises = manifest.map(filename => 
                fetch(`channel_stats/${filename}`)
                    .then(res => res.json())
                    .then(data => this._normalizeChannelData(data))
                    .catch(err => {
                        console.warn(`Failed to load ${filename}:`, err);
                        return null;
                    })
            );

            const channelsData = await Promise.all(channelPromises);
            this.channels = channelsData.filter(ch => ch !== null);
            
            // Sort by subscribers descending
            this.channels.sort((a, b) => (b.subscribers || 0) - (a.subscribers || 0));

            console.log(`Loaded ${this.channels.length} channels`);
            return this.channels;
        } catch (error) {
            console.error('Failed to load channels:', error);
            throw error;
        }
    }

    /**
     * Normalize channel data structure
     */
    _normalizeChannelData(rawData) {
        // Extract thumbnail URL from nested structure
        let thumbnailUrl = '';
        if (rawData.thumbnails && rawData.thumbnails.default && rawData.thumbnails.default.url) {
            thumbnailUrl = rawData.thumbnails.default.url;
        }

        return {
            channel_name: rawData.channel_name || 'Unknown',
            channel_id: rawData.channel_id || '',
            description: rawData.description || '',
            style: rawData.style || '',
            emoji: rawData.emoji || '', // Single emoji for Icon column
            emojis: rawData.emojis || '', // Multiple emojis for channel name prefix
            thumbnail_url: thumbnailUrl, // Channel logo/avatar
            subscribers: this._parseNumber(rawData.subscribers),
            total_views: this._parseNumber(rawData.total_views),
            total_videos: this._parseNumber(rawData.total_videos),
            created_at: rawData.created_at || '',
            videos: this._normalizeVideos(rawData.videos || [])
        };
    }

    /**
     * Normalize video array
     */
    _normalizeVideos(videos) {
        return videos
            .map(video => ({
                video_id: video.video_id || '',
                title: video.title || 'Untitled',
                published_at: video.published_at || '',
                duration: video.duration || '',
                views: this._parseNumber(video.views),
                likes: this._parseNumber(video.likes),
                comments: this._parseNumber(video.comments),
                url: video.url || ''
            }))
            .filter(v => v.views !== null) // Filter out invalid videos
            .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    }

    /**
     * Parse number safely
     */
    _parseNumber(value) {
        if (value === null || value === undefined || value === '') return null;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
    }

    /**
     * Get all loaded channels
     */
    getChannels() {
        return this.channels;
    }

    /**
     * Get single channel by ID
     */
    getChannelById(channelId) {
        return this.channels.find(ch => ch.channel_id === channelId);
    }
}

// Export for use
const dataLoader = new DataLoader();
