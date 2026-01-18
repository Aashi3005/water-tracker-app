# Widget Debugging Guide

## Why Widget Might Be Empty

### 1. **Widget Task Handler Not Being Called**
   - Check logs for: `[WIDGET] Task Handler called`
   - If this doesn't appear, the widget handler isn't registered properly

### 2. **AsyncStorage Access Issues**
   - Widgets run in a separate context
   - AsyncStorage might fail silently
   - Check logs for: `[WIDGET] Error loading widget data`

### 3. **Widget Not Rendering**
   - Widget should render even with default values (0ml / 3500ml)
   - If completely empty, there's a rendering issue

## How to Debug

1. **Check Logs:**
   ```bash
   npx expo start
   # Then check Metro bundler logs
   # Or use: adb logcat | grep -i widget
   ```

2. **Look for these log messages:**
   - `[Widget Entry] Registering widget handlers...`
   - `[Widget Entry] Registration complete!`
   - `[WIDGET] Task Handler called`
   - `[WIDGET] Data loaded successfully`
   - `[WIDGET] Rendering with:`

3. **Common Issues:**
   - If no logs appear → Widget handler not registered
   - If "Error loading widget data" → AsyncStorage issue
   - If widget renders but empty → Check WaterWidgetUI component

## Quick Fixes

1. **Clean Build:**
   ```bash
   cd android && ./gradlew clean && cd ..
   npx expo run:android
   ```

2. **Check Widget Registration:**
   - Verify `widget-entry.tsx` is imported in `index.js`
   - Verify widget name matches in `app.json` (WaterWidget)

3. **Test with Default Values:**
   - Widget should show "0ml / 3500ml (0%)" even if data fails to load

