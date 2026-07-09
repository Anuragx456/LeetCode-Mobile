import { FilterChips, type ProblemDifficultyFilter } from '@/app/components/FilterChips'
import { ProblemRow } from '@/app/components/ProblemRow'
import { useAuth } from '@/hooks/use-auth'
import { colors, continuous, TAB_BAR_HEIGHT } from '@/lib/theme'
import { supabase } from '@/lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import Reanimated, { FadeInRight, FadeInDown } from 'react-native-reanimated'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const AnimatedView = Reanimated.View

type ProblemRowData = {
  id: string
  title: string
  difficulty: string
  tags: string[]
  created_at: string
}

type SolvedRowData = {
  problem_id: string
}

export default function ProblemsScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [problems, setProblems] = useState<ProblemRowData[]>([])
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ProblemDifficultyFilter>('ALL')

  useEffect(() => {
    let active = true

    async function load() {
      if (!user) {
        return
      }

      setLoading(true)
      const [problemResult, solvedResult] = await Promise.all([
        supabase
          .from('problems')
          .select('id, title, difficulty, tags, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('problem_solved')
          .select('problem_id')
          .eq('user_id', user.id),
      ])

      if (!active) {
        return
      }

      if (!problemResult.error && problemResult.data) {
        setProblems(problemResult.data as ProblemRowData[])
      }

      if (!solvedResult.error && solvedResult.data) {
        setSolvedIds(new Set((solvedResult.data as SolvedRowData[]).map((row) => row.problem_id)))
      }

      setLoading(false)
    }

    void load()

    return () => {
      active = false
    }
  }, [user])

  const filteredProblems = useMemo(() => {
    const query = search.trim().toLowerCase()
    return problems.filter((problem) => {
      const matchesDifficulty =
        filter === 'ALL' ? true : problem.difficulty === filter
      const matchesSearch = query
        ? problem.title.toLowerCase().includes(query)
        : true

      return matchesDifficulty && matchesSearch
    })
  }, [filter, problems, search])

  if (!user) {
    return null
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={filteredProblems}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top, paddingBottom: insets.bottom + TAB_BAR_HEIGHT },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <AnimatedView entering={FadeInDown.springify()} style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.title}>Problems</Text>
                <Text style={styles.count}>
                  {filteredProblems.length} problem
                  {filteredProblems.length === 1 ? '' : 's'}
                </Text>
              </View>
              <View style={styles.iconBubble}>
                <Ionicons name="search" size={18} color={colors.lime} />
              </View>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color={colors.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by title"
                placeholderTextColor={colors.mutedDark}
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
            </View>

            <FilterChips value={filter} onChange={setFilter} />
          </AnimatedView>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={colors.lime} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="code-slash" size={20} color={colors.muted} />
              </View>
              <Text style={styles.emptyTitle}>No problems match this filter</Text>
              <Text style={styles.emptyCopy}>
                Clear the search or switch difficulty to browse the full set.
              </Text>
            </View>
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item, index }) => (
          <AnimatedView entering={FadeInRight.delay(Math.min(index, 10) * 40)}>
            <ProblemRow
              index={index + 1}
              title={item.title}
              difficulty={item.difficulty}
              tags={item.tags}
              solved={solvedIds.has(item.id)}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/problems/[id]',
                  params: { id: item.id },
                })
              }
            />
          </AnimatedView>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    gap: 14,
    marginBottom: 18,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    color: colors.foreground,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
  },
  count: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  iconBubble: {
    width: 40,
    height: 40,
    ...continuous(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    ...continuous(16),
    paddingHorizontal: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  searchInput: {
    flex: 1,
    color: colors.foreground,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    paddingVertical: 0,
  },
  separator: {
    height: 12,
  },
  loadingState: {
    paddingVertical: 28,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    ...continuous(16),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyTitle: {
    color: colors.foreground,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyCopy: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
})
