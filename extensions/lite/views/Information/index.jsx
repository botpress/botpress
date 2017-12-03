import React, { Component } from 'react'
import { Row, Col } from 'react-bootstrap'

import InformationComponent from '~/components/Information'
import HeroComponent from '~/components/Hero'

class InformationHeroRowComponent extends Component {
  render() {
    return (
      <Row>
        <Col sm={12} md={8}>
          <InformationComponent />
        </Col>
        <Col xs={12} sm={8} md={4} smOffset={2} mdOffset={0}>
          <HeroComponent />
        </Col>
      </Row>
    )
  }
}

export default InformationHeroRowComponent
