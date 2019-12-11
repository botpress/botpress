import { Button, Icon } from '@blueprintjs/core'
import { AxiosInstance } from 'axios'
import P from 'bluebird'
import { Container, SplashScreen } from 'botpress/ui'
import _ from 'lodash'
import React from 'react'

import { F1Metrics, makeApi, Test, TestResult } from './api'
import style from './style.scss'
import { CreateTestModal } from './CreateTestModal'
import { F1s } from './F1Metrics'
import { TestTable } from './TestTable'

interface State {
  createModalVisible: boolean
  tests: Test[]
  testResults: _.Dictionary<TestResult>
  loading: boolean
  f1Metrics: F1Metrics
}

interface Props {
  bp: { axios: AxiosInstance }
  contentLang: string
}

// TODO use ctx & useReducer instead of state
export default class NLUTests extends React.Component<Props, State> {
  private api = makeApi(this.props.bp)

  state: State = {
    createModalVisible: false,
    tests: [],
    testResults: {},
    loading: true,
    f1Metrics: {
      all: { precision: 0.76, recall: 0.79, f1: 0.75 },
      'e-ticket': { precision: 1, recall: 1, f1: 1 },
      global: { precision: 0.67, recall: 0.7, f1: 0.65 }
    }
  }

  setModalVisible(createModalVisible: boolean) {
    this.setState({ createModalVisible })
  }

  async componentDidMount() {
    await this.refreshTests()
  }

  refreshTests = async () => {
    this.api.fetchTests().then(tests => this.setState({ tests, loading: false }))
  }

  runTests = async () => {
    const testResults = (await P.mapSeries(this.state.tests, this.api.runTest)).reduce((resultsMap, result) => {
      return { ...resultsMap, [result.id]: result }
    }, {})
    this.setState({ testResults })
  }

  computeF1 = async () => {
    const f1Results = await this.api.runF1Analysis('en')
    this.setState({ f1Metrics: f1Results })
  }

  render() {
    return (
      <Container sidePanelHidden={true}>
        <div />
        <div className="bph-layout-main">
          <div className="bph-layout-middle">
            <div>
              <Button intent="primary" minimal icon="play" text="Run tests" onClick={() => this.runTests()} />
              <Button
                intent="primary"
                minimal
                icon="function"
                onClick={() => this.computeF1()}
                text="Compute F1 analysis"
              />
            </div>
            <div className={style.container}>
              {!this.state.loading && !this.state.tests.length && (
                <SplashScreen
                  icon={<Icon iconSize={100} icon="predictive-analysis" style={{ marginBottom: '3em' }} />}
                  title="NLU Regression Testing"
                  description="Utility module used by the Botpress team to perform regression testing on native NLU"
                />
              )}
              {!!this.state.tests.length && (
                <TestTable
                  tests={this.state.tests}
                  testResults={this.state.testResults}
                  createTest={this.setModalVisible.bind(this, true)}
                />
              )}
              {!_.isEmpty(this.state.f1Metrics) && <F1s f1Metrics={this.state.f1Metrics} />}
              <CreateTestModal
                api={this.api}
                hide={this.setModalVisible.bind(this, false)}
                visible={this.state.createModalVisible}
                onTestCreated={() => this.refreshTests()}
              />
            </div>
          </div>
        </div>
      </Container>
    )
  }
}
