import { BotpressKB } from '../../BotpressKB'
import { SharepointClient } from '../../SharepointClient'
import path from 'path'
import { getFormatedCurrTime } from '../../misc/utils'
import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { RuntimeError } from '@botpress/client'
import axios from 'axios'

const SUPPORTED_FILE_EXTENSIONS = ['.txt', '.html', '.pdf', '.doc', '.docx', '.md']

// Regex to extract relative path from SharePoint URL: "/sites/siteName/restOfPath" → "restOfPath"
const SHAREPOINT_PATH_REGEX = /^\/sites\/[^/]+\/(.+)$/

export class SharepointSync {
  private sharepointClient: SharepointClient
  private bpClient: sdk.IntegrationSpecificClient<any>
  private logger: sdk.IntegrationLogger
  private enableVision: boolean
  private kbInstances = new Map<string, BotpressKB>()

  constructor(
    sharepointClient: SharepointClient,
    bpClient: sdk.IntegrationSpecificClient<any>,
    logger: sdk.IntegrationLogger,
    enableVision: boolean = false
  ) {
    this.sharepointClient = sharepointClient
    this.bpClient = bpClient
    this.logger = logger
    this.enableVision = enableVision
  }

  private log(msg: string) {
    this.logger.forBot().info(`[${getFormatedCurrTime()} - SP Sync] ${msg}`)
  }

  private logWarning(msg: string) {
    this.logger.forBot().warn(`[${getFormatedCurrTime()} - SP Sync] ${msg}`)
  }

  private isFileSupported(spPath: string): boolean {
    const fileType = path.extname(spPath)
    if (!SUPPORTED_FILE_EXTENSIONS.includes(fileType)) {
      this.logWarning(`File "${spPath}" with type "${fileType}" is not supported. Skipping file.`)
      return false
    }
    return true
  }

  private getOrCreateKB(kbId: string): BotpressKB {
    if (!this.kbInstances.has(kbId)) {
      const kb = new BotpressKB(this.bpClient, kbId, this.logger, this.enableVision)
      this.kbInstances.set(kbId, kb)
      this.log(`Created BotpressKB instance for KB ${kbId}${this.enableVision ? ' with vision enabled' : ''}`)
    }
    return this.kbInstances.get(kbId)!
  }

  /**
   * Initial full sync: Fetches first page, clears KBs, processes documents, and triggers background processing
   * Used during registration/setup to perform the initial complete sync
   */
  async syncInitialDocuments(webhookId: string): Promise<{ filesProcessed: number; hasMore: boolean }> {
    const { docs, nextUrl } = await this.fetchAllDocuments()

    const kbIdsToClear = await this.determineKbsToClear(docs)
    await this.clearKbs(kbIdsToClear)

    await this.processAllDocuments(docs)

    await this.triggerBackgroundProcessing(nextUrl, webhookId)

    return {
      filesProcessed: docs.length,
      hasMore: nextUrl != null,
    }
  }

  /**
   * Incremental sync: Fetches and processes documents without clearing KBs
   * Used for syncing new documents without disrupting existing KB content
   */
  async syncDocumentsWithoutCleaning(webhookId: string): Promise<{ filesProcessed: number; hasMore: boolean }> {
    const { docs, nextUrl } = await this.fetchAllDocuments()

    await this.processAllDocuments(docs)

    await this.triggerBackgroundProcessing(nextUrl, webhookId)

    return {
      filesProcessed: docs.length,
      hasMore: nextUrl != null,
    }
  }

  /**
   * Background pagination sync: Processes remaining pages from a specific URL
   * Used for webhook-triggered background processing of remaining documents
   */
  async syncRemainingDocuments(startUrl: string): Promise<{ filesProcessed: number; hasMore: boolean }> {
    const { docs } = await this.fetchAllDocuments(startUrl)

    await this.processAllDocuments(docs)

    // No background processing trigger - this IS the background processing
    // No hasMore - background processing fetches all remaining pages at once

    return {
      filesProcessed: docs.length,
      hasMore: false,
    }
  }

  private async triggerBackgroundProcessing(nextUrl: string | undefined, webhookId: string) {
    // If there are remaining pages, trigger asynchronous processing
    if (nextUrl) {
      this.logger.forBot().info('First Page processed. Sending webhook to trigger background processing...')
      const webhookUrl = `https://webhook.botpress.cloud/${webhookId}`

      const payload = {
        event: 'background-sync-triggered',
        data: {
          nextUrl,
          lib: this.sharepointClient.getDocumentLibraryName(),
        },
      }

      try {
        await axios.post(webhookUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
        this.logger.forBot().info('Background processing webhook triggered successfully')
      } catch (error) {
        this.logger.forBot().error('Failed to send background processing webhook:', error)
        throw new RuntimeError(
          '[Trigger Background Processing] Failed to send webhook to continue background processing',
          error instanceof Error ? error : undefined
        )
      }
    }
  }

  private async fetchAllDocuments(startUrl?: string): Promise<{ docs: any[]; nextUrl?: string }> {
    if (startUrl) {
      // Background processing: fetch all remaining pages starting from startUrl
      const items = await this.sharepointClient.listAll(startUrl, this.logger)
      return { docs: items.filter((i) => i.FileSystemObjectType === 0) }
    } else {
      // First page only: for quick user feedback
      const { items, nextUrl } = await this.sharepointClient.listItems()
      return { docs: items.filter((i) => i.FileSystemObjectType === 0), nextUrl }
    }
  }

  private async determineKbsToClear(docs: any[]): Promise<string[]> {
    const kbIds: string[] = []

    for (const doc of docs) {
      const spPathOrNull = await this.sharepointClient.getFilePath(doc.Id)
      if (!spPathOrNull) {
        continue
      }
      const spPath = spPathOrNull

      if (!this.isFileSupported(spPath)) {
        continue
      }

      const relPath = this.extractRelativePath(spPath)
      const targetKbs = this.sharepointClient.getKbForPath(relPath)
      kbIds.push(...targetKbs)
    }

    // Return unique KB IDs
    return [...new Set(kbIds)]
  }

  private async clearKbs(kbIdsToClear: string[]): Promise<void> {
    if (kbIdsToClear.length > 0) {
      await Promise.all(kbIdsToClear.map((kbId) => this.getOrCreateKB(kbId).deleteAllFiles()))
    }
  }

  private async processAllDocuments(docs: any[]): Promise<void> {
    const results = await Promise.allSettled(docs.map(async (doc) => this.processDocument(doc)))

    const successful = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length
    this.log(`File processing complete: ${successful} successful, ${failed} failed`)
  }

  private async processDocument(doc: any): Promise<void> {
    try {
      const spPathOrNull = await this.sharepointClient.getFilePath(doc.Id)
      if (!spPathOrNull) {
        this.log(`Skipping document ${doc.Id}: No file path found`)
        return
      }
      const spPath = spPathOrNull

      if (!this.isFileSupported(spPath)) {
        this.log(`Skipping document ${doc.Id}: Unsupported file type ${path.extname(spPath)}`)
        return
      }

      const relPath = this.extractRelativePath(spPath)
      const kbIds = this.sharepointClient.getKbForPath(relPath)
      if (kbIds.length === 0) {
        this.log(`Skipping document ${doc.Id}: No KB mapping found for path ${relPath}`)
        return
      }

      const content = await this.sharepointClient.downloadFile(spPath)
      await Promise.all(kbIds.map((kbId) => this.getOrCreateKB(kbId).addFile(doc.Id.toString(), relPath, content)))
      this.log(`Successfully processed document ${doc.Id}: ${relPath}`)
    } catch (error) {
      this.logWarning(`Failed to process document ${doc.Id}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private extractRelativePath(spPath: string): string {
    // Extract relative path from SharePoint URL: "/sites/siteName/restOfPath" → "restOfPath"
    // Example: "/sites/mySite/Documents/folder/file.txt" → "Documents/folder/file.txt"
    const sitePrefixMatch = spPath.match(SHAREPOINT_PATH_REGEX)
    const relPath = sitePrefixMatch?.[1] ? decodeURIComponent(sitePrefixMatch[1]) : spPath

    if (!sitePrefixMatch) {
      this.logWarning(`Unexpected SharePoint path format: ${spPath} - using as-is`)
    }

    return relPath
  }

  async syncSharepointDocumentLibraryAndBotpressKB(oldToken: string): Promise<string> {
    const changes = await this.sharepointClient.getChanges(oldToken)
    if (changes.length === 0) return oldToken

    const newToken = changes.at(-1)!.ChangeToken.StringValue

    for (const ch of changes) {
      this.logger
        .forBot()
        .debug(
          `[${getFormatedCurrTime()} - SP Sync] ChangeType=${ch.ChangeType} (${ch.ChangeType ?? 'Unknown'})  ItemId=${ch.ItemId}`
        )

      switch (ch.ChangeType) {
        /* 1 = Add */
        case 1: {
          try {
            const spPath = await this.sharepointClient.getFilePath(ch.ItemId)
            if (!spPath || !this.isFileSupported(spPath)) {
              this.log(`Skipping add for item ${ch.ItemId}: ${!spPath ? 'No file path' : 'Unsupported file type'}`)
              break
            }

            // Extract the relative path after the site name, handling URL-encoded characters
            // Extract relative path from SharePoint URL: "/sites/siteName/restOfPath" → "restOfPath"
            // Example: "/sites/mySite/Documents/folder/file.txt" → "Documents/folder/file.txt"
            const sitePrefixMatch = spPath.match(SHAREPOINT_PATH_REGEX)
            const relPath = sitePrefixMatch?.[1] ? decodeURIComponent(sitePrefixMatch[1]) : spPath
            const kbIds = this.sharepointClient.getKbForPath(relPath)
            if (kbIds.length === 0) {
              this.log(`Skipping add for item ${ch.ItemId}: No KB mapping found for path ${relPath}`)
              break
            }

            const content = await this.sharepointClient.downloadFile(spPath)
            for (const kbId of kbIds) {
              await this.getOrCreateKB(kbId).addFile(ch.ItemId.toString(), relPath, content)
            }
            this.log(`Successfully added item ${ch.ItemId}: ${relPath}`)
          } catch (error) {
            this.logWarning(
              `Failed to add item ${ch.ItemId}: ${error instanceof Error ? error.message : String(error)}`
            )
          }
          break
        }

        /* 2 = Update */
        case 2: {
          try {
            const spPath = await this.sharepointClient.getFilePath(ch.ItemId)
            if (!spPath || !this.isFileSupported(spPath)) {
              this.log(`Skipping update for item ${ch.ItemId}: ${!spPath ? 'No file path' : 'Unsupported file type'}`)
              break
            }

            // Extract the relative path after the site name, handling URL-encoded characters
            // Extract relative path from SharePoint URL: "/sites/siteName/restOfPath" → "restOfPath"
            // Example: "/sites/mySite/Documents/folder/file.txt" → "Documents/folder/file.txt"
            const sitePrefixMatch = spPath.match(SHAREPOINT_PATH_REGEX)
            const relPath = sitePrefixMatch?.[1] ? decodeURIComponent(sitePrefixMatch[1]) : spPath
            const kbIds = this.sharepointClient.getKbForPath(relPath)
            if (kbIds.length === 0) {
              this.log(`Skipping update for item ${ch.ItemId}: No KB mapping found for path ${relPath}`)
              break
            }

            const content = await this.sharepointClient.downloadFile(spPath)
            for (const kbId of kbIds) {
              await this.getOrCreateKB(kbId).updateFile(ch.ItemId.toString(), relPath, content)
            }
            this.log(`Successfully updated item ${ch.ItemId}: ${relPath}`)
          } catch (error) {
            this.logWarning(
              `Failed to update item ${ch.ItemId}: ${error instanceof Error ? error.message : String(error)}`
            )
          }
          break
        }

        /* 3 = Delete */
        case 3: {
          const fileId = ch.ItemId.toString()
          const res = await this.bpClient.listFiles({ tags: { spId: fileId } })

          if (res.files.length === 0) {
            this.logger.forBot().debug(`[SP Sync] spId=${fileId} not found in any KB`)
            break
          }

          // Delete every hit (usually one)
          await Promise.all(res.files.map((f) => this.bpClient.deleteFile({ id: f.id })))

          // Optional: log where it was
          res.files.forEach((f) => this.logger.forBot().info(`[BP KB] Delete → ${f.key}  (spId=${fileId})`))
          break
        }
      }
    }

    return newToken
  }
}
