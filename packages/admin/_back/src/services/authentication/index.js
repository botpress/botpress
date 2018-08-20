import Base from './base'
import Auth0Strategy from './strategy-auth0'
import LDAPStrategy from './strategy-ldap'
import HTTPStrategy from './strategy-http'

const strategyName = (process.env.AUTH_STRATEGY || 'auth0').toLowerCase()

let strategy = null

switch (strategyName) {
  case 'ldap':
    strategy = LDAPStrategy
    break
  case 'http':
    strategy = HTTPStrategy
    break
  case 'auth0':
  default:
    strategy = Auth0Strategy
    break
}

export default ({ config, db }) => strategy({ config, db })
