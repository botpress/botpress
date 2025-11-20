export type Result<T> = {
  success: boolean
  message: string
  result?: T
}

export type LintResult = {
  identifier: string
  result: 'succeeded' | 'failed' | 'ignored'
  messages: string[]
}

export type WatchedIssue = { id: string; sinceTimestamp: number; commentId?: string }
