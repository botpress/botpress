import React from 'react'
import { Row, Col } from 'reactstrap'

import loading from '../../media/loading-circle.svg'

export default props => (
  <Row>
    <Col className="section" xs={12}>
      <div className="middle">
        <img src={loading} alt="loading" />
      </div>
    </Col>
  </Row>
)
