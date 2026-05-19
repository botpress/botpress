import * as bp from '../../.botpress'
import { GrafanaClient } from '../client'

export const listDatasourcesAction: bp.IntegrationProps['actions']['listDatasources'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  const result = await client.listDatasources()
  if (!result.success) props.logger.forBot().error(`Failed to list datasources: ${result.error}`)
  return result
}

export const queryMetricsAction: bp.IntegrationProps['actions']['queryMetrics'] = async (props) => {
  const { datasourceUid, query, start, end, step } = props.input
  const client = new GrafanaClient(props.ctx.configuration)
  const result = await client.queryMetrics(datasourceUid, query, start, end, step)
  if (!result.success) props.logger.forBot().error(`Metrics query failed: ${result.error}`)
  return result
}

export const listMetricNamesAction: bp.IntegrationProps['actions']['listMetricNames'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  const result = await client.listMetricNames(props.input.datasourceUid)
  if (!result.success) props.logger.forBot().error(`Failed to list metric names: ${result.error}`)
  return result
}

export const listLabelNamesAction: bp.IntegrationProps['actions']['listLabelNames'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  const result = await client.listLabelNames(props.input.datasourceUid)
  if (!result.success) props.logger.forBot().error(`Failed to list label names: ${result.error}`)
  return result
}

export const listLabelValuesAction: bp.IntegrationProps['actions']['listLabelValues'] = async (props) => {
  const { datasourceUid, labelName } = props.input
  const client = new GrafanaClient(props.ctx.configuration)
  const result = await client.listLabelValues(datasourceUid, labelName)
  if (!result.success) props.logger.forBot().error(`Failed to list label values: ${result.error}`)
  return result
}
