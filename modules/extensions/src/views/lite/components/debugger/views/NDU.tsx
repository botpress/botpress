import { Button } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'

import ToolTip from '../../../../../../../../src/bp/ui-shared-lite/ToolTip'
import lang from '../../../../lang'
import { Collapsible } from '../components/Collapsible'
import style from '../style.scss'

import { Inspector } from './Inspector'

const sortTriggersByScore = triggers => {
  const result = Object.keys(triggers).map(id => {
    const trigger = triggers[id]
    const values = _.values(trigger.result)
    const score = _.sum(values) / values.length

    return { id, result: trigger.result, score: isNaN(score) ? -1 : score }
  })

  return _.orderBy(result, 'score', 'desc')
}

interface Props {
  ndu: sdk.NDU.DialogUnderstanding
  isExpanded: (key: string) => boolean
  toggleExpand: (section: string, expanded: boolean) => void
}

const NDU_JSON = 'json::ndu'
const NDU_PANEL = 'panel::ndu'

const NDU: FC<Props> = ({ ndu, isExpanded, toggleExpand }) => {
  const [viewJSON, setViewJSON] = useState(isExpanded(NDU_JSON))

  useEffect(() => {
    setViewJSON(isExpanded(NDU_JSON))
  }, [isExpanded(NDU_JSON)])

  const toggleView = () => {
    const newValue = !viewJSON
    toggleExpand(NDU_JSON, newValue)
    setViewJSON(newValue)
  }

  const getPercentage = (number: number) => {
    return _.round(number * 100, 2)
  }

  const renderContent = () => {
    if (viewJSON) {
      return <Inspector data={ndu} />
    }

    return (
      <Fragment>
        <div className={style.section}>
          <div className={style.sectionTitle}>{lang.tr('module.extensions.ndu.topTriggers')}</div>
          {_.take(sorted, 5).map((trigger, index) => {
            return (
              <div key={index} className={style.subSection}>
                <ToolTip content={trigger.id}>
                  <p className={cx(style.canShowFull, style.truncate)}>{trigger.id}</p>
                </ToolTip>
                <ul>{listResults(trigger.result)}</ul>
              </div>
            )
          })}
        </div>
        <div className={style.section}>
          <div className={style.sectionTitle}>{lang.tr('module.extensions.ndu.decisionsTaken')}</div>
          <ul>
            {ndu.actions.map(({ action, data }, index) => {
              switch (action) {
                case 'send':
                  return (
                    <li key={index}>
                      {lang.tr('module.extensions.ndu.sendKnowledge', {
                        x: (data as sdk.NDU.SendContent).sourceDetails
                      })}
                    </li>
                  )
                case 'startWorkflow':
                  return (
                    <li key={index}>
                      {lang.tr('module.extensions.ndu.startWorkflow', {
                        x: (data as sdk.NDU.FlowRedirect).flow
                      })}
                    </li>
                  )
                case 'goToNode':
                  return (
                    <li key={index}>
                      {lang.tr('module.extensions.ndu.goToNode', {
                        x: (data as sdk.NDU.FlowRedirect).node
                      })}
                    </li>
                  )
                case 'redirect':
                  return (
                    <li key={index}>
                      {lang.tr('module.extensions.ndu.redirectTo', {
                        x: (data as sdk.NDU.FlowRedirect).flow
                      })}
                    </li>
                  )
                case 'continue':
                  return <li key={index}>{lang.tr('module.extensions.ndu.continueFlowExecution')}</li>
                case 'prompt.inform':
                  return <li key={index}>{lang.tr('module.extensions.ndu.informCurrentPrompt')}</li>
                case 'prompt.cancel':
                  return <li key={index}>{lang.tr('module.extensions.ndu.cancelCurrentPrompt')}</li>
              }
            })}
          </ul>
        </div>
      </Fragment>
    )
  }

  if (!ndu || !ndu.triggers) {
    return null
  }

  const sorted = sortTriggersByScore(ndu.triggers)

  const listResults = results => {
    const keys = Object.keys(results || [])
    if (!keys.length) {
      return <li>{lang.tr('module.extensions.ndu.noResults')}</li>
    }

    return keys.map(id => (
      <li key={id}>
        {id}: {getPercentage(results[id])}%
      </li>
    ))
  }

  return (
    <Fragment>
      <Collapsible
        opened={isExpanded(NDU_PANEL)}
        toggleExpand={expanded => toggleExpand(NDU_PANEL, expanded)}
        name={lang.tr('module.extensions.ndu.dialogUnderstanding')}
      >
        {renderContent()}
        <Button minimal className={style.switchViewBtn} icon="eye-open" onClick={toggleView}>
          {viewJSON ? lang.tr('module.extensions.viewAsSummary') : lang.tr('module.extensions.viewAsJson')}
        </Button>
      </Collapsible>
    </Fragment>
  )
}

export default NDU
