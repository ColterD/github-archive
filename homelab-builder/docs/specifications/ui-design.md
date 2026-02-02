# UI DESIGN SPECIFICATION - 2025 MODERN STANDARDS

## DESIGN INSPIRATION & POSITIONING

```yaml
PRIMARY_INSPIRATION: "PCPartPicker functionality with distinct modern aesthetic"
DIFFERENTIATION: "Cleaner cards, better typography, enhanced mobile experience"
COMMUNITY_REFERENCES: "Reddit's card layout, GitHub's navigation, Stripe's forms"
ACCESSIBILITY_STANDARD: "WCAG 2.1 AA compliance"
```

## THEME SYSTEM IMPLEMENTATION

```yaml
AUTO_DETECTION: "Respect prefers-color-scheme CSS media query"
MANUAL_OVERRIDE: "Toggle button in header, persist user preference"
SMOOTH_TRANSITIONS: "CSS transitions between theme switches"

LIGHT_THEME_COLORS:
  primary: "#0066cc"
  secondary: "#28a745"
  background: "#ffffff"
  surface: "#f8f9fa"
  text_primary: "#1a1a1a"
  text_secondary: "#495057"
  border: "#dee2e6"

DARK_THEME_COLORS:
  primary: "#58a6ff"
  secondary: "#3fb950"
  background: "#0d1117"
  surface: "#161b22"
  text_primary: "#f0f6fc"
  text_secondary: "#8b949e"
  border: "#30363d"
```

## COMPONENT SPECIFICATIONS

### Hardware Cards

```yaml
LAYOUT: "Horizontal layout - image left (120px), content center, price/actions right"
HOVER_STATE: "Subtle elevation with 4px shadow, scale(1.02) transform"
IMAGE_PLACEHOLDER: "Gray gradient with hardware icon when no image"
PRICE_DISPLAY: "Large, prominent pricing with trend indicator"
QUICK_ACTIONS: "Compare, Add to Build, View Details buttons"
RESPONSIVE: "Stack vertically on mobile with full-width image"
```

### Navigation Structure

```yaml
HEADER: "Logo left, search center, user menu right, theme toggle"
DESKTOP_SIDEBAR: "Categories tree, filters, recent items"
MOBILE_NAVIGATION: "Bottom tab bar with 5 primary sections"
BREADCRUMBS: "Show hierarchy: Home > Servers > Dell PowerEdge"
SEARCH_BAR: "Prominent position with real-time autocomplete"
```

### Data Tables (Admin & Listings)

```yaml
DESIGN: "Alternating row colors, sticky headers, responsive"
SORTING: "Click headers with visual indicators"
ACTIONS: "Row actions on hover, bulk selection with checkboxes"
MOBILE_ADAPTATION: "Card layout stacking on small screens"
PAGINATION: "Load more button or traditional pagination based on content"
```

### Forms & Inputs

```yaml
INPUT_STYLE: "Floating labels with focus animations"
VALIDATION: "Real-time validation with inline error messages"
BUTTON_HIERARCHY: "Primary (filled), Secondary (outlined), Tertiary (text)"
FORM_PROGRESS: "Step indicators for multi-step forms"
```

### Charts & Metrics (Admin Dashboard)

```yaml
CHART_COLORS: "Theme-aware color palette"
CHART_TYPES: "Line charts for trends, bar charts for comparisons"
REAL_TIME_UPDATES: "Smooth transitions for live data"
RESPONSIVE_CHARTS: "Adapt to container size, readable on mobile"
```

## SPACING & TYPOGRAPHY

```yaml
GRID_SYSTEM: "8px base unit (8px, 16px, 24px, 32px, 48px, 64px)"
FONT_FAMILY: "Inter variable font for system consistency"
FONT_SCALE:
  - xs: "12px" (captions, metadata)
  - sm: "14px" (body text, secondary info)
  - base: "16px" (primary body text)
  - lg: "18px" (large body text)
  - xl: "20px" (small headings)
  - 2xl: "24px" (section headings)
  - 3xl: "30px" (page headings)
  - 4xl: "36px" (hero text)

LINE_HEIGHT: "1.5 for body text, 1.25 for headings"
```

## ANIMATION & INTERACTIONS

```yaml
HOVER_EFFECTS: "Subtle scale transforms, color transitions"
LOADING_STATES: "Skeleton screens matching content structure"
PAGE_TRANSITIONS: "Smooth navigation with loading indicators"
MICRO_INTERACTIONS: "Button press feedback, form validation animations"
PERFORMANCE: "Hardware-accelerated transforms, 60fps target"
```

## ACCESSIBILITY REQUIREMENTS

```yaml
COLOR_CONTRAST: "4.5:1 minimum for normal text, 3:1 for large text"
KEYBOARD_NAVIGATION: "Full keyboard accessibility, visible focus indicators"
SCREEN_READERS: "Proper ARIA labels, semantic HTML structure"
MOTION_PREFERENCES: "Respect prefers-reduced-motion setting"
```

## HARDWARE-SPECIFIC UI PATTERNS

```yaml
SPECIFICATION_DISPLAY: "Organized in collapsible sections (CPU, Memory, Storage)"
COMPARISON_TABLES: "Side-by-side with highlighted differences"
PRICE_TRACKING: "Historical charts with trend arrows"
BUILD_CONFIGURATOR: "Drag-and-drop with compatibility warnings"
COMMUNITY_CONTENT: "Review cards with rating stars, user avatars"
```

## RESPONSIVE BREAKPOINTS

```yaml
MOBILE: "320px-768px (single column, stacked layout)"
TABLET: "768px-1024px (two column, collapsible sidebar)"
DESKTOP: "1024px+ (full layout with sidebar)"
LARGE_DESKTOP: "1440px+ (expanded content width, more whitespace)"
```

## PERFORMANCE GUIDELINES

```yaml
IMAGES: "WebP format with lazy loading, placeholder gradients"
FONTS: "Preload Inter font, use font-display: swap"
ANIMATIONS: "Use transform and opacity for 60fps performance"
CRITICAL_CSS: "Inline critical styles, async load non-critical"
JAVASCRIPT: "Progressive enhancement, core functionality without JS"
```

## IMPLEMENTATION NOTES

```yaml
CSS_FRAMEWORK: "Tailwind CSS with custom design tokens"
COMPONENT_LIBRARY: "shadcn-svelte as base with custom variants"
ICON_SYSTEM: "Lucide icons for consistency"
STATE_MANAGEMENT: "Svelte stores for theme preference"
TESTING: "Visual regression testing for design consistency"
```
