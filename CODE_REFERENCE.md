# 📘 Quick Reference - Updated Code Structure

## 🔧 Key Methods & Properties

### `AnalyticsEngine` (analytics-engine.js)

#### New Properties
```javascript
referenceDate: Date | null  // Latest video date across all channels
```

#### New Methods
```javascript
setReferenceDate(channels)      // Sets reference date from channel videos
getReferenceDate()              // Gets current reference date
```

#### Updated Methods
```javascript
calculateChannelKPIs(channel, months)        // Now uses referenceDate
calculateGlobalSummary(channels, months)      // Now uses referenceDate
calculateVideosPerWeek(videoCount, months)    // Fixed formula
getViewsOverTime(channel, months)             // Now uses referenceDate
getPublishingDates(channel, months)           // Now uses referenceDate
```

---

### `Dashboard` (dashboard.js)

#### New Properties
```javascript
selectedChannels: Set<string>   // Set of selected channel IDs
sortColumn: string | null       // Currently sorted column
sortDirection: 'asc' | 'desc'   // Sort direction
```

#### New Methods
```javascript
// Checkbox Management
handleSelectAll(checked)
handleChannelCheckbox(channelId, checked)
getFilteredChannels()

// Sorting
handleSort(column)
sortChannels()
updateSortIndicators()
```

#### Updated Methods
```javascript
initialize()                    // Now calls setReferenceDate()
renderChannelsTable()           // Now includes checkboxes
renderGlobalSummary()           // Now uses filtered channels
renderViewsOverTimeChart()      // Now clickable & filtered
renderFrequencyChart()          // Now clickable & filtered
renderTopChannelsChart()        // Now clickable & filtered
renderSubscribersChart()        // Now with log scale & clickable
```

---

## 📊 Data Flow

### Initialization Flow
```
1. Dashboard.initialize()
   ↓
2. dataLoader.loadChannels()
   ↓
3. analyticsEngine.setReferenceDate(channels)
   ↓
4. dashboard.renderDashboard()
```

### Checkbox Interaction Flow
```
User clicks checkbox
   ↓
handleChannelCheckbox() / handleSelectAll()
   ↓
Update selectedChannels Set
   ↓
renderGlobalSummary() + renderCharts()
```

### Sorting Flow
```
User clicks column header
   ↓
handleSort(column)
   ↓
sortChannels()
   ↓
renderChannelsTable()
   ↓
updateSortIndicators()
```

### Chart Click Flow
```
User clicks chart element
   ↓
Chart onClick handler
   ↓
openChannelModal(channelId)
```

---

## 🎨 HTML Structure

### Table Header (with checkboxes & sorting)
```html
<thead>
    <tr>
        <th class="col-checkbox">
            <input type="checkbox" id="selectAllCheckbox">
        </th>
        <th class="sortable" data-sort="channel">
            Channel <span class="sort-indicator"></span>
        </th>
        <!-- More sortable columns... -->
    </tr>
</thead>
```

### Table Row (with checkbox)
```html
<tr>
    <td class="col-checkbox">
        <input type="checkbox" 
               class="channel-checkbox" 
               data-channel-id="UCxxx...">
    </td>
    <td class="col-channel">
        <span onclick="dashboard.openChannelModal('UCxxx...')">
            Channel Name
        </span>
    </td>
    <!-- More columns... -->
</tr>
```

---

## 🔢 Key Formulas

### Videos Per Week
```javascript
weeks = months * 4.345
result = (videoCount / weeks).toFixed(1)
```

### Period Calculation
```javascript
referenceDate = latest published_at date
endDate = referenceDate
startDate = referenceDate - months
```

### Month Labels for Charts
```javascript
// Returns: ["2025-10", "2025-11", "2025-12"]
for (let i = months - 1; i >= 0; i--) {
    const date = new Date(referenceDate);
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    labels.push(monthKey);
}
```

---

## 🎯 Chart Configuration

### Line Chart (Views Over Time)
```javascript
{
    type: 'line',
    options: {
        onClick: (event, activeElements) => {
            const channelId = datasets[activeElements[0].datasetIndex].channelId;
            this.openChannelModal(channelId);
        }
    }
}
```

### Bar Chart (with Log Scale)
```javascript
{
    type: 'bar',
    options: {
        scales: {
            y: {
                type: 'logarithmic',
                ticks: {
                    callback: (value) => analyticsEngine.formatNumber(value)
                }
            }
        }
    }
}
```

---

## 🎨 CSS Classes

### Interactive Elements
```css
.sortable               /* Sortable column header */
.sortable:hover         /* Hover state */
.sort-indicator         /* Sort arrow (▲/▼) */
.channel-checkbox       /* Individual checkbox */
.col-checkbox           /* Checkbox column */
```

### KPI Status Colors
```css
.kpi-change.positive    /* Green for increase */
.kpi-change.negative    /* Red for decrease */
.kpi-change.neutral     /* Gray for stable */
.kpi-change.new         /* Badge for new channels */
```

---

## 🐛 Common Issues & Solutions

### Issue: Charts are empty
**Solution:** Check that `setReferenceDate()` is called after loading channels

### Issue: Videos per week shows 0.04
**Solution:** Use correct formula: `videoCount / (months * 4.345)`

### Issue: Future dates cause issues
**Solution:** Use `getReferenceDate()` instead of `new Date()`

### Issue: Sorting treats "1M" as text
**Solution:** Sort by numeric value, not formatted string

### Issue: Charts don't update on checkbox change
**Solution:** Ensure `getFilteredChannels()` is used in chart rendering

---

## 📦 File Dependencies

```
index.html
  ↓ includes
  ├── data-loader.js
  ├── analytics-engine.js
  └── dashboard.js
      ↓ depends on
      ├── dataLoader (from data-loader.js)
      └── analyticsEngine (from analytics-engine.js)
```

---

## 🚀 Initialization Checklist

When dashboard loads:
1. ✅ Load manifest.json
2. ✅ Load all channel JSON files
3. ✅ Calculate reference date from all videos
4. ✅ Render table with checkboxes
5. ✅ Render summary (all channels)
6. ✅ Render charts (all channels or top 5)
7. ✅ Attach event listeners (checkboxes, sorting)

---

**Last Updated:** December 13, 2025
