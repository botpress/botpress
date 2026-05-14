import * as bp from '../../.botpress'
import { createNotificationPolicy, listNotificationPolicies, editNotificationPolicy, deleteNotificationPolicy, editDefaultNotificationPolicy } from '../clients/notifications'
import { notificationPolicySchema } from '../../definitions/notification-schemas'

export const createNotificationPolicyAction: bp.IntegrationProps['actions']['createNotificationPolicy'] = async (props) => {
  const config = props.ctx.configuration
  const result = await createNotificationPolicy(config, notificationPolicySchema.parse(props.input))
  if (!result.success) props.logger.forBot().error(`Failed to create notification policy: ${result.error}`)
  return result
}

export const listNotificationPoliciesAction: bp.IntegrationProps['actions']['listNotificationPolicies'] = async (props) => {
  const config = props.ctx.configuration
  const result = await listNotificationPolicies(config)
  if (!result.success) props.logger.forBot().error(`Failed to list notification policies: ${result.error}`)
  return result
}

export const editNotificationPolicyAction: bp.IntegrationProps['actions']['editNotificationPolicy'] = async (props) => {
  const config = props.ctx.configuration
  const result = await editNotificationPolicy(config, props.input)
  if (!result.success) props.logger.forBot().error(`Failed to edit notification policy: ${result.error}`)
  return result
}

export const deleteNotificationPolicyAction: bp.IntegrationProps['actions']['deleteNotificationPolicy'] = async (props) => {
  const config = props.ctx.configuration
  const result = await deleteNotificationPolicy(config, props.input)
  if (!result.success) props.logger.forBot().error(`Failed to delete notification policy: ${result.error}`)
  return result
}

export const editDefaultNotificationPolicyAction: bp.IntegrationProps['actions']['editDefaultNotificationPolicy'] = async (props) => {
  const config = props.ctx.configuration
  const result = await editDefaultNotificationPolicy(config, props.input)
  if (!result.success) props.logger.forBot().error(`Failed to edit default notification policy: ${result.error}`)
  return result
}
