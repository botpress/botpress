import { protos } from '@google-cloud/text-to-speech'

export interface Config {
  /**
   * Enable or disable this module for this bot
   * @default false
   */
  enabled: boolean
  /**
   * The email of the service account used to authenticate with Google APIs
   * @default "your client email here"
   */
  clientEmail: string
  /**
   * The private key linked with the service account used to authenticate with Google APIs
   * @default "your private key here"
   */
  privateKey: string
  /**
   * The language mapping between the bot or user language and the format recognized by Google Speech (must be in BCP-47 format).
   * @default { "ar": "ar-AE", "nl": "nl-NL", "en": "en-US", "fr": "fr-FR", "de": "de-DE", "he": "iw-IL", "it": "it-IT", "ja": "ja-JP", "pl": "pl-PL", "pt": "pt-PT", "ru": "ru-RU", "es": "es-ES"  }
   */
  languageMapping: { [lang: string]: string }
  /**
   * The voice selection for google text-to-speech
   * @default "NEUTRAL"
   */
  voiceSelection: protos.google.cloud.texttospeech.v1.IVoiceSelectionParams['ssmlGender']
}
