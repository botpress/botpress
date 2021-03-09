import fs from 'fs'
import { injectable } from 'inversify'
import { Readable } from 'stream'
import vosk from 'vosk'
import wav from 'wav'
import { VoskModel, VoskRecognizer } from './vosk'

@injectable()
export class SpeechService {
  private langs: { [lang: string]: LangSpeechService } = {}

  public parse(file: string, lang: string): Promise<string> {
    return this.getLang(lang).parse(file)
  }

  getLang(lang: string) {
    let scope = this.langs[lang]
    if (!scope) {
      scope = new LangSpeechService(lang, lang)
      this.langs[lang] = scope
    }
    return scope
  }
}

class LangSpeechService {
  private model: VoskModel
  private recognizers: VoskRecognizer[] = []

  constructor(private lang: string, private dir: string) {
    vosk.setLogLevel(-1)
    this.model = new vosk.Model(`./speech/${dir}`) as VoskModel
  }

  public parse(file: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let recognizer = this.recognizers.pop()!
      if (!recognizer) {
        recognizer = new vosk.Recognizer(this.model, 16000.0) as VoskRecognizer
      }

      const fileStream = fs.createReadStream(`./speech/${file}.wav`, { highWaterMark: 4096 })
      const wavReader = new wav.Reader()

      wavReader.on('format', async ({ audioFormat, sampleRate, channels }) => {
        if (audioFormat !== 1 || channels !== 1) {
          this.recognizers.push(recognizer)
          reject('Audio file must be WAV format mono PCM.')
          return
        }

        for await (const data of new Readable().wrap(wavReader)) {
          recognizer.acceptWaveform(data)
        }

        this.recognizers.push(recognizer)

        const result = JSON.parse(recognizer.finalResult(recognizer))
        resolve(result.text)
      })

      fileStream.pipe(wavReader)
    })
  }

  public free() {
    this.model.free()
    this.recognizers.forEach(r => r.free())
  }
}
