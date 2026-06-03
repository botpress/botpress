import * as sdk from '@botpress/sdk'
import * as bp from '../../.botpress'
import { notificationPolicySchema } from '../../definitions/notification-schemas'
import { GrafanaClient } from '../client'

export const createNotificationPolicyAction: bp.IntegrationProps['actions']['createNotificationPolicy'] = async (
  props
) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    await client.createNotificationPolicy(notificationPolicySchema.parse(props.input))
    return {}
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}

export const listNotificationPoliciesAction: bp.IntegrationProps['actions']['listNotificationPolicies'] = async (
  props
) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    return { policies: await client.listNotificationPolicies() }
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}

export const editNotificationPolicyAction: bp.IntegrationProps['actions']['editNotificationPolicy'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    await client.editNotificationPolicy(props.input)
    return {}
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}

export const deleteNotificationPolicyAction: bp.IntegrationProps['actions']['deleteNotificationPolicy'] = async (
  props
) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    await client.deleteNotificationPolicy(props.input)
    return {}
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}

export const editDefaultNotificationPolicyAction: bp.IntegrationProps['actions']['editDefaultNotificationPolicy'] =
  async (props) => {
    const client = new GrafanaClient(props.ctx.configuration)
    try {
      await client.editDefaultNotificationPolicy(props.input)
      return {}
    } catch (error_: unknown) {
      throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
    }
  }
