import * as sdk from '@botpress/sdk'
import * as bp from '../../.botpress'
import { GrafanaClient } from '../client'

export const createDashboardAction: bp.IntegrationProps['actions']['createDashboard'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    await client.createDashboard(props.input)
    return {}
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}

export const editDashboardAction: bp.IntegrationProps['actions']['editDashboard'] = async (props) => {
  const { dashboardUid, ...updates } = props.input
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    await client.editDashboard(dashboardUid, updates)
    return {}
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}

export const editDashboardPanelAction: bp.IntegrationProps['actions']['editDashboardPanel'] = async (props) => {
  const { dashboardUid, panelId, panel } = props.input
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    await client.editDashboardPanel(dashboardUid, panelId, panel)
    return {}
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}

export const getDashboardAction: bp.IntegrationProps['actions']['getDashboard'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    return await client.getDashboard(props.input.dashboardUid)
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}

export const listDashboardsAction: bp.IntegrationProps['actions']['listDashboards'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    return { dashboards: await client.listDashboards() }
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}

export const deleteDashboardAction: bp.IntegrationProps['actions']['deleteDashboard'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    await client.deleteDashboard(props.input.dashboardName)
    return {}
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}
