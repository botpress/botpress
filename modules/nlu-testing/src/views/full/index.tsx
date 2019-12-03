import { Button, Callout, Colors, HTMLTable, Icon } from '@blueprintjs/core'
import { Container, SplashScreen } from 'botpress/ui'
import _ from 'lodash'
import React from 'react'

import { makeApi, Test, TestResult } from './api'
import style from './style.scss'
import { CreateTestModal } from './CreateTestModal'
import { RunTestsModal } from './RunTestsModal'

interface State {
  loading: boolean
  createModalVisible: boolean
  tests: Test[]
}

export default class HitlModule extends React.Component<{ bp: any }, State> {
  private api = makeApi(this.props.bp)

  state: State = {
    loading: true,
    createModalVisible: false,
    tests: []
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
    this.setState({ loading: true }, () => {
      // tslint:disable-next-line: no-floating-promises
      this.api.fetchTests().then(tests => this.setState({ loading: false, tests }))
    })
  }

  renderResult = (result: TestResult) => {
    if (result === 'running') {
      return <span style={{ color: Colors.BLUE5 }}>Running</span>
    } else if (result === 'success') {
      return (
        <span style={{ color: Colors.GREEN3 }}>
          <strong>Success</strong>
        </span>
      )
    } else if (result === 'failed') {
      return (
        <span style={{ color: Colors.RED3 }}>
          <strong>Failed</strong>
        </span>
      )
    }
    return <span>–</span>
  }

  renderEmpty() {
    return (
      <SplashScreen
        icon={<Icon iconSize={100} icon="predictive-analysis" style={{ marginBottom: '3em' }} />}
        title="NLU Regression Testing"
        description=""
      />
    )
  }

  renderTable() {
    return (
      <HTMLTable bordered={true} interactive={false} striped={true} style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Utterance</th>
            <th>Condition</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {this.state.tests.map(test => (
            <tr>
              <td>{test.utterance}</td>
              <td>{test.condition}</td>
              <td>{this.renderResult(test.result)}</td>
            </tr>
          ))}
        </tbody>
      </HTMLTable>
    )
  }

  render() {
    if (this.state.loading) {
      return <Callout>Loading...</Callout>
    }

    return (
      <Container sidePanelHidden={true}>
        <div />
        <div className="bph-layout-main">
          <div className="bph-layout-middle">
            <div style={{ width: '100%', background: 'white', margin: 0, padding: 0 }}>
              <Button
                type="button"
                large={true}
                intent="primary"
                minimal={false}
                icon="add"
                onClick={() => this.showModal()}
              >
                Create your first test
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
              <RunTestsModal
                api={this.api}
                hide={() => this.hideModal()}
                visible={this.state.createModalVisible}
                onUpdate={() => this.refreshSessions()}
              />
            </div>
          </div>
        </div>
      </Container>
    )
  }
}
