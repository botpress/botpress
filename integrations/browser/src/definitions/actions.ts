import { ActionDefinition, z } from '@botpress/sdk'

const multiLineString = z.string().displayAs({ id: 'text', params: { multiLine: true, growVertically: true } })

const captureScreenshot: ActionDefinition = {
  title: 'Capture Screenshot',
  description: 'Capture a screenshot of the specified page.',
  input: {
    schema: z.object({
      url: z.string().describe('The url to screenshot').title('Url'),
      javascriptToInject: multiLineString
        .optional()
        .describe('JavaScript code to inject into the page before taking the screenshot')
        .title('Javascript to Inject'),
      cssToInject: multiLineString
        .optional()
        .describe('CSS code to inject into the page before taking the screenshot')
        .title('CSS To Inject'),
      width: z.number().default(1080).describe('The width of the screenshot').title('Width'),
      height: z.number().default(1920).describe('The height of the screenshot').title('Height'),
      fullPage: z.boolean().default(true).describe('Whether the screenshot is fullscreen or not').title('Full Page'),
    }),
  },
  output: {
    schema: z.object({
      imageUrl: z.string().describe('URL to the captured screenshot').title('Image Url'),
      htmlUrl: z.string().optional().describe('URL to the HTML page of the screenshot').title('Html Url'),
    }),
  },
  cacheable: true,
  billable: true,
}

const fullPage = z.object({
  url: z.string(),
  content: z.string(),
  raw: z.string(),
  favicon: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
})

export type FullPage = z.infer<typeof fullPage>

const getWebsiteLogo: ActionDefinition = {
  title: 'Get Website Logo',
  description: 'Get the logo of the specified website.',
  input: {
    schema: z.object({
      domain: z.string().describe('The domain of the website to get the logo from (eg. "example.com")').title('Domain'),
      greyscale: z
        .boolean()
        .default(false)
        .describe('Whether to return the logo in grayscale (black & white)')
        .title('Grayscale'),
      size: z
        .enum(['64', '128', '256', '512'])
        .default('128')
        .describe('Size of the logo to return (64, 128 or 256, 512 pixels)')
        .title('Size'),
    }),
  },
  output: {
    schema: z.object({
      logoUrl: z.string().describe('URL to the website logo').title('Logo Url'),
    }),
  },
  cacheable: false,
  billable: true,
}

const browsePages: ActionDefinition = {
  title: 'Browse Pages',
  description: 'Extract the full content & the metadata of the specified pages as markdown.',
  input: {
    schema: z.object({
      urls: z.array(z.string()).describe('The list of url to browse').title('Urls'),
      waitFor: z
        .number()
        .optional()
        .default(350)
        .describe(
          'Time to wait before extracting the content (in milliseconds). Set this value higher for dynamic pages.'
        )
        .title('Wait For'),
      timeout: z
        .number()
        .optional()
        .default(30000)
        .describe('Timeout for the request (in milliseconds)')
        .title('Time Out'),
      maxAge: z
        .number()
        .optional()
        .default(60 * 60 * 24 * 7)
        .describe('Maximum age of the cached page content (in seconds)')
        .title('Max Age'),
    }),
  },
  output: {
    schema: z.object({
      results: z.array(fullPage).describe('The list of pages browsed'),
    }),
  },
  cacheable: true,
  billable: true,
}

const domainNameRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i
const domainNameValidator = z
  .string()
  .regex(domainNameRegex, 'Invalid domain name')
  .min(3, 'Invalid URL')
  .max(50, 'Domain name is too long')

const webSearch: ActionDefinition = {
  title: 'Web Search',
  description: 'Search information on the web. You need to browse to that page to get the full content of the page.',
  input: {
    schema: z.object({
      query: z.string().min(1).max(1000).describe('What are we searching for?').title('Query'),
      includeSites: z
        .array(domainNameValidator)
        .max(20)
        .optional()
        .describe('Include only these domains in the search (max 20)')
        .title('Include Site'),
      excludeSites: z
        .array(domainNameValidator)
        .max(20)
        .optional()
        .describe('Exclude these domains from the search (max 20)')
        .title('Exclude Site'),
      count: z
        .number()
        .min(1)
        .max(20)
        .optional()
        .default(10)
        .describe('Number of search results to return (default: 10)')
        .title('Count'),
      freshness: z
        .enum(['Day', 'Week', 'Month'])
        .optional()
        .describe('Only consider results from the last day, week or month')
        .title('Freshness'),
      browsePages: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to browse to the pages to get the full content')
        .title('Browse Pages'),
    }),
  },
  output: {
    schema: z.object({
      results: z
        .array(
          z.object({
            name: z.string().describe('Title of the page'),
            url: z.string().describe('URL of the page'),
            snippet: z.string().describe('A short summary of the page'),
            links: z
              .array(z.object({ name: z.string(), url: z.string() }))
              .optional()
              .describe('Useful links on the page'),
            page: fullPage.optional().describe('The page itself'),
          })
        )
        .describe('Results of the search'),
    }),
  },
  billable: true,
  cacheable: true,
}

export const globPattern = z
  .string()
  .min(1, 'Glob must be at least 1 char')
  .max(255, 'Glob must be at max 255 chars')
  .describe('Glob pattern to match URLs. Use * for wildcard matching')

const discoverUrls: ActionDefinition = {
  title: 'Discover Website URLs',
  description: 'Discovers the URLs of a website by finding links using sitemaps, robots.txt, and crawling.',
  input: {
    schema: z.object({
      url: z
        .string()
        .describe(
          'The URL of the website to discover URLs from. Can be a domain like example.com or a full URL like sub.example.com/page'
        )
        .title('Url'),
      onlyHttps: z.boolean().default(true).describe('Whether to only include HTTPS pages').title('Only HTTPS'),
      count: z.number().min(1).max(10_000).default(5_000).describe('The number of urls').title('Count'),
      include: z
        .array(globPattern)
        .max(100, 'You can include up to 100 URL patterns')
        .describe('List of glob patterns to include URLs from the discovery')
        .title('Include')
        .optional(),
      exclude: z
        .array(globPattern)
        .max(100, 'You can exclude up to 100 URL patterns')
        .optional()
        .describe(
          'List of glob patterns to exclude URLs from the discovery. All URLs matching these patterns will be excluded from the results, even if they are included in the "include" patterns.'
        )
        .title('Exclude'),
    }),
  },
  output: {
    schema: z.object({
      urls: z.array(z.string()).describe('List of discovered URLs').title('Urls'),
      excluded: z.number().describe('Number of URLs excluded due to robots.txt or filter').title('Excluded'),
      stopReason: z
        .enum(['urls_limit_reached', 'end_of_results', 'time_limit_reached'])
        .describe('Reason for stopping the URLs discovery. ')
        .title('Stop Reason'),
    }),
  },
  billable: true,
  cacheable: false,
}

export const actionDefinitions = {
  captureScreenshot,
  browsePages,
  webSearch,
  discoverUrls,
  getWebsiteLogo,
} satisfies Record<string, ActionDefinition>
