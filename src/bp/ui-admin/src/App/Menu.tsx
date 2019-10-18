import { Colors, ControlGroup, Icon } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC } from 'react'
import { MdAndroid, MdCopyright } from 'react-icons/md'
import { connect } from 'react-redux'
import { generatePath, RouteComponentProps, withRouter } from 'react-router'
import { matchPath } from 'react-router-dom'
import { getActiveWorkspace } from '~/Auth'

type MenuProps = { licensing: any } & RouteComponentProps

interface MenuItemProps {
  text: string
  icon: any
  url: string
  id: string
  isPro?: boolean
}

const Menu: FC<MenuProps> = props => {
  const MenuItem = ({ text, icon, url, id, isPro }: MenuItemProps) => {
    const active = matchPath(props.location.pathname, { path: url })
    const workspaceId = getActiveWorkspace()

    if (!props.licensing || (isPro && !props.licensing.isPro)) {
      return null
    }

    return (
      <div
        id={id}
        className={cx('bp-sa-menu-item', { ['bp-sa-menu-item-active']: active })}
        onClick={() => props.history.push(generatePath(url, { workspaceId: workspaceId || undefined }))}
      >
        <Icon icon={icon} />
        <span className="label">{text}</span>
      </div>
    )
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
        />
        <MenuItem
          id="btn-menu-users"
          text="Collaborators"
          icon="user"
          url="/workspace/:workspaceId?/users"
          isPro={true}
        />

        <MenuItem id="btn-menu-roles" text="Roles" icon="shield" url="/workspace/:workspaceId?/roles" isPro={true} />
      </ControlGroup>

      <div className="bp-sa-menu-header">Management</div>
      <ControlGroup vertical={true} fill={true}>
        <MenuItem text="Latest Releases" id="btn-menu-releases" icon="feed" url="/latestReleases" />
        <MenuItem id="btn-menu-version" text="Source Control" icon="changes" url="/server/version" />
        <MenuItem
          id="btn-menu-license"
          text="Server License"
          icon={<MdCopyright color={Colors.GRAY1} />}
          url="/server/license"
        />
      </ControlGroup>

      <div className="bp-sa-menu-header">Core</div>
      <ControlGroup vertical={true} fill={true}>
        <MenuItem text="Production Checklist" id="btn-menu-checklist" icon="endorsed" url="/checklist" />
        <MenuItem text="Languages" id="btn-menu-language" icon="globe-network" url="/server/languages" />
        <MenuItem text="Debug" id="btn-menu-debug" icon="console" url="/server/debug" />
      </ControlGroup>

      <div className="bp-sa-menu-header">Health</div>
      <ControlGroup vertical={true} fill={true}>
        <MenuItem id="btn-menu-monitoring" text="Monitoring" icon="timeline-line-chart" url="/server/monitoring" />
        <MenuItem id="btn-menu-alerting" text="Alerting" icon="notifications" url="/server/alerting" />
      </ControlGroup>
    </div>
  )
}

const mapStateToProps = state => ({ licensing: state.license.licensing })

export default withRouter(
  connect(
    mapStateToProps,
    undefined
  )(Menu)
)
