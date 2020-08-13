import { NDU } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, Fragment } from 'react'

import lang from '../../../../lang'
import style from '../style.scss'

interface Props {
  ndu: NDU.DialogUnderstanding
}

export const Triggers: FC<Props> = props => {
  const { predictions } = props.ndu

  const getConfidence = (key: string) => {
    return _.round(predictions[key]?.confidence * 100, 2)
  }

  const totalQnA =
    getConfidence('faq_trigger_inside_topic') +
    getConfidence('faq_trigger_outside_topic') +
    getConfidence('faq_trigger_inside_wf')
  const totalWF =
    getConfidence('wf_trigger_inside_topic') +
    getConfidence('wf_trigger_outside_topic') +
    getConfidence('wf_trigger_inside_wf')

  return (
    <Fragment>
      <div className={style.subSection}>
        <p>
          {lang.tr('module.extensions.triggers.qna')}
          <span className={style.confidence}>{totalQnA}%</span>
        </p>
        <ul>
          <li>
            {lang.tr('module.extensions.triggers.insideTopic')}
            <span className={style.confidence}>{getConfidence('faq_trigger_inside_topic')}%</span>
          </li>
          <li>
            {lang.tr('module.extensions.triggers.outsideTopic')}
            <span className={style.confidence}>{getConfidence('faq_trigger_outside_topic')}%</span>
          </li>
          <li>
            {lang.tr('module.extensions.triggers.insideWorkflow')}
            <span className={style.confidence}>{getConfidence('faq_trigger_inside_wf')}%</span>
          </li>
        </ul>
      </div>
      <div className={style.subSection}>
        <p>
          {lang.tr('module.extensions.triggers.wf')}
          <span className={style.confidence}>{totalWF}%</span>
        </p>
        <ul>
          <li>
            {lang.tr('module.extensions.triggers.insideTopic')}
            <span className={style.confidence}>{getConfidence('wf_trigger_inside_topic')}%</span>
          </li>
          <li>
            {lang.tr('module.extensions.triggers.outsideTopic')}
            <span className={style.confidence}>{getConfidence('wf_trigger_outside_topic')}%</span>
          </li>
          <li>
            {lang.tr('module.extensions.triggers.insideWorkflow')}
            <span className={style.confidence}>{getConfidence('wf_trigger_inside_wf')}%</span>
          </li>
        </ul>
      </div>
      <div className={style.subSection}>
        <p>
          {lang.tr('module.extensions.triggers.node')}
          <span className={style.confidence}>{getConfidence('node_trigger_inside_wf')}%</span>
        </p>
        <ul>
          <li>
            {lang.tr('module.extensions.triggers.insideWorkflow')}
            <span className={style.confidence}>{getConfidence('node_trigger_inside_wf')}%</span>
          </li>
        </ul>
      </div>
    </Fragment>
  )
}
