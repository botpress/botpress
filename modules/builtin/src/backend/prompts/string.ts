import { IO, Prompt, PromptConfig } from 'botpress/sdk'
import { max, min } from 'lodash'
import moment from 'moment'

class PromptString implements Prompt {
  constructor() {}

  extraction(event: IO.IncomingEvent): { value: string; confidence: number } | undefined {
    const text = event.payload.text
    if (text) {
      return {
        value: text,
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
}

const config: PromptConfig = {
  type: 'string',
  label: 'String',
  valueType: 'string',
  params: {}
}

export default { id: 'string', config, prompt: PromptString }
