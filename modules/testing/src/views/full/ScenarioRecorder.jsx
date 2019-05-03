import React from 'react'

import { Button, FormControl, Grid, Row, Col } from 'react-bootstrap'

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
    const { data } = await this.props.bp.axios.get('/mod/testing/stopRecording')
    this.setState({ isRecording: false, recordedScenario: JSON.stringify(data, null, 2) })
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
      <Grid>
        <Row>
          <Col md={10} mdOffset={1}>
            <h2>Record a scenario</h2>
            {this.state.isRecording && <Button onClick={this.stopRecording}>Stop Recording</Button>}
            {!this.state.isRecording && (
              <div>
                <Button onClick={this.props.cancel}>Cancel</Button>
                &nbsp;
                <Button onClick={this.startRecording}>Start Recording</Button>
              </div>
            )}
          </Col>
        </Row>
        <Row>
          <Col md={10} mdOffset={1}>
            <p>
              This tool allow you to chat with your bot and record the interaction. It can then be replayed to make sure
              your bot still answers as expected.
            </p>
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
      </Grid>
    )
  }
}

export default ScenarioRecorder
