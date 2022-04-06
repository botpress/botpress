import last from 'lodash/last'
import takeRight from 'lodash/takeRight'
import { action, computed, observable } from 'mobx'

import constants from '../core/constants'

import { RootStore } from '.'

const HISTORY_UP = 'ArrowUp'
const SENT_HISTORY_KEY = `bp::${window.BOT_ID}::sentHistory`

class ComposerStore {
  private rootStore: RootStore

  @observable
  public message: string = ''

  @observable
  public locked: boolean = false

  @observable
  public hidden: boolean = false

  @observable
  private _sentHistory: string[] = []

  @observable
  private _sentHistoryIndex: number = 0

  constructor(rootStore) {
    this.rootStore = rootStore

    if (window.BP_STORAGE) {
      this._sentHistory = window.BP_STORAGE.get<string[]>(SENT_HISTORY_KEY) || []
    }
  }

  @computed
  get composerPlaceholder(): string {
    return this.rootStore.config?.composerPlaceholder
  }

  @computed
  get composerMaxTextLength(): number {
    return this.rootStore.botInfo?.maxMessageLength
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

      if (this.rootStore.config.enablePersistHistory) {
        window.BP_STORAGE?.set(SENT_HISTORY_KEY, takeRight(this._sentHistory, constants.SENT_HISTORY_SIZE))
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

  @action.bound
  setLocked(locked: boolean) {
    this.locked = !!locked
  }

  @action.bound
  setHidden(hidden: boolean) {
    this.hidden = hidden
  }
}

export default ComposerStore
