import { isApiError, RuntimeError } from '@botpress/sdk'
import { GoogleClient } from './google-api'
import * as bp from '.botpress'

/*
  Gmail watches expire after 7 days. register() starts the watch and asks the platform to call
  register() daily, which keeps it renewed. As a backstop, incoming-mail webhooks also renew a watch
  that is close to expiring, which only happens if the daily call stopped running.
*/
const DAY_MS = 24 * 60 * 60 * 1000
const WATCH_LIFETIME_MS = 7 * DAY_MS
const BACKSTOP_RENEW_BEFORE_EXPIRY_MS = 2 * DAY_MS

type WatchProps = {
  client: bp.Client
  ctx: bp.Context
}

/** Starts (or restarts) the Gmail watch and saves its expiry. */
export const startWatch = async ({ client, ctx, googleClient }: WatchProps & { googleClient: GoogleClient }) => {
  try {
    const { data } = await googleClient.watchIncomingMail()
    const expiresAtMs = Number(data.expiration)
    await client.setState({
      type: 'integration',
      name: 'watch',
      id: ctx.integrationId,
      payload: {
        // Fall back to Gmail's documented 7-day lifetime if the response has no usable expiration
        expiresAtMs: Number.isFinite(expiresAtMs) && expiresAtMs > 0 ? expiresAtMs : Date.now() + WATCH_LIFETIME_MS,
      },
    })
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(`Failed to set up Gmail watch: ${error.message}`)
  }
}

/**
 * Asks the platform to call register() daily, once per installation. The marker is saved before
 * calling configureIntegration so that if that call itself triggers register(), the nested run skips
 * instead of looping. Never throws: on failure it logs and leaves the marker unset so the next
 * register() retries.
 */
export const ensureDailyRegister = async ({ client, ctx, logger }: WatchProps & { logger: bp.Logger }) => {
  try {
    const schedule = await _getRegisterScheduleState({ client, ctx })
    if (schedule && schedule.scheduledAtMs > 0) {
      return
    }

    await _setRegisterScheduled({ client, ctx, scheduledAtMs: Date.now() })
    try {
      await client.configureIntegration({ scheduleRegisterCall: 'daily' })
    } catch (thrown: unknown) {
      await _setRegisterScheduled({ client, ctx, scheduledAtMs: 0 })
      throw thrown
    }
    logger.forBot().info('Scheduled a daily register() call to keep the Gmail watch renewed')
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    logger.forBot().warn(`Failed to schedule the daily Gmail watch renewal; will retry: ${error.message}`)
  }
}

/**
 * Backstop for the daily register() call: renews the watch when it is missing or expires within
 * BACKSTOP_RENEW_BEFORE_EXPIRY_MS. Never throws: a failed renewal is logged and retried on the next
 * call, so it can't break the webhook that triggered it.
 */
export const renewWatchIfExpiring = async ({
  client,
  ctx,
  logger,
  getGoogleClient = () => GoogleClient.create({ client, ctx }),
}: WatchProps & { logger: bp.Logger; getGoogleClient?: () => Promise<GoogleClient> }) => {
  try {
    const watch = await _getWatchState({ client, ctx })
    if (watch && watch.expiresAtMs - Date.now() > BACKSTOP_RENEW_BEFORE_EXPIRY_MS) {
      return
    }

    await startWatch({ client, ctx, googleClient: await getGoogleClient() })
    logger.forBot().info('Renewed Gmail watch for incoming emails')
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    logger.forBot().warn(`Failed to renew Gmail watch; will retry on the next call: ${error.message}`)
  }
}

const _setRegisterScheduled = async ({ client, ctx, scheduledAtMs }: WatchProps & { scheduledAtMs: number }) => {
  try {
    await client.setState({
      type: 'integration',
      name: 'registerSchedule',
      id: ctx.integrationId,
      payload: { scheduledAtMs },
    })
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(`Failed to save the register schedule marker: ${error.message}`)
  }
}

const _getWatchState = ({ client, ctx }: WatchProps) =>
  _undefinedIfNotFound(
    client.getState({ type: 'integration', name: 'watch', id: ctx.integrationId }).then(({ state }) => state.payload)
  )

const _getRegisterScheduleState = ({ client, ctx }: WatchProps) =>
  _undefinedIfNotFound(
    client
      .getState({ type: 'integration', name: 'registerSchedule', id: ctx.integrationId })
      .then(({ state }) => state.payload)
  )

const _undefinedIfNotFound = async <T>(promise: Promise<T>): Promise<T | undefined> => {
  try {
    return await promise
  } catch (thrown: unknown) {
    // Integrations set up before this change have no state yet
    if (isApiError(thrown) && thrown.type === 'ResourceNotFound') {
      return undefined
    }
    throw thrown
  }
}
