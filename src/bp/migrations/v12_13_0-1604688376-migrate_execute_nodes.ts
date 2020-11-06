import * as sdk from 'botpress/sdk'
import { parseActionInstruction } from 'common/action'
import { FlowView } from 'common/typings'
import { FlowService } from 'core/services/dialog/flow/service'
import { Migration, MigrationOpts } from 'core/services/migration'
import { TYPES } from 'core/types'
import _ from 'lodash'

async function migrateFlow(flow: FlowView): Promise<FlowView | undefined> {
  for (const node of flow.nodes) {
    const { type, onEnter } = node
    if (type !== 'execute' || !onEnter || _.isEmpty(onEnter) || typeof onEnter[0] !== 'string') {
      continue
    }

    const { actionName, argsStr } = parseActionInstruction(onEnter[0])
    node.execute = {
      actionName,
      params: JSON.parse(argsStr)
    }
    node.onEnter = []
  }
  return flow
}

const migration: Migration = {
  info: {
    description: 'Migrate execute nodes to the new format',
    target: 'bot',
    type: 'content'
  },
  up: async ({ bp, inversify, metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const flowService = inversify.get<FlowService>(TYPES.FlowService)
    let hasChanges = false

    const migrateNodes = async (botId: string) => {
      const ghost = bp.ghost.forBot(botId)
      const flows = await flowService.loadAll(botId)

      return Promise.map(flows, async flow => {
        try {
          const updatedFlow = await migrateFlow(flow)
          if (!updatedFlow) {
            return
          }

          const flowContent = {
            ..._.omit(flow, 'links'),
            nodes: flow.nodes.map(node => _.omit(node, 'x', 'y', 'lastModified'))
          }
          await ghost.upsertFile('./flows', flow.location!, JSON.stringify(flowContent, undefined, 2), {
            ignoreLock: true
          })
          hasChanges = true
        } catch (err) {
          bp.logger
            .forBot(botId)
            .attachError(err)
            .error('Could not migrate say node data')
        }
      })
    }

    if (metadata.botId) {
      await migrateNodes(metadata.botId)
    } else {
      const bots = await bp.bots.getAllBots()
      for (const botId of Array.from(bots.keys())) {
        await migrateNodes(botId)
      }
    }

    return { success: true, message: hasChanges ? 'Nodes migrated successfully' : 'Nothing to migrate' }
  }
}

export default migration
