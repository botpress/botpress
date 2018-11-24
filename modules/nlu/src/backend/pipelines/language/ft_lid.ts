import { Logger } from 'botpress/sdk'

import { join } from 'path'

import { readFileSync, writeFileSync } from 'fs'
import tmp from 'tmp'

import FastTextWrapper from '../../tools/fastText'
import { LanguageIdentifier } from '../../typings'

const PRETRAINED_LID_176 = join(__dirname, '../../tools/pretrained/lid.176.ftz')

export class FastTextLanguageId implements LanguageIdentifier {
  private static model: FastTextWrapper

  constructor(private readonly logger: Logger) {
    if (!FastTextLanguageId.model) {
      FastTextLanguageId.initializeModel()
    }
  }

  protected static initializeModel() {
    const tmpFn = tmp.tmpNameSync()
    const modelBuff = readFileSync(PRETRAINED_LID_176)
    writeFileSync(tmpFn, modelBuff)
    this.model = new FastTextWrapper(tmpFn)
  }

  async identify(text: string): Promise<string> {
    const res = await FastTextLanguageId.model.predict(text, 1)
    return res[0].name
  }
}
