import { describe, it, onTestFinished, vi } from 'vitest'
import { markFailedConversationsDirty, updateAllConversations, WorkflowProps } from './updateAllConversations'

type FakeConversation = ReturnType<typeof createConversation>

const createConversation = ({
  id,
  readMessages = () => Promise.reject(new Error('the conversation messages could not be read')),
  update = () => Promise.resolve({}),
}: {
  id: string
  readMessages?: () => Promise<unknown[]>
  update?: () => Promise<unknown>
}) => ({
  id,
  tags: {},
  listMessages: () => ({ takePage: readMessages }),
  update: vi.fn(update),
})

const getMocks = ({
  dirtyConversations = [],
  failedConversations = [],
  isDirtyListExhausted = true,
}: {
  dirtyConversations?: FakeConversation[]
  failedConversations?: FakeConversation[]
  isDirtyListExhausted?: boolean
}) => {
  const setCompleted = vi.fn(() => Promise.resolve({}))
  const list = ({ tags }: { tags: Record<string, string> }) => {
    const isFailedList = tags.insightStatus === 'failed'

    return {
      isExhausted: isFailedList || isDirtyListExhausted,
      takePage: () => Promise.resolve(dirtyConversations),
      takeAll: () => Promise.resolve(isFailedList ? failedConversations : dirtyConversations),
    }
  }
  const props = {
    workflow: { acknowledgeStartOfProcessing: () => Promise.resolve({}), setCompleted },
    logger: { error: vi.fn(), info: vi.fn(), debug: vi.fn(), warn: vi.fn() },
    conversations: { '*': { '*': { list } } },
  } as unknown as WorkflowProps

  return { props, setCompleted }
}

describe.concurrent(updateAllConversations, () => {
  it('records the failure on each conversation and completes the run when no dirty conversation is left', async ({
    expect,
  }) => {
    // Arrange
    const conversations = [createConversation({ id: 'conv_abc123' }), createConversation({ id: 'conv_def456' })]
    const mocks = getMocks({ dirtyConversations: conversations })

    // Act
    await updateAllConversations(mocks.props)

    // Assert
    for (const conversation of conversations) {
      expect(conversation.update).toHaveBeenCalledWith({
        tags: { isDirty: 'false', insightStatus: 'failed', insightFailureCount: '1' },
      })
    }

    expect(mocks.setCompleted).toHaveBeenCalledOnce()
  })

  it('keeps the run going when more dirty conversations remain and this page cleared some', async ({ expect }) => {
    // Arrange
    const mocks = getMocks({
      dirtyConversations: [createConversation({ id: 'conv_abc123' })],
      isDirtyListExhausted: false,
    })

    // Act
    await updateAllConversations(mocks.props)

    // Assert
    expect(mocks.setCompleted).not.toHaveBeenCalled()
  })

  it('completes the run when no conversation of the page could be cleared, even with more left', async ({ expect }) => {
    // Arrange
    const rejectUpdate = () => Promise.reject(new Error('the Bridge is unavailable'))
    const mocks = getMocks({
      dirtyConversations: [
        createConversation({ id: 'conv_abc123', update: rejectUpdate }),
        createConversation({ id: 'conv_def456', update: rejectUpdate }),
      ],
      isDirtyListExhausted: false,
    })

    // Act
    await updateAllConversations(mocks.props)

    // Assert
    expect(mocks.setCompleted).toHaveBeenCalledOnce()
  })
})

describe.sequential('updateAllConversations with conversations that fail at different times', () => {
  it('records every failure when the first conversation fails while another is still reading its messages', async ({
    expect,
  }) => {
    // Arrange
    vi.useFakeTimers()
    onTestFinished(() => {
      vi.useRealTimers()
    })

    const failSoon = () => Promise.reject(new Error('the model output did not respect the schema'))
    const failLater = () =>
      new Promise<unknown[]>((_resolve, reject) => {
        setTimeout(() => reject(new Error('the conversation messages could not be read')), 1_000)
      })
    const firstConversation = createConversation({ id: 'conv_abc123', readMessages: failSoon })
    const secondConversation = createConversation({ id: 'conv_def456', readMessages: failLater })
    const mocks = getMocks({ dirtyConversations: [firstConversation, secondConversation] })

    // Act
    const run = updateAllConversations(mocks.props)
    await vi.advanceTimersByTimeAsync(1_000)
    await run

    // Assert
    expect(firstConversation.update).toHaveBeenCalledOnce()
    expect(secondConversation.update).toHaveBeenCalledOnce()
    expect(mocks.setCompleted).toHaveBeenCalledOnce()
  })
})

describe.concurrent(markFailedConversationsDirty, () => {
  it('marks every conversation whose insight failed as dirty again', async ({ expect }) => {
    // Arrange
    const failedConversations = [createConversation({ id: 'conv_abc123' }), createConversation({ id: 'conv_def456' })]
    const mocks = getMocks({ failedConversations })

    // Act
    await markFailedConversationsDirty(mocks.props)

    // Assert
    for (const conversation of failedConversations) {
      expect(conversation.update).toHaveBeenCalledWith({ tags: { isDirty: 'true' } })
    }
  })
})
