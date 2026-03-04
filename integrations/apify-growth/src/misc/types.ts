import type * as botpress from '.botpress'
import { startCrawlerRunInputSchema } from '../../integration.definition'
import { z } from '@botpress/sdk'

type Implementation = ConstructorParameters<typeof botpress.Integration>[0]

export type RegisterFunction = Implementation['register']
export type UnregisterFunction = Implementation['unregister']
export type Handler = Implementation['handler']

export type ApifyCrawlerParams = z.infer<typeof startCrawlerRunInputSchema>
export type CrawlerRunInput = Omit<ApifyCrawlerParams, 'rawInputJsonOverride' | 'startUrls'> & {
  startUrls: { url: string }[]
}

export interface DatasetItem {
  markdown?: string
  html?: string
  text?: string
  url?: string
  metadata?: { url?: string }
}

export interface ApifyDataset {
  listItems: (options: { limit: number; offset: number }) => Promise<{ items: DatasetItem[]; total: number }>
}
