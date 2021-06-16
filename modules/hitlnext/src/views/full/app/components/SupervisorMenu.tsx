import { Button, Icon } from '@blueprintjs/core'
import { lang, MoreOptions } from 'botpress/shared'
import React, { FC, useState } from 'react'

import { IAgent } from '../../../../types'
import style from '../../style.scss'

type Props = {
  setOnline: (online) => {}
  loading: boolean
} & Partial<IAgent>

const SupervisorMenu: FC<Props> = ({ setOnline, online, loading }) => {
  const [display, setDisplay] = useState(false)

  const optionsItems = [
    {
      label: 'Create new agent',
      action: () => {
        setOnline(!online)
      }
    },
    {
      label: 'Manage agents',
      action: () => {
        setOnline(!online)
      }
    }
  ]

  return (
    <div className={style.agentBtnWrapper}>
      <MoreOptions
        element={
          <Button className={style.agentBtn} onClick={() => setDisplay(true)} loading={loading} minimal={true}>
            <span className={style.agentBtnText}>Test</span>
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
