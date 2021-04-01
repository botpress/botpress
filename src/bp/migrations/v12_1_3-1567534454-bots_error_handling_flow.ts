import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'

const FLOW_DIR = 'flows'
const ERROR_FLOW = 'error.flow.json'
const ERROR_UI = 'error.ui.json'

const ELEMENTS_DIR = 'content-elements'
const TEXT_ELEMENTS = 'builtin_text.json'

const migration: Migration = {
  info: {
    description: 'Bots must have an error handling flow',
    target: 'bot',
    type: 'content'
  },
  up: async ({ bp, metadata, configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const errorFlow = {
      version: '0.0.1',
      catchAll: {},
      startNode: 'entry',
      nodes: [
        {
          id: '3rr0r',
          name: 'entry',
          onEnter: ['say #!builtin_text-error'],
          onReceive: null,
          next: []
        }
      ]
    }

    const errorFlowUi = {
      nodes: [
        {
          id: '3rr0r',
          position: {
            x: 100,
            y: 100
          }
        }
      ],
      links: []
    }

    const getErrorElement = (lang: string) => ({
      id: 'builtin_text-error',
      formData: {
        [`text$${lang}`]: "😯 Oops! We've got a problem. Please try something else while we're fixing it 🔨",
        [`typing$${lang}`]: true
      },
      createdBy: 'admin',
      createdOn: new Date(),
      modifiedOn: new Date()
    })

    const updateBot = async botId => {
      const bpfs = bp.ghost.forBot(botId)

      if (await bpfs.fileExists(FLOW_DIR, ERROR_FLOW)) {
        return bp.logger.warn(
          `Bot "${botId}" already has a flow named "error". Users will be redirected there when encountering an error.`
        )
      }

      const botConfig = await configProvider.getBotConfig(botId)
      const hasTextElements = await bpfs.fileExists(ELEMENTS_DIR, TEXT_ELEMENTS)
      const existingElements = hasTextElements ? await bpfs.readFileAsObject<any[]>(ELEMENTS_DIR, TEXT_ELEMENTS) : []

      await bpfs.upsertFile(FLOW_DIR, ERROR_FLOW, JSON.stringify(errorFlow, undefined, 2), { ignoreLock: true })
      await bpfs.upsertFile(FLOW_DIR, ERROR_UI, JSON.stringify(errorFlowUi, undefined, 2), { ignoreLock: true })

      await bpfs.upsertFile(
        ELEMENTS_DIR,
        TEXT_ELEMENTS,
        JSON.stringify([...existingElements, getErrorElement(botConfig.defaultLanguage)], undefined, 2),
        { ignoreLock: true }
      )
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
