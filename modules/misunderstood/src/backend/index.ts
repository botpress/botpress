import * as sdk from 'botpress/sdk'

import en from '../translations/en.json'
import es from '../translations/es.json'
import fr from '../translations/fr.json'
import { FlaggedEvent, FLAG_REASON } from '../types'

import initApi from './api'
import Db from './db'

const EVENT_NAME: keyof BotpressCoreEvents = 'bp_core_feedback_negative'
let listener: (arg: BotpressCoreEvents['bp_core_feedback_negative']) => void

const onServerReady = async (bp: typeof sdk) => {
  const db = new Db(bp)
  await db.initialize()
  await initApi(bp, db)

  listener = async ({ botId, eventId }) => {
    const storedEvent = await bp.events.findEvents({ id: eventId })
    if (!storedEvent) {
      return
    }
    const event = storedEvent[0].event as sdk.IO.IncomingEvent

    const data: FlaggedEvent = {
      eventId: event.id,
      botId,
      language: [event.nlu.language, event.nlu.detectedLanguage, event.state?.user?.language].filter(
        l => l && l !== 'n/a'
      )[0],
      preview: event.preview,
      reason: 'thumbs_down' as FLAG_REASON
    }

    await db.addEvent(data)
  }

  process.BOTPRESS_EVENTS.on(EVENT_NAME, listener)
}

const onModuleUnmount = async (_bp: typeof sdk) => {
  process.BOTPRESS_EVENTS.off(EVENT_NAME, listener)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  onModuleUnmount,
  translations: { en, fr, es },
  definition: {
    experimental: false,
    name: 'misunderstood',
    menuIcon: 'icon.svg',
    menuText: 'Misunderstood',
    fullName: 'Misunderstood Phrases',
    homepage: 'https://botpress.com',
    workspaceApp: { bots: true }
  }
}

export default entryPoint
