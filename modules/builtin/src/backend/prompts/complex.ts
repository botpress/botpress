import { ExtractionResult, IO, NLU, Prompt, PromptConfig, ValidationResult } from 'botpress/sdk'
import lang from 'common/lang'

import common from './common'

class PromptComplex implements Prompt {
  private _subType: string
  private _getCustomTypes: () => NLU.EntityDefinition[]

  constructor({ subType, getCustomTypes }) {
    this._subType = subType
    this._getCustomTypes = getCustomTypes
  }

  extraction(event: IO.IncomingEvent): ExtractionResult[] {
    const varDefinition = this._getCustomTypes().find(x => x.id === this._subType)
    const subtypes = [
      varDefinition.id,
      ...(varDefinition.list_entities ?? []),
      ...(varDefinition.pattern_entities ?? [])
    ]
    const entities = event.nlu?.entities?.filter(x => subtypes.includes(x.name)) ?? []
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
      type: 'hidden',
      key: 'subType',
      label: 'subType'
    }
  ],
  advancedSettings: common.advancedSettings
}

export default { id: 'complex', config, prompt: PromptComplex }
