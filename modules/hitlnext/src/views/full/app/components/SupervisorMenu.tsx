import { AxiosInstance } from 'axios'
import { Button, Icon } from '@blueprintjs/core'
import { lang, MoreOptions } from 'botpress/shared'
import React, { FC, useState } from 'react'

import { IAgent } from '../../../../types'
import style from '../../style.scss'
import CreateAgentModal from './CreateAgentModal'

interface Props {
  bp: { axios: AxiosInstance; events: any }
}

const SupervisorMenu: FC<Props> = ({ bp }) => {
  const [display, setDisplay] = useState(false)
  const [createAgentModalOpen, setCreateAgentModalOpen] = useState(false)

  const optionsItems = [
    {
      label: 'Create new agent',
      action: () => {
        setCreateAgentModalOpen(true)
      }
    },
    {
      label: 'Manage agents lol',
      action: () => {
        console.log('Hello')
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
