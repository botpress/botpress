// eslint-disable consistent-type-definitions
import { z } from '@bpinternal/zui'
import { clamp } from 'lodash-es'
import pLimit from 'p-limit'
import { ZaiContext } from '../context'
import { Response } from '../response'
import { getTokenizer } from '../tokenizer'
import { fastHash, stringify } from '../utils'
import { Zai } from '../zai'
import { PROMPT_INPUT_BUFFER, PROMPT_OUTPUT_BUFFER } from './constants'

export type Group<T> = {
  id: string
  label: string
  elements: T[]
}

type InitialGroup = {
  id: string
  label: string
  elements?: unknown[]
}

const _InitialGroup = z.object({
  id: z.string().min(1).max(100),
  label: z.string().min(1).max(250),
  elements: z.array(z.any()).optional().default([]),
})

export type Options = {
  instructions?: string
  tokensPerElement?: number
  chunkLength?: number
  initialGroups?: Array<InitialGroup>
  maxGroups?: number
  minElements?: number
  /** Allow the model to create groups beyond `initialGroups` (default true). Set false to classify into a fixed list. */
  newGroups?: boolean
  /** Example elements shown under each group in the prompt (default 3), taken from `initialGroups[].elements`. */
  examplesPerGroup?: number
  /** Maximum elements per model call (default 30). Smaller chunks are more accurate; larger ones use fewer calls. */
  elementsPerChunk?: number
  /** Maximum model calls in flight (default 20). */
  concurrency?: number
}

const _Options = z.object({
  instructions: z.string().optional(),
  tokensPerElement: z.number().min(1).max(100_000).optional().default(250),
  chunkLength: z.number().min(100).max(100_000).optional().default(16_000),
  initialGroups: z.array(_InitialGroup).optional().default([]),
  maxGroups: z.number().min(2).optional(),
  minElements: z.number().min(1).optional(),
  newGroups: z.boolean().optional().default(true),
  examplesPerGroup: z.number().min(0).max(20).optional().default(3),
  elementsPerChunk: z.number().min(1).max(200).optional().default(30),
  concurrency: z.number().min(1).max(100).optional().default(20),
})

declare module '@botpress/zai' {
  interface Zai {
    /**
     * Groups array items into categories based on semantic similarity or criteria.
     *
     * This operation intelligently categorizes items by analyzing their content and
     * creating meaningful groups. It can discover natural groupings automatically or
     * use predefined categories. Perfect for clustering, classification, and organization.
     *
     * @param input - Array of items to group
     * @param options - Configuration for grouping behavior, instructions, and initial categories
     * @param options.maxGroups - Maximum number of groups allowed (minimum 2). When set, groups are merged at the end until within limit.
     * @param options.minElements - Minimum elements per group (minimum 1). Groups below this threshold have their elements redistributed via AI.
     * @param options.newGroups - Set false to only use `initialGroups` (classification into a fixed list); the model must pick one of them.
     * @param options.examplesPerGroup - How many `initialGroups[].elements` to show under each group as examples (default 3).
     * @param options.elementsPerChunk - Maximum elements per model call (default 30).
     * @param options.concurrency - Maximum model calls in flight (default 20).
     * @returns Response with groups array (simplified to Record<groupLabel, items[]>)
     *
     * @example Automatic grouping
     * ```typescript
     * const messages = [
     *   "I can't log in to my account",
     *   "How do I reset my password?",
     *   "When will my order arrive?",
     *   "The app keeps crashing",
     *   "I haven't received my package",
     *   "Error 500 on checkout"
     * ]
     *
     * const groups = await zai.group(messages, {
     *   instructions: 'Group by type of customer issue'
     * })
     * // Result (simplified):
     * // {
     * //   "Login Issues": ["I can't log in...", "How do I reset..."],
     * //   "Shipping Questions": ["When will my order...", "I haven't received..."],
     * //   "Technical Errors": ["The app keeps crashing", "Error 500..."]
     * // }
     *
     * // Full result:
     * const { output } = await zai.group(messages, { instructions: '...' }).result()
     * // output: [
     * //   { id: 'login_issues', label: 'Login Issues', elements: [...] },
     * //   { id: 'shipping', label: 'Shipping Questions', elements: [...] },
     * //   { id: 'errors', label: 'Technical Errors', elements: [...] }
     * // ]
     * ```
     *
     * @example With predefined categories
     * ```typescript
     * const articles = [
     *   "How to build a React app",
     *   "Python machine learning tutorial",
     *   "Understanding Docker containers",
     *   "Vue.js best practices",
     *   "Deep learning with TensorFlow"
     * ]
     *
     * const groups = await zai.group(articles, {
     *   instructions: 'Categorize by technology',
     *   initialGroups: [
     *     { id: 'frontend', label: 'Frontend Development' },
     *     { id: 'backend', label: 'Backend Development' },
     *     { id: 'ml', label: 'Machine Learning' },
     *     { id: 'devops', label: 'DevOps & Infrastructure' }
     *   ]
     * })
     * // Groups articles into predefined categories
     * ```
     *
     * @example Grouping products
     * ```typescript
     * const products = [
     *   { name: 'Laptop', price: 999, category: 'Electronics' },
     *   { name: 'Desk', price: 299, category: 'Furniture' },
     *   { name: 'Mouse', price: 29, category: 'Electronics' },
     *   { name: 'Chair', price: 199, category: 'Furniture' }
     * ]
     *
     * const grouped = await zai.group(products, {
     *   instructions: 'Group by price range: budget (< $100), mid-range ($100-$500), premium (> $500)'
     * })
     * // Result:
     * // {
     * //   "Budget": [Mouse],
     * //   "Mid-range": [Chair, Desk],
     * //   "Premium": [Laptop]
     * // }
     * ```
     *
     * @example Content categorization
     * ```typescript
     * const emails = [
     *   { subject: 'Meeting tomorrow', body: '...', from: 'boss@company.com' },
     *   { subject: 'Invoice #1234', body: '...', from: 'billing@vendor.com' },
     *   { subject: 'Weekly report', body: '...', from: 'team@company.com' },
     *   { subject: 'Payment received', body: '...', from: 'accounting@company.com' }
     * ]
     *
     * const categorized = await zai.group(emails, {
     *   instructions: 'Categorize by email type: work communication, financial, reports',
     *   tokensPerElement: 300 // Allow more context per email
     * })
     * ```
     *
     * @example Customer feedback grouping
     * ```typescript
     * const feedback = [
     *   "Love the new UI!",
     *   "App is too slow",
     *   "Great customer service",
     *   "Confusing navigation",
     *   "Fast shipping!",
     *   "Hard to find features"
     * ]
     *
     * const grouped = await zai.group(feedback, {
     *   instructions: 'Group by aspect: UI/UX, Performance, Customer Service, Shipping'
     * })
     * ```
     *
     * @example Topic clustering for research
     * ```typescript
     * const papers = [
     *   { title: 'Transformer Networks for NLP', abstract: '...' },
     *   { title: 'CNN Image Classification', abstract: '...' },
     *   { title: 'BERT Language Understanding', abstract: '...' },
     *   { title: 'Object Detection with YOLO', abstract: '...' }
     * ]
     *
     * const clusters = await zai.group(papers, {
     *   instructions: 'Group by research area',
     *   chunkLength: 10000 // Allow more tokens for detailed abstracts
     * })
     * // Result: Groups papers by topic (NLP, Computer Vision, etc.)
     * ```
     *
     * @example With initial seed groups
     * ```typescript
     * const tasks = [
     *   "Fix login bug",
     *   "Update documentation",
     *   "Add dark mode",
     *   "Optimize database queries"
     * ]
     *
     * const grouped = await zai.group(tasks, {
     *   instructions: 'Categorize development tasks',
     *   initialGroups: [
     *     { id: 'bugs', label: 'Bug Fixes', elements: [] },
     *     { id: 'features', label: 'New Features', elements: [] },
     *     { id: 'docs', label: 'Documentation', elements: [] },
     *     { id: 'performance', label: 'Performance', elements: [] }
     *   ]
     * })
     * ```
     */
    /**
     * @example Limiting number of groups
     * ```typescript
     * const items = ['apple', 'banana', 'carrot', 'chicken', 'rice', 'bread', 'salmon', 'milk']
     *
     * const groups = await zai.group(items, {
     *   instructions: 'Group by food type',
     *   maxGroups: 3 // At most 3 groups — smallest groups get merged if exceeded
     * })
     * // Guarantees no more than 3 groups in the result
     * ```
     */
    group<T>(input: Array<T>, options?: Options): Response<Array<Group<T>>, Record<string, T[]>>
  }
}

const END = '■END■'

// Simplified data structures
type GroupInfo = {
  id: string
  label: string
  normalizedLabel: string
  /** short reference shown to the model (G1, G2…) so it can answer without retyping long labels */
  ref: string
  examples: string[]
}

const words = (s: string) => new Set(s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])

/** Word-overlap similarity (Jaccard) — used to map a near-verbatim label back to an existing group instead of creating a duplicate. */
const similarity = (a: string, b: string): number => {
  const A = words(a)
  const B = words(b)
  if (!A.size || !B.size) return 0
  let inter = 0
  for (const w of A) if (B.has(w)) inter++
  return inter / (A.size + B.size - inter)
}

const normalizeLabel = (label: string): string => {
  return label
    .trim()
    .toLowerCase()
    .replace(/^(group|new group|new)\s*[-:]\s*/i, '')
    .replace(/^(group|new group|new)\s+/i, '')
    .trim()
}

const group = async <T>(input: Array<T>, _options: Options | undefined, ctx: ZaiContext): Promise<Array<Group<T>>> => {
  ctx.controller.signal.throwIfAborted()

  const options = _Options.parse(_options ?? {})
  const tokenizer = await getTokenizer()
  const model = await ctx.getModel()

  const taskId = ctx.taskId
  const taskType = 'zai.group'

  if (input.length === 0) {
    return []
  }

  // Simple data structures
  const groups = new Map<string, GroupInfo>() // groupId -> GroupInfo
  const groupElements = new Map<string, Set<number>>() // groupId -> Set of element indices
  const elementGroups = new Map<number, Set<string>>() // elementIndex -> Set of groupIds seen/assigned
  const labelToGroupId = new Map<string, string>() // normalized label -> groupId
  const lastAssigned = new Map<number, string>() // elementIndex -> latest group it was put in (the review pass sees every group)
  let groupIdCounter = 0
  const refToGroupId = new Map<string, string>() // "G3" -> groupId
  const addGroup = (id: string, label: string, examples: string[] = []) => {
    const normalized = normalizeLabel(label)
    const ref = `G${groups.size + 1}`
    groups.set(id, { id, label, normalizedLabel: normalized, ref, examples })
    groupElements.set(id, new Set())
    labelToGroupId.set(normalized, id)
    refToGroupId.set(ref.toLowerCase(), id)
    return id
  }

  // Initialize with provided groups (their elements become examples shown to the model)
  options.initialGroups.forEach((ig) => {
    addGroup(
      ig.id,
      ig.label,
      (ig.elements ?? []).slice(0, options.examplesPerGroup).map((e) => tokenizer.truncate(stringify(e, false), 60))
    )
  })
  if (!options.newGroups && groups.size === 0) {
    throw new Error('zai.group: newGroups is false but no initialGroups were given')
  }

  // Resolve a model answer (group ref, exact label, or a near-verbatim label) to an existing group id, if any.
  const resolveGroup = (answer: string): string | undefined => {
    const a = answer.trim()
    const byRef =
      refToGroupId.get(a.toLowerCase()) ?? refToGroupId.get(a.match(/^\s*(G\d+)\b/i)?.[1]?.toLowerCase() ?? '')
    if (byRef) return byRef
    const byLabel = labelToGroupId.get(normalizeLabel(a))
    if (byLabel) return byLabel
    let best: string | undefined
    let bestScore = 0.8
    for (const g of groups.values()) {
      const score = similarity(a, g.label)
      if (score >= bestScore) {
        best = g.id
        bestScore = score
      }
    }
    return best
  }

  // Prepare elements
  const elements = input.map((element, idx) => ({
    element,
    index: idx,
    stringified: stringify(element, false),
  }))

  // Token budget
  const TOKENS_TOTAL_MAX = model.input.maxTokens - PROMPT_INPUT_BUFFER - PROMPT_OUTPUT_BUFFER
  const TOKENS_INSTRUCTIONS_MAX = options.instructions
    ? clamp(tokenizer.count(options.instructions), 100, TOKENS_TOTAL_MAX * 0.2)
    : 0
  const TOKENS_AVAILABLE = TOKENS_TOTAL_MAX - TOKENS_INSTRUCTIONS_MAX
  const TOKENS_FOR_GROUPS_MAX = Math.floor(TOKENS_AVAILABLE * 0.4)
  const TOKENS_FOR_ELEMENTS_MAX = Math.floor(TOKENS_AVAILABLE * 0.6)

  // Chunk elements by token budget
  const MAX_ELEMENTS_PER_CHUNK = options.elementsPerChunk
  const elementChunks: number[][] = [] // Array of element indices
  let currentChunk: number[] = []
  let currentTokens = 0

  for (const elem of elements) {
    const truncated = tokenizer.truncate(elem.stringified, options.tokensPerElement)
    const elemTokens = tokenizer.count(truncated)

    if (
      (currentTokens + elemTokens > TOKENS_FOR_ELEMENTS_MAX || currentChunk.length >= MAX_ELEMENTS_PER_CHUNK) &&
      currentChunk.length > 0
    ) {
      elementChunks.push(currentChunk)
      currentChunk = []
      currentTokens = 0
    }

    currentChunk.push(elem.index)
    currentTokens += elemTokens
  }

  if (currentChunk.length > 0) {
    elementChunks.push(currentChunk)
  }

  // Tokens a group takes in the prompt (label + its examples)
  const groupTokenCount = (group: GroupInfo) =>
    tokenizer.count(`${group.label} ${group.examples.join(' ')}`) + 10 + group.examples.length * 2

  // Chunk element indices by token budget and MAX_ELEMENTS_PER_CHUNK
  const chunkElements = (indices: number[]): number[][] => {
    const chunks: number[][] = []
    let chunk: number[] = []
    let tokens = 0
    for (const idx of indices) {
      const elemTokens = tokenizer.count(tokenizer.truncate(elements[idx].stringified, options.tokensPerElement))
      if (
        (tokens + elemTokens > TOKENS_FOR_ELEMENTS_MAX || chunk.length >= MAX_ELEMENTS_PER_CHUNK) &&
        chunk.length > 0
      ) {
        chunks.push(chunk)
        chunk = []
        tokens = 0
      }
      chunk.push(idx)
      tokens += elemTokens
    }
    if (chunk.length > 0) chunks.push(chunk)
    return chunks
  }

  // Helper to chunk groups
  const getGroupChunks = (): string[][] => {
    const allGroupIds = Array.from(groups.keys())
    if (allGroupIds.length === 0) return [[]]

    const chunks: string[][] = []
    let currentChunk: string[] = []
    let currentTokens = 0

    for (const groupId of allGroupIds) {
      const group = groups.get(groupId)!
      const groupTokens = groupTokenCount(group)

      if (currentTokens + groupTokens > TOKENS_FOR_GROUPS_MAX && currentChunk.length > 0) {
        chunks.push(currentChunk)
        currentChunk = []
        currentTokens = 0
      }

      currentChunk.push(groupId)
      currentTokens += groupTokens
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk)
    }

    return chunks.length > 0 ? chunks : [[]]
  }

  // Process elements against groups and get assignments
  const processChunk = async (
    elementIndices: number[],
    groupIds: string[]
  ): Promise<Array<{ elementIndex: number; label: string }>> => {
    // Get examples from adapter for active learning
    const chunkElements = elementIndices.map((idx) => elements[idx].element)
    const chunkInputStr = JSON.stringify(chunkElements)

    const examples =
      taskId && ctx.adapter
        ? await ctx.adapter.getExamples<string, Array<{ elementIndex: number; label: string }>>({
            input: chunkInputStr.slice(0, 1000), // Limit search string length
            taskType,
            taskId,
          })
        : []

    // Check for exact match (cache hit)

    const key = fastHash(
      stringify({
        taskId,
        taskType,
        input: chunkInputStr,
        instructions: options.instructions ?? '',
        groupIds: groupIds.join(','),
      })
    )

    const exactMatch = examples.find((x) => x.key === key)
    if (exactMatch && exactMatch.output) {
      return exactMatch.output
    }

    const elementsText = elementIndices
      .map((idx, i) => {
        const elem = elements[idx]
        const truncated = tokenizer.truncate(elem.stringified, options.tokensPerElement)
        return `■${i}: ${truncated}■`
      })
      .join('\n')

    const groupLines = groupIds.map((gid) => {
      const g = groups.get(gid)!
      const examples = g.examples.length ? `\n  e.g. ${g.examples.map((e) => `"${e}"`).join(' · ')}` : ''
      return `${g.ref}: ${g.label}${examples}`
    })
    const groupsText =
      groupLines.length > 0
        ? `**${options.newGroups ? 'Existing Groups (prefer reusing these)' : 'Groups'}:**\n${groupLines.join('\n')}\n\n`
        : ''

    // Format examples for few-shot learning
    const exampleMessages: Array<{
      type: 'text'
      role: 'user' | 'assistant'
      content: string
    }> = []

    for (const example of examples.slice(0, 5)) {
      try {
        const exampleInput = JSON.parse(example.input)
        const exampleElements = Array.isArray(exampleInput) ? exampleInput : [exampleInput]

        // User message
        const exampleElementsText = exampleElements
          .map((el, i) => `■${i}: ${stringify(el, false).slice(0, 200)}■`)
          .join('\n')

        exampleMessages.push({
          type: 'text',
          role: 'user',
          content: `Expert Example - Elements to group:
${exampleElementsText}

Group each element.`,
        })

        // Assistant message. Saved outputs are groups ({ label, elements }); older ones may be per-element
        // ({ elementIndex, label }). Either way, render one "■index:label■" line per example element.
        const exampleOutput = example.output as unknown as Array<Record<string, any>>
        // Each saved occurrence takes the next unused equal input, so duplicates get their own index
        const used = new Set<number>()
        const positionOf = (el: unknown) => {
          const key = stringify(el, false)
          const i = exampleElements.findIndex((x, j) => !used.has(j) && stringify(x, false) === key)
          if (i >= 0) used.add(i)
          return i
        }
        const lines = Array.isArray(exampleOutput)
          ? exampleOutput.flatMap((o) =>
              Array.isArray(o.elements)
                ? o.elements.map((el: unknown) => ({
                    index: positionOf(el),
                    label: String(o.label),
                  }))
                : [{ index: Number(o.elementIndex), label: String(o.label) }]
            )
          : []
        const valid = lines
          .filter((l) => Number.isInteger(l.index) && l.index >= 0 && l.label)
          .sort((x, y) => x.index - y.index)
        if (valid.length > 0) {
          const formattedAssignments = valid.map((l) => `■${l.index}:${l.label}■`).join('\n')

          exampleMessages.push({
            type: 'text',
            role: 'assistant',
            content: `${formattedAssignments}\n${END}`,
          })

          if (example.explanation) {
            exampleMessages.push({
              type: 'text',
              role: 'assistant',
              content: `Reasoning: ${example.explanation}`,
            })
          }
        }
      } catch {
        // Skip malformed examples
      }
    }

    const systemPrompt = `You are grouping elements into cohesive groups.

${options.instructions ? `**Instructions:** ${options.instructions}\n` : '**Instructions:** Group similar elements together.'}

**Important:**
- Each element gets exactly ONE group
- To use a listed group, answer with its id (e.g. G3) — do not retype its label
${
  options.newGroups
    ? '- If no listed group fits, write a new short descriptive label instead, and reuse the exact same new label for similar elements'
    : '- You MUST pick one of the listed groups; do not invent new ones'
}
- Only put an element in a group it truly belongs to; if a catch-all group (like "Other") is listed, use it instead of forcing a weak match
- Answer for every element, in order

**Output Format:**
One line per element:
■0:G1■
■1:${options.newGroups ? 'New Group Label' : 'G2'}■
${END}`.trim()

    const userPrompt = `${groupsText}**Elements (■0 to ■${elementIndices.length - 1}):**
${elementsText}

**Task:** For each element, output one line with its group label.
${END}`.trim()

    const { extracted } = await ctx.generateContent({
      systemPrompt,
      stopSequences: [END],
      messages: [...exampleMessages, { type: 'text', role: 'user', content: userPrompt }],
      transform: (text) => {
        const assignments: Array<{ elementIndex: number; label: string }> = []
        const regex = /■(\d+):([^■]+)■/g
        let match: RegExpExecArray | null
        const seen = new Set<number>()
        const unknown: string[] = []

        while ((match = regex.exec(text)) !== null) {
          const idx = parseInt(match[1] ?? '', 10)
          if (isNaN(idx) || idx < 0 || idx >= elementIndices.length) continue

          const answer = (match[2] ?? '').trim()
          if (!answer) continue

          // Answers are group refs (G3) or labels; map refs and near-verbatim labels to the existing group's label
          const gid = resolveGroup(answer)
          if (!gid && (!options.newGroups || /^G\d+$/i.test(answer))) {
            unknown.push(`■${idx}:${answer}■`)
            continue
          }
          seen.add(idx)
          assignments.push({
            elementIndex: elementIndices[idx],
            label: gid ? groups.get(gid)!.label : answer.slice(0, 250),
          })
        }

        // Answers that name no listed group are fed back to the model (ZaiContext retries with this message).
        // Elements the model skipped are not an error here: processChunkComplete re-asks for them on their own.
        if (unknown.length) {
          throw new Error(
            `These answers are not one of the listed group ids: ${unknown.slice(0, 10).join(' ')}. Use an id from the list${options.newGroups ? ' or a new descriptive label' : ''}.`
          )
        }

        return assignments
      },
    })

    return extracted
  }

  // processChunk, then re-ask (up to 2 times) for any element the model skipped or a chunk that failed after its retries,
  // so one bad answer never drops elements or fails the whole operation.
  const processChunkComplete = async (
    elementIndices: number[],
    groupIds: string[],
    depth = 0
  ): Promise<Array<{ elementIndex: number; label: string }>> => {
    let assignments: Array<{ elementIndex: number; label: string }> = []
    try {
      assignments = await processChunk(elementIndices, groupIds)
    } catch (err: unknown) {
      if (ctx.controller.signal.aborted || depth >= 2) throw err
    }
    const answered = new Set(assignments.map((a) => a.elementIndex))
    const missing = elementIndices.filter((idx) => !answered.has(idx))
    if (missing.length && depth < 2) assignments.push(...(await processChunkComplete(missing, groupIds, depth + 1)))
    return assignments
  }

  // Phase 1: Process all element chunks against current groups IN PARALLEL
  const elementLimit = pLimit(options.concurrency) // Separate limiter for element chunks
  const groupLimit = pLimit(options.concurrency) // Separate limiter for group chunks

  // Groups each element was shown (not only the one it was put in), so the review pass only re-asks elements
  // that have not seen every group yet — e.g. groups created by other chunks
  const elementShown = new Map<number, Set<string>>()
  const markShown = (elementIndices: number[], groupIds: string[]) => {
    for (const idx of elementIndices) {
      const shown = elementShown.get(idx) ?? elementShown.set(idx, new Set()).get(idx)!
      groupIds.forEach((gid) => shown.add(gid))
    }
  }

  // Collect all assignments from parallel processing
  const allChunkResults = await Promise.all(
    elementChunks.map((elementChunk) =>
      elementLimit(async () => {
        const groupChunks = getGroupChunks()

        const allAssignments = await Promise.all(
          groupChunks.map((groupChunk) =>
            groupLimit(async () => {
              const assignments = await processChunkComplete(elementChunk, groupChunk)
              markShown(elementChunk, groupChunk)
              return assignments
            })
          )
        )

        return allAssignments.flat()
      })
    )
  )

  // Process all assignments sequentially to avoid race conditions
  for (const assignments of allChunkResults) {
    for (const { elementIndex, label } of assignments) {
      const normalized = normalizeLabel(label)
      let groupId = labelToGroupId.get(normalized)

      if (!groupId) {
        // Create new group
        groupId = addGroup(`group_${groupIdCounter++}`, label)
      }

      // Add element to group
      groupElements.get(groupId)!.add(elementIndex)
      lastAssigned.set(elementIndex, groupId)

      // Track that element saw this group
      if (!elementGroups.has(elementIndex)) {
        elementGroups.set(elementIndex, new Set())
      }
      elementGroups.get(elementIndex)!.add(groupId)
    }
  }

  // Phase 2: Ensure all elements saw all groups (coverage guarantee)
  const allGroupIds = Array.from(groups.keys())

  if (allGroupIds.length > 0) {
    const elementsNeedingReview: number[] = []

    for (const elem of elements) {
      const seenGroups = new Set([...(elementShown.get(elem.index) ?? []), ...(elementGroups.get(elem.index) ?? [])])
      const unseenCount = allGroupIds.filter((gid) => !seenGroups.has(gid)).length

      if (unseenCount > 0 || !elementGroups.has(elem.index)) {
        elementsNeedingReview.push(elem.index)
      }
    }

    if (elementsNeedingReview.length > 0) {
      // Chunk elements needing review
      const reviewChunks: number[][] = []
      let reviewChunk: number[] = []
      let reviewTokens = 0

      for (const elemIdx of elementsNeedingReview) {
        const elem = elements[elemIdx]
        const truncated = tokenizer.truncate(elem.stringified, options.tokensPerElement)
        const elemTokens = tokenizer.count(truncated)

        const shouldStartNewChunk =
          (reviewTokens + elemTokens > TOKENS_FOR_ELEMENTS_MAX || reviewChunk.length >= MAX_ELEMENTS_PER_CHUNK) &&
          reviewChunk.length > 0

        if (shouldStartNewChunk) {
          reviewChunks.push(reviewChunk)
          reviewChunk = []
          reviewTokens = 0
        }

        reviewChunk.push(elemIdx)
        reviewTokens += elemTokens
      }

      if (reviewChunk.length > 0) {
        reviewChunks.push(reviewChunk)
      }

      // Process review chunks IN PARALLEL
      const reviewResults = await Promise.all(
        reviewChunks.map((chunk) =>
          elementLimit(async () => {
            const groupChunks = getGroupChunks()

            const allAssignments = await Promise.all(
              groupChunks.map((groupChunk) => groupLimit(() => processChunkComplete(chunk, groupChunk)))
            )

            return allAssignments.flat()
          })
        )
      )

      // Mark groups as seen and update assignments (sequential to avoid races)
      const updateElementGroupAssignment = (elementIndex: number, label: string) => {
        const normalized = normalizeLabel(label)
        const groupId = labelToGroupId.get(normalized)
        if (!groupId) return

        // Add to group and mark as seen
        groupElements.get(groupId)!.add(elementIndex)
        lastAssigned.set(elementIndex, groupId)

        // Initialize element groups if needed
        const elemGroups = elementGroups.get(elementIndex) ?? new Set()
        if (!elementGroups.has(elementIndex)) {
          elementGroups.set(elementIndex, elemGroups)
        }
        elemGroups.add(groupId)
      }

      for (const assignments of reviewResults) {
        for (const { elementIndex, label } of assignments) {
          updateElementGroupAssignment(elementIndex, label)
        }
      }
    }
  }

  // Phase 3: Resolve conflicts (elements in multiple groups)
  // With several group chunks, each call only saw its own chunk (and with newGroups: false had to pick from it), so an
  // element can hold one candidate per chunk. Ask once more with only its candidates side by side.
  // With a single group chunk the review pass already compared the element against every group, so its answer stands.
  const conflicted = Array.from(elementGroups.entries())
    .filter(([, s]) => s.size > 1)
    .map(([idx]) => idx)
  if (conflicted.length > 0 && getGroupChunks().length > 1) {
    // Candidates left to compare per element. Each round shows at most a group budget's worth of them (always at least
    // two), and the winner carries over against the rest, so an element with many candidates never overflows a prompt.
    const pending = new Map(conflicted.map((idx) => [idx, Array.from(elementGroups.get(idx)!)]))
    const takeRound = (candidates: string[]) => {
      let tokens = 0
      let n = 0
      while (n < candidates.length) {
        const t = groupTokenCount(groups.get(candidates[n]!)!)
        if (n >= 2 && tokens + t > TOKENS_FOR_GROUPS_MAX) break
        tokens += t
        n++
      }
      return candidates.slice(0, n)
    }

    // Batch elements whose round candidates fit together in the group budget
    const batchRound = (round: Map<number, string[]>) => {
      const batches: Array<{ elementIndices: number[]; groupIds: Set<string> }> = []
      for (const chunk of chunkElements(Array.from(round.keys()))) {
        let current = { elementIndices: [] as number[], groupIds: new Set<string>() }
        let tokens = 0
        for (const idx of chunk) {
          const added = round.get(idx)!.filter((gid) => !current.groupIds.has(gid))
          const addedTokens = added.reduce((n, gid) => n + groupTokenCount(groups.get(gid)!), 0)
          if (tokens + addedTokens > TOKENS_FOR_GROUPS_MAX && current.elementIndices.length > 0) {
            batches.push(current)
            current = { elementIndices: [], groupIds: new Set() }
            tokens = 0
          }
          round.get(idx)!.forEach((gid) => current.groupIds.add(gid))
          tokens = Array.from(current.groupIds).reduce((n, gid) => n + groupTokenCount(groups.get(gid)!), 0)
          current.elementIndices.push(idx)
        }
        if (current.elementIndices.length > 0) batches.push(current)
      }
      return batches
    }

    while (Array.from(pending.values()).some((c) => c.length > 1)) {
      const round = new Map<number, string[]>()
      for (const [idx, candidates] of pending) {
        if (candidates.length > 1) round.set(idx, takeRound(candidates))
      }
      const batches = batchRound(round)
      const results = await Promise.all(
        batches.map((b) => groupLimit(() => processChunkComplete(b.elementIndices, Array.from(b.groupIds))))
      )

      // Any group shown in the element's call is a valid choice, even one another element of the batch brought
      const winners = new Map<number, string>()
      batches.forEach((b, i) => {
        for (const { elementIndex, label } of results[i]!) {
          const gid = labelToGroupId.get(normalizeLabel(label))
          if (gid && b.groupIds.has(gid)) winners.set(elementIndex, gid)
        }
      })
      for (const [idx, shown] of round) {
        const winner = winners.get(idx) ?? (shown.includes(lastAssigned.get(idx)!) ? lastAssigned.get(idx)! : shown[0]!)
        groupElements.get(winner)!.add(idx)
        elementGroups.get(idx)!.add(winner)
        lastAssigned.set(idx, winner)
        pending.set(idx, [
          winner,
          ...pending
            .get(idx)!
            .slice(shown.length)
            .filter((gid) => gid !== winner),
        ])
      }
    }
  }

  for (const [elementIndex, groupSet] of elementGroups.entries()) {
    if (groupSet.size > 1) {
      // Element is in multiple groups, keep only the most common assignment
      const groupIds = Array.from(groupSet)

      // Remove from all groups
      for (const gid of groupIds) {
        groupElements.get(gid)?.delete(elementIndex)
      }

      // Keep the latest assignment: the review pass (or the tie-break above) compared the element against every candidate
      const finalGroupId = lastAssigned.get(elementIndex) ?? groupIds[0]
      groupElements.get(finalGroupId)!.add(elementIndex)
    }
  }

  // Every element must end up in a group: ask again for any the model kept skipping, then fail rather than drop it
  const isPlaced = (idx: number) => Array.from(groupElements.values()).some((s) => s.has(idx))
  const unplaced = elements.map((e) => e.index).filter((idx) => !isPlaced(idx))
  if (unplaced.length > 0) {
    const results = await Promise.all(
      chunkElements(unplaced).map((chunk) =>
        elementLimit(async () =>
          (await Promise.all(getGroupChunks().map((gc) => groupLimit(() => processChunkComplete(chunk, gc))))).flat()
        )
      )
    )
    const answer = new Map<number, string>()
    for (const { elementIndex, label } of results.flat()) {
      answer.set(elementIndex, label)
    }
    for (const [elementIndex, label] of answer) {
      const groupId = labelToGroupId.get(normalizeLabel(label)) ?? addGroup(`group_${groupIdCounter++}`, label)
      groupElements.get(groupId)!.add(elementIndex)
    }
    const stillUnplaced = unplaced.filter((idx) => !isPlaced(idx))
    if (stillUnplaced.length > 0) {
      throw new Error(`zai.group: the model did not assign ${stillUnplaced.length} element(s) to a group`)
    }
  }

  // Phase 4: Merge groups if maxGroups is set (AI-driven)
  if (options.maxGroups !== undefined) {
    const nonEmptyGroupIds = () =>
      Array.from(groupElements.entries())
        .filter(([, s]) => s.size > 0)
        .map(([id]) => id)

    let currentIds = nonEmptyGroupIds()

    if (currentIds.length > options.maxGroups) {
      // Build a summary of each group: label + element count + sample elements
      const groupSummaries = currentIds.map((gid, idx) => {
        const info = groups.get(gid)!
        const elemIndices = Array.from(groupElements.get(gid)!)
        const sampleElements = elemIndices
          .slice(0, 3)
          .map((i) => tokenizer.truncate(elements[i].stringified, 60))
          .join(', ')
        return `■${idx}:${info.label} (${elemIndices.length} elements, e.g. ${sampleElements})■`
      })

      const mergeSystemPrompt = `You are consolidating groups into fewer, broader categories.

${options.instructions ? `**Original instructions:** ${options.instructions}\n` : ''}
**Task:** Merge ${currentIds.length} groups down to at most ${options.maxGroups} groups.
Combine the most semantically related groups together. ${options.newGroups ? 'Give each merged group a new descriptive label.' : 'Name each merged group with the exact label of one of the groups it combines (do not invent labels).'}

**Output Format:**
For each input group (■0 to ■${currentIds.length - 1}), output which target label it maps to:
■0:Merged Label■
■1:Merged Label■
${END}

Use the EXACT SAME label for groups that should be merged together.`.trim()

      const mergeUserPrompt = `**Current groups:**
${groupSummaries.join('\n')}

Merge into at most ${options.maxGroups} groups.
${END}`.trim()

      const { extracted: mergeAssignments } = await ctx.generateContent({
        systemPrompt: mergeSystemPrompt,
        stopSequences: [END],
        messages: [{ type: 'text', role: 'user', content: mergeUserPrompt }],
        transform: (text) => {
          const assignments: Array<{ sourceIdx: number; label: string }> = []
          const regex = /■(\d+):([^■]+)■/g
          let match: RegExpExecArray | null

          while ((match = regex.exec(text)) !== null) {
            const idx = parseInt(match[1] ?? '', 10)
            if (isNaN(idx) || idx < 0 || idx >= currentIds.length) continue

            const label = (match[2] ?? '').trim()
            if (!label) continue

            assignments.push({ sourceIdx: idx, label: label.slice(0, 250) })
          }

          return assignments
        },
      })

      // Build merge map: normalized merge label → list of source group IDs
      const mergeMap = new Map<string, { label: string; sourceGroupIds: string[] }>()

      for (const { sourceIdx, label } of mergeAssignments) {
        const sourceGid = currentIds[sourceIdx]
        if (!sourceGid) continue

        const normalized = normalizeLabel(label)
        if (!mergeMap.has(normalized)) {
          mergeMap.set(normalized, { label, sourceGroupIds: [] })
        }
        mergeMap.get(normalized)!.sourceGroupIds.push(sourceGid)
      }

      // Apply merges: for each merge target, pick the first source group as the target
      // and move all elements from other source groups into it
      for (const [, { label, sourceGroupIds }] of mergeMap) {
        if (sourceGroupIds.length <= 1) continue

        // With newGroups: false the labels are a fixed list: merge into the source group the model named
        // (or the largest one) and keep its label
        const named = sourceGroupIds.find((gid) => groups.get(gid)!.normalizedLabel === normalizeLabel(label))
        const targetGid = options.newGroups
          ? sourceGroupIds[0]
          : (named ??
            sourceGroupIds.reduce((a, b) => (groupElements.get(a)!.size >= groupElements.get(b)!.size ? a : b)))
        const targetSet = groupElements.get(targetGid)!

        if (options.newGroups) Object.assign(groups.get(targetGid)!, { label, normalizedLabel: normalizeLabel(label) })

        for (const sourceGid of sourceGroupIds.filter((gid) => gid !== targetGid)) {
          const sourceSet = groupElements.get(sourceGid)!
          sourceSet.forEach((elemIdx) => targetSet.add(elemIdx))
          sourceSet.clear()
        }
      }

      // Safety: if LLM still produced too many groups, fall back to merging smallest pairs
      currentIds = nonEmptyGroupIds()
      while (currentIds.length > options.maxGroups) {
        currentIds.sort((a, b) => groupElements.get(a)!.size - groupElements.get(b)!.size)

        const sourceSet = groupElements.get(currentIds[0])!
        const targetSet = groupElements.get(currentIds[1])!
        for (const elemIdx of sourceSet) {
          targetSet.add(elemIdx)
        }
        sourceSet.clear()

        currentIds = nonEmptyGroupIds()
      }
    }
  }

  // Phase 5: Redistribute undersized groups if minElements is set
  // Reuses processChunk so orphans see the valid groups as available buckets
  // With newGroups: false and every populated group undersized there is no listed group left to move orphans into,
  // so the assignments are kept as they are.
  const minElements = options.minElements
  const everyGroupUndersized =
    minElements !== undefined && Array.from(groupElements.values()).every((s) => s.size === 0 || s.size < minElements)
  if (minElements !== undefined && minElements > 1 && (options.newGroups || !everyGroupUndersized)) {
    const getNonEmptyGroupIds = () =>
      Array.from(groupElements.entries())
        .filter(([, s]) => s.size > 0)
        .map(([id]) => id)

    // Collect orphan elements from all undersized groups
    const orphanIndices: number[] = []

    for (const gid of getNonEmptyGroupIds()) {
      const elemSet = groupElements.get(gid)!
      if (elemSet.size > 0 && elemSet.size < options.minElements) {
        for (const idx of elemSet) {
          orphanIndices.push(idx)
        }
        elemSet.clear()
      }
    }

    if (orphanIndices.length > 0) {
      // Valid groups = everything that's still non-empty (i.e. above minElements)
      const validGroupIds = getNonEmptyGroupIds()

      // Chunk orphans and run them through processChunk with only valid groups visible
      const orphanChunks: number[][] = []
      let currentOrphanChunk: number[] = []
      let currentOrphanTokens = 0

      for (const elemIdx of orphanIndices) {
        const elem = elements[elemIdx]
        const truncated = tokenizer.truncate(elem.stringified, options.tokensPerElement)
        const elemTokens = tokenizer.count(truncated)

        if (
          (currentOrphanTokens + elemTokens > TOKENS_FOR_ELEMENTS_MAX ||
            currentOrphanChunk.length >= MAX_ELEMENTS_PER_CHUNK) &&
          currentOrphanChunk.length > 0
        ) {
          orphanChunks.push(currentOrphanChunk)
          currentOrphanChunk = []
          currentOrphanTokens = 0
        }

        currentOrphanChunk.push(elemIdx)
        currentOrphanTokens += elemTokens
      }

      if (currentOrphanChunk.length > 0) {
        orphanChunks.push(currentOrphanChunk)
      }

      // Process orphan chunks against valid groups (reuses the same processChunk as Phase 1)
      const orphanResults = await Promise.all(
        orphanChunks.map((chunk) =>
          elementLimit(async () => {
            // If there are valid groups, chunk them; otherwise pass empty so LLM creates new groups
            const groupChunksForOrphans = validGroupIds.length > 0 ? getGroupChunks() : [[]]

            const allAssignments = await Promise.all(
              groupChunksForOrphans
                .filter((gc) => gc.length === 0 || gc.some((gid) => validGroupIds.includes(gid)))
                .map((groupChunk) => {
                  // Only show valid groups (exclude the orphaned/undersized ones)
                  const filteredGroupChunk = groupChunk.filter((gid) => validGroupIds.includes(gid))
                  return groupLimit(() => processChunkComplete(chunk, filteredGroupChunk))
                })
            )

            return allAssignments.flat()
          })
        )
      )

      // Apply assignments
      const flatAssignments = orphanResults.flat()
      for (const { elementIndex, label } of flatAssignments) {
        const normalized = normalizeLabel(label)
        let groupId = labelToGroupId.get(normalized)

        if (!groupId) {
          groupId = addGroup(`group_${groupIdCounter++}`, label)
        }
        groupElements.get(groupId)!.add(elementIndex)
      }

      // Safety: any orphans the LLM missed get placed into the largest group
      const isAssigned = (idx: number) => {
        for (const [, elemSet] of groupElements) {
          if (elemSet.has(idx)) return true
        }
        return false
      }
      const unassigned = orphanIndices.filter((idx) => !isAssigned(idx))
      const placeIntoLargest = (indices: number[]) => {
        const allNonEmpty = getNonEmptyGroupIds()
        if (allNonEmpty.length === 0) return
        const largestGid = allNonEmpty.reduce((a, b) =>
          groupElements.get(a)!.size >= groupElements.get(b)!.size ? a : b
        )
        for (const idx of indices) {
          groupElements.get(largestGid)!.add(idx)
        }
      }

      if (unassigned.length > 0) {
        placeIntoLargest(unassigned)
      }

      // Second pass: if any groups are still undersized after redistribution,
      // merge their elements into the largest group
      const mergeUndersizedGroups = () => {
        const allNonEmpty = getNonEmptyGroupIds()
        if (allNonEmpty.length <= 1) return false

        const largestGid = allNonEmpty.reduce((a, b) =>
          groupElements.get(a)!.size >= groupElements.get(b)!.size ? a : b
        )
        const targetSet = groupElements.get(largestGid)!
        let merged = false

        for (const gid of allNonEmpty) {
          if (gid === largestGid) continue
          const elemSet = groupElements.get(gid)!
          if (elemSet.size > 0 && elemSet.size < options.minElements) {
            elemSet.forEach((idx) => targetSet.add(idx))
            elemSet.clear()
            merged = true
          }
        }
        return merged
      }

      while (mergeUndersizedGroups()) {
        // keep merging until no undersized groups remain
      }
    }
  }

  // Build final result
  const result: Array<Group<T>> = []

  for (const [groupId, elementIndices] of groupElements.entries()) {
    if (elementIndices.size > 0) {
      const groupInfo = groups.get(groupId)!
      result.push({
        id: groupInfo.id,
        label: groupInfo.label,
        elements: Array.from(elementIndices).map((idx) => elements[idx].element),
      })
    }
  }

  // Save example for active learning
  if (taskId && ctx.adapter && !ctx.controller.signal.aborted) {
    const key = fastHash(
      stringify({
        taskId,
        taskType,
        input: JSON.stringify(input),
        instructions: options.instructions ?? '',
      })
    )

    // Build output format for saving
    const outputAssignments: Array<{ elementIndex: number; label: string }> = []
    for (const [groupId, elementIndices] of groupElements.entries()) {
      const groupInfo = groups.get(groupId)!
      for (const idx of elementIndices) {
        outputAssignments.push({
          elementIndex: idx,
          label: groupInfo.label,
        })
      }
    }

    // Note: We don't have direct access to usage metadata here since it's distributed
    // across many parallel operations. We'll use default values.
    await ctx.adapter.saveExample({
      key,
      taskType,
      taskId,
      input: JSON.stringify(input),
      output: result,
      instructions: options.instructions ?? '',
      metadata: {
        cost: { input: 0, output: 0 },
        latency: 0,
        model: ctx.modelName,
        tokens: { input: 0, output: 0 },
      },
    })
  }

  return result
}

Zai.prototype.group = function <T>(
  this: Zai,
  input: Array<T>,
  _options?: Options
): Response<Array<Group<T>>, Record<string, T[]>> {
  const context = new ZaiContext({
    client: this.client,
    modelId: this.Model,
    taskId: this.taskId,
    taskType: 'zai.group',
    adapter: this.adapter,
    memoizer: this._resolveMemoizer(),
    metadata: this.metadata,
  })

  return new Response<Array<Group<T>>, Record<string, T[]>>(context, group(input, _options, context), (result) => {
    const merged: Record<string, T[]> = {}
    result.forEach((group) => {
      if (!merged[group.label]) {
        merged[group.label] = []
      }
      merged[group.label].push(...group.elements)
    })
    return merged
  })
}
