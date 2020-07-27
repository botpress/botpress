import { ExtractionResult, IO, MultiLangText, Prompt, PromptConfig, ValidationResult } from 'botpress/sdk'
import lang from 'common/lang'

import common from './common'

class PromptPattern implements Prompt {
  private _formatInvalidMessage: MultiLangText
  private regex: RegExp

  constructor({ regexPattern = '', formatInvalidMessage }) {
    this._formatInvalidMessage = formatInvalidMessage
    this.regex = new RegExp(regexPattern, 'g')
  }

  extraction(event: IO.IncomingEvent): ExtractionResult[] {
    const text = event.payload.text

    if (this.regex.test(text)) {
      return text.match(this.regex).map(x => ({ value: x, confidence: 1 }))
    }

    return []
  }

  validate(value): ValidationResult {
    if (value == undefined || !this.regex.test(value)) {
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
      required: true,
      placeholder: 'module.builtin.regexPatternPlaceholder',
      label: 'module.builtin.regexPattern'
      // TODO add combo box to select from predefined patterns or custom
    },
    {
      type: 'text',
      key: 'formatInvalidMessage',
      placeholder: 'module.builtin.formatInvalidMessagePlaceholder',
      label: 'module.builtin.formatInvalidMessage'
    }
  ],
  advancedSettings: common.advancedSettings
}

export default { id: 'pattern', config, prompt: PromptPattern }
