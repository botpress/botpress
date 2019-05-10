import React from 'react'
import { MdExpandLess, MdExpandMore } from 'react-icons/md'
import { Button, FormControl, Row, Col, Alert, Form, Collapse } from 'react-bootstrap'

import style from './style.scss'
import Interaction from './Interaction'

const DEFAULT_STATE = {
  recordedScenario: null,
  scenarioName: '',
  previewDisplyed: false
}

class ScenarioRecorder extends React.Component {
  state = { ...DEFAULT_STATE }

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
    this.setState(DEFAULT_STATE)
    this.props.cancel()
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
        <Col md={10} className={style.scenarioRecorder}>
          {this.props.isRecording &&
            !this.state.recordedScenario && (
              <Alert>
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
              <Alert bsStyle="success">Recording complete</Alert>
              <Form onSubmit={e => e.preventDefault()} inline>
                <FormControl
                  name="scenarioName"
                  placeholder={'Name of your scenario'}
                  value={this.state.scenarioName}
                  onKeyDown={e => e.key === 'Enter' && this.saveScenario()}
                  onChange={e => {
                    this.setState({ scenarioName: e.target.value })
                  }}
                />
                &nbsp;
                <Button onClick={this.saveScenario} bsStyle="primary">
                  Save
                </Button>
                &nbsp;
                <Button onClick={this.flush}>Discard</Button>
              </Form>
              <div className={style.scenarioPreview}>
                <span
                  onClick={() => {
                    this.setState({ previewDisplyed: !this.state.previewDisplyed })
                  }}
                >
                  {this.state.previewDisplyed && <MdExpandLess />}
                  {!this.state.previewDisplyed && <MdExpandMore />}
                  Show details
                </span>
                <Collapse in={this.state.previewDisplyed} timeout={100}>
                  <FormControl
                    readOnly
                    componentClass="textarea"
                    name="recordedScenario"
                    rows={this.state.recordedScenario.split(/\n/).length}
                    value={this.state.recordedScenario}
                  />
                </Collapse>
              </div>
            </div>
          )}
        </Col>
      </Row>
    )
  }
}

export default ScenarioRecorder
