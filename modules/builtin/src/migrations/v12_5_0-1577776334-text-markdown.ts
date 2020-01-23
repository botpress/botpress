import * as sdk from 'botpress/sdk'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Setting Markdown property to true for text content type',
    target: 'bot',
    type: 'content'
  },
  up: async ({ bp, metadata }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const migrateBotTextContent = async (botId: string) => {
      const elementsDir = 'content-elements'

      const bpfs = bp.ghost.forBot(botId)
      const entFiles = await bpfs.directoryListing(elementsDir, '*.json')
      for (const fileName of entFiles) {
        const fileContentElements = await bpfs.readFileAsObject<sdk.ContentElement[]>(elementsDir, fileName)
        for (const element of fileContentElements) {
          const formData = element.formData
          for (const key of Object.keys(formData)) {
            if (key.startsWith('typing$')) {
              const language = key.substr(key.indexOf('$') + 1, key.length)
              const markdownKey = 'markdown$' + language
              if (!(markdownKey in formData)) {
                formData[markdownKey] = true
              }
            }
          }
        }
        await bpfs.upsertFile(elementsDir, fileName, JSON.stringify(fileContentElements, undefined, 2))
      }
    }
    if (metadata.botId) {
      await migrateBotTextContent(metadata.botId)
    } else {
      const bots = await bp.bots.getAllBots()
      await Promise.map(bots.keys(), botId => migrateBotTextContent(botId))
    }

    return { success: true, message: 'Text content type updated successfully' }
  }
}

export default migration
