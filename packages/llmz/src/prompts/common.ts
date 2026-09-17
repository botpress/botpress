import { hasTopLevelReturn } from '../compiler/index.js'
import { StreamingMessageParser } from '../message-stream/parser.js'
import type { Diagnostic, ParsedItem } from '../message-stream/types.js'
import { ParsedAssistantResponse } from './prompt.js'

/** Strips wrapping code fences the model may have added around the whole response. */
const stripWrappingFences = (text: string): string =>
  text
    .trim()
    .split('\n')
    .filter((line, index, arr) => {
      const isFirstOrLastLine = index === 0 || index === arr.length - 1
      if (isFirstOrLastLine && line.trim().startsWith('```')) {
        return false
      }
      return true
    })
    .join('\n')

/** Builds a {@link ParsedAssistantResponse} from parsed protocol items. */
export const toParsedAssistantResponse = (
  items: ParsedItem[],
  raw: string,
  diagnostics: Diagnostic[] = []
): ParsedAssistantResponse => {
  const runIndex = items.findIndex((item) => item.kind === 'run')
  const run = items[runIndex]
  const awaitsResult = !!run?.body && hasTopLevelReturn(run.body)
  const prematureSends = awaitsResult ? items.slice(runIndex + 1).filter((item) => item.kind === 'send') : []
  const sends = items
    .filter((item, index) => item.kind === 'send' && (!awaitsResult || index < runIndex))
    .map((item) => ({ name: item.name, props: item.props, body: item.body }))

  const next = items.find((item) => item.kind === 'next' && item.status !== 'invalid')

  return {
    raw,
    items,
    diagnostics: [
      ...diagnostics,
      ...prematureSends.map(
        (item): Diagnostic => ({
          code: 'send-after-run',
          itemId: item.id,
          message:
            'Discarded a message generated after code returning a result, before that result was available to the model.',
        })
      ),
    ],
    sends,
    code: run?.body?.trim() || undefined,
    next: next ? { name: next.name, props: next.props } : undefined,
  }
}

export const parseAssistantResponse = (response: string): ParsedAssistantResponse => {
  const parser = new StreamingMessageParser()
  parser.push(stripWrappingFences(response))
  parser.finish()

  return toParsedAssistantResponse(parser.items, response, parser.diagnostics)
}

export const replacePlaceholders = (prompt: string, values: Record<string, unknown>) => {
  const regex = new RegExp('■■■([A-Z0-9_\\.-]+)■■■', 'gi')
  const obj = Object.assign({}, values)

  const replaced = prompt.replace(regex, (_match, name) => {
    if (name in values) {
      delete obj[name]
      return typeof values[name] === 'string' ? (values[name] as string) : JSON.stringify(values[name])
    } else {
      throw new Error(`Placeholder not found: ${name}`)
    }
  })

  const remaining = Object.keys(obj).filter(
    (key) => key !== 'is_message_enabled' && key !== 'exits' && key !== 'components' && key !== 'transcript'
  )

  if (remaining.length) {
    throw new Error(`Missing placeholders: ${remaining.join(', ')}`)
  }

  return replaced.replace(/\n{3,}/g, '\n\n').trim()
}
