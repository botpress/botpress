import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import nanoid from 'nanoid'
import path from 'path'

import { Recorder } from './recorder'
import { SenarioRunner } from './runner'
import { Scenario } from './typings'

const SCENARIO_FOLDER = 'scenarios'

export class Testing {
  private bp: typeof sdk
  private botId: string
  private _recorder: Recorder
  private _runner: SenarioRunner
  private _scenarios: Scenario[]
  private _interval: any

  constructor(bp: typeof sdk, botId: string) {
    this.bp = bp
    this.botId = botId
    this._recorder = new Recorder()
    this._runner = new SenarioRunner(bp)
  }

  async startRecording(chatUserId) {
    await this._ensureHooksEnabled()
    this._recorder.startRecording(chatUserId)
  }

  endRecording() {
    return this._recorder.stopRecording()
  }

  getStatus() {
    return {
      recording: this._recorder.isRecording(),
      running: this._runner.isRunning()
    }
  }

  async getScenarios() {
    if (!this._scenarios) {
      await this._loadScenarios()
    }

    return this._scenarios.map(({ name, steps }) => {
      return {
        name,
        steps,
        ...this._runner.getStatus(name)
      }
    })
  }

  processIncomingEvent(event: sdk.IO.IncomingEvent): sdk.IO.EventState | void {
    this._recorder.processIncoming(event)
    return this._runner.processIncoming(event)
  }

  processCompletedEvent(event: sdk.IO.IncomingEvent): void {
    this._recorder.processCompleted(event)
    this._runner.processCompleted(event)
  }

  async saveScenario(name, scenario) {
    await this.bp.ghost
      .forBot(this.botId)
      .upsertFile(SCENARIO_FOLDER, name + '.json', JSON.stringify(scenario, undefined, 2))

    await this._loadScenarios()
  }

  private _executeScenario(scenario: Scenario) {
    const eventDestination: sdk.IO.EventDestination = {
      channel: 'web',
      botId: this.botId,
      threadId: undefined,
      target: `test_${nanoid()}`
    }

    this._runner.runScenario({ ...scenario }, eventDestination)
  }

  async executeSingle(liteScenario: Partial<Scenario>) {
    await this._ensureHooksEnabled()
    this._runner.startReplay()

    // TODO perform scenario validation here
    const scenario = await this.bp.ghost
      .forBot(this.botId)
      .readFileAsObject(SCENARIO_FOLDER, liteScenario.name + '.json')

    this._executeScenario({ ...liteScenario, ...scenario })
  }

  async executeAll() {
    await this._ensureHooksEnabled()
    const scenarios = await this._loadScenarios()
    this._runner.startReplay()

    scenarios.forEach(scenario => {
      this._executeScenario(scenario)
    })
  }

  private async _ensureHooksEnabled() {
    if (!this._interval) {
      this._interval = setInterval(this._waitTestCompletion.bind(this), 2000)
    }

    await this.bp.experimental.enableHook('00_recorder', 'before_incoming_middleware', 'testing')
    await this.bp.experimental.enableHook('00_recorder', 'after_event_processed', 'testing')
  }

  private async _waitTestCompletion() {
    if (!this._runner.isRunning() && !this._recorder.isRecording()) {
      await this.bp.experimental.disableHook('00_recorder', 'before_incoming_middleware', 'testing')
      await this.bp.experimental.disableHook('00_recorder', 'after_event_processed', 'testing')

      clearInterval(this._interval)
      this._interval = undefined
    }
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
