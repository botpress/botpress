import axios, { AxiosInstance } from 'axios'
import { McpClientError } from './error-handling'
import { withRetry } from './retry'
import type * as bp from '.botpress'

type McpTool = {
  name: string
  description?: string
  inputSchema?: unknown
}

type McpResource = {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

type McpContent = {
  type: 'text' | 'image' | 'resource'
  text?: string
  data?: string
  mimeType?: string
}

type McpResourceContent = {
  uri: string
  mimeType?: string
  text?: string
  blob?: string
}

type JsonRpcRequest = {
  jsonrpc: '2.0'
  id: number
  method: string
  params?: Record<string, unknown>
}

type JsonRpcResponse<T = unknown> = {
  jsonrpc: '2.0'
  id: number
  result?: T
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

/**
 * MCP Client that implements the Model Context Protocol over HTTP.
 * Uses JSON-RPC 2.0 for communication with MCP servers.
 */
export class McpClient {
  private readonly _http: AxiosInstance
  private _requestId = 0

  private constructor(
    private readonly _serverUrl: string,
    private readonly _apiKey: string | undefined,
    private readonly _timeout: number
  ) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (_apiKey) {
      headers['Authorization'] = `Bearer ${_apiKey}`
    }

    this._http = axios.create({
      baseURL: _serverUrl,
      timeout: _timeout,
      headers,
    })
  }

  public static create(ctx: bp.Context): McpClient {
    const { serverUrl, apiKey, timeout } = ctx.configuration
    return new McpClient(serverUrl, apiKey, timeout ?? 30000)
  }

  private async _sendRequest<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: ++this._requestId,
      method,
      params,
    }

    try {
      const response = await this._http.post<JsonRpcResponse<T>>('', request)

      if (response.data.error) {
        throw new McpClientError(response.data.error.message, method, response.data.error)
      }

      return response.data.result as T
    } catch (error) {
      if (error instanceof McpClientError) {
        throw error
      }

      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message
        throw new McpClientError(message, method, error)
      }

      throw new McpClientError(error instanceof Error ? error.message : String(error), method, error)
    }
  }

  public async initialize(): Promise<void> {
    try {
      await withRetry(
        async () => {
          await this._sendRequest('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'botpress-mcp-client',
              version: '0.1.0',
            },
          })
        },
        { maxAttempts: 3, initialDelayMs: 1000 }
      )

      await this._sendRequest('notifications/initialized', {})
    } catch (error) {
      throw new McpClientError('Failed to initialize connection to MCP server', 'initialize', error)
    }
  }

  public async listTools(): Promise<McpTool[]> {
    try {
      const result = await withRetry(async () => this._sendRequest<{ tools: McpTool[] }>('tools/list'), {
        maxAttempts: 2,
      })

      return result.tools ?? []
    } catch (error) {
      if (error instanceof McpClientError) {
        throw error
      }
      throw new McpClientError('Failed to list tools', 'listTools', error)
    }
  }

  public async callTool(
    name: string,
    args?: Record<string, unknown>
  ): Promise<{ content: McpContent[]; isError?: boolean }> {
    try {
      const result = await withRetry(
        async () =>
          this._sendRequest<{ content: McpContent[]; isError?: boolean }>('tools/call', {
            name,
            arguments: args ?? {},
          }),
        { maxAttempts: 2 }
      )

      return {
        content: result.content ?? [],
        isError: result.isError,
      }
    } catch (error) {
      if (error instanceof McpClientError) {
        throw error
      }
      throw new McpClientError(`Failed to call tool "${name}"`, 'callTool', error)
    }
  }

  public async listResources(): Promise<McpResource[]> {
    try {
      const result = await withRetry(async () => this._sendRequest<{ resources: McpResource[] }>('resources/list'), {
        maxAttempts: 2,
      })

      return result.resources ?? []
    } catch (error) {
      if (error instanceof McpClientError) {
        throw error
      }
      throw new McpClientError('Failed to list resources', 'listResources', error)
    }
  }

  public async readResource(uri: string): Promise<McpResourceContent[]> {
    try {
      const result = await withRetry(
        async () =>
          this._sendRequest<{ contents: McpResourceContent[] }>('resources/read', {
            uri,
          }),
        { maxAttempts: 2 }
      )

      return result.contents ?? []
    } catch (error) {
      if (error instanceof McpClientError) {
        throw error
      }
      throw new McpClientError(`Failed to read resource "${uri}"`, 'readResource', error)
    }
  }

  public async disconnect(): Promise<void> {}
}
