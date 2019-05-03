import React from 'react'
import { Button, FormControl, Grid, Row, Col, Glyphicon } from 'react-bootstrap'
import style from './style.scss'
import Scenario from './Scenario'

export default class Testing extends React.Component {
  state = {
    chatUserId: '',
    scenarios: [],
    isRunning: false,
    isRecording: false,
    recordView: false,
    testSteps: '',
    displayPreview: true,
    contentElements: []
  }

  componentDidMount() {
    this.setState({ chatUserId: window.__BP_VISITOR_ID })
    this.loadScenarios()
  }

  loadScenarios = async () => {
    const { data } = await this.props.bp.axios.get('/mod/testing/scenarios')
    this.setState({ scenarios: data.scenarios, status: data.status })

    if (data.status && !data.status.replaying && this.interval) {
      clearInterval(this.interval)
      this.setState({ isRunning: false })
    }

    this.fetchPreviews(this.extractElementIds(data.scenarios))
  }

  runAll = async () => {
    if (this.state.isRunning) {
      return
    }

    this.setState({ isRunning: true })
    await this.props.bp.axios.get('/mod/testing/runAll')

    if (!this.interval) {
      this.loadScenarios()
      this.interval = setInterval(this.loadScenarios, 1500)
    }
  }

  startRecording = async () => {
    this.setState({ recordView: true, isRecording: true })
    await this.props.bp.axios.get('/mod/testing/startRecording/' + this.state.chatUserId)
  }

  stopRecording = async () => {
    const { data } = await this.props.bp.axios.get('/mod/testing/stopRecording')
    this.setState({ isRecording: false, recordedScenario: JSON.stringify(data, null, 2) })
  }

  saveScenario = async () => {
    const { scenarioName, recordedScenario } = this.state

    await this.props.bp.axios.post('/mod/testing/saveScenario', {
      name: scenarioName,
      steps: JSON.parse(recordedScenario)
    })
    await this.loadScenarios()
    this.setState({ recordView: false })
  }

  extractElementIds(scenarios) {
    const filtered = scenarios.filter(x => x.mismatch && x.mismatch.expected && x.mismatch.received)
    const allResponses = filtered.reduce((acc, { mismatch }) => {
      const allReplies = [...mismatch.expected.botReplies, ...mismatch.received.botReplies]
      acc = [...acc, ...allReplies.map(x => x.botResponse)]
      return acc
    }, [])

    return _.uniq(allResponses.filter(_.isString))
  }

  fetchPreviews = async elementIds => {
    const { data } = await this.props.bp.axios.post('/mod/testing/fetchPreviews', { elementIds })
    this.setState({ contentElements: data })
  }

  cancel = () => this.setState({ recordView: false, recordedScenario: undefined })
  handleInputChanged = e => this.setState({ [e.target.name]: e.target.value })

  renderRecordSettings() {
    return (
      <div>
        <div style={{ paddingBottom: 10 }}>
          <Button onClick={this.cancel} bsStyle="danger">
            Cancel
          </Button>
          &nbsp;
          <Button onClick={this.startRecording} bsStyle="primary">
            Start Recording
          </Button>
        </div>
        <p>
          This tool allow you to chat with your bot and record the interaction. It can then be replayed to make sure
          your bot still answers as expected.
        </p>

        <p>
          By default, the user id that will be listened on for events is your webchat ID. You can also create a new
          session on the emulator and use that ID instead. Remove the ID to record all events.
        </p>
        <FormControl
          name="chatUserId"
          placeholder={'The user ID to listen to'}
          style={{ width: 400 }}
          value={this.state.chatUserId}
          onChange={this.handleInputChanged}
        />
      </div>
    )
  }

  renderRecordView() {
    if (!this.state.isRecording) {
      const hasRecord = this.state.recordedScenario && this.state.recordedScenario.length
      if (hasRecord) {
        return this.renderScenarioPreview()
      }
      return this.renderRecordSettings()
    }

    return (
      <div>
        <div style={{ paddingBottom: 10 }}>
          <Button onClick={this.stopRecording} bsStyle="primary">
            Stop Recording
          </Button>
        </div>
        Recording...
      </div>
    )
  }

  renderSummary = () => {
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

  renderScenarios = () => {
    return (
      <Grid>
        <Row>
          <Col md={7} mdOffset={1}>
            <h2>Scenarios</h2>
            {this.renderSummary()}
          </Col>
          <Col md={3}>
            <div className="pull-right">
              <Button onClick={this.runAll} disabled={this.state.isRunning}>
                <Glyphicon glyph="play" /> Run All
              </Button>
              &nbsp;
              <Button onClick={() => this.setState({ recordView: true, isRecording: false })}>
                <Glyphicon glyph="record " /> Record new
              </Button>
            </div>
          </Col>
        </Row>
        {this.state.scenarios.map(s => (
          <Row key={s.name}>
            <Col md={10} mdOffset={1}>
              <Scenario scenario={s} contentElements={this.state.contentElements} bp={this.props.bp} />
            </Col>
          </Row>
        ))}
      </Grid>
    )
  }

  render() {
    return (
      <div className={style.workspace}>{this.state.recordView ? this.renderRecorder() : this.renderScenarios()}</div>
    )
  }
}
