import * as sdk from 'botpress/sdk'
import _ from 'lodash'

const getQnaFilename = (id: string) => `__qna__${id}`
const QNA_FOLDER = './qna'
const INTENTS_FOLDER = './intents'
const FLOWS_FOLDER = './flows'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Convert questions to the new format',
    target: 'bot',
    type: 'content'
  },
  up: async ({ bp, metadata }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    let hasChanges = false

    const updateBot = async (botId: string) => {
      const bpfs = bp.ghost.forBot(botId)
      const files = await bpfs.directoryListing(QNA_FOLDER, '*.json')

      const qnaByContext = {}

      for (const file of files) {
        const qna = (await bpfs.readFileAsObject(QNA_FOLDER, file)) as any
        const intent = (await bpfs.readFileAsObject(INTENTS_FOLDER, getQnaFilename(file))) as any

        const firstContext = intent.contexts?.[0] ?? 'global'

        const fixedEntry = {
          name: intent.name,
          contexts: intent.contexts,
          filename: `${firstContext}/qna.intents.json`,
          slots: intent.slots,
          utterances: intent.utterances,
          metadata: {
            ..._.omit(qna.data, ['questions', 'contexts']),
            lastModifiedOn: new Date()
          }
        }

        if (qnaByContext[firstContext]) {
          qnaByContext[firstContext].push(fixedEntry)
        } else {
          qnaByContext[firstContext] = [fixedEntry]
        }

        await bpfs.deleteFile(QNA_FOLDER, file)
        await bpfs.deleteFile(INTENTS_FOLDER, getQnaFilename(file))
      }

      for (const context of Object.keys(qnaByContext)) {
        const filename = `${context}/qna.intents.json`

        if (!(await bpfs.fileExists(FLOWS_FOLDER, filename))) {
          await bpfs.upsertFile(FLOWS_FOLDER, filename, JSON.stringify(qnaByContext[context], undefined, 2), {
            ignoreLock: true
          })
        }
      }

      hasChanges = true
    }

    if (metadata.botId) {
      await updateBot(metadata.botId)
    } else {
      const bots = await bp.bots.getAllBots()
      for (const botId of Array.from(bots.keys())) {
        await updateBot(botId)
      }
    }

    return {
      success: true,
      message: hasChanges ? 'Questions migrated successfully' : 'Questions are already converted, skipping...'
    }
  }
}

export default migration
