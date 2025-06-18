import { ActionDefinition, z } from '@botpress/sdk'

const captureScreenshot: ActionDefinition = {
  title: 'Capture Screenshot',
  description: 'Capture a screenshot of the specified page.',
  input: {
    schema: z.object({
      url: z.string(),
    }),
  },
  output: {
    schema: z.object({
      imageUrl: z.string(),
    }),
  },
  cacheable: true,
  billable: true,
}

const fullPage = z.object({
  url: z.string(),
  content: z.string(),
  favicon: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
})

export type FullPage = z.infer<typeof fullPage>

const browsePages: ActionDefinition = {
  title: 'Browse Pages',
  description: 'Extract the full content & the metadata of the specified pages as markdown.',
  input: {
    schema: z.object({
      urls: z.array(z.string()),
      waitFor: z
        .number()
        .optional()
        .default(350)
        .describe(
          'Time to wait before extracting the content (in milliseconds). Set this value higher for dynamic pages.'
        ),
    }),
  },
  output: {
    schema: z.object({
      results: z.array(fullPage),
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
      query: z.string().min(1).max(1000).describe('What are we searching for?'),
      includeSites: z
        .array(domainNameValidator)
        .max(20)
        .optional()
        .describe('Include only these domains in the search (max 20)'),
      excludeSites: z
        .array(domainNameValidator)
        .max(20)
        .optional()
        .describe('Exclude these domains from the search (max 20)'),
      count: z
        .number()
        .min(1)
        .max(20)
        .optional()
        .default(10)
        .describe('Number of search results to return (default: 10)'),
      freshness: z
        .enum(['Day', 'Week', 'Month'])
        .optional()
        .describe('Only consider results from the last day, week or month'),
      browsePages: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to browse to the pages to get the full content'),
    }),
  },
  output: {
    schema: z.object({
      results: z.array(
        z.object({
          name: z.string().describe('Title of the page'),
          url: z.string().describe('URL of the page'),
          snippet: z.string().describe('A short summary of the page'),
          links: z
            .array(z.object({ name: z.string(), url: z.string() }))
            .optional()
            .describe('Useful links on the page'),
          page: fullPage.optional(),
        })
      ),
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
        ),
      onlyHttps: z.boolean().default(true).describe('Whether to only include HTTPS pages'),
      count: z.number().min(1).max(10_000).default(5_000),
      include: z
        .array(globPattern)
        .max(100, 'You can include up to 100 URL patterns')
        .describe('List of glob patterns to include URLs from the discovery')
        .optional(),
      exclude: z
        .array(globPattern)
        .max(100, 'You can exclude up to 100 URL patterns')
        .optional()
        .describe(
          'List of glob patterns to exclude URLs from the discovery. All URLs matching these patterns will be excluded from the results, even if they are included in the "include" patterns.'
        ),
    }),
  },
  output: {
    schema: z.object({
      urls: z.array(z.string()).describe('List of discovered URLs'),
      excluded: z.number().describe('Number of URLs excluded due to robots.txt or filter'),
      stopReason: z
        .enum(['urls_limit_reached', 'end_of_results', 'time_limit_reached'])
        .describe('Reason for stopping the URLs discovery. '),
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
} satisfies Record<string, ActionDefinition>
