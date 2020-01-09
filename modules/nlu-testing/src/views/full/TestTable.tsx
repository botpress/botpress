import { Button, H3, HTMLTable, Icon, Intent, Position, Tooltip } from '@blueprintjs/core'
import React, { FC } from 'react'

import { Test, TestResult } from './api'

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

interface Props {
  tests: Test[]
  testResults: _.Dictionary<TestResult>
  createTest: () => void
}

export const TestTable: FC<Props> = props => (
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
          <th>Context</th>
          <th>Conditions</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        {props.tests.map(test => (
          <tr key={test.id}>
            {/* TODO edit utterance in place */}
            <td>{test.utterance}</td>
            <td>{test.context}</td>
            <td>{test.conditions.map(c => c.join('-')).join(' | ')}</td>
            <td>
              <TestResult testResult={props.testResults[test.id]} />
            </td>
          </tr>
        ))}
      </tbody>
    </HTMLTable>
  </React.Fragment>
)
