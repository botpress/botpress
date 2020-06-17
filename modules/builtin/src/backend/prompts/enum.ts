import axios from 'axios'
import { IO, Prompt, PromptConfig } from 'botpress/sdk'
import * as sdk from 'botpress/sdk'

class PromptEnum implements Prompt {
  private _entity: string
  private _question: string

  constructor({ entity, question }) {
    this._entity = entity
    this._question = question
  }

  extraction(event: IO.IncomingEvent): { value: string; confidence: number } | undefined {
    const entity = event.nlu?.entities?.find(x => x.type === `custom.list.${this._entity}`)
    if (entity) {
      return {
        value: entity.data.value,
        confidence: 1
      }
    }
  }

  async validate(value): Promise<{ valid: boolean; message?: string }> {
    if (value == undefined) {
      return { valid: false, message: 'Provided value is invalid' }
    }

    return { valid: true }
  }

  customPrompt = async (event: IO.OutgoingEvent, incomingEvent, bp: typeof sdk) => {
    if (event.channel === 'web') {
      const payloads = await bp.cms.renderElement('builtin_text', { type: 'text', text: this._question }, event)
      const withoutTyping = payloads.filter((x: any) => x.type !== 'typing')

      const res = await axios.get(`mod/nlu/entities/${this._entity}`, await bp.http.getAxiosConfigForBot(event.botId))
      const entity = res.data
      const replies = entity.occurrences.map(x => {
        return { label: x.name, payload: x.name }
      })

      event.type = 'custom'
      event.payload = {
        type: 'custom',
        module: 'channel-web',
        component: 'QuickReplies',
        quick_replies: replies,
        wrapped: withoutTyping[0]
      }
    }
  }
}

const config: PromptConfig = {
  type: 'enum',
  label: 'Enum',
  valueType: 'string',
  params: {
    entity: { label: 'Entity', type: 'string' },
    question: { label: 'Question', type: 'string' }
  }
}

export default { id: 'enum', config, prompt: PromptEnum }
