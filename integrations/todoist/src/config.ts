import * as bp from '.botpress'
import { IntegrationContext, z } from '@botpress/sdk'

type StateConfiguration = bp.states.configuration.Configuration

export async function getStateConfiguration(client: bp.Client, ctx: IntegrationContext): Promise<StateConfiguration> {
  const emptyPayload: StateConfiguration = {}
  const {
    state: { payload },
  } = await client
    .getState({
      type: 'integration',
      name: 'configuration',
      id: ctx.integrationId,
    })
    .catch(() => ({
      state: {
        payload: emptyPayload,
      },
    }))
  return payload
}

export async function setStateConfiguration(client: bp.Client, ctx: IntegrationContext, config: StateConfiguration) {
  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: config
  })
}