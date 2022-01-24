import { BotpressConfig } from '../../src/core/config/botpress.config'

const authConfig: { authStrategies: BotpressConfig['authStrategies']; pro: Partial<BotpressConfig['pro']> } = {
  pro: {
    collaboratorsAuthStrategies: ['default', 'botpress', 'botpress2']
  },
  authStrategies: {
    default: {
      type: 'basic',
      allowSelfSignup: false,
      options: {
        maxLoginAttempt: 0
      },
      hidden: false
    },
    botpress: {
      type: 'oauth2',
      options: {
        authorizationURL: 'https://example.auth0.com/authorize',
        tokenURL: 'https://example.auth0.com/oauth/token',
        clientID: 'your-client-id',
        clientSecret: 'your-client-secret',
        callbackURL: 'http://localhost:3000/api/v1/auth/login-callback/oauth2/botpress',
        userInfoURL: 'https://example.auth0.com/userinfo',
        jwtToken: {
          audience: 'my-audience',
          issuer: 'some-issuer',
          algorithms: ['HS256'],
          publicKey: ''
        },
        scope: 'openid profile email'
      },
      fieldMapping: {
        email: 'email'
      },
      allowSelfSignup: false,
      hidden: false
    },
    botpress2: {
      type: 'oauth2',
      options: {
        authorizationURL: 'https://example.auth0.com/authorize',
        tokenURL: 'https://example.auth0.com/oauth/token',
        clientID: 'your-client-id',
        clientSecret: 'your-client-secret',
        callbackURL: 'http://localhost:3000/api/v1/auth/login-callback/oauth2/botpress',
        userInfoURL: 'https://example.auth0.com/userinfo',
        jwtToken: {
          audience: 'my-audience',
          issuer: 'some-issuer',
          algorithms: ['HS256'],
          publicKey: ''
        },
        scope: 'openid profile email'
      },
      fieldMapping: {
        email: 'email'
      },
      allowSelfSignup: false,
      hidden: true
    }
  }
}

export default authConfig
