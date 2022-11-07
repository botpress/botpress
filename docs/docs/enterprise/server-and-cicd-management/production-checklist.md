---
id: production-checklist
title: Production Checklist
---

--------------------

This enterprise feature helps you visualize what you need to do before going to production. It lists all the important steps to do:

:::tip Best Practice
Once your server is correctly setup, we recommend disabling this page by setting the environment variable BP_DISABLE_SERVER_CONFIG to true.
:::

## Enable Botpress Professional

The section about [enterprise licensing](/enterprise/licensing/enterprise-licensing) shows you how to obtain, add, and activate your license. Remember that the Botpress Professional version comes with a lot of [enterprise-specific features](/overview/features#enterprise-specific-features). 

**Environment variables:**
- `BP_CONFIG_PRO_ENABLED`
- `BP_CONFIG_PRO_LICENSEKEY`

**Values in the botpress.config.json file:**
- `pro.enabled`
- `pro.licenseKey`

## Use a Postgre database

You should use a [Postgres database instead of a SQlite database](/building-chatbots/developers/database#how-to-switch-from-sqlite-to-postgressql). Postgres is more resilient and allows to run Botpress in [cluster mode](/going-to-production/deploy/enterprise-scaling) (using multiple servers).

**Environment variable:**
- `DATABASE_URL`

## Use the database BPFS storage

When you [set this option](/building-chatbots/language-understanding/hosting), all your bots and configuration files are stored in the database. Only those can be edited while making changes using the interface.
Multiple servers can then synchronously access the same latest data.

**Environment variable:**
- `BPFS_STORAGE`

## Run Botpress in production mode

When you run Botpress in production, these changes happen:

- Stack traces when error occurs are hidden.
- Debug logs and logging of standard errors to optimize speed are hidden.
- Some validations for speed are optimized.
- Using multiple servers (cluster mode) is enabled.

**Environment variable:**
- `BP_PRODUCTION`

## Configure the external server URL

Using an external server URL may cause multiple issues in production, like resources not displaying correctly or links not working. 

:::note Notes
- By default, Botpress starts an [HTTP server on localhost, listening to port 3000](/going-to-production/deploy/#http-server-configuration).
- When using Botpress Professional, this value is also used to validate your license.
:::

**Environment variable:**
- `EXTERNAL_URL`

**Value in the botpress.config.json file:**
- `httpServer.externalUrl`

## Enable Redis support

Redis allows you to run multiple Botpress servers using the same data. Only `REDIS_URL` and `CLUSTER_ENABLED` are required. Simply use the same URL for Redis and set the `BP_REDIS_SCOPE` environment variable to `prod` on your production environment and `staging` on your staging environment.

**Environment variables:**
- `REDIS_URL`
- `CLUSTER_ENABLED`
- `BP_REDIS_SCOPE`

## Restrict CORS to your own domain

You can either disable CORS completely (set to `false`), or set an allowed origin. 

:::info
By default, Botpress allows any origin to reach the server.
:::

**Values in the botpress.config.json file:**
- `httpServer.cors.enabled`
- `httpServer.cors.origin`

## Enable Cookie storage for the JWT token

Storing the token in cookies adds an additional layer of security for the user's session.

:::info
You must configure the CORS policy before.
:::

**Values in the botpress.config.json file:**
- `jwtToken.useCookieStorage`
- `jwtToken.cookieOptions`
- `httpServer.cors.credentials`

## Host your own language server

The [default language server](/building-chatbots/language-understanding/hosting#language-server) configured with Botpress is a public server with request limitations.

**Value in the botpress.config.json file:**
- `nlu.json: languageSources`

## Securing your server with HTTPS

Botpress doesn't handle certificates and HTTPS headers directly. You should instead use a [NGINX](/building-chatbots/language-understanding/hosting) server.

## Enable audit trail

You should enable a special [debug scope](/going-to-production/deploy/#advanced-logging). It tracks every sent requests with their user or IP address and save them to a log file.

## Enable Sticky Sessions

When using polling as a primary or secondary socket transport, you must enable sticky sessions. If you decide to use Websocket as the only transport, you don't need to enable sticky sessions.

See this documentation for more details: https://socket.io/docs/v4/using-multiple-nodes/#why-is-sticky-session-required.

**Value in the botpress.config.json file:**
- `httpServer.socketTransport`

## Output logs to the filesystem

By default, Botpress does some minimal [logging](/going-to-production/deploy/#logs-configuration) to the database. 

:::tip Best Practice
You should enable the log output on the file system.
:::

**Value in the botpress.config.json file:**
- `logs.fileOutput.enabled`

## Change Botpress base path

By default, all requests are handled at the top level of the external URL. You can change that path (for example to use http://localhost:3000/botpress) by updating your server's [`EXTERNAL_URL`](/going-to-production/deploy/#going-to-production) and adding the suffix at the end.

## Create custom roles and review permissions

There is a default set of [role and permissions](/enterprise/user-management-and-security/role-based-access-control/roles) when you create a workspace. 

:::tip Best Practice
You should review and update them.
:::

## Enable other authentication mechanism

The default authentication method is the [basic one](/enterprise/user-management-and-security/authentication-methods/basic-authentication). 

:::note
We currently support [LDAP](/enterprise/user-management-and-security/authentication-methods/ldap), [SAML](/enterprise/user-management-and-security/authentication-methods/saml), and [OAuth2](/enterprise/user-management-and-security/authentication-methods/oauth2).
:::

## Configure your Reverse Proxy and Load Balancing

Check the [documentation](/building-chatbots/language-understanding/hosting) for more information

## Generate a diagnostic report

This tool will generate a report (`diagnostic.txt`) after testing the connectivity to various components and ensuring that proper folders are writable. It will also include the configuration files.

:::info
Passwords and secrets will be obfuscated.
:::