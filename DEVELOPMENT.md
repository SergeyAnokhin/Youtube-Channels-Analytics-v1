# Quick Developer Reference

## Project Architecture

```
┌─────────────────────────────────────────┐
│       index.html (UI Structure)         │
├─────────────────────────────────────────┤
│  styles.css (Design & Responsiveness)   │
├─────────────────────────────────────────┤
│  dashboard.js (Main Controller)         │
│       ↓                                 │
│  ├─ Renders table                       │
│  ├─ Manages modals                      │
│  ├─ Handles period selection            │
│  └─ Initializes charts                  │
│       ↓                                 │
├──────────────────────────────────────────┤
│  analytics-engine.js (Calculations)     │
│       ↓                                 │
│  ├─ KPI calculations                    │
│  ├─ Period comparisons                  │
│  ├─ Number formatting                   │
│  └─ Data aggregations                   │
│       ↓                                 │
├──────────────────────────────────────────┤
│  data-loader.js (Data Access)           │
│       ↓                                 │
│  ├─ Loads JSON files                    │
│  ├─ Normalizes data                     │
│  └─ Validates structure                 │
│       ↓                                 │
├──────────────────────────────────────────┤
│  channel_stats/*.json (Data Source)     │
└──────────────────────────────────────────┘
```

## Key Objects & Methods

### DataLoader
```javascript
// Load all channels
await dataLoader.loadChannels()

// Get channel by ID
dataLoader.getChannelById(channelId)

// Get all channels
dataLoader.getChannels()
```

### AnalyticsEngine
```javascript
// Calculate KPIs for a channel
analyticsEngine.calculateChannelKPIs(channel, months)
// Returns: { currentPeriod, previousPeriod, comparison }

// Get global summary
analyticsEngine.calculateGlobalSummary(channels, months)

// Get videos in date range
analyticsEngine.getVideosInPeriod(channel, startDate, endDate)

// Get top videos
analyticsEngine.getTopVideosByMetric(channel, 'views'|'engagement', months, limit)

// Format number (1.2M, 450K)
analyticsEngine.formatNumber(value)

// Format percentage change (+5.2%, -3.1%)
analyticsEngine.formatChange(percentageChange)

// Get change status (positive|negative|neutral|new)
analyticsEngine.getChangeStatus(change, kpiType)

// Set neutral threshold
analyticsEngine.setNeutralThreshold(kpiType, percentage)
```

### Dashboard
```javascript
// Initialize and load
dashboard.initialize()

// Open channel modal
dashboard.openChannelModal(channelId)

// Close modal
dashboard.closeModal()

// Switch tab in modal
dashboard.switchTab(tabName)

// Render all sections
dashboard.renderDashboard()

// Specific renders
dashboard.renderChannelsTable()
dashboard.renderGlobalSummary()
dashboard.renderCharts()
```

## Common Customizations

### Add a new KPI column

**1. HTML** (`index.html`):
```html
<th class="col-new-kpi">New KPI</th>
```

**2. Analytics** (`analytics-engine.js`):
```javascript
calculateNewKPI(channel, months) {
    // Your calculation
    return result;
}
```

**3. Dashboard** (`dashboard.js`):
```html
<td class="col-new-kpi">
    <span class="kpi-value">VALUE</span>
    <span class="kpi-change">CHANGE</span>
</td>
```

### Change theme colors

**Edit `styles.css`:**
```css
:root {
    --primary-gradient: linear-gradient(135deg, #COLOR1 0%, #COLOR2 100%);
    --success-color: #GREEN;
    --danger-color: #RED;
}
```

### Modify period options

**Edit `index.html`:**
```html
<button class="period-btn" data-period="2">2 Weeks</button>
```

JavaScript automatically picks up the `data-period` value.

### Add a new chart

**1. HTML** (`index.html`):
```html
<canvas id="newChart"></canvas>
```

**2. Dashboard** (`dashboard.js`):
```javascript
renderNewChart() {
    const ctx = document.getElementById('newChart').getContext('2d');
    this.charts.newChart = new Chart(ctx, { /* config */ });
}

renderCharts() {
    // ... existing charts ...
    this.renderNewChart();
}
```

## Data Flow

```
1. App Start
   └─ Dashboard.initialize()
      ├─ dataLoader.loadChannels()
      │  ├─ Fetch manifest.json
      │  ├─ Load all channel JSONs
      │  └─ Normalize & validate data
      └─ dashboard.renderDashboard()
         ├─ renderChannelsTable()
         ├─ renderGlobalSummary()
         └─ renderCharts()

2. Period Change
   └─ User clicks period button
      ├─ Update currentPeriod value
      └─ dashboard.renderDashboard() (same as above)
      
3. Modal Open
   └─ User clicks channel name
      ├─ dashboard.openChannelModal(channelId)
      ├─ Fetch channel data
      ├─ Render all modal tabs
      ├─ Create modal charts
      └─ Show modal

4. Data Calculations
   └─ analyticsEngine.calculateChannelKPIs()
      ├─ Filter videos by date range
      ├─ Calculate metrics (sum, median, avg)
      ├─ Compare to previous period
      └─ Return { current, previous, comparison }
```

## File Sizes

| File | Size | Purpose |
|------|------|---------|
| index.html | ~8KB | Structure |
| styles.css | ~15KB | Design |
| dashboard.js | ~30KB | UI & Logic |
| analytics-engine.js | ~12KB | Calculations |
| data-loader.js | ~5KB | Data Loading |
| **Total** | **~70KB** | Complete Dashboard |
| Chart.js (CDN) | ~100KB | Visualizations |

## Browser Support

- ✅ Chrome/Chromium 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE 11 (not supported - uses modern JavaScript)

## Testing Checklist

- [ ] Data loads on startup
- [ ] All channels appear in table
- [ ] Period buttons work
- [ ] KPIs update on period change
- [ ] Colors reflect correct status
- [ ] Modal opens on channel click
- [ ] Modal tabs work
- [ ] Modal charts render
- [ ] Charts update on period change
- [ ] Summary cards update
- [ ] Responsive on mobile
- [ ] No console errors
- [ ] No CORS errors (local files)

## Performance Optimization Tips

1. **Lazy load images** if adding logos
2. **Debounce** period change if adding real-time data
3. **Memoize** KPI calculations for repeated periods
4. **Paginate** table if 100+ channels
5. **Use IndexedDB** for offline caching
6. **Minify** CSS/JS for production

## Debugging

**Check loaded data:**
```javascript
console.log(dataLoader.getChannels())
```

**Check KPI calculation:**
```javascript
const kpis = analyticsEngine.calculateChannelKPIs(channel, 1)
console.log(kpis)
```

**Check DOM elements:**
```javascript
console.log(document.getElementById('channelsTable'))
```

**Check Chart.js:**
```javascript
console.log(Chart)
console.log(dashboard.charts)
```

## Environment Variables / Config

None currently. All configuration is hardcoded:
- `analytics-engine.js` - neutralThresholds
- `styles.css` - CSS variables
- `index.html` - Period buttons

To make it configurable:
```javascript
// Add to window object
window.DASHBOARD_CONFIG = {
    neutralThresholds: { /* ... */ },
    colors: { /* ... */ },
    periods: [1, 3, 6]
};
```

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Cannot read property 'videos' of undefined" | Channel data missing | Check JSON format |
| Charts not rendering | Chart.js not loaded | Check CDN in HTML |
| Modal not opening | Missing HTML element | Verify modal div exists |
| Data not loading | File path wrong | Check manifest.json |
| Colors not updating | CSS not cached | Clear browser cache |
| Period buttons stuck | Event listener failed | Check dashboard.js |

---

**Need help?** Check:
1. [README.md](README.md) - Setup & usage
2. [FEATURES.md](FEATURES.md) - Full feature list
3. [CUSTOMIZATION.md](CUSTOMIZATION.md) - How to modify
4. Browser DevTools Console - For errors
