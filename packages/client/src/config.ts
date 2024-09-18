import { isBrowser, isNode } from 'browser-or-node'
import * as types from './types'

const defaultApiUrl = 'https://api.botpress.cloud'
const defaultTimeout = 60_000

const apiUrlEnvName = 'BP_API_URL'
const botIdEnvName = 'BP_BOT_ID'
const integrationIdEnvName = 'BP_INTEGRATION_ID'
const workspaceIdEnvName = 'BP_WORKSPACE_ID'
const tokenEnvName = 'BP_TOKEN'

export function getClientConfig(clientProps: types.ClientProps): types.ClientConfig {
  const props = readEnvConfig(clientProps)

  let headers: Record<string, string | string[]> = {}

  if (props.workspaceId) {
    headers['x-workspace-id'] = props.workspaceId
  }

  if (props.botId) {
    headers['x-bot-id'] = props.botId
  }

  if (props.integrationId) {
    headers['x-integration-id'] = props.integrationId
  }

  if (props.token) {
    headers.Authorization = `Bearer ${props.token}`
  }

  headers = {
    ...headers,
    ...props.headers,
  }

  const apiUrl = props.apiUrl ?? defaultApiUrl
  const timeout = props.timeout ?? defaultTimeout

  return {
    apiUrl,
    timeout,
    withCredentials: isBrowser,
    headers,
  }
}

function readEnvConfig(props: types.ClientProps): types.ClientProps {
  if (isBrowser) {
    return getBrowserConfig(props)
  }

  if (isNode) {
    return getNodeConfig(props)
  }

  return props
}

function getNodeConfig(props: types.ClientProps): types.ClientProps {
  const config: types.ClientProps = {
    ...props,
    apiUrl: props.apiUrl ?? process.env[apiUrlEnvName],
    botId: props.botId ?? process.env[botIdEnvName],
    integrationId: props.integrationId ?? process.env[integrationIdEnvName],
    workspaceId: props.workspaceId ?? process.env[workspaceIdEnvName],
  }

  const token = config.token ?? process.env[tokenEnvName]

  if (token) {
    config.token = token
  }

  return config
}

function getBrowserConfig(props: types.ClientProps): types.ClientProps {
  return props
}
