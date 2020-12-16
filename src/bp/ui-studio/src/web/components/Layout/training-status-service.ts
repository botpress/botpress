import axios from 'axios'
import { NLU } from 'botpress/sdk'
import EventBus from '~/util/EventBus'

export class TrainingStatusService {
  constructor(private language: string, private callback: (session: NLU.TrainingSession) => void) {}

  public fetchTrainingStatus = async () => {
    try {
      const { data: session } = await axios.get(`${window.BOT_API_PATH}/mod/nlu/training/${this.language}`)
      this.callback(session)
    } catch (err) {}
  }

  public listen() {
    EventBus.default.on('statusbar.event', this._onStatusBarEvent)
  }

  public stopListening() {
    EventBus.default.off('statusbar.event', this._onStatusBarEvent)
  }

  private _onStatusBarEvent = async event => {
    const isNLUEvent = event.botId === window.BOT_ID
    if (isNLUEvent) {
      this.callback(event.trainSession)
    }
  }
}
