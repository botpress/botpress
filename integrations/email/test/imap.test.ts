import { assert, expect, test, it } from 'vitest'
import { getPageFromEnd } from '../src/imap'
import * as sdk from '@botpress/sdk'

test('getPageFromEnd with with zero messages throws', () => {
  expect(() => getPageFromEnd({ page: 0, perPage: 50, totalMessages: 0 })).toThrow(sdk.RuntimeError)
})

test('getPageFromEnd with single element returns single element', () => {
  expect(getPageFromEnd({ page: 0, perPage: 50, totalMessages: 1 })).toBe('1:1')
})

test('getPageFromEnd with partial page returns all elements', () => {
  expect(getPageFromEnd({ page: 0, perPage: 50, totalMessages: 13 })).toBe('1:13')
})

test('getPageFromEnd with full page returns first page', () => {
  expect(getPageFromEnd({ page: 0, perPage: 50, totalMessages: 300 })).toBe('251:300')
})

test('getPageFromEnd with multiple pages on next page returns next page', () => {
  expect(getPageFromEnd({ page: 1, perPage: 50, totalMessages: 300 })).toBe('201:250')
})
