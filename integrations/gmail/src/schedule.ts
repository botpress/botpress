import { isApiError, RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'

const PENDING_TIMEOUT_MS = 10 * 60 * 1000

type ScheduleProps = Pick<Parameters<bp.IntegrationProps['register']>[0], 'client' | 'ctx' | 'logger'>

// Save a pending marker before scheduling: the new task may run before the request completes.
export const ensureDailyRegister = async ({ client, ctx, logger }: ScheduleProps) => {
  const schedule = await _getRegisterScheduleState({ client, ctx }).catch((thrown: unknown) => {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(`Failed to read the daily Gmail watch renewal schedule: ${error.message}`)
  })
  if (schedule?.status === 'scheduled') {
    return
  }
  if (schedule?.status === 'pending' && Date.now() - schedule.updatedAtMs < PENDING_TIMEOUT_MS) {
    return
  }

  await _setRegisterScheduleStatus({ client, ctx, status: 'pending' })
  try {
    await client.configureIntegration({ scheduleRegisterCall: 'daily' })
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    await _setRegisterScheduleStatus({ client, ctx, status: 'failed' }).catch((cleanupThrown: unknown) => {
      // The pending marker expires after PENDING_TIMEOUT_MS, so a later call still retries
      const cleanupError = cleanupThrown instanceof Error ? cleanupThrown : new Error(String(cleanupThrown))
      logger.forBot().warn(`Failed to record the scheduling failure: ${cleanupError.message}`)
    })
    throw new RuntimeError(
      `Failed to schedule the daily Gmail watch renewal: ${error.message}. Save the integration again to retry.`
    )
  }

  await _setRegisterScheduleStatus({ client, ctx, status: 'scheduled' })
  logger.forBot().info('Scheduled a daily register() call to keep the Gmail watch renewed')
}

const _setRegisterScheduleStatus = async ({
  client,
  ctx,
  status,
}: Pick<ScheduleProps, 'client' | 'ctx'> & { status: 'pending' | 'scheduled' | 'failed' }) => {
  try {
    await client.setState({
      type: 'integration',
      name: 'registerSchedule',
      id: ctx.integrationId,
      payload: { status, updatedAtMs: Date.now() },
    })
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(`Failed to save the daily Gmail watch renewal status: ${error.message}`)
  }
}

const _getRegisterScheduleState = async ({ client, ctx }: Pick<ScheduleProps, 'client' | 'ctx'>) => {
  try {
    const { state } = await client.getState({ type: 'integration', name: 'registerSchedule', id: ctx.integrationId })
    return state.payload
  } catch (thrown: unknown) {
    if (isApiError(thrown) && thrown.type === 'ResourceNotFound') {
      return undefined
    }
    throw thrown
  }
}
