# Quick Start Guide

Get the YouTube Channel Analytics Dashboard running in 2 minutes!

## ⚡ 30-Second Setup

### Windows
```bash
Double-click start.bat
# Opens dashboard at http://localhost:8000
```

### Mac/Linux
```bash
chmod +x start.sh
./start.sh
# Opens dashboard at http://localhost:8000
```

### Manual Start (Any OS)
```bash
# Navigate to project directory
cd stat-gemini-4o

# Option 1: Python 3
python -m http.server 8000

# Option 2: Python 2
python -m SimpleHTTPServer 8000

# Option 3: Node.js
npx http-server -p 8000

# Option 4: PHP
php -S localhost:8000
```

Then open: **http://localhost:8000** in your browser

## 📋 What You'll See

1. **Header** - Dashboard title and period selector (1/3/6 months)
2. **Main Table** - All channels with KPIs and color-coded changes
3. **Summary Cards** - Aggregated metrics for all channels
4. **Charts** - 4 interactive visualizations
5. **Click any channel** to see detailed view with extra analytics

## 🎮 How to Use

### Change Analysis Period
Click buttons in top right: **1 Month**, **3 Months**, or **6 Months**
- Table updates instantly
- Metrics compare to previous same-length period
- Charts refresh with new data

### View Channel Details
Click any channel name in the table
- **Overview tab**: Channel info and KPI history
- **Videos tab**: Top videos by views and engagement
- **Analytics tab**: Trends and publishing patterns

### Close Modal
- Click X button
- Click outside the modal
- Press Esc (if you add keyboard support)

## 🎨 Understanding the Colors

| Color | Meaning |
|-------|---------|
| 🟢 Green | Growth (above threshold) |
| 🔴 Red | Decline (below threshold) |
| ⚫ Gray | No significant change |
| 🔵 NEW | Channel is new (first period) |
| ⏸️ Pause | No videos in this period |

## 📊 Table Columns Explained

| Column | What It Shows |
|--------|---------------|
| Channel | Name (clickable) + emoji |
| Style | Genre/category + emoji |
| Subscribers | Total channel subscribers |
| Videos | Count in selected period + % change |
| Views | Total views in period + % change |
| Median Views | Middle value of video views + % change |
| Avg Videos/Week | Publishing frequency |

## 🔍 Reading the KPIs

Each KPI shows two pieces:
1. **Main value** (top number)
2. **Change indicator** (bottom line)

Example:
```
287                  ← Videos in this period
+18.5%               ← 18.5% more than previous period (green = good)
```

## ➕ Adding New Channels

1. Create JSON file: `channel_stats/NewChannel.json`
2. Add to `channel_stats/manifest.json`
3. Refresh browser
4. ✅ New channel appears automatically!

Sample JSON:
```json
{
    "channel_name": "My Channel",
    "channel_id": "UC_...",
    "emojis": "🎵💖",
    "style": "Indie Pop / Lo-Fi",
    "subscribers": 50000,
    "total_views": 5000000,
    "total_videos": 145,
    "created_at": "2021-01-01T00:00:00Z",
    "description": "Channel description here",
    "videos": [
        {
            "video_id": "abc123",
            "title": "Song Title",
            "published_at": "2025-12-10T10:00:00Z",
            "views": 5000,
            "likes": 250,
            "comments": 45
        }
    ]
}
```

## ⚙️ Common Customizations

### Change Colors
Edit top of `styles.css`:
```css
--primary-gradient: linear-gradient(135deg, #YOURCOLOR1 0%, #YOURCOLOR2 100%);
```

### Adjust Thresholds
Edit `analytics-engine.js`:
```javascript
this.neutralThresholds = {
    videos: 15,       // ±15% = neutral
    views: 10,        // ±10% = neutral
    medianViews: 7,   // ±7% = neutral
};
```

### Add Period
Edit `index.html`:
```html
<button class="period-btn" data-period="12">1 Year</button>
```

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Blank page | Clear cache (Ctrl+Shift+Delete) and refresh |
| No data | Check `channel_stats/manifest.json` exists |
| Chart missing | Check Chart.js CDN loaded (DevTools Network) |
| Slow loading | Check number of channels + video count |
| Server won't start | Try different port: `python -m http.server 8001` |

## 📚 Learn More

- **Full features** → [FEATURES.md](FEATURES.md)
- **How to customize** → [CUSTOMIZATION.md](CUSTOMIZATION.md)
- **For developers** → [DEVELOPMENT.md](DEVELOPMENT.md)
- **Troubleshooting** → [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Setup details** → [README.md](README.md)

## 🎯 What's Next?

1. ✅ **Start server** (already done if using scripts)
2. ✅ **Open dashboard** (http://localhost:8000)
3. ✅ **See sample data** (included JSON files)
4. 📝 **Add your data** (replace with real JSON)
5. 🎨 **Customize** (colors, thresholds, layout)
6. 📊 **Analyze** (compare channels, find trends)
7. 🚀 **Deploy** (put on web server)

## 💡 Pro Tips

- **Click channel names** to see detailed analytics
- **Period buttons** auto-compare to previous period
- **Hover over truncated text** to see full description
- **Open DevTools (F12)** to test API in console
- **Check Network tab** if things aren't loading
- **Hard refresh (Ctrl+F5)** if styles look wrong

## 🚀 Deploy to Production

When ready to share online:

```bash
# Option 1: GitHub Pages
# Push to gh-pages branch

# Option 2: Netlify
# Connect repo, auto-deploys on push

# Option 3: Any web server
# Upload files via FTP
# Ensure manifest.json is accessible
```

## 📞 Support

Check the relevant documentation:
- **"How do I...?"** → [CUSTOMIZATION.md](CUSTOMIZATION.md)
- **"What's broken?"** → [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **"How does it work?"** → [DEVELOPMENT.md](DEVELOPMENT.md)
- **"What can it do?"** → [FEATURES.md](FEATURES.md)

---

**Ready?** Open http://localhost:8000 now! 🚀
