import { ExtractionResult, IO, Prompt, PromptConfig, ValidationResult } from 'botpress/sdk'

class PromptString implements Prompt {
  constructor() {}

  extraction(event: IO.IncomingEvent): ExtractionResult | undefined {
    const text = event.payload.text
    if (text) {
      return {
        value: text,
        confidence: 1
      }
    }
  }

  async validate(value): Promise<ValidationResult> {
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
