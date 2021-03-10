import { Logger } from 'botpress/sdk'
import { TYPES } from 'core/types'
import fs from 'fs'
import { inject, injectable, tagged } from 'inversify'
import path from 'path'
import { Readable, Stream } from 'stream'
import vosk from 'vosk'
import wav from 'wav'
import { VoskModel, VoskRecognizer } from './vosk'

@injectable()
export class SpeechService {
  private langs: { [lang: string]: LangSpeechService } = {}

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Speech')
    private logger: Logger
  ) {}

  public parse(stream: Stream, lang: string): Promise<string> {
    return this.getLang(lang).parse(stream)
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

  public parse(stream: Stream): Promise<string> {
    return new Promise<string>(resolve => {
      const file = path.join(this.dir, `${this.lang}-${this.tempStorageFileId++}`)
      const writeStream = fs.createWriteStream(file)

      writeStream.on('finish', async () => {
        resolve(await this.parseFromFile(file))
      })

      stream.pipe(writeStream)
    })
  }

  private parseFromFile(file: string): Promise<string> {
    return new Promise<string>(resolve => {
      const recognizer = new vosk.Recognizer(this.model, 16000.0) as VoskRecognizer

      const fileStream = fs.createReadStream(file, { highWaterMark: 4096 })
      const wavReader = new wav.Reader()

      wavReader.on('format', async () => {
        for await (const data of new Readable().wrap(wavReader)) {
          recognizer.acceptWaveform(data)
        }

        const result = JSON.parse(recognizer.finalResult(recognizer))
        resolve(result)

        recognizer.free()
        fs.unlink(file, () => {})
      })

      fileStream.pipe(wavReader)
    })
  }

  public free() {
    this.model.free()
  }
}
