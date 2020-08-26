import axios from 'axios'
import { NLU } from 'botpress/sdk'
import EventBus from '~/util/EventBus'

type TrainingStatusListener = {
  name: string
  cb: (session: NLU.TrainingSession, fromWebSocket: boolean) => void
  error: (err: Error) => void
}

class TrainingStatusObserver {
  private listeners: TrainingStatusListener[] = []
  private pollingHandle: number | undefined
  private session: NLU.TrainingSession
  private language: string

  constructor() {}

  setLanguage(language: string) {
    this.language = language
  }

  dispose() {
    this.stopPolling()
  }

  addListener(listener: TrainingStatusListener) {
    if (!this.listeners.length) {
      this.startPolling()
    }
    this.listeners.push(listener)
  }

  removeListener(listener: TrainingStatusListener) {
    const idx = this.listeners.findIndex(l => l.name === listener.name)
    if (idx > -1) {
      this.listeners.splice(idx, 1)
    }

    if (!this.listeners.length) {
      this.stopPolling()
    }
  }

  private startPolling() {
    EventBus.default.on('statusbar.event', this.onStatusBarEvent)
    this.pollingHandle = window.setInterval(
      () => this.session?.status !== 'training' && this.fetchTrainingStatus(),
      1500
    ) // for training-needed
  }

  private stopPolling() {
    clearInterval(this.pollingHandle)
    EventBus.default.off('statusbar.event', this.onStatusBarEvent)
  }

  private onStatusBarEvent = async event => {
    const isNLUEvent = event.botId === window.BOT_ID && event.trainSession?.language === this.language
    if (isNLUEvent) {
      this.notifyListeners(event.trainSession as NLU.TrainingSession, false)
    }
  }

  private notifyListeners(ts: NLU.TrainingSession, fromWebSocket: boolean) {
    this.session = ts
    for (const listener of this.listeners) {
      listener.cb(ts, fromWebSocket)
    }
  }

  private notifyError(err: Error) {
    for (const listener of this.listeners) {
      listener.error(err)
    }
  }

  fetchTrainingStatus = async () => {
    try {
      const { data: session } = await axios.get(`${window.BOT_API_PATH}/mod/nlu/training/${this.language}`)
      this.notifyListeners(session, true)
    } catch (err) {
      this.notifyError(err)
    }
  }
}
export default new TrainingStatusObserver()
