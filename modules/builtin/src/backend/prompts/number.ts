import { IO, Prompt, PromptConfig } from 'botpress/sdk'
import { max, min } from 'lodash'
import moment from 'moment'

class PromptNumber implements Prompt {
  private _min: boolean
  private _max: boolean

  constructor({ min, max }) {
    this._min = min
    this._max = max
  }

  extraction(event: IO.IncomingEvent): { value: number; confidence: number } | undefined {
    const entity = event.nlu?.entities?.find(x => x.type === 'system.number')
    if (entity) {
      return {
        value: entity.data.value,
        confidence: entity.meta.confidence
      }
    }
  }

  async validate(value): Promise<{ valid: boolean; message?: string }> {
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
  params: {
    min: { label: 'Minimum', type: 'number' },
    max: { label: 'Maximum', type: 'number' }
  }
}

export default { id: 'number', config, prompt: PromptNumber }
