import * as sdk from 'botpress/sdk'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import tmp from 'tmp'

import { LanguageIdentifier } from '../../typings'

const PRETRAINED_LID_176 = join(__dirname, '../../tools/pretrained/lid.176.ftz')

export class FastTextLanguageId implements LanguageIdentifier {
  private static model: sdk.MLToolkit.FastText.Model
  private static toolkit: typeof sdk.MLToolkit

  constructor(private toolkit: typeof sdk.MLToolkit, private readonly logger: sdk.Logger) {
    FastTextLanguageId.toolkit = toolkit
  }

  protected static async initializeModel() {
    const tmpFn = tmp.tmpNameSync({ postfix: '.ftz' })
    const modelBuff = readFileSync(PRETRAINED_LID_176)
    writeFileSync(tmpFn, modelBuff)
    const ft = new FastTextLanguageId.toolkit.FastText.Model()
    await ft.loadFromFile(tmpFn)
    FastTextLanguageId.model = ft
  }

  async identify(text: string): Promise<sdk.MLToolkit.FastText.PredictResult[]> {
    if (!FastTextLanguageId.model) {
      await FastTextLanguageId.initializeModel()
    }

    if (!FastTextLanguageId.model) {
      return []
    }

    return (await FastTextLanguageId.model.predict(text, 3)).map(pred => ({
      ...pred,
      label: pred.label.replace('__label__', '')
    }))
  }
}
