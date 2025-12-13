# Troubleshooting Guide

## Common Issues & Solutions

### Dashboard Won't Load

#### Issue: Browser shows blank page
```
Symptoms: 
- White or black screen
- No dashboard elements visible
```

**Solutions:**
1. **Check browser console** (F12 → Console tab)
2. **Verify server is running** - should see something at http://localhost:8000
3. **Clear browser cache** - Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
4. **Hard refresh** - Ctrl+F5 or Ctrl+Shift+R

#### Issue: "Failed to load channels" message
```
Symptoms:
- Loading spinner stays visible
- Error message appears after timeout
```

**Solutions:**
1. **Check file paths** - Verify directory structure:
   ```
   project/
   ├── channel_stats/
   │   ├── manifest.json
   │   └── [channel files].json
   ├── index.html
   ├── styles.css
   ├── dashboard.js
   ├── analytics-engine.js
   └── data-loader.js
   ```

2. **Check manifest.json** - Should be valid JSON array:
   ```json
   ["channel1.json", "channel2.json"]
   ```

3. **Verify JSON files exist** - Files must be readable
4. **Check browser console** for CORS or 404 errors
5. **Run from proper directory** - Server must be in project root

### Charts Not Displaying

#### Issue: Canvas elements visible but empty

**Solutions:**
1. **Check Chart.js loaded**:
   ```javascript
   // In browser console:
   console.log(Chart) // Should show library object
   ```

2. **Verify CDN is accessible**:
   - Check Network tab in DevTools
   - Search for "cdn.jsdelivr.net"
   - If red X, CDN might be blocked

3. **Check for JavaScript errors**:
   - Open DevTools (F12)
   - Go to Console tab
   - Look for red error messages

4. **Try offline fallback**: 
   - Download Chart.js locally
   - Link from `<script src="chart.min.js">`

### Data Not Loading

#### Issue: Table is empty
```
Symptoms:
- Header visible but no channel rows
- Global summary shows 0
```

**Solutions:**
1. **Check channel JSON format**:
   ```javascript
   // Minimum required:
   {
       "channel_name": "string",
       "videos": [ /* array */ ]
   }
   ```

2. **Validate JSON syntax**:
   - Copy content to https://jsonlint.com
   - Check for missing commas, quotes, brackets

3. **Check data-loader.js**:
   ```javascript
   // Test in console:
   dataLoader.getChannels() // Should return array
   ```

4. **Verify manifest.json**:
   ```javascript
   // In console:
   fetch('channel_stats/manifest.json')
       .then(r => r.json())
       .then(m => console.log(m))
   ```

### Period Selector Not Working

#### Issue: Buttons don't change dashboard

**Solutions:**
1. **Check button click handlers**:
   ```javascript
   // In console:
   document.querySelectorAll('.period-btn')
   // Should return 3 buttons
   ```

2. **Verify dashboard object exists**:
   ```javascript
   console.log(dashboard) // Should show Dashboard object
   ```

3. **Check for JavaScript errors** - Console tab in DevTools

4. **Test period change manually**:
   ```javascript
   dashboard.currentPeriod = 3
   dashboard.renderDashboard()
   ```

### Modal Not Opening

#### Issue: Click channel name - nothing happens

**Solutions:**
1. **Check modal HTML exists**:
   ```javascript
   // In console:
   document.getElementById('channelModal') // Should return element
   ```

2. **Verify channel data loaded**:
   ```javascript
   dataLoader.getChannelById('channel_id')
   ```

3. **Test modal opening manually**:
   ```javascript
   dashboard.openChannelModal('UC...')
   ```

4. **Check for JavaScript errors**

### Colors Not Changing for KPIs

#### Issue: All KPIs show gray color

**Solutions:**
1. **Check neutral thresholds**:
   ```javascript
   console.log(analyticsEngine.neutralThresholds)
   // Default: { videos: 15, views: 10, medianViews: 7, subscribers: 5 }
   ```

2. **Verify change calculation**:
   ```javascript
   const kpis = analyticsEngine.calculateChannelKPIs(channel, 1)
   console.log(kpis.comparison) // Should show change percentages
   ```

3. **Check CSS classes**:
   - Inspect element (F12, select icon)
   - Look for classes: `.positive`, `.negative`, `.neutral`, `.new`
   - Check in styles.css that colors are defined

4. **Reduce threshold to test**:
   ```javascript
   analyticsEngine.setNeutralThreshold('views', 2)
   dashboard.renderDashboard()
   ```

### Server Won't Start

#### Issue: "Port already in use"

**Solutions:**
1. **Find process using port 8000**:
   ```bash
   # Windows:
   netstat -ano | findstr :8000
   # Mac/Linux:
   lsof -i :8000
   ```

2. **Kill the process**:
   ```bash
   # Windows:
   taskkill /PID [pid] /F
   # Mac/Linux:
   kill -9 [pid]
   ```

3. **Use different port**:
   ```bash
   python -m http.server 8001
   ```

#### Issue: "Python not found"

**Solutions:**
1. **Install Python**: https://www.python.org/downloads
2. **Use alternative server**:
   ```bash
   # Node.js:
   npx http-server -p 8000
   
   # PHP:
   php -S localhost:8000
   ```

### JSON File Won't Load

#### Issue: Specific channel shows error

**Solutions:**
1. **Check file encoding** - Should be UTF-8
2. **Validate JSON**:
   - Paste to https://jsonlint.com
   - Check for syntax errors
3. **Check file permissions** - Should be readable
4. **Look for special characters**:
   ```javascript
   // In console, check raw file:
   fetch('channel_stats/file.json')
       .then(r => r.text())
       .then(t => console.log(t.substring(0, 200)))
   ```

### Performance Issues

#### Issue: Dashboard slow to load

**Solutions:**
1. **Check channel count**:
   ```javascript
   dataLoader.getChannels().length
   ```

2. **Monitor load time**:
   ```javascript
   console.time('load')
   dataLoader.loadChannels().then(() => console.timeEnd('load'))
   ```

3. **Optimize JSON files**:
   - Remove unnecessary fields
   - Limit videos array to last 2 years
   - Minify JSON

#### Issue: Charts slow to render

**Solutions:**
1. **Reduce channels in charts**:
   ```javascript
   // In dashboard.js, change:
   const topChannels = this.channels.slice(0, 5) // Reduce from 5
   ```

2. **Use simpler chart types** - Line/bar faster than doughnut
3. **Disable animations** in Chart.js config

### Responsive Issues

#### Issue: Mobile layout broken

**Solutions:**
1. **Check viewport meta tag** in HTML:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   ```

2. **Test media queries**:
   - Browser DevTools → Device toolbar (Ctrl+Shift+M)
   - Test at 768px and 1200px breakpoints

3. **Adjust breakpoints** in styles.css:
   ```css
   @media (max-width: 768px) { /* Your rules */ }
   ```

### Modal Charts Not Showing

#### Issue: Modal opens but analytics tab empty

**Solutions:**
1. **Check canvas elements exist** in modal HTML
2. **Verify chart render methods** called:
   ```javascript
   dashboard.renderChannelAnalytics(channel)
   ```

3. **Test chart manually**:
   ```javascript
   // After modal opens
   console.log(dashboard.charts.modalTrendChart)
   ```

## Browser-Specific Issues

### Chrome/Chromium
- ✅ Works perfectly
- No known issues

### Firefox
- ✅ Works perfectly
- If charts pixelated: Disable hardware acceleration

### Safari
- ✅ Works well
- May need `-webkit-` prefixes (included in CSS)

### Edge
- ✅ Works perfectly
- Based on Chromium

### IE 11
- ❌ Not supported
- Uses modern JavaScript (const, arrow functions, etc.)
- Would need transpilation with Babel

## Debug Mode

Enable detailed logging:

```javascript
// Add to dashboard.js after initialize()
window.DEBUG = true

// In analytics-engine.js, add to calculateChannelKPIs():
if (window.DEBUG) console.log('KPIs:', kpis)

// In data-loader.js, add to loadChannels():
if (window.DEBUG) console.log('Loaded:', this.channels.length)
```

## Testing the API

Use browser console to test functions:

```javascript
// Test data loading
dataLoader.loadChannels().then(channels => {
    console.log('Loaded:', channels.length)
    console.log('First channel:', channels[0])
})

// Test analytics
const ch = dataLoader.getChannels()[0]
const kpis = analyticsEngine.calculateChannelKPIs(ch, 1)
console.log('KPIs:', kpis)

// Test formatting
console.log(analyticsEngine.formatNumber(1234567))      // 1.2M
console.log(analyticsEngine.formatChange(15.5))         // +15.5%
console.log(analyticsEngine.getChangeStatus(15.5, 'views')) // 'positive'

// Test summary
const summary = analyticsEngine.calculateGlobalSummary(
    dataLoader.getChannels(), 
    1
)
console.log('Summary:', summary)
```

## Check Network Activity

In DevTools Network tab, verify:
- `manifest.json` - 200 OK
- All channel JSON files - 200 OK
- `styles.css` - 200 OK
- All .js files - 200 OK
- Chart.js CDN - 200 OK (or green)

Red X means file not found or server error.

## Clear Cache & Storage

```javascript
// Clear LocalStorage
localStorage.clear()

// Clear SessionStorage
sessionStorage.clear()

// Hard refresh
// Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
```

## Get Help

1. **Check console errors** (F12 → Console)
2. **Inspect elements** (Right-click → Inspect)
3. **Check Network tab** for failed requests
4. **Compare with working files** in project
5. **Test with sample data** (use provided JSON)
6. **Read error messages carefully** - they're usually helpful

---

**Still stuck?** Try:
1. Completely close browser
2. Delete browser cache
3. Restart server
4. Start fresh with minimal data
