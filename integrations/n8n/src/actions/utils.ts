import * as sdk from '@botpress/sdk'
import axios from 'axios'

const WEBHOOK_NODE_TYPE = 'n8n-nodes-base.webhook'

type n8nNode = {
  type: string
  parameters?: Record<string, unknown>
}

export type n8nWorkflow = {
  id?: string
  name?: string
  nodes?: n8nNode[]
  activeVersion?: {
    nodes?: n8nNode[]
  }
}

const buildUrl = (baseUrl: string, path: string, api: boolean): string => {
  const base = baseUrl.replace(/\/+$/, '')
  const prefix = api ? '/api/v1' : ''
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${prefix}${normalizedPath}`
}

export const buildPublicUrl = (baseUrl: string, path: string): string => buildUrl(baseUrl, path, false)

export const getn8nClient = (configuration: { baseUrl: string; accessKey: string }) =>
  axios.create({
    baseURL: buildUrl(configuration.baseUrl, '/', true),
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': configuration.accessKey,
    },
  })

export const wrapn8nError = (error: unknown, context = 'n8n request'): never => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const detail = status ? `HTTP ${status}` : (error.code ?? error.message ?? 'network error')
    throw new sdk.RuntimeError(`${context} failed: ${detail}`)
  }
  throw new sdk.RuntimeError(error instanceof Error ? error.message : String(error))
}

export const getWebhookPath = (workflow: n8nWorkflow): string | undefined => {
  const nodes = workflow?.nodes ?? workflow?.activeVersion?.nodes ?? []
  const webhookNode = nodes.find((node) => node?.type === WEBHOOK_NODE_TYPE)
  if (!webhookNode?.parameters) {
    return undefined
  }

  // n8n uses "path" as the standard parameter name for webhook nodes
  const path = webhookNode.parameters.path
  return typeof path === 'string' ? path : undefined
}

export const resolveWorkflowByIdOrName = async (
  baseUrl: string,
  accessKey: string,
  workflowIdOrName: string
): Promise<n8nWorkflow> => {
  const n8nClient = getn8nClient({ baseUrl, accessKey })

  try {
    const { data } = await n8nClient.get<n8nWorkflow>(`/workflows/${encodeURIComponent(workflowIdOrName)}`)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      // 404 means no match by ID; fall through to name-based search below
    } else {
      wrapn8nError(error)
    }
  }

  try {
    const { data } = await n8nClient.get<{ data?: n8nWorkflow[] }>('/workflows', {
      params: {
        name: workflowIdOrName,
        excludePinnedData: true,
      },
    })

    const exactMatch = (data?.data ?? []).find(
      (workflow) => workflow?.name === workflowIdOrName || workflow?.id === workflowIdOrName
    )

    if (exactMatch) {
      const { data: full } = await n8nClient.get<n8nWorkflow>(`/workflows/${exactMatch.id}`)
      return full
    }
  } catch (error) {
    wrapn8nError(error)
  }

  throw new sdk.RuntimeError(`Unable to resolve n8n workflow "${workflowIdOrName}"`)
}
