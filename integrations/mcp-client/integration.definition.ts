import * as sdk from '@botpress/sdk'
import { configuration, actions } from './definitions'

export const INTEGRATION_NAME = 'mcp-client'
export const INTEGRATION_VERSION = '0.1.0'

export default new sdk.IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: INTEGRATION_VERSION,
  title: 'MCP Client',
  description: 'Connect to any MCP (Model Context Protocol) server to use its tools and resources.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration,
  actions,
})
