import ffmpeg from 'ffmpeg.js'
import { EXTENSIONS, EXTENSIONS_CONVERSION, LIBS_RESAMPLING, LIBS_CONVERSION } from './constants'
import { Codec, Container } from './typings'

// TODO: Make this async using worker threads: https://github.com/Kagami/ffmpeg.js#via-web-worker
export class Audio {
  private filenameIn: string
  private filenameOut: string

  constructor(private readonly container: Container, private readonly codec: Codec) {
    this.filenameIn = `in${EXTENSIONS[this.container]}`
    this.filenameOut = `out${EXTENSIONS[this.container]}`
  }

  private customFilenameOut(ext: string): string {
    return `out${ext}`
  }

  /**
   * Re-sample an audio buffer to a desired sample rate.
   * @param buffer The audio buffer to re-sample
   * @param newSampleRate The sample rate we want the audio to use
   * @returns An audio buffer with the proper sample rate
   */
  public resample(buffer: Buffer, newSampleRate: number): Buffer | undefined {
    const argumentIn = ['-i', this.filenameIn]
    const argumentCodec = LIBS_RESAMPLING[this.codec] ? ['-acodec', LIBS_RESAMPLING[this.codec]] : []
    const argumentSampleRate = ['-ar', `${newSampleRate}`]

    const result = ffmpeg({
      MEMFS: [{ name: this.filenameIn, data: buffer }],
      arguments: [...argumentIn, ...argumentCodec, ...argumentSampleRate, this.filenameOut],
      print(_data) {},
      printErr(_data) {},
      onExit(_code) {},
      stdin(_data) {}
    })
    const out = result.MEMFS[0]

    if (out?.data) {
      return Buffer.from(out.data)
    } else {
      throw new Error('Output buffer is empty')
    }
  }

  /**
   * Converts audio files to a format recognized by Google Speech-To-Text
   * @param buffer The audio buffer to convert
   * @returns An audio buffer using a codec recognized by Google Speech-To-Text
   */
  public convert(buffer: Buffer): Buffer | undefined {
    const argumentIn = ['-i', this.filenameIn]
    const argumentCodec = LIBS_CONVERSION[this.codec] ? ['-acodec', LIBS_CONVERSION[this.codec]] : []

    const result = ffmpeg({
      MEMFS: [{ name: this.filenameIn, data: buffer }],
      arguments: [...argumentIn, ...argumentCodec, this.customFilenameOut(EXTENSIONS_CONVERSION[this.container])],
      print(_data) {},
      printErr(_data) {},
      onExit(_code) {},
      stdin(_data) {}
    })
    const out = result.MEMFS[0]

    if (out?.data) {
      return Buffer.from(out.data)
    } else {
      throw new Error('Output buffer is empty')
    }
  }
}
