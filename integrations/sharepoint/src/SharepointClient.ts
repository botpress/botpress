import * as msal from '@azure/msal-node'
import * as sdk from '@botpress/sdk'
import axios from 'axios'
import {
  ChangeItem,
  ChangeResponse,
  SharePointFilesResponse,
  SharePointFoldersResponse,
  SharePointListsResponse,
} from './misc/SharepointTypes'
import { formatPrivateKey, handleAxiosError } from './misc/utils'
import * as bp from '.botpress'

export class SharepointClient {
  private _cca: msal.ConfidentialClientApplication
  private _primaryDomain: string
  private _siteName: string
  private _documentLibraryName: string | undefined

  public constructor(integrationConfiguration: bp.configuration.Configuration, documentLibraryName?: string) {
    this._cca = new msal.ConfidentialClientApplication({
      auth: {
        clientId: integrationConfiguration.clientId.trim(),
        authority: `https://login.microsoftonline.com/${integrationConfiguration.tenantId.trim()}`,
        clientCertificate: {
          thumbprint: integrationConfiguration.thumbprint.trim(),
          privateKey: formatPrivateKey(integrationConfiguration.privateKey),
        },
      },
    })

    this._primaryDomain = integrationConfiguration.primaryDomain.trim()
    this._siteName = integrationConfiguration.siteName.trim()
    this._documentLibraryName = documentLibraryName?.trim()
  }

  public getDocumentLibraryName(): string {
    if (!this._documentLibraryName) {
      throw new sdk.RuntimeError('[SharepointClient] documentLibraryName is not set on this client instance')
    }
    return this._documentLibraryName
  }

  private async _fetchToken(): Promise<string> {
    const tokenRequest = {
      scopes: [`https://${this._primaryDomain}.sharepoint.com/.default`],
    }
    const token = await this._cca.acquireTokenByClientCredential(tokenRequest)
    if (!token) {
      throw new sdk.RuntimeError('Error acquiring SharePoint OAuth token')
    }
    return token.accessToken
  }

  private get _baseUrl(): string {
    return `https://${this._primaryDomain}.sharepoint.com/sites/${this._siteName}`
  }

  private _odataVerboseHeaders(accessToken: string) {
    return {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json;odata=verbose',
    }
  }

  private async _getDocumentLibraryListId(): Promise<string> {
    const lib = this.getDocumentLibraryName()
    const url = `${this._baseUrl}/_api/web/lists/getbytitle('${lib}')?$select=Title,Id`
    const token = await this._fetchToken()
    const res = await axios.get(url, { headers: this._odataVerboseHeaders(token) }).catch(handleAxiosError)
    return res.data.d.Id
  }

  public async getLatestChangeToken(): Promise<string | null> {
    const changes = await this.getChanges(null)
    if (changes.length > 0) {
      return changes.at(-1)!.ChangeToken.StringValue
    }
    return null
  }

  public async getFilePath(listItemIndex: number): Promise<string | null> {
    const lib = this.getDocumentLibraryName()
    const url =
      `${this._baseUrl}/_api/web/lists/getbytitle('${lib}')/items(${listItemIndex})` +
      '/File?$select=Name,ServerRelativeUrl'
    const token = await this._fetchToken()
    const res: { data: { d: { Name: string | null; ServerRelativeUrl: string | null } } } = await axios
      .get(url, { headers: this._odataVerboseHeaders(token) })
      .catch(() => ({ data: { d: { Name: null, ServerRelativeUrl: null } } }))

    const { Name, ServerRelativeUrl } = res.data.d
    if (!Name || !ServerRelativeUrl) {
      return null
    }
    return ServerRelativeUrl
  }

  public async getChanges(changeToken: string | null): Promise<ChangeItem[]> {
    const lib = this.getDocumentLibraryName()
    const token = await this._fetchToken()
    const url = `${this._baseUrl}/_api/web/lists/getbytitle('${lib}')/GetChanges`
    const query: Record<string, unknown> = {
      Item: true,
      Add: true,
      Update: true,
      DeleteObject: true,
      Move: true,
      Restore: true,
    }
    if (changeToken !== null && changeToken !== 'initial-sync-token') {
      query.ChangeTokenStart = { StringValue: changeToken }
    }
    const res = await axios
      .post<ChangeResponse>(url, { query }, { headers: this._odataVerboseHeaders(token) })
      .catch(handleAxiosError)
    return res.data.d.results
  }

  public async registerWebhook(webhookUrl: string, clientState: string): Promise<string> {
    const listId = await this._getDocumentLibraryListId()
    const url = `${this._baseUrl}/_api/web/lists('${listId}')/subscriptions`
    const token = await this._fetchToken()
    const res = await axios
      .post(
        url,
        {
          clientState,
          resource: `${this._baseUrl}/_api/web/lists('${listId}')`,
          notificationUrl: webhookUrl,
          expirationDateTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        },
        { headers: this._odataVerboseHeaders(token) }
      )
      .catch(handleAxiosError)
    return res.data.d.id
  }

  public async renewWebhook(subscriptionId: string, newExpirationDateTime: string): Promise<void> {
    const listId = await this._getDocumentLibraryListId()
    const url = `${this._baseUrl}/_api/web/lists('${listId}')/subscriptions('${subscriptionId}')`
    const token = await this._fetchToken()
    await axios
      .patch(url, { expirationDateTime: newExpirationDateTime }, { headers: this._odataVerboseHeaders(token) })
      .catch(handleAxiosError)
  }

  public async unregisterWebhook(webhookId: string): Promise<void> {
    const listId = await this._getDocumentLibraryListId()
    const url = `${this._baseUrl}/_api/web/lists('${listId}')/subscriptions('${webhookId}')`
    const token = await this._fetchToken()
    await axios.delete(url, { headers: this._odataVerboseHeaders(token) }).catch(handleAxiosError)
  }

  public async listWebhookSubscriptions(): Promise<Array<{ id: string; notificationUrl: string }>> {
    const listId = await this._getDocumentLibraryListId()
    const url = `${this._baseUrl}/_api/web/lists('${listId}')/subscriptions`
    const token = await this._fetchToken()
    const res = await axios.get(url, { headers: this._odataVerboseHeaders(token) }).catch(handleAxiosError)
    return (res.data.d.results as Array<{ id: string; notificationUrl: string }>).map((s) => ({
      id: s.id,
      notificationUrl: s.notificationUrl,
    }))
  }

  public async listDocumentLibraries(): Promise<Array<{ name: string; serverRelativeUrl: string }>> {
    const token = await this._fetchToken()
    const url =
      `${this._baseUrl}/_api/web/lists` +
      '?$filter=BaseTemplate eq 101 and Hidden eq false' +
      '&$select=Title,RootFolder/ServerRelativeUrl&$expand=RootFolder'
    const res = await axios
      .get<SharePointListsResponse>(url, { headers: this._odataVerboseHeaders(token) })
      .catch(handleAxiosError)
    return res.data.d.results.map((lib) => ({
      name: lib.Title,
      serverRelativeUrl: lib.RootFolder.ServerRelativeUrl,
    }))
  }

  public async listFiles(
    serverRelativePath: string,
    nextUrl?: string
  ): Promise<{
    files: Array<{ name: string; serverRelativeUrl: string; length: number; timeLastModified: string; eTag: string }>
    nextUrl?: string
  }> {
    const token = await this._fetchToken()
    const url =
      nextUrl ??
      `${this._baseUrl}/_api/web/GetFolderByServerRelativeUrl('${serverRelativePath}')/Files` +
        '?$select=Name,ServerRelativeUrl,Length,TimeLastModified,ETag&$top=100'
    const res = await axios
      .get<SharePointFilesResponse>(url, { headers: this._odataVerboseHeaders(token) })
      .catch(handleAxiosError)
    return {
      files: res.data.d.results.map((f) => ({
        name: f.Name,
        serverRelativeUrl: f.ServerRelativeUrl,
        length: parseInt(f.Length, 10),
        timeLastModified: f.TimeLastModified,
        eTag: f.ETag,
      })),
      nextUrl: res.data.d.__next,
    }
  }

  public async listSubfolders(serverRelativePath: string): Promise<Array<{ name: string; serverRelativeUrl: string }>> {
    const token = await this._fetchToken()
    const url =
      `${this._baseUrl}/_api/web/GetFolderByServerRelativeUrl('${serverRelativePath}')/Folders` +
      "?$filter=Name ne 'Forms'"
    const res = await axios
      .get<SharePointFoldersResponse>(url, { headers: this._odataVerboseHeaders(token) })
      .catch(handleAxiosError)
    return res.data.d.results.map((f) => ({
      name: f.Name,
      serverRelativeUrl: f.ServerRelativeUrl,
    }))
  }

  public async downloadFile(serverRelativePath: string): Promise<ArrayBuffer> {
    const token = await this._fetchToken()
    const url = `${this._baseUrl}/_api/web/GetFileByServerRelativeUrl('${serverRelativePath}')/$value`
    const res = await axios
      .get<ArrayBuffer>(url, { headers: { Authorization: `Bearer ${token}` }, responseType: 'arraybuffer' })
      .catch(handleAxiosError)
    return res.data
  }
}
