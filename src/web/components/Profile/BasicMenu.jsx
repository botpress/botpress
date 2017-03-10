import React, {Component} from 'react'
import { MenuItem } from 'react-bootstrap'

import { logout } from '~/Util/Auth'

class BasicMenu extends Component {

	render() {
		return<MenuItem eventKey="1" onClick={logout}>Logout</MenuItem>
	}

}

export default BasicMenu