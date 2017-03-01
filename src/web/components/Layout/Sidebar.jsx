import React, {Component} from 'react'
import {Link} from 'react-router'
import classnames from 'classnames'

import ReactSidebar from 'react-sidebar'
import {connect} from 'nuclear-js-react-addons'

import SidebarHeader from './SidebarHeader'
import getters from '~/stores/getters'
import actions from '~/actions'

const style = require('./Sidebar.scss')

@connect(props => ({
  modules: getters.modules,
  botInformation: getters.botInformation
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
    this.openLicenseComponent = this.openLicenseComponent.bind(this)
  }

  onSetSidebarOpen(open) {
    this.setState({sidebarOpen: open})
  }

  componentWillMount() {
    var mql = window.matchMedia(`(min-width: 800px)`)
    mql.addListener(this.mediaQueryChanged)
    this.setState({mql: mql, sidebarDocked: mql.matches})
  }

  componentWillUnmount() {
    this.state.mql.removeListener(this.mediaQueryChanged)
  }

  mediaQueryChanged() {
    this.setState({sidebarDocked: this.state.mql.matches})
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

  renderModuleItem(module) {
    const path = `/modules/${module.name}`
    const iconPath = `/img/modules/${module.name}.png`
    const className = classnames({
      [style.active]: this.routeActive(path),
      'bp-sidebar-active': this.routeActive(path)
    })
    const hasCustomIcon = module.menuIcon === 'custom'
    const moduleIcon = hasCustomIcon
      ? <img className={style.customIcon} src={iconPath} />
      : <i className="icon material-icons">{module.menuIcon}</i>

    return <li key={`menu_module_${module.name}`} className={className}>
      <Link to={path} title={module.menuText}>
        {moduleIcon}
        <span>{module.menuText}</span>
      </Link>
    </li>
  }

  openLicenseComponent() {
    actions.toggleLicenseModal()
  }

  openAbout() {
    actions.toggleAboutModal()
  }

  render() {

    const modules = this.props.modules
    const items = modules.toJS().filter(x => !x.noInterface).map(this.renderModuleItem)
    const dashboardClassName = classnames({ [style.active] : this.isAtDashboard() })
    const manageClassName = classnames({ [style.active] : this.isAtManage() })

    const productionText = this.props.botInformation.get('production') ? "in production" : "in development"

    const sidebarContent = <div className={classnames(style.sidebar, 'bp-sidebar')}>
      <SidebarHeader/>
      <ul className="nav">
        <li className={dashboardClassName} key="dashboard">
          <Link to='dashboard' title='Dashboard'>
            <i className="icon material-icons">dashboard</i>
            Dashboard
          </Link>
        </li>
        <li className={manageClassName} key="manage">
          <Link to='manage' title='Modules'>
            <i className="icon material-icons">build</i>
            Modules
          </Link>
        </li>
        {items}
      </ul>
      <div className={classnames(style.bottomInformation, 'bp-sidebar-footer')}>
        <div className={classnames(style.name, 'bp-name')}>{this.props.botInformation.get('name')}</div>
        <div className={classnames(style.production, 'bp-production')}>{productionText}</div>
        <Link to='#' title='License' onClick={this.openLicenseComponent}>
          License under {this.props.botInformation.get('license')}
        </Link>
        <br />
        <Link to="#" title="About" onClick={::this.openAbout}>
          About Botpress
        </Link>
      </div>
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
