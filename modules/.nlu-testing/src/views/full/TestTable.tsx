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

import { Condition, Test, TestResult, TestResultDetails } from '../../shared/typings'

interface TestResultProps {
  testResult?: TestResult
}

const TestResult: FC<TestResultProps> = ({ testResult }) => {
  if (testResult === undefined) {
    return <span>-</span>
  }
  if (testResult?.success) {
    return <Icon icon="tick-circle" intent={Intent.SUCCESS} />
  } else {
    const content = (
      <div>
        {testResult.details
          .filter(r => !r || !r.success)
          .map(r => (
            <ul>
              {r.reason.split('\n').map(t => (
                <li>{t}</li>
              ))}
            </ul>
          ))}
      </div>
    )
    return (
      <Tooltip position={Position.TOP} content={content}>
        <Icon icon="warning-sign" intent={Intent.DANGER} />
      </Tooltip>
    )
  }
}

interface TableRowProps {
  test: Test
  testResult: TestResult
  onRun: () => void
  onEdit: () => void
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
        <td>{test.conditions.filter(c => c[0] === 'context').map(c => c[2])}</td>
        <td>
          {test.conditions
            .filter(([key]) => key !== 'context')
            .map(c => (
              <p key={c.join('-')} style={{ marginBottom: 2 }}>
                <strong>{c[0]}</strong> : {c[2]}
              </p>
            ))}
        </td>
        <td>
          <TestResult testResult={testResult} />
        </td>
      </tr>
    )
  }

  renderContextMenu(e: React.MouseEvent<HTMLElement>) {
    return (
      <Menu>
        <MenuItem onClick={this.props.onRun} text="Run" icon="play" />
        <MenuItem onClick={this.props.onEdit} text="Edit" icon="edit" />
        <MenuItem onClick={this.props.onDelete} text="Delete" icon="delete" />
      </Menu>
    )
  }
}

interface TestTableProps {
  tests: Test[]
  testResults: _.Dictionary<TestResult>
  createTest: () => void
  editTest: (test: Test) => void
  runTest: (test: Test) => void
  deleteTest: (testId: Test) => void
}

export const CSVExport = (tests: Test[], testResults: _.Dictionary<TestResult>) => {
  const conditionsToString = (conditions: Condition[]) => conditions.map(x => `(${x.join(' ')})`).join(' AND ')
  const detailsToString = (details: TestResultDetails[]) =>
    details
      .filter(x => !x.success)
      .map(x => `(${x.reason})`)
      .join(' AND ')

  const data = [
    '"id","utterance","conditions","success","reason"',
    ...tests.map(test => {
      return [
        test.id,
        test.utterance,
        conditionsToString(test.conditions),
        testResults[test.id].success,
        detailsToString(testResults[test.id].details)
      ]
        .map(x => x.toString().replace(/"/g, '\\"'))
        .map(x => `"${x}"`)
        .join(',')
    })
  ].join('\r\n')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([data]))
  link.download = 'botpress_nlu_tests_results.csv'
  link.click()
}

export const TestTable: FC<TestTableProps> = props => {
  const orderedTests = _.orderBy(
    props.tests,
    t => (t.conditions.find(c => c[0] === 'context') || ['', '', t.context])[2]
  )
  return (
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
        <Button
          type="button"
          minimal
          intent={Intent.NONE}
          small
          disabled={Object.keys(props.testResults).length === 0}
          icon="download"
          onClick={() => CSVExport(props.tests, props.testResults)}
          text="CSV Export"
        />
      </H3>
      <HTMLTable bordered striped>
        <thead>
          <tr>
            <th>Utterance</th>
            <th>Testing Topic</th>
            <th>Expected Topic</th>
            <th>Intent Conditions</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {orderedTests.map(test => (
            <TableRow
              test={test}
              testResult={props.testResults[test.id]}
              onRun={props.runTest.bind(this, test)}
              onEdit={props.editTest.bind(this, test)}
              onDelete={props.deleteTest.bind(this, test)}
            />
          ))}
        </tbody>
      </HTMLTable>
    </React.Fragment>
  )
}
