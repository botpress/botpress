import { Icon, Tooltip } from '@blueprintjs/core'
import _ from 'lodash'
import React, { FC } from 'react'
import { connect } from 'react-redux'
import { getCallerFlowsOutcomeUsage } from '~/reducers'

import style from './style.scss'

interface OutcomeProps {
  outcomes?: { condition: string; caption: string; node: string }[]
  nodeName: string
}

const OutcomeUsage: FC<OutcomeProps> = props => {
  const isUsed = !!props.outcomes?.find(x => x.condition === `lastNode=${props.nodeName}`)

  return (
    <div className={style.header}>
      <span className={style.fullSize}>{props.nodeName}</span>
      <div>
        {isUsed && (
          <Tooltip content="This outcome is in use and cannot be deleted" position="top">
            <Icon icon="lock" iconSize={12} color="black"></Icon>
          </Tooltip>
        )}
        <Tooltip content={props.nodeName} position="top">
          <Icon icon="tag" iconSize={12} color="black"></Icon>
        </Tooltip>
      </div>
    </div>
  )
}

const mapStateToProps = state => ({ outcomes: getCallerFlowsOutcomeUsage(state) })
export default connect(mapStateToProps)(OutcomeUsage)
