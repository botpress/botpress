import React from 'react'
import { Button, Row, Col, Glyphicon } from 'react-bootstrap'

import Scenario from './Scenario'
import style from './style.scss'

export default ({ scenarios, runAll, runSingle, previews, isRunning, toggleRecorder, bp }) => {
  const total = scenarios.length
  const failCount = scenarios.filter(s => s.status === 'fail').length
  const passCount = scenarios.filter(s => s.status === 'pass').length // we don't do a simple substraction in case some are pending

  return (
    <div className={style.testSuite}>
      <Row>
        <Col md={8}>
          <h2>Scenarios</h2>
          <div className={style.summary}>
            <strong>Total: {total}</strong>
            {!!failCount && <strong className="text-danger">Failed: {failCount}</strong>}
            {!!passCount && <strong className="text-success">Passed: {passCount}</strong>}
          </div>
        </Col>
        <Col md={4}>
          <div className="pull-right">
            <Button onClick={runAll} disabled={isRunning}>
              <Glyphicon glyph="play" /> Run All
            </Button>
            &nbsp;
            <Button onClick={toggleRecorder}>
              <Glyphicon glyph="record " /> Record new
            </Button>
          </div>
        </Col>
      </Row>
      {scenarios.map(s => (
        <Scenario key={s.name} scenario={s} run={runSingle} previews={previews} bp={bp} />
      ))}
    </div>
  )
}
