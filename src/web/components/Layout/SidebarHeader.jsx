import React from 'react'
import {Navbar, Nav, NavItem, NavDropdown, MenuItem} from 'react-bootstrap'
import classnames from 'classnames'

const headerStyle = require('./Header.scss');
const style = require('./SidebarHeader.scss');

class SidebarHeader extends React.Component {

  render() {
    const headerClass = classnames(style.header, headerStyle.navbar)

    return <Navbar inverse className={headerClass}>
      <Navbar.Header>
        <Navbar.Brand>
          <a href="#" className={style.logo}>
            <img src="/img/logo.png" alt="Botskin Logo" className="img-responsive"/>
          </a>
        </Navbar.Brand>
        <Navbar.Toggle/>
      </Navbar.Header>
    </Navbar>
  }
}

export default SidebarHeader
