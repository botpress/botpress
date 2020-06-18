import { ExtractionResult, IO, Prompt, ValidationResult } from 'botpress/sdk'
import { PromptConfig } from 'common/typings'
import moment from 'moment'

class PromptDate implements Prompt {
  private _mustBePast: boolean
  private _mustBeFuture: boolean

  constructor({ mustBePast, mustBeFuture }) {
    this._mustBePast = mustBePast
    this._mustBeFuture = mustBeFuture
  }

  extraction(event: IO.IncomingEvent): ExtractionResult | undefined {
    const entity = event.nlu?.entities?.find(x => x.type === 'system.time')
    if (entity) {
      return {
        value: moment(entity.data.value).format('YYYY-MM-DD'),
        confidence: entity.meta.confidence
      }
    }
  }

  async validate(value): Promise<ValidationResult> {
    const { _mustBePast, _mustBeFuture } = this

    if (value == undefined) {
      return { valid: false, message: 'Provided value is invalid' }
    }

    if (!moment(value).isValid()) {
      return { valid: false, message: 'The provided date is not valid' }
    }

    if (_mustBePast && moment(value).isBefore(moment())) {
      return { valid: true }
    } else if (_mustBeFuture && moment(value).isAfter(moment())) {
      return { valid: true }
    }
    return { valid: false, message: 'Outside bounds' }
  }
}

const config: PromptConfig = {
  type: 'date',
  label: 'Date',
  valueType: 'date',
  fields: [
    {
      type: 'checkbox',
      key: 'mustBePast',
      label: 'module.builtin.mustBePast'
    },
    {
      type: 'checkbox',
      key: 'mustBeFuture',
      label: 'module.builtin.mustBeFuture'
    }
  ],
  advancedSettings: []
}

export default { id: 'date', config, prompt: PromptDate }
