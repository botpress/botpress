import { Button, Icon, Spinner } from '@blueprintjs/core'
import { AxiosInstance } from 'axios'
import { ModuleUI, toast } from 'botpress/shared'
import _ from 'lodash'
import React from 'react'

import { Test, TestResult } from '../../shared/typings'
import { computeSummary } from '../../shared/utils'

import { makeApi } from './api'
import { ImportModal } from './ImportModal'
import style from './style.scss'
import { TestModal } from './TestModal'
import { TestTable } from './TestTable'

const { Container, SplashScreen } = ModuleUI

interface State {
  createModalVisible: boolean
  importModalVisible: boolean
  tests: Test[]
  testResults: _.Dictionary<TestResult>
  loading: boolean
  working: boolean
  currentTest?: Test
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
    working: false
  }

  createTest = () => {
    this.setState({ createModalVisible: true, currentTest: undefined })
  }

  editTest = (test: Test) => {
    this.setState({ createModalVisible: true, currentTest: test })
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
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.api.fetchTests().then(tests => this.setState({ tests, loading: false, currentTest: undefined }))
  }

  runTests = async () => {
    this.setState({ working: true })
    await new Promise(resolve => this.setState({ testResults: {} }, resolve))
    const testResults = await this.api.runAllTests()
    this.setState({ working: false, testResults })
  }

  runSingleTest = async (test: Test) => {
    this.setState({ working: true })
    const testRes = await this.api.runTest(test)
    await new Promise(resolve =>
      this.setState({ testResults: { ...this.state.testResults, [testRes.id]: testRes } }, resolve)
    )
    this.setState({ working: false })
  }

  deleteTest = async (test: Test) => {
    await this.api.deleteTest(test)
    await this.refreshTests()
    delete this.state.testResults[test.id]
  }

  async saveResults() {
    if (_.isEmpty(this.state.testResults)) {
      return
    }

    try {
      await this.api.exportResults(this.state.testResults)
      toast.success('Results saved')
    } catch (err) {
      toast.failure('Could not export test results')
    }
  }

  render() {
    const shouldRenderSplash = !this.state.loading && !this.state.tests.length
    return (
      <Container sidePanelHidden={true} yOverflowScroll={true}>
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
                  onClick={this.createTest}
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
              {this.state.working && (
                <span className={style.working}>
                  <Spinner size={20} />
                  &nbsp; Working
                </span>
              )}
              {!this.state.working && !_.isEmpty(this.state.testResults) && (
                <React.Fragment>
                  <Button
                    type="button"
                    intent="primary"
                    minimal
                    icon="export"
                    onClick={() => this.saveResults()}
                    text="Save results"
                  />
                  <span className={style.working}>
                    <Icon icon="tick" />
                    {computeSummary(this.state.tests, this.state.testResults)} % of tests passing
                  </span>
                </React.Fragment>
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
                  createTest={this.createTest}
                  runTest={this.runSingleTest}
                  editTest={this.editTest}
                  deleteTest={this.deleteTest}
                />
              )}
              <TestModal
                test={this.state.currentTest}
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
