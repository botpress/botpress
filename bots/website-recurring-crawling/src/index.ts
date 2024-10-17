import * as bp from '.botpress'

// Static data available in the Bot
const pages = [
  'https://botpress.com',
  'https://botpress.com/affiliates',
  'https://botpress.com/ai-chatbots-for-students',
  'https://botpress.com/ai-chatbots-for-telecommunications',
  'https://botpress.com/ai-spend-calculator',
  'https://botpress.com/ambassador-program',
  'https://botpress.com/ar-ae/best-arabic-chatbot',
  'https://botpress.com/arabic-chatbot',
  'https://botpress.com/become-a-partner',
  'https://botpress.com/best-french-chatbot',
  'https://botpress.com/best-german-chatbot',
  'https://botpress.com/best-italian-chatbot',
  'https://botpress.com/best-japanese-chatbot',
  'https://botpress.com/best-spanish-chatbot',
  'https://botpress.com/blog',
  'https://botpress.com/botpress-vs-dialogflow',
  'https://botpress.com/botpress-vs-rasa',
  'https://botpress.com/br-pt/chatbot-portuguese',
  'https://botpress.com/browse-by-field',
  'https://botpress.com/ca-fr/meilleur-chatbot-francais',
  'https://botpress.com/careers',
  'https://botpress.com/company/about',
  'https://botpress.com/contact-us',
  'https://botpress.com/customers',
  'https://botpress.com/de-de/bester-deutscher-chatbot',
  'https://botpress.com/docs',
  'https://botpress.com/verticals/examples',
  'https://botpress.com/es-es/mejor-chatbot-espanol',
  'https://botpress.com/events',
  'https://botpress.com/features/ai-agent-studio',
  'https://botpress.com/features/tables',
  'https://botpress.com/features/knowledge-bases',
  'https://botpress.com/features/autonomous',
  'https://botpress.com/follow-botpress',
  'https://botpress.com/hub',
  'https://botpress.com/it-it/miglior-chatbot-italiano',
  'https://botpress.com/ja-ja/best-japanese-chatbot',
  'https://botpress.com/legal',
  'https://botpress.com/live-chat',
  'https://botpress.com/news',
  'https://botpress.com/pricing',
  'https://botpress.com/solutions/customer-support-chatbot',
  'https://botpress.com/solutions/financial-services',
  'https://botpress.com/solutions/healthcare',
  'https://botpress.com/solutions/itsm-chatbot',
  'https://botpress.com/enterprise',
  'https://botpress.com/agency',
  'https://botpress.com/developers',
]

const bot = new bp.Bot({})

const crawlPage = async (page: string, client: bp.Client) => {
  // Call the website indexer integration to index the content of the page
  // I know this is done this way right now but I would change the way we do it and index in the bot instead of in the integration
  // This way the bot can own its own files
  await client.callAction({
    type: 'website-indexer:indexUrls',
    input: {
      indexUrls: [page],
    },
  } as any)
}

const continueCrawl = async (workflowId: string, client: bp.Client) => {
  const { state } = await client
    .getState({
      id: workflowId,
      name: 'crawling',
      type: 'workflow',
    } as any)
    .catch((err) => {
      if ((err as any).type !== 'ResourceNotFound') {
        throw err
      }

      return client.setState({
        id: workflowId,
        name: 'crawling',
        type: 'workflow',
        payload: {
          iterator: 0,
          errors: 0,
        },
      } as any)
    })

  let iterator = (state as any).payload.iterator

  // If we have finished set the workflow to completed
  if (iterator + 1 >= pages.length) {
    await client.updateWorkflow({
      id: workflowId,
      status: 'completed',
    })
  }

  let errors = (state as any).payload.errors

  for (let i = iterator; i < pages.length; i++) {
    const page = pages[i]

    if (!page) {
      continue
    }

    await crawlPage(page, client).catch(() => {
      errors++
    })

    // Save state every 10 pages
    if (i % 10 === 0) {
      await client.setState({
        id: workflowId,
        type: 'workflow',
        payload: {
          iterator: i,
          errors,
        },
      } as any)
    }

    // After 10 errors we set the workflow to failed
    // This will prevent the workflow from continuing forever
    if (errors > 10) {
      await client.updateWorkflow({
        id: workflowId,
        status: 'failed',
        failureReason: 'Too many errors',
      })
    }
  }

  // All the pages have been crawled so we can set the workflow to completed
  await client.updateWorkflow({
    id: workflowId,
    status: 'completed',
  })
}

bot.event(async ({ event, client }) => {
  if (event.type === 'websiteCrawl') {
    // Creates a new workflow to crawl all pages this workflow will continue until all pages are crawled
    const { workflow } = await client.createWorkflow({
      name: 'website-crawl',
      status: 'in_progress',
      eventId: event.id,
      timeoutAt: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(), // 6 hours to complete
    })

    await continueCrawl(workflow.id, client)
  } else if (event.type === 'workflow_update') {
    const workflowId = (event as any).payload.workflow.id

    // Every time the workflow receives a workflow_continue event we need to update the workflow status to in_progress
    // Otherwise the workflow will be marked as failed
    await client.updateWorkflow({
      id: workflowId,
      eventId: event.id,
      status: 'in_progress',
    })

    await continueCrawl(workflowId, client)
  }
})

export default bot
