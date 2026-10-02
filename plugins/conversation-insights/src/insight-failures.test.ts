import { HttpError } from '@botpress/cognitive'
import * as sdk from '@botpress/sdk'
import { describe, it } from 'vitest'
import { isCognitiveUnreachable, resolveInsightTagsAfterFailure } from './insight-failures'

const createHttpErrorWithStatus = (status: number) =>
  new HttpError(`HTTP ${status}`, undefined, { status, statusText: '', headers: {}, data: undefined })

describe.concurrent(resolveInsightTagsAfterFailure, () => {
  it.for([
    {
      case: 'its first failure',
      failureCount: undefined,
      expected: { insightStatus: 'failed', insightFailureCount: '1' },
    },
    {
      case: 'its second failure',
      failureCount: '1',
      expected: { insightStatus: 'failed', insightFailureCount: '2' },
    },
    {
      case: 'its third failure',
      failureCount: '2',
      expected: { insightStatus: 'failed-permanently', insightFailureCount: '3' },
    },
    {
      case: 'a failure count it cannot read',
      failureCount: 'several',
      expected: { insightStatus: 'failed', insightFailureCount: '1' },
    },
  ])('takes the conversation off the dirty list and counts $case', ({ failureCount, expected }, { expect }) => {
    // Arrange
    const input = { failureCount, wasCognitiveUnreachable: false }

    // Act
    const tags = resolveInsightTagsAfterFailure(input)

    // Assert
    expect(tags).toEqual({ isDirty: 'false', ...expected })
  })

  it('keeps the failure count unchanged when Cognitive could not be reached', ({ expect }) => {
    // Arrange
    const input = { failureCount: '2', wasCognitiveUnreachable: true }

    // Act
    const tags = resolveInsightTagsAfterFailure(input)

    // Assert
    expect(tags).toEqual({ isDirty: 'false', insightStatus: 'failed', insightFailureCount: '2' })
  })

  it('leaves no failure count when Cognitive could not be reached on the first attempt', ({ expect }) => {
    // Arrange
    const input = { failureCount: undefined, wasCognitiveUnreachable: true }

    // Act
    const tags = resolveInsightTagsAfterFailure(input)

    // Assert
    expect(tags).toEqual({ isDirty: 'false', insightStatus: 'failed', insightFailureCount: '' })
  })
})

describe.concurrent(isCognitiveUnreachable, () => {
  it.for([
    { case: 'a request that timed out', thrown: new HttpError('timeout of 60000ms exceeded', 'ECONNABORTED') },
    { case: 'a request that was cancelled', thrown: new HttpError('canceled', 'ERR_CANCELED') },
    { case: 'a network error', thrown: new HttpError('fetch failed', 'ERR_NETWORK') },
    { case: 'HTTP 429', thrown: createHttpErrorWithStatus(429) },
    { case: 'HTTP 502', thrown: createHttpErrorWithStatus(502) },
    { case: 'HTTP 503', thrown: createHttpErrorWithStatus(503) },
    { case: 'HTTP 504', thrown: createHttpErrorWithStatus(504) },
  ])('returns true for $case', ({ thrown }, { expect }) => {
    // Arrange
    const failure = thrown

    // Act
    const isUnreachable = isCognitiveUnreachable(failure)

    // Assert
    expect(isUnreachable).toBe(true)
  })

  it.for([
    { case: 'HTTP 400', thrown: createHttpErrorWithStatus(400) },
    { case: 'HTTP 500', thrown: createHttpErrorWithStatus(500) },
    { case: 'a model output that did not respect the schema', thrown: new sdk.RuntimeError('title is required') },
    { case: 'an ordinary error', thrown: new Error('conversation not found') },
  ])('returns false for $case', ({ thrown }, { expect }) => {
    // Arrange
    const failure = thrown

    // Act
    const isUnreachable = isCognitiveUnreachable(failure)

    // Assert
    expect(isUnreachable).toBe(false)
  })
})
