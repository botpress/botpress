import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateAllConversations } from './updateAllConversations'
import * as summaryUpdater from './tagsUpdater'

describe('updateAllConversations', () => {
  let props: any
  let updateTitleAndSummarySpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    updateTitleAndSummarySpy = vi
      .spyOn(summaryUpdater, 'updateTitleAndSummary')
      .mockResolvedValue(undefined) as unknown as ReturnType<typeof vi.spyOn>

    props = {
      workflow: {
        acknowledgeStartOfProcessing: vi.fn().mockResolvedValue(undefined),
        setCompleted: vi.fn().mockResolvedValue(undefined),
      },
      client: {
        listConversations: vi.fn(),
        listMessages: vi.fn(),
      },
      logger: {
        info: vi.fn(),
      },
    }
  })

  it('should acknowledge start, update all dirty conversations, and complete if no nextToken', async () => {
    props.client.listConversations.mockResolvedValue({
      conversations: [{ id: 'c1' }, { id: 'c2' }],
      meta: { nextToken: undefined },
    })
    props.client.listMessages.mockResolvedValue({ messages: ['msg1', 'msg2'] })

    await updateAllConversations(props)

    expect(props.workflow.acknowledgeStartOfProcessing).toHaveBeenCalled()
    expect(props.client.listConversations).toHaveBeenCalledWith({ tags: { isDirty: 'true' } })
    expect(props.client.listMessages).toHaveBeenCalledTimes(2)
    expect(updateTitleAndSummarySpy).toHaveBeenCalledTimes(2)
    expect(props.workflow.setCompleted).toHaveBeenCalled()
    expect(props.logger.info).toHaveBeenCalledWith('updateAllConversations workflow completed')
  })

  it('should recursively call itself if nextToken is present', async () => {
    const firstCall = {
      conversations: [{ id: 'c1' }],
      meta: { nextToken: 'token123' },
    }
    const secondCall = {
      conversations: [],
      meta: { nextToken: undefined },
    }
    props.client.listConversations.mockResolvedValueOnce(firstCall).mockResolvedValueOnce(secondCall)
    props.client.listMessages.mockResolvedValue({ messages: ['msg1'] })

    await updateAllConversations(props)

    expect(props.client.listConversations).toHaveBeenCalledTimes(2)
    expect(updateTitleAndSummarySpy).toHaveBeenCalledTimes(1)
    expect(props.workflow.setCompleted).toHaveBeenCalledTimes(1)
  })

  it('should handle no dirty conversations gracefully', async () => {
    props.client.listConversations.mockResolvedValue({
      conversations: [],
      meta: { nextToken: undefined },
    })

    await updateAllConversations(props)

    expect(props.client.listMessages).not.toHaveBeenCalled()
    expect(updateTitleAndSummarySpy).not.toHaveBeenCalled()
    expect(props.workflow.setCompleted).toHaveBeenCalled()
  })
})
