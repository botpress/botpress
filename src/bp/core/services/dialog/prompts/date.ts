import { IO, Prompt, PromptConfig } from 'botpress/sdk'
import moment from 'moment'

class PromptDate implements Prompt {
  public static config: PromptConfig = {
    type: 'date',
    label: 'Date',
    valueType: 'date',
    params: {
      mustBePast: { label: 'The date must be in the past', type: 'boolean' },
      mustBeFuture: { label: 'The date must be in the future', type: 'boolean' }
    }
  }

  private _mustBePast: boolean
  private _mustBeFuture: boolean

  // Those are the actual values of the configured prompt on the workflow
  constructor({ mustBePast, mustBeFuture }) {
    this._mustBePast = mustBePast
    this._mustBeFuture = mustBeFuture
  }

  // This method is provided with the incoming event to extract any necessary information
  extraction(event: IO.IncomingEvent): { value: string; confidence: number } | undefined {
    const entity = event.nlu?.entities?.find(x => x.type === 'system.time')
    if (entity) {
      return {
        value: moment(entity.data.value).format('YYYY-MM-DD'),
        confidence: entity.meta.confidence
      }
    }
  }

  // Return a percentage of how confident you are that the provided value is valid (from 0 to 1)
  async validate(value): Promise<{ valid: boolean; message?: string }> {
    const { _mustBePast, _mustBeFuture } = this

    if (value == undefined) {
      return { valid: false, message: 'Provided value is invalid' }
    }

    if (!moment(value).isValid()) {
      return { valid: false, message: 'The provided date is not valid' }
    }

    if (_mustBePast && moment(value).isBefore(moment())) {
      return { valid: true }
    } else if (_mustBeFuture && moment(value).isAfter(moment())) {
      return { valid: true }
    }
    return { valid: false, message: 'Outside bounds' }
  }
}

export default PromptDate
