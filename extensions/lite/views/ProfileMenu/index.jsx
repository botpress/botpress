import React, { Component } from 'react'
import { MenuItem } from 'react-bootstrap'

class Menu extends Component {
  render() {
    return [
      <MenuItem header>Signed in as</MenuItem>,
      <MenuItem disabled>✉️&nbsp;{this.props.user.email}</MenuItem>,
      <MenuItem disabled>👤&nbsp;{this.props.user.username}</MenuItem>,
      <MenuItem divider />,
      <MenuItem eventKey={1} onClick={this.props.logout}>
        <b>Logout</b>
      </MenuItem>
    ]
  }
}

export default Menu
