import { isBrowser, isNode } from 'browser-or-node'

const defaultApiUrl = 'https://api.botpress.cloud'

const apiUrlEnvName = 'BP_API_URL'
const botIdEnvName = 'BP_BOT_ID'
const integrationIdEnvName = 'BP_INTEGRATION_ID'
const workspaceIdEnvName = 'BP_WORKSPACE_ID'
const tokenEnvName = 'BP_TOKEN'

export type ClientProps = {
  host?: string // TODO: rename to url
  integrationId?: string
  workspaceId?: string
  botId?: string
  token?: string
  timeout?: number
}

export type ClientConfig = {
  host: string // TODO: rename to url
  headers: Record<string, string>
  withCredentials: boolean
  timeout?: number
}

export function getClientConfig(clientProps: ClientProps): ClientConfig {
  const props = getProps(clientProps)

  const headers: Record<string, string> = {}

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
    headers['Authorization'] = `Bearer ${props.token}`
  }

  return {
    host: props.host ?? defaultApiUrl,
    withCredentials: isBrowser,
    headers,
  }
}

function getProps(props: ClientProps) {
  if (isBrowser) {
    return getBrowserConfig(props)
  }

  if (isNode) {
    return getNodeConfig(props)
  }

  return props
}

function getNodeConfig(props: ClientProps): ClientProps {
  const config: ClientProps = {
    ...props,
    host: props.host ?? process.env[apiUrlEnvName] ?? defaultApiUrl,
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

function getBrowserConfig(props: ClientProps): ClientProps {
  return props
}
