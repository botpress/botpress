import { ExtractionResult, IO, Prompt, PromptConfig, ValidationResult } from 'botpress/sdk'

import commonFields from './common'

class PromptPattern implements Prompt {
  private _regexPattern: string

  constructor({ regexPattern }) {
    this._regexPattern = regexPattern
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
      return { valid: false, message: 'Provided value is invalid' }
    }

    if (!new RegExp(this._regexPattern).test(value)) {
      return { valid: false, message: 'Value does not match regex pattern' }
    }

    return { valid: true }
  }
}

const config: PromptConfig = {
  type: 'pattern',
  label: 'Pattern',
  valueType: 'string',
  fields: [
    ...commonFields(),
    {
      type: 'text',
      key: 'regexPattern',
      label: 'module.builtin.regexPattern'
    }
  ],
  advancedSettings: []
}

export default { id: 'pattern', config, prompt: PromptPattern }
