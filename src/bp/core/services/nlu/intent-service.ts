import * as sdk from 'botpress/sdk'
import { FlowView } from 'common/typings'
import { sanitizeFileName } from 'core/misc/utils'
import _ from 'lodash'

import { GhostService } from '..'

const FLOWS_DIR = './flows'

export class IntentService {
  constructor(private ghostService: GhostService) {}

  public async getIntents(botId: string): Promise<sdk.NLU.IntentDefinition[]> {
    const intentsFromFiles = await this.getIntentsFromFiles(botId)
    const intentsFromFlows = await this.getIntentsFromFlows(botId)
    return [...intentsFromFiles, ...intentsFromFlows]
  }

  private async getIntentsFromFiles(botId: string): Promise<sdk.NLU.IntentDefinition[]> {
    const filesPaths = await this.ghostService.forBot(botId).directoryListing(FLOWS_DIR, '*.intents.json')
    return _.flatten(
      await Promise.map(filesPaths, fn =>
        this.ghostService
          .forBot(botId)
          .readFileAsObject<sdk.NLU.IntentDefinition[]>(FLOWS_DIR, fn)
          .catch(err => {
            // TODO: log error
            return []
          })
      )
    ).filter(i => i.metadata?.enabled)
  }

  private async getIntentsFromFlows(botId: string): Promise<sdk.NLU.IntentDefinition[]> {
    const flowsPaths = await this.ghostService.forBot(botId).directoryListing(FLOWS_DIR, '*.flow.json')
    const flows: sdk.Flow[] = await Promise.map(flowsPaths, async (flowPath: string) => ({
      // @ts-ignore
      name: flowPath.replace(/.flow.json$/i, ''),
      ...(await this.ghostService.forBot(botId).readFileAsObject<FlowView>(FLOWS_DIR, flowPath))
    }))

    const intentsByName: Dic<sdk.NLU.IntentDefinition> = {}

    for (const flow of flows) {
      const topicName = flow.name.split('/')[0]

      for (const node of flow.nodes.filter(x => x.type === 'trigger')) {
        const tn = node as sdk.TriggerNode
        const conditions = tn?.conditions.filter(x => x?.id === 'user_intent_is')

        for (let i = 0; i < conditions.length; i++) {
          const intentName = sanitizeFileName(`${topicName}/${flow.name}/${tn?.name}/${i}`)
          if (intentsByName[intentName]) {
            throw new Error(`Duplicated intent with name "${intentName}"`)
          }
          intentsByName[intentName] = {
            contexts: [topicName],
            filename: flow.name,
            name: intentName,
            slots: flow.variables?.map(x => ({ name: x.params?.name, entity: x?.params?.subType ?? x.type })) ?? [],
            utterances: conditions[i]?.params?.utterances ?? {}
          }
        }
      }
    }

    return Object.values(intentsByName)
  }
}
