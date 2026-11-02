import { describe, it, expect, vi } from 'vitest'
import { saveSpreadsheetSelectionStep } from './save-spreadsheet-selection-step'

type StepProps = Parameters<typeof saveSpreadsheetSelectionStep>[0]

const CTX = { integrationId: 'int-1', webhookId: 'wh-1', configurationType: null }

const makeClient = ({ storedSelection, setStateError }: { storedSelection?: unknown; setStateError?: Error } = {}) => {
  const calls: string[] = []
  return {
    calls,
    getState: vi.fn(async () => {
      if (storedSelection === undefined) {
        throw new Error('state not found')
      }
      return { state: { payload: storedSelection } }
    }),
    setState: vi.fn(async () => {
      calls.push('setState')
      if (setStateError) {
        throw setStateError
      }
      return {}
    }),
    configureIntegration: vi.fn(async () => {
      calls.push('configureIntegration')
      return {}
    }),
  }
}

const runStep = async (client: ReturnType<typeof makeClient>, spreadsheetIds?: string) => {
  const endWizard = vi.fn((result: unknown) => result)
  const query = new URLSearchParams(spreadsheetIds === undefined ? '' : `spreadsheetIds=${spreadsheetIds}`)
  const logger = { forBot: () => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn() }) }

  const result = await saveSpreadsheetSelectionStep({
    ctx: CTX,
    client,
    logger,
    query,
    responses: { endWizard },
  } as unknown as StepProps)

  return result as unknown as { success: boolean; errorMessage?: string }
}

describe('saveSpreadsheetSelectionStep', () => {
  it('fails and leaves the integration disconnected when nothing was ever picked', async () => {
    const client = makeClient()

    const result = await runStep(client)

    expect(result.success).toBe(false)
    expect(result.errorMessage).toMatch(/No spreadsheet was selected/)
    expect(client.setState).not.toHaveBeenCalled()
    expect(client.configureIntegration).not.toHaveBeenCalled()
  })

  it('saves the new selection, in order and deduplicated, before marking the integration connected', async () => {
    const client = makeClient()

    const result = await runStep(client, 'b, a,b')

    expect(result.success).toBe(true)
    expect(client.setState).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'spreadsheetConfig', payload: { spreadsheetIds: ['b', 'a'] } })
    )
    expect(client.configureIntegration).toHaveBeenCalledWith({ identifier: 'wh-1' })
    expect(client.calls).toEqual(['setState', 'configureIntegration'])
  })

  it('does not mark the integration connected when saving the selection fails', async () => {
    const client = makeClient({ setStateError: new Error('boom') })

    const result = await runStep(client, 'a')

    expect(result.success).toBe(false)
    expect(result.errorMessage).toMatch(/boom/)
    expect(client.configureIntegration).not.toHaveBeenCalled()
  })

  it('keeps the previous selection on a re-authorization without a new pick', async () => {
    const client = makeClient({ storedSelection: { spreadsheetIds: ['existing'] } })

    const result = await runStep(client)

    expect(result.success).toBe(true)
    expect(client.setState).not.toHaveBeenCalled()
    expect(client.configureIntegration).toHaveBeenCalledWith({ identifier: 'wh-1' })
  })
})
