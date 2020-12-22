import React from 'react'
import { Grid, Row, Col, Button } from 'react-bootstrap'
import { Icon, Intent } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import style from './style.scss'
import ScenarioRecorder from './ScenarioRecorder'
import { confirmDialog } from 'botpress/shared'
import NoScenarios from './NoScenarios'
import Scenario from './Scenario'

export default class Testing extends React.Component {
  state = {
    scenarios: [],
    isRunning: false,
    isRecording: false,
    recordView: false,
    previews: {}
  }

  componentDidMount() {
    this.init()
  }

  init = async () => {
    await this.loadScenarios()
    this.loadPreviews()
  }

  startRecording = () => {
    this.setState({ isRecording: true })

    const userId = localStorage.getItem(`bp/socket/studio/user`)
    this.props.bp.axios.get('/mod/testing/startRecording/' + userId || window.__BP_VISITOR_ID)

    setTimeout(window.botpressWebChat.sendEvent({ type: 'show' }), 1500)
  }

  loadScenarios = async () => {
    const { data } = await this.props.bp.axios.get('/mod/testing/scenarios')
    let newState = { scenarios: data.scenarios }

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

  longPoll = () => {
    if (!this.interval) {
      this.loadScenarios()
      this.interval = setInterval(this.loadScenarios, 1500)
    }
  }

  runAllScenarios = async () => {
    if (this.state.isRunning) {
      return
    }

    this.setState({ isRunning: true })
    await this.props.bp.axios.post('/mod/testing/runAll')

    this.longPoll()
  }

  runSingleScenario = async scenario => {
    if (this.state.isRunning) {
      return
    }

    this.setState({ isRunning: true })
    await this.props.bp.axios.post('/mod/testing/run', { scenario })

    this.longPoll()
  }

  deleteSingleScenario = async scenario => {
    await this.props.bp.axios.post('/mod/testing/deleteScenario', { name: scenario.name })
    await this.loadScenarios()
  }

  getQnaPreviews(scenarios) {
    return _.chain(scenarios)
      .flatMapDeep(scenario => scenario.steps.map(interaction => interaction.botReplies))
      .filter(reply => _.isObject(reply.botResponse) && reply.replySource.startsWith('qna'))
      .reduce((acc, next) => {
        acc[next.replySource] = next.botResponse.text
        return acc
      }, {})
      .value()
  }

  getElementPreviews = async scenarios => {
    const elementIds = _.chain(scenarios)
      .flatMapDeep(scenario => scenario.steps.map(interaction => interaction.botReplies.map(rep => rep.botResponse)))
      .filter(_.isString)
      .uniq()
      .value()

    const { data } = await this.props.bp.axios.post('/mod/testing/fetchPreviews', { elementIds })

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
    const passCount = this.state.scenarios.filter(s => s.status === 'pass').length // we don't do a simple substraction in case some are pending

    return (
      <div className={style.summary}>
        <strong>Total: {total}</strong>
        {!!failCount && <strong className="text-danger">Failed: {failCount}</strong>}
        {!!passCount && <strong className="text-success">Passed: {passCount}</strong>}
      </div>
    )
  }

  handleScenarioSaved = () => {
    this.setState({ isRecording: false })
    this.init()
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
                  <Button bsSize="small" variant="danger" className={'btn-danger'} onClick={this.deleteAllScenarios}>
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
                    <Scenario
                      key={s.name}
                      scenario={s}
                      run={this.runSingleScenario.bind(this, s)}
                      delete={this.deleteSingleScenario.bind(this, s)}
                      previews={this.state.previews}
                      bp={this.props.bp}
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
