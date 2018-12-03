import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import classnames from 'classnames'
import { ToastContainer } from 'react-toastify'
import { Route, Switch, Redirect } from 'react-router-dom'

import Header from './Header'
import Sidebar from './Sidebar'
import SidebarFooter from './SidebarFooter'

import SelectContentManager from '~/components/Content/Select/Manager'
import Content from '~/views/Content'
import GhostContent from '~/views/GhostContent'
import FlowBuilder from '~/views/FlowBuilder'
import Module from '~/views/Module'
import Notifications from '~/views/Notifications'
import Logs from '~/views/Logs'
import BackendToast from '~/components/Util/BackendToast'

import PluginInjectionSite from '~/components/PluginInjectionSite'

import { viewModeChanged } from '~/actions'

import style from './style.scss'

class Layout extends React.Component {
  componentDidMount() {
    const viewMode = this.props.location.query && this.props.location.query.viewMode

    setImmediate(() => {
      this.props.viewModeChanged(viewMode || 0)
    })
  }

  render() {
    if (this.props.viewMode < 0) {
      return null
    }

    const hasHeader = this.props.viewMode <= 2
    const classNames = classnames({
      [style.container]: hasHeader,
      'bp-container': hasHeader
    })

    return (
      <div className="wrapper bp-wrapper">
        {/* <ToastContainer position="bottom-right" /> */}
        <Sidebar>
          <Header />
          <section className={classNames}>
            <Switch>
              <Route exact path="/" render={() => <Redirect to="/flows" />} />
              <Route exact path="/content" component={Content} />
              <Route exact path="/version-control" component={GhostContent} />
              <Route exact path="/flows/:flow*" component={FlowBuilder} />
              <Route exact path="/modules/:moduleName/:subView?" component={Module} />
              <Route exact path="/notifications" component={Notifications} />
              <Route exact path="/logs" component={Logs} />
            </Switch>
          </section>
        </Sidebar>
        {/* <SidebarFooter /> */}
        {/* <PluginInjectionSite site="overlay" /> */}
        {/* <SelectContentManager /> */}
        {/* <BackendToast /> */}
        <footer className={style.statusBar}>
          <span className={style.statusBar__version}>Botpress v.2029</span>
          <span className={style.statusBar__botName}>Hello-bot</span>
          <span className={style.statusBar__separator} />
          <div className={style.statusBarTabs}>
            <button className="window-trigger">
              <span className="window-trigger__shortcut">L</span>
              Console Log
              <span className="window-trigger__badge">4</span>
            </button>
          </div>
        </footer>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  license: state.license,
  viewMode: state.ui.viewMode
})

const mapDispatchToProps = dispatch => bindActionCreators({ viewModeChanged }, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Layout)
