import { protos, v1p1beta1 } from '@google-cloud/speech'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import axios from 'axios'
import * as sdk from 'botpress/sdk'
import { isBpUrl } from 'common/url'
import * as mm from 'music-metadata'

import { Config } from '../config'
import { Audio } from './audio'
import { EXTENSIONS, EXTENSIONS_CONVERSION, SAMPLE_RATES } from './constants'
import {
  IRecognitionAudio,
  IRecognitionConfig,
  ISynthesizeSpeechRequest,
  Container,
  Codec,
  AudioEncoding,
  IRecognizeRequest
} from './typings'
import { TimeoutError, timeoutFn, closest } from './utils'

const debug = DEBUG('google-speech')
const debugSpeechToText = debug.sub('speech-to-text')
const debugTextToSpeech = debug.sub('text-to-speech')

export class GoogleSpeechClient {
  private logger: sdk.Logger
  private speechClient: v1p1beta1.SpeechClient // Beta client is required to support MP3 and WebM audio files
  private textToSpeechClient: TextToSpeechClient

  //Transcription is limited to 60 seconds audio.
  private readonly defaultMaxAudioDuration = 60

  constructor(private bp: typeof sdk, private botId: string, private readonly config: Config) {
    this.logger = this.bp.logger.forBot(this.botId)
  }

  public async initialize() {
    if (!this.config.clientEmail || !this.config.privateKey) {
      return this.logger.error(
        '[GoogleSpeech] The clientEmail and privateKey must be configured in order to use this module.'
      )
    }

    try {
      this.speechClient = new v1p1beta1.SpeechClient({
        credentials: {
          client_email: this.config.clientEmail,
          private_key: this.config.privateKey
        },
        projectId: this.config.projectId
      })
      await this.speechClient.initialize()
      // Test the credentials by authenticating to the Google API
      await this.speechClient.auth.getAccessToken()

      this.textToSpeechClient = new TextToSpeechClient({
        credentials: {
          client_email: this.config.clientEmail,
          private_key: this.config.privateKey
        },
        projectId: this.config.projectId
      })
      await this.textToSpeechClient.initialize()
      // Test the credentials by authenticating to the Google API
      await this.textToSpeechClient.auth.getAccessToken()

      this.logger.info('GoogleSpeech configuration successful!')
    } catch (err) {
      this.logger.error('Error ocurred while initializing GoogleSpeech module:', err.message)
    }
  }

  public async close() {
    try {
      await this.speechClient.close()
      await this.textToSpeechClient.close()
    } catch (err) {
      this.logger.error('Error ocurred while closing connections to Google APIs:', err.message)
    }
  }

  public async speechToText(audioFileUrl: string, language: string, timeout?: string): Promise<string | undefined> {
    debugSpeechToText(`Received audio file to recognize: ${audioFileUrl}`)

    // Media Service URLs (local URL)
    if (isBpUrl(audioFileUrl)) {
      audioFileUrl = `${process.LOCAL_URL}${audioFileUrl}`
    }

    let { data: buffer } = await axios.get<Buffer>(audioFileUrl, { responseType: 'arraybuffer' })

    let meta = await mm.parseBuffer(buffer)
    const maxAudioDuration = Math.min(this.config.maxAudioDuration, this.defaultMaxAudioDuration)
    if (meta.format.duration > maxAudioDuration) {
      this.logger.warn(
        `Audio file duration (${meta.format.duration}s) exceed maximum duration allowed of: ${maxAudioDuration}s`
      )
      return
    }

    // TODO: Either move this into a module or move it in its own class/file
    let encoding: protos.google.cloud.speech.v1p1beta1.RecognitionConfig.AudioEncoding

    const container: Container = Container[meta.format.container?.toLowerCase()]
    const codec: Codec = Codec[meta.format.codec?.toLowerCase()]
    if (container === Container.ogg && codec === Codec.opus) {
      const sampleRates = SAMPLE_RATES[container][codec]
      if (!sampleRates.includes(meta.format.sampleRate)) {
        const audio = new Audio(container, codec)
        const newSampleRate = closest(sampleRates, meta.format.sampleRate)

        debugSpeechToText(`Re-sampling audio file from ${meta.format.sampleRate}Hz to ${newSampleRate}Hz`)

        buffer = audio.resample(buffer, newSampleRate)

        debugSpeechToText('Audio file successfully re-sampled')

        meta = await mm.parseBuffer(buffer)
      }

      encoding = AudioEncoding.OGG_OPUS
    } else if (container === Container['ebml/webm'] && codec === Codec.opus) {
      encoding = AudioEncoding.WEBM_OPUS
    } else if (container === Container['iso5/isom/hlsf'] && codec === Codec['mpeg-4/aac']) {
      const audio = new Audio(container, codec)

      debugSpeechToText(`Converting audio file from ${EXTENSIONS[container]} to ${EXTENSIONS_CONVERSION[container]}`)

      buffer = audio.convert(buffer)

      debugSpeechToText('Audio file successfully converted')

      meta = await mm.parseBuffer(buffer)

      encoding = AudioEncoding.OGG_OPUS
    } else if (
      container === Container.mpeg &&
      (codec === Codec['mpeg 1 layer 3'] || codec === Codec['mpeg 2 layer 3'])
    ) {
      encoding = AudioEncoding.MP3
    }

    if (!encoding) {
      this.logger.warn('Audio file format not supported. Skipping...', { ...meta.format })

      return
    }

    debugSpeechToText('Audio file metadata:', meta)

    // Note that transcription is limited to 60 seconds audio.
    // Use a GCS file for audio longer than 1 minute.
    const audio: IRecognitionAudio = {
      content: buffer
    }

    const config: IRecognitionConfig = {
      encoding,
      sampleRateHertz: meta.format.sampleRate,
      languageCode: this.languageCode(language),
      audioChannelCount: meta.format.numberOfChannels
    }

    const request: IRecognizeRequest = {
      config,
      audio
    }

    debugSpeechToText('Recognizing text from audio file...')

    try {
      const clientPromise = this.speechClient.recognize(request)
      const [response] = await timeoutFn(clientPromise, timeout)

      const transcription = response.results
        ?.map(result => {
          const alternative = result.alternatives[0]
          if (alternative.confidence >= this.config.confidenceThreshold) {
            return alternative.transcript
          }
        })
        .join('\n')

      if (!transcription) {
        debugSpeechToText('No text could be recognized')
      } else {
        debugSpeechToText('Text recognized:', `'${transcription}'`)
      }

      return transcription
    } catch (err) {
      if (err instanceof TimeoutError) {
        debugSpeechToText(`Recognition cancelled: ${err.message}`)
      } else {
        throw err
      }
    }
  }

  public async textToSpeech(
    text: string,
    language: string,
    timeout?: string
  ): Promise<Uint8Array | string | undefined> {
    debugTextToSpeech(`Received text to convert into audio: ${text}`)

    const hasSSML = !!text.match(/<speak>(.|\n)*<\/speak>/g)?.length

    const request: ISynthesizeSpeechRequest = {
      input: hasSSML ? { ssml: text } : { text },
      voice: { languageCode: this.languageCode(language), ssmlGender: this.config.voiceSelection },
      audioConfig: { audioEncoding: 'MP3' } // Always return .mp3 files since it's one of the most recognized audio file type
    }

    debugTextToSpeech('Producing audio content from text...')

    try {
      const clientPromise = this.textToSpeechClient.synthesizeSpeech(request)
      const [response] = await timeoutFn(clientPromise, timeout)

      if (!response.audioContent.length) {
        debugTextToSpeech('No audio content could be produced from the text received')
      } else {
        debugTextToSpeech('Audio content produced successfully')
      }

      return response.audioContent
    } catch (err) {
      if (err instanceof TimeoutError) {
        debugTextToSpeech(`Audio production cancelled: ${err.message}`)
      } else {
        throw err
      }
    }
  }

  /**
   * Returns the closest BCP 47 language code based on a user language
   */
  private languageCode(language: string) {
    // Instead of doing a complete BCP 47 validation, we only make sure the language
    // contains an hyphen that separates the language code to the country code.
    if (language.includes('-')) {
      return language
    } else {
      return this.config.languageMapping[language] || 'en-US'
    }
  }
}
