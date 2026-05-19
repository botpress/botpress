import * as bp from '../../.botpress'
import { GrafanaClient } from '../client'

export const createDashboardAction: bp.IntegrationProps['actions']['createDashboard'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    const result = await client.createDashboard(props.input)
    if (!result.success) props.logger.forBot().error(`Failed to create dashboard: ${result.error}`)
    return result
  } catch (error_: unknown) {
    const error = error_ instanceof Error ? error_.message : String(error_)
    props.logger.forBot().error(`Failed to create dashboard: ${error}`)
    return { success: false, error }
  }
}

export const editDashboardAction: bp.IntegrationProps['actions']['editDashboard'] = async (props) => {
  const { dashboardUid, ...updates } = props.input
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    const result = await client.editDashboard(dashboardUid, updates)
    if (!result.success) props.logger.forBot().error(`Failed to edit dashboard: ${result.error}`)
    return result
  } catch (error_: unknown) {
    const error = error_ instanceof Error ? error_.message : String(error_)
    props.logger.forBot().error(`Failed to edit dashboard: ${error}`)
    return { success: false, error }
  }
}

export const editDashboardPanelAction: bp.IntegrationProps['actions']['editDashboardPanel'] = async (props) => {
  const { dashboardUid, panelId, panel } = props.input
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    const result = await client.editDashboardPanel(dashboardUid, panelId, panel)
    if (!result.success) props.logger.forBot().error(`Failed to edit panel: ${result.error}`)
    return result
  } catch (error_: unknown) {
    const error = error_ instanceof Error ? error_.message : String(error_)
    props.logger.forBot().error(`Failed to edit panel: ${error}`)
    return { success: false, error }
  }
}

export const getDashboardAction: bp.IntegrationProps['actions']['getDashboard'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    const result = await client.getDashboard(props.input.dashboardUid)
    if (!result.success) props.logger.forBot().error(`Failed to get dashboard: ${result.error}`)
    return result
  } catch (error_: unknown) {
    const error = error_ instanceof Error ? error_.message : String(error_)
    props.logger.forBot().error(`Failed to get dashboard: ${error}`)
    return { success: false, error }
  }
}

export const listDashboardsAction: bp.IntegrationProps['actions']['listDashboards'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    const result = await client.listDashboards()
    if (!result.success) {
      props.logger.forBot().error(`Failed to list dashboards: ${result.error}`)
      return { dashboards: [] }
    }
    return { dashboards: result.data || [] }
  } catch (error_: unknown) {
    const error = error_ instanceof Error ? error_.message : String(error_)
    props.logger.forBot().error(`Failed to list dashboards: ${error}`)
    return { dashboards: [] }
  }
}

export const deleteDashboardAction: bp.IntegrationProps['actions']['deleteDashboard'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    const result = await client.deleteDashboard(props.input.dashboardName)
    if (!result.success) props.logger.forBot().error(`Failed to delete dashboard: ${result.error}`)
    return result
  } catch (error_: unknown) {
    const error = error_ instanceof Error ? error_.message : String(error_)
    props.logger.forBot().error(`Failed to delete dashboard: ${error}`)
    return { success: false, error }
  }
}
