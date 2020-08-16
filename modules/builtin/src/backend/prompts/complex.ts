import { ExtractionResult, IO, Prompt, PromptConfig, ValidationResult } from 'botpress/sdk'
import lang from 'common/lang'

import common from './common'

class PromptComplex implements Prompt {
  private _subType: string

  constructor({ subType }) {
    this._subType = subType
  }

  extraction(event: IO.IncomingEvent): ExtractionResult[] {
    const entities = event.nlu?.entities?.filter(x => x.type === `custom.complex.${this._subType}`) ?? []
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
  type: 'complex',
  label: 'Complex',
  valueType: 'string',
  icon: 'list-columns',
  fields: [
    ...common.fields,
    {
      type: 'variable',
      key: 'output',
      required: true,
      label: 'module.builtin.setValueTo',
      placeholder: 'module.builtin.setValueToPlaceholder',
      variableTypes: ['complex'],
      defaultVariableType: 'complex'
    },
    {
      type: 'hidden',
      key: 'subType',
      label: 'subType'
    }
  ],
  advancedSettings: common.advancedSettings
}

export default { id: 'complex', config, prompt: PromptComplex }
