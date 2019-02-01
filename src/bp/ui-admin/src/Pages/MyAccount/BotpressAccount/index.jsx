import React, { Component } from 'react'
import { registerAuthStateChanged, isAuthenticated } from '../../../Auth/licensing'
import KeyList from './KeyList'
import Login from './Login'

class BotpressAccount extends Component {
  //TODO move this into redux store
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

export default BotpressAccount
