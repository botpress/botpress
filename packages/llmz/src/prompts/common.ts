import Handlebars from 'handlebars'
import { StreamingMessageParser } from '../message-stream/parser.js'
import type { ParsedItem } from '../message-stream/types.js'
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
export const toParsedAssistantResponse = (items: ParsedItem[], raw: string): ParsedAssistantResponse => {
  const sends = items
    .filter((item) => item.kind === 'send')
    .map((item) => ({ name: item.name, props: item.props, body: item.body }))

  const run = items.find((item) => item.kind === 'run')
  const next = items.find((item) => item.kind === 'next' && item.status !== 'invalid')

  return {
    raw,
    items,
    sends,
    code: run?.body?.trim() || undefined,
    next: next ? { name: next.name, props: next.props } : undefined,
  }
}

export const parseAssistantResponse = (response: string): ParsedAssistantResponse => {
  const parser = new StreamingMessageParser()
  parser.push(stripWrappingFences(response))
  parser.finish()

  return toParsedAssistantResponse(parser.items, response)
}

export const replacePlaceholders = (prompt: string, values: Record<string, unknown>) => {
  const regex = new RegExp('■■■([A-Z0-9_\\.-]+)■■■', 'gi')
  const obj = Object.assign({}, values)

  const compile = Handlebars.compile(prompt)

  const compiled = compile({
    is_message_enabled: false,
    ...values,
  })

  const replaced = compiled.replace(regex, (_match, name) => {
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
