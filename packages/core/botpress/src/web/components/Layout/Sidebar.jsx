import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { NavLink } from 'react-router-dom'
import classnames from 'classnames'

import ReactSidebar from 'react-sidebar'
import SidebarHeader from './SidebarHeader'

import GhostChecker from '~/views/GhostContent/Checker'
import PermissionsChecker from './PermissionsChecker'

const style = require('./Sidebar.scss')

const BASIC_MENU_ITEMS = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    rule: { res: 'bot.information', op: 'read' },
    icon: 'dashboard'
  },
  window.GHOST_ENABLED && {
    name: 'Version Control',
    path: '/version-control',
    rule: { res: 'bot.ghost_content', op: 'read' },
    icon: 'content_copy',
    renderSuffix() {
      return <GhostChecker />
    }
  },
  {
    name: 'Content',
    path: '/content',
    rule: { res: 'bot.content', op: 'read' },
    icon: 'description'
  },
  {
    name: 'Flows',
    path: '/flows',
    rule: { res: 'bot.flows', op: 'read' },
    icon: 'device_hub'
  },
  {
    name: 'Middleware',
    path: '/middleware',
    rule: { res: 'bot.middleware.list', op: 'read' },
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

  renderModuleItem = module => {
    const path = `/modules/${module.name}`
    const iconPath = `/img/modules/${module.name}.png`
    const moduleIcon =
      module.menuIcon === 'custom' ? (
        <img className={classnames(style.customIcon, 'bp-custom-icon')} src={iconPath} />
      ) : (
        <i className="icon material-icons">{module.menuIcon}</i>
      )

    return (
      <li key={`menu_module_${module.name}`}>
        <NavLink to={path} title={module.menuText} activeClassName={style.active}>
          {moduleIcon}
          <span>{module.menuText}</span>
        </NavLink>
      </li>
    )
  }

  renderBasicItem = ({ name, path, rule, icon, renderSuffix }) => {
    return (
      <PermissionsChecker user={this.props.user} res={rule.res} op={rule.op} key={name}>
        <li key={path}>
          <NavLink to={path} title={name} activeClassName={style.active}>
            <i className="icon material-icons">{icon}</i>
            {name}
            {renderSuffix && renderSuffix()}
          </NavLink>
        </li>
      </PermissionsChecker>
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

const mapStateToProps = state => ({
  user: state.user,
  viewMode: state.ui.viewMode,
  modules: state.modules
})

export default connect(mapStateToProps)(Sidebar)
