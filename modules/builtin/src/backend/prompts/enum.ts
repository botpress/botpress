import { IO, Prompt, PromptConfig } from 'botpress/sdk'

class PromptEnum implements Prompt {
  private _entity: string

  constructor({ entity }) {
    this._entity = entity
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
}

const config: PromptConfig = {
  type: 'enum',
  label: 'Enum',
  valueType: 'string',
  params: {
    entity: { label: 'Entity', type: 'string' }
  }
}

export default { id: 'enum', config, prompt: PromptEnum }
