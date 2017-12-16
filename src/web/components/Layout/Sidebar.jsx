import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { Link } from 'react-router'
import classnames from 'classnames'

import ReactSidebar from 'react-sidebar'
import SidebarHeader from './SidebarHeader'
import RulesChecker from '+/views/RulesChecker'

import GhostChecker from '~/views/GhostContent/Checker'

const style = require('./Sidebar.scss')

const BASIC_MENU_ITEMS = [
  {
    name: 'Dashboard',
    path: 'dashboard',
    activePaths: ['', '/', '/dashboard'],
    rule: { res: 'dashboard', op: 'read' },
    icon: 'dashboard'
  },
  {
    name: 'Modules',
    path: 'manage',
    activePaths: ['/manage'],
    rule: { res: 'modules/list', op: 'read' },
    icon: 'dashboard'
  },
  window.GHOST_ENABLED && {
    name: 'Ghost Content',
    path: 'ghost-content',
    activePaths: ['/ghost-content'],
    rule: { res: 'ghost_content', op: 'read' },
    icon: 'content_copy',
    renderSuffix: () => <GhostChecker />
  },
  {
    name: 'Content',
    path: 'content',
    activePaths: ['/content'],
    rule: { res: 'content', op: 'read' },
    icon: 'description'
  },
  {
    name: 'Flows',
    path: 'flows',
    activePaths: ['/flows'],
    rule: { res: 'flows', op: 'read' },
    icon: 'device_hub'
  },
  {
    name: 'Middleware',
    path: 'middleware',
    activePaths: ['/middleware'],
    rule: { res: 'middleware', op: 'read' },
    icon: 'settings'
  }
].filter(Boolean)

class Sidebar extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  state = {
    sidebarOpen: false,
    sidebarDocked: false
  }

  onSetSidebarOpen = open => {
    this.setState({ sidebarOpen: open })
  }

  componentWillMount() {
    const mql = window.matchMedia(`(min-width: 800px)`)
    mql.addListener(this.mediaQueryChanged)
    this.setState({ mql: mql, sidebarDocked: mql.matches })
  }

  componentWillUnmount() {
    this.state.mql.removeListener(this.mediaQueryChanged)
  }

  mediaQueryChanged = () => {
    this.setState({ sidebarDocked: this.state.mql.matches })
  }

  routeActive(paths) {
    paths = Array.isArray(paths) ? paths : [paths]
    for (const p in paths) {
      if (this.context.router.isActive(paths[p])) {
        return true
      }
    }

    return false
  }

  renderModuleItem = module => {
    const path = `/modules/${module.name}`
    const iconPath = `/img/modules/${module.name}.png`

    const classNames = this.getActiveClassNames(this.routeActive(path))

    const hasCustomIcon = module.menuIcon === 'custom'
    const moduleIcon = hasCustomIcon ? (
      <img className={classnames(style.customIcon, 'bp-custom-icon')} src={iconPath} />
    ) : (
      <i className="icon material-icons">{module.menuIcon}</i>
    )

    return (
      <li key={`menu_module_${module.name}`} className={classNames}>
        <Link to={path} title={module.menuText}>
          {moduleIcon}
          <span>{module.menuText}</span>
        </Link>
      </li>
    )
  }

  getActiveClassNames = condition =>
    classnames({
      'bp-sidebar-active': condition,
      [style.active]: condition
    })

  renderBasicItem = ({ name, path, activePaths, rule, icon, renderSuffix }) => {
    const isAt = paths => paths.includes(location.pathname)

    const className = this.getActiveClassNames(isAt(activePaths))

    return (
      <RulesChecker res={rule.res} op={rule.op} key={name}>
        <li className={className} key={path}>
          <Link to={path} title={name}>
            <i className="icon material-icons">{icon}</i>
            {name}
            {renderSuffix && renderSuffix()}
          </Link>
        </li>
      </RulesChecker>
    )
  }

  render() {
    const modules = this.props.modules
    const moduleItems = modules.filter(x => !x.noInterface).map(this.renderModuleItem)

    const emptyClassName = classnames(style.empty, 'bp-empty')

    const sidebarContent = (
      <div className={classnames(style.sidebar, 'bp-sidebar')}>
        <SidebarHeader />
        <ul className="nav">
          {BASIC_MENU_ITEMS.map(this.renderBasicItem)}
          {moduleItems}
          <li className={emptyClassName} />
        </ul>
      </div>
    )

    const isOpen = this.props.viewMode < 1

    return (
      <ReactSidebar
        sidebarClassName={classnames(style.sidebarReact, 'bp-sidebar-react')}
        sidebar={sidebarContent}
        open={isOpen}
        docked={isOpen}
        shadow={false}
        transitions={false}
        styles={{ sidebar: { zIndex: 20 } }}
        onSetOpen={this.onSetSidebarOpen}
      >
        {this.props.children}
      </ReactSidebar>
    )
  }
}

const mapStateToProps = state => ({ viewMode: state.ui.viewMode, modules: state.modules })

export default connect(mapStateToProps)(Sidebar)
