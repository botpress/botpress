import * as sdk from 'botpress/sdk'

import en from '../translations/en.json'
import fr from '../translations/fr.json'
import { FLAG_REASON, FlaggedEvent } from '../types'

import initApi from './api'
import Db from './db'

const onServerReady = async (bp: typeof sdk) => {
  const db = new Db(bp)
  await db.initialize()
  await initApi(bp, db)

  process.BOTPRESS_EVENTS.on('bp_core_feedback_negative', async ({ channel, botId, type, eventId }) => {
    const storedEvent = await bp.events.findEvents({ id: eventId })
    if (!storedEvent) {
      return
    }
    const event = storedEvent[0].event as sdk.IO.IncomingEvent

    const data: FlaggedEvent = {
      eventId: event.id,
      botId,
      language: [event.nlu.language, event.nlu.detectedLanguage, event.state.user.language].filter(
        l => l && l !== 'n/a'
      )[0],
      preview: event.preview,
      reason: 'auto_hook' as FLAG_REASON
    }

    await db.addEvent(data)
  })
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  translations: { en, fr },
  definition: {
    name: 'misunderstood',
    menuIcon: 'gesture',
    menuText: 'Misunderstood',
    fullName: 'Misunderstood Phrases',
    homepage: 'https://botpress.com'
  }
}

export default entryPoint
