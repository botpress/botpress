import { ExtractionResult, IO, Prompt, PromptConfig, ValidationResult } from 'botpress/sdk'
import lang from 'common/lang'

import common from './common'

class PromptString implements Prompt {
  private _maxLength: number | undefined
  private _needValidation: boolean

  constructor(config) {
    this._maxLength = config.maxLength
    this._needValidation = config.needValidation
  }

  extraction(event: IO.IncomingEvent): ExtractionResult[] {
    if (event.state?.context) {
      const { currentFlow, currentNode } = event.state.context

      const location = `${currentFlow?.replace('.flow.json', '')}/${currentNode}`.toLowerCase()
      const entities = event.nlu?.entities?.filter(x => x.type.includes(location)) ?? []

      if (entities.length) {
        return entities.map(entity => ({
          value: entity.data.value,
          confidence: entity.meta.confidence
        }))
      }
    }

    const text = event.payload.text

    // Do not extract on the first turn
    if (!event.state?.context.activePrompt?.turn || !text || this._needValidation) {
      return []
    }

    return [{ value: text, confidence: 1 }]
  }

  validate(value): ValidationResult {
    if (value == undefined) {
      return { valid: false, message: lang.tr('module.builtin.prompt.invalid') }
    }

    if (this._maxLength != undefined && value.length > this._maxLength) {
      return { valid: false, message: lang.tr('module.builtin.prompt.string.tooLong', { maxLength: this._maxLength }) }
    }

    return { valid: true }
  }
}

const config: PromptConfig = {
  type: 'string',
  label: 'String',
  valueType: 'string',
  icon: 'font',
  fields: common.fields,
  noConfirmation: true,
  advancedSettings: [
    {
      type: 'number',
      key: 'maxLength',
      min: 0,
      max: 10000,
      label: 'module.builtin.maxLength'
    },
    ...common.advancedSettings
  ],
  validation: [
    {
      key: 'needValidation',
      type: 'checkbox',
      label: 'Must match at least one validation'
    },

    {
      group: {
        addLabel: 'studio.library.addEnum',
        defaultItem: true,
        contextMenu: [
          {
            type: 'delete',
            label: 'Delete'
          }
        ]
      },
      type: 'group',
      key: 'enumerations',
      label: 'Enumeration',
      fields: [
        {
          key: 'occurrences',
          type: 'tag-input',
          label: 'values',
          placeholder: 'studio.library.addSynonyms',
          emptyPlaceholder: 'studio.library.writeAsManyHintsAsPossible',
          group: {
            minimum: 1,
            addLabel: 'studio.library.addValueAlternative'
          }
          // validation: { validator: isDuplicate }
        },
        {
          key: 'fuzzy',
          type: 'select',
          label: 'variable.textMatchingTolerance',
          defaultValue: 0.8,
          options: [
            { label: 'exactMatch', value: 1 },
            { label: 'moderate', value: 0.8 },
            { label: 'loose', value: 0.65 }
          ]
        }
      ]
    },

    {
      group: {
        addLabel: 'studio.library.addPattern',
        defaultItem: true,
        contextMenu: [
          {
            type: 'delete',
            label: 'delete'
          }
        ]
      },
      type: 'group',
      key: 'patterns',
      label: 'pattern',
      fields: [
        {
          key: 'pattern',
          type: 'text',
          required: true,
          placeholder: 'studio.library.regexPatternPlaceholder',
          label: 'module.builtin.regexPattern',
          moreInfo: {
            label: 'learnMore',
            url: 'https://regex101.com/'
          }
          // TODO add combo box to select from predefined patterns or custom
        },
        {
          key: 'examples',
          type: 'text_array',
          label: 'examples',
          placeholder: 'studio.library.examplePlaceholder',
          validation: {
            regex: { pattern: 'pattern', matchCase: 'matchCase' }
          },
          group: {
            minimum: 1,
            addLabel: 'studio.library.addExample',
            addLabelTooltip: 'studio.library.addExampleTooltip'
          }
        },
        {
          key: 'matchCase',
          type: 'checkbox',
          label: 'Match case'
        },
        {
          key: 'sensitive',
          type: 'checkbox',
          label: 'Value contains sensitive data'
        }
      ]
    }

    // TODO: not implemented yet
    // {
    //   group: {
    //     addLabel: 'Add Custom Code',
    //     defaultItem: true,
    //     contextMenu: [
    //       {
    //         type: 'delete',
    //         label: 'Delete Custom Code '
    //       }
    //     ]
    //   },
    //   type: 'group',
    //   key: 'customCode',
    //   label: 'Custom Code',
    //   fields: [
    //     {
    //       key: 'customCode',
    //       type: 'text',
    //       required: true,
    //       placeholder: 'Code',
    //       label: 'Code'
    //     }
    //   ]
    // }
  ]
}

export default { id: 'string', config, prompt: PromptString }
