import React from 'react'
import { Button, FormControl } from 'react-bootstrap'
import { MdLens } from 'react-icons/md'
import style from './style.scss'

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
      this.interval = setInterval(this.loadScenarios, 2000)
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

  renderMessage(response, source, idx) {
    const { displayPreview, contentElements } = this.state

    if (typeof response === 'string' && displayPreview) {
      const element = contentElements.find(el => el.id === response)
      response = (element && element.preview) || response
    }

    if (typeof response === 'object') {
      const InjectedModuleView = this.props.bp.getModuleInjector()
      return (
        <div className="bpw-from-bot" key={idx}>
          <InjectedModuleView
            moduleName={'channel-web'}
            componentName={'Message'}
            extraProps={{ payload: response || 'error previewing' }}
            onNotFound={undefined}
          />
          <small>(source: {source})</small>
        </div>
      )
    } else {
      return (
        <div className="bpw-from-bot" key={idx}>
          <div className="bpw-chat-bubble">{response}</div>
        </div>
      )
    }
  }

  renderExchange(interactions) {
    if (!interactions) {
      return
    }

    const { userMessage, botReplies } = interactions
    return (
      <div style={{ margin: '0 15px 0 15px' }}>
        <div style={{ width: '100%', marginBottom: 3 }} align="right">
          <div className="bpw-from-user" style={{ width: 'auto' }}>
            <div className="bpw-chat-bubble">{userMessage}</div>
          </div>
        </div>

        {botReplies.map(({ botResponse, replySource }, idx) => this.renderMessage(botResponse, replySource, idx))}
      </div>
    )
  }

  renderScenario(scenario) {
    const { name, stepsCount, completedSteps, mismatch, status } = scenario

    let color = 'gray'
    if (status === 'fail') {
      color = 'red'
    } else if (status === 'pass') {
      color = 'green'
    }

    let progress = `${stepsCount} interactions`
    if (status === 'pending') {
      progress = `Progress: ${completedSteps} / ${stepsCount}`
    } else if (status === 'fail') {
      progress = `Failed at step ${completedSteps + 1} / ${stepsCount} `
    }

    return (
      <div className={style.scenarioList} key={name}>
        <div className={style.title}>
          <MdLens color={color} />
          <span>{name}</span>
        </div>
        <div className={style.steps}>{progress}</div>
        <div>
          {mismatch && mismatch.reason && 'Fail Reason: ' + mismatch.reason}
          {mismatch && (
            <div style={{ display: 'flex' }}>
              <div style={{ width: 400 }}>{this.renderExchange(mismatch.expected)}</div>
              <div style={{ width: 400 }}>{this.renderExchange(mismatch.received)}</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  renderScenarioPreview() {
    return (
      <div>
        <div style={{ display: 'flex' }}>
          <FormControl
            name="scenarioName"
            placeholder={'Name of your scenario'}
            style={{ width: 400 }}
            value={this.state.scenarioName}
            onChange={this.handleInputChanged}
          />
          &nbsp;
          <Button onClick={this.saveScenario} bsStyle="primary">
            Save Scenario
          </Button>
          &nbsp;
          <Button onClick={this.cancel} bsStyle="danger">
            Cancel
          </Button>
        </div>
        <div style={{ paddingTop: 10 }}>
          <FormControl
            componentClass="textarea"
            rows="30"
            name="recordedScenario"
            value={this.state.recordedScenario}
            onChange={this.handleInputChanged}
          />
        </div>
      </div>
    )
  }

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

  renderList() {
    const { scenarios } = this.state
    return (
      <div>
        <Button onClick={this.runAll} disabled={this.state.isRunning}>
          Run All
        </Button>
        &nbsp;
        <Button onClick={() => this.setState({ recordView: true, isRecording: false })}>Switch to Record View</Button>
        <h3>Scenarios</h3>
        <div style={{ display: 'flex' }}>
          <div />
          <div style={{ marginLeft: 400, width: 400, textAlign: 'center' }}>
            <h4>Expected</h4>
          </div>
          <div style={{ width: 400, textAlign: 'center' }}>
            <h4>Received</h4>
          </div>
        </div>
        <div>{scenarios && _.orderBy(scenarios, 'status').map(x => this.renderScenario(x))}</div>
      </div>
    )
  }

  render() {
    return (
      <div style={{ padding: 10, background: '#ffffff', height: '100%' }}>
        {this.state.recordView ? this.renderRecordView() : this.renderList()}
      </div>
    )
  }
}
