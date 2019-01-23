import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'

import { Container, TabContent, TabPane, Nav, NavItem, NavLink, Row, Col } from 'reactstrap'
import { MdHome, MdKeyboardArrowLeft } from 'react-icons/lib/md'
import { AccessControl } from '../../App/AccessControl'
import { fetchPermissions } from '../../reducers/user'

class TabLayout extends Component {
  state = {
    activeTab: null
  }

  componentDidMount() {
    !this.props.permissions && this.props.fetchPermissions()
    this.setState({ activeTab: this.props.tabs[0].name })
  }

  toggleTab = activeTab => {
    this.setState({ activeTab })
  }

  renderHomeTab() {
    return (
      <NavItem className="bringMeHome" onClick={() => this.props.history.push('/admin')}>
        <MdKeyboardArrowLeft />
        <MdHome />
      </NavItem>
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
                  {this.props.tabs.map(tab => (
                    <AccessControl
                      permissions={this.props.permissions}
                      resource={tab.resource}
                      operation={tab.operation}
                      key={tab.name}
                    >
                      <NavItem>
                        <NavLink
                          className={this.state.activeTab === tab.name ? 'active' : ''}
                          onClick={this.toggleTab.bind(this, tab.name)}
                        >
                          {tab.icon}
                          {tab.name}
                        </NavLink>
                      </NavItem>
                    </AccessControl>
                  ))}
                </Nav>
              </Col>
            </Row>
          </Container>
        </div>

        <Container>
          <Row>
            <Col xs={12} md={{ size: 10, offset: 1 }}>
              <TabContent activeTab={this.state.activeTab}>
                {this.props.tabs.map(tab => (
                  <TabPane tabId={tab.name} key={tab.name}>
                    {tab.component}
                  </TabPane>
                ))}
              </TabContent>
            </Col>
          </Row>
        </Container>
      </Fragment>
    )
  }
}

const mapStateToProps = state => ({
  permissions: state.user.permissions
})

const mapDispatchToProps = {
  fetchPermissions
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TabLayout)
