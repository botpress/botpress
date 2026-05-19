import * as sdk from '@botpress/sdk'
import * as bp from '../../.botpress'
import { GrafanaClient } from '../client'

export const listContactPointsAction: bp.IntegrationProps['actions']['listContactPoints'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    return { contactPoints: await client.listContactPoints() }
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}

export const createContactPointAction: bp.IntegrationProps['actions']['createContactPoint'] = async (props) => {
  let webhookUrl: string
  let secret: string
  try {
    const { state } = await props.client.getState({
      type: 'integration',
      name: 'webhookConfig',
      id: props.ctx.integrationId,
    })
    webhookUrl = props.input.webhookUrl ?? state.payload.webhookUrl
    secret = state.payload.webhookSecret
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(
      `Failed to load integration state: ${error_ instanceof Error ? error_.message : String(error_)}`
    )
  }

  const client = new GrafanaClient(props.ctx.configuration)
  try {
    return await client.createContactPoint({ ...props.input, webhookUrl, secret })
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}

export const deleteContactPointAction: bp.IntegrationProps['actions']['deleteContactPoint'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    await client.deleteContactPoint(props.input.uid)
    return {}
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}
