import {
  Button,
  ContextMenuTarget,
  H3,
  HTMLTable,
  Icon,
  Intent,
  Menu,
  MenuItem,
  Position,
  Tooltip
} from '@blueprintjs/core'
import _ from 'lodash'
import React, { Component, FC } from 'react'

import { Test, TestResult } from '../../shared/typings'

interface TestResultProps {
  testResult?: TestResult
}

const TestResult: FC<TestResultProps> = ({ testResult }) => {
  if (testResult === undefined) {
    return <span>-</span>
  }
  if (testResult.success) {
    return <Icon icon="tick-circle" intent={Intent.SUCCESS} />
  } else {
    const content = (
      <div>
        {testResult.details
          .filter(r => !r.success)
          .map(r => (
            <p>{r.reason}</p>
          ))}
      </div>
    )
    return (
      <Tooltip position={Position.LEFT} content={content}>
        <Icon icon="warning-sign" intent={Intent.DANGER} />
      </Tooltip>
    )
  }
}

interface TableRowProps {
  test: Test
  testResult: TestResult
  onRun: () => void
  onDelete: () => void
}

@ContextMenuTarget
class TableRow extends Component<TableRowProps> {
  render() {
    const { test, testResult } = this.props
    return (
      <tr key={test.id}>
        {/* TODO edit utterance in place */}
        <td>{test.utterance}</td>
        <td>{test.context}</td>
        <td>{test.conditions.map(c => c.join('-')).join(' | ')}</td>
        <td>
          <TestResult testResult={testResult} />
        </td>
      </tr>
    )
  }

  renderContextMenu = (e: React.MouseEvent<HTMLElement>) => {
    return (
      <Menu>
        <MenuItem onClick={this.props.onRun} text="Run" />
        <MenuItem onClick={this.props.onDelete} text="Delete" />
      </Menu>
    )
  }
}

interface TestTableProps {
  tests: Test[]
  testResults: _.Dictionary<TestResult>
  createTest: () => void
  runTest: (test: Test) => void
  deleteTest: (testId: Test) => void
}

export const TestTable: FC<TestTableProps> = props => (
  <React.Fragment>
    <H3>
      NLU System Tests &nbsp;
      <Button
        type="button"
        minimal
        intent={Intent.SUCCESS}
        small
        icon="add"
        onClick={props.createTest}
        text="New Test"
      />
    </H3>
    <HTMLTable bordered striped>
      <thead>
        <tr>
          <th>Utterance</th>
          <th>Testing Context</th>
          <th>Conditions</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        {props.tests.map(test => (
          <TableRow
            test={test}
            testResult={props.testResults[test.id]}
            onRun={props.runTest.bind(this, test)}
            onDelete={props.deleteTest.bind(this, test)}
          />
        ))}
      </tbody>
    </HTMLTable>
  </React.Fragment>
)
