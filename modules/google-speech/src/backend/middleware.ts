import axios from 'axios'
import * as sdk from 'botpress/sdk'
import FormData from 'form-data'
import { v4 as uuidv4 } from 'uuid'

import { GoogleSpeechClient } from './client'
import { Clients } from './typings'

const INCOMING_MIDDLEWARE_NAME = 'googleSpeech.speechToText'
const OUTGOING_MIDDLEWARE_NAME = 'googleSpeech.textToSpeech'

export class Middleware {
  constructor(private bp: typeof sdk, private clients: Clients) {}

  public setup() {
    this.bp.events.registerMiddleware({
      description: 'Converts audio content to text using google speech-to-text.',
      direction: 'incoming',
      handler: this.incomingHandler.bind(this),
      name: INCOMING_MIDDLEWARE_NAME,
      order: 1
    })

    this.bp.events.registerMiddleware({
      description: 'Converts text to audio using google text-to-speech.',
      direction: 'outgoing',
      handler: this.outgoingHandler.bind(this),
      name: OUTGOING_MIDDLEWARE_NAME,
      order: 1
    })
  }

  private async incomingHandler(event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) {
    // TODO: Add more validation than the payload type being audio
    if (event.payload.type !== 'audio') {
      return next()
    }

    const client: GoogleSpeechClient = this.clients[event.botId]
    if (!client) {
      return next()
    }

    const audioFile = event.payload.audio
    if (audioFile) {
      try {
        // TODO: Fetch bot current language too?
        const language: string = event.state.user.language?.replace(/'/g, '')
        const text: string = await client.speechToText(audioFile, language)

        if (text) {
          const newEvent: sdk.IO.Event = this.bp.IO.Event({
            type: event.type,
            direction: event.direction,
            channel: event.channel,
            target: event.target,
            threadId: event.threadId,
            botId: event.botId,
            payload: { type: 'text', text, textToSpeech: true }
          })

          await this.bp.events.sendEvent(newEvent)

          return next(null, true)
        }
      } catch (err) {
        this.bp.logger.forBot(event.botId).error('[speech-to-text]:', err)
        return next(err)
      }
    }

    return next()
  }

  private async outgoingHandler(event: sdk.IO.OutgoingEvent, next: sdk.IO.MiddlewareNextCallback) {
    const incomingEventId: string = event.incomingEventId
    if (!incomingEventId || event.type !== 'text') {
      return next()
    }

    const incomingEvents: sdk.IO.StoredEvent[] = await this.bp.events.findEvents({
      incomingEventId: event.incomingEventId,
      direction: 'incoming'
    })
    if (!incomingEvents.length || incomingEvents[0].event.payload.textToSpeech !== true) {
      return next()
    }

    const client: GoogleSpeechClient = this.clients[event.botId]
    if (!client) {
      return next()
    }

    const text = event.payload.text
    if (text) {
      try {
        // TODO: Fetch bot current language too?
        const userAttributes = await this.bp.users.getAttributes(event.channel, event.target)
        const language: string = userAttributes['language']?.replace(/'/g, '')
        const audio = await client.textToSpeech(text, language)

        const data = new FormData()
        data.append('file', audio, `${uuidv4()}.mp3`)

        // TODO: Add cache (preview -> buffer)
        const axiosConfig = await this.bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
        axiosConfig.headers['Content-Type'] = `multipart/form-data; boundary=${data.getBoundary()}`

        const res = await axios.post<{ url: string }>('/media', data, {
          ...axiosConfig
        })

        const newEvent: sdk.IO.Event = this.bp.IO.Event({
          type: 'audio',
          direction: event.direction,
          channel: event.channel,
          target: event.target,
          threadId: event.threadId,
          botId: event.botId,
          payload: { type: 'audio', url: `${process.EXTERNAL_URL}${res.data.url}` }
        })

        await this.bp.events.sendEvent(newEvent)

        return next(null, true)
      } catch (err) {
        this.bp.logger.forBot(event.botId).error('[text-to-speech]:', err)
        return next(err)
      }
    }

    return next()
  }

  public remove() {
    this.bp.events.removeMiddleware(INCOMING_MIDDLEWARE_NAME)
    this.bp.events.removeMiddleware(OUTGOING_MIDDLEWARE_NAME)
  }
}
