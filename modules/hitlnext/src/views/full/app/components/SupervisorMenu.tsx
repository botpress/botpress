import { AxiosInstance } from 'axios'
import { WorkspaceUserWithAttributes } from 'botpress/sdk'
import { Button, Icon } from '@blueprintjs/core'
import { lang, MoreOptions } from 'botpress/shared'
import React, { FC, useState } from 'react'
import _, { Dictionary } from 'lodash'
import { IAgent } from '../../../../types'
import style from '../../style.scss'
import CreateAgentModal from './CreateAgentModal'
import ManageAgentsModal from './ManageAgentsModal'

interface Props {
  bp: { axios: AxiosInstance; events: any }
  agents: WorkspaceUserWithAttributes[]
}

const SupervisorMenu: FC<Props> = ({ bp, agents }) => {
  const [display, setDisplay] = useState(false)
  const [createAgentModalOpen, setCreateAgentModalOpen] = useState(false)
  const [manageAgentsModalOpen, setManageAgentsModalOpen] = useState(false)

  const optionsItems = [
    {
      label: 'Create new agent',
      action: () => {
        setCreateAgentModalOpen(true)
      }
    },
    {
      label: 'Manage agents',
      action: () => {
        setManageAgentsModalOpen(true)
      }
    }
  ]

  return (
    <div className={style.agentBtnWrapper}>
      <CreateAgentModal
        bp={bp}
        isOpen={createAgentModalOpen}
        toggleOpen={() => setCreateAgentModalOpen(!createAgentModalOpen)}
      />
      <ManageAgentsModal
        bp={bp}
        filteredAgents={agents}
        isOpen={manageAgentsModalOpen}
        toggleOpen={() => setManageAgentsModalOpen(!manageAgentsModalOpen)}
      />
      <MoreOptions
        element={
          <Button className={style.agentBtn} onClick={() => setDisplay(true)} minimal={true}>
            <span className={style.agentBtnText}>Supervisor Menu</span>
            <Icon icon="chevron-down"></Icon>
          </Button>
        }
        show={display}
        onToggle={() => setDisplay(false)}
        items={optionsItems}
      />
    </div>
  )
}

export default SupervisorMenu
