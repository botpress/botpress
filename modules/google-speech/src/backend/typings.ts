import { protos as speechProtos } from '@google-cloud/speech'
import { protos as textToSpeechProtos } from '@google-cloud/text-to-speech'
import { GoogleSpeechClient } from './client'

export interface Clients {
  [botId: string]: GoogleSpeechClient
}

export type EnumDictionary<T extends string | symbol | number, U> = {
  [K in T]: U
}

export type IRecognitionConfig = speechProtos.google.cloud.speech.v1p1beta1.IRecognitionConfig
export type IRecognitionAudio = speechProtos.google.cloud.speech.v1.IRecognitionAudio
export const AudioEncoding = speechProtos.google.cloud.speech.v1p1beta1.RecognitionConfig.AudioEncoding

export type ISynthesizeSpeechRequest = textToSpeechProtos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest

export enum Codec {
  opus
}

export enum Container {
  ogg
}
