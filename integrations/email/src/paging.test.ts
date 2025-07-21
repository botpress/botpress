import { expect, test } from 'vitest'
import { pageToSpan, Span } from './paging'
import * as sdk from '@botpress/sdk'

test('pageToSpan with with zero messages throws', () => {
  expect(() => pageToSpan({ page: 0, perPage: 50, totalElements: 0 })).toThrow(sdk.RuntimeError)
})

test('pageToSpan with single element returns single element', () => {
  expect(pageToSpan({ page: 0, perPage: 50, totalElements: 1 })).toEqual({
    firstElementIndex: 1,
    lastElementIndex: 1,
  } satisfies Span)
})

test('pageToSpan with partial page returns all elements', () => {
  expect(pageToSpan({ page: 0, perPage: 50, totalElements: 13 })).toEqual({
    firstElementIndex: 1,
    lastElementIndex: 13,
  } satisfies Span)
})

test('pageToSpan with full page returns first page', () => {
  expect(pageToSpan({ page: 0, perPage: 50, totalElements: 300 })).toEqual({
    firstElementIndex: 251,
    lastElementIndex: 300,
  } satisfies Span)
})

test('pageToSpan with multiple pages on next page returns next page', () => {
  expect(pageToSpan({ page: 1, perPage: 50, totalElements: 300 })).toEqual({
    firstElementIndex: 201,
    lastElementIndex: 250,
  } satisfies Span)
})
