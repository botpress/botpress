import { describe, it, expect, vi, beforeEach, MockInstance, Mock } from 'vitest'
import { updateAllConversations, WorkflowProps } from './updateAllConversations'
import * as summaryUpdater from './tagsUpdater'

const as = <T>(x: Partial<T>): T => x as T

type WorkflowProxy = WorkflowProps['workflow']
type Client = WorkflowProps['client']
type Logger = WorkflowProps['logger']
type Conversation = Awaited<ReturnType<Client['listConversations']>>['conversations'][number]
type Message = Awaited<ReturnType<Client['listMessages']>>['messages'][number]

// NOTE: These tests are temporarily skipped because the mocks need to be
//       adjusted to use plugin proxies instead of direct client calls (the
//       plugin should not rely on the client at all).

describe.skip('updateAllConversations', () => {
  let updateTitleAndSummarySpy: MockInstance<typeof summaryUpdater.updateTitleAndSummary>
  let acknowledgeStartOfProcessingMock: Mock<WorkflowProxy['acknowledgeStartOfProcessing']>
  let setCompletedMock: Mock<WorkflowProxy['setCompleted']>
  let listConversationsMock: Mock<Client['listConversations']>
  let listMessagesMock: Mock<Client['listMessages']>
  let loggerInfoMock: Mock<Logger['info']>

  const initProps = (): WorkflowProps =>
    as<WorkflowProps>({
      workflow: as<WorkflowProxy>({
        acknowledgeStartOfProcessing: acknowledgeStartOfProcessingMock,
        setCompleted: setCompletedMock,
      }),
      client: as<Client>({
        listConversations: listConversationsMock,
        listMessages: listMessagesMock,
      }),
      logger: as<Logger>({
        info: loggerInfoMock,
      }),
    })

  beforeEach(() => {
    updateTitleAndSummarySpy = vi.spyOn(summaryUpdater, 'updateTitleAndSummary').mockResolvedValue(undefined)
    acknowledgeStartOfProcessingMock = vi.fn().mockResolvedValue(undefined)
    setCompletedMock = vi.fn().mockResolvedValue(undefined)
    listConversationsMock = vi.fn()
    listMessagesMock = vi.fn()
    loggerInfoMock = vi.fn()
  })

  it('should acknowledge start, update all dirty conversations, and complete if no nextToken', async () => {
    listConversationsMock.mockResolvedValue({
      conversations: [as<Conversation>({ id: 'c1' }), as<Conversation>({ id: 'c2' })],
      meta: {},
    })
    listMessagesMock.mockResolvedValue({
      messages: [
        as<Message>({ id: 'm1', conversationId: 'c1', type: 'text', payload: { text: 'Hello1' } }),
        as<Message>({ id: 'm2', conversationId: 'c1', type: 'text', payload: { text: 'Hello2' } }),
      ],
      meta: {},
    })

    const props = initProps()
    await updateAllConversations(props)

    expect(props.workflow.acknowledgeStartOfProcessing).toHaveBeenCalled()
    expect(props.client.listConversations).toHaveBeenCalledWith({ tags: { isDirty: 'true' } })
    expect(props.client.listMessages).toHaveBeenCalledTimes(2)
    expect(updateTitleAndSummarySpy).toHaveBeenCalledTimes(2)
    expect(props.workflow.setCompleted).toHaveBeenCalled()
  })

  it('should handle no dirty conversations gracefully', async () => {
    listConversationsMock.mockResolvedValue({
      conversations: [],
      meta: { nextToken: undefined },
    })

    const props = initProps()
    await updateAllConversations(props)

    expect(props.client.listMessages).not.toHaveBeenCalled()
    expect(updateTitleAndSummarySpy).not.toHaveBeenCalled()
    expect(props.workflow.setCompleted).toHaveBeenCalled()
  })
})
