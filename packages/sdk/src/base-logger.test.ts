import { describe, it, vi, afterEach } from 'vitest'
import { BaseLogger, type IssueLogEvent } from './base-logger'
import { IntegrationLogger } from './integration/server/integration-logger'

// A minimal concrete subclass for testing BaseLogger directly:
class TestLogger extends BaseLogger<object> {
  public constructor(options: object = {}) {
    super(options)
  }

  public override with(_options: object) {
    return new TestLogger({ ...this.defaultOptions, ..._options })
  }
}

const MOCK_ISSUE = {
  type: 'issue',
  code: 'TEST_CODE',
  category: 'other',
  title: 'Test issue',
  description: 'A test issue description',
  data: {},
  groupBy: [],
} as const satisfies IssueLogEvent

afterEach(() => vi.restoreAllMocks())

describe.sequential('BaseLogger.issue()', () => {
  it('emits JSON with no extra keys when context is empty', ({ expect }) => {
    // Arrange
    const logger = new TestLogger()
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})

    // Act
    logger.issue(MOCK_ISSUE)

    // Assert
    const emitted = JSON.parse(spy.mock.calls[0]![0] as string)
    expect(emitted).toEqual(MOCK_ISSUE)
  })

  it('emits the exact substring "type":"issue" (no spaces in JSON)', ({ expect }) => {
    // Arrange
    const logger = new TestLogger()
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})

    // Act
    logger.issue(MOCK_ISSUE)

    // Assert
    const raw = spy.mock.calls[0]![0] as string
    expect(raw).toContain('"type":"issue"')
  })
})

describe.sequential('IntegrationLogger.issue(): with identity options', () => {
  it('includes botId, integrationId, and integrationAlias at the top level', ({ expect }) => {
    // Arrange
    const logger = new IntegrationLogger({
      botId: 'bot-123',
      integrationId: 'intg-456',
      integrationAlias: 'myIntegration',
    })
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})

    // Act
    logger.issue(MOCK_ISSUE)

    // Assert
    const emitted = JSON.parse(spy.mock.calls[0]![0] as string)
    expect(emitted.botId).toBe('bot-123')
    expect(emitted.integrationId).toBe('intg-456')
    expect(emitted.integrationAlias).toBe('myIntegration')
    expect(emitted.type).toBe('issue')
    expect(emitted.code).toBe(MOCK_ISSUE.code)
  })
})

describe.sequential('IntegrationLogger.issue(): without identity options', () => {
  it('emits exactly the original args keys (no extra keys, none undefined)', ({ expect }) => {
    // Arrange
    const logger = new IntegrationLogger()
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})

    // Act
    logger.issue(MOCK_ISSUE)

    // Assert
    const emitted = JSON.parse(spy.mock.calls[0]![0] as string)
    const emittedKeys = Object.keys(emitted).sort()
    const expectedKeys = Object.keys(MOCK_ISSUE).sort()
    expect(emittedKeys).toEqual(expectedKeys)
    expect(Object.values(emitted).every((v) => v !== undefined)).toBe(true)
  })
})
