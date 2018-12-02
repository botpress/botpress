import * as sdk from 'botpress/sdk'

import { ClassifierByBot } from './typings'

export const registerMiddleware = async (bp: typeof sdk, classifiers: ClassifierByBot) => {
  bp.events.registerMiddleware({
    name: 'knowledge.incoming',
    direction: 'incoming',
    handler: async (event, next) => {
      if (event.type !== 'text' || !event.preview) {
        next()
      }

      const results = await classifiers[event.botId].predict(event.preview)

      for (const result of results.filter(r => r.confidence > 0.5)) {
        const { content, page, paragraph, name } = result
        const details = `I found this: "${content}" in ${name} on page ${page}, par. ${paragraph}`

        event.suggestedReplies.push({
          confidence: result.confidence,
          payloads: [{ type: 'text', text: details }],
          intent: 'kdb' // TODO: remove intent requirement in decision engine, add source
        })
      }

      next()
    },
    order: 15,
    description: 'Finds content from Knowledge base files'
  })
}
