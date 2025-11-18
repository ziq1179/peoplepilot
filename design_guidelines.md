# HRIS Application Design Guidelines

## Design Approach: Enterprise Design System

**Selected Framework**: Adapting Fluent Design & Carbon Design principles for data-heavy, multi-role enterprise application using shadcn/ui components.

**Core Principles**:
- Information density with breathing room
- Role-based visual hierarchy
- Consistent, predictable patterns
- Professional restraint over visual flair

---

## Typography System

**Font Family**: Inter (primary), JetBrains Mono (data/numbers)

**Hierarchy**:
- Page Titles: text-3xl font-semibold (30px)
- Section Headers: text-xl font-semibold (20px)
- Card Titles: text-lg font-medium (18px)
- Body Text: text-sm (14px)
- Data Labels: text-xs uppercase tracking-wide font-medium (12px)
- Table Data: text-sm font-normal

---

## Layout System

**Spacing Units**: Use Tailwind units of 1, 2, 3, 4, 6, 8, 12, 16 exclusively

**Layout Structure**:
- **Sidebar Navigation**: Fixed left, w-64, with collapsible option to w-16 (icon-only)
- **Top Bar**: Fixed, h-16, contains global search, notifications, user profile
- **Main Content Area**: ml-64, p-6 to p-8, max-w-[1600px] for ultra-wide screens
- **Card Containers**: Rounded corners (rounded-lg), shadow-sm, p-6 spacing
- **Grid Systems**: 2-column for forms, 3-4 column for dashboard cards, 1-column for tables

---

## Component Library

### Navigation Components
**Sidebar**: 
- Logo area (h-16) with company branding
- Navigation groups with section headers
- Active state: filled background, bold text
- Icons: 20px from Lucide (heroicons alternative compatible with shadcn)
- Role indicator badge at bottom

**Top Bar**:
- Breadcrumb navigation (left)
- Global search with CMD+K trigger (center-left)
- Quick actions: Notifications bell with badge, User dropdown (right)

### Dashboard Components
**Stat Cards** (4-across grid on desktop):
- Large number display (text-3xl font-bold)
- Label below (text-sm muted)
- Small trend indicator with icon
- Optional sparkline chart (12px height)

**Data Tables**:
- Sticky header row
- Zebra striping (subtle)
- Row hover state
- Inline actions (right column)
- Pagination at bottom
- Filters in top-right corner

**Forms**:
- 2-column layout on desktop, stack on mobile
- Label above input pattern
- Helper text below (text-xs muted)
- Required field asterisks
- Shadcn form components throughout

### Module-Specific Components
**Employee Cards**: Avatar (48px), name, department, employment status badge, quick actions menu

**Leave Calendar**: Month view with color-coded leave types, legend, request button prominent

**Payroll Tables**: Right-aligned numbers, currency formatting, total row with border-top emphasis

**Performance Review Cards**: Progress rings, rating stars, timeline view of past reviews

### Status Indicators
**Badges**: Small pill-shaped (rounded-full, px-2 py-1, text-xs)
- Active/Approved: Green semantic
- Pending: Amber semantic  
- Inactive/Rejected: Red semantic
- Neutral: Gray semantic

---

## Page Layouts

### Dashboard (Role-Based)
- **Admin**: System health metrics, recent activity feed, pending approvals, quick stats (4-card grid)
- **HR**: Department overview, leave requests, upcoming reviews, employee anniversaries
- **Manager**: Team roster cards, pending approvals, performance overview, attendance summary
- **Employee**: Personal info card, leave balance, payslip access, upcoming reviews

### Employee Directory
- Search/filter bar at top with department, role, status filters
- Grid view (3-4 columns) or list view toggle
- Each card: Avatar, name, title, department, contact button, view profile link

### Leave Management
- Calendar view (primary) with month/year navigation
- Side panel: Leave balance summary, request new leave form
- Below calendar: Table of all leave requests with status

### Payroll Module
- Tab navigation: Overview, Payslips, Tax Documents, Reports
- Table view with filters for date range, employee (admin/HR view)
- Individual payslip: Structured breakdown with earnings/deductions sections

### Performance Reviews
- Timeline view of review cycles
- Individual review: Rating sections, comments area, goals tracking, signature capture
- Manager view: Team performance matrix, comparison charts

---

## Information Architecture

**Primary Navigation** (Sidebar):
1. Dashboard
2. Employees (with sub-menu: Directory, Onboarding, Offboarding)
3. Leave Management
4. Payroll
5. Performance
6. Reports
7. Settings (admin only)

**Secondary Actions**: Contextual buttons in top-right of content area, dropdown menus for bulk actions

---

## Images

**No Hero Image Required** - This is an application interface, not a marketing site.

**Avatar Images**: Employee profile photos throughout (48px standard, 96px on profile pages)

**Empty States**: Illustrative SVGs for empty tables/lists (e.g., "No leave requests yet" with calendar illustration)

**Onboarding Screens**: Welcome illustrations for first-time users

---

## Animations

**Minimal, Functional Only**:
- Sidebar collapse/expand transition (200ms)
- Dropdown menu fade-in (150ms)
- Toast notifications slide-in from top-right
- Loading states: Skeleton screens, not spinners
- Table row expansion for details (smooth accordion)

---

## Accessibility & Patterns

- Maintain WCAG AA contrast throughout
- Focus indicators on all interactive elements (ring-2 ring-offset-2)
- Keyboard shortcuts documented and supported (CMD+K search, ESC to close modals)
- Screen reader labels on icon-only buttons
- Form validation with inline error messages