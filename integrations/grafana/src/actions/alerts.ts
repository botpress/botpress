import * as bp from '../../.botpress'
import { alertRuleSchema } from '../../definitions/actions/create-alert-rule'
import { GrafanaClient } from '../client'

export const createAlertRuleAction: bp.IntegrationProps['actions']['createAlertRule'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    const result = await client.createAlertRule(alertRuleSchema.parse(props.input))
    if (!result.success) props.logger.forBot().error(`Failed to create alert rule: ${result.error}`)
    return result
  } catch (error_: unknown) {
    const error = error_ instanceof Error ? error_.message : String(error_)
    props.logger.forBot().error(`Failed to create alert rule: ${error}`)
    return { success: false, error }
  }
}

export const getAlertRuleAction: bp.IntegrationProps['actions']['getAlertRule'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  const result = await client.getAlertRule(props.input.uid)
  if (!result.success) props.logger.forBot().error(`Failed to get alert rule: ${result.error}`)
  return result
}

export const listAlertRulesAction: bp.IntegrationProps['actions']['listAlertRules'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  const result = await client.listAlertRules()
  if (!result.success) props.logger.forBot().error(`Failed to list alert rules: ${result.error}`)
  return result
}

export const deleteAlertRuleAction: bp.IntegrationProps['actions']['deleteAlertRule'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  const result = await client.deleteAlertRule(props.input.uid)
  if (!result.success) props.logger.forBot().error(`Failed to delete alert rule: ${result.error}`)
  return result
}
