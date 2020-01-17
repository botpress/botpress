import sdk from 'botpress/sdk'
import { Container } from 'botpress/ui'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import style from './style.scss'

type StoredEventIncoming = sdk.IO.StoredEvent & { event: sdk.IO.IncomingEvent; success: any }

interface GroupedLogs {
  [goalId: string]: StoredEventIncoming[]
}

interface TriggerHead {
  id: string
  goal: string
}

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

const LogRow: FC<{ logs: StoredEventIncoming[]; triggers: TriggerHead[] }> = ({ logs, triggers }) => {
  return (
    <React.Fragment>
      {logs.map(({ event }) => {
        return (
          <tr>
            <td style={{ paddingLeft: 10 }}>
              Text: <strong>{event.preview}</strong>
            </td>
            {event.ndu.triggers &&
              triggers.map(triggerId => {
                const trigger = event.ndu.triggers[triggerId.id]
                const isValid = !_.isEmpty(trigger?.result) && _.every(_.values(trigger?.result), x => x > 0.5)

                return (
                  <td style={{ backgroundColor: isValid && 'lightgray' }}>
                    <ul>{listResults(trigger?.result)}</ul>
                  </td>
                )
              })}
            <td>
              {event.ndu.actions?.map(({ action, data }) => (
                <div>
                  {action} {_.get(data, 'flow', '')}
                </div>
              ))}
            </td>
          </tr>
        )
      })}
    </React.Fragment>
  )
}

const Conversation: FC<{ logs: StoredEventIncoming[]; idx: number; triggers: TriggerHead[] }> = ({
  logs,
  idx,
  triggers
}) => {
  const success = _.get(
    logs.find(x => x.success != null),
    'success'
  )

  let status = 'n/a'
  if (success === true || success === 1) {
    status = 'success'
  } else if (success === false || success === 0) {
    status = 'failure'
  }

  const { event, feedback, target } = logs[0]

  let feedbackText = 'No feedback'
  if (feedback !== null) {
    feedbackText = feedback === -1 ? 'Negative experience' : 'Positive experience'
  }

  return (
    <React.Fragment>
      <tr>
        <td colSpan={10} className={cx(style.sep, [style[status]])}>
          <strong>{event.state.session.lastGoals[0].goal}</strong> - {feedbackText} -{' '}
          <small>(for user: {target})</small>
        </td>
      </tr>

      <LogRow logs={logs} triggers={triggers} />
    </React.Fragment>
  )
}

const parseEvents = events => {
  return _.orderBy(
    events.map(entry => ({
      ...entry,
      event: JSON.parse(entry.event)
    })),
    ['id']
  )
}

const FullView = props => {
  const [data, setData] = useState<GroupedLogs>({})
  const [triggers, setTriggers] = useState<TriggerHead[]>([])

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    loadContent()
  }, [])

  const loadContent = async () => {
    const { data } = await props.bp.axios.get('/mod/ndu/events')

    const parsed = parseEvents(data)

    getTriggers(parsed)
    setData(_.groupBy(parsed, entry => entry.goalId))
  }

  const getTriggers = (rows: StoredEventIncoming[]) => {
    const triggerIds = _.uniq(_.flatMap(rows, r => Object.keys(r.event.ndu.triggers || {})))

    const triggers = triggerIds.map(id => ({
      id,
      goal: _.get(
        rows.find(row => row.event.ndu.triggers[id]),
        `event.ndu.triggers['${id}'].goal`
      )
    }))

    setTriggers(triggers)
  }

  const goalRows = Object.keys(data).filter(x => x !== 'null')

  return (
    <Container sidePanelHidden={true}>
      <div />
      <div className={style.container}>
        <h4>Goals</h4>
        <table>
          <thead>
            <tr>
              <th>Preview</th>
              {triggers.map(t => (
                <th key={t.id}>
                  {t.goal.replace('.flow.json', '')}
                  <br /> <small>{t.id}</small>
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {goalRows.map((key, idx) => (
              <Conversation key={idx} idx={idx} logs={data[key]} triggers={triggers} />
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  )
}

export default FullView
