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

  let webhookUrl = props.input.webhookUrl
  if (!webhookUrl) {
    const { state } = await props.client.getState({
      type: 'integration',
      name: 'webhookConfig',
      id: props.ctx.integrationId,
    })
    webhookUrl = state.payload.webhookUrl
  }

  const result = await createContactPoint(config, { ...props.input, webhookUrl })
  if (!result.success) props.logger.forBot().error(`Failed to create contact point: ${result.error}`)
  return result
}

export const deleteContactPointAction: bp.IntegrationProps['actions']['deleteContactPoint'] = async (props) => {
  const config = props.ctx.configuration
  const result = await deleteContactPoint(config, props.input.uid)
  if (!result.success) props.logger.forBot().error(`Failed to delete contact point: ${result.error}`)
  return result
}
