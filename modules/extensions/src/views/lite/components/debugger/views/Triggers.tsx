import { NDU } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, Fragment } from 'react'

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
          QnA<span className={style.confidence}>{totalQnA}%</span>
        </p>
        <ul>
          <li>
            Inside Topic
            <span className={style.confidence}>{getConfidence('faq_trigger_inside_topic')}%</span>
          </li>
          <li>
            Outside Topic
            <span className={style.confidence}>{getConfidence('faq_trigger_outside_topic')}%</span>
          </li>
          <li>
            Inside Workflow
            <span className={style.confidence}>{getConfidence('faq_trigger_inside_wf')}%</span>
          </li>
        </ul>
      </div>
      <div className={style.subSection}>
        <p>
          WF<span className={style.confidence}>{totalWF}%</span>
        </p>
        <ul>
          <li>
            Inside Topic
            <span className={style.confidence}>{getConfidence('wf_trigger_inside_topic')}%</span>
          </li>
          <li>
            Outside Topic
            <span className={style.confidence}>{getConfidence('wf_trigger_outside_topic')}%</span>
          </li>
          <li>
            Inside Workflow
            <span className={style.confidence}>{getConfidence('wf_trigger_inside_wf')}%</span>
          </li>
        </ul>
      </div>
      <div className={style.subSection}>
        <p>
          Node<span className={style.confidence}>{getConfidence('node_trigger_inside_wf')}%</span>
        </p>
        <ul>
          <li>
            Inside Workflow
            <span className={style.confidence}>{getConfidence('node_trigger_inside_wf')}%</span>
          </li>
        </ul>
      </div>
    </Fragment>
  )
}
