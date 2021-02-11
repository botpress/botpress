import { Position, Spinner, Tooltip } from '@blueprintjs/core'
import cx from 'classnames'
import _, { Dictionary } from 'lodash'
import React, { FC } from 'react'
import { Initial } from 'react-initial'

import { agentName } from '../../../../helper'
import { IAgent } from '../../../../types'

import styles from './../../style.scss'

interface Props {
  agents: Dictionary<IAgent>
  loading: boolean
}

const AgentList: FC<Props> = ({ agents, loading }) => {
  if (!loading && _.isEmpty(agents)) {
    return <div />
  }

  if (loading) {
    return (
      <div>
        <Spinner></Spinner>
      </div>
    )
  }

  return (
    <div>
      <ul className={cx(styles.agentList)}>
        {Object.values(agents)
          .filter(a => a.online)
          .map(agent => (
            <li key={agent.agentId} className={cx(styles.agentListItem)}>
              <Tooltip content={agentName(agent)} position={Position.BOTTOM}>
                {agent.attributes?.picture_url && (
                  <img className={styles.agentItem} src={agent.attributes.picture_url} />
                )}
                {!agent.attributes?.picture_url && (
                  <Initial
                    className={styles.agentItem}
                    name={agentName(agent)}
                    charCount={2}
                    height={30}
                    width={30}
                    fontSize={12}
                    fontWeight={500}
                  ></Initial>
                )}
              </Tooltip>
            </li>
          ))}
      </ul>
    </div>
  )
}

export default AgentList
