import * as sdk from 'botpress/sdk'
import { FlowService } from 'core/services/dialog/flow/service'
import { Migration, MigrationOpts } from 'core/services/migration'
import { TYPES } from 'core/types'
import _ from 'lodash'

const CONTENT_DIR = 'content-elements'

const migration: Migration = {
  info: {
    description: 'migrates all cms content refered in on-enter transitions directly to ',
    target: 'core',
    type: 'config'
  },
  up: async ({ bp, inversify, metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const flowService = inversify.get<FlowService>(TYPES.FlowService)
    const updateBotContent = async (botId: string) => {
      const ghost = bp.ghost.forBot(botId)
      const contentFiles = await ghost.directoryListing(CONTENT_DIR, '*.json')

      const contentMap: _.Dictionary<sdk.ContentElement> = (
        await Promise.map(contentFiles, f => ghost.readFileAsObject<sdk.ContentElement[]>(CONTENT_DIR, f))
      ).reduce((elems, next) => {
        for (const elem of next) {
          elems[elem.id] = elem
        }
        return elems
      }, {})

      const flows = await flowService.loadAll(botId)

      return Promise.map(flows, async flow => {
        // get all necessary content
        // necessary ?
        const contentIds = _.chain(flow.nodes)
          .filter(n => n.type === 'say_something')
          .flatMap(n => n.onEnter)
          .filter(
            instruction => instruction && typeof instruction == 'string' && (instruction as string).startsWith('say')
          )
          .map((instruction: string) => instruction.split('#!')[1])
          .value()

        if (contentIds.length === 0) {
          return
        }

        for (const n of flow.nodes) {
          const isSayAndHasContent =
            n.type === 'say_something' && !_.isEmpty(n.onEnter) && typeof n.onEnter![0] === 'string'
          if (!isSayAndHasContent) {
            continue
          }

          const contentId = (<string>n.onEnter![0]).split('#!')[1]
          if (!contentId) {
            continue
          }

          const element = contentMap[contentId]
          n.content = {
            contentType: contentId.substring(0, contentId.lastIndexOf('-')),
            formData: element.formData
          }
          n.onEnter = []
        }

        // Taken from FlowService
        const flowContent = {
          ..._.pick(flow, ['version', 'catchAll', 'startNode', 'skillData', 'triggers', 'label', 'description']),
          nodes: flow.nodes.map(node => _.omit(node, 'x', 'y', 'lastModified'))
        }

        try {
          await ghost.upsertFile('./flows', flow.location!, JSON.stringify(flowContent, undefined, 2))
        } catch (err) {
          console.log(err)
        }

        // TODO clean this
        // TODO make sure this works while starting for multiple bots
        // TODO make this this works while importing a bot
      })
    }

    if (metadata.botId) {
      await updateBotContent(metadata.botId)
    } else {
      const bots = await bp.bots.getAllBots()
      for (const botId of Array.from(bots.keys())) {
        await updateBotContent(botId)
      }
    }

    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
