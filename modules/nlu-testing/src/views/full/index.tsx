import { Button, HTMLTable, Icon, Position, Tooltip, ContextMenuTarget, Menu, MenuItem } from '@blueprintjs/core'
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
      <HTMLTable bordered striped interactive>
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
            <TableRow
              test={test}
              testResults={this.state.testResults}
              onDelete={() => {
                this.api.deleteTest(test).then(() => this.refreshSessions())
              }}
            />
          ))}
        </tbody>
      </HTMLTable>
    )
  }

  runTests = async () => {
    await new Promise(resolve => this.setState({ testResults: {} }, resolve))
    for (let test of this.state.tests) {
      const result = await this.api.runTest(test)
      await new Promise(resolve =>
        this.setState({ testResults: { ...this.state.testResults, [result.id]: result } }, resolve)
      )
    }
  }

  render() {
    return (
      <Container sidePanelHidden={true} yOverflowScroll={true}>
        <div />
        <div className="bph-layout-main">
          <div className="bph-layout-middle">
            <div>
              <Button type="button" intent="primary" minimal icon="add" onClick={() => this.showModal()}>
                Create a test
              </Button>
              <Button
                disabled={this.state.tests.length === 0}
                type="button"
                intent="primary"
                minimal
                icon="play"
                onClick={() => this.runTests()}
              >
                Run all tests
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
            </div>
          </div>
        </div>
      </Container>
    )
  }
}

@ContextMenuTarget
class TableRow extends React.Component<{ test: Test; testResults: any; onDelete: () => void }, {}> {
  render() {
    return (
      <tr>
        {/* TODO edit utterance in place */}
        <td>{this.props.test.utterance}</td>
        <td>{this.props.test.context}</td>
        <td>{this.props.test.conditions.map(c => c.join('-')).join(' | ')}</td>
        <td>{this.renderResult()}</td>
      </tr>
    )
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

  renderResult = () => {
    const result = this.props.testResults[this.props.test.id]
    if (result === undefined) {
      return <span>-</span>
    } else if (result.success) {
      return <Icon icon="tick-circle" intent="success" />
    } else {
      return (
        <Tooltip position={Position.LEFT} content={this.renderDetails(result)}>
          <Icon icon="warning-sign" intent="danger" />
        </Tooltip>
      )
    }
  }

  renderContextMenu = (e: React.MouseEvent<HTMLElement>) => {
    return (
      <Menu>
        <MenuItem onClick={this.props.onDelete} text="Delete" />
      </Menu>
    )
  }
}
