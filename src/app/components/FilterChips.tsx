import { colors } from '@/lib/theme'
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'

export type ProblemDifficultyFilter = 'ALL' | 'EASY' | 'MEDIUM' | 'HARD'

type FilterChipsProps = {
  value: ProblemDifficultyFilter
  onChange: (value: ProblemDifficultyFilter) => void
}

const options: ProblemDifficultyFilter[] = ['ALL', 'EASY', 'MEDIUM', 'HARD']

export function FilterChips({ value, onChange }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => {
        const selected = option === value
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.chipSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[styles.label, selected && styles.labelSelected]}
              numberOfLines={1}
            >
              {option === 'ALL' ? 'All' : formatOption(option)}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

function formatOption(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

const styles = StyleSheet.create({
  row: {
    gap: 10,
    paddingRight: 4,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  chipSelected: {
    backgroundColor: colors.limeSoft,
    borderColor: colors.limeBorder,
  },
  pressed: {
    opacity: 0.84,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
  },
  labelSelected: {
    color: colors.lime,
  },
})
