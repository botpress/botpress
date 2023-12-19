import { ResourceNotFoundError } from '@botpress/client'
import type { IntegrationContext } from '@botpress/sdk'
import axios from 'axios'
import { z } from 'zod'
import {
  TriggerSubscriber,
  ZapierTriggersStateName,
  ZapierTriggersStateSchema,
  ZapierTriggersState,
  Client,
  IntegrationEvent,
  TriggerRequestBody,
  IntegrationLogger,
} from './types'
import type { Configuration } from '.botpress/implementation/configuration'

export async function handleIntegrationEvent({
  event,
  ctx,
  client,
  logger,
}: {
  event: IntegrationEvent
  ctx: IntegrationContext<Configuration>
  client: Client
  logger: IntegrationLogger
}) {
  logger.forBot().debug('Received integration event: ', event)

  let subscribers = await getTriggerSubscribers({ ctx, client, logger })

  if (event.action === 'subscribe:triggers') {
    subscribers.push({ url: event.url })

    // Send a demo trigger call to the Zapier REST hook so the user can easily test it when setting up the bot trigger in their Zap.
    await axios
      .post(event.url, <TriggerRequestBody>{
        botId: ctx.botId,
        data: '{"message": "Hello from Botpress! This is an automated test message to confirm that your bot is now able to trigger this Zap."}',
        correlationId: '12345',
      })
      .then(() => {
        logger.forBot().info(`Successfully sent demo trigger to Zapier REST hook: ${event.url}`)
      })
      .catch((e) => {
        logger.forBot().warn(`Failed to send demo trigger to Zapier REST hook: ${event.url} (Error: ${e.message})`)
      })
  } else if (event.action === 'unsubscribe:triggers') {
    subscribers = subscribers.filter((x) => x.url !== event.url)
  }

  await saveTriggerSubscribers(subscribers, ctx, client)

  logger.forBot().info(`Successfully updated trigger subscribers: ${JSON.stringify(subscribers)}`)
}

export async function unsubscribeZapierHook({
  url,
  ctx,
  client,
  logger,
}: {
  url: string
  ctx: IntegrationContext<Configuration>
  client: Client
  logger: IntegrationLogger
}) {
  let subscribers = await getTriggerSubscribers({ ctx, client, logger })
  subscribers = subscribers.filter((x) => x.url !== url)
  await saveTriggerSubscribers(subscribers, ctx, client)
  logger.forBot().info(`Zapier hook ${url} was unsubscribed`)
}

export async function getTriggerSubscribers({
  ctx,
  client,
  logger,
}: {
  ctx: IntegrationContext<Configuration>
  client: Client
  logger: IntegrationLogger
}) {
  const state = await getTriggersState({ ctx, client, logger })
  return state.subscribers
}

export async function saveTriggerSubscribers(
  subscribers: TriggerSubscriber[],
  ctx: IntegrationContext<Configuration>,
  client: Client
) {
  await client.setState({
    type: 'integration',
    name: ZapierTriggersStateName,
    id: ctx.integrationId,
    payload: buildTriggersState({ subscribers }),
  })
}

export async function getTriggersState({
  ctx,
  client,
  logger,
}: {
  ctx: IntegrationContext<Configuration>
  client: Client
  logger: IntegrationLogger
}) {
  const defaultState = buildTriggersState()

  return await client
    .getState({
      type: 'integration',
      name: ZapierTriggersStateName,
      id: ctx.integrationId,
    })
    .then((res) => ZapierTriggersStateSchema.parse(res.state.payload))
    .catch((e) => {
      // TODO: Remove hard-coded "No State found" message check once the bridge client correctly receives the ResourceNotFoundError
      if (e instanceof ResourceNotFoundError || e.message === 'No State found') {
        logger.forBot().info("Zapier triggers state doesn't exist yet and will be initialized")
        return defaultState
      } else if (e instanceof z.ZodError) {
        logger.forBot().warn(`Zapier triggers state will be reset as it's corrupted: ${e.message}`)
        return defaultState
      } else {
        throw e
      }
    })
}

export function buildTriggersState(partial?: Partial<ZapierTriggersState>) {
  return <ZapierTriggersState>{
    subscribers: [],
    ...partial,
  }
}
