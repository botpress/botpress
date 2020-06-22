import axios from 'axios'
import { ExtractionResult, IO, Prompt, PromptConfig, ValidationResult } from 'botpress/sdk'
import * as sdk from 'botpress/sdk'

import commonFields from './common'

class PromptEnum implements Prompt {
  private _entity: string
  private _question: string
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
      return { valid: false, message: 'Provided value is invalid' }
    }

    return { valid: true }
  }

  customPrompt = async (event: IO.OutgoingEvent, incomingEvent, bp: typeof sdk) => {
    if (this._useDropdown && event.channel === 'web') {
      const {
        data: { occurrences }
      } = await axios.get(
        `mod/nlu/entities/${this._entity}`,
        await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
      )

      const replies = occurrences.map(x => {
        return { label: x.name, payload: x.name }
      })

      event.type = 'custom'
      if (replies.length <= 3) {
        const payloads = await bp.cms.renderElement('builtin_text', { type: 'text', text: this._question }, event)
        const withoutTyping = payloads.filter((x: any) => x.type !== 'typing')

        event.payload = {
          type: 'custom',
          module: 'channel-web',
          component: 'QuickReplies',
          quick_replies: replies,
          wrapped: withoutTyping[0]
        }
      } else {
        event.payload = {
          type: 'custom',
          module: 'extensions',
          message: this._question,
          component: 'Dropdown',
          options: replies
        }
      }
    }
  }
}

const config: PromptConfig = {
  type: 'enum',
  label: 'Enum',
  valueType: 'string',
  fields: [
    ...commonFields(),
    {
      type: 'text',
      key: 'entity',
      label: 'module.builtin.entity'
    },
    {
      type: 'text',
      key: 'question',
      label: 'module.builtin.question'
    },
    {
      type: 'checkbox',
      key: 'useDropdown',
      label: 'module.builtin.useDropdown'
    }
  ],
  advancedSettings: []
}

export default { id: 'enum', config, prompt: PromptEnum }
