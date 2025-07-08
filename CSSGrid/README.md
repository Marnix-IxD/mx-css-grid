# CSS Grid Widget for Mendix

A powerful, production-ready CSS Grid implementation for Mendix applications, providing native CSS Grid Layout capabilities with full responsive support, virtualization, and accessibility features.

## Table of Contents

- [Overview](#overview)
- [CSS Grid Fundamentals](#css-grid-fundamentals)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Widget Properties](#widget-properties)
- [Grid Layout Concepts](#grid-layout-concepts)
- [Responsive Design](#responsive-design)
- [Item Placement](#item-placement)
- [Named Grid Areas](#named-grid-areas)
- [Styling and Customization](#styling-and-customization)
- [Performance Features](#performance-features)
- [Accessibility](#accessibility)
- [Examples](#examples)
- [Browser Support](#browser-support)
- [Limitations](#limitations)
- [Troubleshooting](#troubleshooting)

## Overview

This widget brings the full power of CSS Grid Layout to Mendix, allowing developers to create complex, responsive layouts without writing custom CSS. It supports all major CSS Grid features including:

- **Grid Templates**: Define custom column and row structures
- **Named Areas**: Create semantic layout regions
- **Responsive Breakpoints**: Different layouts for different screen sizes
- **Auto-placement**: Automatic item positioning with flow control
- **Alignment**: Full control over item and content alignment
- **Performance**: Built-in virtualization for large grids
- **Accessibility**: ARIA support and keyboard navigation

## CSS Grid Fundamentals

CSS Grid Layout is a two-dimensional layout system for the web. It lets you organize content into rows and columns and gives you fine control over sizing, positioning, and spacing.

### Key Concepts

1. **Grid Container**: The element with `display: grid` (the widget itself)
2. **Grid Items**: Direct children of the grid container
3. **Grid Lines**: The dividing lines between columns and rows
4. **Grid Tracks**: The columns and rows themselves
5. **Grid Cells**: The intersection of a row and column
6. **Grid Areas**: Rectangular areas covering one or more cells

### Grid Terminology Visualized

```
        1   2   3   4  ← Column Lines
      +---+---+---+
    1 | A | B | C |  ← Grid Track (Row)
      +---+---+---+
    2 | D | E | F |
      +---+---+---+
    3 | G | H | I |
      +---+---+---+
      ↑           ↑
   Row Line    Grid Cell
```

## Installation

### From Mendix Marketplace

1. Download the widget from the Mendix Marketplace
2. Add the widget to your Mendix project
3. Place the CSS Grid widget on a page
4. Configure the grid properties and add content

### Building from Source

If you want to contribute or modify the widget, you can build it from source.

#### Prerequisites

- Node.js 16 or higher
- Mendix Studio Pro 10.24+
- npm or yarn package manager

#### Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd cssgrid
```

2. Install dependencies:
```bash
npm install
```

3. Create type definitions:
```bash
npm run create:typings
```

#### Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start the development server |
| `npm run dev` | Start web development mode with hot reload |
| `npm run build` | Build the widget for production |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Automatically fix linting issues |
| `npm run release` | Create a release build (.mpk file) |
| `npm run clean` | Remove the dist folder |
| `npm run rebuild` | Clean and rebuild the widget |

#### Development Workflow

1. **Start development mode:**
   ```bash
   npm run dev
   ```
   This starts a development server on port 3000 with hot module replacement.

2. **Configure your Mendix project:**
   - Update `config.projectPath` in package.json to point to your Mendix project
   - Default: `"../Mendix/CSSGrid"`
   - Make sure your Mendix app is running on `http://localhost:8080`

3. **Make changes:**
   - Edit files in the `src` folder
   - Changes will automatically reload in your Mendix app

4. **Check code quality:**
   ```bash
   npm run lint
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

6. **Create release package:**
   ```bash
   npm run release
   ```
   This creates an `.mpk` file in the `dist` folder that can be uploaded to the Mendix Marketplace.

#### Project Structure

```
cssgrid/
├── src/
│   ├── CSSGrid.tsx              # Main widget component
│   ├── CSSGrid.editorPreview.tsx # Studio Pro preview
│   ├── CSSGrid.editorConfig.ts  # Studio Pro configuration
│   ├── components/              # React components
│   ├── utils/                   # Utility functions
│   │   ├── gridHelpers.ts      # Grid calculation utilities
│   │   └── CSSGridTypes.ts     # TypeScript type definitions
│   ├── types/                   # TypeScript types
│   │   └── ConditionalTypes.ts # Conditional property types
│   └── ui/                      # Styles
│       └── CSSGrid.css         # Widget styles
├── typings/                     # Auto-generated types
│   └── CSSGridProps.d.ts       # Widget property types
├── CSSGrid.xml                  # Widget definition
├── package.xml                  # Package definition
├── package.json                 # NPM configuration
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

#### Troubleshooting Development

**Port conflicts:**
If port 3000 is already in use, update the `developmentPort` in package.json:
```json
"config": {
  "developmentPort": 3001
}
```

**TypeScript errors:**
After modifying `CSSGrid.xml`, regenerate typings:
```bash
npm run create:typings
```

**Build errors:**
Clean and rebuild:
```bash
npm run rebuild
```

## Quick Start

### Basic 3-Column Grid

```
Grid Template Columns: 1fr 1fr 1fr
Grid Template Rows: auto
Gap: 16px
```

This creates three equal-width columns with 16px spacing between items.

### Header-Sidebar-Content Layout

```
Use Named Areas: Yes
Grid Template Columns: 200px 1fr
Grid Template Rows: 60px 1fr 40px
Grid Template Areas:
"header header"
"sidebar content"
"footer footer"
```

## Widget Properties

### Grid Layout Properties

| Property | Description | Default | Example |
|----------|-------------|---------|---------|
| **Use Named Areas** | Enable grid-area based placement | `false` | `true` |
| **Grid Template Columns** | Define column tracks | `1fr 1fr` | `200px 1fr 200px` |
| **Grid Template Rows** | Define row tracks | `auto` | `100px auto 50px` |
| **Grid Template Areas** | Define named grid areas (when Use Named Areas is enabled) | - | See [Named Areas](#named-grid-areas) |

### Grid Spacing & Size

| Property | Description | Example |
|----------|-------------|---------|
| **Gap** | Sets both row and column gaps | `16px`, `1rem`, `2%` |
| **Row Gap** | Vertical spacing between rows | `20px` |
| **Column Gap** | Horizontal spacing between columns | `20px` |
| **Min/Max Width** | Container width constraints | `300px`, `1200px` |
| **Min/Max Height** | Container height constraints | `400px`, `80vh` |

### Grid Alignment

| Property | Description | Values |
|----------|-------------|--------|
| **Justify Items** | Horizontal alignment of items within cells | `start`, `end`, `center`, `stretch` |
| **Align Items** | Vertical alignment of items within cells | `start`, `end`, `center`, `stretch` |
| **Justify Content** | Horizontal alignment of the grid within container | `start`, `end`, `center`, `stretch`, `space-between`, `space-around`, `space-evenly` |
| **Align Content** | Vertical alignment of the grid within container | `start`, `end`, `center`, `stretch`, `space-between`, `space-around`, `space-evenly` |

### Grid Flow

| Property | Description | Values |
|----------|-------------|--------|
| **Auto Flow** | How auto-placed items flow | `row`, `column`, `dense`, `column dense` |
| **Auto Rows** | Size of implicitly created rows | `auto`, `100px`, `minmax(100px, auto)` |
| **Auto Columns** | Size of implicitly created columns | `auto`, `1fr` |

## Grid Layout Concepts

### Track Sizing

Grid tracks (columns and rows) can be sized using various units:

- **Fixed sizes**: `200px`, `20rem`, `10em`
- **Flexible sizes**: `1fr`, `2fr` (fraction units)
- **Content-based**: `auto`, `min-content`, `max-content`
- **Functions**: `minmax(100px, 1fr)`, `fit-content(200px)`
- **Repeat notation**: `repeat(3, 1fr)`, `repeat(auto-fit, minmax(250px, 1fr))`

### The FR Unit

The `fr` unit represents a fraction of available space:

```
Grid Template Columns: 1fr 2fr 1fr
```

This creates three columns where the middle column is twice as wide as the side columns.

### Auto-placement Algorithm

When items don't have explicit placement, the grid auto-placement algorithm positions them:

1. **Row** (default): Fill each row before moving to the next
2. **Column**: Fill each column before moving to the next
3. **Dense**: Attempt to fill gaps in the grid (may reorder items)

## Responsive Design

### Container-Level Breakpoints

Enable responsive grid layouts that change based on screen size:

1. Set **Enable Container Breakpoints** to `Yes`
2. Configure breakpoints:
   - **XS** (<640px): Phones portrait
   - **SM** (640-768px): Phones landscape
   - **MD** (768-1024px): Tablets
   - **LG** (1024-1440px): Small desktops
   - **XL** (1440-1920px): Standard desktops
   - **XXL** (>1920px): Large monitors

#### Example: Mobile-First Responsive Grid

```
Base Configuration:
Grid Template Columns: 1fr
Gap: 16px

MD Enabled: Yes
MD Columns: 1fr 1fr
MD Gap: 20px

LG Enabled: Yes
LG Columns: repeat(3, 1fr)
LG Gap: 24px
```

### Item-Level Responsive Placement

Individual items can have different placements at different breakpoints:

1. Enable **Enable Responsive Placement** on the item
2. Configure placement for each breakpoint
3. Each breakpoint can have different placement types

## Item Placement

### Placement Types

1. **Auto**: Let the grid algorithm place the item
2. **Named Area**: Place in a specific named area
3. **Coordinates**: Specify exact grid lines
4. **Span**: Start at a position and span multiple tracks

### Coordinate Placement

Using grid line numbers:

```
Column Start: 1
Column End: 3
Row Start: 2
Row End: 4
```

Or using negative numbers (counting from end):

```
Column Start: 1
Column End: -1  (spans full width)
```

### Span Placement

Span multiple tracks:

```
Column Start: span 2  (spans 2 columns)
Row Start: 2         (starts at row 2)
```

## Named Grid Areas

Named areas provide a visual, semantic way to define layouts:

### Basic Example

```css
Grid Template Areas:
"header header header"
"sidebar main aside"
"footer footer footer"
```

### Rules for Grid Areas

1. Must be rectangular (no L-shapes)
2. Use dots (.) for empty cells
3. Area names must start with a letter
4. Each row must have the same number of columns
5. Wrap each row in quotes

### Complex Example with Empty Cells

```css
Grid Template Areas:
"logo nav nav . login"
"sidebar content content content aside"
". footer footer footer ."
```

## Styling and Customization

### CSS Custom Properties

The widget exposes CSS custom properties for fine control:

```css
.mx-css-grid {
    --mx-grid-item-font-size: inherit;
    --mx-grid-item-line-height: inherit;
    --mx-grid-item-color: inherit;
    --mx-grid-item-padding: 0;
    --mx-grid-item-margin: 0;
}
```

### Custom Styling Examples

#### Set consistent font size for all grid items
```css
.my-custom-grid {
    --mx-grid-item-font-size: 1rem;
}
```

#### Responsive typography using clamp()
```css
.my-responsive-grid {
    --mx-grid-item-font-size: clamp(0.875rem, 2vw, 1.25rem);
}
```

#### Add padding to all grid items
```css
.my-padded-grid {
    --mx-grid-item-padding: 1rem;
}
```

#### Different styles for different breakpoints
```css
@media (max-width: 768px) {
    .my-mobile-grid {
        --mx-grid-item-font-size: 0.875rem;
        --mx-grid-item-padding: 0.5rem;
    }
}
```

### Targeting Specific Grid Items

```css
/* Target by index */
.mx-css-grid [data-item-index="0"] {
    background-color: #f0f0f0;
}

/* Target by item name */
.mx-css-grid [data-item-name="header"] {
    font-weight: bold;
}

/* Target by placement type */
.mx-css-grid [data-placement="area"] {
    border: 1px solid #ddd;
}
```

## Performance Features

### Virtualization

For grids with many items, enable virtualization:

1. Set **Enable Virtualization** to `Yes`
2. Configure **Virtualization Threshold** (default: 100 items)
3. Only visible items are rendered, improving performance

### Best Practices

- Use virtualization for grids with 100+ items
- Avoid complex nested layouts in virtualized items
- Test scrolling performance across devices

## Accessibility

### ARIA Support

The widget includes comprehensive ARIA support:

- **Grid Role**: Automatically applied for data grids
- **Region Labels**: Named areas are announced to screen readers
- **Keyboard Navigation**: Tab through items naturally

### Configuration

```
ARIA Label: "Product catalog grid"
ARIA Role: Grid (for data)
```

### Best Practices

1. Always provide meaningful ARIA labels
2. Use semantic HTML within grid items
3. Ensure sufficient color contrast
4. Test with screen readers

## Examples

### Example 1: Card Layout

```
Grid Template Columns: repeat(auto-fit, minmax(300px, 1fr))
Grid Template Rows: auto
Gap: 24px
```

This creates a responsive card layout that automatically adjusts the number of columns based on available space.

### Example 2: Dashboard Layout

```
Use Named Areas: Yes
Grid Template Columns: 250px 1fr 300px
Grid Template Rows: 70px 1fr 50px
Grid Template Areas:
"header header header"
"nav main aside"
"nav footer aside"
Gap: 0
```

### Example 3: Magazine Layout

```
Grid Template Columns: repeat(6, 1fr)
Grid Template Rows: repeat(4, 200px)

Item 1 (Feature Article):
- Placement Type: Span
- Column Start: span 4
- Row Start: span 2

Item 2 (Sidebar):
- Placement Type: Coordinates
- Column Start: 5
- Column End: 7
- Row Start: 1
- Row End: 5
```

### Example 4: Responsive Product Grid

```
Base:
Grid Template Columns: 1fr
Gap: 16px

SM (640px+):
Grid Template Columns: repeat(2, 1fr)
Gap: 20px

MD (768px+):
Grid Template Columns: repeat(3, 1fr)
Gap: 24px

LG (1024px+):
Grid Template Columns: repeat(4, 1fr)
Gap: 32px
```

## Browser Support

The widget uses native CSS Grid, which is supported in:

- Chrome 57+
- Firefox 52+
- Safari 10.1+
- Edge 16+
- iOS Safari 10.3+
- Chrome for Android 94+

### Feature Support

| Feature | Support |
|---------|---------|
| Basic Grid | ✅ All modern browsers |
| Grid Template Areas | ✅ All modern browsers |
| Gap Property | ✅ All modern browsers |
| Subgrid | ❌ Not implemented |
| Masonry Layout | ❌ Not implemented |
| Container Queries | ✅ Chrome 105+, Safari 16+, Firefox 110+ |

## Limitations

### CSS Grid Features Not Supported

1. **Subgrid**: Items cannot inherit the parent grid's tracks
2. **Masonry Layout**: Not yet standardized in CSS
3. **Grid Line Names**: Only numeric line references supported
4. **grid-template shorthand**: Use individual properties

### Widget-Specific Limitations

1. **Dynamic Track Addition**: Cannot add/remove tracks at runtime
2. **Nested Grids**: Possible but not optimized for virtualization
3. **Animation**: Grid layout changes are not animated
4. **Maximum Items**: Practical limit of ~1000 items even with virtualization

### Mendix-Specific Considerations

1. **Dynamic Classes**: Use the Dynamic Classes expression property
2. **Conditional Visibility**: Hidden items still occupy grid space
3. **Data View Integration**: Grid items can contain data views
4. **List View Alternative**: Consider List View for simple layouts

## Troubleshooting

### Common Issues

#### Items Not Displaying in Named Areas

**Problem**: Items configured with area placement don't appear
**Solution**: 
1. Ensure "Use Named Areas" is enabled
2. Check area names match exactly (case-sensitive)
3. Verify grid template areas syntax (quotes required)

#### Font Size Issues

**Problem**: Grid items have unexpected font sizes
**Solution**:
```css
.mx-css-grid {
    --mx-grid-item-font-size: inherit;
}
```

#### Responsive Breakpoints Not Working

**Problem**: Grid doesn't change at breakpoints
**Solution**:
1. Enable "Enable Container Breakpoints"
2. Enable specific breakpoint (e.g., "MD Enabled")
3. Set breakpoint-specific properties

#### Performance Issues with Large Grids

**Problem**: Slow scrolling or rendering
**Solution**:
1. Enable virtualization
2. Reduce virtualization threshold
3. Simplify item content
4. Avoid nested grids

### Debug Mode

Enable debug options during development:

- **Show Grid Lines**: Visualize grid structure
- **Show Grid Areas**: Highlight named areas
- **Show Grid Gaps**: Visualize spacing

### Getting Help

1. Check browser console for errors
2. Verify CSS Grid support in target browsers
3. Use browser DevTools Grid inspector
4. Consult [MDN CSS Grid documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout)

## Advanced Patterns

### Mixing Placement Types

You can mix different placement types in the same grid:

```
Item 1: Auto placement
Item 2: Named area "header"
Item 3: Coordinates (1/3, 2/3)
Item 4: Span 2 columns
```

### Overlapping Items

Use z-index to control stacking:

```
Item A: Column 1-3, Row 1-3, Z-index: 1
Item B: Column 2-4, Row 2-4, Z-index: 2
```

### Dynamic Grids with Mendix Data

Combine with List View for data-driven grids:

1. Place List View in grid container
2. Each list item becomes a grid item
3. Use expressions for dynamic placement

### Nested Grids

Grid items can be grid containers:

```
Parent Grid: 2 columns
└── Grid Item 1: Contains 3x3 grid
└── Grid Item 2: Regular content
```

---

## Contributing

This widget is open for community contributions. Report issues or suggest features through the Mendix Forum or GitHub repository.

### Contributing Guidelines

1. **Fork the repository** and create a feature branch
2. **Follow the code style** enforced by ESLint and Prettier
3. **Write tests** if applicable
4. **Update documentation** for any API changes
5. **Submit a pull request** with a clear description

### Code Quality

The project uses:
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting (with XML plugin support)

Before submitting a PR:
```bash
npm run lint:fix  # Fix linting issues
npm run build     # Ensure it builds
```

## Version Information

- **Widget Version**: 1.0.0
- **Mendix Version**: 10.24+
- **Author**: Marnix Valentijn Puijker
- **Organization**: The Orange Force B.V.

## License

Apache License 2.0 - See LICENSE file for details