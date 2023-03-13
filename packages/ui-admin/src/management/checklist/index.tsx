import { Callout, Intent, Tag } from '@blueprintjs/core'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'

import api from '~/app/api'
import PageContainer from '~/app/common/PageContainer'
import { AppState } from '~/app/rootReducer'
import { DiagReport } from './DiagReport'
import Item from './Item'
import { fetchServerConfig } from './reducer'
import style from './style.scss'

const NOT_SET = 'Not set'

const getDisplayValue = (val: any) => {
  if (val === undefined || val === null) {
    return NOT_SET
  } else if (val === false || val === true) {
    return val.toString()
  } else {
    return val.length ? val.toString() : NOT_SET
  }
}

const isSet = (value: any): boolean => value !== NOT_SET

const protocol = window.location.protocol.substr(0, window.location.protocol.length - 1)

type Props = ConnectedProps<typeof connector>

const Container = props => {
  return (
    <PageContainer
      title="Production Checklist"
      superAdmin={true}
      helpText={
        <span>
          This is a checklist of recommended settings when running Botpress in production.
          <br /> Environment variables are displayed in <Tag>gray</Tag> and values from the botpress.config.json config
          file in <Tag intent={Intent.PRIMARY}>blue</Tag>
          <br />
          <br />
          Once your server is correctly setup, we recommend disabling this page by setting the environment variable
          BP_DISABLE_SERVER_CONFIG to "true"
        </span>
      }
    >
      {props.children}
    </PageContainer>
  )
}

export const Checklist: FC<Props> = props => {
  const [langSource, setLangSource] = useState<any>()
  const [hasAuditTrail, setAuditTrail] = useState(false)

  useEffect(() => {
    if (!props.serverConfigLoaded) {
      props.fetchServerConfig()
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadData()
  }, [])

  const loadData = async () => {
    const { data: sources } = await api.getSecured().get('/admin/management/languages/sources')
    setLangSource(sources.languageSources)

    await checkAuditTrail()
  }

  const checkAuditTrail = async () => {
    const { data: debug } = await api.getSecured().get('/admin/health/debug')
    const audit = Object.keys(debug)
      .filter(x => x.startsWith('bp:audit'))
      .map(x => debug[x])

    setAuditTrail(_.some(audit, Boolean))
  }

  if (!props.serverConfig) {
    return (
      <Container>
        <Callout intent={Intent.PRIMARY}>
          Server configuration is disabled. To view this page, set the environment variable "BP_DISABLE_SERVER_CONFIG"
          to false
        </Callout>
      </Container>
    )
  }

  const getEnv = (key: string): any => getDisplayValue(_.get(props.serverConfig!.env, key))
  const getConfig = (path: string): any => getDisplayValue(_.get(props.serverConfig!.config, path))
  const getLive = (path: string): any => getDisplayValue(_.get(props.serverConfig!.live, path))

  const languageEndpoint = _.get(langSource, '[0].endpoint', '')

  return (
    <Container>
      <div className={style.checklist}>
        <Item
          title="Use a Postgres database"
          docs="https://botpress.com/docs/building-chatbots/developers/database#how-to-switch-from-sqlite-to-postgressql"
          status={getEnv('DATABASE_URL').startsWith('postgres') ? 'success' : 'warning'}
          source={[{ type: 'env', key: 'DATABASE_URL', value: getEnv('DATABASE_URL') }]}
        >
          By default, Botpress uses an SQLite database, which is not recommended in a production environment. Postgres
          is more resilient and allows to run Botpress in cluster mode (using multiple servers to handle the load).
        </Item>

        <Item
          title="Use the database BPFS storage"
          docs="https://botpress.com/docs/enterprise/server-and-cicd-management/production-checklist#use-the-database-bpfs-storage"
          status={getEnv('BPFS_STORAGE') === 'database' ? 'success' : 'warning'}
          source={[{ type: 'env', key: 'BPFS_STORAGE', value: getEnv('BPFS_STORAGE') }]}
        >
          When this option is set, every bots and configuration files are stored in the database, and only that copy is
          edited when you make changes to them using the interface. This way, multiple servers can access the same
          up-to-date data at the same time.
        </Item>

        <Item
          title="Run Botpress in production mode"
          docs="https://botpress.com/docs/enterprise/server-and-cicd-management/production-checklist#run-botpress-in-production-mode"
          status={getEnv('BP_PRODUCTION') === 'true' ? 'success' : 'warning'}
          source={[{ type: 'env', key: 'BP_PRODUCTION', value: getEnv('BP_PRODUCTION') }]}
        >
          When you run Botpress in production, these changes happens:
          <ul>
            <li>Hide stack traces when error occurs</li>
            <li>Hides debug logs and logging of standard errors to optimize speed</li>
            <li>Optimizes some validations for speed</li>
            <li>Enables the use of multiple servers (cluster mode)</li>
          </ul>
        </Item>

        <Item
          title="Configure the external server URL"
          docs="https://botpress.com/docs/enterprise/server-and-cicd-management/production-checklist#configure-the-external-server-url"
          status={isSet(getEnv('EXTERNAL_URL')) || isSet(getConfig('httpServer.externalUrl')) ? 'success' : 'warning'}
          source={[
            { type: 'env', key: 'EXTERNAL_URL', value: getEnv('EXTERNAL_URL') },
            { type: 'config', key: 'httpServer.externalUrl', value: getConfig('httpServer.externalUrl') }
          ]}
        >
          <span>
            This may cause multiple issues in production, like resources not displaying correctly or links not working.
            When it is not set, it defaults to http://localhost:3000. When using Botpress Professional, this value is
            also used to validate your license.
          </span>
        </Item>

        <Item
          title="Enable Redis support"
          status={isSet(getEnv('REDIS_URL')) && isSet(getEnv('CLUSTER_ENABLED')) ? 'success' : 'warning'}
          source={[
            { type: 'env', key: 'REDIS_URL', value: getEnv('REDIS_URL') },
            { type: 'env', key: 'CLUSTER_ENABLED', value: getEnv('CLUSTER_ENABLED') },
            { type: 'env', key: 'BP_REDIS_SCOPE', value: getEnv('BP_REDIS_SCOPE') }
          ]}
        >
          Redis allows you to run multiple Botpress servers, all using the same data. Only 'REDIS_URL' and
          'CLUSTER_ENABLED' are required for Redis to work properly. Setting a Redis scope allows you to run multiple
          Botpress clusters (e.g. staging and production) on the same Redis cluster without impacting one another (not
          recommended). Simply re-use the same URL for Redis and set the 'BP_REDIS_SCOPE' environment variable to prod
          on your production instance and staging on your staging environment.
        </Item>

        <Item
          title="Restrict CORS to your own domain"
          status={
            getConfig('httpServer.cors.enabled') === 'false' || isSet(getConfig('httpServer.cors.origin'))
              ? 'success'
              : 'warning'
          }
          source={[
            { type: 'config', key: 'httpServer.cors.enabled', value: getConfig('httpServer.cors.enabled') },
            { type: 'config', key: 'httpServer.cors.origin', value: getConfig('httpServer.cors.origin') }
          ]}
        >
          By default, Botpress allows any origin to reach the server. You can either disable CORS completely (set the
          configuration to false), or set an allowed origin
        </Item>

        <Item
          title="Enable Cookie storage for the JWT Token"
          docs="https://botpress.com/docs/enterprise/server-and-cicd-management/production-checklist#enable-cookie-storage-for-the-jwt-token"
          status={getConfig('jwtToken.useCookieStorage') === 'true' ? 'success' : 'warning'}
          source={[
            { type: 'config', key: 'jwtToken.useCookieStorage', value: getConfig('jwtToken.useCookieStorage') },
            { type: 'config', key: 'jwtToken.cookieOptions', value: getConfig('jwtToken.cookieOptions') },
            { type: 'config', key: 'httpServer.cors.credentials', value: getConfig('httpServer.cors.credentials') }
          ]}
        >
          Storing the token in cookies adds an additional layer of security for the user's session. The CORS policy must
          be configured beforehand. Please refer to the documentation before enabling this feature.
        </Item>

        <Item
          title="Host your own language server"
          docs="https://botpress.com/docs/enterprise/server-and-cicd-management/production-checklist#host-your-own-language-server"
          status={languageEndpoint.includes('botpress.io') ? 'warning' : 'success'}
          source={[{ type: 'config', key: 'nlu.json: languageSources', value: languageEndpoint }]}
        >
          The default language server configured with Botpress is a public server, which has request limitations and
          should not be relied upon when serving customers. Please follow the instructions in our documentation to setup
          your own, then change the server URL in the configuration file <strong>global/data/config/nlu.json</strong>
        </Item>

        <Item
          title="Securing your server with HTTPS"
          docs="https://botpress.com/docs/enterprise/server-and-cicd-management/production-checklist#securing-your-server-with-https"
          status={protocol === 'https' ? 'success' : 'warning'}
          source={[{ key: 'Detected protocol', value: protocol }]}
        >
          Botpress doesn't handle certificates and https headers directly. Those should be handled by a NGINX server in
          front of it. We have a recommended NGINX configuration sample in the documentation.
        </Item>

        <Item
          title="Enable audit trail"
          docs="https://botpress.com/docs/enterprise/server-and-cicd-management/production-checklist#enable-audit-trail"
          status={hasAuditTrail ? 'success' : 'warning'}
        >
          You can enable a special debug scope that tracks every requests sent to the server (and the corresponding
          user/ip address) and output them to the log file. You can configure those scopes by clicking on 'Debug' in the
          menu on the left
        </Item>

        <Item
          title="Enable Sticky Sessions"
          docs="https://botpress.com/docs/enterprise/server-and-cicd-management/production-checklist#enable-sticky-sessions"
          status="none"
          source={[
            { type: 'config', key: 'httpServer.socketTransports', value: getConfig('httpServer.socketTransports') }
          ]}
        >
          When using "Polling" as a primary or secondary socket transport, it is mandatory to enable sticky sessions,
          otherwise the handshake may never complete. If you decide to use "Websocket" as the only transport, which is a
          valid option nowadays, you don't need to enable sticky sessions.
          <br />
          <br />
          See this documentation for more details:{' '}
          <a href="https://socket.io/docs/v4/using-multiple-nodes/#why-is-sticky-session-required" target="_blank">
            https://socket.io/docs/v4/using-multiple-nodes/#why-is-sticky-session-required
          </a>
          <br />
          <br />
          Here is your current socket transports configuration:
        </Item>

        <Item
          title="Output logs to the filesystem"
          docs="https://botpress.com/docs/enterprise/server-and-cicd-management/production-checklist#output-logs-to-the-filesystem"
          status={getConfig('logs.fileOutput.enabled') === 'true' ? 'success' : 'none'}
          source={[{ type: 'config', key: 'logs.fileOutput.enabled', value: getConfig('logs.fileOutput.enabled') }]}
        >
          By default, Botpress does some minimal logging to the database. It is recommended to enable the log output on
          the file system to keep traces
        </Item>

        <Item
          title="Change Botpress base path"
          docs="https://botpress.com/docs/enterprise/server-and-cicd-management/production-checklist#change-botpress-base-path"
          status={isSet(getLive('ROOT_PATH')) ? 'success' : 'none'}
          source={[{ key: 'Current base path', value: !isSet(getLive('ROOT_PATH')) ? '/' : getLive('ROOT_PATH') }]}
        >
          By default, all requests are handled at the top level of the external url. It is possible to change that path
          (for example to use http://localhost:3000/botpress). You can do that by updating your server's EXTERNAL_URL
          and adding the suffix at the end.
        </Item>

        <Item
          title="Create custom roles and review permissions"
          docs="https://botpress.com/docs/enterprise/server-and-cicd-management/production-checklist#create-custom-roles-and-review-permissions"
          status="none"
        >
          There is a default set of role and permissions when you create a workspace. It is recommended to review and
          update them.
        </Item>

        <Item
          title="Enable other authentication mechanism"
          docs="https://botpress.com/docs/enterprise/server-and-cicd-management/production-checklist#enable-other-authentication-mechanism"
          status="none"
        >
          The default authentication method is a username/password, but you can enable additional authentication
          strategies to access Botpress. We currently support LDAP, SAML and OAUTH2.
        </Item>

        <Item
          title="Configure your Reverse Proxy and Load Balancing"
          docs="https://botpress.com/docs/enterprise/server-and-cicd-management/production-checklist#configure-your-reverse-proxy-and-load-balancing"
          status="none"
        >
          Check the documentation for more information
        </Item>

        <Item title="Generate a diagnostic report" status="none">
          This tool will generate a report which can help diagnose problems. It will test the connectivity to various
          components, ensure that proper folders are writable, and will also include the various configuration files.
          <br />
          <br />
          Passwords and secrets will be obfuscated
          <br />
          <br />
          <DiagReport />
        </Item>
      </div>
    </Container>
  )
}

const mapStateToProps = (state: AppState) => ({
  serverConfig: state.checklist.serverConfig,
  serverConfigLoaded: state.checklist.serverConfigLoaded
})

const connector = connect(mapStateToProps, { fetchServerConfig })

export default connector(Checklist)
