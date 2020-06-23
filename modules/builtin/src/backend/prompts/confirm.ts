import { IO, Prompt, PromptConfig } from 'botpress/sdk'
import * as sdk from 'botpress/sdk'
import { extractEventCommonArgs } from 'common/action'
import { createMultiLangObject } from 'common/prompts'
import _ from 'lodash'
import yn from 'yn'

import commonFields from './common'

class PromptConfirm implements Prompt {
  private _question: { [lang: string]: string }

  constructor({ question }) {
    this._question = question
  }

  extraction(event: IO.IncomingEvent) {
    const yesOrNo = yn(event.payload?.payload || event.preview)
    if (yesOrNo !== undefined) {
      return { value: yesOrNo, confidence: 1 }
    }

    const topConfirmation = _.chain(event.ndu.triggers)
      .values()
      .filter(val => val.trigger.name?.startsWith('prompt_'))
      .map(x => ({ name: x.trigger.name, confidence: x.result[Object.keys(x.result)[0]] }))
      .orderBy(x => x.confidence, 'desc')
      .first()
      .value()

    return { value: topConfirmation?.name === 'prompt_yes', confidence: topConfirmation?.confidence ?? 0 }
  }

  async validate(value) {
    return { valid: value === true || value === false, message: 'Invalid' }
  }

  customPrompt = async (event: IO.OutgoingEvent, incomingEvent: IO.IncomingEvent, bp: typeof sdk) => {
    const element = createMultiLangObject(this._question, 'text', {
      choices: [
        { title: 'Yes', value: 'yes' },
        { title: 'No', value: 'no' }
      ]
    })

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
  minConfidence: 0.3,
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
