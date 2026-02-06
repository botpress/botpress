import * as sdk from '@botpress/sdk'
import { getFormatedCurrTime, guessMimeType } from './misc/utils'

export class BotpressKB {
  private bpClient: sdk.IntegrationSpecificClient<any>
  private logger: sdk.IntegrationLogger
  private kbId: string
  private enableVision: boolean

  constructor(
    bpClient: sdk.IntegrationSpecificClient<any>,
    kbId: string,
    logger: sdk.IntegrationLogger,
    enableVision: boolean = false
  ) {
    this.bpClient = bpClient
    this.kbId = kbId
    this.logger = logger
    this.enableVision = enableVision
  }

  public setKbId(kbId: string) {
    this.kbId = kbId
  }

  private log(msg: string) {
    this.logger.forBot().info(`[${getFormatedCurrTime()} - BP KB] ${msg}`)
  }

  private async findFileBySpId(spId: string) {
    const res = await this.bpClient.listFiles({ tags: { spId, kbId: this.kbId } })
    return res.files[0]
  }

  /** Build a workspace‑wide unique key */
  private buildKey(filename: string): string {
    return `${this.kbId}/${filename}` // e.g.  kb‑xxx/doclib1/…/file.docx
  }

  async addFile(spId: string, filename: string, content: ArrayBuffer): Promise<void> {
    this.log(`Add → ${filename}`)

    const uploadParams: any = {
      key: this.buildKey(filename),
      content,
      index: true,
      contentType: guessMimeType(filename),
      tags: {
        source: 'knowledge-base',
        kbId: this.kbId,
        spId: spId,
        title: filename.split('/').pop() || filename,
        dsType: 'document',
      },
    }
    // Only add modalities tag when vision is enabled
    if (this.enableVision) {
      uploadParams.tags.modalities = '[\"text\",\"image\"]'
    }

    if (this.enableVision) {
      uploadParams.indexing = {
        configuration: {
          vision: {
            transcribePages: true as any,
            indexPages: true as any,
          },
        },
      }
    }

    await this.bpClient.uploadFile(uploadParams)
  }

  async updateFile(spId: string, filename: string, content: ArrayBuffer): Promise<void> {
    this.log(`Update → ${filename}`)

    const existing = await this.findFileBySpId(spId)
    if (existing) {
      await this.bpClient.deleteFile({ id: existing.id })
    }
    await this.addFile(spId, filename, content)
  }

  async deleteFile(spId: string): Promise<void> {
    const existing = await this.findFileBySpId(spId)

    if (!existing) {
      this.log(`Delete skipped - no file with spId=${spId} in KB ${this.kbId}`)
      return
    }

    this.log(`Delete → ${existing.key}  (spId=${spId})`)
    await this.bpClient.deleteFile({ id: existing.id })
  }

  async deleteAllFiles(): Promise<void> {
    this.log(`Delete ALL files in KB ${this.kbId}`)
    const res = await this.bpClient.listFiles({ tags: { kbId: this.kbId } })
    this.log(res.files.map((f) => `spId=${f.tags.spId}  key=${f.key}`).join('\n'))
    await Promise.all(res.files.map((f) => this.bpClient.deleteFile({ id: f.id })))
  }
}
