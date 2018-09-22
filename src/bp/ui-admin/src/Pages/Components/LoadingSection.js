import React from 'react'
import { Row, Col } from 'reactstrap'

import loadingImage from '../../media/loading-circle.svg'

const LoadingSection = () => (
  <Row>
    <Col className="section" xs={12}>
      <div className="middle">
        <img src={loadingImage} alt="loading" />
      </div>
    </Col>
  </Row>
)

export default LoadingSection
