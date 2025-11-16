# ChatWave - Design Guidelines

## Design Approach
**Utility-focused messaging application** with strong visual identity through gradient effects and glassmorphism. Drawing inspiration from Discord and Slack's sidebar patterns combined with modern glass aesthetics.

## Core Design Elements

### Typography
- **Primary Font**: Inter (Google Fonts)
- **Headings**: font-semibold to font-bold, text-2xl to text-4xl
- **Body Text**: text-sm to text-base, font-normal
- **Labels/Metadata**: text-xs, font-medium
- **Portuguese Language**: Ensure proper UTF-8 character support

### Layout System
**Spacing Units**: Use Tailwind primitives of 2, 4, 6, 8, 12, 16, 20
- Compact elements: p-2, p-4, gap-2
- Standard sections: p-6, p-8, gap-4
- Major spacing: p-12, p-16, gap-8

**Layout Structure**:
- Fixed header: h-16
- Sidebar: w-64, fixed positioning
- Main content: ml-64 offset
- Responsive: Sidebar collapses to overlay on mobile (<768px)

### Color System
**Gradient Direction**: Header gradient flows left-to-right or top-right diagonal
- Base gradient: `from-blue-900 via-purple-900 to-purple-800`
- Light theme adjustments: lighter gradient variants with opacity

**Theme Implementation**:
- Dark theme as default (matches messaging app conventions)
- Light theme: white/gray-50 backgrounds, gray-900 text
- Smooth theme transitions: `transition-colors duration-200`

### Component Library

**Header** (Full-width, h-16):
- Gradient background with glassmorphism: `backdrop-blur-xl bg-opacity-90`
- Logo area (left): pl-6, flex items-center, gap-3
- User area (right): pr-6, avatar + dropdown menu
- Dropdown: rounded-lg, shadow-xl, animated entry

**Sidebar** (w-64):
- Semi-transparent background with subtle blur
- Navigation items: h-12, px-4, rounded-lg, flex items-center, gap-3
- Active state: `bg-white/10` in dark, `bg-gray-100` in light + 4px left border indicator (accent color)
- Icons: w-8 h-8 (as specified), use Heroicons
- Hover state: `bg-white/5` subtle highlight

**Login Page**:
- Centered card: max-w-md, p-8, rounded-2xl
- Glass card effect: `backdrop-blur-lg bg-white/10 dark:bg-gray-900/40`
- Input fields: h-12, rounded-lg, bg-white/5 border
- Primary button: gradient background matching header theme
- Logo + tagline above form

**Empty State Page** (Default):
- Centered content: max-w-2xl, text-center
- Large icon: w-24 h-24, text-gray-400
- Heading: text-3xl, font-bold, mb-4
- Description: text-lg, text-gray-500
- Secondary icon grid: 3 columns, smaller illustrative icons

**404 Error Page**:
- Full viewport: min-h-screen, flex centered
- Animated 404 text: text-9xl, gradient text effect
- Back home button: rounded-full, px-8, py-3
- Playful illustration or icon

**User Menu Dropdown**:
- Profile section with avatar + name
- Divider line
- Menu items: Theme toggle, Settings, Logout
- Icons: w-5 h-5 (smaller than sidebar)

### Glassmorphism Effect Pattern
Apply to header, sidebar, modals, dropdowns:
```
backdrop-blur-xl bg-opacity-90 border border-white/10
```

### Interaction Patterns
- No hover effects on gradient buttons over images
- Sidebar items: smooth hover transitions (150ms)
- Dropdowns: slide-down animation (200ms)
- Theme toggle: instant switch with fade transition
- Active link: immediate visual feedback

### Accessibility
- Focus rings: `focus:ring-2 focus:ring-purple-500 focus:outline-none`
- Keyboard navigation: full support for sidebar and dropdowns
- ARIA labels in Portuguese
- Sufficient contrast ratios in both themes

### Icons
**Library**: Heroicons via CDN (outline style primary, solid for active states)
- Sidebar icons: w-8 h-8
- Menu icons: w-5 h-5
- Empty state: w-24 h-24
- Use semantic icons: ChatBubble, User, Cog, Moon/Sun, etc.

### Animations
**Minimal and purposeful**:
- Page transitions: subtle fade (100ms)
- Dropdown entries: slide-down (200ms)
- Theme switch: fade (150ms)
- No distracting background animations

## Portuguese Localization
All text in pt-BR:
- "Entrar" (Login)
- "Sair" (Logout)
- "Configurações" (Settings)
- "Tema Claro/Escuro"
- Error messages and validation in Portuguese