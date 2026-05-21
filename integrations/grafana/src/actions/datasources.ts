import * as sdk from '@botpress/sdk'
import * as bp from '../../.botpress'
import { GrafanaClient } from '../client'

export const listDatasourcesAction: bp.IntegrationProps['actions']['listDatasources'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    return { datasources: await client.listDatasources() }
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}

export const queryMetricsAction: bp.IntegrationProps['actions']['queryMetrics'] = async (props) => {
  const { datasourceUid, query, start, end, step } = props.input
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    return await client.queryMetrics(datasourceUid, query, start, end, step)
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}

export const listMetricNamesAction: bp.IntegrationProps['actions']['listMetricNames'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    return { metricNames: await client.listMetricNames(props.input.datasourceUid) }
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}

export const listLabelNamesAction: bp.IntegrationProps['actions']['listLabelNames'] = async (props) => {
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    return { labelNames: await client.listLabelNames(props.input.datasourceUid) }
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}

export const listLabelValuesAction: bp.IntegrationProps['actions']['listLabelValues'] = async (props) => {
  const { datasourceUid, labelName } = props.input
  const client = new GrafanaClient(props.ctx.configuration)
  try {
    return { labelValues: await client.listLabelValues(datasourceUid, labelName) }
  } catch (error_: unknown) {
    throw new sdk.RuntimeError(error_ instanceof Error ? error_.message : String(error_))
  }
}
