import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { DialogStep, RunningScenario, Scenario, ScenarioMismatch, ScenarioStatus, State, Status } from './typings'
import { convertLastMessages } from './utils'

const SCENARIO_TIMEOUT = 3000
const CHECK_SCENARIO_TIMEOUT_INTERVAL = 5000

export class ScenarioRunner {
  private _active: RunningScenario[]
  private _status: ScenarioStatus
  private _interval: NodeJS.Timeout

  constructor(private bp: typeof sdk) {
    this._active = []
  }

  startReplay() {
    this._status = {}
    this._active = []
    this._interval = setInterval(this._checkScenarioTimeout.bind(this), CHECK_SCENARIO_TIMEOUT_INTERVAL)
  }

  processIncoming(event: sdk.IO.IncomingEvent): sdk.IO.EventState | undefined {
    if (!this._active.length) {
      return
    }

    const scenario = this._active.find(x => x.eventDestination.target === event.target)
    if (scenario && !scenario.completedSteps.length) {
      // The hook will replace the state with the one received here
      return scenario.initialState
    }
  }

  processCompleted(event: sdk.IO.IncomingEvent) {
    if (!this._active.length) {
      return
    }

    const scenario = this._active.find(x => x.eventDestination.target === event.target)
    if (!scenario) {
      return
    }

    const { name, completedSteps, steps } = scenario

    const conversation = convertLastMessages(event.state.session.lastMessages, event.id)
    if (!conversation) {
      this._failScenario(name, { reason: 'Could not extract messages for the event ' + event.id })
      return
    }

    const mismatch = this._findMismatch(steps[completedSteps.length], conversation)
    if (mismatch) {
      return this._failScenario(name, mismatch)
    } else {
      completedSteps.push(conversation)
      this._updateStatus(name, { completedSteps: completedSteps.length })
    }

    if (steps.length !== completedSteps.length) {
      scenario.lastEventTs = +new Date()
      this._sendMessage(steps[completedSteps.length].userMessage, scenario.eventDestination)
    } else {
      this._passScenario(name)
    }
  }

  runScenario(scenario: Scenario, eventDestination: sdk.IO.EventDestination) {
    const firstMessage = scenario.steps[0].userMessage
    if (!firstMessage) {
      return
    }

    this._active.push({ ...scenario, eventDestination, completedSteps: [] })
    this._sendMessage(firstMessage, eventDestination)
    this._updateStatus(scenario.name, { status: 'pending', completedSteps: 0 })
  }

  getStatus(scenarioName: string): Status | undefined {
    return this._status?.[scenarioName]
  }

  isRunning(): boolean {
    return !!this._active.length
  }

  private _findMismatch(expected: DialogStep, received: DialogStep): ScenarioMismatch | undefined {
    let mismatch = undefined

    // This shouldn't happen
    if (!expected || !received || expected.userMessage !== received.userMessage) {
      return { reason: 'Expected or received step was invalid', expected, received }
    }

    // Inside each steps, the bot may reply multiple times
    _.each(_.zip(expected.botReplies, received.botReplies), ([exp, rec], idx) => {
      // This can happen if the bot doesn't respond
      if (!exp || !rec) {
        mismatch = { reason: 'Missing an expected or received reply', expected, received, index: idx }
        return false
      }

      const sameSource = exp.replySource === rec.replySource
      const sameResponse = exp.botResponse === rec.botResponse
      const source = exp.replySource.split(' ').shift() // extracting the first part (module) for the reply

      /**
       * Different sources are definitely not what is expected
       * If QNA has the exact same source, then we don't care about the response (variations)
       * If the source is Dialog Manager, then the answer must be identical (either payload or content element id)
       */
      if (!sameSource || (source !== 'qna' && source === 'dialogManager' && !sameResponse)) {
        mismatch = { reason: 'The reply was invalid', expected, received, index: idx }
        return false
      }
    })

    return mismatch
  }

  private _checkScenarioTimeout() {
    if (!this._active.length) {
      this._interval && clearInterval(this._interval)
      return
    }

    const now = +new Date()
    const mismatch = { reason: 'The scenario timed out' }
    this._active
      .filter(s => s.lastEventTs !== undefined && now - s.lastEventTs > SCENARIO_TIMEOUT)
      .map(x => this._failScenario(x.name, mismatch))
  }

  private _passScenario(name: string) {
    this._updateStatus(name, { status: 'pass' })
    this._active = this._active.filter(x => x.name !== name)
  }

  private _failScenario(name: string, mismatch: ScenarioMismatch) {
    this._updateStatus(name, { status: 'fail', mismatch })
    this._active = this._active.filter(x => x.name !== name)
  }

  private _updateStatus(scenario: string, obj: Partial<Status>) {
    this._status[scenario] = { ...(this._status[scenario] || {}), ...obj }
  }

  private _sendMessage = (message: string, eventDestination: sdk.IO.EventDestination) => {
    const event = this.bp.IO.Event({
      ...eventDestination,
      direction: 'incoming',
      payload: { type: 'text', text: message },
      type: 'text'
    })

    this.bp.events.sendEvent(event)
  }
}
