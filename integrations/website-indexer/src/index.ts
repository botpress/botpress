import { z, RuntimeError } from '@botpress/sdk'
import axios from 'axios'
import _ from 'lodash'
import parseRobots from 'robots-parser'
import Url from 'url'
// import xml2json from 'xml2json'
import xml2js from 'xml2js'
import { Scraper } from './scraper'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {
    /**
     * This is called when a bot installs the integration.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
    throw new RuntimeError('Invalid configuration') // replace this with your own validation logic
  },
  unregister: async () => {
    /**
     * This is called when a bot removes the integration.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
    throw new RuntimeError('Invalid configuration') // replace this with your own validation logic
  },
  actions: {
    indexUrls: async ({ input, logger, client }) => {
      const pageUrlsSchema = z.object({
        urls: z.array(z.string()),
      })
      const { urls: pageUrls } = pageUrlsSchema.parse(JSON.parse(input.pageUrls))

      logger.forBot().debug(`Indexing ${pageUrls.length} urls`)

      const scraper = new Scraper(logger, bp.secrets.SCRAPER_API_KEY)
      let scraperCreditCost = 0
      const files = await Promise.all(
        pageUrls.map(async (url) => {
          const scrapingResponse = await scraper.fetchPageHtml(url)
          scraperCreditCost += scrapingResponse.cost
          const response = await client.upsertFile({
            key: url,
            size: scrapingResponse.content.byteLength,
            index: true,
            contentType: 'text/html',
          })
          await axios.put(response.file.uploadUrl, scrapingResponse.content)
          return response.file.id
        })
      )

      return { fileIds: JSON.stringify(files), scraperCreditCost }
    },
    fetchUrls: async ({ input: { rootUrl, maxUrls } }) => {
      const urls = await fetchUrls(rootUrl)
      return { urls: urls.slice(0, maxUrls) }
    },
  },
  channels: {},
  handler: async () => {},
})

const fetchUrls = async (url: string): Promise<string[]> => {
  const finalUrls = new Set<string>()
  finalUrls.add(url)

  const robotsProvided = isRobotsTxt(url)
  const sitemapProvided = isSitemapXml(url)
  const host = Url.parse(url)?.host ?? ''

  // If the user provided a robots.txt or a sitemap.xml, we don't need to discover them
  const sitemaps = robotsProvided
    ? await fetchRobotsSitemapUrls(url)
    : sitemapProvided
    ? [url]
    : // if the user provided a url, we need to discover the sitemaps
      _.uniq([
        ...(await fetchRobotsSitemapUrls(`https://${host}/robots.txt`)),
        ...(await fetchRobotsSitemapUrls(`${url}/robots.txt`)),
        ...getWellKnownSitemaps(url),
        ...getWellKnownSitemaps(`https://${host}`),
      ])

  await Promise.all(
    sitemaps.map(async (sitemap) => {
      const entries = await fetchSitemap({ url: sitemap, depth: 3, maxUrls: 5000, sameDomain: false }).catch((err) => {
        console.error(`Error while reading sitemap ${sitemap}: ${err?.message}`)
        return []
      })

      entries.forEach((item) => finalUrls.add(item.url))
    })
  )

  return [...finalUrls].filter((x) => !isRobotsTxt(x) && !isSitemapXml(x))
}

const fetchRobotsSitemapUrls = async (url: string): Promise<string[]> => {
  try {
    const content = await fetchPageContent(url)
    const sitemaps = parseRobots(url, content ?? '').getSitemaps()
    return sitemaps
  } catch {
    return []
  }
}

const fetchPageContent = async (url: string) => {
  const response = await axios.get(url)
  return response.data
}

const isRobotsTxt = (url: string) => url.endsWith('robots.txt')
const isSitemapXml = (url: string) => url.endsWith('.xml') && url.includes('sitemap')

const removeTrailingSlash = (url: string) => url.replace(/\/$/, '')
const getWellKnownSitemaps = (url: string) => {
  url = removeTrailingSlash(url)
  return [`${url}/sitemap.xml`, `${url}/sitemap_index.xml`, `${url}/sitemap/sitemap.xml`]
}

type UrlSetItem = {
  loc: string
  lastmod: string // YYYY-MM-DD
  changefreq: string | 'monthly'
}

type UrlEntry = { url: string; lastModified: string }

const loadSitemapSchema = z.object({
  url: z.string().url().endsWith('.xml', 'The url is not a valid sitemap.'),
  depth: z.number().int().positive().max(5).default(3),
  maxUrls: z.number().int().positive().min(1).max(5000).default(5000),
  sameDomain: z.boolean().default(false),
})

const fetchSitemap = async (options: z.infer<typeof loadSitemapSchema>): Promise<UrlEntry[]> => {
  options = loadSitemapSchema.parse(options)

  const urls: UrlEntry[] = []

  const url = urlSchema.parse(options.url)
  const data = await fetchPageContent(url)

  type Sitemap = { sitemap: { loc: string } } | { sitemap: { loc: string }[] }

  const parser = new xml2js.Parser({ trim: true, explicitArray: false })
  const parsedXml = await parser.parseStringPromise(data)
  const { urlset, sitemapindex } = parsedXml as {
    urlset?: {
      url: UrlSetItem | UrlSetItem[]
    }
    sitemapindex?: Sitemap
  }

  const appendUrl = (url: string, lastModified: string) => {
    if (urls.length >= options.maxUrls) {
      return
    }
    if (urlSchema.safeParse(url).success === false || (options.sameDomain && !areSameDomain(url, options.url))) {
      return
    }
    urls.push({ url, lastModified })
  }

  if (options.depth > 1) {
    // if the sitemap contains other sitemaps, we need to fetch them
    const locs = _.isArray(sitemapindex?.sitemap)
      ? sitemapindex?.sitemap.map((x) => x.loc) ?? []
      : [sitemapindex?.sitemap?.loc]
    for (const loc of locs.filter(Boolean) as string[]) {
      try {
        const subUrls = await fetchSitemap({ ...options, url: loc, depth: options.depth - 1 })
        subUrls.forEach((item) => appendUrl(item.url, item.lastModified))
      } catch {}
    }
  }

  if (urlset?.url) {
    const urlsArray = Array.isArray(urlset.url) ? urlset.url : [urlset.url]
    urlsArray.forEach((x) => appendUrl(x.loc, x.lastmod))
  }

  return [...urls]
}

const areSameDomain = (a: string, b: string) => {
  try {
    const aHost = Url.parse(a).host
    const bHost = Url.parse(b).host
    return aHost === bHost
  } catch {
    return false
  }
}

export const urlSchema = z.string().transform((url, ctx) => {
  url = url.trim()
  if (!url.includes('://')) {
    url = `https://${url}`
  }
  try {
    const x = new URL(url)
    if (x.protocol !== 'http:' && x.protocol !== 'https:') {
      ctx.addIssue({
        code: 'custom',
        message: 'Invalid protocol, only URLs starting with HTTP and HTTPS are supported',
      })
      return z.NEVER
    }

    if (!/.\.[a-zA-Z]{2,}$/.test(x.hostname)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Invalid TLD',
      })
      return z.NEVER
    }
    const pathName = x.pathname.endsWith('/') ? x.pathname.slice(0, -1) : x.pathname
    return `${x.origin}${pathName}`.toLowerCase()
  } catch (e) {
    ctx.addIssue({
      code: 'custom',
      message: 'Invalid URL: ' + getErrorMessage(e),
    })
    return z.NEVER
  }
})

const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data
    const statusCode = err.response?.status

    if (!data) {
      return `${err.message} (Status Code: ${statusCode})`
    }

    if (_.isArray(data.errors)) {
      return `${printZodErrors(data.errors)} (Status Code: ${statusCode})`
    }

    return `${data.message || data.error?.message || data.error || data || err.message} (Status Code: ${statusCode})`
  } else if (err instanceof z.ZodError) {
    return printZodErrors(err.errors)
  } else if (err instanceof Error) {
    return err.message || 'Unexpected error'
  } else if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message
  } else if (err && typeof err === 'object' && 'title' in err && typeof err.title === 'string') {
    // DM Issue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maybeIssue = err as any
    return `${err.title}: ${maybeIssue.message ?? maybeIssue.description ?? 'Unexpected error'}`
  } else if (typeof err === 'string') {
    return err
  }

  return 'Unexpected error'
}

const printZodErrors = (errors: z.ZodIssue[]) =>
  `Validation Error: ${errors.map((x) => `"${joinPath(x.path)}": ${x.message}`).join('\n')}`

const joinPath = (path: (string | number)[]): string => {
  if (path.length === 1) {
    return path[0]!.toString()
  }

  return path.reduce<string>((acc, item) => {
    if (typeof item === 'number') {
      return `${acc}[${item}]`
    }

    return `${acc}${acc.length === 0 ? '' : '.'}${item}`
  }, '')
}
