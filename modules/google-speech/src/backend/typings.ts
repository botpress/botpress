import { protos as speechProtos } from '@google-cloud/speech'
import { protos as textToSpeechProtos } from '@google-cloud/text-to-speech'
import { GoogleSpeechClient } from './client'

export interface Clients {
  [botId: string]: GoogleSpeechClient
}

export type EnumDictionary<T extends string | symbol | number, U> = {
  [K in T]: U
}

export type IRecognitionConfig = speechProtos.google.cloud.speech.v1.IRecognitionConfig
export type IRecognitionAudio = speechProtos.google.cloud.speech.v1.IRecognitionAudio
export type ISynthesizeSpeechRequest = textToSpeechProtos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest

export enum Codec {
  opus,
  mp3
}

export enum Container {
  ogg,
  mpeg
}

export default speechProtos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding
