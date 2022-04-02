import React from 'react'

import { Row, Col, Grid } from 'react-bootstrap'
import { ScenarioMismatch } from '../../backend/typings'

import Interaction from './Interaction'
import style from './style.scss'

interface Props {
  failureIdx: number
  skipped: number
  mismatch: ScenarioMismatch
  previews: {
    [id: string]: string
  }
}

export default ({ failureIdx, skipped, mismatch, previews }: Props) => (
  <Grid fluid={true}>
    <Row>
      <h4>Failure report</h4>
      <Col md={12}>
        <p>
          Failed to complete scenario at interaction <strong>#{failureIdx}</strong>. Skipped <strong>{skipped}</strong>{' '}
          remaining interactions
        </p>
        <p>
          <strong>Reason:&nbsp;</strong> {mismatch.reason}
        </p>
      </Col>
    </Row>
    <Row className={style.reportInteractions}>
      <Col md={6}>
        <p className="text-center">
          <strong>Expected interaction</strong>
        </p>
        <Interaction {...mismatch.expected} previews={previews} failure={true} mismatchIdx={mismatch.index} />
      </Col>
      <Col md={6}>
        <p className="text-center">
          <strong>Actual interaction</strong>
        </p>
        <Interaction {...mismatch.received} previews={previews} failure={true} mismatchIdx={mismatch.index} />
      </Col>
    </Row>
  </Grid>
)
