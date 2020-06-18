import { ExtractionResult, IO, Prompt, PromptConfig, ValidationResult } from 'botpress/sdk'

class PromptString implements Prompt {
  private _maxLength: boolean
  private _regexPattern: string

  constructor({ maxLength, regexPattern }) {
    this._maxLength = maxLength
    this._regexPattern = regexPattern
  }

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

    if (value.length > this._maxLength) {
      return { valid: false, message: 'Text is too long' }
    }

    if (!new RegExp(this._regexPattern).test(value)) {
      return { valid: false, message: 'Value does not match regex pattern' }
    }

    return { valid: true }
  }
}

const config: PromptConfig = {
  type: 'string',
  label: 'String',
  valueType: 'string',
  params: {
    maxLength: { label: 'Maximum lenght', type: 'number' },
    regexPattern: { label: 'Regex pattern', type: 'string' }
  }
}

export default { id: 'string', config, prompt: PromptString }
