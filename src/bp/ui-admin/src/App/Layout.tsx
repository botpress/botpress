import { Icon } from '@blueprintjs/core'
import axios from 'axios'
import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { Nav, Navbar, NavbarBrand, NavLink } from 'reactstrap'

import logo from '../media/logo_white.png'
import { fetchLicensing } from '../reducers/license'

import UserDropdownMenu from './UserDropdownMenu'

interface Props {
  licensing: any
  fetchLicensing: any
}

class App extends Component<Props> {
  state = { version: '' }

  componentDidMount() {
    !this.props.licensing && this.props.fetchLicensing()

    // tslint:disable-next-line: no-floating-promises
    axios
      .get('/version', { baseURL: process.env.REACT_APP_API_URL })
      .then(({ data }) => this.setState({ version: data }))
  }

  render() {
    return (
      <Fragment>
        <header className="bp-header">
          <Navbar expand="md">
            <NavbarBrand href="admin/">
              <img src={logo} alt="logo" className="bp-header__logo" />
            </NavbarBrand>

            <Nav className="ml-auto" navbar>
              <UserDropdownMenu />
            </Nav>
          </Navbar>
        </header>
        {this.renderUnlicensed()}
        <div className="bp-main-content">{this.props.children}</div>
        <footer className="statusBar">
          <div className="statusBar-list">
            <div className="statusBar-item">
              <strong>v{this.state.version}</strong>
            </div>
          </div>
        </footer>
      </Fragment>
    )
  }

  renderUnlicensed() {
    const isLicensed =
      !this.props.licensing || !this.props.licensing.isPro || this.props.licensing.status === 'licensed'

    if (isLicensed) {
      return null
    }

    return (
      <div className="bp-header__warning">
        <NavLink href="/admin/server/license">
          <Icon icon="warning-sign" />
          Botpress is currently not licensed. Please update your license to re-enable all features.
        </NavLink>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  profile: state.user.profile,
  licensing: state.license.licensing
})

const mapDispatchToProps = {
  fetchLicensing
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App)
