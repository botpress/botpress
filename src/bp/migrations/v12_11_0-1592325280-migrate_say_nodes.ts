import * as sdk from 'botpress/sdk'
import { FlowService } from 'core/services/dialog/flow/service'
import { Migration, MigrationOpts } from 'core/services/migration'
import { TYPES } from 'core/types'
import _ from 'lodash'

const migration: Migration = {
  info: {
    description: 'Migrate from a single content to an array of contents',
    target: 'bot',
    type: 'content'
  },
  up: async ({ bp, inversify, metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    let hasChanged = false
    const flowService = inversify.get<FlowService>(TYPES.FlowService)

    const updateFlowContent = async (botId: string) => {
      const ghost = bp.ghost.forBot(botId)
      const flows = await flowService.loadAll(botId)

      return Promise.map(flows, async flow => {
        try {
          for (const n of flow.nodes) {
            if (n.type !== 'say_something' || n.contents || !n['content']) {
              continue
            }

            const content: sdk.ContentElement = (n as any).content

            const formData = Object.keys(content.formData).map(prop => {
              const [key, lang] = prop.split('$')
              return { key, lang, value: content.formData[prop] }
            })

            const langs = _.uniq(formData.map(x => x.lang))

            n.contents = [
              langs.reduce((acc, lang) => {
                acc[lang] = {
                  contentType: content.contentType,
                  ...formData
                    .filter(x => x.lang === lang)
                    .reduce((acc2, entry) => {
                      acc2[entry.key] = entry.value
                      return acc2
                    }, {})
                }
                return acc
              }, {})
            ]

            // @ts-ignore
            delete n.content

            hasChanged = true
          }

          // Taken from FlowService
          const flowContent = {
            ..._.pick(flow, ['version', 'catchAll', 'startNode', 'skillData', 'triggers', 'label', 'description']),
            nodes: flow.nodes.map(node => _.omit(node, 'x', 'y', 'lastModified'))
          }
          await ghost.upsertFile('./flows', flow.location!, JSON.stringify(flowContent, undefined, 2))
        } catch (err) {
          bp.logger
            .forBot(botId)
            .attachError(err)
            .error('Could not migrate say node data')
        }
      })
    }

    if (metadata.botId) {
      await updateFlowContent(metadata.botId)
    } else {
      const bots = await bp.bots.getAllBots()
      for (const botId of Array.from(bots.keys())) {
        await updateFlowContent(botId)
      }
    }

    return {
      success: true,
      message: hasChanged ? 'Content migrated successfully' : 'The content was already in the correct format'
    }
  }
}

export default migration
