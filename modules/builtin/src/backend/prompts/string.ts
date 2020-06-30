import { ExtractionResult, IO, Prompt, PromptConfig, ValidationResult } from 'botpress/sdk'
import lang from 'common/lang'

import common from './common'

class PromptString implements Prompt {
  private _maxLength: boolean

  constructor({ maxLength }) {
    this._maxLength = maxLength
  }

  extraction(event: IO.IncomingEvent): ExtractionResult | undefined {
    const text = event.payload.text
    if (text) {
      return {
        value: text,
        confidence: 1
      }
    }
  }

  async validate(value): Promise<ValidationResult> {
    if (value == undefined) {
      return { valid: false, message: lang.tr('prompt.invalid') }
    }

    if (value.length > this._maxLength) {
      return { valid: false, message: lang.tr('prompt.string.tooLong', { maxLength: this._maxLength }) }
    }

    return { valid: true }
  }
}

const config: PromptConfig = {
  type: 'string',
  label: 'String',
  valueType: 'string',
  fields: [
    ...common.fields,
    {
      type: 'text',
      key: 'maxLength',
      label: 'module.builtin.maxLength'
    }
  ],
  advancedSettings: [...common.advancedSettings]
}

export default { id: 'string', config, prompt: PromptString }
