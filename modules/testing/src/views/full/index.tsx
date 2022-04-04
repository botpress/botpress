import { Icon, Intent } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import { AxiosStatic } from 'axios'
import { confirmDialog, toast } from 'botpress/shared'
import _ from 'lodash'
import React from 'react'
import { Grid, Row, Col, Button } from 'react-bootstrap'

import { Preview, Scenario, Status } from '../../backend/typings'
import NoScenarios from './NoScenarios'
import ScenarioComponent from './Scenario'
import ScenarioRecorder from './ScenarioRecorder'
import style from './style.scss'

const WEBCHAT_READY_TIMEOUT = 10000

interface Props {
  bp: {
    axios: AxiosStatic
  }
  isRecording: boolean
  cancel: () => void
  onSave: () => void
}

interface State {
  scenarios: (Scenario & Status)[]
  isRunning: boolean
  isRecording: boolean
  recordView: boolean
  previews: {}
}

export default class Testing extends React.Component<Props, State> {
  private interval: NodeJS.Timeout

  state: State = {
    scenarios: [],
    isRunning: false,
    isRecording: false,
    recordView: false,
    previews: {}
  }

  componentDidMount() {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.init()
  }

  init = async () => {
    await this.loadScenarios()
    await this.loadPreviews()
  }

  resetWebchatSession = async () => {
    // Fetches the emulator content window
    const win: Window = document.querySelector('#bp-widget')?.['contentWindow']
    if (win) {
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject('Timeout reached while waiting for the webchat to be ready'), WEBCHAT_READY_TIMEOUT)
      })

      // Wait for the webchat to be ready
      const wait = new Promise(resolve => {
        window.addEventListener('message', event => {
          if (event.data && event.data.name === 'webchatReady') {
            resolve()
          }
        })
      })

      // Sends a request to the emulator to create a new session (new user, new socket connection, and new conversation)
      win.postMessage({ action: 'new-session' }, '*')

      await Promise.race([timeout, wait])
    }
  }

  startRecording = async () => {
    try {
      await this.resetWebchatSession()

      const chatUserId = window.BP_STORAGE.get('bp/socket/studio/user') || window.__BP_VISITOR_ID
      await this.props.bp.axios.post('/mod/testing/startRecording', { userId: chatUserId })

      window.botpressWebChat.sendEvent({ type: 'show' })

      this.setState({ isRecording: true })
    } catch (err) {
      toast.failure(`An error occurred while trying to record a new scenario: ${err}`, undefined, { timeout: 'medium' })
    }
  }

  loadScenarios = async () => {
    const { data } = await this.props.bp.axios.get<{ scenarios: Scenario[]; status: { running: boolean } }>(
      '/mod/testing/scenarios'
    )
    const newState: Pick<State, 'scenarios' | 'isRunning'> = {
      scenarios: data.scenarios,
      isRunning: this.state.isRunning
    }

    if (this.interval && data.status && !data.status.running) {
      newState.isRunning = false

      clearInterval(this.interval)
      this.interval = undefined
    }

    this.setState(newState)
  }

  deleteAllScenarios = async () => {
    const shouldDelete = await confirmDialog('Are you sure you want to delete all of the scenarios?', {
      acceptLabel: 'Delete all'
    })

    if (shouldDelete) {
      await this.props.bp.axios.post('/mod/testing/deleteAllScenarios')
      await this.loadScenarios()
    }
  }

  loadPreviews = async () => {
    const { scenarios } = this.state
    const elementPreviews = await this.getElementPreviews(scenarios)
    const qnaPreviews = this.getQnaPreviews(scenarios)

    this.setState({ previews: { ...elementPreviews, ...qnaPreviews } })
  }

  longPoll = async () => {
    if (!this.interval) {
      await this.loadScenarios()
      this.interval = setInterval(this.loadScenarios, 1500)
    }
  }

  runAllScenarios = async () => {
    if (this.state.isRunning) {
      return
    }

    this.setState({ isRunning: true })

    await this.props.bp.axios.post('/mod/testing/runAll')

    await this.longPoll()
  }

  runSingleScenario = async (scenario: Scenario) => {
    if (this.state.isRunning) {
      return
    }

    this.setState({ isRunning: true })

    await this.props.bp.axios.post('/mod/testing/run', { scenario })

    await this.longPoll()
  }

  deleteSingleScenario = async (scenario: Scenario) => {
    await this.props.bp.axios.post('/mod/testing/deleteScenario', { name: scenario.name })

    await this.loadScenarios()
  }

  getQnaPreviews(scenarios: Scenario[]): { [id: string]: string } {
    return _.chain(scenarios)
      .flatMapDeep(scenario => scenario.steps.map(interaction => interaction.botReplies))
      .filter(reply => _.isObject(reply.botResponse) && reply.replySource.startsWith('qna'))
      .reduce((acc, next) => {
        if (typeof next.botResponse !== 'string') {
          acc[next.replySource] = next.botResponse.text
        }

        return acc
      }, {})
      .value()
  }

  getElementPreviews = async (scenarios: Scenario[]): Promise<{ [id: string]: string }> => {
    const elementIds = _.chain(scenarios)
      .flatMapDeep(scenario => scenario.steps.map(interaction => interaction.botReplies.map(rep => rep.botResponse)))
      .filter(_.isString)
      .uniq()
      .value()

    const { data } = await this.props.bp.axios.post<Preview[]>('/mod/testing/fetchPreviews', { elementIds })

    return data.reduce((acc, next) => {
      acc[next.id] = next.preview
      return acc
    }, {})
  }

  toggleRecordView = () => {
    this.setState({ recordView: !this.state.recordView })
  }

  get hasScenarios() {
    return this.state.scenarios.length > 0
  }

  renderSummary = () => {
    if (this.state.isRecording) {
      return
    }

    const total = this.state.scenarios.length
    const failCount = this.state.scenarios.filter(s => s.status === 'fail').length
    const passCount = this.state.scenarios.filter(s => s.status === 'pass').length // we don't do a simple subtraction in case some are pending

    return (
      <div className={style.summary}>
        <strong>Total: {total}</strong>
        {!!failCount && <strong className="text-danger">Failed: {failCount}</strong>}
        {!!passCount && <strong className="text-success">Passed: {passCount}</strong>}
      </div>
    )
  }

  handleScenarioSaved = async () => {
    this.setState({ isRecording: false })
    await this.init()
  }

  render() {
    return (
      <div className={style.workspace}>
        <Grid>
          <Row>
            <Col md={10} mdOffset={1}>
              <Row>
                {/* TODO extract this in header component ? */}
                <h2>Scenarios</h2>
                {this.renderSummary()}
              </Row>
              {!this.state.isRecording && (
                <Row className={style['actions-container']}>
                  <Button bsSize="small" bsStyle="danger" className={'btn-danger'} onClick={this.deleteAllScenarios}>
                    <Icon icon={IconNames.TRASH} /> Delete all
                  </Button>
                  <Button bsSize="small" onClick={this.runAllScenarios} disabled={this.state.isRunning}>
                    <Icon icon={IconNames.PLAY} intent={Intent.SUCCESS} /> Run All
                  </Button>
                  <Button bsSize="small" onClick={this.startRecording}>
                    <Icon icon={IconNames.RECORD} /> Record new
                  </Button>
                </Row>
              )}
            </Col>
          </Row>
          <Row>
            <Col md={10} mdOffset={1}>
              {this.state.isRecording && (
                <ScenarioRecorder
                  bp={this.props.bp}
                  onSave={this.handleScenarioSaved}
                  isRecording={this.state.isRecording}
                  cancel={() => this.setState({ isRecording: false })}
                />
              )}
              {!this.state.isRecording && !this.hasScenarios && <NoScenarios onRecordClicked={this.startRecording} />}
              {!this.state.isRecording && this.hasScenarios && (
                <div>
                  {this.state.scenarios.map(s => (
                    <ScenarioComponent
                      key={s.name}
                      scenario={s}
                      run={this.runSingleScenario.bind(this, s)}
                      delete={this.deleteSingleScenario.bind(this, s)}
                      previews={this.state.previews}
                      isRunning={this.state.isRunning}
                    />
                  ))}
                </div>
              )}
            </Col>
          </Row>
        </Grid>
      </div>
    )
  }
}
