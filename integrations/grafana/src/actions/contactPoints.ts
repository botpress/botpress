import * as bp from '../../.botpress'
import { listContactPoints, createContactPoint, deleteContactPoint } from '../clients/contactPoints'

export const listContactPointsAction: bp.IntegrationProps['actions']['listContactPoints'] = async (props) => {
  const config = props.ctx.configuration
  const result = await listContactPoints(config)
  if (!result.success) props.logger.forBot().error(`Failed to list contact points: ${result.error}`)
  return result
}

export const createContactPointAction: bp.IntegrationProps['actions']['createContactPoint'] = async (props) => {
  const config = props.ctx.configuration

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
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    props.logger.forBot().error(`Failed to load integration state: ${error}`)
    return { success: false, error }
  }

  const result = await createContactPoint(config, { ...props.input, webhookUrl, secret })
  if (!result.success) props.logger.forBot().error(`Failed to create contact point: ${result.error}`)
  return result
}

export const deleteContactPointAction: bp.IntegrationProps['actions']['deleteContactPoint'] = async (props) => {
  const config = props.ctx.configuration
  const result = await deleteContactPoint(config, props.input.uid)
  if (!result.success) props.logger.forBot().error(`Failed to delete contact point: ${result.error}`)
  return result
}
