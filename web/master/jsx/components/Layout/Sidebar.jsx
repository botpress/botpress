import React from 'react';
import { Router, Route, Link, History } from 'react-router';
import pubsub from 'pubsub-js';
import { Collapse } from 'react-bootstrap';
import SidebarRun from './Sidebar.run';
import classnames from 'classnames'

import styles from './sidebarStyle.css'

class Sidebar extends React.Component {

  constructor(props, context) {
    super(props, context)
  }

  componentDidMount() {
    SidebarRun()
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
    return location.pathname === '' || location.pathname === '/home'
  }

  renderModuleItem(module) {
    const path = `/modules/${module.name}`
    return (<li key={`menu_module_${module.name}`} className={ this.routeActive(path) ? 'active' : '' }>
      <Link to={path} title={module.menuText}>
        <em className={module.menuIcon || 'icon-puzzle'}></em>
        <span>{module.menuText}</span>
      </Link>
    </li>)
  }

  renderLoading() {
    return <div style={{ marginTop: '40px' }} className="whirl traditional"></div>
  }

  render() {
    const items = this.props.modules && this.props.modules.map(this.renderModuleItem.bind(this))

    const homeButtonStyle = classnames({
      active: this.isAtHome()
    })

    return (
      <aside className='aside'>
        <div className="aside-inner">
          <nav data-sidebar-anyclick-close="" className="sidebar">
            <ul className="nav">
              <li key="menu_home" className={homeButtonStyle}>
                <Link to='home' title='Home' className={styles.home}>
                  <span>Home</span>
                </Link>
              </li>
              <li className="nav-heading ">
                <span>Modules</span>
              </li>
              {items || this.renderLoading()}
            </ul>
          </nav>
        </div>
      </aside>
    )
  }

}

Sidebar.contextTypes = {
  router: React.PropTypes.object
}

export default Sidebar
