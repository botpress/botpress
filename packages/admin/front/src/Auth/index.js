import Auth0Provider from './auth0'
import BasicProvider from './basic'

export const Provider = process.env.REACT_APP_AUTH_PROVIDER === 'basic' ? BasicProvider : Auth0Provider
