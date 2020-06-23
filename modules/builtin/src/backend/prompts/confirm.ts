import { IO, Prompt, PromptConfig } from 'botpress/sdk'
import * as sdk from 'botpress/sdk'
import { extractEventCommonArgs } from 'common/action'
import yn from 'yn'

import commonFields from './common'

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

  customPrompt = async (event: IO.OutgoingEvent, incomingEvent: IO.IncomingEvent, bp: typeof sdk) => {
    let text = this._question
    if (typeof text !== 'string') {
      text = (<any>this._question).text$en
    }

    const element = {
      en: {
        text: text,
        choices: [
          { title: 'Yes', value: 'yes' },
          { title: 'No', value: 'no' }
        ]
      }
    }

    const payloads = await bp.cms.renderElement(
      '@builtin_single-choice',
      extractEventCommonArgs(incomingEvent, element),
      event
    )

    await bp.events.replyToEvent(incomingEvent, payloads, incomingEvent.id)

    return true
  }
}

const config: PromptConfig = {
  type: 'confirm',
  label: 'Confirm',
  valueType: 'boolean',
  minConfidence: 1,
  noValidation: true,
  fields: [
    ...commonFields(),
    {
      type: 'text',
      key: 'question',
      label: 'module.builtin.questionToAskUser'
    }
  ],
  advancedSettings: []
}

export default { id: 'confirm', config, prompt: PromptConfirm }
