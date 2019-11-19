import { Colors, ControlGroup, Icon, Intent, Tag } from '@blueprintjs/core'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useEffect } from 'react'
import { MdAndroid, MdCopyright } from 'react-icons/md'
import { connect } from 'react-redux'
import { generatePath, RouteComponentProps, withRouter } from 'react-router'
import { matchPath } from 'react-router-dom'
import { getActiveWorkspace } from '~/Auth'

import { fetchCurrentVersion, fetchLatestVersions, VersionState } from '../reducers/versions'

import AccessControl from './AccessControl'

type MenuProps = {
  licensing: any
  version: VersionState
  fetchCurrentVersion: Function
  fetchLatestVersions: Function
} & RouteComponentProps

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

const Menu: FC<MenuProps> = props => {
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
    if (latest !== current) {
      return (
        <Tag minimal intent={Intent.SUCCESS}>
          new
        </Tag>
      )
    }
  }

  return (
    <div className="bp-sa-menu">
      <div className="bp-sa-menu-header"> Workspace</div>
      <ControlGroup vertical={true} fill={true}>
        <MenuItem
          id="btn-menu-bots"
          text="Bots"
          icon={<MdAndroid color={Colors.GRAY1} />}
          url="/workspace/:workspaceId?/bots"
          resource="user.bots.*"
          operation="read"
        />
        <MenuItem
          id="btn-menu-users"
          text="Collaborators"
          icon="user"
          url="/workspace/:workspaceId?/users"
          resource="admin.collaborators.*"
          operation="read"
          isPro={true}
        />

        <MenuItem
          id="btn-menu-roles"
          text="Roles"
          icon="shield"
          url="/workspace/:workspaceId?/roles"
          resource="admin.roles.*"
          operation="read"
          isPro={true}
        />
      </ControlGroup>

      <AccessControl superAdmin={true}>
        <Fragment>
          <div className="bp-sa-menu-header">Management</div>
          <ControlGroup vertical={true} fill={true}>
            <MenuItem id="btn-menu-version" text="Source Control" icon="changes" url="/server/version" />
            <MenuItem
              id="btn-menu-license"
              text="Server License"
              icon={<MdCopyright color={Colors.GRAY1} />}
              url="/server/license"
            />
            <MenuItem text="Languages" id="btn-menu-language" icon="globe-network" url="/server/languages" />
            <MenuItem text="Production Checklist" id="btn-menu-checklist" icon="endorsed" url="/checklist" />
          </ControlGroup>

          <div className="bp-sa-menu-header">Health</div>
          <ControlGroup vertical={true} fill={true}>
            <MenuItem id="btn-menu-monitoring" text="Monitoring" icon="timeline-line-chart" url="/server/monitoring" />
            <MenuItem id="btn-menu-alerting" text="Alerting" icon="notifications" url="/server/alerting" />
            <MenuItem text="Debug" id="btn-menu-debug" icon="console" url="/server/debug" />
          </ControlGroup>
        </Fragment>
      </AccessControl>

      <div className="bp-sa-menu-header">Announcements</div>
      <ControlGroup vertical={true} fill={true}>
        <MenuItem
          text="Latest Releases"
          id="btn-menu-releases"
          icon="feed"
          url="/latestReleases"
          tag={renderLatestReleaseTag()}
        />
      </ControlGroup>
    </div>
  )
}

const mapStateToProps = state => ({ licensing: state.license.licensing, version: state.version })
const mapDispatchToProps = { fetchCurrentVersion, fetchLatestVersions }

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(Menu)
)
