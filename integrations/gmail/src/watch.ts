import { isApiError, RuntimeError } from '@botpress/sdk'
import { GoogleClient } from './google-api'
import * as bp from '.botpress'

/*
  Gmail watches expire after 7 days. register() starts the watch and asks the platform to call
  register() daily, which keeps it renewed. As a backstop, incoming-mail webhooks also renew a watch
  that is close to expiring, and retry scheduling the daily call if it isn't scheduled yet.
*/
const DAY_MS = 24 * 60 * 60 * 1000
const WATCH_LIFETIME_MS = 7 * DAY_MS
const BACKSTOP_RENEW_BEFORE_EXPIRY_MS = 2 * DAY_MS
const PENDING_TIMEOUT_MS = 10 * 60 * 1000

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
 * Asks the platform to call register() daily, once per installation. A `pending` marker is saved before
 * calling configureIntegration so that if that call itself triggers register(), the nested run skips
 * instead of looping. A `pending` marker older than PENDING_TIMEOUT_MS is treated as abandoned (for
 * example if the failure cleanup below couldn't be saved), so it can never block retries for good.
 * Throws if scheduling fails, so register() fails and the caller can retry.
 */
export const ensureDailyRegister = async ({ client, ctx, logger }: WatchProps & { logger: bp.Logger }) => {
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

/** Retry path for ensureDailyRegister outside of register(): logs instead of throwing. */
export const tryEnsureDailyRegister = async (props: WatchProps & { logger: bp.Logger }) => {
  try {
    await ensureDailyRegister(props)
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    props.logger.forBot().warn(`${error.message} Will retry on the next incoming email.`)
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

const _setRegisterScheduleStatus = async ({
  client,
  ctx,
  status,
}: WatchProps & { status: 'pending' | 'scheduled' | 'failed' }) => {
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
