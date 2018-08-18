## Using LDAP

Setup the following environement variables:

```
REACT_APP_AUTH_PROVIDER=basic
AUTH_STRATEGY=ldap
AUTH0_JWKS_URI=http://localhost:4000/api/.well-known/jwks.json
AUTH0_JWKS_ISSUER=https://botpress.cloud
AUTH0_ISSUER=https://botpress.cloud
AUTH0_JWKS_AUDIENCE=ldap.cloud
AUTH0_AUDIENCE=ldap.cloud
AUTH0_JWKS_KID=ldap.cloud.v1
```

Replacing the following variables:

* `:4000` By the port this app runs on (yes, this server will call its own API)
* `https://botpress.cloud` by the website of your Botpress Cloud Portal

You then need to configure LDAP in `./back/config/auth-ldap.json`
