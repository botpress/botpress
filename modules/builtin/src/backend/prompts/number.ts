import { ExtractionResult, IO, Prompt, ValidationResult } from 'botpress/sdk'
import { PromptConfig } from 'common/typings'

class PromptNumber implements Prompt {
  private _min: boolean
  private _max: boolean

  constructor({ min, max }) {
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
      return { valid: false, message: 'Provided value is invalid' }
    }

    if (_min && value < _min) {
      return { valid: false, message: 'Value is lower than minimum' }
    } else if (_max && value > _max) {
      return { valid: false, message: 'Value is higher than maximum' }
    }
    return { valid: true }
  }
}

const config: PromptConfig = {
  type: 'number',
  label: 'Number',
  valueType: 'number',
  fields: [
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
  advancedSettings: []
}

export default { id: 'number', config, prompt: PromptNumber }
