export const AUTH_CONFIG = {
  domain: process.env.REACT_APP_AUTH0_DOMAIN || 'botpress.auth0.com',
  clientId: process.env.REACT_APP_AUTH0_CLIENT_ID || '0xP3mwY1TRoEXplxnj9ik5ZzScUBO615',
  callbackUrl: process.env.REACT_APP_AUTH0_CALLBACK_URL || 'http://localhost:4001/callback'
}
