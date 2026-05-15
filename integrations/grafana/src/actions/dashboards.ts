import * as bp from '../../.botpress'
import {
  createDashboard,
  editDashboard,
  editDashboardPanel,
  getDashboard,
  listDashboards,
  deleteDashboard,
} from '../clients/dashboards'
import { getK8sNamespace } from './utils'

export const createDashboardAction: bp.IntegrationProps['actions']['createDashboard'] = async (props) => {
  const nsResult = await getK8sNamespace(props)
  if (!nsResult.success) {
    props.logger.forBot().error(`Failed to load integration state: ${nsResult.error}`)
    return { success: false, error: nsResult.error }
  }
  const result = await createDashboard(props.ctx.configuration, nsResult.ns, props.input)
  if (!result.success) props.logger.forBot().error(`Failed to create dashboard: ${result.error}`)
  return result
}

export const editDashboardAction: bp.IntegrationProps['actions']['editDashboard'] = async (props) => {
  const { dashboardUid, ...updates } = props.input
  const nsResult = await getK8sNamespace(props)
  if (!nsResult.success) {
    props.logger.forBot().error(`Failed to load integration state: ${nsResult.error}`)
    return { success: false, error: nsResult.error }
  }
  const result = await editDashboard(props.ctx.configuration, nsResult.ns, dashboardUid, updates)
  if (!result.success) props.logger.forBot().error(`Failed to edit dashboard: ${result.error}`)
  return result
}

export const editDashboardPanelAction: bp.IntegrationProps['actions']['editDashboardPanel'] = async (props) => {
  const { dashboardUid, panelId, panel } = props.input
  const nsResult = await getK8sNamespace(props)
  if (!nsResult.success) {
    props.logger.forBot().error(`Failed to load integration state: ${nsResult.error}`)
    return { success: false, error: nsResult.error }
  }
  const result = await editDashboardPanel(props.ctx.configuration, nsResult.ns, dashboardUid, panelId, panel)
  if (!result.success) props.logger.forBot().error(`Failed to edit panel: ${result.error}`)
  return result
}

export const getDashboardAction: bp.IntegrationProps['actions']['getDashboard'] = async (props) => {
  const { dashboardUid } = props.input
  const nsResult = await getK8sNamespace(props)
  if (!nsResult.success) {
    props.logger.forBot().error(`Failed to load integration state: ${nsResult.error}`)
    return { success: false, error: nsResult.error }
  }
  const result = await getDashboard(props.ctx.configuration, nsResult.ns, dashboardUid)
  if (!result.success) props.logger.forBot().error(`Failed to get dashboard: ${result.error}`)
  return result
}

export const listDashboardsAction: bp.IntegrationProps['actions']['listDashboards'] = async (props) => {
  const nsResult = await getK8sNamespace(props)
  if (!nsResult.success) {
    props.logger.forBot().error(`Failed to load integration state: ${nsResult.error}`)
    return { dashboards: [] }
  }
  const result = await listDashboards(props.ctx.configuration, nsResult.ns)
  if (!result.success) {
    props.logger.forBot().error(`Failed to list dashboards: ${result.error}`)
    return { dashboards: [] }
  }
  return { dashboards: result.data || [] }
}

export const deleteDashboardAction: bp.IntegrationProps['actions']['deleteDashboard'] = async (props) => {
  const { dashboardName } = props.input
  const nsResult = await getK8sNamespace(props)
  if (!nsResult.success) {
    props.logger.forBot().error(`Failed to load integration state: ${nsResult.error}`)
    return { success: false, error: nsResult.error }
  }
  const result = await deleteDashboard(props.ctx.configuration, nsResult.ns, dashboardName)
  if (!result.success) props.logger.forBot().error(`Failed to delete dashboard: ${result.error}`)
  return result
}
