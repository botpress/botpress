import { SpeechClient } from '@google-cloud/speech'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import axios from 'axios'
import * as sdk from 'botpress/sdk'
import ffmpeg from 'ffmpeg.js'
import FormData from 'form-data'
import * as mm from 'music-metadata'
import { v4 as uuidv4 } from 'uuid'

import { Config } from '../config'
import { Audio } from './audio'
import { SAMPLE_RATE } from './constants'
import AudioEncoding, {
  IRecognitionAudio,
  IRecognitionConfig,
  ISynthesizeSpeechRequest,
  Container,
  Codec,
  Clients
} from './typings'

export const INCOMING_MIDDLEWARE_NAME = 'googleSpeech.speechToText'
export const OUTGOING_MIDDLEWARE_NAME = 'googleSpeech.textToSpeech'

const debug = DEBUG('google-speech')
const debugSpeechToText = debug.sub('speech-to-text')
const debugTextToSpeech = debug.sub('text-to-speech')

export class GoogleSpeechClient {
  private speechClient: SpeechClient
  private textToSpeechClient: TextToSpeechClient

  constructor(private readonly config: Config) {}

  async initialize() {
    if (!this.config.clientEmail || !this.config.privateKey) {
      return console.error(
        '[GoogleSpeech] The clientEmail and privateKey must be configured in order to use this module.'
      )
    }

    this.speechClient = new SpeechClient({
      credentials: {
        client_email: this.config.clientEmail,
        private_key: this.config.privateKey
      }
    })

    this.textToSpeechClient = new TextToSpeechClient({
      credentials: {
        client_email: this.config.clientEmail,
        private_key: this.config.privateKey
      }
    })
  }

  public async speechToText(audioFile: string) {
    debugSpeechToText('Received audio to convert:', audioFile)

    const resp = await axios.get<Buffer>(audioFile, {
      responseType: 'arraybuffer'
    })

    let buffer: Buffer = resp.data
    let meta = await mm.parseBuffer(buffer)
    let encoding: AudioEncoding

    const container = meta.format.container?.toLowerCase()
    const codec = meta.format.codec?.toLowerCase()
    if (container === 'ogg' && codec === 'opus') {
      encoding = AudioEncoding.OGG_OPUS

      const sampleRates = SAMPLE_RATE[Container[container]][Codec[codec]]
      if (!sampleRates.includes(meta.format.sampleRate)) {
        const audio = new Audio(Container.ogg, Codec.opus)
        const newSampleRate = sampleRates.pop()

        debugSpeechToText(`Resampling audio file to ${newSampleRate}Hz`)

        buffer = audio.resample(buffer, newSampleRate)

        debugSpeechToText('Audio file successfully resampled')

        meta = await mm.parseBuffer(buffer)
      }
    }

    debugSpeechToText('Audio file metadate', meta)

    /**
     * Note that transcription is limited to 60 seconds audio.
     * Use a GCS file for audio longer than 1 minute.
     */
    const audio: IRecognitionAudio = {
      content: buffer
    }

    const config: IRecognitionConfig = {
      encoding,
      sampleRateHertz: meta.format.sampleRate,
      languageCode: 'en-US'
    }

    const [response] = await this.speechClient.recognize({
      audio,
      config
    })

    const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n')

    return transcription
  }

  public async textToSpeech(text: string) {
    debugTextToSpeech('Received text to convert into audio:', text)

    const request: ISynthesizeSpeechRequest = {
      input: { text },
      voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' }
    }

    const [response] = await this.textToSpeechClient.synthesizeSpeech(request)

    return response.audioContent
  }
}

export async function setupMiddlewares(bp: typeof sdk, clients: Clients) {
  bp.events.registerMiddleware({
    description: 'Converts audio content to text using google speech-to-text.',
    direction: 'incoming',
    handler: incomingHandler,
    name: INCOMING_MIDDLEWARE_NAME,
    order: 1
  })

  async function incomingHandler(event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) {
    if (event.payload.type !== 'voice') {
      return next()
    }

    const client: GoogleSpeechClient = clients[event.botId]
    if (!client) {
      return next()
    }

    const audioFile = event.payload.audio

    if (audioFile) {
      try {
        const text: string = await client.speechToText(audioFile)

        const newEvent: sdk.IO.Event = bp.IO.Event({
          type: event.type,
          direction: event.direction,
          channel: event.channel,
          target: event.target,
          threadId: event.threadId,
          botId: event.botId,
          preview: text,
          payload: { type: 'text', text, textToSpeech: true }
        })

        await bp.events.sendEvent(newEvent)

        next(null, true)
      } catch (err) {
        console.error(err)
        next(err)
      }
    }
  }

  bp.events.registerMiddleware({
    description: 'Converts text to audio using google text-to-speech.',
    direction: 'outgoing',
    handler: outgoingHandler,
    name: OUTGOING_MIDDLEWARE_NAME,
    order: 1
  })

  async function outgoingHandler(event: sdk.IO.OutgoingEvent, next: sdk.IO.MiddlewareNextCallback) {
    const incomingEvent: sdk.IO.IncomingEvent = event.payload.event
    if (!incomingEvent || incomingEvent.payload.textToSpeech !== true) {
      return next()
    }

    const client: GoogleSpeechClient = clients[event.botId]
    if (!client) {
      return next()
    }

    const text = event.payload.text

    if (text) {
      try {
        const audio = await client.textToSpeech(text)

        const data = new FormData()
        data.append('file', audio, `${uuidv4()}.mp3`)

        const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
        axiosConfig.headers['Content-Type'] = `multipart/form-data; boundary=${data.getBoundary()}`

        const res = await axios.post<{ url: string }>('/media', data, {
          ...axiosConfig
        })

        const newEvent: sdk.IO.Event = bp.IO.Event({
          type: event.type,
          direction: event.direction,
          channel: event.channel,
          target: event.target,
          threadId: event.threadId,
          botId: event.botId,
          payload: { type: 'audio', audio: res.data.url }
        })

        await bp.events.sendEvent(newEvent)

        next(null, true)
      } catch (err) {
        console.error(err)
        next(err)
      }
    }
  }
}
