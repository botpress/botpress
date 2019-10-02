import { Colors, ControlGroup, Icon } from '@blueprintjs/core'
import cx from 'classnames'
import React from 'react'
import { MdAndroid, MdCopyright } from 'react-icons/md'
import { generatePath, withRouter } from 'react-router'
import { matchPath } from 'react-router-dom'
import { getActiveWorkspace } from '~/Auth'

const Menu = props => {
  const MenuItem = ({ text, icon, url, id }) => {
    const active = matchPath(props.location.pathname, { path: url })
    const workspaceId = getActiveWorkspace()

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
        <MenuItem id="btn-menu-users" text="Collaborators" icon="people" url="/workspace/:workspaceId?/users" />
        <MenuItem id="btn-menu-roles" text="Roles" icon="shield" url="/workspace/:workspaceId?/roles" />
      </ControlGroup>

      <div className="bp-sa-menu-header">Management</div>
      <ControlGroup vertical={true} fill={true}>
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
        <MenuItem id="btn-menu-language" text="Languages" icon="globe-network" url="/server/languages" />
        <MenuItem id="btn-menu-debug" text="Debug" icon="console" url="/server/debug" />
      </ControlGroup>

      <div className="bp-sa-menu-header">Health</div>
      <ControlGroup vertical={true} fill={true}>
        <MenuItem id="btn-menu-monitoring" text="Monitoring" icon="timeline-line-chart" url="/server/monitoring" />
        <MenuItem id="btn-menu-alerting" text="Alerting" icon="notifications" url="/server/alerting" />
      </ControlGroup>
    </div>
  )
}
export default withRouter(Menu)
