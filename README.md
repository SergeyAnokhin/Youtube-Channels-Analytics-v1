# YouTube Channel Analytics Dashboard

A modern, investor-ready analytics dashboard for analyzing YouTube channels using local JSON data.

## 🚀 Features

- **Multi-Channel Comparison**: Compare performance metrics across all YouTube channels
- **Period-Based Analysis**: Switch between 1, 3, and 6-month analysis periods with automatic comparison to previous periods
- **Comprehensive KPIs**: 
  - Subscriber counts
  - Video publishing frequency
  - Views per period
  - Median views per video
  - Engagement metrics
  - Growth indicators with color-coded status
- **Interactive Charts**: 
  - Views over time for top channels
  - Publishing frequency distribution
  - Top channels by total views
  - Subscriber distribution
  - Channel-specific trend analysis
- **Channel Detail View**: Deep-dive modal with full channel information, video performance, and trends
- **Responsive Design**: Works seamlessly on desktop and tablet devices
- **Professional Visual Design**: Purple gradient theme, soft shadows, smooth animations

## 📊 Data Structure

Each channel is stored as a separate JSON file in the `channel_stats/` directory.

### Channel JSON Format
```json
{
    "channel_name": "Channel Name",
    "channel_id": "UC_Channel_ID",
    "description": "Channel description",
    "style": "Genre/Style description",
    "emojis": "🎵💖🎸",
    "subscribers": 12500,
    "total_views": 1500000,
    "total_videos": 145,
    "created_at": "2021-04-01T19:12:49.164609Z",
    "videos": [
        {
            "video_id": "ABC123",
            "title": "Video Title",
            "published_at": "2025-12-10T10:17:17Z",
            "duration": "PT3M20S",
            "views": 5000,
            "likes": 250,
            "comments": 45,
            "url": "https://www.youtube.com/watch?v=ABC123"
        }
    ]
}
```

## 🛠️ Setup Instructions

### Quick Start

1. **Clone or download the project**
   ```bash
   cd stat-gemini-4o
   ```

2. **Start the local server**
   
   **Python 3:**
   ```bash
   python -m http.server 8000
   ```
   
   **Python 2:**
   ```bash
   python -m SimpleHTTPServer 8000
   ```
   
   **Node.js:**
   ```bash
   npx http-server -p 8000
   ```
   
   **PHP:**
   ```bash
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

## 📁 Project Structure

```
stat-gemini-4o/
├── index.html              # Main HTML dashboard
├── styles.css              # Dashboard styling (purple theme)
├── data-loader.js          # JSON data loading module
├── analytics-engine.js     # KPI calculation engine
├── dashboard.js            # UI rendering and interactions
├── channel_stats/          # Local JSON data files
│   ├── manifest.json       # List of channel files
│   └── [channel_name].json # Individual channel data
└── README.md               # This file
```

## 🎯 Main Components

### Data Loader (`data-loader.js`)
- Loads all JSON files from `channel_stats/` directory
- Normalizes inconsistent data structures
- Handles missing fields gracefully
- Filters out invalid video entries

### Analytics Engine (`analytics-engine.js`)
- Calculates period-based KPIs
- Compares current period vs. previous period
- Computes metrics: views, videos, medians, engagement
- Configurable neutral thresholds for change detection
- Number formatting (1.2M, 450K format)

### Dashboard (`dashboard.js`)
- Renders main comparison table
- Manages period selector
- Renders charts using Chart.js
- Handles modal interactions
- Manages tab navigation

## 📊 KPI Color Logic

All KPI changes are color-coded based on percentage change from previous period:

- **Green (Positive)**: Growth above neutral threshold
- **Red (Negative)**: Decline below -neutral threshold
- **Gray (Neutral)**: Change within ±neutral threshold
- **Blue (New)**: No data in previous period but data in current

### Configurable Thresholds

Default neutral thresholds:
- Videos: ±15%
- Views: ±10%
- Median Views: ±7%
- Subscribers: ±5%

To modify thresholds, edit `analytics-engine.js`:
```javascript
analyticsEngine.setNeutralThreshold('views', 12); // Change to ±12%
```

## 🔄 Period Comparison Logic

The dashboard always compares each period to the same-length previous period:

- **1 Month selected**: Current month vs. previous month
- **3 Months selected**: Last 3 months vs. 3 months before that
- **6 Months selected**: Last 6 months vs. 6 months before that

## 📈 Visualizations

### 1. Views Over Time (Line Chart)
Shows views for top 5 channels across the selected period, grouped by month.

### 2. Publishing Frequency (Horizontal Bar Chart)
Displays video count for top 15 channels in the selected period.

### 3. Top Channels by Total Views (Doughnut Chart)
Shows market share by total views (all-time) for top 10 channels.

### 4. Subscriber Distribution (Bar Chart)
Top 10 channels by subscriber count (all-time).

## 🔍 Channel Detail Modal

Click any channel name to open the detailed view with:

**Overview Tab:**
- Full channel description
- Style/genre information
- Key metrics (subscribers, total videos, total views, created date)
- KPI comparison for 1, 3, and 6-month periods

**Videos Tab:**
- Top 5 videos by views (last 6 months)
- Top 5 videos by engagement (last 6 months)
- Direct YouTube links

**Analytics Tab:**
- 6-month views and video count trend (dual-axis chart)
- Monthly publishing frequency (bar chart)

## 🎨 Design Features

- **Color Scheme**: Purple gradients with accent colors
- **Modern UI**: Card-based layout with proper spacing
- **Interactive Elements**: Smooth hover effects and transitions
- **Responsive**: Adapts to different screen sizes
- **Accessible**: High contrast text, readable fonts

## 🔧 Adding New Channels

1. Create a new JSON file in `channel_stats/` directory
2. Follow the JSON format specified above
3. Add the filename to `manifest.json`
4. Refresh the browser - the new channel will load automatically

**Example:**
```json
{
    "channel_name": "My New Channel",
    "channel_id": "UCxxx...",
    ...
}
```

## ⚙️ Configuration

### Neutral Thresholds
Edit values in `analytics-engine.js` constructor:
```javascript
this.neutralThresholds = {
    videos: 15,
    views: 10,
    medianViews: 7,
    subscribers: 5
};
```

### Theme Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --success-color: #10b981;
    --danger-color: #ef4444;
    /* ... more variables */
}
```

## 📱 Responsive Breakpoints

- Desktop: Full layout with all features
- Tablet (≤1200px): Adjusted spacing and simplified header
- Mobile (≤768px): Single-column layout, optimized table

## 🚀 Performance Tips

- Dashboard loads all channels on startup
- Charts are created with Chart.js (efficient rendering)
- Period changes trigger fast recalculation without data reload
- Lazy chart destruction and recreation for period switching

## 🐛 Troubleshooting

### "Failed to load channels"
- Ensure `channel_stats/` directory exists
- Verify `manifest.json` is present and valid
- Check browser console for specific file errors
- Ensure JSON files are properly formatted

### Chart not displaying
- Verify Chart.js CDN is loaded (check Network tab in DevTools)
- Ensure canvas elements are present in HTML
- Check browser console for JavaScript errors

### Period selector not working
- Clear browser cache
- Check that `dashboard.js` is loaded
- Verify button click handlers in console

## 📄 License

This project uses data from YouTube channels and displays it for analytics purposes.

## 🔮 Future Enhancements

- Export data to CSV/PDF
- Custom date range selection
- Predictive analytics and forecasting
- Video sentiment analysis
- Real-time data sync with YouTube API
- Advanced filtering and search
- Custom metrics and KPIs
- Team collaboration features
