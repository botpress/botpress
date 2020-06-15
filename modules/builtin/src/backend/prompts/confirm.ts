import { IO, Prompt, PromptConfig } from 'botpress/sdk'
import * as sdk from 'botpress/sdk'
import { extractEventCommonArgs } from 'common/action'
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

  // Customize the prompt event that is sent through the specific channels.
  customPrompt = async (event: IO.OutgoingEvent, incomingEvent, bp: typeof sdk) => {
    if (event.channel === 'web') {
      const payloads = await bp.cms.renderElement(
        '@builtin_text',
        extractEventCommonArgs(incomingEvent, this._question),
        event
      )
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
  params: {
    question: { label: 'Question to ask to user', type: 'string' }
  }
}

export default { id: 'confirm', config, prompt: PromptConfirm }
