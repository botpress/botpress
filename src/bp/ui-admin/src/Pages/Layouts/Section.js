import React, { Component, Fragment } from 'react'
import { Link } from 'react-router-dom'

import { MdInfoOutline } from 'react-icons/lib/md'

import { Container, Row, Col, Navbar, Nav, NavItem, NavLink, UncontrolledTooltip, Badge } from 'reactstrap'

class Section extends Component {
  renderBadge(displayBadge) {
    if (displayBadge) {
      return <Badge color="primary">Pro</Badge>
    }
    return null
  }

  isCommunity() {
    return process.env.EDITION === 'ce'
  }

  renderSectionHeader() {
    return (
      <Navbar className="bp-main-content-header__nav container">
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
        <header className="bp-main-content-header">{this.renderSectionHeader()}</header>
        <Container>
          <h2 className="bp-main-content__title">
            {this.props.title}
            {help}
          </h2>
          <Row>
            <Col xs={12} md={8}>
              {this.props.mainContent}
            </Col>
            <Col xs={12} md={4}>
              {this.props.sideMenu}
            </Col>
          </Row>
        </Container>
      </Fragment>
    )
  }
}

export default Section
