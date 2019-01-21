import React, { Component } from 'react'
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col } from 'reactstrap'

import SectionLayout from '../Layouts/Section'
import LoadingSection from '../Components/LoadingSection'
import Versioning from './VersioningTab'
import LicenseStatusTab from './LicenseStatusTab'

class ServerSettings extends Component {
  state = {
    loading: false,
    activeTab: 1
  }

  toggle = activeTab => {
    this.setState({ activeTab })
  }

  renderContent = () => (
    <div>
      <Nav tabs>
        <NavItem>
          <NavLink
            className={this.state.activeTab === 1 ? 'active' : ''}
            onClick={() => {
              this.toggle(1)
            }}
          >
            Server License
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={this.state.activeTab === 2 ? 'active' : ''}
            onClick={() => {
              this.toggle(2)
            }}
          >
            Version control
          </NavLink>
        </NavItem>
      </Nav>
      <TabContent activeTab={this.state.activeTab}>
        <TabPane tabId={1}>
          <LicenseStatusTab />
        </TabPane>
        <TabPane tabId={2}>
          <Versioning />
        </TabPane>
      </TabContent>
    </div>
  )

  render() {
    return (
      <SectionLayout
        title="Server settings"
        activePage="settings"
        mainContent={this.state.loading ? <LoadingSection /> : this.renderContent()}
      />
    )
  }
}
export default ServerSettings
