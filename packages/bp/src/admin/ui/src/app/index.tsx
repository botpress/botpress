import { Icon } from '@blueprintjs/core'
import { lang, TokenRefresher } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, Fragment, useEffect } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { Link } from 'react-router-dom'
import SplitPane from 'react-split-pane'

import api from '~/app/api'
import { fetchLicensing } from '~/management/licensing/reducer'
import { fetchLoadedModules, loadModulesTranslations } from '~/management/modules/reducer'
import { fetchProfile } from '~/user/reducer'
import BottomPanel from './BottomPanel'

import CommandPalette from './CommandPalette'
import EventBus from './EventBus'
import Header from './Header'
import Menu from './Menu'
import { AppState } from './rootReducer'
import StatusBar from './StatusBar'
import style from './style.scss'
import { toggleBottomPanel } from './uiReducer'

const EXPANDED_PANEL_HEIGHT = 200

type Props = ConnectedProps<typeof connector>

const App: FC<Props> = props => {
  useEffect(() => {
    props.fetchLicensing()
    props.fetchProfile()
    props.fetchLoadedModules()
    props.loadModulesTranslations()
    EventBus.default.setup()
  }, [])

  if (!props.profile) {
    return null
  }

  const isLicensed = !props.licensing || !props.licensing.isPro || props.licensing.status === 'licensed'

  const splitPanelLastSizeKey = 'bp::bottom-panel-size'
  const lastSize = parseInt(localStorage.getItem(splitPanelLastSizeKey) || '175', 10)
  const bottomPanelHeight = props.bottomPanelExpanded ? EXPANDED_PANEL_HEIGHT : lastSize
  const bottomBarSize = props.bottomPanel ? bottomPanelHeight : '100%'

  return (
    <Fragment>
      <CommandPalette />
      <TokenRefresher getAxiosClient={() => api.getSecured()} />

      <div className={cx('bp-sa-wrapper', style.mainLayout)}>
        <Menu />
        <div className={style.container}>
          <Header />
          <SplitPane
            split="horizontal"
            defaultSize={lastSize}
            onChange={size => size > 100 && localStorage.setItem(splitPanelLastSizeKey, size.toString())}
            size={bottomBarSize}
            maxSize={-100}
            className={cx(style.mainSplitPaneWToolbar)}
          >
            <div className={cx('bp-sa-content-wrapper', style.main)}>
              {!isLicensed && <Unlicensed />}
              {props.children}
            </div>
            <BottomPanel />
          </SplitPane>
        </div>
      </div>

      <StatusBar />
    </Fragment>
  )
}

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
  licensing: state.licensing.license,
  bottomPanel: state.ui.bottomPanel,
  bottomPanelExpanded: state.ui.bottomPanelExpanded
})

const connector = connect(mapStateToProps, {
  fetchLicensing,
  fetchProfile,
  toggleBottomPanel,
  fetchLoadedModules,
  loadModulesTranslations
})
export default connector(App)
