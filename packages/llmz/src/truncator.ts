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

export function wrapContent(content: string, options?: Partial<TruncateOptions>): string {
  const preserve: TruncateOptions['preserve'] = options?.preserve ?? DEFAULT_TRUNCATE_OPTIONS.preserve
  const flex: TruncateOptions['flex'] = options?.flex ?? DEFAULT_TRUNCATE_OPTIONS.flex
  const minTokens: TruncateOptions['minTokens'] = options?.minTokens ?? DEFAULT_TRUNCATE_OPTIONS.minTokens
  return `${WRAP_OPEN_TAG_1} preserve:${preserve} flex:${flex} min:${minTokens} ${WRAP_OPEN_TAG_2}${content}${WRAP_CLOSE_TAG}`
}

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
