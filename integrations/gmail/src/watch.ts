import { isApiError, RuntimeError } from '@botpress/sdk'
import { GoogleClient } from './google-api'
import * as bp from '.botpress'

/*
  Gmail watches expire after 7 days and integrations can't run on a schedule, so the watch is renewed
  whenever the integration is called (incoming mail, actions, outgoing messages) once it is at least
  a day old. Google recommends renewing daily, and calling `watch` again is safe. A mailbox with no
  incoming mail and no bot activity for 7 days will still lapse until the next call renews it.
*/
const RENEW_AFTER_MS = 24 * 60 * 60 * 1000

type WatchProps = {
  client: bp.Client
  ctx: bp.Context
}

/** Starts (or restarts) the Gmail watch and saves its expiry. */
export const startWatch = async ({ client, ctx, googleClient }: WatchProps & { googleClient: GoogleClient }) => {
  try {
    const { data } = await googleClient.watchIncomingMail()
    const now = Date.now()
    const expiresAtMs = Number(data.expiration)
    await client.setState({
      type: 'integration',
      name: 'watch',
      id: ctx.integrationId,
      payload: {
        // Fall back to Gmail's documented 7-day lifetime if the response has no usable expiration
        expiresAtMs: Number.isFinite(expiresAtMs) && expiresAtMs > 0 ? expiresAtMs : now + 7 * 24 * 60 * 60 * 1000,
        renewedAtMs: now,
      },
    })
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(`Failed to set up Gmail watch: ${error.message}`)
  }
}

/**
 * Renews the Gmail watch when it is missing or at least a day old. Never throws: a failed renewal is
 * logged and retried on the next call, so it can't break the action, message or webhook that triggered it.
 */
export const renewWatchIfExpiring = async ({
  client,
  ctx,
  logger,
  getGoogleClient = () => GoogleClient.create({ client, ctx }),
}: WatchProps & { logger: bp.Logger; getGoogleClient?: () => Promise<GoogleClient> }) => {
  try {
    const watch = await _getWatchState({ client, ctx })
    if (watch && Date.now() - watch.renewedAtMs < RENEW_AFTER_MS && Date.now() < watch.expiresAtMs) {
      return
    }

    await startWatch({ client, ctx, googleClient: await getGoogleClient() })
    logger.forBot().info('Renewed Gmail watch for incoming emails')
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    logger.forBot().warn(`Failed to renew Gmail watch; will retry on the next call: ${error.message}`)
  }
}

const _getWatchState = async ({ client, ctx }: WatchProps) => {
  try {
    const { state } = await client.getState({ type: 'integration', name: 'watch', id: ctx.integrationId })
    return state.payload
  } catch (thrown: unknown) {
    // Integrations set up before watch tracking have no state yet: treat as needing renewal
    if (isApiError(thrown) && thrown.type === 'ResourceNotFound') {
      return undefined
    }
    throw thrown
  }
}
