import * as bp from '../../.botpress'
import { alertRuleSchema } from '../../definitions/actions/create-alert-rule'
import { createAlertRule, getAlertRule, listAlertRules, deleteAlertRule } from '../clients/alerts'

export const createAlertRuleAction: bp.IntegrationProps['actions']['createAlertRule'] = async (props) => {
  const config = props.ctx.configuration
  try {
    const result = await createAlertRule(config, alertRuleSchema.parse(props.input))
    if (!result.success) props.logger.forBot().error(`Failed to create alert rule: ${result.error}`)
    return result
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    props.logger.forBot().error(`Failed to create alert rule: ${error.message}`)
    return { success: false, error: error.message }
  }
}

export const getAlertRuleAction: bp.IntegrationProps['actions']['getAlertRule'] = async (props) => {
  const { uid } = props.input
  const config = props.ctx.configuration
  const result = await getAlertRule(config, uid)
  if (!result.success) props.logger.forBot().error(`Failed to get alert rule: ${result.error}`)
  return result
}

export const listAlertRulesAction: bp.IntegrationProps['actions']['listAlertRules'] = async (props) => {
  const config = props.ctx.configuration
  const result = await listAlertRules(config)
  if (!result.success) props.logger.forBot().error(`Failed to list alert rules: ${result.error}`)
  return result
}

export const deleteAlertRuleAction: bp.IntegrationProps['actions']['deleteAlertRule'] = async (props) => {
  const { uid } = props.input
  const config = props.ctx.configuration
  const result = await deleteAlertRule(config, uid)
  if (!result.success) props.logger.forBot().error(`Failed to delete alert rule: ${result.error}`)
  return result
}
