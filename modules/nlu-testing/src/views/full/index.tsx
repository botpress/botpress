import { Button, Icon, Spinner } from '@blueprintjs/core'
import { AxiosInstance } from 'axios'
import { Container, SplashScreen } from 'botpress/ui'
import _ from 'lodash'
import React from 'react'

import { makeApi, Test, TestResult, XValidationResults } from './api'
import style from './style.scss'
import { CreateTestModal } from './CreateTestModal'
import { CrossValidationResults } from './F1Metrics'
import { ImportModal } from './ImportModal'
import { TestTable } from './TestTable'

interface State {
  createModalVisible: boolean
  importModalVisible: boolean
  tests: Test[]
  testResults: _.Dictionary<TestResult>
  loading: boolean
  working: boolean
  f1Metrics: XValidationResults
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
    importModalVisible: false,
    tests: [],
    testResults: {},
    loading: true,
    working: false,
    f1Metrics: null
  }

  setModalVisible(createModalVisible: boolean) {
    this.setState({ createModalVisible })
  }

  setImportModalVisibility(isVisible: boolean) {
    this.setState({ importModalVisible: isVisible })
  }

  async componentDidMount() {
    await this.refreshTests()
  }

  refreshTests = async () => {
    this.api.fetchTests().then(tests => this.setState({ tests, loading: false }))
  }

  computeXValidation = async () => {
    this.setState({ working: true })
    const f1Metrics = await this.api.computeCrossValidation(this.props.contentLang)
    this.setState({ f1Metrics, working: false })
  }

  runTests = async () => {
    this.setState({ working: true })
    await new Promise(resolve => this.setState({ testResults: {} }, resolve))
    for (const test of this.state.tests) {
      const result = await this.api.runTest(test)
      await new Promise(resolve =>
        this.setState({ testResults: { ...this.state.testResults, [result.id]: result } }, resolve)
      )
    }
    this.setState({ working: false })
  }

  render() {
    const shouldRenderSplash = !this.state.loading && !this.state.tests.length && !this.state.f1Metrics
    return (
      <Container sidePanelHidden={true}>
        <div />
        <div className="bph-layout-main">
          <div className="bph-layout-middle">
            <div className={style.toolbar}>
              {!this.state.tests.length && (
                <Button
                  intent="success"
                  minimal
                  small
                  icon="add"
                  text="Create your first test"
                  onClick={this.setModalVisible.bind(this, true)}
                />
              )}
              <Button
                type="button"
                intent="success"
                minimal
                icon="import"
                text="Import tests"
                onClick={this.setImportModalVisibility.bind(this, true)}
              />
              {!!this.state.tests.length && (
                <Button intent="primary" minimal icon="play" text="Run tests" onClick={() => this.runTests()} />
              )}
              <Button
                disabled={this.state.tests.length === 0}
                type="button"
                intent="primary"
                minimal
                icon="function"
                onClick={() => this.computeXValidation()}
                text="Run Cross Validation"
              />
              {this.state.working && (
                <span className={style.working}>
                  <Spinner size={20} />
                  &nbsp; Working
                </span>
              )}
            </div>
            <div className={style.container}>
              {shouldRenderSplash && (
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
              <CrossValidationResults f1Metrics={this.state.f1Metrics} />
              <CreateTestModal
                api={this.api}
                hide={this.setModalVisible.bind(this, false)}
                visible={this.state.createModalVisible}
                onTestCreated={this.refreshTests}
              />
              <ImportModal
                axios={this.props.bp.axios}
                onImportCompleted={this.refreshTests}
                isOpen={this.state.importModalVisible}
                close={this.setImportModalVisibility.bind(this, false)}
              />
            </div>
          </div>
        </div>
      </Container>
    )
  }
}
