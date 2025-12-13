# Dashboard Customization Guide

This guide explains how to customize the YouTube Channel Analytics Dashboard to match your needs.

## 🎨 Visual Customization

### Changing the Color Scheme

Edit the CSS variables in `styles.css`:

```css
:root {
    /* Primary gradient (used for buttons, headers, text) */
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    
    /* Secondary gradient (alternative theme color) */
    --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    
    /* Accent color (highlights, hover effects) */
    --accent-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    
    /* Status colors */
    --success-color: #10b981;    /* Growth indicator */
    --danger-color: #ef4444;     /* Decline indicator */
    --neutral-color: #9ca3af;    /* No change indicator */
    
    /* Background colors */
    --bg-dark: #0f172a;
    --bg-darker: #020617;
    --bg-card: #1e293b;
    --bg-card-hover: #334155;
    
    /* Text colors */
    --text-primary: #f1f5f9;
    --text-secondary: #cbd5e1;
    --text-tertiary: #94a3b8;
}
```

### Popular Color Themes

#### Blue Theme
```css
--primary-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
--primary-color: #4facfe;
--secondary-color: #00f2fe;
--success-color: #0ea5e9;
--danger-color: #ef4444;
```

#### Green Theme
```css
--primary-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
--primary-color: #10b981;
--secondary-color: #059669;
--success-color: #06b6d4;
--danger-color: #ef4444;
```

#### Pink/Red Theme
```css
--primary-gradient: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
--primary-color: #f5576c;
--secondary-color: #f093fb;
--success-color: #059669;
--danger-color: #dc2626;
```

### Changing Fonts

Replace the font family in `styles.css`:

```css
body {
    font-family: 'YOUR_FONT_HERE', sans-serif;
}

.channels-table td,
.kpi-cell {
    font-family: 'YOUR_MONOSPACE_FONT', monospace;
}
```

Popular choices:
- **Sans-serif**: Inter, Roboto, Poppins, Raleway
- **Monospace**: IBM Plex Mono, JetBrains Mono, Courier New

## 📊 Analytics Customization

### Changing Neutral Thresholds

Edit the `neutralThresholds` object in `analytics-engine.js`:

```javascript
this.neutralThresholds = {
    videos: 15,       // Show color change if ±15% or more
    views: 10,        // Show color change if ±10% or more
    medianViews: 7,   // Show color change if ±7% or more
    subscribers: 5    // Show color change if ±5% or more
};
```

#### Understanding Thresholds

- **15% threshold** = no color if change is between -15% and +15%
- **Positive colors show** only if change exceeds +threshold
- **Negative colors show** only if change is below -threshold

**Example scenarios:**
- Videos at 15% threshold: +10% = neutral gray, +20% = green, -20% = red
- Views at 10% threshold: +5% = neutral gray, +15% = green, -15% = red

### Modifying KPI Columns

To add or remove columns from the main table, edit `index.html` and `dashboard.js`:

In `index.html`, add/remove `<th>` headers:
```html
<th class="col-custom">Your New KPI</th>
```

In `dashboard.js`, add/remove the corresponding `<td>` cell:
```html
<td class="col-custom">
    <div class="kpi-cell">
        <!-- Your KPI content -->
    </div>
</td>
```

### Custom KPI Calculations

Add new calculation methods in `analytics-engine.js`:

```javascript
calculateCustomKPI(channel, months) {
    const videos = this.getVideosInPeriod(
        channel, 
        this.getDateRangeForMonths(months)
    );
    
    // Your calculation here
    const customValue = videos.reduce((sum, v) => sum + v.views, 0);
    return customValue;
}
```

## 📈 Chart Customization

### Adding New Charts

1. Add canvas element to `index.html`:
```html
<div class="chart-container">
    <h3>Your Chart Title</h3>
    <canvas id="customChart"></canvas>
</div>
```

2. Add render method to `dashboard.js`:
```javascript
renderCustomChart() {
    const ctx = document.getElementById('customChart').getContext('2d');
    
    this.charts.customChart = new Chart(ctx, {
        type: 'bar',  // or 'line', 'pie', etc.
        data: {
            labels: ['Jan', 'Feb', 'Mar'],
            datasets: [{
                label: 'Your Label',
                data: [10, 20, 30],
                backgroundColor: 'rgba(102, 126, 234, 0.7)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true, labels: { color: '#cbd5e1' } }
            }
        }
    });
}
```

3. Call render method in `renderCharts()`:
```javascript
renderCharts() {
    this.renderViewsOverTimeChart();
    this.renderFrequencyChart();
    this.renderTopChannelsChart();
    this.renderSubscribersChart();
    this.renderCustomChart();  // Add this line
}
```

### Changing Chart Colors

Edit the color arrays in chart methods:

```javascript
const colors = [
    'rgba(102, 126, 234, 1)',  // Purple
    'rgba(245, 87, 108, 1)',   // Red
    'rgba(16, 185, 129, 1)',   // Green
    'rgba(59, 130, 246, 1)',   // Blue
];
```

## 📋 Data Customization

### Adding Custom Fields to JSON

Extend the data structure in your JSON files:

```json
{
    "channel_name": "Channel",
    "custom_field_1": "value",
    "custom_field_2": 12345,
    "custom_nested": {
        "field": "value"
    }
}
```

### Processing Custom Fields

Update `data-loader.js` to handle new fields:

```javascript
_normalizeChannelData(rawData) {
    return {
        // ... existing fields
        custom_field_1: rawData.custom_field_1 || '',
        custom_field_2: this._parseNumber(rawData.custom_field_2)
    };
}
```

## 🎯 Layout Customization

### Changing Table Layout

To adjust column widths, edit the CSS in `styles.css`:

```css
.col-custom {
    min-width: 180px;  /* Change this value */
}
```

### Modifying Summary Cards Layout

Change grid columns in `styles.css`:

```css
.summary-cards {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    /* Increase minmax from 260px to 300px for larger cards */
}
```

### Adjusting Chart Grid

Change charts per row in `styles.css`:

```css
.charts-grid {
    grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
    /* Increase from minmax(500px) to minmax(600px) for 2-column layout */
    /* or minmax(700px) for 1-column layout */
}
```

## 🔧 Advanced Configuration

### Custom Number Formatting

Edit the `formatNumber()` method in `analytics-engine.js`:

```javascript
formatNumber(value) {
    if (value >= 1000000000) {
        return (value / 1000000000).toFixed(1) + 'B';  // Billions
    }
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
    }
    // ... more formatting
}
```

### Custom Date Format

Edit date formatting throughout:

```javascript
// In dashboard.js
const date = new Date(channel.created_at);
const formatted = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
});
```

### Changing Analysis Periods

Edit button data in `index.html`:

```html
<button class="period-btn active" data-period="2">2 Weeks</button>
<button class="period-btn" data-period="12">1 Year</button>
```

## 🚀 Performance Tuning

### Optimizing for Large Datasets

If you have many channels (100+), consider:

1. **Lazy loading charts**: Only render visible charts
2. **Table pagination**: Display channels in pages
3. **Memoization**: Cache KPI calculations

Example pagination in `dashboard.js`:

```javascript
const itemsPerPage = 20;
const startIndex = (currentPage - 1) * itemsPerPage;
const paginatedChannels = this.channels.slice(
    startIndex, 
    startIndex + itemsPerPage
);
```

## ✅ Testing Your Changes

After customization:

1. Clear browser cache (Ctrl+Shift+Delete)
2. Reload the dashboard (Ctrl+F5)
3. Open browser DevTools (F12)
4. Check Console tab for errors
5. Verify data loads correctly
6. Test all features (period switching, modal, charts)

## 🐛 Common Issues

**Issue**: Color changes don't appear
- **Solution**: Hard refresh (Ctrl+Shift+R) and clear cache

**Issue**: Charts not updating
- **Solution**: Ensure Chart.js CDN is loaded and charts are destroyed before redraw

**Issue**: Data not loading
- **Solution**: Check manifest.json is correct and JSON files exist

**Issue**: Styles look different
- **Solution**: Ensure styles.css is loaded (check Network tab in DevTools)

---

For more help, check the [README.md](README.md) file or examine the JavaScript source code.
