import { RuntimeError } from '@botpress/client'
import { IntegrationLogger, z, ZodIssueCode } from '@botpress/sdk'
import axios from 'axios'
import * as bp from '.botpress'

const LAMBDA_TIMEOUT = 55_000

const COST_PER_FIRECRAWL_MAP = 0.001

type FirecrawlMapInput = {
  /** The base URL to start crawling from */
  url: string
  /** Search query to use for mapping. During the Alpha phase, the 'smart' part of the search functionality is limited to 1000 search results. However, if map finds more results, there is no limit applied. */
  search?: string
  /** Ignore the website sitemap when crawling */
  ignoreSitemap?: boolean
  /** Only return links found in the website sitemap */
  sitemapOnly?: boolean
  /** In milliseconds */
  timeout?: number
  /** Max 30_000 */
  limit?: number
  /** Defaults to true */
  includeSubdomains?: boolean
}

type FireCrawlResponse = {
  success: boolean
  links: string[]
}

type StopReason = Awaited<ReturnType<bp.IntegrationProps['actions']['discoverUrls']>>['stopReason']

export const urlSchema = z.string().transform((url, ctx) => {
  url = url.trim()
  if (!url.includes('://')) {
    url = `https://${url}`
  }
  try {
    const x = new URL(url)
    if (x.protocol !== 'http:' && x.protocol !== 'https:') {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: 'Invalid protocol, only URLs starting with HTTP and HTTPS are supported',
      })
      return z.NEVER
    }

    if (!/.\.[a-zA-Z]{2,}$/.test(x.hostname)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: 'Invalid TLD',
      })
      return z.NEVER
    }
    const pathName = x.pathname.endsWith('/') ? x.pathname.slice(0, -1) : x.pathname
    return `${x.origin}${pathName}${x.search ? x.search : ''}`
  } catch (caught) {
    const err = caught instanceof Error ? caught : new Error('Unknown error while parsing URL')
    ctx.addIssue({
      code: ZodIssueCode.custom,
      message: 'Invalid URL: ' + err.message,
    })
    return z.NEVER
  }
})

export const isValidGlob = (glob: string): boolean => {
  if (glob.split('*').length > 2) {
    // More than one * is not supported
    return false
  }

  return glob.trim().length > 0 && glob.trim().length <= 255
}

export const matchGlob = (url: string, glob: string): boolean => {
  url = url.toLowerCase().trim()
  glob = glob.toLowerCase().trim()

  // If glob is just *, it matches everything
  if (glob === '*') {
    return true
  }

  if (!glob.includes('*')) {
    // If glob doesn't contain any wildcard, we just check for presence
    return url.includes(glob)
  }

  // if starts with *, we check that url ends with glob
  if (glob.startsWith('*')) {
    const trimmedGlob = glob.slice(1) // Remove the leading *
    return url.endsWith(trimmedGlob)
  }

  // if ends with *, we check that url starts with glob
  if (glob.endsWith('*')) {
    const trimmedGlob = glob.slice(0, -1) // Remove the trailing *
    return url.startsWith(trimmedGlob)
  }

  // if * in the middle, we check that starts with the part before * and ends with the part after *
  if (glob.includes('*')) {
    const [start, end] = glob.split('*')
    return url.startsWith(start!) && url.endsWith(end!)
  }

  return false
}

class Accumulator {
  public processed = new Set<string>()
  public urls = new Set<string>()

  public included: number = 0
  public excluded: number = 0

  public cost: number = 0

  public startedAt: number = Date.now()

  public addUrls(urls: string[]): void {
    for (let url of urls) {
      if (this.stopReason) {
        return
      }

      const parsed = urlSchema.safeParse(url)

      if (!parsed.success) {
        continue
      }

      url = parsed.data

      if (this.onlyHttps && !url.toLowerCase().startsWith('https://')) {
        this.excluded++
        continue
      }

      if (this.processed.has(url)) {
        continue
      }

      this.processed.add(url)

      if (this.includedGlobs.length && this.includedGlobs.every((glob) => !matchGlob(url, glob))) {
        this.excluded++
        continue
      }

      this.included++

      if (this.exclduedGlobs.some((glob) => matchGlob(url, glob))) {
        this.excluded++
        continue
      }

      this.urls.add(url)
    }
  }

  public addCost(cost: number): void {
    this.cost += cost
  }

  public constructor(
    public readonly includedGlobs: string[],
    public readonly exclduedGlobs: string[],
    public readonly timeout: number = 55_000,
    public readonly limit: number = 10_000,
    public readonly onlyHttps: boolean = true
  ) {}

  public get remainingTime(): number {
    return Math.max(0, this.startedAt + this.timeout - Date.now())
  }

  public get stopReason(): StopReason | null {
    if (this.urls.size >= this.limit) {
      return 'urls_limit_reached'
    }

    if (this.remainingTime <= 1000) {
      // if we have less than 1s left, we consider it a time limit reached
      return 'time_limit_reached'
    }

    return null
  }
}

const firecrawlMap = async (props: { url: string; logger: IntegrationLogger; timeout: number }): Promise<string[]> => {
  const { data: result } = await axios.post<FireCrawlResponse>(
    'https://api.firecrawl.dev/v1/map',
    {
      url: props.url,
      ignoreSitemap: false,
      includeSubdomains: true,
      sitemapOnly: false,
      limit: 10_000,
      timeout: Math.max(1000, props.timeout - 2000),
    } satisfies FirecrawlMapInput,
    {
      signal: AbortSignal.timeout(Math.max(1000, props.timeout - 1000)),
      headers: {
        Authorization: `Bearer ${bp.secrets.FIRECRAWL_API_KEY}`,
      },
    }
  )

  return result.links
}

export const discoverUrls: bp.IntegrationProps['actions']['discoverUrls'] = async ({ input, logger, metadata }) => {
  logger.forBot().debug('Discovering website URLs', { input })

  for (const pattern of [...(input.include ?? []), ...(input.exclude ?? [])]) {
    if (!isValidGlob(pattern)) {
      throw new RuntimeError(`Forbidden characters in glob pattern: ${pattern}. Cannot contain "..", "{}", "[]"`)
    }
  }

  const accumulator = new Accumulator(
    input.include ?? [],
    input.exclude ?? [],
    LAMBDA_TIMEOUT,
    input.count ?? 10_000,
    input.onlyHttps
  )

  const firecrawl = firecrawlMap({ url: input.url, logger, timeout: accumulator.remainingTime }).then((links) => {
    accumulator.addUrls(links)
    accumulator.addCost(COST_PER_FIRECRAWL_MAP)
  })

  await Promise.allSettled([firecrawl])

  metadata.setCost(accumulator.cost)

  return {
    excluded: accumulator.excluded,
    stopReason: accumulator.stopReason ?? 'end_of_results',
    urls: [...accumulator.urls],
  }
}
