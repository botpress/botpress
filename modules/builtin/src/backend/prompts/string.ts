import { ExtractionResult, IO, Prompt, PromptConfig, ValidationResult } from 'botpress/sdk'
import lang from 'common/lang'

import common from './common'

class PromptString implements Prompt {
  private _maxLength: number | undefined

  constructor({ maxLength = undefined } = {}) {
    this._maxLength = maxLength
  }

  extraction(event: IO.IncomingEvent): ExtractionResult[] {
    const text = event.payload.text

    // Do not extract on the first turn
    if (!event.state.context.activePrompt?.turn || !text) {
      return []
    }

    return [{ value: text, confidence: 1 }]
  }

  validate(value): ValidationResult {
    if (value == undefined) {
      return { valid: false, message: lang.tr('module.builtin.prompt.invalid') }
    }

    if (this._maxLength != undefined && value.length > this._maxLength) {
      return { valid: false, message: lang.tr('module.builtin.prompt.string.tooLong', { maxLength: this._maxLength }) }
    }

    return { valid: true }
  }
}

const config: PromptConfig = {
  type: 'string',
  label: 'String',
  valueType: 'string',
  fields: common.fields,
  noConfirmation: true,
  advancedSettings: [
    {
      type: 'number',
      key: 'maxLength',
      min: 0,
      max: 10000,
      label: 'module.builtin.maxLength'
    },
    ...common.advancedSettings
  ]
}

export default { id: 'string', config, prompt: PromptString }
