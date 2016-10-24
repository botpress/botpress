import React, {Component} from 'react'
import ReactSidebar from 'react-sidebar'

import SidebarHeader from './SidebarHeader'

export default class Sidebar extends Component {
  constructor(props) {
    super(props)
    this.state = { sidebarOpen: false, sidebarDocked: false }

    this.onSetSidebarOpen = this.onSetSidebarOpen.bind(this)
    this.mediaQueryChanged = this.mediaQueryChanged.bind(this)
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

  render() {
    var sidebarContent = <div>
      <SidebarHeader />
    </div>

    return (
      <ReactSidebar sidebar={sidebarContent}
               open={this.state.sidebarOpen}
               docked={this.state.sidebarDocked}
               onSetOpen={this.onSetSidebarOpen}>
        {this.props.children}
      </ReactSidebar>
    )
  }
}

// import React from 'react'
// import { Link } from 'react-router'
// import classnames from 'classnames'
//
// // import styles from './sidebarStyle.scss'
//
// class Sidebar extends React.Component {
//
//   constructor(props, context) {
//     super(props, context)
//   }
//
//   routeActive(paths) {
//     paths = Array.isArray(paths) ? paths : [paths]
//     for (let p in paths) {
//       if (this.context.router.isActive(paths[p]) === true)
//       return true
//     }
//     return false
//   }
//
//   isAtHome() {
//     return location.pathname === '' || location.pathname === '/home'
//   }
//
//   renderModuleItem(module) {
//     const path = `/modules/${module.name}`
//     return (<li key={`menu_module_${module.name}`} className={ this.routeActive(path) ? 'active' : '' }>
//       <Link to={path} title={module.menuText}>
//         <em className={module.menuIcon || 'icon-puzzle'}></em>
//         <span>{module.menuText}</span>
//       </Link>
//     </li>)
//   }
//
//   renderLoading() {
//     return <div style={{ marginTop: '40px' }} className="whirl traditional"></div>
//   }
//
//   render() {
//     const items = this.props.modules && this.props.modules.map(this.renderModuleItem.bind(this))
//
//     const homeButtonStyle = classnames({
//       active: this.isAtHome()
//     })
//
//     return (
//       <aside className='aside'>
//         <div className="aside-inner">
//           <nav data-sidebar-anyclick-close="" className="sidebar">
//             <ul className="nav">
//               <li key="menu_home" className={homeButtonStyle}>
//                 <Link to='home' title='Home'>
//                   <span>Home</span>
//                 </Link>
//               </li>
//               <li className="nav-heading ">
//                 <span>Modules</span>
//               </li>
//               {items || this.renderLoading()}
//             </ul>
//           </nav>
//         </div>
//       </aside>
//     )
//   }
//
// }
//
// Sidebar.contextTypes = {
//   router: React.PropTypes.object
// }
//
// export default Sidebar
