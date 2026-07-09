import { ActivityRow } from '@/app/components/ActivityRow'
import { DifficultyBadge } from '@/app/components/DifficultyBadge'
import { StatCard } from '@/app/components/StatCard'
import { useAuth } from '@/hooks/use-auth'
import { colors, continuous, TAB_BAR_HEIGHT } from '@/lib/theme'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import Reanimated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { useEffect, useMemo, useState } from 'react'
import { Image } from 'expo-image'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'

const AnimatedView = Reanimated.View

type ProblemRow = {
  id: string
  title: string
  difficulty: string
  tags: string[]
  created_at: string
}

type ProblemSolvedRow = {
  id: string
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

export default function HomeScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [problems, setProblems] = useState<ProblemRow[]>([])
  const [solved, setSolved] = useState<ProblemSolvedRow[]>([])
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])

  useEffect(() => {
    let active = true

    async function load() {
      if (!user) {
        return
      }

      setLoading(true)
      const [problemResult, solvedResult, submissionResult] = await Promise.all([
        supabase
          .from('problems')
          .select('id, title, difficulty, tags, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('problem_solved')
          .select('id, problem_id, created_at')
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
        setProblems(problemResult.data as ProblemRow[])
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

  const solvedCount = solvedIds.size
  const totalProblems = problems.length
  const acceptedCount = submissions.filter(
    (submission) => submission.status.trim().toLowerCase() === 'accepted'
  ).length
  const acceptanceRate = submissions.length
    ? Math.round((acceptedCount / submissions.length) * 100)
    : 0

  const difficultyStats = useMemo(() => {
    return ['EASY', 'MEDIUM', 'HARD'].map((difficulty) => {
      const total = problems.filter((problem) => problem.difficulty === difficulty).length
      const solvedForDifficulty = problems.filter(
        (problem) => problem.difficulty === difficulty && solvedIds.has(problem.id)
      ).length

      return {
        difficulty,
        total,
        solved: solvedForDifficulty,
      }
    })
  }, [problems, solvedIds])

  const streak = useMemo(() => calculateStreak(solved.map((row) => row.created_at)), [solved])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const recentActivities = useMemo(() => {
    const problemMap = new Map(problems.map((problem) => [problem.id, problem.title]))
    return submissions.slice(0, 5).map((submission) => ({
      ...submission,
      title: problemMap.get(submission.problem_id) ?? 'Unknown problem',
    }))
  }, [problems, submissions])

  function handleRandomProblem() {
    if (!problems.length) return
    const randomProblem = problems[Math.floor(Math.random() * problems.length)]
    router.push({
      pathname: '/(tabs)/problems/[id]',
      params: { id: randomProblem.id },
    })
  }

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
        <AnimatedView entering={FadeInDown.springify()} style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>MobLeet</Text>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              Track your solving rhythm, keep the streak alive, and pick up where you left off.
            </Text>
          </View>

          <View style={styles.avatar}>
            {user.user_metadata?.avatar_url ? (
              <Image
                source={{ uri: user.user_metadata.avatar_url }}
                style={styles.avatarImage}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <Text style={styles.avatarText}>
                {(user.email?.[0] ?? 'M').toUpperCase()}
              </Text>
            )}
          </View>
        </AnimatedView>

        <AnimatedView entering={FadeInDown.delay(80).springify()} style={styles.statsRow}>
          <StatCard
            value={`${solvedCount}/${totalProblems}`}
            label="Solved problems"
            accentColor={colors.lime}
          />
          <StatCard
            value={`${streak}`}
            label="Day streak"
            accentColor={colors.peach}
          />
          <StatCard
            value={`${acceptanceRate}%`}
            label="Acceptance rate"
            accentColor={colors.mint}
          />
        </AnimatedView>

        <AnimatedView entering={FadeInDown.delay(120).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => router.push('/(tabs)/problems')}
              style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.limeSoft }]}>
                <Ionicons name="play" size={18} color={colors.lime} />
              </View>
              <Text style={styles.actionTitle}>Continue practice</Text>
              <Text style={styles.actionCopy} numberOfLines={2}>
                Open the problem list and keep moving through the queue.
              </Text>
            </Pressable>

            <Pressable
              onPress={handleRandomProblem}
              disabled={!problems.length}
              style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.pressed,
                !problems.length && styles.disabled,
              ]}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.warningBg }]}>
                <Ionicons name="shuffle" size={18} color={colors.warning} />
              </View>
              <Text style={styles.actionTitle}>Random problem</Text>
              <Text style={styles.actionCopy} numberOfLines={2}>
                Jump to a fresh challenge with one tap.
              </Text>
            </Pressable>
          </View>
        </AnimatedView>

        <AnimatedView entering={FadeInDown.delay(160).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Difficulty breakdown</Text>
          <View style={styles.difficultyGrid}>
            {difficultyStats.map((item) => (
              <View key={item.difficulty} style={styles.difficultyCard}>
                <DifficultyBadge difficulty={item.difficulty} />
                <Text style={styles.difficultyCount}>
                  {item.solved}/{item.total}
                </Text>
                <Text style={styles.difficultyCopy}>
                  {item.total === 0 ? 'No problems yet' : `${Math.round((item.solved / item.total) * 100)}% solved`}
                </Text>
              </View>
            ))}
          </View>
        </AnimatedView>

        <AnimatedView entering={FadeInDown.delay(200).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          <View style={styles.list}>
            {recentActivities.length ? (
              recentActivities.map((submission, index) => (
                <AnimatedView
                  key={submission.id}
                  entering={FadeIn.delay(220 + index * 40)}
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
                  Your recent runs will appear here once you start solving.
                </Text>
              </View>
            )}
          </View>
        </AnimatedView>
      </ScrollView>
    </View>
  )
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  kicker: {
    color: colors.lime,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  greeting: {
    color: colors.foreground,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  avatar: {
    width: 52,
    height: 52,
    ...continuous(18),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: colors.foreground,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  section: {
    marginTop: 26,
    gap: 12,
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minHeight: 140,
    ...continuous(16),
    padding: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 10,
  },
  actionIcon: {
    width: 38,
    height: 38,
    ...continuous(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    color: colors.foreground,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  actionCopy: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.56,
  },
  difficultyGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  difficultyCard: {
    flex: 1,
    ...continuous(16),
    padding: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 10,
  },
  difficultyCount: {
    color: colors.foreground,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  difficultyCopy: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
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
})
