import React, { Component } from 'react'
import { Link } from 'react-router'
import classnames from 'classnames'

import ReactSidebar from 'react-sidebar'
import { connect } from 'nuclear-js-react-addons'

import SidebarHeader from './SidebarHeader'
import SidebarFooter from './SidebarFooter'
import getters from '~/stores/getters'
import actions from '~/actions'

import RulesChecker from '+/views/RulesChecker'

const style = require('./Sidebar.scss')

@connect(props => ({
  modules: getters.modules
}))

class Sidebar extends Component {

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }

  constructor(props, context) {
    super(props, context)

    this.state = {
      sidebarOpen: false,
      sidebarDocked: false
    }

    this.onSetSidebarOpen = this.onSetSidebarOpen.bind(this)
    this.mediaQueryChanged = this.mediaQueryChanged.bind(this)
    this.renderModuleItem = this.renderModuleItem.bind(this)
  }

  onSetSidebarOpen(open) {
    this.setState({ sidebarOpen: open })
  }

  componentWillMount() {
    var mql = window.matchMedia(`(min-width: 800px)`)
    mql.addListener(this.mediaQueryChanged)
    this.setState({ mql: mql, sidebarDocked: mql.matches })
  }

  componentWillUnmount() {
    this.state.mql.removeListener(this.mediaQueryChanged)
  }

  mediaQueryChanged() {
    this.setState({ sidebarDocked: this.state.mql.matches })
  }

  routeActive(paths) {
    paths = Array.isArray(paths) ? paths : [paths]
    for (let p in paths) {
      if (this.context.router.isActive(paths[p])) {
        return true
      }
    }

    return false
  }

  isAtDashboard() {
    return ['', '/', '/dashboard'].includes(location.pathname)
  }

  isAtManage() {
    return ['/manage'].includes(location.pathname)
  }

  isAtMiddleware() {
    return ['/middleware'].includes(location.pathname)
  }

  getActiveClassNames = (condition) => {
    return classnames({
      'bp-sidebar-active': condition,
      [style.active]: condition
    })
  }

  renderModuleItem(module) {
    const path = `/modules/${module.name}`
    const iconPath = `/img/modules/${module.name}.png`

    const classNames = this.getActiveClassNames(this.routeActive(path))

    const hasCustomIcon = module.menuIcon === 'custom'
    const moduleIcon = hasCustomIcon
      ? <img className={style.customIcon} src={iconPath} />
      : <i className="icon material-icons">{module.menuIcon}</i>

    return <li key={`menu_module_${module.name}`} className={classNames}>
      <Link to={path} title={module.menuText}>
        {moduleIcon}
        <span>{module.menuText}</span>
      </Link>
    </li>
  }

  render() {

    const modules = this.props.modules
    const items = modules.toJS().filter(x => !x.noInterface).map(this.renderModuleItem)
    const dashboardClassName = this.getActiveClassNames(this.isAtDashboard())
    const manageClassName = this.getActiveClassNames(this.isAtManage())
    const middlewareClassName = this.getActiveClassNames(this.isAtMiddleware())

    const sidebarContent = <div className={classnames(style.sidebar, 'bp-sidebar')}>
      <SidebarHeader/>
      <ul className="nav">
        <RulesChecker res='dashboard' op='read'>
          <li className={dashboardClassName} key="dashboard">
            <Link to='dashboard' title='Dashboard'>
              <i className="icon material-icons">dashboard</i>
              Dashboard
            </Link>
          </li>
        </RulesChecker>
        <RulesChecker res='modules/list' op='read'>
          <li className={manageClassName} key="manage">
            <Link to='manage' title='Modules'>
              <i className="icon material-icons">build</i>
              Modules
            </Link>
          </li>
        </RulesChecker>
        <RulesChecker res='middleware' op='read'>
          <li className={middlewareClassName} key="middleware">
            <Link to='middleware' title='Middleware'>
              <i className="icon material-icons">settings</i>
              Middleware
            </Link>
          </li>
        </RulesChecker>
        {items}
      </ul>
      <SidebarFooter />
    </div>

    const { sidebarOpen: open, sidebarDocked: docked } = this.state

    return (
      <ReactSidebar
        sidebar={sidebarContent}
        open={open}
        docked={docked}
        shadow={false}
        styles={{ sidebar: { zIndex: 20 } }}
        onSetOpen={this.onSetSidebarOpen}>
        {this.props.children}
      </ReactSidebar>
    )
  }
}

Sidebar.contextTypes = {
  reactor: React.PropTypes.object.isRequired
}

export default Sidebar
