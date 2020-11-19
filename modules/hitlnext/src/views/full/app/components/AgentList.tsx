import { Colors, Position, Spinner, Tooltip } from '@blueprintjs/core'
import { agentName } from '../../shared/helper'
import _, { Dictionary } from 'lodash'
import React, { FC } from 'react'
import { Initial } from 'react-initial'

import { IAgent } from '../../../../types'

interface Props {
  agents: Dictionary<IAgent>
  loading: boolean
}

const AgentList: FC<Props> = props => {
  function dotStyle(online) {
    return {
      top: -3,
      right: -3,
      position: 'absolute' as 'absolute',
      width: 8,
      height: 8,
      backgroundColor: online ? Colors.GREEN1 : Colors.RED1,
      borderRadius: '50%'
    }
  }

  return (
    <div>
      {props.loading && <Spinner></Spinner>}

      {!props.loading && !_.isEmpty(props.agents) && (
        <ul style={{ padding: 0, margin: 0, listStyleType: 'none' }}>
          {_.filter(_.values(props.agents), 'online').map(agent => (
            <li key={agent.agentId} style={{ display: 'inline', marginRight: '8px' }}>
              <Tooltip content={agentName(agent)} position={Position.BOTTOM}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Initial
                    style={{ borderRadius: '50%' }}
                    name={agentName(agent)}
                    charCount={2}
                    height={30}
                    width={30}
                    fontSize={12}
                    fontWeight={500}
                  ></Initial>
                </div>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default AgentList
