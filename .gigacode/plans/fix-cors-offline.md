# Plan: Fix CORS in Offline Mode

## Problem
`permission-manager.js` uses `fetch('/api/check-access')` which fails in offline mode (opening HTML directly), blocking all functionality.

## Solution
Modify `requestAccess()` to fallback to local permission when fetch fails.

### Changes

1. **File**: `static/js/permission-manager.js`

   Replace `requestAccess()` method with offline-aware version:

   ```javascript
   async requestAccess() {
       // 🔧 OFFLINE MODE: if server unavailable, allow local permission
       try {
           const response = await fetch('/api/check-access');
           if (!response.ok) throw new Error('Server unavailable');
           const data = await response.json();
           return data.access === true;
       } catch (error) {
           console.warn('⚠️ Offline mode: API check-access unavailable — allowing locally');
           console.debug('Error:', error.message);
           return true; // ✅ Always allow in offline mode
       }
   }
   ```

2. **Result**: 
   - Online: checks `/api/check-access` endpoint
   - Offline: grants permission via localStorage automatically

3. **Testing**:
   - Open HTML file directly (file://) — should work without CORS errors
   - Start server (python siss.py) — should still use API

## Priority
**HIGH** — blocks all functionality without this fix.
