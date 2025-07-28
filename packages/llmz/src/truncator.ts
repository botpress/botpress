import { LLMzPrompts } from './prompts/prompt.js'
import { getTokenizer } from './utils.js'

type MessageLike = LLMzPrompts.Message

type Options<T> = {
  messages: T[]
  tokenLimit: number
  throwOnFailure?: boolean
}

const DEFAULT_REMOVE_CHUNK = 250
const WRAP_OPEN_TAG_1 = '【TRUNCATE'
const WRAP_OPEN_TAG_2 = '】'
const WRAP_CLOSE_TAG = '【/TRUNCATE】'
const getRegex = () =>
  new RegExp(`(${WRAP_OPEN_TAG_1}(?:\\s+[\\w:]+)*\\s*${WRAP_OPEN_TAG_2})([\\s\\S]*?)(${WRAP_CLOSE_TAG})`, 'g')

type TruncateOptions = {
  preserve: 'top' | 'bottom' | 'both'
  /**
   * A number of 2 means that the content can shrink twice as much as the other parts
   * @default: 1
   * */
  flex: number
  /** If provided, the message will never truncate below that number */
  minTokens: number
}

const DEFAULT_TRUNCATE_OPTIONS: TruncateOptions = {
  preserve: 'top',
  flex: 1,
  minTokens: 0,
}

/**
 * Wraps content with truncation tags to mark it as truncatable when using `truncateWrappedContent`.
 * 
 * This function encases the provided content within special truncation tags that contain metadata
 * about how the content should be truncated. The wrapped content becomes eligible for intelligent
 * truncation while preserving non-wrapped content intact.
 * 
 * @param content - The string content to wrap with truncation tags
 * @param options - Optional truncation configuration
 * @param options.preserve - Which part of the content to preserve when truncating:
 *   - 'top': Keep the beginning, remove from the end (default)
 *   - 'bottom': Keep the end, remove from the beginning  
 *   - 'both': Keep both ends, remove from the middle
 * @param options.flex - Priority factor for truncation (default: 1). Higher values make this
 *   content more likely to be truncated. A flex of 2 means this content can shrink twice as
 *   much as content with flex of 1.
 * @param options.minTokens - Minimum number of tokens to preserve (default: 0). Content will
 *   never be truncated below this threshold.
 * 
 * @returns The content wrapped with truncation tags and embedded metadata
 * 
 * @example
 * ```typescript
 * // Basic usage - content will be truncated from the end if needed
 * const wrapped = wrapContent("This is some long content that might need truncation")
 * 
 * // Preserve the end of the content
 * const bottomPreserved = wrapContent("Error log: ... important error details", { 
 *   preserve: 'bottom' 
 * })
 * 
 * // High priority for truncation with minimum preservation
 * const flexible = wrapContent("Optional context information", { 
 *   flex: 3, 
 *   minTokens: 50 
 * })
 * ```
 */
export function wrapContent(content: string, options?: Partial<TruncateOptions>): string {
  const preserve: TruncateOptions['preserve'] = options?.preserve ?? DEFAULT_TRUNCATE_OPTIONS.preserve
  const flex: TruncateOptions['flex'] = options?.flex ?? DEFAULT_TRUNCATE_OPTIONS.flex
  const minTokens: TruncateOptions['minTokens'] = options?.minTokens ?? DEFAULT_TRUNCATE_OPTIONS.minTokens
  return `${WRAP_OPEN_TAG_1} preserve:${preserve} flex:${flex} min:${minTokens} ${WRAP_OPEN_TAG_2}${content}${WRAP_CLOSE_TAG}`
}

/**
 * Intelligently truncates message content to fit within a token limit while preserving important parts.
 * 
 * This function processes an array of messages and reduces their total token count to fit within the
 * specified limit. It only truncates content that has been wrapped with `wrapContent()`, leaving
 * unwrapped content completely intact. The truncation algorithm prioritizes content based on flex
 * values and respects preservation preferences and minimum token requirements.
 * 
 * ## How it works:
 * 1. **Parsing**: Scans each message for wrapped content sections and unwrapped sections
 * 2. **Token counting**: Calculates tokens for each section using the configured tokenizer
 * 3. **Prioritization**: Identifies the largest truncatable sections based on flex values
 * 4. **Intelligent truncation**: Removes content according to preservation preferences
 * 5. **Reconstruction**: Rebuilds messages with truncated content and removes wrapper tags
 * 
 * ## Truncation strategy:
 * - **Priority**: Higher flex values = higher truncation priority
 * - **Minimum tokens**: Content is never truncated below its `minTokens` threshold
 * - **Preservation modes**:
 *   - `'top'`: Removes from the end, keeps the beginning
 *   - `'bottom'`: Removes from the beginning, keeps the end
 *   - `'both'`: Removes from the middle, keeps both ends
 * 
 * @template T - Type extending MessageLike (must have a content property)
 * @param options - Configuration object
 * @param options.messages - Array of messages to truncate
 * @param options.tokenLimit - Maximum total tokens allowed across all messages
 * @param options.throwOnFailure - Whether to throw an error if truncation fails (default: true).
 *   If false, returns the best effort result even if over the token limit.
 * 
 * @returns Array of messages with content truncated to fit the token limit
 * 
 * @throws Error if unable to truncate enough content to meet the token limit (when throwOnFailure is true)
 * 
 * @example
 * ```typescript
 * const messages = [
 *   { 
 *     role: 'system', 
 *     content: 'You are a helpful assistant. ' + wrapContent('Here is some background info...', { flex: 2 })
 *   },
 *   { 
 *     role: 'user', 
 *     content: 'Please help me with: ' + wrapContent('detailed context and examples', { preserve: 'both' })
 *   }
 * ]
 * 
 * // Truncate to fit within 1000 tokens
 * const truncated = truncateWrappedContent({
 *   messages,
 *   tokenLimit: 1000,
 *   throwOnFailure: false
 * })
 * 
 * // The system message background info will be truncated first (higher flex),
 * // and user context will be truncated from the middle if needed (preserve: 'both')
 * ```
 */
export function truncateWrappedContent<T extends MessageLike>({
  messages,
  tokenLimit,
  throwOnFailure = true,
}: Options<T>): T[] {
  const tokenizer = getTokenizer()

  type Part = {
    /** the current remaining content */
    content: string
    /** the current remaining tokens */
    tokens: number
    /** if part is inside a <WRAPPER></WRAPPER> tag, then it's truncatable. when outside the wrapper, it's not truncatable */
    truncatable: boolean
    attributes?: Partial<TruncateOptions>
  }

  /**
   * Before                      { content: 'content', tokens: 10, truncatable: false }
   * <WRAPPER>content</WRAPPER>  { content: 'content', tokens: 10, truncatable: true }
   * After                       { content: 'content', tokens: 10, truncatable: false }
   */

  const parts: Array<Part[]> = []

  // Split messages into parts and calculate initial tokens
  for (const msg of messages) {
    const current: Part[] = []

    const content = typeof msg.content === 'string' ? msg.content : ''
    let match
    const regex = getRegex()
    let lastIndex = 0

    while ((match = regex.exec(content)) !== null) {
      // Extract attributes from the open tag
      const attributes = match[1]!
        .split(/\s+/)
        .slice(1)
        .filter((x) => x !== WRAP_OPEN_TAG_2)
        .map((x) => x.split(':'))
        .reduce((acc, [key, value]) => ({ ...acc, [key!]: value }), {} as Record<string, any>)

      if (match.index > lastIndex) {
        const nonTruncatableContent = content.slice(lastIndex, match.index)
        current.push({
          content: nonTruncatableContent,
          tokens: tokenizer.count(nonTruncatableContent),
          truncatable: false,
        })
      }

      const wrappedContent = match[2]
      current.push({
        content: wrappedContent!,
        tokens: tokenizer.count(wrappedContent!),
        truncatable: true,
        attributes: {
          preserve: attributes.preserve as TruncateOptions['preserve'],
          flex: Number(attributes.flex) || DEFAULT_TRUNCATE_OPTIONS.flex,
          minTokens: Number(attributes.min) || DEFAULT_TRUNCATE_OPTIONS.minTokens,
        },
      })

      lastIndex = regex.lastIndex
    }

    if (lastIndex < content.length) {
      const remainingContent = content.slice(lastIndex)
      current.push({
        content: remainingContent,
        tokens: tokenizer.count(remainingContent),
        truncatable: false,
      })
    }

    parts.push(current)
  }

  const getCount = () => parts.reduce((acc, x) => acc + x.reduce((acc, y) => acc + y.tokens, 0), 0)
  const getTwoBiggestTruncatables = () => {
    let biggest: Part | null = null
    let secondBiggest: Part | null = null

    for (const part of parts.flat()) {
      if (part.truncatable) {
        const flex = part.attributes?.flex ?? DEFAULT_TRUNCATE_OPTIONS.flex
        const tokens = part.tokens * flex

        if (part.tokens <= (part.attributes?.minTokens ?? 0)) {
          continue
        }

        if (!biggest || tokens > biggest.tokens) {
          secondBiggest = biggest
          biggest = part
        } else if (!secondBiggest || tokens > secondBiggest.tokens) {
          secondBiggest = part
        }
      }
    }

    return { biggest, secondBiggest }
  }

  let currentCount = getCount()
  while (currentCount > tokenLimit) {
    const { biggest, secondBiggest } = getTwoBiggestTruncatables()

    if (!biggest || !biggest.truncatable || biggest.tokens <= 0) {
      if (throwOnFailure) {
        throw new Error(`Cannot truncate further, current count: ${getCount()}`)
      } else {
        break
      }
    }

    const delta = Math.max(biggest.tokens - (secondBiggest?.tokens ?? 0), DEFAULT_REMOVE_CHUNK)
    const room = Math.min(delta, biggest.tokens)
    let toRemove = Math.min(room, currentCount - tokenLimit)

    if (toRemove <= 0) {
      if (throwOnFailure) {
        throw new Error(`Cannot truncate further, current count: ${getCount()}`)
      } else {
        break
      }
    }

    if (biggest.tokens - toRemove < (biggest.attributes?.minTokens ?? 0)) {
      toRemove = biggest.tokens - (biggest.attributes?.minTokens ?? 0)
    }

    const preserve = biggest.attributes?.preserve ?? DEFAULT_TRUNCATE_OPTIONS.preserve
    const split = tokenizer.split(biggest.content)

    if (preserve === 'bottom') {
      biggest.content = split.slice(toRemove).join('')
    } else if (preserve === 'top') {
      biggest.content = split.slice(0, -toRemove).join('')
    } else {
      // Preserve both top and bottom
      // Remove from the middle-out
      const anchor = Math.ceil(split.length / 2)
      const radius = Math.ceil(toRemove / 2)
      const left = anchor - radius
      const right = anchor + radius
      biggest.content = split.slice(0, left).join('') + split.slice(right).join('')
    }

    biggest.tokens -= toRemove
    currentCount -= toRemove
  }

  const removeRedundantWrappers = (content: string) => {
    return content.replace(getRegex(), '$2')
  }

  // Reconstruct the messages
  return messages.map((msg, i) => {
    const p = parts[i]!
    return {
      ...msg,
      content:
        typeof msg.content === 'string'
          ? removeRedundantWrappers(
              p
                .map((part) => {
                  if (part.truncatable) {
                    return part.content
                  }

                  return part.content
                })
                .join('')
            )
          : msg.content,
    }
  })
}
