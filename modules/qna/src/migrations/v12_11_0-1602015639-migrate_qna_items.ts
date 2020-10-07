import * as sdk from 'botpress/sdk'
import _ from 'lodash'
const migration: sdk.ModuleMigration = {
  info: {
    description: '',
    target: 'core',
    type: 'config'
  },
  up: async ({ bp, metadata }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    let hasChanges = false

    const updateBot = async (botId: string) => {
      const bpfs = bp.ghost.forBot(botId)
      const files = await bpfs.directoryListing('./qna', '*.json')

      const qnaByContext = {}
      const allQnas = []

      for (const file of files) {
        const qna = (await bpfs.readFileAsObject('./qna', file)) as any
        const intent = (await bpfs.readFileAsObject('./intents', `__qna__${file}`)) as any

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

        allQnas.push(fixedEntry)

        if (qnaByContext[firstContext]) {
          qnaByContext[firstContext].push(fixedEntry)
        } else {
          qnaByContext[firstContext] = [fixedEntry]
        }
      }

      // for (const context of Object.keys(qnaByContext)) {
      //   const filename = `${context}/qna.intents.json`

      //   if (!(await bpfs.fileExists('flows', filename))) {
      //     console.log(context, qnaByContext[context])
      //     await bpfs.upsertFile('./flows', filename, JSON.stringify(qnaByContext[context], undefined, 2), {
      //       ignoreLock: true
      //     })
      //   }
      // }

      await bpfs.upsertFile('./flows', 'legacy_qna/qna.intents.json', JSON.stringify(allQnas, undefined, 2), {
        ignoreLock: true
      })

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

    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
