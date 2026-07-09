import { colors, continuous } from '@/lib/theme'
import { StyleSheet, Text, View } from 'react-native'

type StatCardProps = {
  value: string
  label: string
  accentColor: string
}

export function StatCard({ value, label, accentColor }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.accentLine, { backgroundColor: accentColor }]} />
      <Text style={[styles.value, { color: accentColor }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 92,
    ...continuous(16),
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
  },
  accentLine: {
    width: 32,
    height: 3,
    borderRadius: 999,
    marginBottom: 14,
  },
  value: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  label: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
})

