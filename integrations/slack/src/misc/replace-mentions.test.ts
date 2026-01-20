import { test, expect, vi } from 'vitest'
import { replaceMentions, Mention } from './replace-mentions'

test('returns undefined if text is undefined', () => {
  expect(replaceMentions(undefined, [])).toBeUndefined()
})

test('returns text unchanged if mentions is undefined', () => {
  expect(replaceMentions('hey <@John Doe>', undefined)).toBe('hey <@John Doe>')
})

test('replaces a single mention', () => {
  const mentions: Mention[] = [{ start: 6, end: 10, user: { id: 'u1', name: 'John Doe' } }]
  expect(replaceMentions('hey <@John Doe>', mentions)).toBe('hey <@u1>')
})

test('replaces multiple mentions', () => {
  const mentions: Mention[] = [
    { start: 0, end: 5, user: { id: 'u1', name: 'John Doe' } },
    { start: 6, end: 11, user: { id: 'u2', name: 'Jane Doe' } },
  ]
  expect(replaceMentions('hey <@John Doe> and <@Jane Doe>', mentions)).toBe('hey <@u1> and <@u2>')
})

test('does not replace if user name not found', () => {
  const mentions: Mention[] = [{ start: 0, end: 4, user: { id: 'u1', name: 'nope' } }]
  expect(replaceMentions('hey <@John Doe>', mentions)).toBe('hey <@John Doe>')
})

test('only replaces the first occurrence of a repeated name', () => {
  const mentions: Mention[] = [{ start: 0, end: 4, user: { id: 'u1', name: 'John Doe' } }]
  expect(replaceMentions('<@John Doe> <@John Doe> <@John Doe>', mentions)).toBe('<@u1> <@John Doe> <@John Doe>')
})
