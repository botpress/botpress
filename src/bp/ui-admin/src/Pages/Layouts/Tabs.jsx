import React, { Component } from 'react'

import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col } from 'reactstrap'

class TabLayout extends Component {
  state = {
    activeTab: null
  }

  componentDidMount() {
    this.setState({ activeTab: this.props.tabs[0].name })
  }

  toggleTab = activeTab => {
    this.setState({ activeTab })
  }

  render() {
    return (
      <div className="bp-main-content-main">
        <Row>
          <Col xs={12} md={{ size: 10, offset: 1 }}>
            <h2 className="bp-main-content__title">{this.props.title}</h2>
          </Col>
        </Row>
        <Row>
          <Col xs={12} md={{ size: 10, offset: 1 }}>
            <Nav tabs>
              {this.props.tabs.map(tab => (
                <NavItem key={tab.name}>
                  <NavLink
                    className={this.state.activeTab === tab.name ? 'active' : ''}
                    onClick={this.toggleTab.bind(this, tab.name)}
                  >
                    {tab.name}
                  </NavLink>
                </NavItem>
              ))}
            </Nav>
            <TabContent activeTab={this.state.activeTab}>
              {this.props.tabs.map(tab => (
                <TabPane tabId={tab.name} key={tab.name}>
                  {tab.component}
                </TabPane>
              ))}
            </TabContent>
          </Col>
        </Row>
      </div>
    )
  }
}

export default TabLayout
