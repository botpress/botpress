import ffmpeg from 'ffmpeg.js'
import { EXTENSIONS, LIBS } from './constants'
import { Codec, Container } from './typings'

// TODO: Make this async using worker threads: https://github.com/Kagami/ffmpeg.js#via-web-worker
export class Audio {
  private filenameIn: string
  private filenameOut: string

  constructor(private readonly container: Container, private readonly codec: Codec) {
    this.filenameIn = `in${EXTENSIONS[this.container]}`
    this.filenameOut = `out${EXTENSIONS[this.container]}`
  }

  public resample(buffer: Buffer, newSampleRate: number): Buffer | undefined {
    const argumentIn = ['-i', this.filenameIn]
    const argumentCodec = LIBS[this.codec] ? ['-acodec', LIBS[this.codec]] : []
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

    if (out && out.data) {
      return Buffer.from(out.data)
    } else {
      throw new Error('Output buffer is empty')
    }
  }
}
