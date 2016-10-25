import React, {Component} from 'react'
import {Link} from 'react-router'

import ReactSidebar from 'react-sidebar'
import {connect} from 'nuclear-js-react-addons'

import SidebarHeader from './SidebarHeader'
import getters from '~/getters'

const style = require('./Sidebar.scss')

@connect(props => ({ modules: getters.modules }))
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
    this.setState({sidebarOpen: open});
  }

  componentWillMount() {
    var mql = window.matchMedia(`(min-width: 800px)`);
    mql.addListener(this.mediaQueryChanged);
    this.setState({mql: mql, sidebarDocked: mql.matches});
  }

  componentWillUnmount() {
    this.state.mql.removeListener(this.mediaQueryChanged);
  }

  mediaQueryChanged() {
    this.setState({sidebarDocked: this.state.mql.matches});
  }

  routeActive(paths) {
    paths = Array.isArray(paths) ? paths : [paths]
    for (let p in paths) {
      if (this.context.router.isActive(paths[p]) === true)
      return true
    }
    return false
  }

  isAtHome() {
    return location.pathname === ''
      || location.pathname === '/'
      || location.pathname === '/home'
  }

  renderModuleItem(module) {
    const path = `/modules/${module.name}`
    return <li key={`menu_module_${module.name}`} className={this.routeActive(path)
      ? style.active
      : ''}>
      <Link to={path} title={module.menuText}>
        <em className={module.menuIcon || 'icon-puzzle'}></em>
        <span>{module.menuText}</span>
      </Link>
    </li>
  }

  render() {
    const modules = this.props.modules
    console.log(modules)
    const items = modules.toJS().map(this.renderModuleItem)

    const sidebarContent = <div>
      <SidebarHeader/>
      <ul className="nav">
        <li key="menu_home" className={this.isAtHome() ? style.active : '' }>
          <Link to='home' title='Home'>
            <span>Home</span>
          </Link>
        </li>
        <li className="nav-heading ">
          <span>Modules</span>
        </li>
        {items || this.renderLoading()}
      </ul>
    </div>

    return (
      <ReactSidebar sidebar={sidebarContent} open={this.state.sidebarOpen} docked={this.state.sidebarDocked} onSetOpen={this.onSetSidebarOpen}>
        {this.props.children}
      </ReactSidebar>
    )
  }
}

Sidebar.contextTypes = {
  reactor: React.PropTypes.object.isRequired
}

export default Sidebar
