import axios from 'axios'
import * as sdk from 'botpress/sdk'
import FormData from 'form-data'
import LRUCache from 'lru-cache'
import ms from 'ms'
import { v4 as uuidv4 } from 'uuid'

import { GoogleSpeechClient } from './client'
import { Clients } from './typings'

const INCOMING_MIDDLEWARE_NAME = 'googleSpeech.speechToText'
const OUTGOING_MIDDLEWARE_NAME = 'googleSpeech.textToSpeech'

export class Middleware {
  private readonly timeout = '15s'
  private isTextToSpeechCache: LRUCache<string, boolean>

  constructor(private bp: typeof sdk, private clients: Clients) {
    this.isTextToSpeechCache = new LRUCache({ maxAge: ms('1m') })
  }

  public setup() {
    this.bp.events.registerMiddleware({
      description: 'Converts audio content to text using google speech-to-text.',
      direction: 'incoming',
      handler: this.incomingHandler.bind(this),
      name: INCOMING_MIDDLEWARE_NAME,
      order: -1,
      timeout: this.timeout
    })

    this.bp.events.registerMiddleware({
      description: 'Converts text to audio using google text-to-speech.',
      direction: 'outgoing',
      handler: this.outgoingHandler.bind(this),
      name: OUTGOING_MIDDLEWARE_NAME,
      order: -1,
      timeout: this.timeout
    })
  }

  private async incomingHandler(event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) {
    if (event.payload.type !== 'voice') {
      return next(undefined, false, true)
    }

    const client: GoogleSpeechClient = this.clients[event.botId]
    if (!client) {
      return next(undefined, false, true)
    }

    const audioFile = event.payload.audio
    if (!audioFile) {
      return next(undefined, false, true)
    }

    try {
      const language: string =
        event.state.user.language?.replace(/'/g, '') || (await this.bp.bots.getBotById(event.botId)).defaultLanguage
      const text = await client.speechToText(audioFile, language, this.timeout)

      if (!text) {
        return next(undefined, false, true)
      }

      const payload = { type: 'text', text }

      event.setFlag(this.bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)

      const newEvent = this.bp.IO.Event({ ...event, direction: 'incoming', payload })
      await this.bp.events.sendEvent(newEvent)

      this.isTextToSpeechCache.set(newEvent.id, true)

      return next(undefined, true, false)
    } catch (err) {
      this.bp.logger.forBot(event.botId).error('[speech-to-text]:', err)
      return next(err)
    }
  }

  private async outgoingHandler(event: sdk.IO.OutgoingEvent, next: sdk.IO.MiddlewareNextCallback) {
    const client: GoogleSpeechClient = this.clients[event.botId]
    if (!client) {
      return next(undefined, false, true)
    }

    const incomingEventId: string = event.incomingEventId
    if (
      !incomingEventId ||
      event.payload.type !== 'text' ||
      !event.payload.text ||
      !this.isTextToSpeechCache.get(incomingEventId)
    ) {
      return next(undefined, false, true)
    }

    try {
      const text: string = event.payload.text
      const userAttributes = await this.bp.users.getAttributes(event.channel, event.target)
      const language: string =
        userAttributes['language']?.replace(/'/g, '') || (await this.bp.bots.getBotById(event.botId)).defaultLanguage

      const audio = await client.textToSpeech(text, language, this.timeout)

      if (!audio.length) {
        return next(undefined, false, true)
      }

      const formData = new FormData()
      formData.append('file', audio, `${uuidv4()}.mp3`)

      // TODO: Add cache (preview -> buffer)
      const axiosConfig = await this.bp.http.getAxiosConfigForBot(event.botId, { studioUrl: true })
      axiosConfig.headers['Content-Type'] = `multipart/form-data; boundary=${formData.getBoundary()}`

      const {
        data: { url }
      } = await axios.post<{ url: string }>('/media', formData, {
        ...axiosConfig
      })

      const payload = { type: 'voice', audio: url }

        // Simply override the payload so we don't send a new event at the bottom of the event queue
        // inverting the order of the events being sent back to the users
      ;(<any>event.payload) = payload

      // Do not swallow the event or mention that the processing was
      // skipped since we simply override the event payload
      return next(undefined, false, false)
    } catch (err) {
      this.bp.logger.forBot(event.botId).error('[text-to-speech]:', err)
      return next(err)
    }
  }

  public remove() {
    this.bp.events.removeMiddleware(INCOMING_MIDDLEWARE_NAME)
    this.bp.events.removeMiddleware(OUTGOING_MIDDLEWARE_NAME)
  }
}
