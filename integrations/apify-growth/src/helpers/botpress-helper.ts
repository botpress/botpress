import * as bp from '.botpress'

export class BotpressHelper {
  constructor(private bpClient: bp.Client) {}

  async uploadFile(filename: string, content: string, extension: string, kbId: string): Promise<void> {
    // Ensure filename is not too long and has valid characters
    const safeFilename = filename.substring(0, 100).replace(/[^a-zA-Z0-9_-]/g, '_')
    const fullFilename = `${safeFilename}.${extension}`

    await this.bpClient.uploadFile({
      key: fullFilename,
      tags: {
        kbId: kbId,
        dsType: 'document',
        source: 'knowledge-base',
      },
      content: Buffer.from(content, 'utf8'),
      contentType: this.getContentType(extension),
      index: true,
    })
  }

  private getContentType(extension: string): string {
    switch (extension) {
      case 'md':
        return 'text/markdown'
      case 'html':
        return 'text/html'
      case 'txt':
        return 'text/plain'
      default:
        return 'text/plain'
    }
  }
}
