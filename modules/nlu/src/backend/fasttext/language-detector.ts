import { readFileSync } from 'fs'
import { join } from 'path'

import FastTextClassifier from './classifier'

const LANG_MODEL_PATH = join(__dirname, 'models/lid.176.ftz')

export class LanguageDetector extends FastTextClassifier {
  constructor() {
    super()

    const modelBuff = readFileSync(LANG_MODEL_PATH)
    this.loadModel(modelBuff, 'lid')
  }

  async detectLang(text): Promise<string> {
    const res = await this.predict(text, 1)

    return res[0].name
  }
}

export class LanguageDetectorProvider {
  static detector

  static getLanguageDetector(): LanguageDetector {
    if (!this.detector) {
      this.detector = new LanguageDetector()
    }

    return this.detector
  }
}
