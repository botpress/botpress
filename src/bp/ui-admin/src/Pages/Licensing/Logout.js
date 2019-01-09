import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'
import { updateLicensingToken } from '../../modules/license'
import firebase from '../../utils/firebase'
import api from '../../api'

class Logout extends Component {
  render() {
    firebase.auth().signOut()
    api.setLicensingToken(null)
    this.props.updateLicensingToken(null)

    return <Redirect to={{ pathname: '/licensing' }} />
  }
}

const mapDispatchToProps = { updateLicensingToken }
export default connect(
  null,
  mapDispatchToProps
)(Logout)
