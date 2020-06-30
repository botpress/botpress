import { ExtractionResult, IO, Prompt, PromptConfig, ValidationResult } from 'botpress/sdk'
import lang from 'common/lang'

import common from './common'

class PromptNumber implements Prompt {
  private _min: boolean | undefined
  private _max: boolean | undefined

  constructor({ min = undefined, max = undefined } = {}) {
    this._min = min
    this._max = max
  }

  extraction(event: IO.IncomingEvent): ExtractionResult | undefined {
    const entity = event.nlu?.entities?.find(x => x.type === 'system.number')
    if (entity) {
      return {
        value: entity.data.value,
        confidence: entity.meta.confidence
      }
    }
  }

  async validate(value): Promise<ValidationResult> {
    const { _min, _max } = this

    if (value == undefined) {
      return { valid: false, message: lang.tr('prompt.invalid') }
    }

    if (_min !== undefined && value < _min) {
      return { valid: false, message: lang.tr('prompt.number.lowerThanMin') }
    } else if (_max !== undefined && value > _max) {
      return { valid: false, message: lang.tr('prompt.number.higherThanMax') }
    }

    return { valid: true }
  }
}

const config: PromptConfig = {
  type: 'number',
  label: 'Number',
  valueType: 'number',
  fields: [
    ...common.fields,
    {
      type: 'text',
      key: 'min',
      label: 'module.builtin.min'
    },
    {
      type: 'text',
      key: 'max',
      label: 'module.builtin.max'
    }
  ],
  advancedSettings: [...common.advancedSettings]
}

export default { id: 'number', config, prompt: PromptNumber }
