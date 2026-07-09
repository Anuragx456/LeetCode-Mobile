export const colors = {
    lime: '#bdf06e',
    peach: '#fdba74',
    mint: '#a5f3fc',
    background: '#0a0a0c',
    foreground: '#fafafa',
    muted: '#9e9ea7',
    mutedDark: '#71717a',
    card: 'rgba(255, 255, 255, 0.04)',
    cardBorder: 'rgba(255, 255, 255, 0.07)',
    limeSoft: 'rgba(189, 240, 110, 0.14)',
    limeBorder: 'rgba(189, 240, 110, 0.32)',
    mintSoft: 'rgba(165, 243, 252, 0.14)',
    mintBorder: 'rgba(165, 243, 252, 0.32)',
    success: '#86efac',
    successBg: 'rgba(134, 239, 172, 0.14)',
    successBorder: 'rgba(134, 239, 172, 0.32)',
    warning: '#fdba74',
    warningBg: 'rgba(253, 186, 116, 0.14)',
    warningBorder: 'rgba(253, 186, 116, 0.32)',
    danger: '#fca5a5',
    dangerBg: 'rgba(252, 165, 165, 0.14)',
    dangerBorder: 'rgba(252, 165, 165, 0.32)',
    tabBar: '#1c1c1e',
    tabBarActive: '#3a3a3c',
  } as const

// Shared height of the floating custom tab bar, used to pad content so it
// never sits underneath the bar.
export const TAB_BAR_HEIGHT = 96

// Apply continuous corner curves to any rounded surface (HIG). Skip for
// capsule/pill shapes (borderRadius 999).
export function continuous(radius: number) {
  return { borderRadius: radius, borderCurve: 'continuous' as const }
}
