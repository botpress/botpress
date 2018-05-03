import React, { Component } from 'react'
import PropTypes from 'prop-types'

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
  modules: getters.modules,
  UI: getters.UI
}))

class Sidebar extends Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
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

  renderModuleItem(module) {
    const path = `/modules/${module.name}`
    const iconPath = `/img/modules/${module.name}.png`

    const classNames = this.getActiveClassNames(this.routeActive(path))

    const hasCustomIcon = module.menuIcon === 'custom'
    const moduleIcon = hasCustomIcon
      ? <img className={classnames(style.customIcon, 'bp-custom-icon')} src={iconPath} />
      : <i className="icon material-icons">{module.menuIcon}</i>

    return <li key={`menu_module_${module.name}`} className={classNames}>
      <Link to={path} title={module.menuText}>
        {moduleIcon}
        <span>{module.menuText}</span>
      </Link>
    </li>
  }

  getActiveClassNames = (condition) => {
    return classnames({
      'bp-sidebar-active': condition,
      [style.active]: condition
    })
  }
  
  renderBasicItem(name, path, rule, activePaths, icon) {
    const isAt = (paths) => {
      return paths.includes(location.pathname)
    }

    const className = this.getActiveClassNames(isAt(activePaths))

    return <RulesChecker res={rule.res} op={rule.op}>
      <li className={className} key={path}>
        <Link to={path} title={name}>
          <i className="icon material-icons">{icon}</i>
          {name}
        </Link>
      </li>
    </RulesChecker>
  }

  render() {

    const modules = this.props.modules
    const items = modules.toJS().filter(x => !x.noInterface).map(this.renderModuleItem)

    const emptyClassName = classnames({
      [style.empty]: true,
      'bp-empty': true
    })

    const dashboardRules = { res:'dashboard', op:'read' }
    const modulesRules = { res:'modules/list', op:'read' }
    const ummRules = { res:'umm', op:'read' }
    const contentRules = { res: 'content', op:'read' }
    const middlewareRules = { res:'middleware', op:'read' }

    const dashboardPaths = ['', '/', '/dashboard']
    const modulesPaths = ['/manage']
    const ummPaths = ['/umm']
    const contentPaths = ['/content']
    const middlewarePaths = ['/middleware']

    const sidebarContent = <div className={classnames(style.sidebar, 'bp-sidebar')}>
      <SidebarHeader/>
      <ul className="nav">
        {this.renderBasicItem('Dashboard', 'dashboard', dashboardRules, dashboardPaths, 'dashboard')}
        {this.renderBasicItem('Modules', 'manage', modulesRules, modulesPaths, 'build')}
        {/*this.renderBasicItem('UMM', 'umm', ummRules, ummPaths, 'code')*/}
        {this.renderBasicItem('Content', 'content', contentRules, contentPaths, 'create')}
        {this.renderBasicItem('Middleware', 'middleware', middlewareRules, middlewarePaths, 'settings')}
        {items}
        <li className={emptyClassName} key="empty"></li>
      </ul>
    </div>

    const isOpen = this.props.UI.get('viewMode') < 1

    return (
      <ReactSidebar
        sidebarClassName={classnames(style.sidebarReact, 'bp-sidebar-react')}
        sidebar={sidebarContent}
        open={isOpen}
        docked={isOpen}
        shadow={false}
        transitions={false}
        styles={{ sidebar: { zIndex: 20 } }}
        onSetOpen={this.onSetSidebarOpen}>
        {this.props.children}
      </ReactSidebar>
    )
  }
}

Sidebar.contextTypes = {
  reactor: PropTypes.object.isRequired
}

export default Sidebar
