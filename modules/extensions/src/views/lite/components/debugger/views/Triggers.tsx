import { Colors, H5, HTMLTable, Position, Tooltip } from '@blueprintjs/core'
import { NDU } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC } from 'react'

import style from '../style.scss'

interface Props {
  ndu: NDU.DialogUnderstanding
}

const PercentBar = props => {
  return (
    <div className={style.percentBar}>
      <Tooltip content={`${props.desc || ''} ${props.percent}%`} position={Position.RIGHT}>
        <div className={style.container}>
          {props.label}
          <div className={style.barContainer}>
            <div className={style.bar} style={{ height: props.percent / 2 }}></div>
          </div>
        </div>
      </Tooltip>
    </div>
  )
}

export const Triggers: FC<Props> = props => {
  const { predictions } = props.ndu

  const getConfidence = (key: string) => {
    return _.round(predictions[key]?.confidence * 100, 2)
  }

  return (
    <div className={style.subSection}>
      <div className={style.triggersContainer}>
        <div className={style.group}>
          <div className={style.triggerGroup}>
            <PercentBar label="in" desc="Inside Topic" percent={getConfidence('faq_trigger_inside_topic')} />
            <PercentBar label="out" desc="Outside Topic" percent={getConfidence('faq_trigger_outside_topic')} />
            <PercentBar label="in wf" desc="Inside workflow" percent={getConfidence('faq_trigger_inside_wf')} />
          </div>
          QnA
        </div>
        <div className={style.group}>
          <div className={style.triggerGroup}>
            <PercentBar label="in" desc="Inside Topic" percent={getConfidence('wf_trigger_inside_topic')} />
            <PercentBar label="out" desc="Outside Topic" percent={getConfidence('wf_trigger_outside_topic')} />
            <PercentBar label="in wf" desc="Inside workflow" percent={getConfidence('wf_trigger_inside_wf')} />
          </div>
          WF
        </div>
        <div className={style.group}>
          <div className={style.triggerGroup}>
            <PercentBar label="in" desc="Inside Workflow" percent={getConfidence('node_trigger_inside_wf')} />
          </div>
          Node
        </div>
      </div>
    </div>
  )
}
