import React, { Component } from 'react'

import { MdInfoOutline } from 'react-icons/lib/md'

import { Row, Col, UncontrolledTooltip } from 'reactstrap'

class Section extends Component {
  render() {
    const help = this.props.helpText ? (
      <span>
        <MdInfoOutline id={`help${this.props.activePage}`} className="section-title-help" />
        <UncontrolledTooltip placement="right" target={`help${this.props.activePage}`}>
          {this.props.helpText}
        </UncontrolledTooltip>
      </span>
    ) : null

    return (
      <div className="bp-main-content-main">
        <Row>
          <Col xs={12} md={10}>
            <h2 className="bp-main-content__title">
              {this.props.title}
              {help}
            </h2>
          </Col>
        </Row>
        <Row>
          <Col xs={10}>{this.props.mainContent}</Col>
          <Col xs={2} md={2}>
            {this.props.sideMenu}
          </Col>
        </Row>
      </div>
    )
  }
}

export default Section
