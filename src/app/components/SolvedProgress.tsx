import { colors, continuous } from '@/lib/theme'
import { StyleSheet, Text, View } from 'react-native'

type SolvedProgressItem = {
  label: string
  solved: number
  total: number
  color: string
}

type SolvedProgressProps = {
  items: SolvedProgressItem[]
}

export function SolvedProgress({ items }: SolvedProgressProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Solved by difficulty</Text>
      <View style={styles.list}>
        {items.map((item) => {
          const ratio = item.total > 0 ? item.solved / item.total : 0
          const percent = Math.round(ratio * 100)

          return (
            <View key={item.label} style={styles.item}>
              <View style={styles.topRow}>
                <Text style={styles.label}>{item.label}</Text>
                <Text style={styles.count}>
                  {item.solved}/{item.total}
                </Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.max(4, percent)}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    ...continuous(16),
    padding: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  title: {
    color: colors.foreground,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  list: {
    marginTop: 14,
    gap: 14,
  },
  item: {
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    color: colors.foreground,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  count: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.cardBorder,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
})

