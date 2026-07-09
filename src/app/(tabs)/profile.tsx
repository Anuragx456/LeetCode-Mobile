import { ActivityRow } from '@/app/components/ActivityRow'
import { ProfileHeader } from '@/app/components/ProfileHeader'
import { SolvedProgress } from '@/app/components/SolvedProgress'
import { StatCard } from '@/app/components/StatCard'
import { useAuth } from '@/hooks/use-auth'
import { colors, continuous, TAB_BAR_HEIGHT } from '@/lib/theme'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'
import Reanimated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const AnimatedView = Reanimated.View

type ProblemRowData = {
  id: string
  title: string
  difficulty: string
}

type ProblemSolvedRow = {
  problem_id: string
  created_at: string
}

type SubmissionRow = {
  id: string
  problem_id: string
  status: string
  language: string
  created_at: string
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [problems, setProblems] = useState<ProblemRowData[]>([])
  const [solved, setSolved] = useState<ProblemSolvedRow[]>([])
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      if (!user) {
        return
      }

      setLoading(true)
      const [problemResult, solvedResult, submissionResult] = await Promise.all([
        supabase.from('problems').select('id, title, difficulty'),
        supabase
          .from('problem_solved')
          .select('problem_id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('submissions')
          .select('id, problem_id, status, language, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      if (!active) {
        return
      }

      if (!problemResult.error && problemResult.data) {
        setProblems(problemResult.data as ProblemRowData[])
      }
      if (!solvedResult.error && solvedResult.data) {
        setSolved(solvedResult.data as ProblemSolvedRow[])
      }
      if (!submissionResult.error && submissionResult.data) {
        setSubmissions(submissionResult.data as SubmissionRow[])
      }

      setLoading(false)
    }

    void load()

    return () => {
      active = false
    }
  }, [user])

  const solvedIds = useMemo(
    () => new Set(solved.map((row) => row.problem_id)),
    [solved]
  )

  const totalSolved = solvedIds.size
  const totalSubmissions = submissions.length
  const streak = useMemo(() => calculateStreak(solved.map((row) => row.created_at)), [solved])

  const problemTotals = useMemo(() => {
    return ['EASY', 'MEDIUM', 'HARD'].map((difficulty) => {
      const total = problems.filter((problem) => problem.difficulty === difficulty).length
      const solvedCount = problems.filter(
        (problem) => problem.difficulty === difficulty && solvedIds.has(problem.id)
      ).length

      return {
        label: formatDifficulty(difficulty),
        solved: solvedCount,
        total,
        color: getDifficultyColor(difficulty),
      }
    })
  }, [problems, solvedIds])

  const recentSubmissions = useMemo(
    () =>
      submissions.slice(0, 10).map((submission) => ({
        ...submission,
        title: findProblemTitle(problems, submission.problem_id),
      })),
    [problems, submissions]
  )

  if (!user) {
    return null
  }

  async function handleSignOut() {
    if (signingOut) return

    setSigningOut(true)
    try {
      await signOut()
      router.replace('/(auth)/sign-in')
    } catch (error) {
      Alert.alert('Sign out failed', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setSigningOut(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.lime} />
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top, paddingBottom: insets.bottom + TAB_BAR_HEIGHT },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedView entering={FadeInDown.springify()} style={styles.header}>
          <Text style={styles.kicker}>Profile</Text>
          <ProfileHeader user={user} />
        </AnimatedView>

        <AnimatedView entering={FadeInDown.delay(80).springify()} style={styles.statsRow}>
          <StatCard
            value={`${totalSolved}`}
            label="Total solved"
            accentColor={colors.lime}
          />
          <StatCard
            value={`${totalSubmissions}`}
            label="Total submissions"
            accentColor={colors.peach}
          />
          <StatCard value={`${streak}`} label="Day streak" accentColor={colors.mint} />
        </AnimatedView>

        <AnimatedView entering={FadeInDown.delay(120).springify()} style={styles.section}>
          <SolvedProgress items={problemTotals} />
        </AnimatedView>

        <AnimatedView entering={FadeInDown.delay(160).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Recent submissions</Text>
          <View style={styles.list}>
            {recentSubmissions.length ? (
              recentSubmissions.map((submission, index) => (
                <AnimatedView
                  key={submission.id}
                  entering={FadeIn.delay(180 + index * 40)}
                >
                  <ActivityRow
                    title={submission.title}
                    status={submission.status}
                    language={submission.language}
                    createdAt={submission.created_at}
                  />
                </AnimatedView>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No submissions yet</Text>
                <Text style={styles.emptyCopy}>
                  Run a problem to start building your profile history.
                </Text>
              </View>
            )}
          </View>
        </AnimatedView>

        <Pressable
          onPress={handleSignOut}
          disabled={signingOut}
          style={({ pressed }) => [
            styles.signOutButton,
            pressed && styles.pressed,
            signingOut && styles.disabled,
          ]}
        >
          {signingOut ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.signOutText}>Sign out</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  )
}

function findProblemTitle(problems: ProblemRowData[], problemId: string) {
  return problems.find((problem) => problem.id === problemId)?.title ?? 'Unknown problem'
}

function calculateStreak(createdAtValues: string[]) {
  const uniqueDays = Array.from(
    new Set(
      createdAtValues.map((value) => {
        const date = new Date(value)
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
      })
    )
  ).sort((a, b) => b - a)

  if (!uniqueDays.length) {
    return 0
  }

  let streak = 1
  let cursor = uniqueDays[0]
  const dayMs = 24 * 60 * 60 * 1000

  for (let i = 1; i < uniqueDays.length; i += 1) {
    if (uniqueDays[i] === cursor - dayMs) {
      streak += 1
      cursor = uniqueDays[i]
    } else {
      break
    }
  }

  return streak
}

function formatDifficulty(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

function getDifficultyColor(value: string) {
  const normalized = value.toUpperCase()
  if (normalized === 'EASY') return colors.lime
  if (normalized === 'MEDIUM') return colors.peach
  return colors.danger
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
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
    paddingBottom: 24,
  },
  header: {
    gap: 14,
  },
  kicker: {
    color: colors.lime,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  section: {
    marginTop: 26,
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  list: {
    gap: 12,
  },
  emptyCard: {
    ...continuous(16),
    padding: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 6,
  },
  emptyTitle: {
    color: colors.foreground,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  emptyCopy: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  signOutButton: {
    marginTop: 26,
    minHeight: 52,
    ...continuous(16),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
  },
  signOutText: {
    color: colors.background,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.6,
  },
})
