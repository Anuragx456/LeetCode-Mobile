import { colors, continuous } from '@/lib/theme'
import { User } from '@supabase/supabase-js'
import { Image } from 'expo-image'
import { StyleSheet, Text, View } from 'react-native'

type ProfileHeaderProps = {
  user: User
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const displayName = getDisplayName(user)
  const initials = getInitials(displayName)
  const avatarUrl = getAvatarUrl(user)

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatarImage}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
      </View>

      <View style={styles.copy}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.email} numberOfLines={1} selectable>
          {user.email ?? 'Signed in'}
        </Text>
        <Text style={styles.memberSince} selectable>
          Member since {formatJoinDate(user.created_at)}
        </Text>
      </View>
    </View>
  )
}

function getDisplayName(user: User) {
  const metadata = user.user_metadata ?? {}
  return (
    metadata.full_name ??
    metadata.name ??
    metadata.display_name ??
    user.email?.split('@')[0] ??
    'MobLeet user'
  )
}

function getAvatarUrl(user: User) {
  const metadata = user.user_metadata ?? {}
  return metadata.avatar_url ?? metadata.picture ?? metadata.avatar ?? null
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)
}

function formatJoinDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...continuous(16),
    padding: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  avatar: {
    width: 56,
    height: 56,
    ...continuous(18),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.limeSoft,
    borderWidth: 1,
    borderColor: colors.limeBorder,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: colors.lime,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.foreground,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  email: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  memberSince: {
    color: colors.mutedDark,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
})

