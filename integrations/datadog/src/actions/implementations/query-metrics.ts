import { wrapAction } from '../action-wrapper'

export const queryMetrics = wrapAction(
  { actionName: 'queryMetrics', errorMessageWhenFailed: 'Failed to query Datadog metrics' },
  async ({ datadogClient }, { query, from, to }) => await datadogClient.queryMetrics({ query, from, to })
)

