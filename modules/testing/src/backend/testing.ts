import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import nanoid from 'nanoid'
import path from 'path'

import { Recorder } from './recorder'
import { Replayer } from './replayer'
import { Scenario } from './typings'

const SCENARIO_FOLDER = 'scenarios'

export class Testing {
  private bp: typeof sdk
  private botId: string
  private _recorder: Recorder
  private _replayer: Replayer
  private _scenarios: Scenario[]

  constructor(bp: typeof sdk, botId: string) {
    this.bp = bp
    this.botId = botId
    this._recorder = new Recorder()
    this._replayer = new Replayer(bp)
  }

  startRecording(chatUserId) {
    this._recorder.startRecording(chatUserId)
  }

  endRecording() {
    return this._recorder.stopRecording()
  }

  getStatus() {
    return {
      recording: this._recorder.isRecording(),
      replaying: this._replayer.isReplaying()
    }
  }

  async getScenarios() {
    if (!this._scenarios) {
      await this._loadScenarios()
    }

    return this._scenarios.map(({ name, steps }) => {
      return {
        name,
        stepsCount: steps.length,
        ...this._replayer.getStatus(name)
      }
    })
  }

  processIncomingEvent(event: sdk.IO.IncomingEvent): sdk.IO.EventState | void {
    this._recorder.processIncoming(event)
    return this._replayer.processIncoming(event)
  }

  processCompletedEvent(event: sdk.IO.IncomingEvent): void {
    this._recorder.processCompleted(event)
    this._replayer.processCompleted(event)
  }

  async saveScenario(name, scenario) {
    await this.bp.ghost
      .forBot(this.botId)
      .upsertFile(SCENARIO_FOLDER, name + '.json', JSON.stringify(scenario, undefined, 2))

    await this._loadScenarios()
  }

  async executeAll() {
    const scenarios = await this._loadScenarios()
    this._replayer.startReplay()

    scenarios.forEach(scenario => {
      const eventDestination: sdk.IO.EventDestination = {
        channel: 'web',
        botId: this.botId,
        threadId: undefined,
        target: `test_${nanoid()}`
      }

      this._replayer.runScenario({ ...scenario }, eventDestination)
    })
  }

  private async _loadScenarios() {
    const files = await this.bp.ghost.forBot(this.botId).directoryListing(SCENARIO_FOLDER, '*.json')

    this._scenarios = await Promise.map(files, async file => {
      const name = path.basename(file as string, '.json')
      const scenarioSteps = (await this.bp.ghost
        .forBot(this.botId)
        .readFileAsObject(SCENARIO_FOLDER, file)) as Scenario[]

      return { name, ...scenarioSteps }
    })

    return this._scenarios
  }
}
