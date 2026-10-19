import { afterEach, describe, expect, it, vi } from 'vitest'
import { ensureDailyRegister } from './schedule'
import { unregister } from './setup'

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = new Date('2026-10-01T00:00:00Z').getTime()

afterEach(() => {
  vi.useRealTimers()
})

const _notFound = () => ({ isApiError: true, type: 'ResourceNotFound', message: 'not found' })

const _setup = ({ state, getStateError }: { state?: object; getStateError?: unknown } = {}) => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  const setState = vi.fn().mockResolvedValue({})
  const getState =
    getStateError !== undefined
      ? vi.fn().mockRejectedValue(getStateError)
      : vi.fn().mockResolvedValue({ state: { payload: state } })
  const configureIntegration = vi.fn().mockResolvedValue({})
  const warn = vi.fn()
  const info = vi.fn()
  return {
    setState,
    configureIntegration,
    warn,
    props: {
      client: { getState, setState, configureIntegration } as any,
      ctx: { integrationId: 'int-1' } as any,
      logger: { forBot: () => ({ warn, info, error: vi.fn(), debug: vi.fn() }) } as any,
    },
  }
}

describe('ensureDailyRegister', () => {
  const _statuses = (setState: ReturnType<typeof vi.fn>) => setState.mock.calls.map((c) => c[0].payload.status)

  it('saves a pending marker, schedules the daily call, then marks it scheduled', async () => {
    const { props, setState, configureIntegration } = _setup({ getStateError: _notFound() })
    await ensureDailyRegister(props)

    expect(configureIntegration).toHaveBeenCalledWith({ scheduleRegisterCall: 'daily' })
    expect(_statuses(setState)).toEqual(['pending', 'scheduled'])
    expect(setState.mock.calls[0]![0]).toEqual({
      type: 'integration',
      name: 'registerSchedule',
      id: 'int-1',
      payload: { status: 'pending', updatedAtMs: NOW },
    })
    // The marker must be saved before configureIntegration, so a nested register() call skips
    expect(setState.mock.invocationCallOrder[0]!).toBeLessThan(configureIntegration.mock.invocationCallOrder[0]!)
  })

  it('does nothing once scheduled', async () => {
    const { props, setState, configureIntegration } = _setup({
      state: { status: 'scheduled', updatedAtMs: NOW - 30 * DAY_MS },
    })
    await ensureDailyRegister(props)

    expect(configureIntegration).not.toHaveBeenCalled()
    expect(setState).not.toHaveBeenCalled()
  })

  it('skips while another run is scheduling (recent pending marker)', async () => {
    const { props, configureIntegration } = _setup({ state: { status: 'pending', updatedAtMs: NOW - 60_000 } })
    await ensureDailyRegister(props)

    expect(configureIntegration).not.toHaveBeenCalled()
  })

  it('retries an abandoned pending marker', async () => {
    const { props, configureIntegration } = _setup({ state: { status: 'pending', updatedAtMs: NOW - 11 * 60_000 } })
    await ensureDailyRegister(props)

    expect(configureIntegration).toHaveBeenCalledTimes(1)
  })

  it('retries after a previous failure', async () => {
    const { props, configureIntegration } = _setup({ state: { status: 'failed', updatedAtMs: NOW - 60_000 } })
    await ensureDailyRegister(props)

    expect(configureIntegration).toHaveBeenCalledTimes(1)
  })

  it('marks the failure and throws when scheduling fails', async () => {
    const { props, setState, configureIntegration } = _setup({ getStateError: _notFound() })
    configureIntegration.mockRejectedValue(new Error('forbidden'))

    await expect(ensureDailyRegister(props)).rejects.toThrow(
      'Failed to schedule the daily Gmail watch renewal: forbidden. Save the integration again to retry.'
    )
    expect(_statuses(setState)).toEqual(['pending', 'failed'])
  })

  it('still throws the scheduling error when recording the failure also fails', async () => {
    const { props, setState, configureIntegration, warn } = _setup({ getStateError: _notFound() })
    configureIntegration.mockRejectedValue(new Error('forbidden'))
    setState.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('state service unavailable'))

    await expect(ensureDailyRegister(props)).rejects.toThrow('Failed to schedule the daily Gmail watch renewal')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('state service unavailable'))
  })

  it('throws when the schedule state cannot be read', async () => {
    const { props, configureIntegration } = _setup({ getStateError: new Error('state service unavailable') })

    await expect(ensureDailyRegister(props)).rejects.toThrow(
      'Failed to read the daily Gmail watch renewal schedule: state service unavailable'
    )
    expect(configureIntegration).not.toHaveBeenCalled()
  })
})

it('recreates the daily schedule after unregistering and restoring with retained state', async () => {
  const { props, setState, configureIntegration } = _setup()
  let payload: { status: string; updatedAtMs: number } | null = { status: 'scheduled', updatedAtMs: NOW }
  props.client.getState.mockImplementation(async () => {
    if (payload === null) {
      throw _notFound()
    }
    return { state: { payload } }
  })
  setState.mockImplementation(async (state) => {
    expect(state.name).toBe('registerSchedule')
    payload = state.payload
    return {}
  })

  await unregister({ ...props, webhookUrl: 'https://example.com/webhook' })
  expect(payload).toBeNull()
  await ensureDailyRegister(props)
  await ensureDailyRegister(props)

  expect(configureIntegration).toHaveBeenCalledTimes(1)
  expect(configureIntegration).toHaveBeenCalledWith({ scheduleRegisterCall: 'daily' })
  expect(payload).toEqual({ status: 'scheduled', updatedAtMs: NOW })
})

it('allows unregister when no schedule state exists', async () => {
  const { props, setState } = _setup()
  setState.mockRejectedValue(_notFound())
  await expect(unregister({ ...props, webhookUrl: 'https://example.com/webhook' })).resolves.toBeUndefined()
})

it('propagates unexpected errors when clearing the schedule state', async () => {
  const { props, setState } = _setup()
  setState.mockRejectedValue(new Error('state service unavailable'))
  await expect(unregister({ ...props, webhookUrl: 'https://example.com/webhook' })).rejects.toThrow(
    'state service unavailable'
  )
})
