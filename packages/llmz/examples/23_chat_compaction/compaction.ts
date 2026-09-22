import { Session, type SummaryRequest } from 'llmz'

/** A deterministic demo substitute for an LLM summarizer; makes no network requests. */
export async function mockSummary({ messages }: SummaryRequest): Promise<string> {
  const requests = messages
    .filter((message) => message.role === 'user' && typeof message.content === 'string')
    .map((message) => (message.content as string).slice(0, 100))
    .slice(-3)
  return `Demo summary of recent requests: ${requests.join(' / ')}`
}

export function createSession(): Session {
  return new Session({
    variables: { trip: { destination: 'Quebec City', budgetCad: 300 } },
    compaction: { maxSummaryTokens: 256, keepRecentIterations: 1, summarize: mockSummary },
  })
}
