import { Bot, z } from '@botpress/sdk'
// import * as bp from '.botpress' /** uncomment to get generated code */

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

const bot = new Bot({
  integrations: {},
  configuration: {
    schema: z.object({}),
  },
  states: {},
  events: {
    // Defines an event that will trigger the recrawl of the website pages
    websiteCrawl: {
      schema: z.object({}),
    },
  },
  recurringEvents: {
    websiteCrawl: {
      payload: {},
      type: 'websiteCrawl',
      schedule: {
        cron: '0 0 * * *', // Every day
      },
    },
  },
})

bot.event(async ({ event, client }) => {
  if (event.type === 'websiteCrawl') {
    // Creates a new workflow to crawl all pages
  }
})

export default bot
