# MapControlBar Component

## Overview

The `MapControlBar` is a unified horizontal UI component that combines basemap selection and map projection switching into a single, cohesive interface. It follows modern UX best practices with tooltips, keyboard shortcuts, and accessibility features.

## Features

### 🎨 **Unified Interface**
- **Horizontal Layout**: Space-efficient design that combines two previously separate components
- **Visual Hierarchy**: Clear separation between projection controls and basemap selection
- **Consistent Styling**: Cohesive design language with glassmorphism effects

### ⌨️ **Keyboard Shortcuts**
- **Projection Switching**:
  - `F` - Switch to flat map view
  - `G` - Switch to globe view
- **Basemap Selection**:
  - `S` - Satellite imagery
  - `T` - Streets/terrain view
  - `D` - Dark theme
  - `X` - GIX Blue theme
  - `M` - Default/first theme

### ♿ **Accessibility**
- **Screen Reader Support**: Comprehensive ARIA labels and descriptions
- **Keyboard Navigation**: Full keyboard accessibility for all interactions
- **Focus Management**: Proper focus handling and visual indicators
- **High Contrast**: Readable text and clear visual boundaries

### 💡 **Enhanced UX**
- **Tooltips**: Contextual help with keyboard shortcut hints
- **Loading States**: Clear visual feedback during operations
- **Error Handling**: Graceful degradation and user feedback
- **Responsive Design**: Adapts to different screen sizes

## Component Structure

```
MapControlBar
├── Projection Toggle Section
│   ├── Flat Map Button (with tooltip)
│   └── Globe Button (with tooltip)
├── Divider
└── Basemap Selector Section
    ├── Current Theme Display
    │   ├── Theme Icon
    │   ├── Visual Preview
    │   ├── Theme Name
    │   └── Dropdown Arrow
    └── Dropdown Menu
        ├── Theme Options
        │   ├── Icon + Preview + Details + Shortcut
        │   └── Selection Indicator
        └── Help Text
```

## Props Interface

```typescript
interface MapControlBarProps {
  currentTheme: MapTheme           // Current selected theme
  onThemeChange: (theme: MapTheme) => void  // Theme change handler
  isGlobeView: boolean            // Current projection state
  onProjectionToggle: (isGlobeView: boolean) => void  // Projection toggle handler
  isChanging?: boolean            // Loading state for theme changes
  disabled?: boolean              // Disable all interactions
  className?: string              // Additional CSS classes
}
```

## Usage Example

```tsx
import MapControlBar from '@/components/MapControlBar'
import { MAP_THEMES } from '@/config/constants'

function MyMapComponent() {
  const [currentTheme, setCurrentTheme] = useState(MAP_THEMES[0])
  const [isGlobeView, setIsGlobeView] = useState(true)
  const [isChanging, setIsChanging] = useState(false)

  const handleThemeChange = async (theme: MapTheme) => {
    setIsChanging(true)
    try {
      await changeMapTheme(theme)
      setCurrentTheme(theme)
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <MapControlBar
      currentTheme={currentTheme}
      onThemeChange={handleThemeChange}
      isGlobeView={isGlobeView}
      onProjectionToggle={setIsGlobeView}
      isChanging={isChanging}
    />
  )
}
```

## Design Principles

### **Visual Design**
- **Glassmorphism**: Semi-transparent background with blur effects
- **Rounded Corners**: Modern, friendly appearance with rounded-2xl borders
- **Subtle Shadows**: Depth and hierarchy through shadow-2xl
- **Color Coding**: Blue accents for active states, emerald for selections

### **Interaction Design**
- **Hover Effects**: Subtle scale and color transitions
- **Active States**: Clear visual feedback for current selections
- **Loading States**: Non-blocking progress indicators
- **Disabled States**: Reduced opacity and pointer events

### **Information Architecture**
- **Logical Grouping**: Related controls grouped together
- **Visual Hierarchy**: Size, color, and spacing to guide attention
- **Progressive Disclosure**: Detailed options revealed on demand
- **Contextual Help**: Tooltips and shortcuts where needed

## Performance Optimizations

### **React Optimizations**
```typescript
// Memoized configurations to prevent unnecessary re-renders
const currentThemeConfig = useMemo(() => ({
  Icon: getThemeConfig(currentTheme.id, 'icons'),
  preview: getThemeConfig(currentTheme.id, 'previews'),
  description: getThemeConfig(currentTheme.id, 'descriptions')
}), [currentTheme.id])

// Optimized event handlers with useCallback
const handleThemeChange = useCallback(async (theme: MapTheme) => {
  // Implementation with proper error handling
}, [dependencies])
```

### **Configuration Management**
```typescript
// Centralized theme configuration with TypeScript safety
const THEME_CONFIG = {
  icons: { /* theme icons */ },
  previews: { /* visual previews */ },
  descriptions: { /* user descriptions */ },
  shortcuts: { /* keyboard shortcuts */ }
} as const
```

## Accessibility Features

### **ARIA Support**
- `aria-label`: Descriptive labels for all interactive elements
- `aria-pressed`: State indication for toggle buttons
- `role="group"`: Semantic grouping of related controls
- `aria-hidden`: Decorative elements hidden from screen readers

### **Keyboard Navigation**
- **Tab Order**: Logical focus sequence through all controls
- **Enter/Space**: Activation of buttons and menu items
- **Escape**: Close dropdown menus
- **Arrow Keys**: Navigate through dropdown options

### **Visual Accessibility**
- **High Contrast**: Sufficient color contrast ratios
- **Focus Indicators**: Clear visual focus states
- **Text Sizing**: Readable font sizes and line heights
- **Motion Respect**: Respects user's motion preferences

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Browsers**: iOS Safari 14+, Chrome Mobile 90+
- **Accessibility**: NVDA, JAWS, VoiceOver screen readers
- **Keyboard Only**: Full functionality without mouse/touch

## Migration Guide

### From Separate Components

**Before:**
```tsx
<MapViewToggle 
  isGlobeView={isGlobeView}
  onToggle={handleMapViewToggle}
/>
<BasemapSelector 
  currentTheme={currentTheme}
  onThemeChange={handleThemeChange}
  isChanging={isChanging}
/>
```

**After:**
```tsx
<MapControlBar
  currentTheme={currentTheme}
  onThemeChange={handleThemeChange}
  isGlobeView={isGlobeView}
  onProjectionToggle={handleMapViewToggle}
  isChanging={isChanging}
/>
```

### Benefits of Migration
- **Reduced Bundle Size**: Single component instead of two
- **Better UX**: Unified interface with consistent interactions
- **Enhanced Accessibility**: Comprehensive ARIA support
- **Keyboard Shortcuts**: Built-in shortcut support
- **Improved Performance**: Optimized re-rendering and state management

## Customization

### **Styling**
```tsx
<MapControlBar
  className="custom-positioning"
  // Component automatically handles internal styling
/>
```

### **Theme Configuration**
```typescript
// Extend THEME_CONFIG for custom themes
const CUSTOM_THEME_CONFIG = {
  ...THEME_CONFIG,
  icons: {
    ...THEME_CONFIG.icons,
    'my-theme': MyCustomIcon
  }
}
```

## Testing

### **Unit Tests**
- Component rendering with different props
- Event handler invocation
- Keyboard shortcut functionality
- Accessibility compliance

### **Integration Tests**
- Theme switching workflow
- Projection toggle workflow
- Keyboard navigation flow
- Error handling scenarios

### **E2E Tests**
- Complete user workflows
- Cross-browser compatibility
- Mobile responsiveness
- Screen reader compatibility

## Troubleshooting

### **Common Issues**

**Tooltips not showing:**
- Ensure `TooltipProvider` is wrapping the component
- Check `delayDuration` prop for timing issues

**Keyboard shortcuts not working:**
- Verify `useKeyboardShortcuts` hook is active
- Check for conflicting event handlers
- Ensure component is not disabled

**Theme changes not reflecting:**
- Verify `onThemeChange` handler is properly implemented
- Check for async operation completion
- Ensure proper state management

**Performance issues:**
- Check for unnecessary re-renders with React DevTools
- Verify memoization is working correctly
- Monitor for memory leaks in event handlers

## Future Enhancements

### **Potential Improvements**
1. **Animation Framework**: Enhanced transitions with Framer Motion
2. **Theme Previews**: Live preview on hover
3. **Custom Themes**: User-defined theme support
4. **Gesture Support**: Touch gestures for mobile
5. **Voice Control**: Voice command integration

### **Accessibility Enhancements**
1. **High Contrast Mode**: Automatic high contrast detection
2. **Reduced Motion**: Respect for motion preferences
3. **Voice Announcements**: Screen reader announcements for changes
4. **Focus Trap**: Better focus management in dropdown

This unified component represents a significant improvement in both user experience and code maintainability, following modern React and accessibility best practices. 