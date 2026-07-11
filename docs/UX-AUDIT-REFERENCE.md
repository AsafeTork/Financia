---
type: REFERENCE
---

# UX Audit Reference Document

> Compiled: 2026-07-10. Sources: official docs, design system references, WWDC25, I/O 2025.

---

## 1. Material Design 3 (Material You + M3 Expressive)

### Core Principles
- **Personalized**: Dynamic color derives from wallpaper; tonal palettes ensure accessible contrast by default
- **Expressive**: M3 Expressive (2025) adds emotion-driven UX — motion physics, shape library (35 shapes), rich color schemes
- **Adaptive**: Navigation adapts to screen size (NavigationBar / Rail / Drawer)
- **Accessible by default**: Tonal palettes guarantee WCAG AA; `on-primary` on `primary`, `on-primary-container` on `primary-container`

### Navigation Patterns
| Component | Form Factor | Max Destinations |
|---|---|---|
| `NavigationBar` | Compact (phone) | ≤5 |
| `NavigationRail` | Medium (tablet landscape) | ≤7 |
| `ModalNavigationDrawer` | Medium-large | Unlimited |
| `PermanentNavigationDrawer` | Large (desktop) | Unlimited |

- Tabs are for navigation, not actions (same as Apple HIG)
- Navigation bar bottom on mobile, rail on side for tablet+

### Elevation System
- **Dual elevation**: Shadow elevation (casts shadow) + Tonal elevation (color overlay)
- Dark theme uses tonal overlays from `primary` color — no more `ElevationOverlay`
- Surface uses both `shadowElevation` and `tonalElevation`

### Dynamic Color System
- 5 key colors: Primary, Secondary, Tertiary, Neutral, Neutral Variant
- `dynamicLightColorScheme()` / `dynamicDarkColorScheme()` on Android 12+
- Fallback to custom `ColorScheme` when dynamic unavailable
- All M3 components automatically use tonal palettes — customize only via token overrides

### Motion (M3 Expressive)
- **Motion springs**: Spatial springs (position/size), Effects springs (color/opacity)
- **Shape morph**: Smooth transitions between any two shapes (built-in)
- Transitions use `FiniteAnimationSpec` via `MotionScheme`
- Zoom transitions for navigation (like Apple's zoom transition)

### Component Specs
- **Toolbars**: New flexible component for frequent actions, pair with FAB
- **Split buttons**: Button + connected menu with shape/shift animation
- **Button groups**: Shape-shifting buttons that bump and react
- **Progress indicators**: Configurable width/thickness
- **Cards/Buttons**: Default `ButtonElevation` / `CardElevation` objects with state-based elevation

### Layout Principles
- Adaptive layouts for foldables/large screens
- Canonical layouts: list-detail, supporting panel, feed
- Surface is the backing composable for most components

### Audit Checklist
- [ ] Dynamic color used where available (fallback provided)
- [ ] Tonal elevation replaces shadow-only elevation on surfaces
- [ ] Navigation matches form factor (bar/rail/drawer)
- [ ] Motion uses physics-based springs, not linear animations
- [ ] Color roles respect accessibility: on-primary on primary, etc.
- [ ] Component states (hover/focus/pressed/disabled) all defined
- [ ] Progress indicators have configurable width, not hardcoded

---

## 2. Apple Human Interface Guidelines (iOS 26 / macOS Tahoe — Liquid Glass)

### Core Principles (2025 Refresh)
- **Deference to content**: UI chrome recedes; Liquid Glass floats above content, never competes
- **Clarity**: Text is legible at every size; icons precise; purpose unambiguous
- **Depth**: Visual layers and motion communicate hierarchy; Liquid Glass adapts to underlying content
- **Interruptible**: All transitions can be interrupted at any time (new in iOS 18+)

### Navigation Design (iOS 26)
- **TabView** (iPhone): Floats above content, minimizes on scroll, optional accessory view
- **NavigationSplitView** (iPad): Liquid Glass sidebar floats above content, `backgroundExtensionEffect` for seamless extension
- **Navigation bars**: Transparent, float above content, items auto-group with glass backgrounds
- **Content backswipe**: Swipe back from anywhere in content area (not just left edge)
- **Edge effect**: Scroll views under bars auto-apply visual treatment for legibility

### Modal Presentation (iOS 26)
- **Zoom transition**: Source view morphs into presented view (sheets, popovers, menus, dialogs)
- **Sheets**: Liquid Glass background, smooth morph from presenting button
- **Action sheets**: Anchored to source view, no cancel button (inline tap-anywhere dismisses)
- **Dialogs**: Morph out of presenting buttons automatically
- **Menus/Popovers**: Glass button morphs into overlay

### Gesture Design
- Zoom transitions are continuously interactive — drag from beginning or mid-transition
- Pan gestures preserve velocity via SwiftUI `.interactiveSpring` → non-interactive spring
- **Liquid Glass interaction**: Controls scale/bounce/shimmer on touch

### Feedback Patterns
- Button states: capsule shape by default, taller on macOS
- Toggles/Segmented pickers/Sliders transform into Liquid Glass during interaction
- Sliders: tick marks, neutral value anchor, thumbless style for progress
- Touch gestures create fluidity with minimum friction

### Clarity Principles
- SF Symbols for familiar iconography
- Typography: system text styles, semantic colors
- Every screen needs: "Where am I?" and "What can I do?"
- Progressive disclosure: show essentials, reveal more on interaction

### Audit Checklist
- [ ] Tab bar floats above content, not a solid bar
- [ ] Navigation bar is transparent/glass, items auto-grouped
- [ ] Content backswipe works from anywhere (not just edge)
- [ ] Transitions use zoom/spring animations, not push
- [ ] Action sheets anchored to source, no cancel button
- [ ] Dialogs morph from buttons, not slide up
- [ ] Sliders use tick marks + neutral anchor where applicable
- [ ] Scroll edge effect applied under bars
- [ ] Tabs used for navigation, not for primary actions
- [ ] Focus indicator not obscured by sticky elements

---

## 3. Linear

### Design Philosophy
- **Keyboard-first**: Every action has a keyboard shortcut; ⌘K command palette is primary navigation
- **Minimal UI**: Skeleton loaders (not spinners), content shapes preview, data loads fade in
- **Optimistic UI**: Changes appear immediately, server confirmation is background
- **Calm interface**: Neutral icon-headline-CTA for empty states, never illustrations

### Keyboard Shortcuts Culture
- ⌘K (Cmd+K) opens global command palette: fuzzy match, recent items, async results
- Arrow keys navigate results, Enter commits, Esc dismisses
- Keyboard navigation through results; never mouse-only
- Palette opens without trapping focus (Tab leaves to underlying page)
- Result grouping by type with subtle dividers/labels

### Minimal UI Approach
- Skeleton loaders match content layout shape
- Loading states show "Fetching payments..." text + spinner
- Content fades in smoothly; no blank screens
- Empty states: "No issues yet" → "Add the first one with C"
- Dashboard-zero: show empty charts/metrics structure rather than hiding

### Loading Patterns
- Immediate feedback on action (<1s)
- Optimistic: state updates instantly, toast confirms
- Background tasks: progress bar + "We'll email you when done"
- No blocking spinners — async results stream with loading affordance

### Empty States (per Northbase study)
- Neutral tone, never encouraging for search results
- "No [noun]" dominant headline pattern (27% of instances)
- "yet" suffix signals anticipated progress (~11%)
- Body text median 10 words; 39% have no body text
- Icon-headline-CTA structure for first-use, text-only for tables

### Audit Checklist
- [ ] ⌘K global command palette with fuzzy search
- [ ] Every action has a keyboard shortcut displayed in tooltip
- [ ] Arrow key navigation through lists/command palette
- [ ] Skeleton loaders (shapes matching content), not spinners
- [ ] Optimistic UI with background confirmation
- [ ] Empty states use neutral "No [noun] yet" pattern
- [ ] Search empty states: minimal, no encouragement
- [ ] Loading <1s feedback, >3s progress bars
- [ ] Dashboard shows structure even when empty

---

## 4. Notion

### Core UX Patterns
- **Block-based**: Every content unit is a block — draggable, transformable, linkable
- **Progressive disclosure**: `/` menu, `@` mentions, `[` databases — complexity on demand
- **Infinite canvas**: Pages contain pages, databases are inline, no file system hierarchy
- **Calm interface**: Neutral typography (16px, 1.7 line-height, 720px max-width)

### Block-Based Editing
- Atomic unit: every piece of content is a block
- Same handle (⋮⋮), same drag behavior, convertible to any type
- `data-type` attribute drives CSS visual transform
- Hybrid model: `contenteditable` on individual blocks, custom rendering between them
- Nested blocks (list in quote, toggle in callout) via explicit parent/children references

### Command Palette (Slash Menu)
- Type `/` opens contextual block-type menu
- Filters as user types: `startsWith("/")` + fuzzy keyword match
- Keyboard nav: arrow keys + Enter, Esc dismisses
- Level 1: Just type (text). Level 2: `/` for blocks. Level 3: `@` for mentions. Level 4: `[` for databases. Level 5: Templates/formulas

### Inline Actions
- `@` for mentions/links to any workspace item
- `+` floating menu (requireExplicitTrigger)
- Bubble menu on text selection: bold, italic, link, color
- Block context menu: Delete, Duplicate, Turn into, Colors

### Empty States Design
- Empty doc: soft prompt, slash menu hint, immediate keyboard focus
- No illustration, no welcome screen — typing IS the activation
- "Press '/' for commands" placeholder (only on empty paragraphs)
- Content-direct structure: column headers + placeholder row (grid/table)

### Audit Checklist
- [ ] Block-based content model with type-driven rendering
- [ ] `/` command palette with fuzzy filter + keyboard nav
- [ ] `@` mention system for cross-references
- [ ] Drag handles (⋮⋮) on every block with visual feedback
- [ ] Block transformation (any block → any other type)
- [ ] Bubble menu on text selection
- [ ] Empty editor starts with soft prompt, keyboard focused
- [ ] Progressive disclosure: advanced features behind `/` and `@`
- [ ] Placeholder text only on empty paragraphs, not repeated

---

## 5. Stripe

### Dashboard Design Patterns

#### Data Density (Role-Metric-Density-Action Framework)
- Role: Developer/technical finance → metric = transaction success rate + error breakdown
- **Very high density**: event logs, sticky-column financial tables
- Every log entry is actionable, every error code links to docs
- **Dashboard hierarchy is a retention lever** — lead with the one metric that answers the primary user's first question

#### Navigation Hierarchy
- **App indicator + Header + Content** trinity
- **Dock system**: App icons docked on sidebar, drawer opens on click
- Three view types: `ContextView` (default, side-by-side), `FocusView` (blocking backdrop for deep workflows), `SettingsView`
- Default to `ContextView`; use `FocusView` only for start-to-finish tasks

#### Progressive Disclosure
- Form patterns: inline validation, conditional fields, multi-step with progress
- Input states: default, hover, focused, filled, error, disabled, read-only
- Help text contextual, not buried in docs
- Complex fields reveal only relevant options per step

#### Error Handling Patterns
| Error Type | Pattern | Example |
|---|---|---|
| Generic | NEVER — always specific | "Card declined by issuing bank" |
| Actionable | Recovery step included | "Ask customer to contact their bank" |
| Support | Error code + docs link | `declined_insufficient_funds` |
| Form | Inline validation, not alert banners | Red border + message below field |
| Page | Banner at top + specific field errors | Combined for multi-field forms |

#### Confirmation Patterns
- **Destructive actions**: typed confirmation, delay, consequence preview
- Red "Confirm" button, Escape cancels, keyboard accessible
- **Undo**: 5s undo window for deletions
- **Optimistic update**: changes visible immediately, toast confirms

#### Feedback System
| Timing | Pattern |
|---|---|
| <0.1s | Visual state change only |
| 0.1-1s | Loading indicator + success toast |
| 1-3s | Loading overlay + progress indicator |
| 3-10s | Progress bar with percentage |
| >10s | Background task + email when done |

- Toast: top-right, 5s auto-dismiss (longer on hover), stackable, non-blocking
- Color-coded (green/red/yellow/blue) + icon + text label
- **Never rely on color alone** — icons reinforce status

#### Empty States
- Contextual: empty integration page = step-by-step tutorial with inline code
- Dashboard: show zero-value charts/metrics structure (never hide)
- Search: neutral tone, 2-4 word headline, "Clear filters" CTA
- First-use: icon-headline-CTA (neutral)
- Data tables: text-only, column headers frame the empty space

### Audit Checklist
- [ ] Primary dashboard metric matches user role
- [ ] Error messages specific + actionable + linkable
- [ ] All async operations show loading state within 1s
- [ ] Destructive actions: confirmation + timed undo
- [ ] Toast system: positioned, color-coded, icon + text, auto-dismiss
- [ ] Form validation inline (not alert banners)
- [ ] Empty state shows structure (dashboard-zero)
- [ ] Inputs have all 7 states defined
- [ ] Keyboard: Escape cancels dialogs
- [ ] Color never sole differentiator — icons paired

---

## 6. GitHub (Primer Design System)

### Core Principles (Primer)
- **Orientation**: Users always know where they are and where they can go
- **Minimal navigation elements**: Essential items only; avoid overwhelming
- **Balanced transitions**: Contextual clarity without excessive interruption
- **Progressive disclosure**: Show/hide information, sparingly used
- **Availability**: 99.9% uptime standard — UI bugs count against availability

### Repository Navigation
- **Parent-detail split page**: Sidebar (NavList/TreeView) + detail content
- **Tabs**: `UnderlineNav` (URL changes) vs `UnderlinePanels` (no URL change)
- **Breadcrumbs**: Hierarchical path, URL changes on click
- **Responsive sidebar**: Wide = always visible; Narrow = hidden, back link or breadcrumb
- **Filter menu**: ActionMenu (≤15 items) or bottom sheet Dialog (>15 items)

### Issue Workflow
- **New issue**: Clean form with markdown preview
- **Discussion**: Comment thread with inline reactions
- **Status badges**: Color + text label (never color alone)
- **Sidebar metadata**: assignees, labels, projects, milestones

### PR Review Flow
- **Files changed**: React-based, virtualized (TanStack Virtual) for large diffs
- **Diff lines**: Comment state moved to child components (not every line carries state)
- **O(1) lookups**: JavaScript Map for comments/lines
- **Progressive loading**: Smart fetch, hydrate only visible lines
- **Performance targets**: INP <200ms, heap <500MB for p95 PRs

### Notifications Design (Primer)
- **Messaging hierarchy** (most → least prominent):
  1. **System updates**: Banner (non-dismissible until resolved)
  2. **Feedback**: Banner (page-level) or InlineMessage (near action)
  3. **Awareness**: Banner (info) or InlineMessage (tip)
- **6 message states**: info, warning, success, unavailable, critical, upsell
- **Flowchart-driven**: Is success evident? → No → Banner/Inline near save button
- **Error flowchart**: Know what went wrong? → Form validation / Banner / Modal dialog

### Progressive Disclosure Patterns (Primer)
| Pattern | Icon | Use Case |
|---|---|---|
| Chevron | ▼/▲ | Collapsible content sections |
| Fold/Unfold | ⏷/⏴ | Text content expansion |
| Ellipsis | … | Truncated inline text |
| Kebab | ⋮ | Dropdown menus (not disclosure) |
| Caret | ▾ | Not for disclosure — navigation only |

### Audit Checklist
- [ ] Navigation: parent-detail split page with visible sidebar
- [ ] Tabs: underline style, URL change on tab switch (unless content-only)
- [ ] Breadcrumbs for hierarchies >2 levels deep
- [ ] Responsive: sidebar moves to menu on narrow viewports
- [ ] Skip links for keyboard/screen reader users
- [ ] Heading hierarchy (h1-h6) correct for screen reader nav
- [ ] Messaging: flowchart-driven placement (not arbitrary)
- [ ] Error states: specific problem + recovery action
- [ ] Diff/table: virtualized for performance at scale
- [ ] Progressive disclosure: chevrons/kebabs, not custom patterns
- [ ] Success: only shown when not evident from UI context
- [ ] Dense content uses skeletons matching layout

---

## 7. Figma

### Toolbar Patterns
- **Bottom toolbar** (not top): Move (V), Scale (K), Frame (F/A), Slice (S), Pen (P), Pencil (Shift+P), Shapes, Text (T), Hand (H), Comment (C)
- **Top bar**: 48px height, dark (#2C2C2C) in design mode, white in community
- Left panel: Layers/Assets (240px, tab-switching)
- Right panel: Properties/Prototype (240px)
- Custom arrow cursor signals manipulation mode
- Every toolbar icon has tooltip with keyboard shortcut (`kbd` element)

### Layer Management
- Row height: 32px, indent: 16px per nesting level
- Selected: #E8F0FE blue highlight (continuous for multi-select)
- Drag reorder: blue insertion line indicator
- Collapsible groups: triangle chevron
- Virtualized rendering for performance
- Horizontal scroll for nested frames (UI3, 2025)
- Auto-scroll heuristics: shift left by 50px+ if layer extends beyond left edge

### Collaborative Cursor Patterns
- Multiplayer cursors with user avatars, colored indicators, name labels
- Unique color per collaborator (spectrum beyond brand colors)
- Selection outlines shown in real-time
- Cursor nametags: `filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3))`
- Comment tool (C): click anywhere on canvas, Enter posts

### Plugin System UX
- **Figma MCP**: Connect Figma variables → code tokens via MCP servers
- **Code Connect**: Dev mode maps design components → code components
- **Dev mode** (Shift+D): inspect distances, variables, styles, export assets
- Community search: 40px input; in-canvas search (Cmd+F): floating bar 320px, top-center
- Quick actions (Cmd+/): command palette similar to Linear/Notion

### Component States (Design System)
- Every interactive component: Default, Hover, Active/Pressed, Focus, Disabled, Loading
- Colors from tokens only (no hardcoded HEX)
- Auto Layout + Variables for sizing/spacing
- Light + dark theme support
- Must pass WCAG 2.2 AA (1.4.3)
- Design Lint plugin: detect missing tokens, inconsistent colors

### Elevation & Depth
| Layer | Shadow |
|---|---|
| Canvas | None (lowest) |
| Side panels | 1px border, no shadow |
| Floating panels | 0 2px 14px rgba(0,0,0,0.15), 8px radius |
| Dropdown menus | 0 0 0 1px rgba(0,0,0,0.05), 0 2px 7px rgba(0,0,0,0.15) |
| Modal dialogs | 0 5px 40px rgba(0,0,0,0.2), backdrop rgba(0,0,0,0.3) |

### Audit Checklist
- [ ] Toolbar at bottom, keyboard shortcuts shown in tooltips
- [ ] Layer panel: 32px rows, indented hierarchy, virtualized
- [ ] Selection highlight: continuous blue, visible across multi-select
- [ ] Collaborative cursors: colored, labeled, shadowed
- [ ] Command palette (Cmd+/ or Cmd+K) for all actions
- [ ] Component states: all 6 defined
- [ ] Colors from tokens, never hardcoded
- [ ] Elevation system: panel shadows, no canvas shadow
- [ ] Comment/annotation system with canvas-level placement
- [ ] Device mode accessible (inspect measurements)
- [ ] Focus ring: 2px+ min, 3:1 contrast

---

## 8. Atlassian Design System (ADS)

### Core Principles (2024 Refresh)
- **One navigation**: Unified across Jira, Confluence, Home, Focus
- **Three reusable components**: Menu button, Flyout menu, Expandable menu — all navigation patterns derive from these
- **Modular properties**: Core + optional properties per component (description, actions, chevron)
- **Predictability**: Same pattern across products — hover any item to see its actions
- **Customizable**: Starred, Recent, sidebar collapse, personalization

### Navigation System
- **Top bar**: Universal actions only (search, create, notifications)
- **Sidebar**: Product navigation with indentation via spacing tokens
- **Three component architecture**:
  1. Menu button — single-click action
  2. Flyout menu — hover/click reveals options
  3. Expandable menu — chevron-indicated sub-items
- Consistent hover actions: Star, Delete, Settings on every item
- Indentation via design tokens (single change affects all products)

### Page Layouts
- **Layout component**: Defines outer structure (nav + panels + content area)
- **Grid**: Fixed-wide (1296px default), Fixed-narrow (864px), Fluid (no max)
- Breakpoints: grid adapts — navigation collapses, panels shift
- Overlays (modals, tooltips) sit outside grid
- Primitives: Box, Stack, Inline for code layouts

### Form Design
- Form component: input with label, validation, help text
- Inline error messages (not banners) for field validation
- Combined Banner + InlineMessage for multi-field errors
- Step-by-step forms with progress indicators

### Notification Patterns
| Type | Component | Placement |
|---|---|---|
| Form field error | InlineMessage | Below field |
| Page/section status | Banner | Top of content area |
| Dialog feedback | Banner inside dialog | Below dialog header |
| Tip/suggestion | InlineMessage (info) | Near relevant content |

### Loading Skeletons
- **Skeleton component**: Placeholder that matches content layout shape
- Used while content loads (not spinners for layout-aware loading)
- Part of ADS pattern library — documented as "early access"

### Audit Checklist
- [ ] Top bar: search + create + notifications (universal)
- [ ] Sidebar: product navigation, indentation via tokens
- [ ] Hover on nav items reveals contextual actions
- [ ] Three-component navigation architecture
- [ ] Grid type matches content (fixed-wide for dashboards, fixed-narrow for docs)
- [ ] Forms: inline validation, not alert banners
- [ ] Skeleton loaders for content (not spinners)
- [ ] Notifications placed near triggering action
- [ ] Dialog errors stay inside dialog (don't close)
- [ ] Consistent spacing via design tokens

---

## 9. WCAG 2.2 AA Requirements

### Contrast Ratios
| Element | Ratio | Criterion |
|---|---|---|
| Normal text (<18pt) | 4.5:1 min | 1.4.3 (AA) |
| Large text (≥18pt bold or ≥24pt) | 3:1 min | 1.4.3 (AA) |
| UI components + graphical objects | 3:1 min | 1.4.11 (AA) |
| Focus indicator (vs adjacent colors) | 3:1 min | 1.4.11 / 2.4.13 |
| Icons (informational) | 3:1 min | 1.4.11 (AA) |

### Focus Indicators
- **2.4.11 Focus Not Obscured (Minimum) — AA**: Focused component must be at least partially visible (not hidden by sticky headers, footers, banners)
- **2.4.13 Focus Appearance — AAA** (was AAA in WCAG 2.1, remains AAA in WCAG 2.2):
  - Area ≥ 2 CSS pixel thick perimeter of unfocused component
  - Contrast ≥ 3:1 between same pixels in focused vs unfocused states
  - Exception: unmodified browser defaults
- Default browser outlines ARE acceptable if not removed; if you customize, must meet AA (2.4.7) or AAA (2.4.13)

### Keyboard Navigation
- **2.1.1 Keyboard (A)**: All functionality operable via keyboard (no timings)
- **2.1.2 No Keyboard Trap (A)**: Focus can move away via standard methods
- **2.1.4 Character Key Shortcuts (A)**: Single-key shortcuts must be: remappable, active only on focus, or toggleable off
- Tab order must match visual order
- Skip links to bypass repeated content (nav, sidebars)

### Screen Reader Requirements
- **1.1.1 Non-text Content (A)**: All non-text content has text alternative
- **1.3.1 Info and Relationships (A)**: Semantic structure (headings, lists, landmarks) via proper HTML/ARIA
- **1.3.2 Meaningful Sequence (A)**: Reading order preserved in code
- **2.4.1 Bypass Blocks (A)**: Skip link mechanism
- **2.4.2 Page Titled (A)**: Descriptive page titles
- **2.4.4 Link Purpose (In Context) (A)**: Link text describes destination
- **2.4.6 Headings and Labels (AA)**: Descriptive headings/labels
- **2.4.7 Focus Visible (AA)**: Visible focus indicator (see above)
- **4.1.2 Name, Role, Value (A)**: All UI controls have programmatic name/role/value
- **4.1.3 Status Messages (AA)**: Status updates (via ARIA live regions) without focus loss

### Error Identification
- **3.3.1 Error Identification (A)**: Error is described to user in text
- **3.3.2 Labels or Instructions (A)**: Labels/instructions present when input required
- **3.3.3 Error Suggestion (AA)**: Suggestions for correction provided
- **3.3.4 Error Prevention (Legal/Financial) (AA)**: Reversible, checked, or confirmed for high-stakes actions
- Error message proximity: place near the field (not in distant banner)

### Timing Requirements
- **2.2.1 Timing Adjustable (A)**: 20× extension or turn off time limit
- **2.2.2 Pause, Stop, Hide (A)**: Moving/blinking content pausable
- **New 2.2.6 — Timeouts (AAA)**: Warn if timeout >20 hours, or data loss risk

### Additional AA Requirements
| Criterion | Requirement |
|---|---|
| 1.4.12 Text Spacing | No loss of content when line height 1.5, spacing 0.16em, word 0.16em |
| 1.4.4 Resize Text | Text can resize 200% without loss |
| 1.4.5 Images of Text | Text used where possible (not images) |
| 2.4.3 Focus Order | Logical focus sequence |
| 2.5.5 Target Size (AA, 2.2) | Target ≥24×24 CSS pixels (except inline, essential, legal) |
| 2.5.7 Dragging Movements (AA, 2.2) | Pointer alternative to dragging |
| 2.5.8 Target Size Minimum (AA, 2.2) | Target ≥24×24px (equivalent for undersized) |
| 3.2.3 Consistent Navigation | Navigation repeats on each page in same order |
| 3.2.4 Consistent Identification | Same components labeled identically |
| 3.3.2 Labels or Instructions | Input requirements made clear |

### Audit Checklist
- [ ] Text contrast ≥4.5:1 (normal) / ≥3:1 (large)
- [ ] UI component contrast ≥3:1 (borders, icons, focus)
- [ ] Focus indicator ≥2px perimeter, ≥3:1 contrast
- [ ] Focus not obscured by sticky elements
- [ ] All functionality keyboard-operable (Tab, Enter, Space, arrows)
- [ ] No keyboard traps
- [ ] Skip link present and functional
- [ ] Headings semantic, correct hierarchy (h1→h6 progression)
- [ ] Alt text on all meaningful images
- [ ] Form errors: inline, specific, suggest correction
- [ ] Labels present on all inputs
- [ ] Touch targets ≥24×24px
- [ ] Dragging has pointer alternative
- [ ] Status messages via ARIA live regions
- [ ] Link text describes destination (not "click here")
- [ ] Consistent navigation/labeling across pages
- [ ] Content does not break at 200% zoom
- [ ] Text spacing overrides don't break layout
