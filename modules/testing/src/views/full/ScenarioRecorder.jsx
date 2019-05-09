import React from 'react'

import { Button, FormControl, Row, Col, Alert } from 'react-bootstrap'

class ScenarioRecorder extends React.Component {
  state = {
    recordedScenario: null,
    isRecording: false,
    chatUserId: '',
    scenarioName: ''
  }

  componentDidMount() {
    this.setState({ chatUserId: window.__BP_VISITOR_ID })
  }

  startRecording = async () => {
    this.setState({ recordView: true, isRecording: true })
    await this.props.bp.axios.get('/mod/testing/startRecording/' + this.state.chatUserId)
  }

  stopRecording = async () => {
    window.botpressWebChat.sendEvent({ type: 'hide' })
    const { data } = await this.props.bp.axios.get('/mod/testing/stopRecording')
    this.setState({ recordedScenario: JSON.stringify(data, null, 2) })
  }

  flush = () => {
    this.setState({ recordedScenario: null })
  }

  saveScenario = async () => {
    const { scenarioName, recordedScenario } = this.state

    await this.props.bp.axios.post('/mod/testing/saveScenario', {
      name: scenarioName,
      steps: JSON.parse(recordedScenario)
    })
    this.flush()
    this.props.onSave()
  }

  render() {
    return (
      <Row>
        <Col md={10}>
          {this.props.isRecording &&
            !this.state.recordedScenario && (
              <Alert style={{ marginTop: 25 }}>
                <h4>Recording</h4>
                <p>
                  You are now recording a scenario, every interaction in the emulator will be saved in a scenario. You
                  can either continue your current session or start a new session.
                </p>
                <Button bsSize="sm" onClick={this.stopRecording}>
                  Stop recording
                </Button>
              </Alert>
            )}
          {this.state.recordedScenario && (
            <div>
              <FormControl
                name="scenarioName"
                placeholder={'Name of your scenario'}
                style={{ width: 400 }}
                value={this.state.scenarioName}
                onChange={e => {
                  this.setState({ scenarioName: e.target.value })
                }}
              />
              &nbsp;
              <Button onClick={this.saveScenario} bsStyle="primary">
                Save Scenario
              </Button>
              &nbsp;
              <Button onClick={this.flush} bsStyle="danger">
                Discard
              </Button>
              <FormControl
                componentClass="textarea"
                rows="30"
                name="recordedScenario"
                value={this.state.recordedScenario}
                onChange={e => {
                  this.setState({ recordedScenario: e.target.value })
                }}
              />
            </div>
          )}
        </Col>
      </Row>
    )
  }
}

export default ScenarioRecorder
