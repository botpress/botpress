import { IntegrationDefinition, z } from '@botpress/sdk'

export const startCrawlerRunInputSchema = z.object({
  startUrls: z.array(z.string().url()).title('Start URLs').describe('URLs to start crawling from'),
  excludeUrlGlobs: z
    .array(z.string())
    .optional()
    .title('Exclude URL Globs')
    .describe('URL patterns to exclude from crawling'),
  includeUrlGlobs: z
    .array(z.string())
    .optional()
    .title('Include URL Globs')
    .describe('URL patterns to include in crawling'),
  maxCrawlPages: z.number().min(1).max(10000).title('Max Crawl Pages').describe('Maximum number of pages to crawl'),
  saveMarkdown: z.boolean().title('Save Markdown').describe('Save content as Markdown format'),
  htmlTransformer: z
    .enum(['readableTextIfPossible', 'readableText', 'extractus', 'none'])
    .title('HTML Transformer')
    .describe('HTML processing method'),
  removeElementsCssSelector: z
    .string()
    .optional()
    .title('Remove Elements CSS Selector')
    .describe('CSS selectors for elements to remove'),
  crawlerType: z
    .enum(['playwright:adaptive', 'playwright:firefox', 'cheerio', 'jsdom', 'playwright:chrome'])
    .title('Crawler Type')
    .describe('Browser type for crawling'),
  expandClickableElements: z
    .boolean()
    .title('Expand Clickable Elements')
    .describe('Expand clickable elements for better content extraction'),
  headers: z.string().optional().title('Headers').describe('Custom HTTP headers for authentication/requests'),
  rawInputJsonOverride: z
    .string()
    .optional()
    .title('Raw Input JSON Override')
    .describe(
      'JSON string to override any crawler parameters, please refer to https://console.apify.com/actors/<actor-id>/input and select JSON format for the available parameters'
    ),
})

export default new IntegrationDefinition({
  name: 'plus/apify',
  version: '1.0.3',
  title: 'Advanced Website Crawler',
  readme: 'hub.md',
  icon: 'icon.svg',
  description:
    'Integrate your Botpress chatbot with Apify to crawl websites and extract content. Uses webhooks for reliable, asynchronous crawling and automatically syncs content to Botpress files.',
  configuration: {
    schema: z.object({
      apiToken: z.string().title('API Token').describe('Your Apify API Token (starts with apify_api_)'),
      webhookSecret: z
        .string()
        .optional()
        .title('Webhook Secret')
        .describe('A secret token to secure your webhook URL (recommended)'),
    }),
  },
  events: {
    crawlerCompleted: {
      title: 'Crawler Completed',
      description: 'Triggered when an Apify crawler run completes successfully',
      schema: z.object({
        actorId: z.string().title('Actor ID').describe('ID of the triggering Actor'),
        actorTaskId: z.string().optional().title('Actor Task ID').describe('If task was used, its ID'),
        actorRunId: z.string().title('Actor Run ID').describe('ID of the triggering Actor run'),
        eventType: z.string().title('Event Type').describe('Type of webhook event (e.g., ACTOR.RUN.SUCCEEDED)'),
        runId: z.string().title('Run ID').describe('Alias for actorRunId for easier access'),
        itemsCount: z.number().optional().title('Items Count').describe('Number of items crawled'),
        filesCreated: z.number().optional().title('Files Created').describe('Number of files created in Botpress'),
        syncTargetPath: z.string().optional().title('Sync Target Path').describe('Path where results were synced'),
        hasMore: z
          .boolean()
          .optional()
          .title('Has More')
          .describe('Whether there are more items to sync in subsequent batches'),
      }),
    },
    crawlerFailed: {
      title: 'Crawler Failed',
      description: 'Triggered when an Apify crawler run fails, times out, or is aborted',
      schema: z.object({
        actorId: z.string().title('Actor ID').describe('ID of the triggering Actor'),
        actorRunId: z.string().title('Actor Run ID').describe('ID of the triggering Actor run'),
        runId: z.string().title('Run ID').describe('Alias for actorRunId for easier access'),
        eventType: z
          .string()
          .title('Event Type')
          .describe('Type of webhook event (e.g., ACTOR.RUN.FAILED, ACTOR.RUN.TIMED_OUT, ACTOR.RUN.ABORTED)'),
        reason: z.string().title('Reason').describe('Reason for failure (FAILED, TIMED_OUT, or ABORTED)'),
      }),
    },
  },
  user: {
    tags: {
      id: {
        title: 'Apify API Token',
        description: 'The Apify API token associated with this user',
      },
    },
  },
  states: {
    apifyRunMappings: {
      type: 'integration',
      schema: z.record(z.string(), z.string()).describe('Mapping from Apify runId to kbId for routing results storage'),
    },
    syncContinuation: {
      type: 'integration',
      schema: z
        .object({
          runId: z.string().title('Run ID').describe('The Apify run ID being synced'),
          kbId: z.string().title('Knowledge Base ID').describe('The knowledge base ID where content is being stored'),
          nextOffset: z.number().title('Next Offset').describe('The offset for the next batch of results to sync'),
          timestamp: z.number().title('Timestamp').describe('Unix timestamp when the sync state was last updated'),
        })
        .describe('State for tracking sync continuation when large datasets need multiple passes'),
    },
    activeSyncLock: {
      type: 'integration',
      schema: z
        .object({
          runId: z.string().title('Run ID').describe('The Apify run ID that holds the lock'),
          timestamp: z.number().title('Timestamp').describe('Unix timestamp when the lock was acquired'),
          offset: z.number().title('Offset').describe('Current offset being processed in the locked sync'),
        })
        .describe('Lock to prevent parallel sync executions from duplicate webhooks'),
    },
  },
  channels: {},
  actions: {
    startCrawlerRun: {
      title: 'Start Crawler Run',
      description:
        'Start a crawler run asynchronously. Use with webhooks for production crawling. You can either use individual parameters for simple cases, or provide rawInputJsonOverride for full control.',
      input: {
        schema: startCrawlerRunInputSchema.extend({
          kbId: z.string().title('Knowledge Base ID').describe('Knowledge Base ID to save the crawled content to'),
        }),
      },
      output: {
        schema: z.object({
          success: z.boolean().title('Success').describe('Whether the operation completed successfully'),
          message: z.string().title('Message').describe('Status message describing the result'),
          data: z
            .object({
              runId: z.string(),
              status: z.string(),
            })
            .title('Data')
            .describe('Run details including run ID and current status'),
        }),
      },
    },
    getRunStatus: {
      title: 'Get Run Status',
      description: 'Check the status of a crawler run (useful for monitoring)',
      input: {
        schema: z.object({
          runId: z.string().title('Run ID').describe('The run ID to check status for'),
        }),
      },
      output: {
        schema: z.object({
          success: z.boolean().title('Success').describe('Whether the operation completed successfully'),
          message: z.string().title('Message').describe('Status message describing the result'),
          data: z
            .object({
              runId: z.string(),
              status: z.string(),
            })
            .title('Data')
            .describe('Run details including run ID and current status'),
        }),
      },
    },
    syncRunResults: {
      title: 'Sync Run Results',
      description: 'Get the results from a completed crawler run and sync to Botpress KB',
      input: {
        schema: z.object({
          runId: z.string().title('Run ID').describe('The run ID to get results for'),
          kbId: z.string().title('Knowledge Base ID').describe('Knowledge Base ID to tag the crawled content with'),
        }),
      },
      output: {
        schema: z.object({
          success: z.boolean().title('Success').describe('Whether the operation completed successfully'),
          message: z.string().title('Message').describe('Status message describing the result'),
          data: z
            .object({
              runId: z.string(),
              datasetId: z.string(),
            })
            .title('Data')
            .describe('Details about the synced run including run ID and dataset ID'),
        }),
      },
    },
  },
})
