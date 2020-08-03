import * as sdk from 'botpress/sdk'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import tmp from 'tmp'

const PRETRAINED_LID_176 = join(__dirname, './pre-trained/lid.176.ftz')
export const NA_LANG = 'n/a'

export class FastTextLanguageId {
  private static model: sdk.MLToolkit.FastText.Model
  private static toolkit: typeof sdk.MLToolkit

  constructor(toolkit: typeof sdk.MLToolkit) {
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

    return (await FastTextLanguageId.model.predict(text, 3))
      .map(pred => ({
        ...pred,
        label: pred.label.replace('__label__', '')
      }))
      .sort((predA, predB) => predB.value - predA.value) // descending
  }
}

export default class LanguageIdentifierProvider {
  private static __instance: FastTextLanguageId

  public static getLanguageIdentifier(toolkit: typeof sdk.MLToolkit) {
    if (!LanguageIdentifierProvider.__instance) {
      LanguageIdentifierProvider.__instance = new FastTextLanguageId(toolkit)
    }

    return LanguageIdentifierProvider.__instance
  }
}
