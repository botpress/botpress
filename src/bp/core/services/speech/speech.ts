import { Logger } from 'botpress/sdk'
import { TYPES } from 'core/types'
import fs from 'fs'
import { inject, injectable, tagged } from 'inversify'
import path from 'path'
import { Readable } from 'stream'
import vosk from 'vosk'
import wav from 'wav'
import { VoskModel, VoskRecognizer } from './vosk'

export type PipeCallback = (stream: NodeJS.WritableStream) => void
export type SendCallback = (data: any) => void

@injectable()
export class SpeechService {
  private langs: { [lang: string]: LangSpeechService } = {}

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Speech')
    private logger: Logger
  ) {}

  public parse(pipe: PipeCallback, send: SendCallback, lang: string): void {
    this.getLang(lang).parse(pipe, send)
  }

  private getLang(lang: string) {
    let scope = this.langs[lang]
    if (!scope) {
      scope = new LangSpeechService(this.logger, lang, './speech')
      this.langs[lang] = scope
    }
    return scope
  }
}

class LangSpeechService {
  private model: VoskModel
  private tempStorageFileId: number = 0

  constructor(private logger: Logger, private lang: string, private dir: string) {
    vosk.setLogLevel(-1)
    const modelFile = path.join(this.dir, this.lang)

    if (fs.statSync(modelFile)) {
      this.logger.info(`Loading ${lang} speech model...`)
      this.model = new vosk.Model(modelFile)
    } else {
      throw `Speech model for ${lang} not found!`
    }
  }

  public parse(pipe: PipeCallback, send: SendCallback): void {
    const file = path.join(this.dir, `${this.lang}-${this.tempStorageFileId++}`)
    const writeStream = fs.createWriteStream(file)

    writeStream.on('finish', () => {
      this.parseFromFile(file, send)
    })

    pipe(writeStream)
  }

  private parseFromFile(file: string, send: SendCallback) {
    const recognizer = new vosk.Recognizer(this.model, 16000.0) as VoskRecognizer

    const fileStream = fs.createReadStream(file, { highWaterMark: 4096 })
    const wavReader = new wav.Reader()

    wavReader.on('format', async () => {
      for await (const data of new Readable().wrap(wavReader)) {
        recognizer.acceptWaveform(data)
      }

      const result = JSON.parse(recognizer.finalResult(recognizer))
      send(result)

      recognizer.free()
      fs.unlink(file, () => {})
    })

    fileStream.pipe(wavReader)
  }

  public free() {
    this.model.free()
  }
}
