import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { Container, Nav, NavItem, NavLink, Row, Col } from 'reactstrap'
import { MdHome, MdKeyboardArrowLeft } from 'react-icons/lib/md'
import { AccessControl } from '../../App/AccessControl'
import { fetchPermissions } from '../../reducers/user'
import { fetchLicensing } from '../../reducers/license'
import { Switch, Route } from 'react-router-dom'

class TabLayout extends Component {
  state = {
    activeTab: null
  }

  componentDidMount() {
    !this.props.permissions && this.props.fetchPermissions()
    !this.props.licensing && this.props.fetchLicensing()
    this.setState({ activeTab: this.props.tabs[0].name })
  }

  updateRoute = route => this.props.history.push(route)

  renderHomeTab() {
    return (
      <NavItem className="bringMeHome" onClick={() => this.props.history.push('/admin')}>
        <MdKeyboardArrowLeft />
        <MdHome />
      </NavItem>
    )
  }

  renderNavItem(tab) {
    if (!this.props.licensing || (tab.proOnly && !this.props.licensing.isPro)) {
      return null
    }

    return (
      <AccessControl permissions={this.props.permissions} resource={tab.res} operation={tab.op} key={tab.name}>
        <NavItem>
          <NavLink
            className={this.props.location.pathname === tab.route ? 'active' : ''}
            onClick={() => this.updateRoute(tab.route)}
          >
            {tab.icon}
            {tab.name}
          </NavLink>
        </NavItem>
      </AccessControl>
    )
  }

  render() {
    return (
      <Fragment>
        <div className="bp_container-header">
          <Container>
            <Row>
              <Col xs={12} md={{ size: 10, offset: 1 }}>
                <h2 className="bp-main-content__title">{this.props.title}</h2>
              </Col>
            </Row>
            <Row>
              <Col xs={12} md={{ size: 10, offset: 1 }}>
                <Nav tabs className="bp_container-tabs">
                  {this.props.showHome && this.renderHomeTab()}
                  {this.props.tabs.map(tab => this.renderNavItem(tab))}
                </Nav>
              </Col>
            </Row>
          </Container>
        </div>

        <Container>
          <Row>
            <Col xs={12} md={{ size: 10, offset: 1 }}>
              <Switch>
                {this.props.tabs.map(tab => (
                  <Route path={tab.route} exact component={tab.component} key={tab.name} />
                ))}
              </Switch>
            </Col>
          </Row>
        </Container>
      </Fragment>
    )
  }
}

const mapStateToProps = state => ({
  permissions: state.user.permissions,
  licensing: state.license.licensing
})

const mapDispatchToProps = {
  fetchPermissions,
  fetchLicensing
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TabLayout)
