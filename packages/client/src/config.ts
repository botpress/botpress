import { AxiosRequestConfig } from 'axios'
import { isBrowser, isNode } from 'browser-or-node'

const defaultApiUrl = 'https://api.botpress.cloud'
const defaultTimeout = 60_000
const defaultMaxBodyLength = 100 * 1024 * 1024 // 100MB
const defaultMaxContentLength = 1024 * 1024 * 1024 // 100MB

const apiUrlEnvName = 'BP_API_URL'
const botIdEnvName = 'BP_BOT_ID'
const integrationIdEnvName = 'BP_INTEGRATION_ID'
const workspaceIdEnvName = 'BP_WORKSPACE_ID'
const tokenEnvName = 'BP_TOKEN'

type Merge<A extends object, B extends object> = Omit<A, keyof B> & B

type AxiosConfig = Omit<AxiosRequestConfig, 'url' | 'headers' | 'withCredentials' | 'baseURL' | 'method' | 'data'>

export type ClientProps = Merge<
  AxiosConfig,
  {
    url?: string
    integrationId?: string
    workspaceId?: string
    botId?: string
    token?: string
  }
>

export type ClientConfig = Merge<
  AxiosConfig,
  {
    url: string
    headers: Record<string, string>
    withCredentials: boolean
    timeout: number
    maxBodyLength: number
    maxContentLength: number
  }
>

export function getClientConfig(clientProps: ClientProps): ClientConfig {
  const { workspaceId, botId, integrationId, token, url, ...props } = readEnvConfig(clientProps)

  const headers: Record<string, string> = {}

  if (workspaceId) {
    headers['x-workspace-id'] = workspaceId
  }

  if (botId) {
    headers['x-bot-id'] = botId
  }

  if (integrationId) {
    headers['x-integration-id'] = integrationId
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return {
    url: url ?? defaultApiUrl,
    withCredentials: isBrowser,
    headers,

    timeout: props.timeout ?? defaultTimeout,
    maxBodyLength: props.maxBodyLength ?? defaultMaxBodyLength,
    maxContentLength: props.maxContentLength ?? defaultMaxContentLength,

    ...props,
  }
}

function readEnvConfig(props: ClientProps): ClientProps {
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
    url: props.url ?? process.env[apiUrlEnvName],
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
