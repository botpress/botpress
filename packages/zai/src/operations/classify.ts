// eslint-disable consistent-type-definitions
import { z } from '@bpinternal/zui'

import pLimit from 'p-limit'
import { ZaiContext } from '../context'
import { Response } from '../response'
import { getTokenizer } from '../tokenizer'
import { abortSiblingsOnFailure, fastHash, stringify, takeUntilTokens } from '../utils'
import { Zai } from '../zai'
import { classifyChoice, fitsClassifier, mapUnique, sumUsage } from './classifier'
import { PROMPT_INPUT_BUFFER, PROMPT_OUTPUT_BUFFER } from './constants'

/** Label names, or label names mapped to a description of what belongs in each */
export type ClassifyLabels<L extends string> = readonly L[] | Record<L, string>

export type Classification<L extends string> = {
  /** The chosen label (always one of the labels) */
  label: L
  /** Probability of the chosen label, or null when the LLM decided (it gives no calibrated probability) */
  confidence: number | null
  /** Probability of each label when the classifier decided; empty when the LLM decided */
  scores: Partial<Record<L, number>>
  /** What decided: the Cognitive classification API or the LLM */
  source: 'classifier' | 'llm'
}

export type Options<L extends string = string> = {
  /** What the classification is deciding, or how to decide */
  instructions?: string
  /** Examples of inputs and their label. With examples, the LLM decides (the classifier cannot learn from them). */
  examples?: Array<{ input: unknown; label: L; explanation?: string }>
  /** The maximum number of tokens per item shown to the LLM (default 1000) */
  tokensPerItem?: number
}

const _Options = z.object({
  instructions: z.string().optional(),
  examples: z.array(z.object({ input: z.any(), label: z.string(), explanation: z.string().optional() })).default([]),
  tokensPerItem: z.number().min(1).optional().default(1000),
})

/** Server limits of the classification API */
const CLASSIFIER_MAX_LABELS = 50
const MAX_ITEMS_PER_CHUNK = 50
const END = '■END■'

declare module '@botpress/zai' {
  interface Zai {
    /**
     * Classifies an input (or each item of an array) into exactly one of the given labels.
     *
     * Unlike `label()`, which answers yes/no for every label independently, `classify()` always picks one label.
     * Arrays are classified item by item (identical items once); to classify a whole array as a single input,
     * wrap it: `zai.classify([myArray], labels)`.
     *
     * Uses the Cognitive classification API (Jev) according to the Zai `priority`: `speed` (default) takes the
     * classifier's most likely label, `moderate` keeps it when its probability is >= 0.95 and asks the LLM otherwise,
     * `accuracy` only uses the LLM. The LLM also decides when examples are given, with more than 50 labels, for
     * inputs over 100k characters, and when the classifier is unavailable. LLM calls are batched (up to 50 items
     * per prompt).
     *
     * @param input - The value to classify, or an array of values to classify one by one
     * @param labels - Label names, or an object mapping each label name to a description
     * @param options - Instructions, examples, and token limit per item
     * @returns Response with a Classification (or an array of them), simplified to the label (or array of labels)
     *
     * @example Single input
     * ```typescript
     * const intent = await zai.classify('I was charged twice', ['billing', 'technical', 'sales', 'other'])
     * // 'billing'
     * ```
     *
     * @example Batch with descriptions and full results
     * ```typescript
     * const { output } = await zai
     *   .classify(tickets, {
     *     bug: 'Something is broken or not working as documented',
     *     feature_request: 'Asks for new functionality',
     *     question: 'Asks how to do something',
     *   })
     *   .result()
     * // output[0]: { label: 'bug', confidence: 0.98, scores: { bug: 0.98, ... }, source: 'classifier' }
     * ```
     */
    classify<const L extends string>(
      input: readonly unknown[],
      labels: ClassifyLabels<L>,
      options?: Options<L>
    ): Response<Array<Classification<L>>, L[]>
    classify<const L extends string>(
      input: unknown,
      labels: ClassifyLabels<L>,
      options?: Options<L>
    ): Response<Classification<L>, L>
  }
}

type LabelDef = { name: string; description?: string }

const normalizeLabels = (labels: unknown): LabelDef[] => {
  const defs: LabelDef[] = Array.isArray(labels)
    ? labels.map((name) => ({ name }))
    : labels && typeof labels === 'object'
      ? Object.entries(labels as Record<string, unknown>).map(([name, description]) => ({
          name,
          description: typeof description === 'string' && description.trim() ? description.trim() : undefined,
        }))
      : []

  for (const def of defs) {
    if (typeof def.name !== 'string' || !def.name.trim()) {
      throw new Error('Labels must be non-empty strings')
    }
  }
  if (defs.length < 2) {
    throw new Error('At least 2 labels are required to classify')
  }
  const seen = new Map<string, string>()
  for (const def of defs) {
    const other = seen.get(def.name.trim().toLowerCase())
    if (other !== undefined) {
      throw new Error(`Labels "${other}" and "${def.name}" are the same (case-insensitive); use distinct names`)
    }
    seen.set(def.name.trim().toLowerCase(), def.name)
  }
  return defs
}

const looseLabel = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')

/** Finds the label the model wrote (exact, then case/punctuation-insensitive), or undefined */
const matchLabelName = (written: string, labels: LabelDef[]): string | undefined => {
  const cleaned = written
    .trim()
    .replace(/^[*_`"'[(]+|[*_`"'\])]+$/g, '')
    .trim()
  const exact =
    labels.find((l) => l.name === cleaned) ?? labels.find((l) => l.name.toLowerCase() === cleaned.toLowerCase())
  if (exact) {
    return exact.name
  }
  const loose = looseLabel(cleaned)
  return loose ? labels.find((l) => looseLabel(l.name) === loose)?.name : undefined
}

/**
 * Parses `■0:label■1:label` (one entry per item). Tolerates whitespace, newlines, quotes and markdown around the
 * label. Throws (so the context retries with feedback) when an item is missing or a label is unknown.
 */
export const parseClassifications = (text: string, count: number, labels: LabelDef[]): string[] => {
  const results: Array<string | undefined> = new Array(count).fill(undefined)
  const problems: string[] = []
  const regex = /■\s*(\d+)\s*[:=]([^■\n]*)/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const idx = parseInt(match[1]!, 10)
    if (idx < 0 || idx >= count) {
      problems.push(`unknown item index ■${idx}`)
      continue
    }
    const name = matchLabelName(match[2] ?? '', labels)
    if (!name) {
      problems.push(`■${idx}: "${(match[2] ?? '').trim()}" is not one of the labels`)
      continue
    }
    results[idx] = name
  }

  const missing = results.map((r, i) => (r === undefined ? i : -1)).filter((i) => i >= 0)
  if (missing.length || problems.length) {
    throw new Error(
      [
        missing.length ? `Missing or invalid label for item(s) ${missing.map((i) => `■${i}`).join(', ')}.` : '',
        ...[...new Set(problems)].slice(0, 10),
        `Answer every item from ■0 to ■${count - 1} with exactly one of these labels: ${labels.map((l) => l.name).join(', ')}.`,
        `Format: ■0:label■1:label (one item per entry), then ${END}`,
      ]
        .filter(Boolean)
        .join('\n')
    )
  }

  return results as string[]
}

const isClassificationArray = (value: unknown, count: number): value is Array<Classification<string>> =>
  Array.isArray(value) &&
  value.length === count &&
  value.every((x) => !!x && typeof x === 'object' && typeof (x as Classification<string>).label === 'string')

const classify = async (
  input: unknown,
  isBatch: boolean,
  _labels: unknown,
  _options: Options | undefined,
  ctx: ZaiContext
): Promise<Classification<string> | Array<Classification<string>>> => {
  ctx.controller.signal.throwIfAborted()
  const options = _Options.parse(_options ?? {}) as Required<Pick<Options, 'examples' | 'tokensPerItem'>> & Options
  const labels = normalizeLabels(_labels)
  const items: unknown[] = isBatch ? [...(input as unknown[])] : [input]

  if (!items.length) {
    return []
  }

  for (const example of options.examples) {
    if (!labels.some((l) => l.name === example.label)) {
      throw new Error(`Example label "${example.label}" is not one of the labels`)
    }
  }

  const tokenizer = await getTokenizer()
  const model = await ctx.getModel()
  const taskId = ctx.taskId
  const taskType = 'zai.classify'

  const TOKENS_TOTAL_MAX = Math.max(model.input.maxTokens - PROMPT_INPUT_BUFFER - PROMPT_OUTPUT_BUFFER, 1000)
  const TOKENS_EXAMPLES_MAX = Math.floor(TOKENS_TOTAL_MAX * 0.3)
  const TOKENS_ITEMS_MAX = Math.floor(TOKENS_TOTAL_MAX * 0.5)
  const tokensPerItem = Math.min(options.tokensPerItem, TOKENS_ITEMS_MAX)

  const rawTexts = items.map((item) => stringify(item, false))
  const instructionsKey = options.instructions ?? ''
  const Key = fastHash(JSON.stringify({ taskType, taskId, input: rawTexts, labels, instructions: instructionsKey }))

  const learned =
    taskId && ctx.adapter
      ? await ctx.getExamples<string, unknown>({ input: rawTexts.join('\n').slice(0, 1000), taskType, taskId })
      : []

  const exactMatch = learned.find((x) => x.key === Key)
  if (exactMatch && isClassificationArray(exactMatch.output, items.length)) {
    return isBatch ? exactMatch.output : exactMatch.output[0]!
  }

  const results: Array<Classification<string> | null> = items.map(() => null)
  let usage = sumUsage([])

  // Classification API: one call per distinct item. The classifier cannot learn from examples.
  const learnedExamples = learned.flatMap((x) => {
    if (!isClassificationArray(x.output, (x.output as unknown[] | undefined)?.length ?? -1)) {
      return []
    }
    let inputs: unknown
    try {
      inputs = JSON.parse(x.input)
    } catch {
      return []
    }
    return Array.isArray(inputs) && inputs.length === x.output.length
      ? inputs.map((item, i) => ({ input: item, label: x.output[i]!.label, explanation: x.explanation }))
      : []
  })
  const examples = [...learnedExamples, ...options.examples].filter((e) => labels.some((l) => l.name === e.label))

  if (ctx.usesClassifier && !examples.length && labels.length <= CLASSIFIER_MAX_LABELS) {
    const instructions = `Classify the text into exactly one of the labels.${options.instructions ? `\n${options.instructions}` : ''}`
    const candidates = rawTexts.flatMap((text, i) => (fitsClassifier(text, instructions) ? [i] : []))
    const answers = await mapUnique(
      candidates.map((i) => rawTexts[i]!),
      (text) =>
        classifyChoice(ctx, { input: text, instructions, labels, model: ctx.classifier, priority: ctx.priority })
    )
    candidates.forEach((i, n) => {
      const answer = answers[n]
      if (!answer || answer.index === null) {
        return
      }
      const scores: Record<string, number> = {}
      answer.probabilities.forEach((p, idx) => {
        scores[labels[idx]!.name] = p
      })
      results[i] = {
        label: labels[answer.index]!.name,
        confidence: answer.probabilities.length ? answer.top : null,
        scores,
        source: 'classifier',
      }
    })
    usage = sumUsage(answers)
  }

  // LLM: the remaining items, batched
  const pending = results.flatMap((r, i) => (r ? [] : [i]))
  if (pending.length) {
    const texts = new Map(pending.map((i) => [i, tokenizer.truncate(rawTexts[i]!, tokensPerItem)]))
    const chunks: number[][] = []
    let current: number[] = []
    let currentTokens = 0
    for (const i of pending) {
      const tokens = tokenizer.count(texts.get(i)!)
      if (current.length && (current.length >= MAX_ITEMS_PER_CHUNK || currentTokens + tokens > TOKENS_ITEMS_MAX)) {
        chunks.push(current)
        current = []
        currentTokens = 0
      }
      current.push(i)
      currentTokens += tokens
    }
    if (current.length) {
      chunks.push(current)
    }

    const labelList = labels.map((l) => `- ${l.name}${l.description ? `: ${l.description}` : ''}`).join('\n')
    const formatItems = (entries: string[]) => entries.map((text, idx) => `■${idx} = ${text}`).join('\n')

    const shownExamples = takeUntilTokens(
      examples,
      TOKENS_EXAMPLES_MAX,
      (e) => tokenizer.count(stringify(e.input, false)) + tokenizer.count(e.explanation ?? '') + 20
    )
    const exampleMessages = shownExamples.length
      ? [
          {
            type: 'text' as const,
            role: 'user' as const,
            content: `Expert examples to classify:\n${formatItems(shownExamples.map((e) => tokenizer.truncate(stringify(e.input, false), tokensPerItem)))}`,
          },
          {
            type: 'text' as const,
            role: 'assistant' as const,
            content: `${shownExamples.map((e, idx) => `■${idx}:${e.label}`).join('')}\n${END}${
              shownExamples.some((e) => e.explanation)
                ? `\nReasons:\n${shownExamples.map((e, idx) => `■${idx}: ${e.explanation ?? '-'}`).join('\n')}`
                : ''
            }`,
          },
        ]
      : []

    const classifyChunk = async (chunk: number[]) => {
      ctx.controller.signal.throwIfAborted()
      const { extracted, meta } = await ctx.generateContent({
        systemPrompt: `You classify items. Each item gets exactly one of these labels:
${labelList}
${options.instructions ? `\nInstructions:\n${options.instructions}\n` : ''}${shownExamples.length ? '\nFollow the expert examples when they apply.\n' : ''}
Answer with one entry per item, from ■0 to ■${chunk.length - 1}, using the exact label names:
■0:label■1:label■2:label
then ${END}`,
        stopSequences: [END],
        messages: [
          ...exampleMessages,
          {
            type: 'text',
            role: 'user',
            content: `Items to classify (■0 to ■${chunk.length - 1}):\n${formatItems(chunk.map((i) => texts.get(i)!))}`,
          },
        ],
        transform: (text) => parseClassifications(text ?? '', chunk.length, labels),
      })
      chunk.forEach((i, k) => {
        results[i] = { label: extracted[k]!, confidence: null, scores: {}, source: 'llm' }
      })
      usage.cost += meta.cost.input + meta.cost.output
      usage.latency = Math.max(usage.latency, meta.latency)
      usage.tokens.input += meta.tokens.input
      usage.tokens.output += meta.tokens.output
    }

    const limit = pLimit(10)
    await Promise.all(chunks.map((chunk) => limit(() => classifyChunk(chunk)).catch(abortSiblingsOnFailure(ctx))))
  }

  const final = results as Array<Classification<string>>

  if (taskId && ctx.adapter && !ctx.controller.signal.aborted) {
    await ctx.adapter.saveExample({
      key: Key,
      taskType,
      taskId,
      instructions: instructionsKey,
      input: JSON.stringify(items),
      output: final,
      metadata: {
        cost: { input: usage.cost, output: 0 },
        latency: usage.latency,
        model: ctx.modelName,
        tokens: usage.tokens,
      },
    })
  }

  return isBatch ? final : final[0]!
}

Zai.prototype.classify = function (this: Zai, input: unknown, labels: ClassifyLabels<string>, options?: Options): any {
  const context = this._context('zai.classify')

  const isBatch = Array.isArray(input)
  return new Response<Classification<string> | Array<Classification<string>>, string | string[]>(
    context,
    classify(input, isBatch, labels, options, context),
    (result) => (Array.isArray(result) ? result.map((r) => r.label) : result.label)
  )
}
