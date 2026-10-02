import * as cognitive from '@botpress/cognitive'

const MAX_INSIGHT_FAILURES = 3

/**
 * The same failures Cognitive's own client retries, plus rate limiting.
 */
const COGNITIVE_UNREACHABLE_STATUS_CODES = [429, 502, 503, 504] as const satisfies readonly number[]

/**
 * Tag values that erase a conversation's record of failed AI insight
 * generations. The Bridge deletes a tag whose new value is empty.
 */
export const CLEARED_INSIGHT_FAILURE_TAGS = { insightStatus: '', insightFailureCount: '' } as const

/**
 * Whether a failure means Cognitive could not be reached, as opposed to a
 * failure caused by the conversation itself.
 */
export const isCognitiveUnreachable = (thrown: unknown): boolean => {
  if (!cognitive.isHttpError(thrown)) {
    return false
  }

  return !thrown.response || COGNITIVE_UNREACHABLE_STATUS_CODES.some((code) => code === thrown.response?.status)
}

/**
 * Resolves the tags to write once generating a conversation's AI insight has
 * failed. The conversation leaves the list of dirty conversations; the next
 * run tries it again, until it has failed `MAX_INSIGHT_FAILURES` times for
 * reasons other than Cognitive being unreachable.
 */
export const resolveInsightTagsAfterFailure = ({
  failureCount,
  wasCognitiveUnreachable,
}: {
  failureCount: string | undefined
  wasCognitiveUnreachable: boolean
}) => {
  const previousFailures = _parseFailureCount(failureCount)
  const failures = wasCognitiveUnreachable ? previousFailures : previousFailures + 1

  return {
    isDirty: 'false',
    insightStatus: failures >= MAX_INSIGHT_FAILURES ? 'failed-permanently' : 'failed',
    insightFailureCount: failures > 0 ? failures.toString() : '',
  }
}

const _parseFailureCount = (failureCount: string | undefined): number => {
  const parsedFailureCount = Number.parseInt(failureCount ?? '', 10)

  return Number.isNaN(parsedFailureCount) || parsedFailureCount < 0 ? 0 : parsedFailureCount
}
