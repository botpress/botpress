import * as sdk from 'botpress/sdk'
import { ActionStrategy } from 'core/services/dialog/instruction/strategy'
import { Migration } from 'core/services/migration'
import _ from 'lodash'

const FLOW_DIR = 'flows'

const migration: Migration = {
  info: {
    description: 'Migrate custom Bot Actions to Legacy Actions',
    target: 'core',
    type: 'code'
  },
  up: async ({
    bp,
    configProvider,
    database,
    inversify,
    metadata
  }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const updateBot = async botId => {
      const bpfs = bp.ghost.forBot(botId)

      const updateActions = async () => {
        const files = await bpfs.directoryListing('actions', '*.js')
        for (const originalFileName of files) {
          if (originalFileName.includes('.legacy.')) {
            continue
          }
          const parts = originalFileName.split('.')
          if (parts.length != 2 && parts[1] != '.js') {
            return { success: false, message: 'Wrong file' }
          }
          const filename = parts[0]
          await bpfs.renameFile('actions', originalFileName, `${filename}.legacy.js`)
        }
      }

      const updateFlows = async () => {
        const flows = await bpfs.directoryListing(FLOW_DIR, '*.json')
        for (const flowName of flows) {
          const originalFlow: sdk.Flow = await bpfs.readFileAsObject(FLOW_DIR, flowName)
          for (const node of originalFlow.nodes) {
            for (const [i, onEnterStatement] of (node.onEnter as string[])?.entries() || []) {
              if (!ActionStrategy.isSayInstruction(onEnterStatement)) {
                const parts = onEnterStatement.split(' ')
                const actionName = parts[0]
                node.onEnter![i] = `${actionName}.legacy ` + [...parts.slice(1)].join(' ')
              }
            }
          }

          await bpfs.upsertFile(FLOW_DIR, flowName, JSON.stringify(originalFlow, undefined, 2), { ignoreLock: true })
        }
      }

      await updateActions()
      await updateFlows()
    }

    if (metadata.botId) {
      await updateBot(metadata.botId)
    } else {
      const bots = await bp.bots.getAllBots()
      for (const botId of Array.from(bots.keys())) {
        await updateBot(botId)
      }
    }

    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
