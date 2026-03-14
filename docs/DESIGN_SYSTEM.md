# OpenClaw Design System Reference
# Give this file to Claude Code alongside the master plan document.
# It defines the exact visual style for the entire platform.

## Design Philosophy
Clean, professional, light mode. Editorial warmth. Not generic SaaS.
Think: Bloomberg terminal meets high-end design studio, but in light mode.
Refined, not flashy. Every element earns its place.

## Color Palette
```
Background:        #F8F7F4  (warm cream, not cold white)
Card:              #FFFFFF
Border:            #E8E5DE  (warm gray)
Border Light:      #F0EDE6  (subtle dividers)
Text Primary:      #1A1A1A  (near-black)
Text Secondary:    #6B6560  (warm gray)
Text Muted:        #9C9590  (for labels, timestamps)

Accent Blue:       #2563EB  (primary actions, links, active states)
Accent Blue Light: #EFF4FF  (badges, highlights)

Success Green:     #059669  (active status, positive changes)
Success Light:     #ECFDF5
Warning Amber:     #D97706  (caution, high usage)
Warning Light:     #FFFBEB
Danger Red:        #DC2626  (errors, failures)
Danger Light:      #FEF2F2

Purple:            #7C3AED  (Claude model badge, special items)
Purple Light:      #F5F3FF
Teal:              #0D9488  (Qwen model badge, monitoring)
Teal Light:        #F0FDFA
Pink:              #DB2777  (Gemini/media badges)
Pink Light:        #FDF2F8
```

## Typography
```
Primary Font:     'DM Sans' (Google Fonts)
                  Weights: 300, 400, 500, 600, 700
                  Use for: headings, body text, labels, buttons

Monospace Font:   'JetBrains Mono' (Google Fonts)
                  Weights: 400, 500, 600
                  Use for: timestamps, costs, token counts, IDs,
                  container names, file paths, code, technical data

Google Fonts URL:
https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500;600&display=swap
```

## Typography Scale
```
Page Title:       22px, weight 700, letter-spacing -0.03em
Section Title:    15px, weight 700, letter-spacing -0.01em
Card Label:       11-12px, weight 500, uppercase, letter-spacing 0.06em, color muted
KPI Value:        26-28px, weight 700, letter-spacing -0.02em
Body Text:        13px, weight 400
Small Text:       11-12px
Tiny Text:        9-10px (badge labels, sub-labels)
Mono Data:        11-12px, JetBrains Mono
```

## Component Patterns

### Cards
```
Background: white (#FFFFFF)
Border: 1px solid #E8E5DE
Border Radius: 12px
Padding: 20px 22px
No box shadow (flat, clean)
```

### KPI Cards
```
- Label: uppercase, small, muted color, letter-spaced
- Value: large (26-28px), bold, dark
- Change indicator: small, green (up) or red (down) with arrow
- Sparkline: thin SVG line chart in the corner
```

### Status Dots
```
Active/Connected: #059669 (green) with soft glow shadow
Idle:             #D97706 (amber)
Error:            #DC2626 (red)
Offline:          #9C9590 (muted gray)
Size: 7px circle
```

### Badges
```
Font: 10px, weight 700, uppercase, letter-spacing 0.02-0.03em
Padding: 2px 8px
Border Radius: 20px (pill shape)
Color combinations:
  - Admin:    blue text on blue-light bg
  - Operator: purple text on purple-light bg
  - Model badges: match model color (purple=Claude, teal=Qwen, blue=Gemini)
  - Status: green/amber/red on their light backgrounds
```

### Progress Bars
```
Height: 4-5px
Background: #F0EDE6 (border light)
Fill: accent color (blue, green, amber depending on context)
Border Radius: same as height (fully rounded)
Transition: width 0.6s ease
```

### Tables
```
Header: 10px, uppercase, letter-spaced, muted color, bottom border 2px
Rows: 13px, padding 10-12px vertical, 1px bottom border (border-light)
Alternating: no zebra striping (too busy). Use border-light dividers.
Hover: subtle background shift (optional)
Monospace for: IDs, timestamps, costs, technical values
```

### Buttons
```
Primary:   white text, dark background (#1A1A1A), 12px font, weight 600, radius 8px
Secondary: muted text, white bg, 1px border, 12px font, weight 600, radius 8px
Accent:    blue text, no bg or blue-light bg, 11-12px font
All buttons: font-family DM Sans, cursor pointer, padding 7-8px 14-18px
```

### Sidebar Navigation
```
Width: 210-220px
Background: white
Border-right: 1px solid border color
Items: 13px, weight 400 (inactive) / 600 (active)
Active: background cream (#F8F7F4), right border 2px blue
Icons: 13-14px, opacity 0.5
Bottom section: Chrome status, user avatar
```

### Section Headers
```
Title: 15px, weight 700
Subtitle: 12px, muted color
Action button: right-aligned, 12px, blue text, bordered
```

## Layout Patterns

### Dashboard Overview
```
- Top: page title + date/time + action buttons
- KPI row: 4 cards in a grid
- Main content: 2-column (wide left + narrow right sidebar)
- Bottom: 2-column equal width
```

### Module Pages
```
- Section header with title + subtitle + action
- Content area with cards, tables, or Kanban boards
- Right sidebar for metadata/info (optional, like Creation Studio)
```

### Creation Studio (Pipeline Viewer)
```
- Left panel (340px): pipeline steps as clickable cards, vertical flow
- Center panel (flex): detail view for selected step (input, output, actions)
- Right sidebar (240px): models used, cost breakdown, archive info
```

## Animation & Motion
```
- Transitions: 0.15s ease for hover states, 0.6s ease for progress bars
- Status dots: box-shadow glow for active states
- Sparklines: SVG polyline, no animation (static)
- Keep it subtle. This is a professional tool, not a marketing site.
```

## Do NOT Use
```
- Inter, Roboto, Arial, or system fonts
- Purple gradients on white (generic AI look)
- Heavy box shadows
- Rounded corners larger than 12px
- Emojis in the UI (except agent icons in specific contexts)
- Dark mode (light mode only, warm cream palette)
- Generic SaaS template aesthetics
```

## Reference Files
The following JSX files show the exact implemented style:
- openclaw-dashboard-v2.jsx (main operator dashboard)
- creation-studio.jsx (pipeline viewer)

These are React components using inline styles. When building with Next.js + Tailwind,
translate the inline styles to Tailwind utility classes while maintaining the exact
same visual appearance, colors, spacing, and typography.
