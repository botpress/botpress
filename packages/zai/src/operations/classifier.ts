import type { ClassifyModels } from '@botpress/cognitive'
import pLimit from 'p-limit'
import type { ZaiContext } from '../context'

/** Model (or chain of models) of the Cognitive classification API (Jev and other calibrated classifiers) */
export type ClassifierOption = ClassifyModels | ClassifyModels[]

/**
 * How operations that can use the classification API trade speed for accuracy:
 * - `speed` (default): the classifier answers alone
 * - `moderate`: the classifier answers when it is confident, the LLM decides the rest
 * - `accuracy`: the LLM answers everything
 */
export type Priority = 'speed' | 'moderate' | 'accuracy'
export const DEFAULT_PRIORITY: Priority = 'speed'

/**
 * No model by default: the backend picks its own chain (Jev, then OpenAI Decisions, then logprobs scoring, then
 * generation), so new or better classifiers are used without a zai release. Only scored answers can be
 * confident: an unscored one (the generation fallback) goes to zai's own LLM prompt unless `priority` is `speed`.
 */
export const DEFAULT_CLASSIFIER: ClassifierOption | undefined = undefined

/** Server limits of /v2/cognitive/classify (a request past them is a 400) */
export const CLASSIFIER_MAX_INPUT_CHARS = 100_000
export const CLASSIFIER_MAX_INSTRUCTIONS_CHARS = 100_000

/**
 * The classifier only answers when it is confident: a probability of "yes" at or above CONFIDENT_YES or at or
 * below CONFIDENT_NO. In between, the question goes to the LLM. On the label/check benchmark this sent ~10% of
 * simple questions (~30% of questions needing arithmetic or logic) to the LLM, and 1 of ~200 confident
 * answers was wrong.
 */
export const CONFIDENT_YES = 0.95
export const CONFIDENT_NO = 0.05

/** With `priority: 'speed'`, the probability of "yes" at or above which the answer is yes (best on the benchmark) */
export const YES_THRESHOLD = 0.6

/** The classifier's answer for a probability of "yes", or null when the LLM should decide */
export const decide = (pYes: number, priority: Priority, scored = true): boolean | null => {
  if (priority === 'speed') {
    return pYes >= YES_THRESHOLD
  }
  if (!scored) {
    // An unscored answer has no confidence to trust
    return null
  }
  return pYes >= CONFIDENT_YES ? true : pYes <= CONFIDENT_NO ? false : null
}
/** What one classification call cost */
export type ClassifierUsage = {
  model: string
  cost: number
  latency: number
  tokens: { input: number; output: number }
}

export type ChoiceAnswer = ClassifierUsage & {
  /** Index of the chosen label, or null when the classifier is not confident enough and the LLM should decide */
  index: number | null
  /** Index of the most likely label, whatever the confidence */
  argmax: number
  /** Probability of the most likely label */
  top: number
  /** Probability-weighted average label index (a continuous position between 0 and labels.length - 1) */
  expected: number
  /** Probability of each label (same order as the labels), empty when the answer is unscored */
  probabilities: number[]
}

export type YesNoAnswer = ClassifierUsage & {
  /** Probability that the answer is yes, between 0 and 1 */
  pYes: number
  /** The answer, or null when the classifier is not confident enough for the priority and the LLM should decide */
  value: boolean | null
}

/** Whether the classifier can take this input; otherwise the caller uses the LLM */
export const fitsClassifier = (input: string, question: string, instructions = ''): boolean =>
  input.trim().length > 0 &&
  input.length <= CLASSIFIER_MAX_INPUT_CHARS &&
  question.length + instructions.length + 200 <= CLASSIFIER_MAX_INSTRUCTIONS_CHARS

export const percent = (p: number) => `${Math.round(p * 100)}%`

/** Server limits on label descriptions and label count */
const MAX_LABEL_DESCRIPTION_CHARS = 500
export const CLASSIFIER_MAX_LABELS = 50

/**
 * Picks one of several labels for the input (a yes/no answer, a rating level, a category...).
 * With `priority: 'moderate'` the answer is kept only when it is scored and the top label's probability is at
 * least CONFIDENT_YES.
 * Returns null when the classifier is unavailable or failed, so the caller can fall back to the LLM.
 * An abort is rethrown.
 */
export const classifyChoice = async (
  ctx: ZaiContext,
  props: {
    input: string
    instructions: string
    labels: Array<{ name: string; description?: string }>
    model?: ClassifierOption
    priority: Priority
  }
): Promise<ChoiceAnswer | null> => {
  // Over the server limits: the LLM decides rather than the classifier seeing a cut-off rule
  if (
    props.input.length > CLASSIFIER_MAX_INPUT_CHARS ||
    props.instructions.length > CLASSIFIER_MAX_INSTRUCTIONS_CHARS ||
    props.labels.length < 2 ||
    props.labels.length > CLASSIFIER_MAX_LABELS ||
    props.labels.some((l) => (l.description?.length ?? 0) > MAX_LABEL_DESCRIPTION_CHARS)
  ) {
    return null
  }

  try {
    const response = await ctx.classify({
      input: props.input,
      instructions: props.instructions,
      labels: props.labels.map((l) => ({ name: l.name, ...(l.description ? { description: l.description } : {}) })),
      ...(props.model ? { model: props.model } : {}),
    })

    if (response.error || !response.output?.label) {
      return null
    }

    const indexOf = (name: string) => props.labels.findIndex((l) => l.name.toLowerCase() === name.toLowerCase())
    const winner = indexOf(response.output.label)
    if (winner < 0) {
      return null
    }

    const scores = (response.output.scores ?? [])
      .map((s) => ({ index: indexOf(s.label), p: s.probability }))
      .filter((s) => s.index >= 0 && typeof s.p === 'number' && Number.isFinite(s.p))
    const mass = scores.reduce((acc, s) => acc + s.p, 0)
    const probabilities =
      mass > 0
        ? props.labels.map((_, i) => scores.filter((s) => s.index === i).reduce((acc, s) => acc + s.p, 0) / mass)
        : []
    // Unscored backends (the server's generation fallback) only give the winning label
    const top = mass > 0 ? Math.max(...probabilities) : 1

    return {
      // An unscored answer has no confidence to trust
      index: props.priority === 'speed' || (mass > 0 && top >= CONFIDENT_YES) ? winner : null,
      argmax: winner,
      top,
      expected: mass > 0 ? probabilities.reduce((acc, p, i) => acc + i * p, 0) : winner,
      probabilities,
      model: response.metadata?.model ?? 'classifier',
      cost: response.metadata?.cost ?? 0,
      latency: response.metadata?.latency ?? 0,
      tokens: {
        input: response.metadata?.usage?.inputTokens ?? 0,
        output: response.metadata?.usage?.outputTokens ?? 0,
      },
    }
  } catch {
    ctx.controller.signal.throwIfAborted()
    // Classifier unavailable (not deployed, outage, limits)
    return null
  }
}

/** Asks the classifier a yes/no question about the input (see classifyChoice) */
export const classifyYesNo = async (
  ctx: ZaiContext,
  props: { input: string; question: string; instructions?: string; model?: ClassifierOption; priority: Priority }
): Promise<YesNoAnswer | null> => {
  const answer = await classifyChoice(ctx, {
    input: props.input,
    instructions: [
      `Question: ${props.question}`,
      props.instructions?.trim() ? `Additional instructions: ${props.instructions.trim()}` : '',
      'Answer strictly based on what the text says. When the text does not clearly support yes, answer no.',
    ]
      .filter(Boolean)
      .join('\n'),
    labels: [
      { name: 'yes', description: 'The text clearly supports answering yes' },
      { name: 'no', description: 'The text does not support answering yes' },
    ],
    model: props.model,
    priority: props.priority,
  })
  if (!answer) {
    return null
  }
  const scored = answer.probabilities.length > 0
  const pYes = scored ? answer.probabilities[0]! : answer.argmax === 0 ? 1 : 0
  const { model, cost, latency, tokens } = answer
  return { pYes, value: decide(pYes, props.priority, scored), model, cost, latency, tokens }
}

/** Total usage of classification calls (identical answers, e.g. deduplicated items, are counted once) */
export const sumUsage = (answers: Array<ClassifierUsage | null | undefined>) => {
  const usage = { model: '', cost: 0, latency: 0, tokens: { input: 0, output: 0 } }
  for (const answer of new Set(answers)) {
    if (answer) {
      usage.model ||= answer.model
      usage.cost += answer.cost
      usage.latency = Math.max(usage.latency, answer.latency)
      usage.tokens.input += answer.tokens.input
      usage.tokens.output += answer.tokens.output
    }
  }
  return usage
}

/** Classification calls in flight per operation */
export const CLASSIFIER_CONCURRENCY = 16

/**
 * Runs `fn` once per distinct key (identical items are classified once), at most CLASSIFIER_CONCURRENCY at a
 * time, and returns the results in the order of `keys`.
 */
export const mapUnique = async <R>(keys: string[], fn: (key: string) => Promise<R>): Promise<R[]> => {
  const limit = pLimit(CLASSIFIER_CONCURRENCY)
  const byKey = new Map<string, Promise<R>>()
  for (const key of keys) {
    if (!byKey.has(key)) {
      byKey.set(
        key,
        limit(() => fn(key))
      )
    }
  }
  return Promise.all(keys.map((key) => byKey.get(key)!))
}

/**
 * Classifies every (item, criterion) pair with one label set per criterion (e.g. rating levels).
 * Returns, per item, the score of each criterion, or null when the item must go to the LLM (an item is all or
 * nothing: if one criterion is unavailable or not confident, the LLM scores the whole item).
 */
export const classifyPerCriterion = async (
  ctx: ZaiContext,
  props: {
    texts: string[]
    criteria: string[]
    request: (criterion: string) => { instructions: string; labels: Array<{ name: string; description?: string }> }
    score: (answer: ChoiceAnswer) => number
  }
) => {
  const pairs = props.texts.flatMap((text, i) =>
    fitsClassifier(text, '') ? props.criteria.map((criterion) => ({ i, criterion, text })) : []
  )
  const answers = await mapUnique(
    pairs.map((p) => JSON.stringify([p.criterion, p.text])),
    (key) => {
      const [criterion, text] = JSON.parse(key) as [string, string]
      return classifyChoice(ctx, {
        input: text,
        ...props.request(criterion),
        model: ctx.classifier,
        priority: ctx.priority,
      })
    }
  )

  const records: Array<Record<string, number> | null> = props.texts.map(() => null)
  const rejected = new Set<number>()
  pairs.forEach(({ i, criterion }, n) => {
    const answer = answers[n]
    if (!answer || answer.index === null) {
      rejected.add(i)
      return
    }
    const record = (records[i] ??= {})
    record[criterion] = props.score(answer)
  })
  for (const i of rejected) {
    records[i] = null
  }
  return { records, usage: sumUsage(answers) }
}

/**
 * Whether approved learned examples exist for this input. The classifier cannot learn from them, so the LLM
 * decides when they do. The lookup is shared with the LLM path's own lookup of the same input (ctx.getExamples).
 */
export const hasLearnedExamples = async (ctx: ZaiContext, taskType: string, input: unknown): Promise<boolean> =>
  !!ctx.taskId &&
  !!ctx.adapter &&
  (
    await ctx.getExamples<string, unknown>({
      input: JSON.stringify(input).slice(0, 1000),
      taskType,
      taskId: ctx.taskId,
    })
  ).length > 0
