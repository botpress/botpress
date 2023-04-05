import { Icon, Position, Tooltip, MenuItem as BpMenuItem, MenuDivider } from '@blueprintjs/core'
import { IconSvgPaths16 } from '@blueprintjs/icons'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, useEffect, Fragment } from 'react'
import { MdAndroid, MdChat, MdCopyright } from 'react-icons/md'
import { connect, ConnectedProps } from 'react-redux'
import { generatePath, RouteComponentProps, withRouter } from 'react-router'
import { matchPath, Link } from 'react-router-dom'

import AccessControl from '~/auth/AccessControl'
import { getActiveWorkspace } from '~/auth/basicAuth'
import { fetchCurrentVersion, fetchLatestVersions } from '~/releases/reducer'
import { addModuleIcon } from '~/workspace/bots/WorkspaceAppItems'
import { AppState } from '../rootReducer'
import logo from './logo-icon.svg'
import style from './style.scss'

type Props = ConnectedProps<typeof connector> & RouteComponentProps

interface MenuItemProps {
  text: string
  icon: any
  url: string
  id: string
  isPro?: boolean
  superAdmin?: boolean
  resource?: string
  operation?: 'read' | 'write'
  tag?: JSX.Element | undefined
}

const Menu: FC<Props> = props => {
  useEffect(() => {
    if (!props.version.currentVersion) {
      props.fetchCurrentVersion()
    }

    if (!props.version.latestReleases.length) {
      props.fetchLatestVersions()
    }
  }, [])

  const MenuItem = ({ text, icon, url, id, isPro, operation, resource, superAdmin, tag }: MenuItemProps) => {
    const workspaceId = getActiveWorkspace()

    let active = matchPath(props.location.pathname, { path: url })

    // Small hack so the 'Bots' menu is active when using a bot-scoped workspace app
    if (id === 'btn-menu-bots' && matchPath(props.location.pathname, { path: '/apps/:appName/:botId' })) {
      active = true
    }

    if (!props.licensing || (isPro && !props.licensing.isPro)) {
      return null
    }

    return (
      <AccessControl resource={resource} operation={operation} superAdmin={superAdmin} key={text}>
        <li id={id} key={id}>
          <Tooltip
            boundary="window"
            position={Position.RIGHT}
            content={
              <div className={style.tooltipContent}>
                <span>{text}</span>
                {tag && <span className={style.tag}>{tag}</span>}
              </div>
            }
          >
            <Link
              className={cx({ [style.active]: active })}
              to={generatePath(url, { workspaceId: workspaceId || undefined })}
            >
              <Icon icon={icon} />
              {tag && <span className={style.small_tag}>{tag}</span>}{' '}
            </Link>
          </Tooltip>
        </li>
      </AccessControl>
    )
  }

  const renderLatestReleaseTag = () => {
    const current = props.version.currentVersion
    const latest = _.get(props, 'version.latestReleases.0.version', current)
    if (latest > current) {
      return <span>new</span>
    }
  }

  const renderWorkspaceApps = () => {
    return (
      <Fragment>
        {props.loadedModules
          .filter(x => x.workspaceApp?.global)
          .map(addModuleIcon)
          .map(module => (
            <MenuItem
              key={module.name}
              id={`btn-menu-${module.name}`}
              text={lang.tr(`module.${module.name}.fullName`) || module.menuText}
              icon={module.menuIcon}
              url={`/apps/${module.name}`}
              resource={`module.${module.name}`}
              operation="write"
            />
          ))}
      </Fragment>
    )
  }

  return (
    <aside className={cx(style.sidebar, 'bp-sidebar')}>
      <a href="admin/" className={cx(style.logo, 'bp-logo')}>
        <img width="19" src={logo} />
      </a>
      <ul>
        <MenuItem
          id="btn-menu-bots"
          text={lang.tr('admin.sideMenu.bots')}
          icon={<MdAndroid />}
          url="/workspace/:workspaceId?/bots"
          resource="user.bots.*"
          operation="read"
        />

        <MenuItem
          id="btn-menu-users"
          text={lang.tr('admin.sideMenu.collaborators')}
          icon="user"
          url="/workspace/:workspaceId?/users"
          resource="admin.collaborators.*"
          operation="read"
          isPro={true}
        />

        <MenuItem
          id="btn-menu-roles"
          text={lang.tr('admin.sideMenu.roles')}
          icon="shield"
          url="/workspace/:workspaceId?/roles"
          resource="admin.roles.*"
          operation="read"
          isPro={true}
        />

        <MenuItem
          id="btn-menu-logs"
          text={lang.tr('admin.sideMenu.logs')}
          icon="manual"
          url="/workspace/:workspaceId?/logs"
          resource="admin.logs"
          operation="read"
        />

        {renderWorkspaceApps()}

        <AccessControl superAdmin={true}>
          <MenuItem
            id="btn-menu-version"
            text={lang.tr('admin.sideMenu.sourceControl')}
            icon="changes"
            url="/server/version"
          />
          {props?.licensing?.isPro && (
            <MenuItem
              id="btn-menu-license"
              text={lang.tr('admin.sideMenu.serverLicense')}
              icon={<MdCopyright />}
              url="/server/license"
            />
          )}
          <MenuItem
            text={lang.tr('admin.sideMenu.languages')}
            id="btn-menu-language"
            icon="globe-network"
            url="/server/languages"
          />
          <MenuItem text={lang.tr('sideMenu.modules')} id="btn-menu-modules" icon="control" url="/modules" />
          <MenuItem
            text={lang.tr('admin.sideMenu.productionChecklist')}
            id="btn-menu-checklist"
            icon="endorsed"
            url="/checklist"
          />
          {props?.licensing?.isPro && (
            <MenuItem
              id="btn-menu-monitoring"
              text={lang.tr('admin.sideMenu.monitoring')}
              icon="timeline-line-chart"
              url="/server/monitoring"
            />
          )}
          {props?.licensing?.isPro && (
            <MenuItem
              id="btn-menu-alerting"
              text={lang.tr('admin.sideMenu.alerting')}
              icon="notifications"
              url="/server/alerting"
            />
          )}
        </AccessControl>
        <MenuItem
          text={lang.tr('admin.sideMenu.latestReleases')}
          id="btn-menu-releases"
          icon="feed"
          url="/latestReleases"
          tag={renderLatestReleaseTag()}
        />
      </ul>
    </aside>
  )
}

const mapStateToProps = (state: AppState) => ({
  licensing: state.licensing.license,
  version: state.version,
  loadedModules: state.modules.loadedModules
})

const connector = connect(mapStateToProps, { fetchCurrentVersion, fetchLatestVersions })
export default withRouter(connector(Menu))
