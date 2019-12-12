import { Button, HTMLTable, Icon, Position, Tooltip } from '@blueprintjs/core'
import P from 'bluebird'
import { Container, SplashScreen } from 'botpress/ui'
import _ from 'lodash'
import React from 'react'

import { makeApi, Test, TestResult } from './api'
import style from './style.scss'
import { CreateTestModal } from './CreateTestModal'

interface State {
  createModalVisible: boolean
  tests: Test[]
  testResults: _.Dictionary<TestResult>
}

export default class NLUTests extends React.Component<{ bp: any }, State> {
  private api = makeApi(this.props.bp)

  state: State = {
    createModalVisible: false,
    tests: [],
    testResults: {}
  }

  hideModal() {
    this.setState({ createModalVisible: false })
  }

  showModal() {
    this.setState({ createModalVisible: true })
  }

  async componentDidMount() {
    await this.refreshSessions()
  }

  refreshSessions = async () => {
    this.api.fetchTests().then(tests => this.setState({ tests }))
  }

  renderDetails = (res: TestResult) => (
    <div>
      {res.details
        .filter(r => !r.success)
        .map(r => (
          <p>{r.reason}</p>
        ))}
    </div>
  )

  renderResult = testId => {
    const result = this.state.testResults[testId]
    if (result === undefined) {
      return <span>-</span>
    }
    if (result.success) {
      return <Icon icon="tick-circle" intent="success" />
    } else {
      return (
        <Tooltip position={Position.LEFT} content={this.renderDetails(result)}>
          <Icon icon="warning-sign" intent="danger" />
        </Tooltip>
      )
    }
  }

  renderEmpty() {
    return (
      <SplashScreen
        icon={<Icon iconSize={100} icon="predictive-analysis" style={{ marginBottom: '3em' }} />}
        title="NLU Regression Testing"
        description="Utility module used by the Botpress team to perform regression testing on native NLU"
      />
    )
  }

  renderTable() {
    return (
      <HTMLTable bordered striped>
        <thead>
          <tr>
            <th>Utterance</th>
            <th>Context</th>
            <th>Conditions</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {this.state.tests.map(test => (
            <tr>
              {/* TODO edit utterance in place */}
              <td>{test.utterance}</td>
              <td>{test.context}</td>
              <td>{test.conditions.map(c => c.join('-')).join(' | ')}</td>
              <td>{this.renderResult(test.id)}</td>
            </tr>
          ))}
        </tbody>
      </HTMLTable>
    )
  }

  runTests = async () => {
    const testResults = (await P.mapSeries(this.state.tests, this.api.runTest)).reduce((resultsMap, result) => {
      return { ...resultsMap, [result.id]: result }
    }, {})
    this.setState({ testResults })
  }

  render() {
    return (
      <Container sidePanelHidden={true}>
        <div />
        <div className="bph-layout-main">
          <div className="bph-layout-middle">
            <div>
              <Button type="button" intent="primary" minimal icon="add" onClick={() => this.showModal()}>
                Create a test
              </Button>
            </div>
            <div className={style.container}>
              {!this.state.tests.length && this.renderEmpty()}
              {!!this.state.tests.length && this.renderTable()}
              <CreateTestModal
                api={this.api}
                hide={() => this.hideModal()}
                visible={this.state.createModalVisible}
                onTestCreated={() => this.refreshSessions()}
              />
              {this.state.tests.length > 0 && (
                <div>
                  <Button type="button" intent="success" icon="play" onClick={this.runTests}>
                    Run all tests
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    )
  }
}
