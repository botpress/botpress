import * as bp from '../../.botpress'
import { listDatasources, queryMetrics, listMetricNames, listLabelNames, listLabelValues } from '../clients/datasources'

export const listDatasourcesAction: bp.IntegrationProps['actions']['listDatasources'] = async (props) => {
  const config = props.ctx.configuration
  const result = await listDatasources(config)
  if (!result.success) props.logger.forBot().error(`Failed to list datasources: ${result.error}`)
  return result
}

export const queryMetricsAction: bp.IntegrationProps['actions']['queryMetrics'] = async (props) => {
  const { datasourceUid, query, start, end, step } = props.input
  const config = props.ctx.configuration
  const result = await queryMetrics(config, datasourceUid, query, start, end, step)
  if (!result.success) props.logger.forBot().error(`Metrics query failed: ${result.error}`)
  return result
}

export const listMetricNamesAction: bp.IntegrationProps['actions']['listMetricNames'] = async (props) => {
  const { datasourceUid } = props.input
  const config = props.ctx.configuration
  const result = await listMetricNames(config, datasourceUid)
  if (!result.success) props.logger.forBot().error(`Failed to list metric names: ${result.error}`)
  return result
}

export const listLabelNamesAction: bp.IntegrationProps['actions']['listLabelNames'] = async (props) => {
  const { datasourceUid } = props.input
  const config = props.ctx.configuration
  const result = await listLabelNames(config, datasourceUid)
  if (!result.success) props.logger.forBot().error(`Failed to list label names: ${result.error}`)
  return result
}

export const listLabelValuesAction: bp.IntegrationProps['actions']['listLabelValues'] = async (props) => {
  const { datasourceUid, labelName } = props.input
  const config = props.ctx.configuration
  const result = await listLabelValues(config, datasourceUid, labelName)
  if (!result.success) props.logger.forBot().error(`Failed to list label values: ${result.error}`)
  return result
}
