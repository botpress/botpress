import React from 'react'

import { Row, Col, Grid } from 'react-bootstrap'

import style from './style.scss'
import Interaction from './Interaction'

class FailureReport extends React.Component {
  render() {
    return (
      <Grid fluid={true}>
        <Row>
          <h4>Failure report</h4>
          <Col md={12}>
            <p>
              Failed to complete scenario at interaction <strong>#{this.props.failureIdx}</strong>. Skipped{' '}
              <strong>{this.props.skipped}</strong> remaining interactions
            </p>
            <p>
              <strong>Reason:&nbsp;</strong> {this.props.mismatch.reason}
            </p>
          </Col>
        </Row>
        <Row className={style.reportInteractions}>
          <Col md={6}>
            <p className="text-center">
              <strong>Expected interaction</strong>
            </p>
            <Interaction
              {...this.props.mismatch.expected}
              contentElements={this.props.contentElements}
              failure={true}
              mismatchIdx={this.props.mismatch.index}
            />
          </Col>
          <Col md={6}>
            <p className="text-center">
              <strong>Actual interaction</strong>
            </p>
            <Interaction
              {...this.props.mismatch.received}
              contentElements={this.props.contentElements}
              failure={true}
              mismatchIdx={this.props.mismatch.index}
            />
          </Col>
        </Row>
      </Grid>
    )
  }
}

export default FailureReport
