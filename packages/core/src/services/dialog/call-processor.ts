import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import { Logger } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'

@injectable()
export class CallProcessor {
  constructor(@inject(TYPES.Logger) private logger: Logger) {}

  processCall(call, state, event, context) {
    console.log('Ima call XD ', call)

    if (call.startsWith('say')) {
      try {
        this.dispatchOutput(call, state, event, context)
      } catch (err) {
        this.logger.error(err)
        return state
      }
    } else {
      this.invokeAction(call, state, event, context)
    }
  }

  dispatchOutput(call, state, event, context) {
    const chunks = call.split(' ')
    const params = _.slice(chunks, 2).join(' ')

    if (chunks.length < 2) {
      throw new Error('Invalid text instruction. Expected an instruction along "say #text Something"')
    }

    const output = {
      type: chunks[1],
      value: params
    }

    const msg = String(output.type + (output.value || '')).substr(0, 20)
    console.log(msg)

    // return Promise.map(this.outputProcessors, processor =>
    //   processor.send({ message: output, state: state, originalEvent: event, flowContext: context })
    // )
  }

  invokeAction(call, state, event, context): any {
    throw new Error('Method not implemented.')
  }
}
