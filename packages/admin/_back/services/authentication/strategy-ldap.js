import LdapAuth from 'ldapauth-fork'
import fs from 'fs'
import _ from 'lodash'
import ms from 'ms'

import BasicStrategy from './strategy-basic'

const ldapConfig = require('../../../config/auth-ldap.json')

const additionalOptions = {}

if (ldapConfig.tlsEnabled && _.isArray(_.get(ldapConfig, 'tlsOptions.ca'))) {
  try {
    ldapConfig.tlsOptions.ca = ldapConfig.tlsOptions.ca.map(path => fs.readFileSync(path))
  } catch (err) {
    throw new Error('Error reading the LDAP CA certificate files ' + err.message)
  }
}

export default ({ config, db }) => {
  if (process.env.LDAP_PASSWORD) {
    additionalOptions.bindCredentials = process.env.LDAP_PASSWORD
  }

  let ldap = null
  const resetLdap = () => {
    try {
      if (ldap) {
        ldap.close(err => {})
      }
    } finally {
      ldap = new LdapAuth(Object.assign(ldapConfig, additionalOptions))
      ldap.on('error', err => {
        resetLdap()
      })
    }
  }

  resetLdap()
  setInterval(resetLdap, ms('10m'))

  const basicAuthenticationFn = (username, password) =>
    Promise.fromCallback(cb => ldap.authenticate(username, password, cb))

  const basicAuthenticationMapping = ldapConfig.mapping

  const basicAuthenticationName = 'ldap'

  return BasicStrategy({ config, db, basicAuthenticationFn, basicAuthenticationMapping, basicAuthenticationName })
}
