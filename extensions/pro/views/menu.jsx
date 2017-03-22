import React, { Component } from 'react'
import { MenuItem } from 'react-bootstrap'

class Menu extends Component {

	render() {
		return <div>
			<a href="#" onClick={this.props.logout}>Logout</a>
			<a href="/profile">Profile</a>
			<a href="/admin">Administration</a>
		</div>
	}
}

export default Menu