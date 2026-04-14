import { getHitlClient, HubSpotHitlClient } from './client'
import * as bp from '.botpress'

export async function createHitlChannel(props: {
  ctx: bp.Context
  client: bp.Client
  logger: bp.Logger
  appId: string
  developerApiKey: string | undefined
}): Promise<string> {
  const { ctx, client, logger, appId, developerApiKey } = props
  const hitlClient = getHitlClient(ctx, client, logger)
  const ourWebhookUrl = `${process.env.BP_WEBHOOK_URL}/${ctx.webhookId}`

  const { results } = await hitlClient.getCustomChannels(appId, developerApiKey)
  const existing = results.find((c) => c.webhookUrl === ourWebhookUrl)

  if (existing) {
    logger.forBot().info(`Found existing HITL channel ${existing.id} with matching webhookUrl. Reusing it.`)
    return existing.id
  }

  const newChannelId = await hitlClient.createCustomChannel(appId, developerApiKey)
  logger.forBot().info(`Created HITL custom channel: ${newChannelId}`)
  return newChannelId
}

export async function connectHitlChannel(props: {
  ctx: bp.Context
  client: bp.Client
  logger: bp.Logger
  channelId: string
  inboxIds: string[]
  defaultInboxId: string
}): Promise<void> {
  const { ctx, client, logger, channelId, inboxIds, defaultInboxId } = props
  const hitlClient = getHitlClient(ctx, client, logger)

  const existingAccounts = await hitlClient.listChannelAccounts(channelId)
  const channelAccounts: Record<string, string> = {}

  for (const inboxId of inboxIds) {
    const existing = existingAccounts.find((a) => a.inboxId === inboxId)
    if (existing) {
      logger.forBot().info(`Reusing existing channel account ${existing.id} for inbox ${inboxId}`)
      channelAccounts[inboxId] = existing.id
    } else {
      const channelAccount = await hitlClient.connectCustomChannel(channelId, inboxId, 'Botpress Channel')
      channelAccounts[inboxId] = channelAccount.data!.id
      logger.forBot().info(`Created channel account ${channelAccounts[inboxId]} for inbox ${inboxId}`)
    }
  }

  await client.setState({
    type: 'integration',
    name: 'hitlConfig',
    id: ctx.integrationId,
    payload: { channelId, defaultInboxId, channelAccounts },
  })

  logger
    .forBot()
    .info(`HITL channel ${channelId} connected to ${inboxIds.length} inbox(es). Default: ${defaultInboxId}`)
}

export async function setupHitlChannel(props: {
  ctx: bp.Context
  client: bp.Client
  logger: bp.Logger
  appId: string
  developerApiKey: string | undefined
  inboxId: string
}): Promise<void> {
  const { ctx, client, logger, appId, developerApiKey, inboxId } = props
  const hitlClient = getHitlClient(ctx, client, logger)
  const channelId = await createHitlChannel({ ctx, client, logger, appId, developerApiKey })
  await _waitForChannelAvailability(hitlClient, channelId, appId, developerApiKey, logger)
  await connectHitlChannel({ ctx, client, logger, channelId, inboxIds: [inboxId], defaultInboxId: inboxId })
}

async function _waitForChannelAvailability(
  hitlClient: HubSpotHitlClient,
  channelId: string,
  appId: string,
  developerApiKey: string | undefined,
  logger: bp.Logger
): Promise<void> {
  const maxAttempts = 6
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { results } = await hitlClient.getCustomChannels(appId, developerApiKey)
    if (results.some((c) => c.id === channelId)) {
      logger.forBot().info(`Channel ${channelId} available after ${attempt + 1} attempt(s)`)
      return
    }
    const delay = Math.pow(2, attempt) * 1000
    logger.forBot().warn(`Channel ${channelId} not yet available. Retrying in ${delay / 1000}s...`)
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
  logger.forBot().warn(`Channel ${channelId} still not visible after ${maxAttempts} attempts — proceeding anyway`)
}
