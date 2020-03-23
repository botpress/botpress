import * as sdk from 'botpress/sdk'

const ELEMENTS_DIR = 'content-elements'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Enable markdown by default for all text messages',
    target: 'bot',
    type: 'content'
  },
  up: async ({ bp, metadata }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    let hasChanged = false
    const checkFile = (fileContent: string, nbElements: number) => {
      const parsed = JSON.parse(fileContent)
      return parsed.length === nbElements
    }

    const updateFormData = ({ formData }: sdk.ContentElement) => {
      for (const key of Object.keys(formData)) {
        if (key.startsWith('text$')) {
          const language = key.substr(key.indexOf('$') + 1, key.length)
          const markdownKey = 'markdown$' + language

          if (!(markdownKey in formData)) {
            formData[markdownKey] = true
            hasChanged = true
          }
        }
      }
    }

    const migrateBotTextContent = async (botId: string) => {
      const bpfs = bp.ghost.forBot(botId)
      const entFiles = await bpfs.directoryListing(ELEMENTS_DIR, '*.json')

      for (const fileName of entFiles) {
        try {
          const contentElements = await bpfs.readFileAsObject<sdk.ContentElement[]>(ELEMENTS_DIR, fileName)
          contentElements.forEach(element => updateFormData(element))

          const fileContent = JSON.stringify(contentElements, undefined, 2)

          // Just double-checking before writing the content back
          if (checkFile(fileContent, contentElements.length)) {
            await bpfs.upsertFile(ELEMENTS_DIR, fileName, fileContent, { ignoreLock: true })
          }
        } catch (err) {
          console.error(`Error processing file ${fileName} for bot ${botId}`)
        }
      }
    }

    if (metadata.botId) {
      await migrateBotTextContent(metadata.botId)
    } else {
      const bots = await bp.bots.getAllBots()
      await Promise.map(bots.keys(), botId => migrateBotTextContent(botId))
    }

    return {
      success: true,
      message: hasChanged ? 'Text content type updated successfully' : 'Property already updated, skipping...'
    }
  }
}

export default migration
