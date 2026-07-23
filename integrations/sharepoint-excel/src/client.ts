import * as msal from '@azure/msal-node'
import * as sdk from '@botpress/sdk'
import axios, { AxiosInstance } from 'axios'
import { formatPrivateKey } from './misc/utils'
import * as bp from '.botpress'

type DocumentLibrary = { id: string; name: string; webUrl: string }

export class SharepointClient {
  private _msalClient: msal.ConfidentialClientApplication
  private _graphApi: AxiosInstance
  private _siteIdCache?: string
  private _primaryDomain: string
  private _siteName: string

  public constructor(config: bp.configuration.Configuration) {
    this._primaryDomain = config.primaryDomain.trim()
    this._siteName = config.siteName.trim()

    this._msalClient = new msal.ConfidentialClientApplication({
      auth: {
        clientId: config.clientId.trim(),
        authority: `https://login.microsoftonline.com/${config.tenantId.trim()}`,
        clientCertificate: {
          thumbprint: config.thumbprint.trim(),
          privateKey: formatPrivateKey(config.privateKey),
        },
      },
    })

    this._graphApi = axios.create({ baseURL: 'https://graph.microsoft.com/v1.0' })
    this._graphApi.interceptors.request.use(async (requestConfig) => {
      const tokenResponse = await this._msalClient.acquireTokenByClientCredential({
        scopes: ['https://graph.microsoft.com/.default'],
      })
      if (tokenResponse?.accessToken) {
        requestConfig.headers.Authorization = `Bearer ${tokenResponse.accessToken}`
      } else {
        throw new sdk.RuntimeError('SharepointClient: Failed to acquire access token.')
      }
      return requestConfig
    })
  }

  public async getSiteId(): Promise<string> {
    if (this._siteIdCache) {
      return this._siteIdCache
    }

    const hostname = this._primaryDomain.includes('.sharepoint.com')
      ? this._primaryDomain
      : `${this._primaryDomain}.sharepoint.com`

    const siteGraphPath = `/sites/${hostname}:/sites/${this._siteName}`

    try {
      const response = await this._graphApi.get(siteGraphPath)
      const siteId: string | undefined = response.data?.id
      if (!siteId) {
        throw new sdk.RuntimeError(
          `Could not retrieve a valid site ID for hostname "${hostname}" and site name "${this._siteName}".`
        )
      }
      this._siteIdCache = siteId
      return siteId
    } catch (error) {
      throw new sdk.RuntimeError(`SharepointClient: Error fetching site ID for "${siteGraphPath}": ${describe(error)}`)
    }
  }

  public async listDocumentLibraries(): Promise<DocumentLibrary[]> {
    const siteId = await this.getSiteId()
    try {
      const response = await this._graphApi.get(`/sites/${siteId}/drives`)
      const drives: Array<{ id: string; name: string; webUrl: string }> = response.data?.value ?? []
      return drives.map((drive) => ({ id: drive.id, name: drive.name, webUrl: drive.webUrl }))
    } catch (error) {
      throw new sdk.RuntimeError(`Error listing document libraries: ${describe(error)}`)
    }
  }

  /**
   * Downloads the file content, or returns `null` when the file does not exist
   * (unknown document library or a 404 from Graph). Any other failure throws.
   * Returning `null` lets callers branch on "not found" type-safely instead of
   * pattern-matching error messages.
   */
  public async getFileContentByUrl(fileUrl: string): Promise<Buffer | null> {
    const relativePath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl
    const siteId = await this.getSiteId()

    // e.g. "doclib1/Book.xlsx" -> ["doclib1", "Book.xlsx"]
    const pathParts = relativePath.split('/').filter((part) => part)
    if (pathParts.length < 2) {
      throw new sdk.RuntimeError('Invalid file path. Expected format: /{documentLibrary}/{filePath}')
    }

    const documentLibraryName = pathParts[0] as string
    const filePath = '/' + pathParts.slice(1).join('/')

    try {
      const drivesResponse = await this._graphApi.get(`/sites/${siteId}/drives`)
      const drives: Array<{ id: string; name: string }> = drivesResponse.data?.value ?? []

      const drive = drives.find(
        (d) =>
          d.name.toLowerCase() === documentLibraryName.toLowerCase() ||
          d.name.toLowerCase() === decodeURIComponent(documentLibraryName).toLowerCase()
      )

      // No matching document library means the file cannot exist; surface as not-found.
      if (!drive) {
        return null
      }

      const graphApiUrl = `/sites/${siteId}/drives/${drive.id}/root:${filePath}:/content`
      const response = await this._graphApi.get(graphApiUrl, { responseType: 'arraybuffer' })
      return Buffer.from(response.data)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      throw new sdk.RuntimeError(`Failed to fetch file content from SharePoint URL "${fileUrl}". ${describe(error)}`)
    }
  }
}

const describe = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const data = error.response?.data
    const body =
      data === undefined
        ? ''
        : Buffer.isBuffer(data)
          ? data.toString()
          : typeof data === 'object'
            ? JSON.stringify(data)
            : String(data)
    return `status ${status ?? 'unknown'}: ${body.slice(0, 500)} (${error.message})`
  }
  return error instanceof Error ? error.message : String(error)
}

export const getSharepointClient = (config: bp.configuration.Configuration): SharepointClient =>
  new SharepointClient(config)
