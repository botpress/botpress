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
export type IRecognitionAudio = speechProtos.google.cloud.speech.v1p1beta1.IRecognitionAudio
export const AudioEncoding = speechProtos.google.cloud.speech.v1p1beta1.RecognitionConfig.AudioEncoding

export type ISynthesizeSpeechRequest = textToSpeechProtos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest

export type IRecognizeRequest = speechProtos.google.cloud.speech.v1p1beta1.IRecognizeRequest

export enum Codec {
  opus,
  'mpeg-4/aac',
  'mpeg 1 layer 3',
  'mpeg 2 layer 3'
}

export enum Container {
  ogg,
  'ebml/webm',
  'iso5/isom/hlsf',
  'mpeg'
}
