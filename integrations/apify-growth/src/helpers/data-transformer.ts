import { ApifyCrawlerParams, CrawlerRunInput, DatasetItem } from '../misc/types'
import * as bp from '.botpress'

export class DataTransformer {
  constructor(private logger: bp.Logger) {}

  processItemContent(item: DatasetItem): { content: string; extension: string } | null {
    if (item.markdown) {
      return { content: item.markdown, extension: 'md' }
    }

    if (item.html) {
      return { content: item.html, extension: 'html' }
    }

    if (item.text) {
      return { content: item.text, extension: 'txt' }
    }

    return null
  }

  generateFilename(item: DatasetItem): string {
    const url = item.url || item.metadata?.url

    if (!url) {
      return `page-${Date.now()}`
    }

    try {
      const urlObj = new URL(url)

      // extract hostname
      const hostname = urlObj.hostname.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_')

      // extract pathname
      let pathname = urlObj.pathname
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+/, '')

      if (!pathname) {
        pathname = 'index'
      }

      // add hash of full URL (including query params) to ensure uniqueness
      const urlHash = this.generateHash(url)

      // combine hostname, pathname, and hash
      return `${hostname}_${pathname}_${urlHash}`
    } catch (urlError) {
      this.logger.forBot().warn(`Invalid URL, using timestamp: ${url}`, urlError)
      return `page-${Date.now()}`
    }
  }

  private generateHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36).substring(0, 8)
  }
}

export function buildCrawlerInput(params: ApifyCrawlerParams): CrawlerRunInput {
  if (params.rawInputJsonOverride) {
    const parsed = JSON.parse(params.rawInputJsonOverride)
    if (parsed.startUrls && Array.isArray(parsed.startUrls)) {
      return {
        ...parsed,
        startUrls: parsed.startUrls.map((url: string | { url: string }) => (typeof url === 'string' ? { url } : url)),
      }
    }
    return parsed
  }
  return {
    ...params,
    startUrls: params.startUrls.map((url: string | { url: string }) => (typeof url === 'string' ? { url } : url)),
  }
}
