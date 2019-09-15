import * as sdk from 'botpress/sdk'

import { ClassifierByBot } from './typings'

export const registerMiddleware = async (bp: typeof sdk, classifiers: ClassifierByBot) => {
  const MIN_TEXT_LENGTH = 10

  bp.events.registerMiddleware({
    name: 'knowledge.incoming',
    direction: 'incoming',
    handler: async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
      if (event.type !== 'text' || !event.preview || event.preview.length < MIN_TEXT_LENGTH) {
        return next()
      }

      const results = await classifiers[event.botId].predict(event.preview)

      for (const result of results.filter(r => r.confidence > 0.5)) {
        const { content, page, paragraph, name } = result
        const details = `I found this: \n_"${content}"_ \nin ${name} on page ${page}, par. ${paragraph}`

        event.suggestions.push({
          confidence: result.confidence,
          payloads: [{ type: 'text', text: details, markdown: true }],
          source: 'knowledge',
          sourceDetails: `Doc: ${name} Page: ${page} Paragraph: ${paragraph}`
        })
      }

      next()
    },
    order: 15,
    description: 'Finds content from Knowledge base files'
  })
}
