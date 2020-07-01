import { ExtractionResult, IO, Prompt, PromptConfig, ValidationResult } from 'botpress/sdk'
import lang from 'common/lang'

import common from './common'

class PromptPattern implements Prompt {
  private _regexPattern: string
  private _formatInvalidMessage: { [lang: string]: string }

  constructor({ regexPattern = '', formatInvalidMessage = {} } = {}) {
    this._regexPattern = regexPattern
    this._formatInvalidMessage = formatInvalidMessage
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
      return { valid: false, message: lang.tr('module.builtin.prompt.invalid') }
    }

    if (!new RegExp(this._regexPattern).test(value)) {
      return { valid: false, message: this._formatInvalidMessage ?? lang.tr('module.builtin.prompt.pattern.invalid') }
    }

    return { valid: true }
  }
}

const config: PromptConfig = {
  type: 'pattern',
  label: 'Pattern',
  valueType: 'string',
  fields: [
    ...common.fields,
    {
      type: 'text',
      key: 'regexPattern',
      label: 'module.builtin.regexPattern'
      // TODO add combo box to select from predefined patterns or custom
    },
    {
      type: 'text',
      key: 'formatInvalidMessage',
      label: 'module.builtin.formatInvalidMessage'
    }
  ],
  advancedSettings: [...common.advancedSettings]
}

export default { id: 'pattern', config, prompt: PromptPattern }
