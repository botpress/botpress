---
id: oauth2
title: OAuth2
---

--------------------

Some OAuth2 implementations return a JWT token containing all the user's information, while some other returns a unique token, which Botpress must then use to query the user's information.

```js
{
 "pro": {
    "collaboratorsAuthStrategies": ["default"],
  },
  "authStrategies": {
    "botpress": {
      "type": "oauth2",
      "options": {
        "authorizationURL": "https://example.auth0.com/authorize",
        "tokenURL": "https://example.auth0.com/oauth/token",
        "clientID": "your-client-id",
        "clientSecret": "your-client-secret",
        "callbackURL": "http://localhost:3000/api/v1/auth/login-callback/oauth2/botpress",
        /**
         * If the token doesn't contain user information, set the userInfoURL
         */
        "userInfoURL": "https://example.auth0.com/userinfo",
        /**
         * If the token already includes all user information,
         * */
        "jwtToken": {
          "audience": "my-audience",
          "issuer": "some-issuer",
          "algorithms": ["HS256"],
          // Either set the certificate, or save it in a file: data/global/oauth2_YOUR_STRATEGY_ID.pub
          "publicKey": ""
        }
        "scope": "openid profile email"
      },
      "fieldMapping": {
        "email": "email"
      }
    }
  }
}
```