import nth from 'lodash/nth'
import take from 'lodash/take'
import { action, observable } from 'mobx'

import constants from '../core/constants'

import { RootStore } from '.'

class ComposerStore {
  private rootStore: RootStore

  @observable
  public message: string = ''

  @observable
  private _messageHistory: string[] = []

  @observable
  private _historyPosition: number

  constructor(rootStore) {
    this.rootStore = rootStore
  }

  @action.bound
  async updateMessage(msg: string) {
    this.message = msg
  }

  @action.bound
  addMessageToHistory(message: string) {
    this._messageHistory = take([message, ...this._messageHistory], constants.HISTORY_MAX_MESSAGES)
    this._historyPosition = constants.HISTORY_STARTING_POINT
  }

  @action.bound
  recallHistory(direction: string) {
    const position = direction === constants.HISTORY_UP ? this._historyPosition + 1 : this._historyPosition - 1
    const text = nth(this._messageHistory, position)

    if (text) {
      this.updateMessage(text)
      this._historyPosition = position
    }
  }
}

export default ComposerStore
