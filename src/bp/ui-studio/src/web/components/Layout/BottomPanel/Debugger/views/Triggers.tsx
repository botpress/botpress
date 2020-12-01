import { Position, Tooltip } from '@blueprintjs/core'
import { NDU } from 'botpress/sdk'
import { ContentSection, lang } from 'botpress/shared'
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
    <ContentSection title={lang.tr('triggers')} className={style.section}>
      <div className={style.triggersContainer}>
        <div className={style.group}>
          <div className={style.triggerGroup}>
            <PercentBar
              label="in"
              desc={lang.tr('bottomPanel.debugger.triggers.insideTopic')}
              percent={getConfidence('faq_trigger_inside_topic')}
            />
            <PercentBar
              label="out"
              desc={lang.tr('bottomPanel.debugger.triggers.outsideTopic')}
              percent={getConfidence('faq_trigger_outside_topic')}
            />
            <PercentBar
              label="in wf"
              desc={lang.tr('bottomPanel.debugger.triggers.insideWorkflow')}
              percent={getConfidence('faq_trigger_inside_wf')}
            />
          </div>
          {lang.tr('bottomPanel.debugger.triggers.qna')}
        </div>
        <div className={style.group}>
          <div className={style.triggerGroup}>
            <PercentBar
              label="in"
              desc={lang.tr('bottomPanel.debugger.triggers.insideTopic')}
              percent={getConfidence('wf_trigger_inside_topic')}
            />
            <PercentBar
              label="out"
              desc={lang.tr('bottomPanel.debugger.triggers.outsideTopic')}
              percent={getConfidence('wf_trigger_outside_topic')}
            />
            <PercentBar
              label="in wf"
              desc={lang.tr('bottomPanel.debugger.triggers.insideWorkflow')}
              percent={getConfidence('wf_trigger_inside_wf')}
            />
          </div>
          {lang.tr('bottomPanel.debugger.triggers.wf')}
        </div>
        <div className={style.group}>
          <div className={style.triggerGroup}>
            <PercentBar
              label="in"
              desc={lang.tr('bottomPanel.debugger.triggers.insideWorkflow')}
              percent={getConfidence('node_trigger_inside_wf')}
            />
          </div>
          {lang.tr('bottomPanel.debugger.triggers.node')}
        </div>
      </div>
    </ContentSection>
  )
}
