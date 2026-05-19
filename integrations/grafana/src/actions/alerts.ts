import * as sdk from '@botpress/sdk'
import * as bp from '../../.botpress'
import { alertRuleSchema } from '../../definitions/actions/create-alert-rule'
import { GrafanaClient } from '../client'

export const createAlertRuleAction: bp.IntegrationProps['actions']['createAlertRule'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    return await client.createAlertRule(alertRuleSchema.parse(props.input))
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}

export const getAlertRuleAction: bp.IntegrationProps['actions']['getAlertRule'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    return await client.getAlertRule(props.input.uid)
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}

export const listAlertRulesAction: bp.IntegrationProps['actions']['listAlertRules'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    return { alertRules: await client.listAlertRules() }
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}

export const deleteAlertRuleAction: bp.IntegrationProps['actions']['deleteAlertRule'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    await client.deleteAlertRule(props.input.uid)
    return {}
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}
