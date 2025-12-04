import { callTool } from './call-tool'
import { listResources } from './list-resources'
import { listTools } from './list-tools'
import { readResource } from './read-resource'
import type * as bp from '.botpress'

export const actions = {
  listTools,
  callTool,
  listResources,
  readResource,
} as const satisfies bp.IntegrationProps['actions']
