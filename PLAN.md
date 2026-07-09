# PLAN.md — UI Implementation: Home, Problems List, Profile

## Overview

Implement full UI for the three tab-level screens in MobLeet. All three currently render a single `<Text>` placeholder. The project uses Expo SDK 55, React Native StyleSheet, Zustand for state, Supabase for data, and a dark theme with lime/peach accents.

**Existing patterns to follow:**
- Theme colors from `src/lib/theme.ts`
- Auth state via `useAuth()` hook (`src/hooks/use-auth.ts`)
- Supabase client from `src/lib/supabase.ts`
- SafeAreaView from `react-native-safe-area-context`
- Icons from `@expo/vector-icons` (Ionicons already used in tab bar)
- Dark background `#0a0a0c`, cards with `rgba(255,255,255,0.04)` + `rgba(255,255,255,0.07)` borders
- No NativeWind/Tailwind — pure `StyleSheet.create()`

**Database tables available (via Supabase):**
- `problems` — id, title, description, difficulty, tags, created_at
- `submissions` — user_id, problem_id, status (Accepted/Wrong Answer/etc.), language, created_at
- `problem_solved` — user_id, problem_id (marks a problem as solved)
- `profiles` — id, created_at (user profile, 1:1 with auth.users)

---

## Page 1: Home Tab (`src/app/(tabs)/index.tsx`)

### Purpose
Dashboard/landing screen showing the user's progress at a glance and quick actions.

### Layout (top to bottom, ScrollView)
1. **Header row** — greeting (Good morning/afternoon/evening) + logo/avatar
2. **Stats banner** — 3 stat cards in a horizontal row:
   - Solved count (e.g., "3/50") with lime accent
   - Current streak (days) with peach accent
   - Acceptance rate (%) with mint accent
3. **Quick actions** — 2 large pressable cards:
   - "Continue Practice" → navigates to problems list
   - "Random Problem" → picks a random problem, navigates to detail
4. **Difficulty breakdown** — horizontal bar or 3 small cards showing Easy/Medium/Hard solved vs total
5. **Recent activity** — last 3-5 submissions as compact rows (problem name, status badge, language, time ago)

### Data Fetching
- Query `problem_solved` count for the user
- Query `problems` count for totals per difficulty
- Query `submissions` for recent 5 (ordered by created_at desc)
- Compute streak from `problem_solved` dates (consecutive days)
- All queries use Supabase client with RLS (user's own data only)

### Components to create
- `src/app/components/StatCard.tsx` — reusable stat card (value, label, color accent)
- `src/app/components/DifficultyBadge.tsx` — colored badge (EASY=lime, MEDIUM=peach, HARD=danger)
- `src/app/components/ActivityRow.tsx` — recent submission row

---

## Page 2: Problems List (`src/app/(tabs)/problems/index.tsx`)

### Purpose
Browseable, filterable list of all coding problems.

### Layout (top to bottom)
1. **Header** — "Problems" title with problem count
2. **Search bar** — text input to filter by title
3. **Filter chips** — horizontal scrollable row: All, Easy, Medium, Hard
4. **Problem list** — FlatList of problem cards, each showing:
   - Number/index
   - Title
   - Difficulty badge
   - Tags (first 2)
   - Solved indicator (checkmark if in `problem_solved`)
5. **Empty state** — if no problems match filters

### Data Fetching
- Query `problems` table (id, title, difficulty, tags, created_at)
- Query `problem_solved` for current user to show solved status
- Client-side filtering by difficulty and search text (small dataset expected)

### Components to create
- `src/app/components/ProblemRow.tsx` — problem list item card
- `src/app/components/FilterChips.tsx` — horizontal filter chip row

### Navigation
- Tapping a problem navigates to `/(tabs)/problems/[id]` (not yet implemented, but link prepared)

---

## Page 3: Profile (`src/app/(tabs)/profile.tsx`)

### Purpose
User profile screen showing account info and statistics.

### Layout (top to bottom, ScrollView)
1. **Avatar + name section** — user avatar (or initials fallback), display name or email, member since date
2. **Stats row** — 3 stat cards (reusing `StatCard`):
   - Total solved
   - Total submissions
   - Current streak
3. **Solved by difficulty** — Easy/Medium/Hard breakdown with progress bars
4. **Recent submissions** — last 5-10 submissions list
5. **Sign out button** — styled danger button at bottom

### Data Fetching
- User info from `useAuth()` (user.email, user.user_metadata)
- Query `problem_solved` for count
- Query `submissions` for total count and recent list
- Query `problems` for difficulty totals (denominator)

### Components to create
- `src/app/components/ProfileHeader.tsx` — avatar + name + join date
- Reuse `StatCard` from Home
- `src/app/components/SolvedProgress.tsx` — difficulty progress bars

---

## Shared Components

| Component | File | Used by |
|-----------|------|---------|
| `StatCard` | `src/app/components/StatCard.tsx` | Home, Profile |
| `DifficultyBadge` | `src/app/components/DifficultyBadge.tsx` | Problems, Home |
| `ActivityRow` | `src/app/components/ActivityRow.tsx` | Home, Profile |
| `ProblemRow` | `src/app/components/ProblemRow.tsx` | Problems list |
| `FilterChips` | `src/app/components/FilterChips.tsx` | Problems list |
| `ProfileHeader` | `src/app/components/ProfileHeader.tsx` | Profile |
| `SolvedProgress` | `src/app/components/SolvedProgress.tsx` | Profile |

---

## Data Access Pattern

All pages fetch data via Supabase client directly. Example pattern:

```ts
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'

// In component:
const { user } = useAuth()

// Fetch problems
const { data: problems } = await supabase
  .from('problems')
  .select('id, title, difficulty, tags, created_at')
  .order('created_at', { ascending: false })

// Fetch solved IDs
const { data: solved } = await supabase
  .from('problem_solved')
  .select('problem_id')
  .eq('user_id', user!.id)
```

Wrap fetches in `useEffect` + `useState`. Consider a `useEffect` with cleanup to avoid state updates on unmounted components.

---

## Implementation Order

1. **StatCard** — shared component used by Home and Profile
2. **DifficultyBadge** — shared component used by Problems list
3. **Home tab** — first screen user sees after login
4. **FilterChips + ProblemRow** — shared components for Problems list
5. **Problems list** — core browsing experience
6. **ProfileHeader + SolvedProgress** — shared components for Profile
7. **Profile tab** — final screen

---

## Style Guidelines

- Background: `colors.background` (#0a0a0c)
- Card background: `colors.card` (rgba(255,255,255,0.04))
- Card border: `colors.cardBorder` (rgba(255,255,255,0.07))
- Primary text: `colors.foreground` (#fafafa)
- Secondary text: `colors.muted` (#9e9ea7)
- Accent: `colors.lime` (#bdf06e)
- Success: `colors.success` (#86efac) / `colors.successBg`
- Warning: `colors.warning` (#fdba74) / `colors.warningBg`
- Danger: `colors.danger` (#fca5a5) / `colors.dangerBg`
- Border radius: 16px for cards, 12px for badges, 999px for pills
- Font sizes: 14-16 body, 24-36 headers, 12 captions
- Font weights: 600 for headers, 500 for body, 400 for captions
- Use `SafeAreaView` from `react-native-safe-area-context` for top/bottom insets
- Use `ScrollView` for page content (not FlatList unless list is large)
- No hardcoded colors — always use `colors.*` from theme

---

## Files to Create/Modify

### New files (7 components)
- `src/app/components/StatCard.tsx`
- `src/app/components/DifficultyBadge.tsx`
- `src/app/components/ActivityRow.tsx`
- `src/app/components/ProblemRow.tsx`
- `src/app/components/FilterChips.tsx`
- `src/app/components/ProfileHeader.tsx`
- `src/app/components/SolvedProgress.tsx`

### Modified files (3 screens)
- `src/app/(tabs)/index.tsx` — replace placeholder with Home UI
- `src/app/(tabs)/problems/index.tsx` — replace placeholder with Problems list UI
- `src/app/(tabs)/profile.tsx` — replace placeholder with Profile UI
