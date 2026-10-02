import { describe, it, vi } from 'vitest'
import { handleUpdateAiInsight } from './update-ai-insight'

type HandlerProps = Parameters<typeof handleUpdateAiInsight>[0]

const FIVE_MINUTES = 5 * 60 * 1000

const getMocks = ({ newestActiveRunTimeoutAt }: { newestActiveRunTimeoutAt?: Date }) => {
  const newestActiveRuns = newestActiveRunTimeoutAt ? [{ timeoutAt: newestActiveRunTimeoutAt.toISOString() }] : []
  const startNewInstance = vi.fn(() => Promise.resolve({}))
  const props = {
    workflows: {
      updateAllConversations: {
        listInstances: () => ({ take: () => Promise.resolve(newestActiveRuns) }),
        startNewInstance,
      },
    },
  } as unknown as HandlerProps

  return { props, startNewInstance }
}

describe.concurrent(handleUpdateAiInsight, () => {
  it('starts a run when no run is active', async ({ expect }) => {
    // Arrange
    const mocks = getMocks({})

    // Act
    await handleUpdateAiInsight(mocks.props)

    // Assert
    expect(mocks.startNewInstance).toHaveBeenCalledOnce()
  })

  it('does not start a run while the newest active run has not reached its timeout', async ({ expect }) => {
    // Arrange
    const mocks = getMocks({ newestActiveRunTimeoutAt: new Date(Date.now() + FIVE_MINUTES) })

    // Act
    await handleUpdateAiInsight(mocks.props)

    // Assert
    expect(mocks.startNewInstance).not.toHaveBeenCalled()
  })

  it('starts a run when the newest active run is past its timeout but was never marked timed out', async ({
    expect,
  }) => {
    // Arrange
    const mocks = getMocks({ newestActiveRunTimeoutAt: new Date(Date.now() - FIVE_MINUTES) })

    // Act
    await handleUpdateAiInsight(mocks.props)

    // Assert
    expect(mocks.startNewInstance).toHaveBeenCalledOnce()
  })
})
