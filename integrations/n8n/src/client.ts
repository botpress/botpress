import * as sdk from '@botpress/sdk'
import axios, { type AxiosInstance } from 'axios'
import { isNotFoundResponse, wrapN8nError, wrapRegistrationError } from './errors'
import type { N8nConfiguration, N8nWorkflow, ListWorkflowsInput, TriggerWorkflowWebhookInput } from './types'

const WEBHOOK_NODE_TYPE = 'n8n-nodes-base.webhook'

export class N8nClient {
  private readonly _baseUrl: string
  private readonly _client: AxiosInstance

  public constructor(configuration: N8nConfiguration) {
    this._baseUrl = configuration.baseUrl
    this._client = axios.create({
      baseURL: this._buildApiUrl('/'),
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': configuration.accessKey,
      },
    })
  }

  public async validateConnection(): Promise<void> {
    try {
      await this._client.get('/workflows', {
        params: {
          limit: 1,
          excludePinnedData: true,
        },
      })
    } catch (error) {
      return wrapRegistrationError(error, this._baseUrl)
    }
  }

  public async listWorkflows(input: ListWorkflowsInput) {
    try {
      const { data } = await this._client.get('/workflows', {
        params: {
          active: input.active,
          name: input.name,
          tags: input.tags,
          projectId: input.projectId,
          excludePinnedData: input.excludePinnedData,
          limit: input.limit,
          cursor: input.cursor,
        },
      })

      return {
        data: data?.data ?? [],
        nextCursor: data?.nextCursor ?? undefined,
      }
    } catch (error) {
      return wrapN8nError(error)
    }
  }

  public async getWorkflow(workflowId: string, excludePinnedData = true): Promise<N8nWorkflow> {
    try {
      return await this._getWorkflowById(workflowId, excludePinnedData)
    } catch (error) {
      if (isNotFoundResponse(error)) {
        throw new sdk.RuntimeError(`n8n workflow "${workflowId}" not found`)
      }
      return wrapN8nError(error)
    }
  }

  public async triggerWorkflowWebhook(input: TriggerWorkflowWebhookInput) {
    const workflow = await this._resolveWorkflowByIdOrName(input.workflowIdOrName)
    const webhookPath = this._getWebhookPath(workflow)

    if (!webhookPath) {
      throw new sdk.RuntimeError('Unable to find an n8n webhook node with a path parameter in the selected workflow')
    }

    const webhookUrl = this._buildPublicUrl(`/webhook/${webhookPath.replace(/^\/+/, '')}`)

    try {
      // Webhook URLs are public endpoints, no need to use the API key.
      const response = await axios.post(webhookUrl, {
        ...input.body,
        workflowId: workflow.id,
        workflowName: workflow.name,
      })

      return {
        workflowId: workflow.id,
        workflowName: workflow.name,
        response: response.data,
      }
    } catch (error) {
      return wrapN8nError(error, 'n8n webhook trigger')
    }
  }

  private async _resolveWorkflowByIdOrName(workflowIdOrName: string): Promise<N8nWorkflow> {
    try {
      return await this._getWorkflowById(workflowIdOrName)
    } catch (error) {
      if (!isNotFoundResponse(error)) {
        return wrapN8nError(error)
      }
    }

    try {
      const { data } = await this._client.get<{ data?: N8nWorkflow[] }>('/workflows', {
        params: {
          name: workflowIdOrName,
          excludePinnedData: true,
        },
      })

      const exactMatch = (data?.data ?? []).find(
        (workflow) => workflow?.name === workflowIdOrName || workflow?.id === workflowIdOrName
      )

      if (exactMatch?.id) {
        return await this._getWorkflowById(exactMatch.id)
      }
    } catch (error) {
      return wrapN8nError(error)
    }

    throw new sdk.RuntimeError(`Unable to resolve n8n workflow "${workflowIdOrName}"`)
  }

  private async _getWorkflowById(workflowId: string, excludePinnedData = true): Promise<N8nWorkflow> {
    const { data } = await this._client.get<N8nWorkflow>(`/workflows/${encodeURIComponent(workflowId)}`, {
      params: {
        excludePinnedData,
      },
    })
    return data
  }

  private _getWebhookPath(workflow: N8nWorkflow): string | undefined {
    const nodes = workflow?.nodes ?? workflow?.activeVersion?.nodes ?? []
    const webhookNode = nodes.find((node) => node?.type === WEBHOOK_NODE_TYPE)
    const path = webhookNode?.parameters?.path

    return typeof path === 'string' ? path : undefined
  }

  private _buildApiUrl(path: string): string {
    return this._buildUrl(path, true)
  }

  private _buildPublicUrl(path: string): string {
    return this._buildUrl(path, false)
  }

  private _buildUrl(path: string, api: boolean): string {
    const base = this._baseUrl.replace(/\/+$/, '')
    const prefix = api ? '/api/v1' : ''
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${base}${prefix}${normalizedPath}`
  }
}
