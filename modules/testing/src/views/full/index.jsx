import React from 'react'
import { Grid, Row, Col } from 'react-bootstrap'
import style from './style.scss'
import ScenarioRecorder from './ScenarioRecorder'
import NoScenarios from './NoScenarios'
import ScenarioList from './ScenarioList'

export default class Testing extends React.Component {
  state = {
    scenarios: [],
    isRunning: false,
    recordView: false,
    previews: {}
  }

  componentDidMount() {
    this.loadScenarios()
    // this.fetchStatus()
  }

  // fetchStatus = () => {
  //   const {data} = await this.props.bp.axios.get('/mod/testing/status')

  //   // if (data.status && !data.status)
  // }

  loadScenarios = async () => {
    const { data } = await this.props.bp.axios.get('/mod/testing/scenarios')
    this.setState({ scenarios: data.scenarios, status: data.status }, this.setContent)

    if (data.status && this.interval && !data.status.running) {
      clearInterval(this.interval)
      this.setState({ isRunning: false })
    }
  }

  setContent = async () => {
    const { scenarios } = this.state
    const elementPreviews = await this.getElementPreviews(scenarios)
    const qnaPreviews = this.getQnaPreviews(scenarios)

    this.setState({ previews: { ...elementPreviews, ...qnaPreviews } })
  }

  longPoll = () => {
    if (!this.interval) {
      this.loadScenarios()
      this.interval = setInterval(this.loadScenarios, 2000)
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

  render() {
    return (
      <div className={style.workspace}>
        <Grid>
          <Row>
            <Col md={10} mdOffset={1}>
              {this.state.recordView && (
                <ScenarioRecorder bp={this.props.bp} onSave={this.loadScenarios} cancel={this.toggleRecordView} />
              )}
              {!this.state.recordView && !this.hasScenarios && <NoScenarios onRecordClicked={this.toggleRecordView} />}
              {!this.state.recordView &&
                this.hasScenarios && (
                  <ScenarioList
                    scenarios={this.state.scenarios}
                    runAll={this.runAllScenarios}
                    runSingle={this.runSingleScenario}
                    previews={this.state.previews}
                    isRunning={this.state.isRunning}
                    toggleRecorder={this.toggleRecordView}
                    bp={this.props.bp}
                  />
                )}
            </Col>
          </Row>
        </Grid>
      </div>
    )
  }
}
