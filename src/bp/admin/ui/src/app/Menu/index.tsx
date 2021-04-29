import { Icon, Position, Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, useEffect } from 'react'
import { MdAndroid, MdCopyright } from 'react-icons/md'
import { connect, ConnectedProps } from 'react-redux'
import { generatePath, RouteComponentProps, withRouter } from 'react-router'
import { matchPath } from 'react-router-dom'

import AccessControl from '~/auth/AccessControl'
import { getActiveWorkspace } from '~/auth/basicAuth'
import { fetchCurrentVersion, fetchLatestVersions } from '~/releases/reducer'
import { AppState } from '../rootReducer'
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
    const active = matchPath(props.location.pathname, { path: url })
    const workspaceId = getActiveWorkspace()

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
            <a
              className={cx({ [style.active]: active })}
              onClick={() => props.history.push(generatePath(url, { workspaceId: workspaceId || undefined }))}
            >
              <Icon icon={icon} />
              {tag && <span className={style.small_tag}>{tag}</span>}{' '}
            </a>
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

  return (
    <aside className={cx(style.sidebar, 'bp-sidebar')}>
      <a href="admin/" className={cx(style.logo, 'bp-logo')}>
        <img width="19" src="assets/admin/ui/public/logo-icon.svg" />
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

        <MenuItem
          id="btn-menu-version"
          text={lang.tr('admin.sideMenu.sourceControl')}
          icon="changes"
          url="/server/version"
        />
        <MenuItem
          id="btn-menu-license"
          text={lang.tr('admin.sideMenu.serverLicense')}
          icon={<MdCopyright />}
          url="/server/license"
        />
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
        <MenuItem
          id="btn-menu-monitoring"
          text={lang.tr('admin.sideMenu.monitoring')}
          icon="timeline-line-chart"
          url="/server/monitoring"
        />
        <MenuItem
          id="btn-menu-alerting"
          text={lang.tr('admin.sideMenu.alerting')}
          icon="notifications"
          url="/server/alerting"
        />
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
  version: state.version
})

const connector = connect(mapStateToProps, { fetchCurrentVersion, fetchLatestVersions })
export default withRouter(connector(Menu))
