import React from 'react';
import { Router, Route, Link, History } from 'react-router';
import pubsub from 'pubsub-js';
import { Collapse } from 'react-bootstrap';
import SidebarRun from './Sidebar.run';

class Sidebar extends React.Component {

  constructor(props, context) {
    super(props, context)

    this.state = {
      collapse: {
        singleview: this.routeActive(['singleview']),
        submenu: this.routeActive(['submenu'])
      }
    }
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

  toggleItemCollapse(stateName) {
    var newCollapseState = {}
    for (let c in this.state.collapse) {
      if (this.state.collapse[c] === true && c !== stateName)
      this.state.collapse[c] = false;
    }
    this.setState({
      collapse: {
        [stateName]: !this.state.collapse[stateName]
      }
    })
  }

  renderModuleItem(module) {
    return (<li key={`menu_module_${module.name}`} className={ this.routeActive(module.name) ? 'active' : '' }>
      <Link to={'/modules/' + module.name} title={module.menuText}>
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

    return (
      <aside className='aside'>
        <div className="aside-inner">
          <nav data-sidebar-anyclick-close="" className="sidebar">
            <ul className="nav">
              <li className="nav-heading ">
                <span>Installed modules</span>
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
