import { AntDesign, Feather } from '@expo/vector-icons'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { signInWithOAuth } from '@/lib/auth'
import { colors } from '@/lib/theme'

type Provider = 'github' | 'google'

export default function SignInScreen() {
  const [loading, setLoading] = useState<Provider | null>(null)

  useEffect(() => {
    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
  }, [])

  async function handleSignIn(provider: Provider) {
    if (loading) return
    setLoading(provider)
    try {
      await signInWithOAuth(provider)
    } catch (err) {
      Alert.alert(
        'Sign in failed',
        err instanceof Error ? err.message : 'Unknown error'
      )
    } finally {
      setLoading(null)
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Image
                source={require('../../../assets/images/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.version}>v1.0</Text>
          </View>

          <View style={styles.hero}>
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>Solve smarter</Text>
            </View>

            <Text style={styles.title}>Welcome to</Text>
            <Text style={styles.titleAccent}>MobLeet.</Text>

            <Text style={styles.subtitle}>
              Practice anywhere - track your{' '}
              <Text style={styles.subtitleHighlight}>streak</Text>, revisit
              solutions, and stay consistent.
            </Text>
          </View>

          <View style={styles.features}>
            <FeatureRow
              icon="zap"
              color={colors.lime}
              bg={colors.limeSoft}
              title="Daily practice"
              subtitle="Quick problems that fit your day"
            />
            <FeatureRow
              icon="map-pin"
              color={colors.peach}
              bg={colors.warningBg}
              title="Track progress"
              subtitle="Streaks, topics, and solved history"
            />
            <FeatureRow
              icon="shield"
              color={colors.mint}
              bg={colors.mintSoft}
              title="Private & secure"
              subtitle="Supabase Auth · secure sessions"
            />
          </View>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.githubButton,
                pressed && styles.buttonPressed,
                loading !== null && styles.buttonDisabled,
              ]}
              disabled={loading !== null}
              onPress={() => handleSignIn('github')}
            >
              {loading === 'github' ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <AntDesign name="github" size={18} color={colors.background} />
                  <Text style={styles.githubButtonLabel}>
                    Continue with GitHub
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.googleButton,
                pressed && styles.buttonPressed,
                loading !== null && styles.buttonDisabled,
              ]}
              disabled={loading !== null}
              onPress={() => handleSignIn('google')}
            >
              {loading === 'google' ? (
                <ActivityIndicator color={colors.foreground} />
              ) : (
                <>
                  <AntDesign name="google" size={18} color={colors.foreground} />
                  <Text style={styles.googleButtonLabel}>
                    Continue with Google
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          <Text style={styles.legal}>
            By continuing you agree to MobLeet&apos;s{' '}
            <Text
              style={styles.legalLink}
              onPress={() => Linking.openURL('https://example.com/terms')}
            >
              Terms
            </Text>{' '}
            and{' '}
            <Text
              style={styles.legalLink}
              onPress={() => Linking.openURL('https://example.com/privacy')}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

function FeatureRow({
  icon,
  color,
  bg,
  title,
  subtitle,
}: {
  icon: keyof typeof Feather.glyphMap
  color: string
  bg: string
  title: string
  subtitle: string
}) {
  return (
    <View style={styles.featureRow}>
      <View style={[styles.featureIconBox, { backgroundColor: bg }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <View style={styles.featureCopy}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSubtitle}>{subtitle}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.limeSoft,
    borderWidth: 1,
    borderColor: colors.limeBorder,
  },
  logoImage: {
    width: 28,
    height: 28,
  },
  version: {
    color: colors.muted,
    fontSize: 12,
    letterSpacing: 1.4,
  },
  hero: {
    marginTop: 40,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 16,
    backgroundColor: colors.limeSoft,
    borderWidth: 1,
    borderColor: colors.limeBorder,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.lime,
    marginRight: 8,
  },
  badgeText: {
    color: colors.lime,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: colors.foreground,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '700',
  },
  titleAccent: {
    color: colors.lime,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
  subtitleHighlight: {
    color: colors.peach,
  },
  features: {
    marginTop: 32,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCopy: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
  },
  featureSubtitle: {
    color: colors.muted,
    fontSize: 12,
  },
  actions: {
    marginTop: 32,
    gap: 12,
  },
  githubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.lime,
    paddingHorizontal: 20,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 20,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  githubButtonLabel: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  googleButtonLabel: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },

  legal: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 24,
  },
  legalLink: {
    color: colors.peach,
    textDecorationLine: 'underline',
  },
})
