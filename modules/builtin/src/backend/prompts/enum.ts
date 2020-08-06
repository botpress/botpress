import { ExtractionResult, IO, Prompt, PromptConfig, ValidationResult } from 'botpress/sdk'
import lang from 'common/lang'

import common from './common'

class PromptEnum implements Prompt {
  private _enumType: string

  constructor({ enumType }) {
    this._enumType = enumType
  }

  extraction(event: IO.IncomingEvent): ExtractionResult[] {
    const entities = event.nlu?.entities?.filter(x => x.type === `custom.list.${this._enumType}`) ?? []
    return entities.map(entity => ({
      value: entity.data.value,
      confidence: entity.meta.confidence
    }))
  }

  validate(value): ValidationResult {
    if (value == undefined) {
      return { valid: false, message: lang.tr('module.builtin.prompt.invalid') }
    }

    return { valid: true }
  }
}

const config: PromptConfig = {
  type: 'enum',
  label: 'Enum',
  valueType: 'string',
  fields: [
    ...common.fields,
    {
      type: 'select',
      key: 'enumType',
      required: true,
      dynamicOptions: {
        endpoint: 'BOT_API_PATH/nlu/entities?ignoreSystem=true',
        valueField: 'id',
        labelField: 'name'
      },
      label: 'module.builtin.enumType'
    }
  ],
  advancedSettings: common.advancedSettings
}

export default { id: 'enum', config, prompt: PromptEnum }
