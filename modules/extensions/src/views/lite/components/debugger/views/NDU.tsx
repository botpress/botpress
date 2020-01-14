import { H5, Pre } from '@blueprintjs/core'
import { IO } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC } from 'react'

import style from '../style.scss'

const sortTriggersByScore = triggers => {
  const result = Object.keys(triggers).map(id => {
    const trigger = triggers[id]
    const values = _.values(trigger.result)
    const score = _.sum(values) / values.length

    return { id, goal: trigger.goal, result: trigger.result, score: isNaN(score) ? -1 : score }
  })

  return _.orderBy(result, 'score', 'desc')
}

export const NDU: FC<{ ndu: IO.DialogUnderstanding }> = ({ ndu }) => {
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
      <li>
        {id}: {_.round(results[id], 3)}
      </li>
    ))
  }

  return (
    <Pre className={style.inspectorContainer}>
      <H5>Actions</H5>
      <ul>
        {ndu.actions.map(({ action, data }) => {
          let result = ''
          if (action === 'send') {
            result = `Send knowledge ${data.sourceDetails}`
          } else if (action === 'redirect') {
            result = `Redirect to ${data.flow}`
          } else if (action === 'continue') {
            result = 'Continue flow execution'
          }
          return <li>{result}</li>
        })}
      </ul>
      <H5>Triggers</H5>
      {sorted.map(trigger => {
        return (
          <div style={{ paddingBottom: 10 }}>
            <strong>{trigger.goal.replace('.flow.json', '')}</strong>
            <small> ({trigger.id}) </small>
            <ul>{listResults(trigger.result)}</ul>
          </div>
        )
      })}
    </Pre>
  )
}
