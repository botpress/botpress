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
  const config = props.ctx.configuration
  const ns = await getK8sNamespace(props)
  const result = await createDashboard(config, ns, props.input)
  if (!result.success) props.logger.forBot().error(`Failed to create dashboard: ${result.error}`)
  return result
}

export const editDashboardAction: bp.IntegrationProps['actions']['editDashboard'] = async (props) => {
  const { dashboardUid, ...updates } = props.input
  const config = props.ctx.configuration
  const ns = await getK8sNamespace(props)
  const result = await editDashboard(config, ns, dashboardUid, updates)
  if (!result.success) props.logger.forBot().error(`Failed to edit dashboard: ${result.error}`)
  return result
}

export const editDashboardPanelAction: bp.IntegrationProps['actions']['editDashboardPanel'] = async (props) => {
  const { dashboardUid, panelId, panel } = props.input
  const config = props.ctx.configuration
  const ns = await getK8sNamespace(props)
  const result = await editDashboardPanel(config, ns, dashboardUid, panelId, panel)
  if (!result.success) props.logger.forBot().error(`Failed to edit panel: ${result.error}`)
  return result
}

export const getDashboardAction: bp.IntegrationProps['actions']['getDashboard'] = async (props) => {
  const { dashboardUid } = props.input
  const config = props.ctx.configuration
  const ns = await getK8sNamespace(props)
  const result = await getDashboard(config, ns, dashboardUid)
  if (!result.success) props.logger.forBot().error(`Failed to get dashboard: ${result.error}`)
  return result
}

export const listDashboardsAction: bp.IntegrationProps['actions']['listDashboards'] = async (props) => {
  const config = props.ctx.configuration
  const ns = await getK8sNamespace(props)
  const result = await listDashboards(config, ns)
  if (!result.success) {
    props.logger.forBot().error(`Failed to list dashboards: ${result.error}`)
    return { dashboards: [] }
  }
  return { dashboards: result.data || [] }
}

export const deleteDashboardAction: bp.IntegrationProps['actions']['deleteDashboard'] = async (props) => {
  const { dashboardName } = props.input
  const config = props.ctx.configuration
  const ns = await getK8sNamespace(props)
  const result = await deleteDashboard(config, ns, dashboardName)
  if (!result.success) props.logger.forBot().error(`Failed to delete dashboard: ${result.error}`)
  return result
}
