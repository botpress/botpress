import { SpeechClient, protos as speechProtos } from '@google-cloud/speech'
import { TextToSpeechClient, protos as textToSpeechProtos } from '@google-cloud/text-to-speech'
import * as sdk from 'botpress/sdk'

import { Config } from '../config'

export const MIDDLEWARE_NAME = 'googleSpeech.speechToText'

export class GoogleSpeechClient {
  private speechClient: SpeechClient
  private textToSpeechClient: TextToSpeechClient

  constructor(private bp: typeof sdk, private config: Config) {}

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
    // Test file
    //const gcsUri = 'gs://cloud-samples-data/speech/brooklyn_bridge.raw'

    // TODO: Move this into typings
    type IRecognizeRequest = speechProtos.google.cloud.speech.v1.IRecognizeRequest

    const audio: IRecognizeRequest['audio'] = {
      uri: audioFile
    }
    // TODO: Adapt or detect these values depending on the audio file format
    const config: IRecognizeRequest['config'] = {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
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
    // TODO: Move this into typings
    type ISynthesizeSpeechRequest = textToSpeechProtos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest

    // Construct the request
    const request: ISynthesizeSpeechRequest = {
      input: { text },
      voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' }
    }

    const [response] = await this.textToSpeechClient.synthesizeSpeech(request)

    return response.audioContent
  }
}
