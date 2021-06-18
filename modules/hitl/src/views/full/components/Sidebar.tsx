import { Button, Classes, ControlGroup, Intent, Tooltip } from '@blueprintjs/core'
import { ModuleUI } from 'botpress/shared'
import React, { FC } from 'react'

import { HitlSessionOverview } from '../../../backend/typings'
import { UserList } from './UserList'

const { SearchBar } = ModuleUI

interface Props {
  toggleFilterPaused?: () => void
  setFilterSearchText: (terms: string) => void
  querySessions: () => void
  switchSession: (newSessionId: string) => void
  filterPaused: boolean
  currentSessionId: string
  sessions: HitlSessionOverview[]
}

const Sidebar: FC<Props> = props => {
  return (
    <div className="bph-sidebar">
      <div className="bph-sidebar-header">
        <ControlGroup fill={true}>
          <Tooltip
            content={props.filterPaused ? 'Show all conversations' : 'Show only paused conversations'}
            className={Classes.FIXED}
          >
            <Button
              icon="bookmark"
              intent={props.filterPaused ? Intent.PRIMARY : Intent.NONE}
              onClick={props.toggleFilterPaused}
              minimal={true}
              style={{ marginRight: 10 }}
            />
          </Tooltip>

          <SearchBar
            onChange={props.setFilterSearchText}
            placeholder="Search by name"
            onButtonClick={props.querySessions}
          />
        </ControlGroup>
      </div>

      <div className="bph-sidebar-users">
        <UserList
          sessions={props.sessions}
          currentSessionId={props.currentSessionId}
          switchSession={props.switchSession}
        />
      </div>
    </div>
  )
}

export default Sidebar
