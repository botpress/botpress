import React, { Component } from 'react'
import { MenuItem } from 'react-bootstrap'

class BasicMenu extends Component {

	render() {
		return <MenuItem onClick={this.props.logout}>Logout</MenuItem>
	}
}

export default BasicMenu