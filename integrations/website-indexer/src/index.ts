import { z } from '@botpress/sdk'
import axios from 'axios'
import { backOff } from 'exponential-backoff'
import _ from 'lodash'
import parseRobots from 'robots-parser'
import Url from 'url'
import xml2js from 'xml2js'
import { Scraper, urlSchema } from './scraper'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    indexUrls: async ({ input, logger, client }) => {
      const { pageUrls } = input

      logger.forBot().debug(`Indexing ${pageUrls.length} urls`)

      const scraper = new Scraper(logger, bp.secrets.SCRAPER_API_KEY)
      const results = await Promise.allSettled(
        pageUrls.map(async (url) => {
          const scrapingResponse = await backOff(
            async () => {
              return await scraper.fetchPageHtml(url)
            },
            {
              retry: (e) => {
                logger.forBot().debug('retrying scraping ...')
                return e?.response?.status === 429
              },
              numOfAttempts: 10,
              maxDelay: 1000,
              delayFirstAttempt: false,
              jitter: 'full',
            }
          )

          logger.forBot().debug(`Scraped ${url} with ${scrapingResponse.cost} credits`)

          const response = await client.upsertFile({
            key: url,
            size: scrapingResponse.content.byteLength,
            index: true,
            contentType: 'text/html',
          })

          logger.forBot().debug(`uploading file: ${url}`)
          await axios.put(response.file.uploadUrl, scrapingResponse.content)
          return { fileId: response.file.id, url, scraperCreditCost: scrapingResponse.cost }
        })
      )

      const outputResults: (
        | {
            status: 'success'
            url: string
            fileId: string
            scraperCreditCost: number
          }
        | {
            status: 'failed'
            url: string
            failureReason: string
          }
      )[] = []

      for (const r of results) {
        if (r.status === 'rejected') {
          outputResults.push({ status: 'failed', url: r.reason.url, failureReason: r.reason.message })
        } else {
          outputResults.push({
            status: 'success',
            url: r.value.url,
            fileId: r.value.fileId,
            scraperCreditCost: r.value.scraperCreditCost,
          })
        }
      }

      return { results: outputResults }
    },
    fetchUrls: async ({ input: { rootUrl } }) => {
      const urls = await fetchUrls(rootUrl)
      return { urls }
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
