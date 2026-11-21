// eslint-disable consistent-type-definitions
import { z } from '@bpinternal/zui'

import { chunk, clamp } from 'lodash-es'
import pLimit from 'p-limit'
import { ZaiContext } from '../context'
import { Response } from '../response'
import { getTokenizer } from '../tokenizer'
import { fastHash, stringify, takeUntilTokens } from '../utils'
import { Zai } from '../zai'
import { classifyYesNo, CONFIDENT_NO, CONFIDENT_YES, fitsClassifier, mapUnique, percent, sumUsage } from './classifier'
import { PROMPT_INPUT_BUFFER } from './constants'

type Label = keyof typeof LABELS
const LABELS = {
  ABSOLUTELY_NOT: 'ABSOLUTELY_NOT',
  PROBABLY_NOT: 'PROBABLY_NOT',
  AMBIGUOUS: 'AMBIGUOUS',
  PROBABLY_YES: 'PROBABLY_YES',
  ABSOLUTELY_YES: 'ABSOLUTELY_YES',
} as const

const ALL_LABELS = Object.values(LABELS).join(' | ')

type Example<T extends string> = {
  input: unknown
  labels: Partial<Record<T, { label: Label; explanation?: string }>>
}

export type Options<T extends string> = {
  /** Examples to help the user make a decision */
  examples?: Array<Example<T>>
  /** Instructions to guide the user on how to extract the data */
  instructions?: string
  /** The maximum number of tokens per chunk */
  chunkLength?: number
}

const _Options = z.object({
  examples: z
    .array(
      z.object({
        input: z.any(),
        labels: z.record(z.object({ label: z.enum(ALL_LABELS as never), explanation: z.string().optional() })),
      })
    )
    .default([])
    .describe('Examples to help the user make a decision'),
  instructions: z.string().optional().describe('Instructions to guide the user on how to extract the data'),
  chunkLength: z
    .number()
    .min(100)
    .optional()
    .describe("The maximum number of tokens per chunk (capped at what fits the model's input context)")
    .default(16_000),
})

type Labels<T extends string> = Record<T, string>

const _Labels = z.record(z.string().min(1).max(250), z.string()).superRefine((labels, ctx) => {
  const keys = Object.keys(labels)

  for (const key of keys) {
    if (key.length < 1 || key.length > 250) {
      ctx.addIssue({ message: `The label key "${key}" must be between 1 and 250 characters long`, code: 'custom' })
    }

    if (keys.lastIndexOf(key) !== keys.indexOf(key)) {
      ctx.addIssue({ message: `Duplicate label: ${labels[key]}`, code: 'custom' })
    }

    if (/[^a-zA-Z0-9_]/.test(key)) {
      ctx.addIssue({
        message: `The label key "${key}" must only contain alphanumeric characters and underscores`,
        code: 'custom',
      })
    }
  }

  return true
})

declare module '@botpress/zai' {
  interface Zai {
    /**
     * Tags input with multiple labels, each with explanation, value, and confidence level.
     *
     * This operation evaluates input against multiple categories simultaneously, providing
     * nuanced confidence levels (ABSOLUTELY_YES, PROBABLY_YES, AMBIGUOUS, PROBABLY_NOT, ABSOLUTELY_NOT).
     * Perfect for content classification, intent detection, and multi-criteria evaluation.
     *
     * @param input - The data to label (text, object, or any value)
     * @param labels - Object mapping label keys to their descriptions
     * @param options - Configuration for examples, instructions, and chunking
     * @returns Response with detailed results per label (explanation, value, confidence), simplified to booleans
     *
     * @example Content moderation
     * ```typescript
     * const comment = "This is a great article! Click here for cheap products!"
     *
     * const result = await zai.label(comment, {
     *   spam: 'Is this spam or promotional content?',
     *   helpful: 'Is this comment helpful and constructive?',
     *   profanity: 'Does this contain profanity or offensive language?'
     * }).result()
     *
     * // result.output:
     * // {
     * //   spam: { value: true, confidence: 0.5, explanation: 'Contains promotional link...' },
     * //   helpful: { value: true, confidence: 1, explanation: 'Positive feedback...' },
     * //   profanity: { value: false, confidence: 1, explanation: 'No offensive language' }
     * // }
     *
     * // Simplified (when awaited directly):
     * const simple = await zai.label(comment, { spam: 'Is this spam?' })
     * // simple: { spam: true }
     * ```
     *
     * @example Intent classification
     * ```typescript
     * const message = "I can't log in to my account"
     *
     * const intents = await zai.label(message, {
     *   technical_issue: 'Is this a technical problem?',
     *   urgent: 'Does this require immediate attention?',
     *   needs_human: 'Should this be escalated to a human agent?',
     *   billing_related: 'Is this about billing or payments?'
     * })
     * // Returns boolean for each intent
     * ```
     *
     * @example Sentiment analysis with nuance
     * ```typescript
     * const review = "The product is okay, but shipping was slow"
     *
     * const { output } = await zai.label(review, {
     *   positive: 'Is the overall sentiment positive?',
     *   negative: 'Is the overall sentiment negative?',
     *   mixed: 'Does this express mixed feelings?'
     * }).result()
     *
     * // Check confidence levels
     * if (output.mixed.confidence > 0.5) {
     *   console.log('Mixed sentiment detected:', output.mixed.explanation)
     * }
     * ```
     *
     * @example Product categorization
     * ```typescript
     * const product = {
     *   name: 'Wireless Headphones',
     *   description: 'Noise-canceling Bluetooth headphones for music lovers',
     *   price: 199
     * }
     *
     * const categories = await zai.label(product, {
     *   electronics: 'Is this an electronic device?',
     *   audio: 'Is this audio equipment?',
     *   premium: 'Is this a premium/luxury product?',
     *   portable: 'Is this portable/mobile?'
     * })
     * // Returns: { electronics: true, audio: true, premium: true, portable: true }
     * ```
     *
     * @example With examples for consistency
     * ```typescript
     * const result = await zai.label(email, {
     *   urgent: 'Requires immediate response',
     *   complaint: 'Customer is dissatisfied'
     * }, {
     *   examples: [
     *     {
     *       input: 'ASAP! System is down!',
     *       labels: {
     *         urgent: { label: 'ABSOLUTELY_YES', explanation: 'Critical issue' },
     *         complaint: { label: 'PROBABLY_YES', explanation: 'Implicit complaint' }
     *       }
     *     }
     *   ],
     *   instructions: 'Consider tone, urgency keywords, and context'
     * })
     * ```
     *
     * @example Understanding confidence levels
     * ```typescript
     * const { output } = await zai.label(text, labels).result()
     *
     * // Confidence values:
     * // ABSOLUTELY_YES: confidence = 1.0, value = true
     * // PROBABLY_YES: confidence = 0.5, value = true
     * // AMBIGUOUS: confidence = 0, value = false
     * // PROBABLY_NOT: confidence = 0.5, value = false
     * // ABSOLUTELY_NOT: confidence = 1.0, value = false
     *
     * Object.entries(output).forEach(([key, result]) => {
     *   if (result.value && result.confidence === 1) {
     *     console.log(`Definitely ${key}:`, result.explanation)
     *   } else if (result.value && result.confidence === 0.5) {
     *     console.log(`Probably ${key}:`, result.explanation)
     *   }
     * })
     * ```
     */
    label<T extends string>(
      input: unknown,
      labels: Labels<T>,
      options?: Options<T>
    ): Response<
      {
        [K in T]: {
          explanation: string
          value: boolean
          confidence: number
        }
      },
      { [K in T]: boolean }
    >
  }
}

const parseLabel = (label: string): Label | null => {
  label = label
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
  const isNo = label.includes('NOT') || label === 'NO' || label.endsWith('_NO')
  if (label.includes('ABSOLUTELY') && isNo) {
    return LABELS.ABSOLUTELY_NOT
  } else if (isNo) {
    return LABELS.PROBABLY_NOT
  } else if (label.includes('AMBIGUOUS')) {
    return LABELS.AMBIGUOUS
  } else if (label.includes('ABSOLUTELY') && label.includes('YES')) {
    return LABELS.ABSOLUTELY_YES
  } else if (label.includes('YES')) {
    return LABELS.PROBABLY_YES
  }
  return null
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const LABEL_WORDS = '(?:ABSOLUTELY|PROBABLY)[ _-]?(?:NOT|YES|NO)|AMBIGUOUS|YES|NO'

/** Finds `■key:【explanation】:LABEL■` for one key; tolerates multi-line explanations, spaces and a missing closing ■ */
const matchLabel = (text: string, key: string): { explanation: string; label: Label } | null => {
  const k = escapeRegExp(key)
  const strict = text.match(
    new RegExp(`■\\s*${k}\\s*:\\s*【([\\s\\S]*?)】\\s*:\\s*([A-Za-z_ -]+?)\\s*(?:■|\\n|$)`, 'i')
  )
  const loose = strict ?? text.match(new RegExp(`■\\s*${k}\\s*:([^■]*?)[:\\s]\\s*(${LABEL_WORDS})\\s*(?:■|\\n|$)`, 'i'))
  if (!loose) {
    return null
  }
  const label = parseLabel(loose[2]!)
  if (!label) {
    return null
  }
  const explanation = loose[1]!
    .trim()
    .replace(/^【|】$/g, '')
    .trim()
  return { explanation, label }
}

/** Absolutely when the classifier is confident, probably otherwise (only with `priority: 'speed'`) */
const confidentLabel = (value: boolean, pYes: number): Label => {
  const confident = pYes >= CONFIDENT_YES || pYes <= CONFIDENT_NO
  if (value) {
    return confident ? LABELS.ABSOLUTELY_YES : LABELS.PROBABLY_YES
  }
  return confident ? LABELS.ABSOLUTELY_NOT : LABELS.PROBABLY_NOT
}

const getConfidence = (label: Label) => {
  switch (label) {
    case LABELS.ABSOLUTELY_NOT:
    case LABELS.ABSOLUTELY_YES:
      return 1

    case LABELS.PROBABLY_NOT:
    case LABELS.PROBABLY_YES:
      return 0.5
    default:
      return 0
  }
}

const label = async <T extends string>(
  input: unknown,
  _labels: Labels<T>,
  _options: Options<T> | undefined,
  ctx: ZaiContext
): Promise<{
  [K in T]: {
    explanation: string
    value: boolean
    confidence: number
  }
}> => {
  ctx.controller.signal.throwIfAborted()
  const options = _Options.parse(_options ?? {}) as unknown as Options<T>
  const labels = _Labels.parse(_labels) as Labels<T>

  if (!Object.keys(labels).length) {
    return {} as { [K in T]: { explanation: string; value: boolean; confidence: number } }
  }

  const tokenizer = await getTokenizer()
  const model = await ctx.getModel()

  const taskId = ctx.taskId
  const taskType = 'zai.label'

  const TOTAL_MAX_TOKENS = clamp(options.chunkLength, 1000, model.input.maxTokens - PROMPT_INPUT_BUFFER)
  const CHUNK_EXAMPLES_MAX_TOKENS = clamp(Math.floor(TOTAL_MAX_TOKENS * 0.5), 250, 10_000)
  const CHUNK_INPUT_MAX_TOKENS = clamp(
    TOTAL_MAX_TOKENS - CHUNK_EXAMPLES_MAX_TOKENS,
    TOTAL_MAX_TOKENS * 0.5,
    TOTAL_MAX_TOKENS
  )

  const inputAsString = stringify(input)

  if (tokenizer.count(inputAsString) > CHUNK_INPUT_MAX_TOKENS) {
    const limit = pLimit(10) // Limit to 10 concurrent labeling operations
    const tokens = tokenizer.split(inputAsString)
    const chunks = chunk(tokens, CHUNK_INPUT_MAX_TOKENS).map((x) => x.join(''))
    const allLabels = await Promise.all(chunks.map((chunk) => limit(() => label(chunk, _labels, _options, ctx))))

    // Merge all the labels together (those who are true will remain true)
    return allLabels.reduce((acc, x) => {
      Object.keys(x).forEach((key) => {
        if (acc[key]?.value === true) {
          acc[key] = acc[key]
        } else if (x[key]?.value === true) {
          acc[key] = x[key]
        } else {
          acc[key] = acc[key] || x[key]
        }
      })
      return acc
    }, {}) as {
      [K in T]: {
        explanation: string
        value: boolean
        confidence: number
      }
    }
  }

  const END = '■END■'

  const Key = fastHash(
    JSON.stringify({
      taskType,
      taskId,
      input: inputAsString,
      instructions: options.instructions ?? '',
      labels,
    })
  )

  const convertToAnswer = (mapping: { [K in T]: { explanation: string; label: Label } }) => {
    return Object.keys(labels).reduce((acc, key) => {
      acc[key] = {
        explanation: mapping[key]?.explanation ?? '',
        value: mapping[key]?.label === LABELS.ABSOLUTELY_YES || mapping[key]?.label === LABELS.PROBABLY_YES,
        confidence: getConfidence(mapping[key]?.label),
      }
      return acc
    }, {}) as {
      [K in T]: {
        explanation: string
        value: boolean
        confidence: number
      }
    }
  }

  const examples =
    taskId && ctx.adapter
      ? await ctx.adapter.getExamples<
          string,
          {
            [K in T]: {
              explanation: string
              label: Label
            }
          }
        >({
          input: inputAsString,
          taskType,
          taskId,
        })
      : []

  options.examples.forEach((example) => {
    examples.push({
      key: fastHash(JSON.stringify(example)),
      input: stringify(example.input),
      similarity: 1,
      explanation: '',
      output: example.labels as unknown as {
        [K in T]: {
          explanation: string
          label: Label
        }
      },
    })
  })

  const exactMatch = examples.find((x) => x.key === Key)
  if (exactMatch) {
    return convertToAnswer(exactMatch.output)
  }

  // One yes/no classification per label, in parallel. The classifier cannot learn from examples: with expert
  // examples the LLM (which reads them) decides. Labels the classifier is not confident about (or could not
  // classify) go to the LLM.
  const keys = Object.keys(labels) as T[]
  const classified = {} as { [K in T]: { explanation: string; label: Label } }
  let classifierUsage = sumUsage([])
  let llmKeys: T[] = keys

  if (
    ctx.usesClassifier &&
    !examples.length &&
    keys.every((key) => fitsClassifier(inputAsString, labels[key], options.instructions))
  ) {
    const answers = await mapUnique(keys, (key) =>
      classifyYesNo(ctx, {
        input: inputAsString,
        question: labels[key as T],
        instructions: options.instructions,
        model: ctx.classifier,
        priority: ctx.priority,
      })
    )
    classifierUsage = sumUsage(answers)

    llmKeys = []
    keys.forEach((key, i) => {
      const answer = answers[i]
      if (!answer || answer.value === null) {
        llmKeys.push(key)
        return
      }
      classified[key] = {
        label: confidentLabel(answer.value, answer.pYes),
        explanation: `Classifier ${answer.model}: ${percent(answer.pYes)} probability that the answer is yes.`,
      }
    })
  }

  const saveExample = async (
    output: { [K in T]: { explanation: string; label: Label } },
    meta: { cost: { input: number; output: number }; latency: number; tokens: { input: number; output: number } },
    model: string
  ) => {
    if (taskId && ctx.adapter && !ctx.controller.signal.aborted) {
      await ctx.adapter.saveExample({
        key: Key,
        taskType,
        taskId,
        instructions: options.instructions ?? '',
        metadata: { cost: meta.cost, latency: meta.latency, model, tokens: meta.tokens },
        input: inputAsString,
        output,
      })
    }
  }

  if (!llmKeys.length) {
    await saveExample(
      classified,
      {
        cost: { input: classifierUsage.cost, output: 0 },
        latency: classifierUsage.latency,
        tokens: classifierUsage.tokens,
      },
      classifierUsage.model
    )
    return convertToAnswer(classified)
  }

  const allExamples = takeUntilTokens(
    examples,
    CHUNK_EXAMPLES_MAX_TOKENS,
    (el) =>
      tokenizer.count(stringify(el.input)) +
      tokenizer.count(stringify(el.output)) +
      tokenizer.count(el.explanation ?? '') +
      100
  )
    .map((example, idx) => [
      {
        type: 'text' as const,
        role: 'user' as const,
        content: `
Expert Example #${idx + 1}

<|start_input|>
${stringify(example.input)}
<|end_input|>`.trim(),
      },
      {
        type: 'text' as const,
        role: 'assistant' as const,
        content: `
Expert Example #${idx + 1}
============
${Object.keys(example.output)
  .map((key) =>
    `
■${key}:【${example.output[key]?.explanation}】:${example.output[key]?.label}■
`.trim()
  )
  .join('\n')}
${END}
`.trim(),
      },
    ])
    .flat()

  const format = llmKeys
    .map((key) => {
      return `
■${key}:【explanation (where "explanation" is answering the question "${labels[key]}")】:x■ (where x is ${ALL_LABELS})
`.trim()
    })
    .join('\n\n')

  const { extracted, meta } = await ctx.generateContent({
    stopSequences: [END],
    systemPrompt: `
You need to tag the input with the following labels based on the question asked:
${LABELS.ABSOLUTELY_NOT}: You are absolutely sure that the answer is "NO" to the question.
${LABELS.PROBABLY_NOT}: You are leaning towards "NO" to the question.
${LABELS.AMBIGUOUS}: You are unsure about the answer to the question.
${LABELS.PROBABLY_YES}: You are leaning towards "YES" to the question.
${LABELS.ABSOLUTELY_YES}: You are absolutely sure that the answer is "YES" to the question.

You need to return a mapping of the labels, an explanation and the answer for each label following the format below:
\`\`\`
${format}
${END}
\`\`\`

${options.instructions ?? ''}

===
You should consider the Expert Examples below to help you make your decision.
In your "Analysis", please refer to the Expert Examples # to justify your decision.
`.trim(),
    messages: [
      ...allExamples,
      {
        type: 'text',
        role: 'user',
        content: `
Input to tag:
<|start_input|>
${inputAsString}
<|end_input|>

Answer with this following format:
\`\`\`
${format}
${END}
\`\`\`

Format cheatsheet:
\`\`\`
■label:【explanation】:x■
\`\`\`

Where \`x\` is one of the following: ${ALL_LABELS}

Remember: In your \`explanation\`, please refer to the Expert Examples # (and quote them) that are relevant to ground your decision-making process.
The Expert Examples are there to help you make your decision. They have been provided by experts in the field and their answers (and reasoning) are considered the ground truth and should be used as a reference to make your decision when applicable.
For example, you can say: "According to Expert Example #1, ..."`.trim(),
      },
    ],
    transform: (text) => {
      const output = text ?? ''
      const mapping = {} as { [K in T]: { explanation: string; label: Label } }
      const missing: string[] = []
      for (const key of llmKeys) {
        const match = matchLabel(output, key)
        if (match) {
          mapping[key] = match
        } else {
          missing.push(key)
        }
      }
      if (missing.length) {
        // Defaulting to AMBIGUOUS would silently answer "false"; the error goes back to the model instead
        throw new Error(
          `Missing or invalid answer for label(s): ${missing.join(', ')}. Answer every label on its own line with the format ■label:【explanation】:x■ where x is one of ${ALL_LABELS}, then ${END}`
        )
      }
      return mapping
    },
  })

  const merged = { ...classified, ...extracted }
  await saveExample(
    merged,
    {
      cost: { input: meta.cost.input + classifierUsage.cost, output: meta.cost.output },
      latency: meta.latency + classifierUsage.latency,
      tokens: {
        input: meta.tokens.input + classifierUsage.tokens.input,
        output: meta.tokens.output + classifierUsage.tokens.output,
      },
    },
    ctx.modelName
  )

  return convertToAnswer(merged)
}

Zai.prototype.label = function <T extends string>(
  this: Zai,
  input: unknown,
  labels: Labels<T>,
  _options?: Options<T>
): Response<
  {
    [K in T]: {
      explanation: string
      value: boolean
      confidence: number
    }
  },
  { [K in T]: boolean }
> {
  const context = this._context('zai.label')

  return new Response<
    {
      [K in T]: {
        explanation: string
        value: boolean
        confidence: number
      }
    },
    { [K in T]: boolean }
  >(context, label(input, labels, _options, context), (result) =>
    Object.keys(result).reduce(
      (acc, key) => {
        acc[key] = result[key].value
        return acc
      },
      {} as { [K in T]: boolean }
    )
  )
}
