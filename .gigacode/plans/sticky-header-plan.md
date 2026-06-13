# Sticky Header with Adaptive Corners - Implementation Plan

## Requirements
1. Header blocks should fill 100% width with no external gaps
2. Rounded corners only where there's no block below
3. Universal solution for any number of header blocks

## Solution Strategy

### HTML Structure
Wrap all header blocks in a `.header-group` container:
```html
<div class="header-group">
    <header class="site-header">...</header>
    <div class="news-header-panel">...</div>
</div>
```

### CSS Implementation
1. **Remove border-radius from individual blocks** - they'll inherit rounded corners from the group
2. **Use :first-child and :last-child pseudo-classes**:
   - First child: rounded top corners, straight bottom
   - Middle children: straight corners on all sides
   - Last child: straight top, rounded bottom corners
3. **Ensure full width**: `width: 100%; max-width: none; margin: 0;`
4. **Sticky positioning**: `position: sticky; top: 0; z-index: appropriate;`

### Corner Rounding Logic
- Top header block: `border-radius: 1rem 1rem 0 0` (top rounded, bottom straight)
- Middle header blocks: `border-radius: 0` (all straight for seamless stacking)
- Bottom header block: `border-radius: 0 0 1rem 1rem` (top straight, bottom rounded)

## Implementation Steps
1. Update CSS to use pseudo-classes for corner control
2. Ensure header blocks stack seamlessly
3. Test with multiple header configurations
4. Verify responsive behavior

## Files to Modify
- `static/css/style.css`
