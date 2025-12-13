# 🧪 Testing Guide - YouTube Channels Analytics v1

## 🚀 Quick Start

### 1. Start the Server
```bash
cd C:\REPOS\Youtube-Channels-Analytics-v1
python -m http.server 8000
```

### 2. Open in Browser
Navigate to: `http://localhost:8000`

---

## ✅ Testing Checklist

### 1. **Data Loading** (Auto-Load)
- [ ] Page loads without errors
- [ ] Loading indicator appears briefly
- [ ] All channels appear in table (43 channels expected)
- [ ] No manual file upload UI visible

**Expected Result:** All channels load automatically from `channel_stats/` folder

---

### 2. **Date Calculation Fix**
#### Test A: Check Reference Date in Console
1. Open browser DevTools (F12)
2. Look for console message: `"Reference date set to: [date]"`
3. The date should be the latest video date from all channels

#### Test B: Check if Graphs Show Data
- [ ] "Views Over Time" chart shows colored lines (not empty)
- [ ] Data points visible on the chart
- [ ] Hover shows tooltips with values

**Expected Result:** Charts display data correctly (not empty)

---

### 3. **Videos Per Week Formula**
- [ ] Look at "Avg Videos/Week" column
- [ ] Values should be realistic (e.g., 0.5, 1.2, 3.0, not 0.04)
- [ ] All values rounded to 1 decimal place

**Expected Result:** Values between 0.1 and 10.0 (reasonable range)

---

### 4. **Checkbox Functionality**

#### Test A: Select All
1. Click the checkbox in the table header (first column)
2. [ ] All row checkboxes become checked
3. [ ] Summary cards update immediately
4. [ ] Charts update to reflect selection
5. Click header checkbox again
6. [ ] All checkboxes uncheck
7. [ ] Summary/charts show all channels again

#### Test B: Individual Checkboxes
1. Uncheck all (click header if needed)
2. Check 3-5 individual channels
3. [ ] "Select All" checkbox shows indeterminate state (dash)
4. [ ] Summary shows stats for ONLY selected channels
5. [ ] Charts show ONLY selected channels

#### Test C: Filtering Behavior
- [ ] Table ALWAYS shows all channels (never hides rows)
- [ ] Summary section updates based on selection
- [ ] All 4 charts update based on selection

**Expected Result:** Dynamic filtering without hiding table rows

---

### 5. **Table Sorting**

#### Test A: Sort by Channel Name
1. Click "Channel" header
2. [ ] Sort indicator appears (▼ or ▲)
3. [ ] Channels sorted alphabetically
4. Click again
5. [ ] Sort direction reverses
6. [ ] Indicator changes (▲ or ▼)

#### Test B: Sort by Numbers
1. Click "Subscribers" header
2. [ ] Largest numbers at top (descending)
3. [ ] 1.5M appears above 900K (not alphabetically!)
4. Click again
5. [ ] Smallest numbers at top

#### Test C: Sort by Calculated Values
1. Click "Avg Videos/Week" header
2. [ ] Sorts by numeric value (3.0 > 1.5 > 0.5)
3. [ ] Not by text (would be wrong: 3.0 < 1.5 < 0.5)

**Test All Sortable Columns:**
- [ ] Channel (alphabetical)
- [ ] Style/Genre (alphabetical)
- [ ] Subscribers (numeric)
- [ ] Videos (numeric)
- [ ] Views (Period) (numeric)
- [ ] Median Views (numeric)
- [ ] Avg Videos/Week (numeric)

**Expected Result:** Proper sorting with correct indicators

---

### 6. **Chart Interactivity**

#### Test A: Views Over Time Chart (Line Chart)
1. Click on a line in the chart
2. [ ] Channel detail modal opens
3. [ ] Modal shows correct channel
4. Close modal
5. Click on legend (channel name)
6. [ ] Modal opens again

#### Test B: Publishing Frequency Chart (Horizontal Bar)
1. Click on a bar
2. [ ] Modal opens for that channel

#### Test C: Top Channels Chart (Doughnut)
1. Click on a segment
2. [ ] Modal opens for that channel
3. Click on legend item
4. [ ] Modal opens for that channel

#### Test D: Subscriber Distribution Chart (Bar)
1. Click on a bar
2. [ ] Modal opens for that channel

**Expected Result:** All charts are clickable and open correct channel modal

---

### 7. **Logarithmic Scale**

#### Test: Subscriber Distribution Chart
1. Look at "Subscriber Distribution" chart
2. [ ] Y-axis shows values like: 1K, 10K, 100K, 1M
3. [ ] Small channels (5K) visible alongside large channels (500K)
4. [ ] Bars of different heights, not all tiny except one giant

**Expected Result:** Small and large channels both visible clearly

---

### 8. **Period Switching**

1. Click "1 Month" button
   - [ ] All data recalculates
   - [ ] Table values update
   - [ ] Charts update
   
2. Click "3 Months" button
   - [ ] All data recalculates
   - [ ] Table values change
   - [ ] Charts show 3 months of data
   
3. Click "6 Months" button
   - [ ] All data recalculates
   - [ ] Charts show 6 months

**Expected Result:** All calculations based on reference date, not today

---

### 9. **Combined Interactions**

#### Test: Checkbox + Sort + Period
1. Select 5 channels with checkboxes
2. Change to 3-month period
3. Sort by "Views (Period)"
4. [ ] Table sorts correctly
5. [ ] Summary shows only selected channels
6. [ ] Charts show only selected channels for 3-month period

#### Test: Checkbox + Chart Click
1. Select 3 channels
2. Click on one of them in the "Views Over Time" chart
3. [ ] Modal opens
4. [ ] Modal shows correct channel data

**Expected Result:** All features work together seamlessly

---

## 🐛 Known Issues to Check

### Issue 1: Empty Charts
**Symptom:** Charts show no data lines/bars
**Check:** Console should show reference date being set
**Fix:** Ensure `setReferenceDate()` is called in `initialize()`

### Issue 2: Wrong Videos/Week
**Symptom:** Shows 0.04 or very small numbers
**Check:** Formula should be `videoCount / (months * 4.345)`
**Fix:** Check `calculateVideosPerWeek()` method

### Issue 3: Checkboxes Don't Filter
**Symptom:** Charts don't update when checking/unchecking
**Check:** `getFilteredChannels()` should be called in chart methods
**Fix:** Ensure all chart methods use `getFilteredChannels()`

### Issue 4: Sorting Treats Numbers as Text
**Symptom:** "1M" sorts before "900K" (alphabetically)
**Check:** Sort should compare numeric values, not formatted strings
**Fix:** Parse numbers before comparing in `sortChannels()`

---

## 📊 Expected Console Output

### On Page Load:
```
Loaded 43 channels
Reference date set to: [Date object]
```

### On Checkbox Change:
(No console output expected, but charts should update)

### On Sort:
(No console output expected, but table should reorder)

---

## 🎯 Success Criteria

✅ All 43 channels load automatically  
✅ No empty charts  
✅ Videos/week shows realistic values (0.5-10.0)  
✅ Checkboxes filter summary and charts  
✅ "Select All" works correctly  
✅ All columns sortable with indicators  
✅ All charts clickable  
✅ Subscriber chart uses log scale  
✅ Period switching works  
✅ All features work together  

---

## 📝 Test Results Template

```
Test Date: _____________
Browser: ________________
Tester: _________________

[ ] Data Loading: Pass / Fail
[ ] Date Calculation: Pass / Fail
[ ] Videos/Week: Pass / Fail
[ ] Checkboxes: Pass / Fail
[ ] Sorting: Pass / Fail
[ ] Chart Clicks: Pass / Fail
[ ] Log Scale: Pass / Fail
[ ] Period Switch: Pass / Fail
[ ] Combined: Pass / Fail

Issues Found:
1. _________________________
2. _________________________
3. _________________________

Notes:
_____________________________
_____________________________
```

---

## 🔍 Debug Mode

To enable detailed logging, add this to browser console:
```javascript
// Enable debug logging
localStorage.setItem('debug', 'true');
location.reload();
```

---

**Happy Testing! 🎉**
