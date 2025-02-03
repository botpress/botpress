import { Client } from '@botpress/client'

import { orderBy, isArray } from 'lodash-es'
import fs from 'node:fs'

const LLM_LIST_MODELS = 'listLanguageModels'

const client = new Client({
  apiUrl: process.env.CLOUD_API_ENDPOINT,
  botId: process.env.CLOUD_BOT_ID,
  token: process.env.CLOUD_PAT
})

const { bot } = await client.getBot({
  id: process.env.CLOUD_BOT_ID!
})

type Model = {
  id: string
  name: string
  integration: string
  input: { maxTokens: number }
  output: { maxTokens: number }
}

const models: Model[] = []

for (const integrationId in bot.integrations) {
  const botIntegration = bot.integrations[integrationId]
  if (botIntegration?.public && botIntegration?.enabled && botIntegration?.status === 'registered') {
    try {
      const { integration } = await client.getPublicIntegrationById({
        id: botIntegration.id
      })

      const canListModels = Object.keys(integration.actions).includes(LLM_LIST_MODELS)
      if (!canListModels) {
        continue
      }

      const { output } = await client.callAction({
        type: `${integration.name}:${LLM_LIST_MODELS}`,
        input: {}
      })

      if (isArray(output?.models)) {
        for (const model of output.models) {
          models.push({
            id: `${integration.name}__${model.id}`,
            name: model.name,
            integration: integration.name,
            input: { maxTokens: model.input.maxTokens },
            output: { maxTokens: model.output.maxTokens }
          })
        }
      }
    } catch (err: unknown) {
      console.error('Error fetching integration:', err instanceof Error ? err.message : `${err}`)
    }
  }
}

const content = JSON.stringify(orderBy(models, ['integration', 'name']), null, 2)

fs.writeFileSync(
  './src/models.ts',
  `
// This file is generated. Do not edit it manually.
// See 'scripts/update-models.ts'

/* eslint-disable */
/* tslint:disable */

export const Models = ${content} as const`,
  'utf-8'
)
