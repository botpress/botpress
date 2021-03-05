import classnames from 'classnames'
import React, { Component, Fragment } from 'react'
import { MdHome, MdKeyboardArrowLeft } from 'react-icons/md'
import { connect } from 'react-redux'
import { generatePath, Redirect, RouteComponentProps } from 'react-router'
import { matchPath, Route, Switch } from 'react-router-dom'
import { Col, Container, Nav, NavItem, NavLink, Row } from 'reactstrap'

import AccessControl, { isOperationAllowed } from '../../App/AccessControl'
import { fetchLicensing } from '../../reducers/license'

export interface AdminTab {
  id?: string
  name: string
  route: string
  icon: JSX.Element
  component: React.ReactNode
  /** Name of the resource in permissions */
  res?: string
  /** Type of operation: read or write */
  op?: 'read' | 'write'
  /** By default, the page size is 10 cols, but it can be overrided here */
  size?: number
  /** When true, tab is only displayed when pro is enabled in the workspace */
  proOnly?: boolean
  /** Overrides the width of the page to use all available space (eg: monitoring) */
  useFullWidth?: boolean
  offset?: number
}

type Props = {
  licensing: any
  fetchLicensing: () => void
  tabs: AdminTab[]
  showHome: boolean
  title: string
} & RouteComponentProps

class TabLayout extends Component<Props> {
  state = {
    activeTab: null
  }

  componentDidMount() {
    !this.props.licensing && this.props.fetchLicensing()
    this.setState({ activeTab: this.props.tabs[0].name })
  }

  updateRoute = (route: string) => this.props.history.push(generatePath(route, this.props.match.params))
  matchCurrentPath = (path: string) => matchPath(this.props.location.pathname, { path })
  getCurrentTab = () => this.props.tabs.find(tab => this.matchCurrentPath(tab.route))

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
      <AccessControl resource={tab.res} operation={tab.op} key={tab.name}>
        <NavItem>
          <NavLink
            id={tab.id}
            className={this.matchCurrentPath(tab.route) && 'active'}
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
    const currentTab = this.getCurrentTab()
    const useFullWidth = currentTab && currentTab.useFullWidth
    const size = (currentTab && currentTab.size) || 10
    const offset = (currentTab && currentTab.offset) || 1

    if (currentTab && currentTab.op && currentTab.res) {
      if (!isOperationAllowed({ operation: currentTab.op, resource: currentTab.res })) {
        return <Redirect to="/admin/workspace/bots" />
      }
    }

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
        <div className={classnames('bp_container-content', { 'bp_container-fullwidth': useFullWidth })}>
          <Container>
            <Row>
              <Col xs={12} md={{ size, offset }}>
                <Switch>
                  {this.props.tabs.map(tab => (
                    <Route path={tab.route} exact component={tab.component} key={tab.name} />
                  ))}
                </Switch>
              </Col>
            </Row>
          </Container>
        </div>
      </Fragment>
    )
  }
}

const mapStateToProps = state => ({
  licensing: state.license.licensing
})

const mapDispatchToProps = {
  fetchLicensing
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TabLayout)
