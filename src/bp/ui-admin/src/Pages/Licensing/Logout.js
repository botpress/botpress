import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'
import { updateLicensingAccount } from '../../modules/license'
import firebase from '../../utils/firebase'
import api from '../../api'

class Logout extends Component {
  render() {
    firebase.auth().signOut()
    api.setLicensingToken(null)
    this.props.updateLicensingAccount(null)

    return <Redirect to={{ pathname: '/licensing' }} />
  }
}

const mapDispatchToProps = { updateLicensingAccount }
export default connect(
  null,
  mapDispatchToProps
)(Logout)
