import { IO, Prompt, PromptConfig } from 'botpress/sdk'
import * as sdk from 'botpress/sdk'
import lang from 'common/lang'
import _ from 'lodash'
import yn from 'yn'

import common from './common'

class PromptConfirm implements Prompt {
  private _question: { [lang: string]: string }

  constructor({ question = {} } = {}) {
    this._question = question
  }

  extraction(event: IO.IncomingEvent): sdk.ExtractionResult[] {
    const yesOrNo = yn(event.payload?.payload || event.preview)
    if (yesOrNo !== undefined) {
      return [{ value: yesOrNo, confidence: 1 }]
    }

    const topConfirmation = _.chain(event.ndu.triggers)
      .values()
      .filter(val => val.trigger.name?.startsWith('prompt_'))
      .map(x => ({ name: x.trigger.name, confidence: x.result[Object.keys(x.result)[0]] }))
      .orderBy(x => x.confidence, 'desc')
      .first()
      .value()

    return [{ value: topConfirmation?.name === 'prompt_yes', confidence: topConfirmation?.confidence ?? 0 }]
  }

  validate(value): sdk.ValidationResult {
    return { valid: value === true || value === false, message: lang.tr('module.builtin.prompt.invalid') }
  }
}

const config: PromptConfig = {
  type: 'confirm',
  label: 'Confirm',
  valueType: 'boolean',
  minConfidence: 0.3,
  noValidation: true,
  fields: common.fields,
  advancedSettings: common.advancedSettings
}

export default { id: 'confirm', config, prompt: PromptConfirm }
