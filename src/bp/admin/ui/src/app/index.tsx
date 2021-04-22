import { Alignment, Icon, Navbar } from '@blueprintjs/core'
import { lang, TokenRefresher } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, Fragment, useEffect } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { Link } from 'react-router-dom'

import api from '~/app/api'
import { fetchLicensing } from '~/management/licensing/reducer'
import { fetchProfile } from '~/user/reducer'
import UserDropdownMenu from '~/user/UserDropdownMenu'

import CommandPalette from './CommandPalette'
import EventBus from './EventBus'
import logo from './media/logo_white.png'
import Menu from './Menu'
import { AppState } from './rootReducer'
import style from './style.scss'
import WorkspaceSelect from './WorkspaceSelect'

type Props = ConnectedProps<typeof connector>

const App: FC<Props> = props => {
  useEffect(() => {
    props.fetchLicensing()
    props.fetchProfile()
    EventBus.default.setup()
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

      <div className={cx('bp-sa-wrapper', style.wrapper)}>
        <Menu />
        <div className={cx('bp-sa-content-wrapper', style.content_wrapper)}>
          {!isLicensed && <Unlicensed />}
          {props.children}
        </div>
      </div>

      <Footer version={window.APP_VERSION} />
    </Fragment>
  )
}

const Header = () => (
  <header className={cx('bp-header', style.header)}>
    <Navbar>
      <Navbar.Group>
        <Navbar.Heading>
          <a href="admin/">
            <img src={logo} alt="logo" className={cx('bp-header__logo', style.logo)} />
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
  <footer className={cx('statusBar', style.statusBar)}>
    <div>{props.version}</div>
  </footer>
)

const Unlicensed = () => (
  <div className={style.unlicensed}>
    <Link to="/server/license">
      <Icon icon="warning-sign" />
      {lang.tr('admin.botpressIsNotLicensed')}
    </Link>
  </div>
)

const mapStateToProps = (state: AppState) => ({
  profile: state.user.profile,
  licensing: state.licensing.license
})

const connector = connect(mapStateToProps, { fetchLicensing, fetchProfile })
export default connector(App)
