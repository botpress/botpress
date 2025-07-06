// eslint-disable consistent-type-definitions
import { z } from '@bpinternal/zui'

import { clamp, chunk } from 'lodash-es'
import { fastHash, stringify, takeUntilTokens } from '../utils'
import { ZaiContext } from '../context'
import { Response } from '../response'
import { getTokenizer } from '../tokenizer'
import { Zai } from '../zai'
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
    .max(100_000)
    .optional()
    .describe('The maximum number of tokens per chunk')
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
    /** Tags the provided input with a list of predefined labels */
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

const parseLabel = (label: string): Label => {
  label = label.toUpperCase().replace(/\s+/g, '_').replace(/_{2,}/g, '_').trim()
  if (label.includes('ABSOLUTELY') && label.includes('NOT')) {
    return LABELS.ABSOLUTELY_NOT
  } else if (label.includes('NOT')) {
    return LABELS.PROBABLY_NOT
  } else if (label.includes('AMBIGUOUS')) {
    return LABELS.AMBIGUOUS
  }
  if (label.includes('YES')) {
    return LABELS.PROBABLY_YES
  } else if (label.includes('ABSOLUTELY') && label.includes('YES')) {
    return LABELS.ABSOLUTELY_YES
  }
  return LABELS.AMBIGUOUS
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
  const options = _Options.parse(_options ?? {}) as unknown as Options<T>
  const labels = _Labels.parse(_labels) as Labels<T>
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
    const tokens = tokenizer.split(inputAsString)
    const chunks = chunk(tokens, CHUNK_INPUT_MAX_TOKENS).map((x) => x.join(''))
    const allLabels = await Promise.all(chunks.map((chunk) => label(chunk, _labels, _options, ctx)))

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

  const format = Object.keys(labels)
    .map((key) => {
      return `
■${key}:【explanation (where "explanation" is answering the question "${labels[key]}")】:x■ (where x is ${ALL_LABELS})
`.trim()
    })
    .join('\n\n')

  const { output, meta } = await ctx.generateContent({
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

${options.instructions}

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
  })

  const answer = output.choices[0].content as string

  const final = Object.keys(labels).reduce((acc, key) => {
    const match = answer.match(new RegExp(`■${key}:【(.+)】:(\\w{2,})■`, 'i'))
    if (match) {
      const explanation = match[1].trim()
      const label = parseLabel(match[2])
      acc[key] = {
        explanation,
        label,
      }
    } else {
      acc[key] = {
        explanation: '',
        label: LABELS.AMBIGUOUS,
      }
    }
    return acc
  }, {}) as {
    [K in T]: {
      explanation: string
      label: Label
    }
  }

  if (taskId && ctx.adapter) {
    await ctx.adapter.saveExample({
      key: Key,
      taskType,
      taskId,
      instructions: options.instructions ?? '',
      metadata: {
        cost: {
          input: meta.cost.input,
          output: meta.cost.output,
        },
        latency: meta.latency,
        model: ctx.modelId,
        tokens: {
          input: meta.tokens.input,
          output: meta.tokens.output,
        },
      },
      input: inputAsString,
      output: final,
    })
  }

  return convertToAnswer(final)
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
  const context = new ZaiContext({
    client: this.client,
    modelId: this.Model,
    taskId: this.taskId,
    taskType: 'zai.label',
    adapter: this.adapter,
  })

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
