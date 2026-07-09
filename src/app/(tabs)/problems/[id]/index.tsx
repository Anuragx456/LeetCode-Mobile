import { DifficultyBadge } from '@/app/components/DifficultyBadge'
import { StatCard } from '@/app/components/StatCard'
import { useAuth } from '@/hooks/use-auth'
import { colors, continuous } from '@/lib/theme'
import { supabase } from '@/lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import Reanimated, { FadeInDown } from 'react-native-reanimated'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const AnimatedView = Reanimated.View

type ProblemRow = {
  id: string
  title: string
  description: string
  difficulty: string
  tags: string[]
  constraints: string
  hints: string | null
  editorial: string | null
  examples: Record<string, { input?: string; output?: string; explanation?: string }>
  created_at: string
}

type SubmissionRow = {
  id: string
  status: string
  language: string
  created_at: string
}

const exampleOrder = ['JAVASCRIPT', 'PYTHON', 'JAVA']

export default function ProblemIdPage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [problem, setProblem] = useState<ProblemRow | null>(null)
  const [solved, setSolved] = useState(false)
  const [submissionCount, setSubmissionCount] = useState(0)
  const [lastSubmission, setLastSubmission] = useState<SubmissionRow | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      if (!user || !id || Array.isArray(id)) {
        return
      }

      setLoading(true)
      const [problemResult, solvedResult, submissionsResult] = await Promise.all([
        supabase
          .from('problems')
          .select('id, title, description, difficulty, tags, constraints, hints, editorial, examples, created_at')
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('problem_solved')
          .select('problem_id, created_at')
          .eq('user_id', user.id)
          .eq('problem_id', id)
          .maybeSingle(),
        supabase
          .from('submissions')
          .select('id, status, language, created_at')
          .eq('user_id', user.id)
          .eq('problem_id', id)
          .order('created_at', { ascending: false }),
      ])

      if (!active) {
        return
      }

      if (!problemResult.error && problemResult.data) {
        setProblem(problemResult.data as ProblemRow)
      } else {
        setProblem(null)
      }

      setSolved(Boolean(solvedResult.data && !solvedResult.error))

      if (!submissionsResult.error && submissionsResult.data) {
        const rows = submissionsResult.data as SubmissionRow[]
        setSubmissionCount(rows.length)
        setLastSubmission(rows[0] ?? null)
      } else {
        setSubmissionCount(0)
        setLastSubmission(null)
      }

      setLoading(false)
    }

    void load()

    return () => {
      active = false
    }
  }, [id, user])

  const examples = useMemo(() => {
    if (!problem) return []

    return exampleOrder
      .map((language) => ({
        language,
        example: problem.examples?.[language],
      }))
      .filter((entry) => Boolean(entry.example?.input || entry.example?.output || entry.example?.explanation))
  }, [problem])

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.lime} />
      </View>
    )
  }

  if (!problem) {
    return (
      <View style={styles.screen}>
        <View style={[styles.missingState, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.missingIcon}>
            <Ionicons name="alert-circle" size={22} color={colors.danger} />
          </View>
          <Text style={styles.missingTitle}>Problem not found</Text>
          <Text style={styles.missingCopy}>
            The selected problem could not be loaded.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backButtonText}>Go back</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedView entering={FadeInDown.springify()} style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backIcon, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-back" size={18} color={colors.foreground} />
            </Pressable>

            <View style={styles.headerMeta}>
              <DifficultyBadge difficulty={problem.difficulty} />
              {solved ? (
                <View style={styles.solvedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={styles.solvedText}>Solved</Text>
                </View>
              ) : null}
            </View>
          </AnimatedView>

          <View style={styles.hero}>
            <Text style={styles.title}>{problem.title}</Text>
            <Text style={styles.description} selectable>{problem.description}</Text>

            <View style={styles.tagRow}>
              {problem.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatCard
              value={submissionCount.toString()}
              label="My submissions"
              accentColor={colors.lime}
            />
            <StatCard
              value={solved ? 'Yes' : 'No'}
              label="Solved status"
              accentColor={solved ? colors.success : colors.warning}
            />
            <StatCard
              value={formatDate(problem.created_at)}
              label="Added"
              accentColor={colors.mint}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Constraints</Text>
            <View style={styles.card}>
              <Text style={styles.cardText} selectable>{problem.constraints}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Examples</Text>
            <View style={styles.stack}>
              {examples.length ? (
                examples.map(({ language, example }) => (
                  <View key={language} style={styles.card}>
                    <View style={styles.exampleHeader}>
                      <Text style={styles.exampleLanguage}>{language}</Text>
                      <Text style={styles.exampleMeta}>
                        {example?.output ? `Output: ${example.output}` : 'Example'}
                      </Text>
                    </View>
                    {example?.input ? (
                      <Text style={styles.codeBlock} selectable>Input: {example.input}</Text>
                    ) : null}
                    {example?.explanation ? (
                      <Text style={styles.exampleCopy} selectable>{example.explanation}</Text>
                    ) : null}
                  </View>
                ))
              ) : (
              <View style={styles.card}>
                <Text style={styles.cardText} selectable>No examples available.</Text>
              </View>
              )}
            </View>
          </View>

          {problem.hints ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hint</Text>
              <View style={styles.card}>
                <Text style={styles.cardText} selectable>{problem.hints}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent run</Text>
            <View style={styles.card}>
              {lastSubmission ? (
                <>
                  <View style={styles.runTopRow}>
                    <Text style={styles.runStatus} selectable>{lastSubmission.status}</Text>
                    <Text style={styles.runMeta}>
                      {lastSubmission.language.toUpperCase()} · {formatTimeAgo(lastSubmission.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.cardText} selectable>
                    Your latest submission for this problem is tracked here.
                  </Text>
                </>
              ) : (
                <Text style={styles.cardText} selectable>
                  No submissions yet. Start solving to see your run history.
                </Text>
              )}
            </View>
          </View>

          {problem.editorial ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Editorial summary</Text>
              <View style={styles.card}>
                <Text style={styles.cardText} selectable>{problem.editorial}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/problems/[id]/solve',
                  params: { id: problem.id },
                })
              }
              style={({ pressed }) => [styles.solveButton, pressed && styles.pressed]}
            >
              <Text style={styles.solveButtonText}>Start solving</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.background} />
            </Pressable>
          </View>
        </ScrollView>
    </View>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function formatTimeAgo(value: string) {
  const diffMs = Date.now() - new Date(value).getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))

  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  backIcon: {
    width: 40,
    height: 40,
    ...continuous(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  solvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  solvedText: {
    color: colors.success,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  hero: {
    marginTop: 22,
    gap: 12,
  },
  title: {
    color: colors.foreground,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tagText: {
    color: colors.foreground,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  section: {
    marginTop: 24,
    gap: 10,
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  card: {
    ...continuous(16),
    padding: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 10,
  },
  cardText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  stack: {
    gap: 12,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  exampleLanguage: {
    color: colors.lime,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  exampleMeta: {
    color: colors.mutedDark,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
  codeBlock: {
    color: colors.foreground,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  exampleCopy: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  runTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  runStatus: {
    color: colors.foreground,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  runMeta: {
    color: colors.mutedDark,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
  actions: {
    marginTop: 28,
  },
  solveButton: {
    minHeight: 54,
    ...continuous(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.lime,
  },
  solveButtonText: {
    color: colors.background,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  missingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  missingIcon: {
    width: 52,
    height: 52,
    ...continuous(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  missingTitle: {
    color: colors.foreground,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  missingCopy: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    textAlign: 'center',
  },
  backButton: {
    minHeight: 48,
    paddingHorizontal: 18,
    ...continuous(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginTop: 10,
  },
  backButtonText: {
    color: colors.foreground,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.86,
  },
})
