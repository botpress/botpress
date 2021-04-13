import * as sdk from 'botpress/sdk'
import { FlowView } from 'common/typings'
import { TYPES } from 'core/app/types'
import { FlowService } from 'core/dialog'
import { Migration, MigrationOpts } from 'core/migration'
import _ from 'lodash'

const CONTENT_DIR = 'content-elements'

async function migrateFlow(
  flow: FlowView,
  contentMap: _.Dictionary<sdk.ContentElement>
): Promise<FlowView | undefined> {
  const contentIds = _.chain(flow.nodes)
    .filter(n => n.type === 'say_something')
    .flatMap(n => n.onEnter)
    .filter(instruction => instruction && typeof instruction === 'string' && (instruction as string).startsWith('say'))
    .map((instruction: string) => instruction.split('#!')[1])
    .value()

  if (contentIds.length === 0) {
    return
  }

  for (const n of flow.nodes) {
    const isSayAndHasContent = n.type === 'say_something' && !_.isEmpty(n.onEnter) && typeof n.onEnter![0] === 'string'
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
  return flow
}

async function getBotContentMap(ghost: sdk.ScopedGhostService): Promise<_.Dictionary<sdk.ContentElement>> {
  const contentFiles = await ghost.directoryListing(CONTENT_DIR, '*.json')
  return Promise.map(contentFiles, f => ghost.readFileAsObject<sdk.ContentElement[]>(CONTENT_DIR, f)).reduce(
    (elems, next) => {
      for (const elem of next) {
        elems[elem.id] = elem
      }
      return elems
    },
    {}
  )
}

const migration: Migration = {
  info: {
    description: 'migrates all cms content refered in on-enter transitions directly to ',
    target: 'bot',
    type: 'config'
  },
  up: async ({ bp, inversify, metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const flowService = inversify.get<FlowService>(TYPES.FlowService)
    const updateFlowContent = async (botId: string) => {
      const ghost = bp.ghost.forBot(botId)
      const contentMap = await getBotContentMap(ghost)

      const flows = await flowService.forBot(botId).loadAll()
      return Promise.map(flows, async flow => {
        try {
          const updatedFlow = await migrateFlow(flow, contentMap)
          if (!updatedFlow) {
            return
          }

          // Taken from FlowService
          const flowContent = {
            ..._.pick(flow, ['version', 'catchAll', 'startNode', 'skillData', 'triggers', 'label', 'description']),
            nodes: flow.nodes.map(node => _.omit(node, 'x', 'y', 'lastModified'))
          }
          await ghost.upsertFile('./flows', flow.location!, JSON.stringify(flowContent, undefined, 2), {
            ignoreLock: true
          })
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

    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
