import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { Scenario } from './typings'
import { convertLastMessages, getMappingFromVisitor } from './utils'

export class Recorder {
  private _lastEvent?: sdk.IO.IncomingEvent
  private _scenario?: Scenario
  private _target!: string

  constructor(private bp: typeof sdk) {}

  async processIncoming(event: sdk.IO.IncomingEvent) {
    if (!this.isRecording() || this._scenario.initialState) {
      return
    }

    const target = await getMappingFromVisitor(this.bp, event.botId, this._target)
    if (target === event.target) {
      this._scenario.initialState = event.state
    }
  }

  async processCompleted(event: sdk.IO.IncomingEvent) {
    if (!this.isRecording()) {
      return
    }

    const target = await getMappingFromVisitor(this.bp, event.botId, this._target)
    if (target !== event.target) {
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

    this._target = chatUserId
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
