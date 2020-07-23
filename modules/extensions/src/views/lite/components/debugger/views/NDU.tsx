import { Button } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useState } from 'react'

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

const NDU: FC<{ ndu: sdk.NDU.DialogUnderstanding }> = ({ ndu }) => {
  const [viewJSON, setViewJSON] = useState(false)
  const [showFullId, setShowFullId] = useState<any>({})

  const toggleView = () => {
    setViewJSON(!viewJSON)
  }

  const getPercentage = (number: number) => {
    return _.round(number * 100, 3)
  }

  const renderContent = () => {
    if (viewJSON) {
      return <Inspector data={ndu} />
    }

    return (
      <Fragment>
        <div className={style.section}>
          <div className={style.sectionTitle}>Top Triggers</div>
          {sorted.map((trigger, index) => {
            return (
              <div key={index} className={style.subSection}>
                <p
                  className={cx(style.canShowFull, { [style.truncate]: !showFullId[trigger.id] })}
                  onClick={e => setShowFullId({ ...showFullId, [trigger.id]: !showFullId[trigger.id] })}
                >
                  {trigger.id}
                </p>
                <ul>{listResults(trigger.result)}</ul>
              </div>
            )
          })}
        </div>
        <div className={style.section}>
          <div className={style.sectionTitle}>Decisions Taken</div>
          <ul>
            {ndu.actions.map(({ action, data }, index) => {
              switch (action) {
                case 'send':
                  return <li key={index}>Send knowledge {(data as sdk.NDU.SendContent).sourceDetails}</li>
                case 'startWorkflow':
                  return <li key={index}>Start Workflow {(data as sdk.NDU.FlowRedirect).flow}</li>
                case 'goToNode':
                  return <li key={index}>Go to node {(data as sdk.NDU.FlowRedirect).node}</li>
                case 'redirect':
                  return <li key={index}>Redirect to {(data as sdk.NDU.FlowRedirect).flow}</li>
                case 'continue':
                  return <li key={index}>Continue flow execution</li>
                case 'prompt.inform':
                  return <li key={index}>Inform current prompt</li>
                case 'prompt.cancel':
                  return <li key={index}>Cancel current prompt</li>
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
      return <li>No results</li>
    }

    return keys.map(id => (
      <li key={id}>
        {id}: {getPercentage(results[id])}%
      </li>
    ))
  }

  return (
    <Fragment>
      <Collapsible name="Dialog Understanding">
        {renderContent()}
        <Button minimal className={style.switchViewBtn} icon="eye-open" onClick={toggleView}>
          {viewJSON ? 'View as Summary' : 'View as JSON'}
        </Button>
      </Collapsible>
    </Fragment>
  )
}

export default NDU
