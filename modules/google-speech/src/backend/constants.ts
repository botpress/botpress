import { Codec, Container, EnumDictionary } from './typings'

// https://cloud.google.com/speech-to-text/docs/encoding
export const SAMPLE_RATE: EnumDictionary<Container, EnumDictionary<Codec, number[] | null>> = {
  [Container.ogg]: {
    [Codec.opus]: [8000, 12000, 16000, 24000, 48000],
    [Codec.mp3]: null
  },
  [Container.mpeg]: {
    [Codec.opus]: null,
    [Codec.mp3]: []
  }
}

export const EXTENSIONS: EnumDictionary<Container, string> = {
  [Container.mpeg]: '.mp3',
  [Container.ogg]: '.ogg'
}

export const LIBS: EnumDictionary<Codec, string> = {
  [Codec.mp3]: 'libmp3lame',
  [Codec.opus]: 'libopus'
}
