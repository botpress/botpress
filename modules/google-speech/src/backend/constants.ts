import { Codec, Container, EnumDictionary } from './typings'

// https://cloud.google.com/speech-to-text/docs/encoding
export const SAMPLE_RATES: EnumDictionary<Container, Partial<EnumDictionary<Codec, number[]>>> = {
  [Container.ogg]: {
    [Codec.opus]: [8000, 12000, 16000, 24000, 48000]
  },
  [Container['iso5/isom/hlsf']]: {},
  [Container['mpeg']]: {},
  [Container['ebml/webm']]: {}
}

export const EXTENSIONS: EnumDictionary<Container, string> = {
  [Container.ogg]: '.ogg',
  [Container['iso5/isom/hlsf']]: '.m4a',
  [Container['ebml/webm']]: '.webm',
  [Container['mpeg']]: '.mp3'
}

export const EXTENSIONS_CONVERSION: Partial<EnumDictionary<Container, string>> = {
  [Container['iso5/isom/hlsf']]: '.ogg'
}

export const LIBS_RESAMPLING: Partial<EnumDictionary<Codec, string>> = {
  [Codec.opus]: 'libopus'
}

export const LIBS_CONVERSION: Partial<EnumDictionary<Codec, string>> = {
  [Codec['mpeg-4/aac']]: 'libopus'
}
