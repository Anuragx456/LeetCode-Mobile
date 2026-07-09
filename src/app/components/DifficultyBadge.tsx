import { colors } from '@/lib/theme'
import { StyleSheet, Text, View } from 'react-native'

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | string

type DifficultyBadgeProps = {
  difficulty: Difficulty
}

const palette: Record<string, { text: string; bg: string; border: string }> = {
  EASY: {
    text: colors.success,
    bg: colors.successBg,
    border: colors.successBorder,
  },
  MEDIUM: {
    text: colors.warning,
    bg: colors.warningBg,
    border: colors.warningBorder,
  },
  HARD: {
    text: colors.danger,
    bg: colors.dangerBg,
    border: colors.dangerBorder,
  },
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const key = difficulty.toUpperCase()
  const entry = palette[key] ?? {
    text: colors.foreground,
    bg: colors.card,
    border: colors.cardBorder,
  }

  return (
    <View style={[styles.badge, { backgroundColor: entry.bg, borderColor: entry.border }]}>
      <Text style={[styles.text, { color: entry.text }]}>{formatDifficulty(key)}</Text>
    </View>
  )
}

function formatDifficulty(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
})

