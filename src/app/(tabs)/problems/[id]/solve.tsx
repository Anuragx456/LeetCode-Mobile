import { DifficultyBadge } from '@/app/components/DifficultyBadge'
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
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const AnimatedView = Reanimated.View

type Lang = 'JAVASCRIPT' | 'PYTHON' | 'JAVA'

const LANGUAGES: Lang[] = ['JAVASCRIPT', 'PYTHON', 'JAVA']

const LANGUAGE_LABELS: Record<Lang, string> = {
  JAVASCRIPT: 'JavaScript',
  PYTHON: 'Python',
  JAVA: 'Java',
}

const LANGUAGE_EXT: Record<Lang, string> = {
  JAVASCRIPT: 'js',
  PYTHON: 'py',
  JAVA: 'java',
}

type RunOutcome = 'accepted' | 'wrong-answer' | 'error'

type CaseResult = {
  index: number
  input: string
  expectedOutput: string
  actualOutput: string
  stderr: string
  status: { id: number; description: string }
  outcome: RunOutcome
  timeSec: number | null
  memoryKb: number | null
}

type SubmitResponse = {
  submissionId: string
  status: string
  solved: boolean
  passed: number
  total: number
  results: CaseResult[]
}

type ProblemMeta = {
  title: string
  difficulty: string
  code_snippets: Partial<Record<Lang, string>>
}

const EMPTY_CODE: Record<Lang, string> = {
  JAVASCRIPT: '',
  PYTHON: '',
  JAVA: '',
}

function statusLabel(outcome: RunOutcome) {
  if (outcome === 'accepted') return 'Accepted'
  if (outcome === 'wrong-answer') return 'Wrong Answer'
  return 'Error'
}

function outcomeStyle(outcome: RunOutcome) {
  if (outcome === 'accepted') {
    return {
      text: colors.success,
      bg: colors.successBg,
      border: colors.successBorder,
      icon: 'checkmark-circle' as const,
    }
  }
  if (outcome === 'wrong-answer') {
    return {
      text: colors.warning,
      bg: colors.warningBg,
      border: colors.warningBorder,
      icon: 'close-circle' as const,
    }
  }
  return {
    text: colors.danger,
    bg: colors.dangerBg,
    border: colors.dangerBorder,
    icon: 'alert-circle' as const,
  }
}

export default function SolveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [problem, setProblem] = useState<ProblemMeta | null>(null)

  const [language, setLanguage] = useState<Lang>('JAVASCRIPT')
  const [codeByLanguage, setCodeByLanguage] = useState<Record<Lang, string>>(
    EMPTY_CODE,
  )

  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  useEffect(() => {
    let active = true

    async function load() {
      if (!id || Array.isArray(id)) {
        return
      }

      setLoading(true)
      const { data, error: loadError } = await supabase
        .from('problems')
        .select('title, difficulty, code_snippets')
        .eq('id', id)
        .maybeSingle()

      if (!active) return

      if (loadError || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const meta = data as ProblemMeta
      setProblem(meta)

      const snippets = meta.code_snippets ?? {}
      setCodeByLanguage({
        JAVASCRIPT: snippets.JAVASCRIPT ?? '',
        PYTHON: snippets.PYTHON ?? '',
        JAVA: snippets.JAVA ?? '',
      })

      setLoading(false)
    }

    void load()

    return () => {
      active = false
    }
  }, [id])

  const starterCode = useMemo(() => {
    if (!problem) return EMPTY_CODE
    return {
      JAVASCRIPT: problem.code_snippets.JAVASCRIPT ?? '',
      PYTHON: problem.code_snippets.PYTHON ?? '',
      JAVA: problem.code_snippets.JAVA ?? '',
    }
  }, [problem])

  function switchLanguage(next: Lang) {
    if (next === language) return
    setLanguage(next)
    setResult(null)
    setError(null)
  }

  function resetCode() {
    setCodeByLanguage((prev) => ({
      ...prev,
      [language]: starterCode[language] ?? '',
    }))
  }

  async function handleSubmit() {
    if (!id || Array.isArray(id)) return

    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token

    if (!token) {
      setError('You must be signed in to submit.')
      return
    }

    setSubmitting(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          problemId: id,
          language: language.toLowerCase(),
          sourceCode: codeByLanguage[language] ?? '',
        }),
      })

      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.message ?? 'Submission failed. Please try again.')
      }

      setResult(json as SubmitResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  function toggleCase(index: number) {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={[styles.loadingScreen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <ActivityIndicator color={colors.lime} />
        </View>
      </View>
    )
  }

  if (notFound || !problem) {
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

  const code = codeByLanguage[language] ?? ''
  const overall = result
    ? outcomeStyle(
        result.results.every((r) => r.outcome === 'accepted')
          ? 'accepted'
          : result.results.some((r) => r.outcome === 'error')
            ? 'error'
            : 'wrong-answer',
      )
    : null

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top, paddingBottom: insets.bottom + 53 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AnimatedView entering={FadeInDown.springify()} style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backIcon, pressed && styles.pressed]}
          >
            <Ionicons name="chevron-back" size={18} color={colors.foreground} />
          </Pressable>
          <Text style={styles.label}>Solve</Text>
        </AnimatedView>

          <View style={styles.problemCard}>
            <DifficultyBadge difficulty={problem.difficulty} />
            <Text style={styles.problemTitle}>{problem.title}</Text>
          </View>

          <View style={styles.langRow}>
            {LANGUAGES.map((lang) => {
              const activeLang = lang === language
              return (
                <Pressable
                  key={lang}
                  onPress={() => switchLanguage(lang)}
                  style={({ pressed }) => [
                    styles.langChip,
                    activeLang && styles.langChipActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.langChipText,
                      activeLang && styles.langChipTextActive,
                    ]}
                  >
                    {LANGUAGE_LABELS[lang]}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <View style={styles.editorCard}>
            <View style={styles.editorHeader}>
              <Text style={styles.editorFile}>
                solution.{LANGUAGE_EXT[language]}
              </Text>
              <Pressable
                onPress={resetCode}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.resetButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="refresh" size={15} color={colors.muted} />
                <Text style={styles.resetText}>Reset</Text>
              </Pressable>
            </View>
            <TextInput
              style={styles.editor}
              value={code}
              onChangeText={(text) =>
                setCodeByLanguage((prev) => ({ ...prev, [language]: text }))
              }
              multiline
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              placeholder="Write your solution here…"
              placeholderTextColor={colors.mutedDark}
            />
          </View>

          {error ? (
            <View style={[styles.banner, styles.errorBanner]}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={[styles.bannerText, { color: colors.danger }]} selectable>
                  {error}
                </Text>
            </View>
          ) : null}

          {result && overall ? (
            <View style={styles.resultSection}>
              <View
                style={[
                  styles.banner,
                  {
                    backgroundColor: overall.bg,
                    borderColor: overall.border,
                  },
                ]}
              >
                <Ionicons name={overall.icon} size={18} color={overall.text} />
                <Text style={[styles.bannerText, { color: overall.text }]}>
                  {statusLabel(
                    result.results.every((r) => r.outcome === 'accepted')
                      ? 'accepted'
                      : result.results.some((r) => r.outcome === 'error')
                        ? 'error'
                        : 'wrong-answer',
                  )}
                </Text>
                <Text style={[styles.bannerMeta, { color: overall.text }]}>
                  {result.passed}/{result.total} passed
                </Text>
              </View>

              <View style={styles.caseList}>
                {result.results.map((item) => {
                  const cs = outcomeStyle(item.outcome)
                  const isOpen = Boolean(expanded[item.index])
                  return (
                    <View
                      key={item.index}
                      style={[styles.caseCard, { borderColor: cs.border }]}
                    >
                      <Pressable
                        onPress={() => toggleCase(item.index)}
                        style={styles.caseHeader}
                      >
                        <Ionicons name={cs.icon} size={16} color={cs.text} />
                        <Text style={[styles.caseTitle, { color: cs.text }]}>
                          Case {item.index + 1}
                        </Text>
                        <Text style={styles.caseStatus}>
                          {item.status.description}
                        </Text>
                        <Ionicons
                          name={isOpen ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={colors.muted}
                        />
                      </Pressable>

                      {isOpen ? (
                        <View style={styles.caseDetails}>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Input</Text>
                            <Text style={styles.detailValue} selectable>{item.input}</Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Expected</Text>
                            <Text style={styles.detailValue} selectable>
                              {item.expectedOutput}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={[styles.detailValue, { color: cs.text }]} selectable>
                              {item.actualOutput || '—'}
                            </Text>
                          </View>
                          {item.stderr ? (
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Stderr</Text>
                            <Text style={[styles.detailValue, { color: colors.danger }]} selectable>
                              {item.stderr}
                            </Text>
                            </View>
                          ) : null}
                          <View style={styles.detailMeta}>
                            <Text style={styles.detailMetaText}>
                              {item.timeSec != null
                                ? `${item.timeSec.toFixed(3)} s`
                                : '—'}
                            </Text>
                            <Text style={styles.detailMetaText}>
                              {item.memoryKb != null
                                ? `${item.memoryKb} KB`
                                : '—'}
                            </Text>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  )
                })}
              </View>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && !submitting && styles.pressed,
                submitting && styles.submitButtonDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Submit</Text>
                  <Ionicons
                    name="paper-plane"
                    size={18}
                    color={colors.background}
                  />
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
    </View>
  )
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
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  label: {
    color: colors.foreground,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  problemCard: {
    marginTop: 18,
    gap: 10,
  },
  problemTitle: {
    color: colors.foreground,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  langChip: {
    flex: 1,
    minHeight: 42,
    ...continuous(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  langChipActive: {
    backgroundColor: colors.limeSoft,
    borderColor: colors.limeBorder,
  },
  langChipText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  langChipTextActive: {
    color: colors.lime,
  },
  editorCard: {
    marginTop: 16,
    ...continuous(16),
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: colors.cardBorder,
  },
  editorFile: {
    color: colors.mint,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  resetText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  editor: {
    minHeight: 220,
    maxHeight: 420,
    padding: 14,
    color: colors.foreground,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
    fontFamily: 'monospace',
  },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    ...continuous(14),
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  bannerMeta: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  resultSection: {
    marginTop: 18,
  },
  caseList: {
    gap: 10,
    marginTop: 12,
  },
  caseCard: {
    ...continuous(14),
    backgroundColor: colors.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  caseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  caseTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  caseStatus: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    textAlign: 'right',
  },
  caseDetails: {
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 2,
  },
  detailRow: {
    gap: 3,
  },
  detailLabel: {
    color: colors.mutedDark,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    color: colors.foreground,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  detailMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  detailMetaText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
  actions: {
    marginTop: 28,
  },
  submitButton: {
    minHeight: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.lime,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
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
    borderRadius: 18,
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
    borderRadius: 14,
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





