import { Button, Icon } from '@blueprintjs/core'
import { lang, MoreOptions } from 'botpress/shared'
import React, { FC, useState } from 'react'

import style from '../style.scss'

import { AgentType } from './../../../types'
import AgentIcon from './AgentIcon'

type Props = {
  toggleOnline: (online) => {}
  loading: boolean
} & Partial<AgentType>

const AgentProfile: FC<Props> = ({ toggleOnline, online, loading }) => {
  const [showingOption, setShowingOption] = useState(false)

  const optionsItems = [
    {
      label: lang.tr(`module.hitl2.agent.${online ? 'getOffline' : 'getOnline'}`),
      action: () => {
        toggleOnline(!online)
      }
    }
  ]

  return (
    <div className={style.agentBtnWrapper}>
      <MoreOptions
        element={
          <Button className={style.agentBtn} onClick={() => setShowingOption(true)} loading={loading} minimal={true}>
            <AgentIcon online={online} />
            <span className={style.agentBtnText}>
              {online ? lang.tr('module.hitl2.agent.online') : lang.tr('module.hitl2.agent.offline')}
            </span>
            <Icon icon="chevron-down"></Icon>
          </Button>
        }
        show={showingOption}
        onToggle={() => setShowingOption(false)}
        items={optionsItems}
      />
    </div>
  )
}

export default AgentProfile
