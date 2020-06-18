import { IO, Prompt } from 'botpress/sdk'
import * as sdk from 'botpress/sdk'
import { extractEventCommonArgs } from 'common/action'
import { PromptConfig } from 'common/typings'
import yn from 'yn'

class PromptConfirm implements Prompt {
  private _question: string

  constructor({ question }) {
    this._question = question
  }

  extraction(event: IO.IncomingEvent) {
    const yesOrNo = yn(event.payload?.payload || event.preview)

    return { value: yesOrNo, confidence: 1 }
  }

  async validate(value) {
    return { valid: value === true || value === false, message: 'Invalid' }
  }

  customPrompt = async (event: IO.OutgoingEvent, incomingEvent, bp: typeof sdk) => {
    if (event.channel === 'web') {
      let payloads

      if (typeof this._question !== 'string') {
        payloads = await bp.cms.renderElement(
          '@builtin_text',
          extractEventCommonArgs(incomingEvent, this._question),
          event
        )
      } else {
        payloads = await bp.cms.renderElement('builtin_text', { type: 'text', text: this._question }, event)
      }

      const withoutTyping = payloads.filter((x: any) => x.type !== 'typing')

      event.type = 'custom'
      event.payload = {
        type: 'custom',
        module: 'channel-web',
        component: 'QuickReplies',
        quick_replies: [
          { label: 'Yes', payload: 'yes' },
          { label: 'No', payload: 'no' }
        ],
        wrapped: withoutTyping[0]
      }
    }
  }
}

const config: PromptConfig = {
  type: 'confirm',
  label: 'Confirm',
  valueType: 'boolean',
  minConfidence: 1,
  noValidation: true,
  fields: [
    {
      type: 'text',
      key: 'question',
      label: 'module.builtin.questionToAskUser'
    }
  ],
  advancedSettings: []
}

export default { id: 'confirm', config, prompt: PromptConfirm }
