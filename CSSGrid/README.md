# CSS Grid Widget for Mendix

A powerful, production-ready CSS Grid implementation for Mendix applications, providing native CSS Grid Layout
capabilities with full responsive support, virtualization, and accessibility features.

## Table of Contents

-   [Overview](#overview)
-   [Key Features](#key-features)
-   [Installation](#installation)
-   [Quick Start](#quick-start)
-   [Core Concepts](#core-concepts)
-   [Responsive Design](#responsive-design)
-   [Styling Guide](#styling-guide)
-   [Widget Properties](#widget-properties)
-   [Item Placement](#item-placement)
-   [Performance](#performance)
-   [Examples](#examples)
-   [Development](#development)
-   [Troubleshooting](#troubleshooting)
-   [Browser Support](#browser-support)

## Overview

This widget brings the full power of CSS Grid Layout to Mendix, allowing developers to create complex, responsive
layouts without writing custom CSS. It's designed for production use with performance optimizations and extensive
customization options.

## Key Features

-   **🎯 True CSS Grid**: Native CSS Grid implementation with all standard features
-   **📱 Advanced Responsive**: 8 breakpoints including 2K and 4K displays
-   **🎨 Smart Styling**: Breakpoint-aware CSS classes for responsive styling
-   **⚡ Performance**: Built-in virtualization for grids with 100+ items
-   **🔧 Flexible Placement**: Auto, area, coordinate, and span placement modes
-   **📐 Item Alignment**: Responsive justify-self, align-self, and z-index per item
-   **♿ Accessibility**: Full ARIA support and keyboard navigation
-   **🎪 Debug Mode**: Visual grid lines, areas, and gaps in Studio Pro

## Installation

### From Mendix Marketplace

1. Download the widget from the Mendix Marketplace
2. Import the widget into your Mendix project
3. Drag the CSS Grid widget onto a page
4. Configure grid properties and add content

### Requirements

-   Mendix Studio Pro 10.24.0 or higher
-   Modern browsers with CSS Grid support

## Quick Start

### Basic Responsive Grid

1. Add CSS Grid widget to your page
2. Set these properties:
    ```
    Grid Template Columns: repeat(auto-fit, minmax(300px, 1fr))
    Gap: 20px
    ```
3. Add content items - they'll automatically arrange responsively

### Dashboard Layout with Named Areas

1. Enable "Use Named Areas"
2. Configure:
    ```
    Grid Template Columns: 250px 1fr 300px
    Grid Template Rows: 70px 1fr
    Grid Template Areas:
    "header header header"
    "sidebar main aside"
    ```
3. Set items to use area placement (e.g., "header", "sidebar", etc.)

## Core Concepts

### Grid Structure

```
     1   2   3   4  ← Column Lines
   +---+---+---+
 1 | A | B | C |    ← Grid Track (Row)
   +---+---+---+
 2 | D | E | F |    ← Grid Cell
   +---+---+---+
   ↑
Row Line
```

### Track Sizing Options

-   **Fixed**: `200px`, `20rem`, `50vw`
-   **Flexible**: `1fr`, `2fr` (fraction of available space)
-   **Content-based**: `auto`, `min-content`, `max-content`
-   **Functions**: `minmax(200px, 1fr)`, `fit-content(300px)`
-   **Repeat**: `repeat(3, 1fr)`, `repeat(auto-fill, 200px)`

## Responsive Design

### Breakpoints

The widget supports 8 responsive breakpoints:

| Breakpoint     | Size        | Target Devices   |
| -------------- | ----------- | ---------------- |
| **XS**         | <640px      | Mobile portrait  |
| **SM**         | 640-767px   | Mobile landscape |
| **MD**         | 768-1023px  | Tablets          |
| **LG**         | 1024-1439px | Small laptops    |
| **XL**         | 1440-1919px | Desktops         |
| **XXL**        | 1920-2559px | Large desktops   |
| **2K (XXXL)**  | 2560-3839px | 2K displays      |
| **4K (XXXXL)** | ≥3840px     | 4K displays      |

### Responsive Modes

**New in v1.2.0**: Choose between two responsive behavior modes:

1. **Exact Breakpoints** (Default)

    - Each breakpoint applies only within its specific range
    - Complete control over each screen size
    - Best for designs that need distinct layouts at each size

2. **Mobile-First Cascade**
    - Breakpoints inherit from smaller sizes
    - Progressive enhancement approach
    - Reduces configuration by only specifying changes
    - Similar to how CSS media queries naturally work

Configure in the widget properties under "Responsive Grid" → "Responsive Mode"

### Container-Level Responsiveness

Enable different grid layouts at different screen sizes:

```
Base Configuration:
Grid Template Columns: 1fr
Gap: 16px

MD Breakpoint: ✓ Enabled
MD Columns: repeat(2, 1fr)
MD Gap: 20px

XL Breakpoint: ✓ Enabled
XL Columns: repeat(4, 1fr)
XL Gap: 24px
```

### Item-Level Responsiveness

Items can have different placements and alignments per breakpoint:

1. Enable "Enable Responsive Placement" on the item
2. Configure per-breakpoint:
    - Placement type (auto, area, coordinates, span)
    - Grid position
    - Alignment (justify-self, align-self)
    - Z-index for layering

## Styling Guide

### Responsive Styling with CSS Classes

The grid automatically adds breakpoint classes that you can target with CSS:

```css
/* Base styles for all screen sizes */
.my-grid-item {
    background: white;
    padding: 1rem;
}

/* Styles for extra small screens */
.mx-grid-xs .my-grid-item {
    padding: 0.5rem;
    font-size: 14px;
}

/* Styles for medium screens and up */
.mx-grid-md .my-grid-item {
    padding: 1.5rem;
    font-size: 16px;
}

/* Styles for 4K displays */
.mx-grid-xxxxl .my-grid-item {
    padding: 2rem;
    font-size: 18px;
}
```

### Dynamic Classes

Use the item's Dynamic Class property with expressions:

```javascript
// Different classes based on data
if $currentObject/Status = 'Active'
then 'item-active'
else 'item-inactive'
```

Then style with CSS:

```css
.item-active {
    background: #e8f5e9;
}
.item-inactive {
    opacity: 0.7;
}

/* Responsive variant */
.mx-grid-xs .item-active {
    background: #f1f8e9;
}
```

### CSS Custom Properties

The widget exposes CSS variables for consistent styling:

```css
.mx-css-grid {
    /* Typography */
    --mx-grid-item-font-size: 16px;
    --mx-grid-item-line-height: 1.5;
    --mx-grid-item-color: #333;

    /* Spacing */
    --mx-grid-item-padding: 1rem;
    --mx-grid-item-margin: 0;
}

/* Responsive typography */
.mx-css-grid {
    --mx-grid-item-font-size: clamp(14px, 2vw, 18px);
}
```

### Targeting Specific Items

```css
/* By item name */
[data-item-name="header"] {
    background: #f5f5f5;
    font-weight: bold;
}

/* By grid area */
[style*="--item-area: sidebar"] {
    border-right: 1px solid #ddd;
}

/* By index */
.mx-grid-item:nth-child(1) {
    border-radius: 8px 8px 0 0;
}
```

## Widget Properties

### Essential Grid Properties

| Property                  | Description               | Example         |
| ------------------------- | ------------------------- | --------------- |
| **Grid Template Columns** | Define column structure   | `1fr 2fr 1fr`   |
| **Grid Template Rows**    | Define row structure      | `auto 1fr auto` |
| **Gap**                   | Spacing between all items | `20px`          |
| **Row Gap**               | Vertical spacing only     | `24px`          |
| **Column Gap**            | Horizontal spacing only   | `16px`          |

> **Note**: When Gap is set, Row Gap and Column Gap are hidden in Studio Pro

### Named Areas

When "Use Named Areas" is enabled:

```css
Grid Template Areas:
"header header header"
"nav content aside"
"footer footer footer"
```

Rules:

-   Each row must be quoted
-   Use dots (.) for empty cells
-   Area names must form rectangles
-   All rows must have equal columns

### Alignment Properties

**Container Level** (affects all items):

-   **Justify Items**: Horizontal alignment in cells
-   **Align Items**: Vertical alignment in cells
-   **Justify Content**: Horizontal alignment of entire grid
-   **Align Content**: Vertical alignment of entire grid

**Item Level** (per item):

-   **Justify Self**: Override horizontal alignment
-   **Align Self**: Override vertical alignment
-   **Z-Index**: Stacking order (useful for overlaps)

Values: `auto`, `start`, `end`, `center`, `stretch`

### Auto-Flow Properties

Control how items are automatically placed:

-   **Auto Flow**: Direction (`row`, `column`, `dense`)
-   **Auto Rows**: Size of implicit rows (`minmax(100px, auto)`)
-   **Auto Columns**: Size of implicit columns (`1fr`)

## Item Placement

### Placement Types

1. **Auto**: Grid decides placement

    ```
    Placement Type: Auto
    ```

2. **Area**: Place in named area

    ```
    Placement Type: Area
    Grid Area: header
    ```

3. **Coordinates**: Exact line numbers

    ```
    Placement Type: Coordinates
    Column Start: 1
    Column End: 3
    Row Start: 2
    Row End: 3
    ```

4. **Span**: Start position + span
    ```
    Placement Type: Span
    Column Start: 2
    Column Span: 2
    Row Start: 1
    Row Span: 3
    ```

### Responsive Placement

Items can change placement per breakpoint:

```
Base: Auto placement

MD Breakpoint:
- Placement: Coordinates
- Column: 1 to 3
- Row: 1 to 2

XL Breakpoint:
- Placement: Area
- Area: sidebar
```

## Performance

### Virtualization

For grids with many items:

1. Enable "Enable Virtualization"
2. Set "Virtualization Threshold" (default: 100)
3. Only visible items render, improving performance

Best practices:

-   Use for 100+ items
-   Keep item content simple
-   Test scroll performance
-   Monitor memory usage

### Performance Tips

1. **Use CSS Grid's repeat()** instead of many columns
2. **Minimize DOM depth** in grid items
3. **Use virtualization** for large datasets
4. **Avoid complex calculations** in Dynamic Classes

## Examples

### Responsive Card Grid

```
Grid Template Columns: repeat(auto-fit, minmax(300px, 1fr))
Gap: 24px
Align Items: stretch
```

### Pinterest-Style Layout

```
Grid Template Columns: repeat(auto-fill, 250px)
Auto Rows: 10px
Gap: 20px

Items use span for variable heights:
- Item 1: Row Span 20 (200px)
- Item 2: Row Span 15 (150px)
- etc.
```

### Complex Dashboard

```
Enable Breakpoints: Yes
Use Named Areas: Yes

Base (Mobile):
Columns: 1fr
Areas:
"header"
"stats"
"chart"
"table"
"footer"

LG (Desktop):
Columns: 250px 1fr 1fr 300px
Rows: auto 200px 1fr auto
Areas:
"header header header header"
"nav stats stats alerts"
"nav chart table alerts"
"footer footer footer footer"
```

### Overlapping Elements

```
Item 1 (Background):
- Column: 1 to -1
- Row: 1 to -1
- Z-Index: 1

Item 2 (Content):
- Column: 2 to 4
- Row: 2 to 4
- Z-Index: 10

Item 3 (Overlay):
- Column: 3 to 5
- Row: 1 to 3
- Z-Index: 20
```

## Development

### Building from Source

```bash
# Clone repository
git clone <repository-url>
cd mx-css-grid/CSSGrid

# Install dependencies
npm install

# Development mode
npm run dev

# Build widget
npm run build

# Create release
npm run release
```

### Project Structure

```
CSSGrid/
├── src/
│   ├── CSSGrid.tsx              # Main component
│   ├── CSSGrid.editorPreview.tsx # Studio Pro preview
│   ├── CSSGrid.editorConfig.ts  # Property configuration
│   ├── utils/
│   │   ├── gridHelpers.ts       # Grid calculations
│   │   └── CSSGridTypes.ts      # Breakpoint definitions
│   └── ui/
│       └── CSSGrid.css          # Widget styles
├── CSSGrid.xml                  # Widget definition
└── package.json                 # Build configuration
```

## Troubleshooting

### Common Issues

**Items not showing in named areas**

-   Verify "Use Named Areas" is enabled
-   Check area names match exactly
-   Ensure areas form rectangles
-   Validate quotes in template areas

**Responsive breakpoints not working**

-   Enable "Enable Container Breakpoints"
-   Enable specific breakpoint (e.g., "MD Enabled")
-   Set breakpoint-specific properties
-   Check browser width matches breakpoint

**Performance issues**

-   Enable virtualization for 100+ items
-   Simplify item content
-   Check for nested grids
-   Monitor browser DevTools

**Gaps not configurable**

-   If Gap is set, Row Gap and Column Gap are hidden
-   Clear Gap value to access individual gap controls
-   Same applies for breakpoint-specific gaps

### Debug Mode

Enable in Studio Pro for visual helpers:

-   **Show Grid Lines**: See grid structure
-   **Show Grid Areas**: Highlight named regions
-   **Show Grid Gaps**: Visualize spacing
-   **Show Grid Info**: Display responsive information bar (default: enabled)

### Known Issues

**Flickering when using Studio Pro tablet view button**

-   Using the "tablet" view button in Mendix Studio Pro's designer mode can cause visual flickering when switching to
    Base styling
-   **Workaround**: Instead of using the tablet button, manually resize the preview by adjusting Studio Pro panel widths
-   Manual resizing works correctly and provides smooth responsive transitions
-   This appears to be related to how Studio Pro handles viewport changes, but the exact cause is under investigation

## Browser Support

| Feature      | Chrome | Firefox | Safari | Edge |
| ------------ | ------ | ------- | ------ | ---- |
| CSS Grid     | 57+    | 52+     | 10.1+  | 16+  |
| Gap Property | 66+    | 61+     | 12+    | 16+  |
| Aspect Ratio | 88+    | 89+     | 15+    | 88+  |

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Follow existing code style
4. Add/update tests
5. Update documentation
6. Submit a pull request

## License

Apache License 2.0

---

**Version**: 1.2.0  
**Author**: Marnix Valentijn Puijker  
**Organization**: The Orange Force B.V.
