# Responsive Layout

PowerChain Copilot Mobile **1.0.0** uses three layout modes.

## Mobile — under 768px

Navigation becomes a floating bottom dock.

```text
┌──────────────────────────┐
│ Screen content           │
│                          │
│                          │
│                          │
│   ┌──────────────────┐   │
│   │ Home AI Assets … │   │
│   └──────────────────┘   │
└──────────────────────────┘
```

Rules:

- 16px screen gutters
- single-column content
- floating navigation
- navigation max width 420px
- safe-area-aware bottom spacing
- composer is raised above floating navigation
- mobile header stays contextual and compact
- cards remain content-driven

## Tablet — 768px to 1199px

Tablet uses a persistent top application header.

```text
┌────────────────────────────────────────┐
│ PowerChain  Home Copilot Assets …   ● │
├────────────────────────────────────────┤
│                                        │
│  content        content                │
│                                        │
└────────────────────────────────────────┘
```

Rules:

- 24px gutters
- top navigation header
- no floating bottom tab bar
- one or two columns depending on content width
- cards do not scale their border radius
- navigation controls remain compact

## Desktop — 1200px and wider

Desktop retains the top application header and expands the content grid.

Rules:

- 32px gutters
- maximum application width 1280px
- persistent top navigation
- two or three column operational grids
- readable text columns remain constrained
- no stretched full-width cards on ultra-wide screens

## Breakpoints

```ts
tablet  = 768
desktop = 1200
wide    = 1440
```

Canonical source:

```text
src/constants/layout.ts
src/hooks/useResponsiveLayout.ts
```

## Navigation

```text
Mobile
└── FloatingMobileTabBar

Tablet / Desktop
└── ResponsiveHeader
```

Both navigation systems operate on the same five routes:

```text
Home
Copilot
Assets
Systems
Settings
```

## Content widths

Do not use a single fixed width across every device.

`Screen` automatically selects responsive gutters and max-widths.

Special-purpose screens can override `maxWidth` when necessary.

## Copilot

The conversation surface uses the same responsive content width as the rest of the application.

On mobile, the composer reserves space for the floating navigation.

On tablet and desktop, the conversation composer sits at the bottom of the content region without unnecessary floating-nav spacing.

## Adaptive classification

Width alone is not enough to classify devices.

PowerChain uses:

```text
Desktop:
  width >= 1200

Tablet:
  width >= 768
  AND shortest edge >= 600

Mobile:
  everything else
```

This prevents an iPhone or Android phone in landscape from incorrectly receiving the tablet interaction model.

## Copilot split view

Tablet and desktop reserve a left-side rail for persistent conversation navigation.

The rail is intentionally omitted on mobile to preserve message width and reduce navigation density.

## Dialog behavior

Use `AdaptiveDialog` for content that is modal but not a full route:

```text
Mobile       sheet from bottom
Tablet       centered panel
Desktop      centered constrained panel
```

Avoid desktop-sized modal cards on phones and avoid full-width bottom sheets on desktop unless the workflow specifically requires them.
