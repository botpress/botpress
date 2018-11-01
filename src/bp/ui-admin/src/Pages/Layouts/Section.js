import React, { Component, Fragment } from 'react'

import { MdInfoOutline } from 'react-icons/lib/md'
import Menu from '../Components/Menu'

import { Row, Col, UncontrolledTooltip } from 'reactstrap'

class Section extends Component {
  render() {
    const help = this.props.helpText ? (
      <span>
        <MdInfoOutline id="sectionTitleHelp" className="section-title-help" />
        <UncontrolledTooltip placement="right" target="sectionTitleHelp">
          {this.props.helpText}
        </UncontrolledTooltip>
      </span>
    ) : null

    return (
      <Fragment>
        <aside className="bp-main-content-sidebar">
          <Menu activePage={this.props.activePage} currentTeam={this.props.currentTeam} />
        </aside>
        <div className="bp-main-content-main">
          <Row>
            <Col xs={12} md={10}>
              <h2 className="bp-main-content__title">
                {this.props.title}
                {help}
              </h2>
            </Col>
            <Col xs={12} md={2}>
              {this.props.sideMenu}
            </Col>
          </Row>
          <Row>
            <Col xs={12} md={10}>
              {this.props.mainContent}
            </Col>
          </Row>
        </div>
      </Fragment>
    )
  }
}

export default Section
