import React, {Component} from 'react'
import {Navbar, Nav, NavItem, NavDropdown, MenuItem} from 'react-bootstrap'
import classnames from 'classnames'

import headerStyle from './Header.scss'
import style from './SidebarHeader.scss'

export default class SidebarHeader extends Component {
  render() {
    const headerClass = classnames(style.header, headerStyle.navbar)

    return <Navbar inverse className={headerClass}>
      <Navbar.Header>
        <Navbar.Brand>
          <a href="/" className={style.logo}>
            <img src="/img/logo.png" alt="Botpress Logo"/>
          </a>
        </Navbar.Brand>
        <Navbar.Toggle/>
      </Navbar.Header>
    </Navbar>
  }
}
