import last from 'lodash/last'
import takeRight from 'lodash/takeRight'
import { action, observable } from 'mobx'

import constants from '../core/constants'

import { RootStore } from '.'

const HISTORY_UP = 'ArrowUp'
const SENT_HISTORY_KEY = `bp::${window.BOT_ID}::sentHistory`

class ComposerStore {
  private rootStore: RootStore

  @observable
  public message: string = ''

  @observable
  private _sentHistory: string[] = []

  @observable
  private _sentHistoryIndex: number = 0

  constructor(rootStore) {
    this.rootStore = rootStore

    if (window.BP_STORAGE) {
      this._sentHistory = JSON.parse(window.BP_STORAGE.get(SENT_HISTORY_KEY) || '[]')
    }
  }

  @action.bound
  updateMessage(msg: string) {
    this.message = msg
  }

  @action.bound
  addMessageToHistory(text: string) {
    if (last(this._sentHistory) !== text) {
      this._sentHistory.push(text)
      this._sentHistoryIndex = 0

      if (window.BP_STORAGE && this.rootStore.config.enablePersistHistory) {
        window.BP_STORAGE.set(
          SENT_HISTORY_KEY,
          JSON.stringify(takeRight(this._sentHistory, constants.SENT_HISTORY_SIZE))
        )
      }
    }
  }

  @action.bound
  recallHistory(direction: string) {
    if (!this._sentHistory.length) {
      return
    }

    let newIndex = direction === HISTORY_UP ? this._sentHistoryIndex - 1 : this._sentHistoryIndex + 1

    if (newIndex < 0) {
      newIndex = this._sentHistory.length - 1
    } else if (newIndex >= this._sentHistory.length) {
      newIndex = 0
    }

    this.updateMessage(this._sentHistory[newIndex])
    this._sentHistoryIndex = newIndex
  }
}

export default ComposerStore
