import { AxiosStatic } from 'axios'
import React from 'react'
import { Button, FormControl, Row, Col, Alert, Form, Collapse } from 'react-bootstrap'
import { MdExpandLess, MdExpandMore } from 'react-icons/md'

import style from './style.scss'

interface Props {
  bp: {
    axios: AxiosStatic
  }
  isRecording: boolean
  cancel: () => void
  onSave: () => void
}

interface State {
  recordedScenario?: string
  scenarioName: string
  previewDisplayed: boolean
  recordView?: boolean
  isRecording?: boolean
}

const DEFAULT_STATE: State = {
  recordedScenario: undefined,
  scenarioName: '',
  previewDisplayed: false
}

class ScenarioRecorder extends React.Component<Props, State> {
  state: State = { ...DEFAULT_STATE }

  startRecording = async () => {
    this.setState({ recordView: true, isRecording: true })

    const chatUserId = window.BP_STORAGE.get('bp/socket/studio/user') || window.__BP_VISITOR_ID
    await this.props.bp.axios.post('/mod/testing/startRecording', { userId: chatUserId })
  }

  stopRecording = async () => {
    window.botpressWebChat.sendEvent({ type: 'hide' })

    const { data } = await this.props.bp.axios.post('/mod/testing/stopRecording')

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
          {this.props.isRecording && !this.state.recordedScenario && (
            <Alert>
              <h4>Recording</h4>
              <p>
                You are now recording a scenario, every interaction in the emulator will be saved in a scenario. You can
                either continue your current session or start a new session.
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
                    this.setState({
                      // Having questions about this typing hack? See: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/16208
                      scenarioName: ((e as unknown) as React.ChangeEvent<HTMLInputElement>).target.value
                    })
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
                    this.setState({ previewDisplayed: !this.state.previewDisplayed })
                  }}
                >
                  {this.state.previewDisplayed && <MdExpandLess />}
                  {!this.state.previewDisplayed && <MdExpandMore />}
                  Show details
                </span>
                <Collapse in={this.state.previewDisplayed} timeout={100}>
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
