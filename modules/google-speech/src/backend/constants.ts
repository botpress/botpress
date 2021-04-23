import { Codec, Container, EnumDictionary } from './typings'

// https://cloud.google.com/speech-to-text/docs/encoding
export const SAMPLE_RATES: EnumDictionary<Container, EnumDictionary<Codec, number[] | null>> = {
  [Container.ogg]: {
    [Codec.opus]: [8000, 12000, 16000, 24000, 48000]
  }
}

export const EXTENSIONS: EnumDictionary<Container, string> = {
  [Container.ogg]: '.ogg'
}

export const LIBS: EnumDictionary<Codec, string> = {
  [Codec.opus]: 'libopus'
}
