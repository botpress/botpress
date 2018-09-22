import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import { MdInfoOutline } from 'react-icons/lib/md'

import { Container, Row, Col, Navbar, Nav, NavItem, NavLink, UncontrolledTooltip } from 'reactstrap'

class Section extends Component {
  renderSectionHeader() {
    return (
      <Navbar className="section-header">
        <Nav>
          {this.props.sections &&
            this.props.sections.map(section => (
              <NavItem key={section.title} active={section.active}>
                <NavLink tag={Link} disabled={section.disabled || section.active} to={section.link}>
                  {section.title}
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
      <div>
        {this.renderSectionHeader()}
        <Container>
          <h2 style={{ marginBottom: '16px' }}>
            {this.props.title}
            {help}
          </h2>
          <Row>
            <Col xs={12} md={8} className="mainContent">
              {this.props.mainContent}
            </Col>
            <Col xs={12} md={4} className="section-menu">
              {this.props.sideMenu}
            </Col>
          </Row>
        </Container>
      </div>
    )
  }
}

export default Section
