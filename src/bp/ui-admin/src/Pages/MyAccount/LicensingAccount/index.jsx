import React, { Component } from 'react'
import { registerAuthStateChanged } from '../../../Auth/licensing'
import KeyList from './KeyList'
import Login from './Login'

class LicensingAccount extends Component {
  //TODO move this into redux store if necessary
  state = {
    currentUser: null
  }

  componentDidMount() {
    registerAuthStateChanged(user => {
      this.setState({
        currentUser: user
      })
    })
  }

  render() {
    if (this.state.currentUser) {
      return <KeyList />
    } else {
      return <Login />
    }
  }
}

export default LicensingAccount
