import React, { Component, Fragment } from 'react'
import { Link } from 'react-router-dom'

import { MdInfoOutline } from 'react-icons/lib/md'

import { Row, Col, Navbar, Nav, NavItem, NavLink, UncontrolledTooltip, Badge } from 'reactstrap'

class Section extends Component {
  renderBadge(displayBadge) {
    if (displayBadge) {
      return <Badge color="primary">Pro</Badge>
    }
    return null
  }

  isCommunity() {
    return this.props.license && this.props.license.edition === 'ce'
  }

  renderSectionHeader() {
    return (
      <Navbar className="bp-main-content-sidebar__nav">
        <Nav>
          {this.props.sections &&
            this.props.sections.map(section => (
              <NavItem key={section.title} active={section.active}>
                <NavLink
                  className="btn-sm"
                  tag={Link}
                  disabled={section.disabled || section.active || this.isCommunity()}
                  to={section.link}
                >
                  {section.title} {section.hasBadge && this.renderBadge(this.isCommunity())}
                </NavLink>
              </NavItem>
            ))}
        </Nav>
      </Navbar>
    )
  }

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
        <aside className="bp-main-content-sidebar">{this.renderSectionHeader()}</aside>
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
