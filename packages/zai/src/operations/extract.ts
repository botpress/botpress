// eslint-disable consistent-type-definitions
import { z } from '@bpinternal/zui'

import JSON5 from 'json5'
import { jsonrepair } from 'jsonrepair'

import { chunk, isArray } from 'lodash-es'
import pLimit from 'p-limit'
import { ZaiContext } from '../context'
import { Response } from '../response'
import { getTokenizer } from '../tokenizer'
import { fastHash, stringify, takeUntilTokens } from '../utils'
import { Zai } from '../zai'
import { PROMPT_INPUT_BUFFER, PROMPT_OUTPUT_BUFFER } from './constants'
import { JsonParsingError } from './errors'

export type Options = {
  /** Instructions to guide the user on how to extract the data */
  instructions?: string
  /** The maximum number of tokens per chunk */
  chunkLength?: number
  /** Whether to strictly follow the schema or not */
  strict?: boolean
}

const INVALID_SCHEMA_ERROR = 'zai.extract only accepts schemas created with @bpinternal/zui'

const Options = z.object({
  instructions: z.string().optional().describe('Instructions to guide the user on how to extract the data'),
  chunkLength: z
    .number()
    .min(100)
    .optional()
    .describe("The maximum number of tokens per chunk (capped at what fits the model's input context)")
    .default(16_000),
  strict: z.boolean().optional().default(true).describe('Whether to strictly follow the schema or not'),
})

type __Z<T> = { __type__: 'ZuiType'; _output: T }
type OfType<O, T extends __Z<any> = __Z<O>> = T extends __Z<O> ? T : never
type AnyObjectOrArray = Record<string, unknown> | Array<unknown>

declare module '@botpress/zai' {
  interface Zai {
    /**
     * Extracts structured data from unstructured text using a Zod schema.
     *
     * This operation uses LLMs to intelligently parse text and extract information
     * according to your schema. It handles large inputs automatically by chunking
     * and supports both objects and arrays.
     *
     * @param input - The text or data to extract information from
     * @param schema - Zod schema defining the structure to extract
     * @param options - Optional configuration for extraction behavior
     * @returns A Response promise that resolves to data matching your schema
     *
     * @example Extract a single object
     * ```typescript
     * import { z } from '@bpinternal/zui'
     *
     * const personSchema = z.object({
     *   name: z.string(),
     *   age: z.number(),
     *   email: z.string().email()
     * })
     *
     * const text = "Contact John Doe (35) at john@example.com"
     * const person = await zai.extract(text, personSchema)
     * // Result: { name: 'John Doe', age: 35, email: 'john@example.com' }
     * ```
     *
     * @example Extract an array of items
     * ```typescript
     * const productSchema = z.array(z.object({
     *   name: z.string(),
     *   price: z.number()
     * }))
     *
     * const text = "We have Apple ($1.50), Banana ($0.80), and Orange ($1.20)"
     * const products = await zai.extract(text, productSchema)
     * // Result: [
     * //   { name: 'Apple', price: 1.50 },
     * //   { name: 'Banana', price: 0.80 },
     * //   { name: 'Orange', price: 1.20 }
     * // ]
     * ```
     *
     * @example With custom instructions
     * ```typescript
     * const result = await zai.extract(document, schema, {
     *   instructions: 'Only extract confirmed information, skip uncertain data',
     *   chunkLength: 10000, // Smaller chunks for better accuracy
     *   strict: true // Enforce strict schema validation
     * })
     * ```
     *
     * @example Track usage and cost
     * ```typescript
     * const response = zai.extract(text, schema)
     *
     * // Monitor progress
     * response.on('progress', (usage) => {
     *   console.log(`Tokens used: ${usage.tokens.total}`)
     *   console.log(`Cost so far: $${usage.cost.total}`)
     * })
     *
     * // Get full results
     * const { output, usage, elapsed } = await response.result()
     * console.log(`Extraction took ${elapsed}ms and cost $${usage.cost.total}`)
     * ```
     */
    extract<S extends OfType<any>>(input: unknown, schema: S, options?: Options): Response<S['_output']>
  }
}
const SPECIAL_CHAR = '■'
const START = '■json_start■'
const END = '■json_end■'
const NO_MORE = '■NO_MORE_ELEMENT■'
const ZERO_ELEMENTS = '■ZERO_ELEMENTS■'

// Models occasionally garble a marker with invisible characters (zero-width spaces, direction marks), sometimes in place
// of its closing ■, e.g. "■json_start\u200E{", which hides that element from the parser. Markers are matched with any of
// those characters between their letters and an optional closing ■; the extracted values themselves are left untouched
// (emoji sequences rely on zero-width joiners).
const INVISIBLE = '[\\u200B-\\u200F\\u2060\\uFEFF]*'
const markerPattern = (marker: string) => {
  const body = [...marker.slice(0, -1)].map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join(INVISIBLE)
  return new RegExp(`${body}${INVISIBLE}${SPECIAL_CHAR}?`, 'g')
}
const MARKERS = [START, END, NO_MORE, ZERO_ELEMENTS].map((m) => [markerPattern(m), m] as const)
const normalizeMarkers = (text: string) => MARKERS.reduce((t, [re, m]) => t.replace(re, m), text)

// Valid JSON is parsed as-is: jsonrepair "fixes" some valid JSON into an error, e.g. a string ending with "{" such as
// {"quote":"if (x) {"} (common when the input quotes code). Repair is only the fallback for malformed output.
const parseLenient = (json: string): unknown => {
  try {
    return JSON.parse(json)
  } catch {
    try {
      return JSON5.parse(json)
    } catch {
      return JSON5.parse(jsonrepair(json))
    }
  }
}
// The same characters between JSON tokens (e.g. '{\u200B"key"') break the parser; inside strings they are kept
const stripInvisibleOutsideStrings = (json: string) => {
  let out = ''
  let inString = false
  for (let i = 0; i < json.length; i++) {
    const c = json[i]!
    if (inString) {
      out += c
      if (c === '\\') out += json[++i] ?? ''
      else if (c === '"') inString = false
    } else if (!/[\u200B-\u200F\u2060\uFEFF]/.test(c)) {
      out += c
      if (c === '"') inString = true
    }
  }
  return out
}

// Cuts at the first ■ that is outside a JSON string (a garbled marker glued to the JSON), keeping ■ inside values
const cutAtMarkerOutsideStrings = (json: string) => {
  let inString = false
  for (let i = 0; i < json.length; i++) {
    const c = json[i]!
    if (inString) {
      if (c === '\\') i++
      else if (c === '"') inString = false
    } else if (c === '"') {
      inString = true
    } else if (c === SPECIAL_CHAR) {
      return json.slice(0, i).trim()
    }
  }
  return json
}

// The element as written; a ■ inside a value is kept. Garbled markers glued to the JSON are only cut as a fallback.
const parseElement = (json: string): unknown => {
  try {
    return JSON.parse(json)
  } catch {}
  try {
    return JSON5.parse(json)
  } catch {}
  const cut = cutAtMarkerOutsideStrings(json)
  if (cut !== json && cut.length) {
    try {
      return parseLenient(cut)
    } catch {}
  }
  if (json.includes(SPECIAL_CHAR) && cut === json) {
    // ■ only inside strings and still invalid: last resort, the legacy cut at the first ■
    try {
      return parseLenient(json.slice(0, json.indexOf(SPECIAL_CHAR)).trim())
    } catch {}
  }
  return parseLenient(json)
}

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`)
      .join(',')}}`
  }
  return JSON.stringify(value) ?? 'undefined'
}

const isPlainObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x)

const uniqueValues = (values: unknown[]) => {
  const seen = new Set<string>()
  return values.filter((v) => {
    const key = stableStringify(v)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Deterministic merge of chunk results: arrays are unioned, objects merged per key, scalars take the most frequent value */
const mergeValues = (values: unknown[]): unknown => {
  const defined = values.filter((v) => v !== undefined && v !== null)
  if (!defined.length) {
    return values.find((v) => v === null) ?? undefined
  }
  if (defined.every(Array.isArray)) {
    return uniqueValues((defined as unknown[][]).flat())
  }
  if (defined.every(isPlainObject)) {
    const keys = [...new Set(defined.flatMap((v) => Object.keys(v)))]
    return Object.fromEntries(keys.map((k) => [k, mergeValues(defined.map((v) => v[k]))]))
  }
  const counts = new Map<string, { value: unknown; count: number }>()
  for (const v of defined) {
    const key = stableStringify(v)
    const entry = counts.get(key) ?? { value: v, count: 0 }
    entry.count++
    counts.set(key, entry)
  }
  return [...counts.values()].reduce((best, x) => (x.count > best.count ? x : best)).value
}

// JSON can't carry these; strict mode would fail every attempt
const findJsonIncompatibleType = (schema: unknown, seen = new Set<unknown>()): string | null => {
  if (!schema || typeof schema !== 'object' || seen.has(schema)) {
    return null
  }
  seen.add(schema)
  if (z.is.zuiType(schema)) {
    if (z.is.zuiDate(schema)) return 'z.date()'
    if (z.is.zuiBigInt(schema)) return 'z.bigint()'
    if (z.is.zuiLazy(schema)) return null
  }
  const def = (schema as { _def?: Record<string, unknown> })._def
  if (!def) {
    return null
  }
  for (const [key, value] of Object.entries(def)) {
    const children =
      key === 'shape' && typeof value === 'function'
        ? Object.values((value as () => Record<string, unknown>)())
        : Array.isArray(value)
          ? value
          : value instanceof Map
            ? [...value.values()]
            : [value]
    for (const child of children) {
      if (z.is.zuiType(child)) {
        const found = findJsonIncompatibleType(child, seen)
        if (found) return found
      }
    }
  }
  return null
}

class TruncatedOutputError extends Error {
  public constructor() {
    super(
      'zai.extract: the model stopped at its output token limit before listing every element. Use a smaller chunkLength, or a model with a larger output limit.'
    )
  }
}

type InternalProps = { depth: number; isMerge: boolean }

/** Maximum nesting of chunk → merge rounds; past it, chunk results are merged in code */
const MAX_DEPTH = 4

/** Applies the caller's schema (defaults, transforms) once, to the raw top-level result */
const finalize = <S extends OfType<AnyObjectOrArray>>(schema: S, raw: unknown): S['_output'] => {
  const safe = (schema as unknown as z.ZodType).safeParse(raw)
  return (safe.success ? safe.data : raw) as S['_output']
}

const extract = async <S extends OfType<AnyObjectOrArray>>(
  input: unknown,
  _schema: S,
  _options: Options | undefined,
  ctx: ZaiContext,
  internal: InternalProps = { depth: 0, isMerge: false }
): Promise<S['_output']> => {
  ctx.controller.signal.throwIfAborted()

  if (!z.is.zuiType(_schema)) {
    throw new Error(INVALID_SCHEMA_ERROR)
  }

  let originalSchema: z.ZodType
  try {
    originalSchema = z.transforms.fromJSONSchema(z.transforms.toJSONSchema(_schema))
  } catch {
    // The above transformers arent the legacy ones. They are very strict and might fail on some schema types.
    originalSchema = _schema
  }

  const options = Options.parse(_options ?? {})

  if (options.strict) {
    const unsupported = findJsonIncompatibleType(_schema)
    if (unsupported) {
      throw new Error(
        `zai.extract: ${unsupported} is not supported in strict mode, the model returns JSON which can't represent it. Use z.string() (e.g. an ISO date) or z.number() and convert the value after extraction.`
      )
    }
  }

  const tokenizer = await getTokenizer()
  const model = await ctx.getModel()

  const taskId = ctx.taskId
  const taskType = 'zai.extract'

  const PROMPT_COMPONENT = Math.max(model.input.maxTokens - PROMPT_INPUT_BUFFER, 100)

  const { isArrayOfObjects, isWrappedValue, objSchema } = _parsing.parseSchema(originalSchema, {
    partial: !options.strict,
  })

  let schemaTypescript: string
  try {
    schemaTypescript = objSchema.toTypescriptType({ declaration: false, treatDefaultAsOptional: true })
  } catch (error: unknown) {
    throw new Error(
      `zai.extract could not describe the schema to the model (recursive schemas such as z.lazy() are not supported): ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
  const schemaLength = tokenizer.count(schemaTypescript)

  options.chunkLength = Math.min(options.chunkLength, model.input.maxTokens - PROMPT_INPUT_BUFFER - schemaLength)

  if (options.chunkLength < 100) {
    throw new Error(
      `zai.extract: the schema is too large for the model's input context (schema is ${schemaLength} tokens, model "${model.name}" accepts ${model.input.maxTokens} tokens). Use a smaller schema or a model with a larger context.`
    )
  }

  const keys = Object.keys(objSchema.shape)

  const inputAsString = stringify(input)
  const inputTokens = tokenizer.count(inputAsString)

  /**
   * Checks the merged/final value against the caller's schema (refinements, array bounds, etc.).
   * Returns the value untransformed: internal values stay raw so the schema's transforms run exactly once,
   * in `finalize` at the top level (chunk and merge results are re-validated when merged).
   */
  const validateFinal = (final: unknown, raw: string): unknown => {
    const safe = _schema.safeParse(final)
    if (!safe.success && options.strict) {
      throw new JsonParsingError(raw, safe.error)
    }
    return final
  }

  const mergeInCode = (parts: unknown[]) => {
    const merged = isArrayOfObjects
      ? uniqueValues(parts.flatMap((p) => (Array.isArray(p) ? p : [p])))
      : mergeValues(parts)
    return validateFinal(merged, stringify(merged, false)) as S['_output']
  }

  /** Extracts each piece separately and merges them; the merge only goes back through the LLM while it converges */
  const extractPieces = async (pieces: string[], forceCodeMerge = false): Promise<S['_output']> => {
    const limit = pLimit(10) // Limit to 10 concurrent extraction operations
    const settled = await Promise.allSettled(
      pieces.map((piece) =>
        limit(() =>
          extract(
            piece,
            _schema,
            {
              ...options,
              strict: false, // We don't want to fail on strict mode for sub-chunks
            },
            ctx,
            { depth: internal.depth + 1, isMerge: false }
          )
        )
      )
    )

    ctx.controller.signal.throwIfAborted()

    const all: unknown[] = settled.flatMap((x) => (x.status === 'fulfilled' ? [x.value as unknown] : []))

    if (!all.length) {
      // Merging nothing would make the model invent a result
      const firstError = settled.find((x): x is PromiseRejectedResult => x.status === 'rejected')?.reason
      throw firstError instanceof Error
        ? firstError
        : new Error(`zai.extract: all ${pieces.length} chunks failed to extract`)
    }

    // We run this function recursively until all chunks are merged into a single output
    const rows = all.map((x, idx) => `<part-${idx + 1}>\n${stringify(x, true)}\n</part-${idx + 1}>`).join('\n')
    const mergePrompt = `
The result has been split into ${all.length} parts. Recursively merge the result into the final result.
When merging arrays, take unique values.
When merging conflictual (but defined) information, take the most reasonable and frequent value.
Non-defined values are OK and normal. Don't delete fields because of null values. Focus on defined values.

Here's the data:
${rows}

Merge it back into a final result.`.trim()

    const mergeTokens = tokenizer.count(mergePrompt)
    // The model re-emits every element when merging arrays; it must fit its output limit
    const fitsOutput =
      !isArrayOfObjects || tokenizer.count(stringify(all, false)) < model.output.maxTokens - PROMPT_OUTPUT_BUFFER
    // Merging through the LLM only while each round shrinks the input, otherwise it never converges
    const converges = mergeTokens < inputTokens * 0.9 || mergeTokens <= options.chunkLength

    if (forceCodeMerge || internal.depth >= MAX_DEPTH || !fitsOutput || !converges) {
      return mergeInCode(all)
    }

    try {
      return await extract(mergePrompt, _schema, options, ctx, { depth: internal.depth + 1, isMerge: true })
    } catch (error: unknown) {
      ctx.controller.signal.throwIfAborted()
      if (error instanceof TruncatedOutputError) {
        return mergeInCode(all)
      }
      throw error
    }
  }

  if (inputTokens > options.chunkLength && internal.depth < MAX_DEPTH * 2) {
    const tokens = tokenizer.split(inputAsString)
    const chunks = chunk(tokens, options.chunkLength).map((x) => x.join(''))
    return extractPieces(chunks)
  }

  // Output-format rules; the schema and these go in the system prompt once. The caller's instructions go once, in the
  // final message next to the input (examples and the task used to repeat schema + instructions in every message).
  const instructions: string[] = []

  const shape = `{ ${keys.map((key) => `"${key}": ...`).join(', ')} }`
  const abbv = '{ ... }'

  if (isArrayOfObjects) {
    instructions.push('You may have multiple elements, or zero elements in the input.')
    instructions.push('You must extract each element separately.')
    instructions.push(`Each element must be a JSON object with exactly the format: ${START}${shape}${END}`)
    instructions.push('Write each JSON object compactly on a single line (no indentation).')
    instructions.push(`If there are no elements to extract, respond with ${ZERO_ELEMENTS}.`)
    instructions.push(`When you are done extracting all elements, type "${NO_MORE}" to finish.`)
    instructions.push(
      `For example, if you have zero elements, the output should look like this: ${ZERO_ELEMENTS}${NO_MORE}`
    )
    instructions.push(
      `For example, if you have two elements, the output should look like this: ${START}${abbv}${END}${START}${abbv}${END}${NO_MORE}`
    )
  } else {
    instructions.push('You may have exactly one element in the input.')
    instructions.push(`The element must be a JSON object with exactly the format: ${START}${shape}${END}`)
    instructions.push('Write the JSON object compactly on a single line (no indentation).')
  }

  if (!options.strict) {
    instructions.push('You may ignore any fields that are not present in the input. All keys are optional.')
  }

  // All tokens remaining after the input and condition are accounted can be used for examples
  const EXAMPLES_TOKENS =
    PROMPT_COMPONENT -
    inputTokens -
    tokenizer.count(instructions.join('\n')) -
    tokenizer.count(options.instructions ?? '')

  const Key = fastHash(
    JSON.stringify({
      taskType,
      taskId,
      input: inputAsString,
      instructions: options.instructions,
      schema: schemaTypescript,
    })
  )

  const examples =
    taskId && ctx.adapter
      ? await ctx.adapter.getExamples<string, unknown>({
          input: inputAsString,
          taskType,
          taskId,
        })
      : []

  const exactMatch = examples.find((x) => x.key === Key)
  if (exactMatch && _schema.safeParse(exactMatch.output).success) {
    return exactMatch.output as S['_output']
  }

  const defaultExample = isArrayOfObjects
    ? {
        input: `The story goes as follow.
Once upon a time, there was a person named Alice who was 30 years old.
Then, there was a person named Bob who was 25 years old.
The end.`,
        schema: 'Array<{ name: string, age: number }>',
        instructions: 'Extract all people',
        extracted: [
          {
            name: 'Alice',
            age: 30,
          },
          {
            name: 'Bob',
            age: 25,
          },
        ],
      }
    : {
        input: `The story goes as follow.
Once upon a time, there was a person named Alice who was 30 years old.
The end.`,
        schema: '{ name: string, age: number }',
        instructions: 'Extract the person',
        extracted: { name: 'Alice', age: 30 },
      }

  // Saved examples were made for this same task: same schema and instructions, so only their input is shown
  const userExamples: Array<{ input?: unknown; schema?: string; instructions?: string; extracted: unknown }> =
    examples.map((e) => ({ input: e.input, extracted: e.output }))

  let exampleId = 1

  const block = (name: string, content: string) => `<|start_${name}|>\n${content}\n<|end_${name}|>`

  const formatExampleInput = (input: string, schema?: string, instructions?: string) =>
    schema
      ? [
          "Here's an example to help you understand the format (it uses its own schema, not the one above):",
          block('schema', schema),
          block('instructions', instructions ?? 'No specific instructions, just follow the schema.'),
          block('input', input.trim()),
        ].join('\n\n')
      : [
          `Expert Example #${exampleId++} (same schema and instructions as the task):`,
          block('input', input.trim()),
        ].join('\n\n')

  const formatTaskInput = (input: string) =>
    [
      'Now extract from this input, following the schema in the system prompt:',
      block('instructions', options.instructions || 'No specific instructions, just follow the schema.'),
      block('input', input.trim()),
    ].join('\n\n')

  // Compact JSON (one line per object): the model copies the examples' style, and indentation is 20-30% of the output tokens
  const formatOutput = (extracted: unknown) => {
    const extractedArr = isArray(extracted) ? extracted : [extracted]

    // markers on their own lines: some models garble a marker glued to the JSON
    return extractedArr.map((x: unknown) => `${START}\n${JSON.stringify(x)}\n${END}`).join('\n') + NO_MORE
  }

  const formatExample = (example: { input?: unknown; schema?: string; instructions?: string; extracted: unknown }) => [
    {
      type: 'text' as const,
      content: formatExampleInput(stringify(example.input ?? null), example.schema, example.instructions),
      role: 'user' as const,
    },
    {
      type: 'text' as const,
      content: formatOutput(example.extracted),
      role: 'assistant' as const,
    },
  ]

  const allExamples = takeUntilTokens<{ input?: unknown; schema?: string; instructions?: string; extracted: unknown }>(
    userExamples.length ? userExamples : [defaultExample],
    EXAMPLES_TOKENS,
    (el) => tokenizer.count(stringify(el.input)) + tokenizer.count(stringify(el.extracted))
  )
    .map(formatExample)
    .flat()

  const unwrap = (x: unknown) => (isPlainObject(x) ? x.value : undefined)

  const parseOutput = (text: string | undefined, stopReason: string | undefined) => {
    const normalized = normalizeMarkers(text ?? '')
    // Providers drop the stop sequence, so a cut-off response is only visible through the stop reason
    const hitTokenLimit = stopReason === 'max_tokens'

    let segments = normalized.split(START)
    if (segments.length > 1) {
      // Anything before the first marker is prose ("Here are the elements:"), not an element
      segments = segments.slice(1)
    }

    const elements: unknown[] = []
    segments.forEach((segment, idx) => {
      const isLast = idx === segments.length - 1
      const endIdx = segment.indexOf(END)
      const hasEnd = endIdx >= 0
      let json = stripInvisibleOutsideStrings(hasEnd ? segment.slice(0, endIdx) : segment).trim()

      if (!json.includes('{')) {
        return // marker leftovers (■NO_MORE_ELEMENT■, ■ZERO_ELEMENTS■) or empty
      }
      if (!json.startsWith('{')) {
        json = json.slice(json.indexOf('{'))
      }

      if (isArrayOfObjects && isLast && !hasEnd && hitTokenLimit) {
        return // the element was cut off by the token limit; handled below
      }

      let parsed: unknown
      try {
        parsed = parseElement(json)
      } catch (error: unknown) {
        if (!options.strict && !isArrayOfObjects) {
          return // lenient single object: unreadable output means nothing was found (e.g. a chunk without the data)
        }
        throw new JsonParsingError(segment, error instanceof Error ? error : new Error('Unknown error'))
      }

      const safe = objSchema.safeParse(parsed)
      if (safe.success) {
        elements.push(parsed) // raw: transforms run once, in finalize
      } else if (options.strict) {
        throw new JsonParsingError(segment, safe.error)
      } else if (parsed !== null && parsed !== undefined) {
        elements.push(parsed)
      }
    })

    if (isArrayOfObjects && hitTokenLimit) {
      return { truncated: true as const }
    }

    let final: unknown
    if (isArrayOfObjects) {
      final = isWrappedValue ? elements.map(unwrap).filter((x) => x !== undefined) : elements
    } else if (elements.length) {
      final = isWrappedValue ? unwrap(elements[0]) : elements[0]
    } else if (!options.strict) {
      final = isWrappedValue ? undefined : {}
    } else {
      const empty = objSchema.safeParse({})
      if (empty.success) {
        final = isWrappedValue ? unwrap(empty.data) : empty.data
      } else if (_schema.safeParse(undefined).success) {
        final = undefined
      } else {
        throw new Error(
          `No JSON object was found in the response${hitTokenLimit ? ' (it was cut off by the output token limit)' : ''}. Respond with ${START}${shape}${END}`
        )
      }
    }

    return { truncated: false as const, final: validateFinal(final, normalized) }
  }

  const { meta, extracted } = await ctx.generateContent({
    systemPrompt: `
Extract the following information from the input:
${schemaTypescript}
====

${instructions.map((x) => `• ${x}`).join('\n')}
`.trim(),
    stopSequences: [isArrayOfObjects ? NO_MORE : END],
    messages: [
      ...allExamples,
      {
        role: 'user',
        type: 'text',
        content: formatTaskInput(inputAsString),
      },
    ],
    transform: (text, response) => parseOutput(text, response?.metadata?.stopReason),
  })

  if (extracted.truncated) {
    // Too many elements for one response: extract each half of the input and merge them
    if (internal.isMerge || internal.depth >= MAX_DEPTH + 2 || inputTokens < 200) {
      throw new TruncatedOutputError()
    }
    const tokens = tokenizer.split(inputAsString)
    const half = Math.ceil(tokens.length / 2)
    // The model could not list every element at once, so it can't re-emit them all in a merge either
    return extractPieces([tokens.slice(0, half).join(''), tokens.slice(half).join('')], true)
  }

  const final = extracted.final

  if (taskId && ctx.adapter && !ctx.controller.signal.aborted) {
    await ctx.adapter.saveExample({
      key: Key,
      taskId,
      taskType,
      instructions: options.instructions ?? 'No specific instructions',
      input: inputAsString,
      output: final,
      metadata: {
        cost: {
          input: meta.cost.input,
          output: meta.cost.output,
        },
        latency: meta.latency,
        model: ctx.modelName,
        tokens: {
          input: meta.tokens.input,
          output: meta.tokens.output,
        },
      },
    })
  }

  return final as S['_output']
}

Zai.prototype.extract = function <S extends OfType<AnyObjectOrArray>>(
  this: Zai,
  input: unknown,
  schema: S,
  _options?: Options
): Response<S['_output']> {
  const context = this._context('zai.extract')

  return new Response<S['_output']>(
    context,
    extract(input, schema, _options, context).then((raw) => finalize(schema, raw)),
    (result) => result
  )
}

namespace _parsing {
  const _getBaseSchema = (schema: z.ZodType): z.ZodType => (schema.naked ? schema.naked() : schema)

  /**
   * Non-object values are wrapped as { value }. The wrapped value keeps its nullable/optional modifiers, so the model
   * can answer null (or nothing) when the caller's schema allows it.
   */
  const _maybeWrapObjSchema = (
    base: z.ZodType,
    withModifiers: z.ZodType
  ): { schema: z.ZodObject; isWrapped: boolean } => {
    if (z.is.zuiObject(base)) {
      return { schema: base, isWrapped: false }
    }
    return {
      schema: z.object({
        value: withModifiers,
      }),
      isWrapped: true,
    }
  }

  const _applySchemaOptions = (schema: z.ZodObject, opts: ParseSchemaOptions): z.ZodObject => {
    if (!opts.partial) {
      return schema
    }

    try {
      return schema.partial()
    } catch {
      return schema
    }
  }

  export type ParseSchemaOptions = { partial: boolean }
  export const parseSchema = (originalSchema: z.ZodType, opts: ParseSchemaOptions) => {
    const baseType = _getBaseSchema(originalSchema)

    if (z.is.zuiArray(baseType)) {
      const elementType = _getBaseSchema(baseType.element)
      const { schema, isWrapped } = _maybeWrapObjSchema(elementType, baseType.element)
      return { isArrayOfObjects: true, isWrappedValue: isWrapped, objSchema: _applySchemaOptions(schema, opts) }
    }

    const { schema, isWrapped: wrapped } = _maybeWrapObjSchema(baseType, originalSchema)
    return { isArrayOfObjects: false, isWrappedValue: wrapped, objSchema: _applySchemaOptions(schema, opts) }
  }
}
