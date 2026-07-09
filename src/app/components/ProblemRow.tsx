import { colors, continuous } from '@/lib/theme'
import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { DifficultyBadge } from './DifficultyBadge'

type ProblemRowProps = {
  index: number
  title: string
  difficulty: string
  tags: string[]
  solved: boolean
  onPress: () => void
}

export function ProblemRow({
  index,
  title,
  difficulty,
  tags,
  solved,
  onPress,
}: ProblemRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.indexBox}>
        <Text style={styles.indexText}>{String(index).padStart(2, '0')}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {solved ? (
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <DifficultyBadge difficulty={difficulty} />
          {tags.slice(0, 2).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText} numberOfLines={1}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    ...continuous(16),
    padding: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  pressed: {
    opacity: 0.86,
  },
  indexBox: {
    width: 38,
    height: 38,
    ...continuous(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.limeSoft,
    borderWidth: 1,
    borderColor: colors.limeBorder,
    marginTop: 1,
  },
  indexText: {
    color: colors.lime,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    color: colors.foreground,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.cardBorder,
  },
  tagText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
})

