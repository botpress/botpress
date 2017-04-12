import { Store, toImmutable } from 'nuclear-js'

import actionTypes from '~/actions/actionTypes'
const { LICENSE_CHANGED, LICENSE_RECEIVED } = actionTypes

export default Store({
  getInitialState() {
    return toImmutable({})
  },

  initialize() {
    this.on(LICENSE_RECEIVED, licenseReceived)
    this.on(LICENSE_CHANGED, licenseChanged)
  }
})

function licenseReceived(state, { license }) {

  //Code for testing
  const data2 = {
    licensed: true,
    name: 'AGPL-3.0',
    text: '',
    date: null,
    limit: {
      message: 'Code needs to be public'
    }
  }

  const data3 = {
    licensed: true,
    name: 'Botpress',
    text: '',
    date: new Date(),
    limit: null
  }

  const data4 = {
    licensed: true,
    name: 'Community Edition License',
    text: '',
    date: new Date(),
    limit: {
      message: 'Valid under 500 users',
      reached: false,
      progress: 0.2
    }
  }

  const data5 = {
    licensed: true,
    name: 'Pro Edition License',
    text: 'License text goes here...',
    date: new Date,
    limit: null
  }

  const data6 = {
    licensed: true,
    name: 'Pro Edition License',
    text: '',
    date: null,
    limit: {
      message: 'Pro Edition needs a license',
      reached: true
    }
  }

  license = data5 
  let newLicense = toImmutable(license)
  return state.merge(newLicense)
}

function licenseChanged(state, { license }) {
  return state.set('license', license)
}