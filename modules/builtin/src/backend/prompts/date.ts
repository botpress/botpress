import { ExtractionResult, IO, Prompt, PromptConfig, ValidationResult } from 'botpress/sdk'
import lang from 'common/lang'
import moment from 'moment'

import common from './common'

class PromptDate implements Prompt {
  private _mustBePast: boolean
  private _mustBeFuture: boolean

  constructor({ mustBePast = false, mustBeFuture = false } = {}) {
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
      return { valid: false, message: lang.tr('module.builtin.prompt.invalid') }
    }

    if (!moment(value).isValid()) {
      return { valid: false, message: lang.tr('module.builtin.prompt.date.invalid') }
    }

    if (_mustBePast) {
      return { valid: moment(value).isBefore(moment()), message: lang.tr('module.builtin.prompt.date.mustBePast') }
    } else if (_mustBeFuture) {
      return { valid: moment(value).isAfter(moment()), message: lang.tr('module.builtin.prompt.date.mustBeFuture') }
    }

    return { valid: true }
  }
}

const config: PromptConfig = {
  type: 'date',
  label: 'Date',
  valueType: 'date',
  fields: [
    ...common.fields,
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
  advancedSettings: common.advancedSettings
}

export default { id: 'date', config, prompt: PromptDate }
