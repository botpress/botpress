/**
 * @jest-environment jsdom
 */
import { MessageType } from 'typings'
import { isSupportedMessageType, messageTypes } from './utils'

test('isSupportedMessageType', () => {
  expect(messageTypes).toBeTruthy()
  for (const type in messageTypes) {
    expect(isSupportedMessageType(type as string)).toBe(true)
    expect(isSupportedMessageType(type as MessageType)).toBe(true)
  }
  expect(isSupportedMessageType('foo')).toBe(false)
})
