import { ExtractionResult, IO, MultiLangText, Prompt, PromptConfig, ValidationResult } from 'botpress/sdk'
import lang from 'common/lang'

import common from './common'

class PromptPattern implements Prompt {
  private _formatInvalidMessage: MultiLangText
  private _subType: string

  constructor({ subType, formatInvalidMessage }) {
    this._subType = subType
    this._formatInvalidMessage = formatInvalidMessage
  }

  extraction(event: IO.IncomingEvent): ExtractionResult[] {
    const entities = event.nlu?.entities?.filter(x => x.type === `custom.pattern.${this._subType}`) ?? []
    return entities.map(entity => ({
      value: entity.data.value,
      confidence: entity.meta.confidence
    }))
  }

  validate(value): ValidationResult {
    if (value == undefined) {
      return { valid: false, message: this._formatInvalidMessage ?? lang.tr('module.builtin.prompt.pattern.invalid') }
    }

    return { valid: true }
  }
}

const config: PromptConfig = {
  type: 'pattern',
  label: 'Pattern',
  valueType: 'string',
  icon: 'comparison',
  fields: [
    ...common.fields,
    {
      type: 'hidden',
      key: 'subType',
      label: 'subType'
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
