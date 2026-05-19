import * as bp from '../../.botpress'
import { notificationPolicySchema } from '../../definitions/notification-schemas'
import { GrafanaClient } from '../client'

export const createNotificationPolicyAction: bp.IntegrationProps['actions']['createNotificationPolicy'] = async (
  props
) => {
  const client = new GrafanaClient(props.ctx.configuration)
  const result = await client.createNotificationPolicy(notificationPolicySchema.parse(props.input))
  if (!result.success) props.logger.forBot().error(`Failed to create notification policy: ${result.error}`)
  return result
}

export const listNotificationPoliciesAction: bp.IntegrationProps['actions']['listNotificationPolicies'] = async (
  props
) => {
  const client = new GrafanaClient(props.ctx.configuration)
  const result = await client.listNotificationPolicies()
  if (!result.success) props.logger.forBot().error(`Failed to list notification policies: ${result.error}`)
  return result
}

export const editNotificationPolicyAction: bp.IntegrationProps['actions']['editNotificationPolicy'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  const result = await client.editNotificationPolicy(props.input)
  if (!result.success) props.logger.forBot().error(`Failed to edit notification policy: ${result.error}`)
  return result
}

export const deleteNotificationPolicyAction: bp.IntegrationProps['actions']['deleteNotificationPolicy'] = async (
  props
) => {
  const client = new GrafanaClient(props.ctx.configuration)
  const result = await client.deleteNotificationPolicy(props.input)
  if (!result.success) props.logger.forBot().error(`Failed to delete notification policy: ${result.error}`)
  return result
}

export const editDefaultNotificationPolicyAction: bp.IntegrationProps['actions']['editDefaultNotificationPolicy'] =
  async (props) => {
    const client = new GrafanaClient(props.ctx.configuration)
    const result = await client.editDefaultNotificationPolicy(props.input)
    if (!result.success) props.logger.forBot().error(`Failed to edit default notification policy: ${result.error}`)
    return result
  }
