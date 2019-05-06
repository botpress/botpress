import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { Scenario } from './typings'
import { convertLastMessages } from './utils'

export class Recorder {
  private _lastEvent: sdk.IO.IncomingEvent
  private _scenario?: Scenario
  private _specificTarget?: string

  constructor() {}

  processIncoming(event: sdk.IO.IncomingEvent) {
    if (!this._scenario || this._scenario.initialState) {
      return
    }

    if (!this._specificTarget || this._specificTarget === event.target) {
      this._scenario.initialState = event.state
    }
  }

  processCompleted(event: sdk.IO.IncomingEvent) {
    if (!this._scenario) {
      return
    }

    if (this._specificTarget && this._specificTarget !== event.target) {
      return
    }

    const interactions = convertLastMessages(event.state.session.lastMessages, event.id)
    if (interactions) {
      this._lastEvent = event
      this._scenario.steps.push(interactions)
    }
  }

  startRecording(chatUserId: string) {
    this._lastEvent = undefined
    this._scenario = {
      initialState: undefined,
      finalState: undefined,
      steps: []
    }

    this._specificTarget = chatUserId.length > 0 && chatUserId
  }

  stopRecording(): Partial<Scenario> | void {
    if (!this._scenario || !this._lastEvent) {
      return
    }

    const finalScenario = {
      ..._.pick(this._scenario, ['steps', 'initialState']),
      finalState: this._lastEvent.state
    }

    this._scenario = undefined

    return _.omit(finalScenario, [
      'initialState.session.lastMessages',
      'initialState.context.jumpPoints',
      'initialState.context.queue',
      'finalState.session.lastMessages',
      'finalState.context.jumpPoints',
      'finalState.context.queue'
    ])
  }

  isRecording() {
    return !!this._scenario
  }
}
