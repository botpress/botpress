import { expect, test, vi } from 'vitest'
import { UnknownComponentError } from '../errors.js'
import { withMissingMember } from './member-proxy.js'

test('the component proxy preserves methods and catches computed, inherited and destructured missing names', () => {
  const send = vi.fn()
  const chat = withMissingMember({ card: send } as Record<string, typeof send>, (name) => {
    throw new UnknownComponentError(name, ['card'])
  })
  chat.card!({ title: 'Hello' })
  expect(send).toHaveBeenCalledOnce()
  for (const name of ['doesNotExist', 'constructor', 'toString', '__proto__']) {
    expect(() => chat[name]).toThrow(UnknownComponentError)
  }

  expect(() => {
    const { missing } = chat
    return missing
  }).toThrow(UnknownComponentError)
  expect(Object.keys(chat)).toEqual(['card'])
  expect(Object.isFrozen(chat)).toBe(true)
  expect(chat[Symbol.toStringTag as never]).toBeUndefined()
})
