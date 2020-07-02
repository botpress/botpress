import axios from 'axios'
import { ExtractionResult, IO, Prompt, PromptConfig, ValidationResult } from 'botpress/sdk'
import * as sdk from 'botpress/sdk'
import { extractEventCommonArgs } from 'common/action'
import lang from 'common/lang'
import { createMultiLangObject } from 'common/prompts'

import common from './common'

class PromptEnum implements Prompt {
  private _entity: string
  private _question: { [lang: string]: string }
  private _useDropdown: boolean

  constructor({ entity, question, useDropdown }) {
    this._entity = entity
    this._question = question
    this._useDropdown = useDropdown
  }

  extraction(event: IO.IncomingEvent): ExtractionResult | undefined {
    const entity = event.nlu?.entities?.find(x => x.type === `custom.list.${this._entity}`)
    if (entity) {
      return {
        value: entity.data.value,
        confidence: entity.meta.confidence
      }
    }
  }

  async validate(value): Promise<ValidationResult> {
    if (value == undefined) {
      return { valid: false, message: lang.tr('module.builtin.prompt.invalid') }
    }

    return { valid: true }
  }

  customPrompt = async (event: IO.OutgoingEvent, incomingEvent: IO.IncomingEvent, bp: typeof sdk): Promise<boolean> => {
    if (!this._useDropdown) {
      return false
    }

    const {
      data: { occurrences }
    } = await axios.get(
      `mod/nlu/entities/${this._entity}`,
      await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
    )

    let payloads = []
    if (occurrences.length <= 3) {
      const element = createMultiLangObject(this._question, 'text', {
        choices: occurrences.map(x => ({ title: x.name, value: x.name }))
      })

      payloads = await bp.cms.renderElement(
        '@builtin_single-choice',
        extractEventCommonArgs(incomingEvent, element),
        event
      )
    } else {
      const element = createMultiLangObject(this._question, 'message', {
        options: occurrences.map(x => ({ label: x.name, value: x.name }))
      })

      payloads = await bp.cms.renderElement('@dropdown', extractEventCommonArgs(incomingEvent, element), event)
    }

    await bp.events.replyToEvent(incomingEvent, payloads, incomingEvent.id)
    return true
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
      key: 'entity',
      dynamicOptions: {
        endpoint: 'BOT_API_PATH/mod/nlu/entities?ignoreSystem=true',
        valueField: 'id',
        labelField: 'name'
      },
      label: 'module.builtin.entity'
    },
    {
      type: 'checkbox',
      key: 'useDropdown',
      label: 'module.builtin.useDropdown'
    }
  ],
  advancedSettings: common.advancedSettings
}

export default { id: 'enum', config, prompt: PromptEnum }
