import axios from 'axios'
import * as msal from '@azure/msal-node'
import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { formatPrivateKey, handleAxiosError } from './misc/utils'
import { ChangeItem, ChangeResponse, SharePointItem, SharePointItemsResponse } from './misc/SharepointTypes'

export class SharepointClient {
  private cca: msal.ConfidentialClientApplication
  private primaryDomain: string
  private siteName: string
  private documentLibraryName: string

  private folderKbMap: Record<string, string[]> = {}

  constructor(integrationConfiguration: bp.configuration.Configuration, documentLibraryName: string) {
    this.cca = new msal.ConfidentialClientApplication({
      auth: {
        clientId: integrationConfiguration.clientId,
        authority: `https://login.microsoftonline.com/${integrationConfiguration.tenantId}`,
        clientCertificate: {
          thumbprint: integrationConfiguration.thumbprint,
          privateKey: formatPrivateKey(integrationConfiguration.privateKey),
        },
      },
    })

    this.primaryDomain = integrationConfiguration.primaryDomain
    this.siteName = integrationConfiguration.siteName
    const lib = documentLibraryName
    if (!lib) {
      throw new Error(
        '[SharepointClient] documentLibraryName is required ' + '(the calling code should inject one per library)'
      )
    }
    this.documentLibraryName = lib

    // Attempt to parse folderKbMap from the JSON string
    try {
      if (integrationConfiguration.folderKbMap) {
        this.folderKbMap = JSON.parse(integrationConfiguration.folderKbMap)
      }
    } catch (err) {
      console.warn('[SharepointClient] Failed parsing folderKbMap:', err)
      this.folderKbMap = {}
    }
  }

  /** Expose the configured document library name */
  public getDocumentLibraryName(): string {
    return this.documentLibraryName
  }

  /**
   * Return all KB IDs whose prefixes match the relative path,
   * ordered longest‑to‑shortest, so callers can:
   *   • use kbIds[0] for exclusive routing  OR
   *   • iterate them all for duplicate routing
   */
  public getKbForPath(fileRelPath: string): string[] {
    const rel = fileRelPath.toLowerCase()
    const hits: { kbId: string; len: number }[] = []

    for (const [kbId, folderList] of Object.entries(this.folderKbMap)) {
      for (const raw of folderList) {
        const f = raw.toLowerCase()

        // Root of the document‑library
        if (f === '' && !rel.includes('/')) {
          hits.push({ kbId, len: 0 })
          continue
        }

        // Exact match or prefix match
        if (rel === f || rel.startsWith(f + '/')) {
          hits.push({ kbId, len: f.length })
        }
      }
    }

    // Sort longest → shortest so index 0 is the most specific KB
    return hits.sort((a, b) => b.len - a.len).map((h) => h.kbId)
  }

  /**
   * Fetch an OAuth token from Azure AD
   */
  private async fetchToken(): Promise<msal.AuthenticationResult> {
    try {
      const tokenRequest = {
        scopes: [`https://${this.primaryDomain}.sharepoint.com/.default`],
      }
      const token = await this.cca.acquireTokenByClientCredential(tokenRequest)

      if (token === null) {
        throw new sdk.RuntimeError(`Error acquiring sp OAuth token`)
      }
      return token
    } catch (e) {
      throw new sdk.RuntimeError(`Error while acquiring sp OAuth token ${e}`)
    }
  }

  /**
   * Return the list ID of the document library
   */
  private async getDocumentLibraryListId(): Promise<string> {
    const url = `https://${this.primaryDomain}.sharepoint.com/sites/${this.siteName}/_api/web/lists/getbytitle('${this.documentLibraryName}')?$select=Title,Id`
    const token = await this.fetchToken()
    const res = await axios
      .get(url, {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          Accept: 'application/json;odata=verbose',
        },
      })
      .catch(handleAxiosError)

    if (!res) {
      throw new sdk.RuntimeError(`Error initializing list ID`)
    }

    return res.data.d.Id
  }

  /**
   * Get the latest ChangeToken from the doc library
   */
  async getLatestChangeToken(): Promise<string | null> {
    const changes = await this.getChanges(null)
    if (changes.length > 0) {
      return changes.at(-1)!.ChangeToken.StringValue
    }
    return null
  }

  /**
   * Downloads a file from SharePoint
   * @param fileName - The path to the file
   * @returns - The file content as an ArrayBuffer
   */
  async downloadFile(fileName: string): Promise<ArrayBuffer> {
    const url = `https://${this.primaryDomain}.sharepoint.com/sites/${this.siteName}/_api/web/GetFolderByServerRelativeUrl('${this.documentLibraryName}')/Files('${fileName}')/$value`

    const token = await this.fetchToken()
    const authToken = `Bearer ${token.accessToken}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authToken,
      },
    })

    const arrayBuffer = await response.arrayBuffer()
    return arrayBuffer
  }

  /**
   * Returns the *full server-relative path*, e.g. "/sites/envy/doclib1/folder1/doc4.docx",
   * for the given list item. If none found, returns null.
   */
  async getFilePath(listItemIndex: number): Promise<string | null> {
    const url =
      `https://${this.primaryDomain}.sharepoint.com/sites/${this.siteName}` +
      `/_api/web/lists/getbytitle('${this.documentLibraryName}')/items(${listItemIndex})` +
      `/File?$select=Name,ServerRelativeUrl`

    const token = await this.fetchToken()

    const res = await axios
      .get(url, {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          Accept: 'application/json;odata=verbose',
        },
      })
      .catch(() => ({ data: { d: { Name: null, ServerRelativeUrl: null } } }))

    const { Name, ServerRelativeUrl } = res.data.d
    if (!Name || !ServerRelativeUrl) {
      return null
    }

    // Return the full path ("/sites/envy/doclib1/folder/doc4.docx")
    return ServerRelativeUrl
  }

  /**
   * Get changes from the doc library since a specific change token
   */
  async getChanges(changeToken: string | null): Promise<ChangeItem[]> {
    const token = await this.fetchToken()
    const url = `https://${this.primaryDomain}.sharepoint.com/sites/${this.siteName}/_api/web/lists/getbytitle('${this.documentLibraryName}')/GetChanges`

    type GetChangesPayload = {
      query: {
        Item: boolean
        Add: boolean
        Update: boolean
        DeleteObject: boolean
        Move: boolean
        Restore: boolean
        ChangeTokenStart?: {
          StringValue: string
        }
      }
    }

    const payload: GetChangesPayload = {
      query: {
        Item: true,
        Add: true,
        Update: true,
        DeleteObject: true,
        Move: true,
        Restore: true,
      },
    }

    if (changeToken !== null) {
      payload.query.ChangeTokenStart = {
        StringValue: changeToken,
      }
    }

    const res = await axios
      .post<ChangeResponse>(url, payload, {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          Accept: 'application/json;odata=verbose',
        },
      })
      .catch(handleAxiosError)

    if (!res) {
      throw new sdk.RuntimeError(`Error getting changes`)
    }

    return res.data.d.results
  }

  /**
   * Register a webhook on the doc library
   */
  async registerWebhook(webhookurl: string): Promise<string> {
    const listId = await this.getDocumentLibraryListId()
    const url = `https://${this.primaryDomain}.sharepoint.com/sites/${this.siteName}/_api/web/lists('${listId}')/subscriptions`
    const token = await this.fetchToken()
    const res = await axios
      .post(
        url,
        {
          clientState: 'A0A354EC-97D4-4D83-9DDB-144077ADB449',
          resource: `https://${this.primaryDomain}.sharepoint.com/sites/${this.siteName}/_api/web/lists('${listId}')`,
          notificationUrl: webhookurl,
          expirationDateTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
            Accept: 'application/json;odata=verbose',
          },
        }
      )
      .catch(handleAxiosError)

    if (!res) {
      throw new sdk.RuntimeError(`Error registering webhook`)
    }

    return res.data.d.id
  }

  /**
   * Unregister a webhook
   */
  async unregisterWebhook(webhookId: string): Promise<void> {
    const listId = await this.getDocumentLibraryListId()
    const url = `https://${this.primaryDomain}.sharepoint.com/sites/${this.siteName}/_api/web/lists('${listId}')/subscriptions('${webhookId}')`
    const token = await this.fetchToken()
    await axios
      .delete(url, {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          Accept: 'application/json;odata=verbose',
        },
      })
      .catch(handleAxiosError)
  }

  /**
   * List first 100 items (files + folders) in the doc library
   */
  async listItems(): Promise<{ items: SharePointItem[]; nextUrl: string | undefined }> {
    const token = await this.fetchToken()
    const url = `https://${this.primaryDomain}.sharepoint.com/sites/${this.siteName}/_api/web/lists/getbytitle('${this.documentLibraryName}')/items`
    const res = await axios.get<SharePointItemsResponse>(url, {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        Accept: 'application/json;odata=verbose',
      },
    })
    return { items: res.data.d.results, nextUrl: res.data.d.__next }
  }

  /**
   * List ALL remaining items starting from a pagination URL
   * Used for background processing after first page
   * @param startUrl - The __next URL from a previous listItems() call
   * @param logger - Logger instance
   */
  async listAll(startUrl: string, logger: bp.Logger): Promise<SharePointItem[]> {
    const token = await this.fetchToken()
    let url: string | undefined = startUrl
    const allItems: SharePointItem[] = []
    let pageCount = 0

    while (url) {
      try {
        const res: { data: SharePointItemsResponse } = await axios.get<SharePointItemsResponse>(url, {
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
            Accept: 'application/json;odata=verbose',
          },
        })

        const items = res.data.d.results
        allItems.push(...items)
        pageCount++

        logger
          .forBot()
          .info(`[SP Client] Background page ${pageCount}, items: ${items.length}, total: ${allItems.length}`)

        url = res.data.d.__next
      } catch (error) {
        logger.forBot().error(`[SP Client] Failed at background page ${pageCount + 1}: ${error}`)
        throw new sdk.RuntimeError(`Error listing items at page ${pageCount + 1}`)
      }
    }

    logger
      .forBot()
      .info(`[SP Client] Background sync complete. Total items: ${allItems.length} across ${pageCount} pages`)
    return allItems
  }
}
