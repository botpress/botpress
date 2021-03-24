import { Colors, ControlGroup, Icon, Intent, Tag } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useEffect } from 'react'
import { MdAndroid, MdCopyright } from 'react-icons/md'
import { connect, ConnectedProps } from 'react-redux'
import { generatePath, RouteComponentProps, withRouter } from 'react-router'
import { matchPath } from 'react-router-dom'

import AccessControl from '~/auth/AccessControl'
import { getActiveWorkspace } from '~/auth/basicAuth'
import { fetchCurrentVersion, fetchLatestVersions } from '~/releases/reducer'
import { AppState } from './rootReducer'

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
        <div
          id={id}
          className={cx('bp-sa-menu-item', { ['bp-sa-menu-item-active']: active })}
          onClick={() => props.history.push(generatePath(url, { workspaceId: workspaceId || undefined }))}
        >
          <Icon icon={icon} />
          <span className="label">{text}</span>
          {tag && <span style={{ float: 'right' }}>{tag}</span>}
        </div>
      </AccessControl>
    )
  }

  const renderLatestReleaseTag = () => {
    const current = props.version.currentVersion
    const latest = _.get(props, 'version.latestReleases.0.version', current)
    if (latest > current) {
      return (
        <Tag minimal intent={Intent.SUCCESS}>
          new
        </Tag>
      )
    }
  }

  return (
    <div className="bp-sa-menu">
      <div className="bp-sa-menu-header">{lang.tr('admin.sideMenu.workspace')}</div>
      <ControlGroup vertical={true} fill={true}>
        <MenuItem
          id="btn-menu-bots"
          text={lang.tr('admin.sideMenu.bots')}
          icon={<MdAndroid color={Colors.GRAY1} />}
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
      </ControlGroup>

      <AccessControl superAdmin={true}>
        <Fragment>
          <div className="bp-sa-menu-header">{lang.tr('admin.sideMenu.management')}</div>
          <ControlGroup vertical={true} fill={true}>
            <MenuItem
              id="btn-menu-version"
              text={lang.tr('admin.sideMenu.sourceControl')}
              icon="changes"
              url="/server/version"
            />
            <MenuItem
              id="btn-menu-license"
              text={lang.tr('admin.sideMenu.serverLicense')}
              icon={<MdCopyright color={Colors.GRAY1} />}
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
          </ControlGroup>

          <div className="bp-sa-menu-header">{lang.tr('admin.sideMenu.health')}</div>
          <ControlGroup vertical={true} fill={true}>
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
            <MenuItem text={lang.tr('admin.sideMenu.debug')} id="btn-menu-debug" icon="console" url="/server/debug" />
          </ControlGroup>
        </Fragment>
      </AccessControl>

      <div className="bp-sa-menu-header">{lang.tr('admin.sideMenu.announcements')}</div>
      <ControlGroup vertical={true} fill={true}>
        <MenuItem
          text={lang.tr('admin.sideMenu.latestReleases')}
          id="btn-menu-releases"
          icon="feed"
          url="/latestReleases"
          tag={renderLatestReleaseTag()}
        />
      </ControlGroup>
    </div>
  )
}

const mapStateToProps = (state: AppState) => ({
  licensing: state.licensing.license,
  version: state.version
})

const connector = connect(mapStateToProps, { fetchCurrentVersion, fetchLatestVersions })
export default withRouter(connector(Menu))
