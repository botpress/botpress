import axios from 'axios'
import { NLU } from 'botpress/sdk'
import EventBus from '~/util/EventBus'

export class TrainingStatusService {
  private pollingHandle: number | undefined
  private session: NLU.TrainingSession

  constructor(private language: string, private listener: (session: NLU.TrainingSession) => void) {}

  public fetchTrainingStatus = async () => {
    try {
      const { data: session } = await axios.get(`${window.BOT_API_PATH}/mod/nlu/training/${this.language}`)
      this.listener(session)
    } catch (err) {}
  }

  public startPolling() {
    EventBus.default.on('statusbar.event', this.onStatusBarEvent)
    this.pollingHandle = window.setInterval(
      () => this.session?.status !== 'training' && this.fetchTrainingStatus(),
      1500
    ) // for training-needed
  }

  public stopPolling() {
    clearInterval(this.pollingHandle)
    EventBus.default.off('statusbar.event', this.onStatusBarEvent)
  }

  private onStatusBarEvent = async event => {
    const isNLUEvent = event.botId === window.BOT_ID && event.trainSession?.language === this.language
    if (isNLUEvent) {
      this.listener(event.trainSession)
    }
  }
}
