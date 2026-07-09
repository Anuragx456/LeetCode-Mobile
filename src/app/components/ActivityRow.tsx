import { colors, continuous } from '@/lib/theme'
import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'

type ActivityRowProps = {
  title: string
  status: string
  language: string
  createdAt: string
}

export function ActivityRow({
  title,
  status,
  language,
  createdAt,
}: ActivityRowProps) {
  const meta = getStatusMeta(status)

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1} selectable>
          {title}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.statusBadge, { backgroundColor: meta.bg, borderColor: meta.border }]}>
            <Ionicons name={meta.icon} size={11} color={meta.text} />
            <Text style={[styles.statusText, { color: meta.text }]} numberOfLines={1} selectable>
              {meta.label}
            </Text>
          </View>
          <Text style={styles.metaText} numberOfLines={1}>
            {language.toUpperCase()}
          </Text>
          <Text style={styles.metaText} numberOfLines={1}>
            {formatTimeAgo(createdAt)}
          </Text>
        </View>
      </View>
    </View>
  )
}

function getStatusMeta(status: string) {
  const normalized = status.trim().toLowerCase()

  if (normalized === 'accepted') {
    return {
      label: 'Accepted',
      icon: 'checkmark-circle' as const,
      text: colors.success,
      bg: colors.successBg,
      border: colors.successBorder,
    }
  }

  if (normalized.includes('wrong')) {
    return {
      label: 'Wrong Answer',
      icon: 'close-circle' as const,
      text: colors.danger,
      bg: colors.dangerBg,
      border: colors.dangerBorder,
    }
  }

  if (normalized.includes('compile') || normalized.includes('runtime')) {
    return {
      label: status,
      icon: 'alert-circle' as const,
      text: colors.warning,
      bg: colors.warningBg,
      border: colors.warningBorder,
    }
  }

  return {
    label: status,
    icon: 'time' as const,
    text: colors.muted,
    bg: colors.card,
    border: colors.cardBorder,
  }
}

function formatTimeAgo(createdAt: string) {
  const started = new Date(createdAt).getTime()
  const diffMs = Date.now() - started
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))

  if (diffMinutes < 1) {
    return 'just now'
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) {
    return `${diffDays}d ago`
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(createdAt))
}

const styles = StyleSheet.create({
  row: {
    ...continuous(16),
    padding: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  copy: {
    gap: 10,
  },
  title: {
    color: colors.foreground,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  metaText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
})

