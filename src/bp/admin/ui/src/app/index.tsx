import { Alignment, Icon, Navbar } from '@blueprintjs/core'
import { lang, TokenRefresher } from 'botpress/shared'
import React, { FC, Fragment, useEffect } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { NavLink } from 'reactstrap'

import api from '~/app/api'
import { fetchLicensing } from '~/management/licensing/reducer'
import { fetchProfile } from '~/user/reducer'
import UserDropdownMenu from '~/user/UserDropdownMenu'

import CommandPalette from './CommandPalette'
import logo from './media/logo_white.png'
import Menu from './Menu'
import { AppState } from './rootReducer'
import WorkspaceSelect from './WorkspaceSelect'

type Props = ConnectedProps<typeof connector>

const App: FC<Props> = props => {
  useEffect(() => {
    props.fetchLicensing()
    props.fetchProfile()
  }, [])

  if (!props.profile) {
    return null
  }

  const isLicensed = !props.licensing || !props.licensing.isPro || props.licensing.status === 'licensed'

  return (
    <Fragment>
      <Header />
      <CommandPalette />
      <TokenRefresher getAxiosClient={() => api.getSecured()} />

      <div className="bp-sa-wrapper">
        <Menu />
        <div className="bp-sa-content-wrapper">
          {!isLicensed && <Unlicensed />}
          {props.children}
        </div>
      </div>

      <Footer version={window.APP_VERSION} />
    </Fragment>
  )
}

const Header = () => (
  <header className="bp-header">
    <Navbar>
      <Navbar.Group>
        <Navbar.Heading>
          <a href="admin/">
            <img src={logo} alt="logo" className="bp-header__logo" />
          </a>
        </Navbar.Heading>
      </Navbar.Group>

      <Navbar.Group align={Alignment.RIGHT}>
        <WorkspaceSelect />
        <Navbar.Divider />
        <UserDropdownMenu />
      </Navbar.Group>
    </Navbar>
  </header>
)

const Footer = props => (
  <footer className="statusBar">
    <div className="statusBar-item">{props.version}</div>
  </footer>
)

const Unlicensed = () => (
  <div className="bp-header__warning">
    <NavLink href="/admin/server/license">
      <Icon icon="warning-sign" />
      {lang.tr('admin.botpressIsNotLicensed')}
    </NavLink>
  </div>
)

const mapStateToProps = (state: AppState) => ({
  profile: state.user.profile,
  licensing: state.licensing.license
})

const connector = connect(mapStateToProps, { fetchLicensing, fetchProfile })
export default connector(App)
