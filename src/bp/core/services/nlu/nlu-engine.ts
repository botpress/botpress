import { IO } from 'botpress/sdk'
import { injectable } from 'inversify'

@injectable()
export class NLUEngine {
  constructor() {}

  public processEvent(event: IO.Event): Promise<IO.Event> {
    return new Promise((resolve, reject) => {
      try {
        process.BOTPRESS_EVENTS.emit('NLU_PREDICT_REQUEST', event)

        const listener = (eventId: string) => {
          if (event.id === eventId) {
            process.BOTPRESS_EVENTS.removeListener('NLU_PREDICT_RESPONSE', listener)
            resolve(event)
          }
        }

        process.BOTPRESS_EVENTS.on('NLU_PREDICT_RESPONSE', listener)
      } catch (err) {
        reject(err)
      }
    })
  }
}
