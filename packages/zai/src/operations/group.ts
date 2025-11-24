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
}

const _Options = z.object({
  instructions: z.string().optional(),
  tokensPerElement: z.number().min(1).max(100_000).optional().default(250),
  chunkLength: z.number().min(100).max(100_000).optional().default(16_000),
  initialGroups: z.array(_InitialGroup).optional().default([]),
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
    group<T>(input: Array<T>, options?: Options): Response<Array<Group<T>>, Record<string, T[]>>
  }
}

const END = '■END■'

// Simplified data structures
type GroupInfo = {
  id: string
  label: string
  normalizedLabel: string
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
  let groupIdCounter = 0

  // Initialize with provided groups
  options.initialGroups.forEach((ig) => {
    const normalized = normalizeLabel(ig.label)
    groups.set(ig.id, { id: ig.id, label: ig.label, normalizedLabel: normalized })
    groupElements.set(ig.id, new Set())
    labelToGroupId.set(normalized, ig.id)
  })

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
  const MAX_ELEMENTS_PER_CHUNK = 50
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

  // Helper to chunk groups
  const getGroupChunks = (): string[][] => {
    const allGroupIds = Array.from(groups.keys())
    if (allGroupIds.length === 0) return [[]]

    const chunks: string[][] = []
    let currentChunk: string[] = []
    let currentTokens = 0

    for (const groupId of allGroupIds) {
      const group = groups.get(groupId)!
      const groupTokens = tokenizer.count(`${group.label}`) + 10

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

    const groupsList = groupIds.map((gid) => groups.get(gid)!.label)
    const groupsText =
      groupsList.length > 0
        ? `**Existing Groups (prefer reusing these):**\n${groupsList.map((l) => `- ${l}`).join('\n')}\n\n`
        : ''

    // Format examples for few-shot learning
    const exampleMessages: Array<{ type: 'text'; role: 'user' | 'assistant'; content: string }> = []

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

        // Assistant message
        const exampleOutput = example.output
        if (Array.isArray(exampleOutput) && exampleOutput.length > 0) {
          const formattedAssignments = exampleOutput
            .map((assignment) => `■${assignment.elementIndex}:${assignment.label}■`)
            .join('\n')

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
- Each element gets exactly ONE group label
- Use EXACT SAME label for similar items (case-sensitive)
- Create new descriptive labels when needed

**Output Format:**
One line per element:
■0:Group Label■
■1:Group Label■
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

        while ((match = regex.exec(text)) !== null) {
          const idx = parseInt(match[1] ?? '', 10)
          if (isNaN(idx) || idx < 0 || idx >= elementIndices.length) continue

          const label = (match[2] ?? '').trim()
          if (!label) continue

          assignments.push({
            elementIndex: elementIndices[idx],
            label: label.slice(0, 250),
          })
        }

        return assignments
      },
    })

    return extracted
  }

  // Phase 1: Process all element chunks against current groups IN PARALLEL
  const elementLimit = pLimit(10) // Separate limiter for element chunks
  const groupLimit = pLimit(10) // Separate limiter for group chunks

  // Collect all assignments from parallel processing
  const allChunkResults = await Promise.all(
    elementChunks.map((elementChunk) =>
      elementLimit(async () => {
        const groupChunks = getGroupChunks()

        const allAssignments = await Promise.all(
          groupChunks.map((groupChunk) => groupLimit(() => processChunk(elementChunk, groupChunk)))
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
        groupId = `group_${groupIdCounter++}`
        groups.set(groupId, { id: groupId, label, normalizedLabel: normalized })
        groupElements.set(groupId, new Set())
        labelToGroupId.set(normalized, groupId)
      }

      // Add element to group
      groupElements.get(groupId)!.add(elementIndex)

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
      const seenGroups = elementGroups.get(elem.index) ?? new Set()
      const unseenCount = allGroupIds.filter((gid) => !seenGroups.has(gid)).length

      if (unseenCount > 0) {
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
              groupChunks.map((groupChunk) => groupLimit(() => processChunk(chunk, groupChunk)))
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
  for (const [elementIndex, groupSet] of elementGroups.entries()) {
    if (groupSet.size > 1) {
      // Element is in multiple groups, keep only the most common assignment
      const groupIds = Array.from(groupSet)

      // Remove from all groups
      for (const gid of groupIds) {
        groupElements.get(gid)?.delete(elementIndex)
      }

      // Re-assign to first group (or could use LLM to decide)
      const finalGroupId = groupIds[0]
      groupElements.get(finalGroupId)!.add(elementIndex)
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
        model: ctx.modelId,
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
