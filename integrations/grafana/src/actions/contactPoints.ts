import * as bp from '../../.botpress'
import { GrafanaClient } from '../client'

export const listContactPointsAction: bp.IntegrationProps['actions']['listContactPoints'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  const result = await client.listContactPoints()
  if (!result.success) props.logger.forBot().error(`Failed to list contact points: ${result.error}`)
  return result
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
    const error = error_ instanceof Error ? error_.message : String(error_)
    props.logger.forBot().error(`Failed to load integration state: ${error}`)
    return { success: false, error }
  }

  const client = new GrafanaClient(props.ctx.configuration)
  const result = await client.createContactPoint({ ...props.input, webhookUrl, secret })
  if (!result.success) props.logger.forBot().error(`Failed to create contact point: ${result.error}`)
  return result
}

export const deleteContactPointAction: bp.IntegrationProps['actions']['deleteContactPoint'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  const result = await client.deleteContactPoint(props.input.uid)
  if (!result.success) props.logger.forBot().error(`Failed to delete contact point: ${result.error}`)
  return result
}
