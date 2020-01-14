import { Container } from 'botpress/ui'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { NduLog } from '../../backend/typings'

import style from './style.scss'

interface GroupedLogs {
  [goalId: string]: NduLog[]
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

const LogRow: FC<{ logs: NduLog[]; triggers: TriggerHead[] }> = ({ logs, triggers }) => {
  return (
    <React.Fragment>
      {logs.map(log => {
        return (
          <tr>
            <td style={{ paddingLeft: 10 }}>
              Text: <strong>{log.text}</strong>
            </td>
            {log.triggers &&
              triggers.map(triggerId => {
                const trigger = log.triggers[triggerId.id]
                const isValid = !_.isEmpty(trigger.result) && _.every(_.values(trigger.result), x => x > 0.5)

                return (
                  <td style={{ backgroundColor: isValid && 'lightgray' }}>
                    <ul>{listResults(trigger.result)}</ul>
                  </td>
                )
              })}
          </tr>
        )
      })}
    </React.Fragment>
  )
}

const Conversation: FC<{ logs: NduLog[]; idx: number; triggers: TriggerHead[] }> = ({ logs, idx, triggers }) => {
  const result = _.get(logs.find(x => x.result), 'result')
  const goal = _.get(logs.find(x => x.currentGoal), 'currentGoal')
  const target = _.get(logs.find(x => x.target), 'target')

  return (
    <React.Fragment>
      <tr>
        <td colSpan={10} className={cx(style.sep, [style[result]])}>
          # {idx} - {goal} - {target}
        </td>
      </tr>

      <LogRow logs={logs} triggers={triggers} />
    </React.Fragment>
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

    // setTriggers(_.uniq(_.flatMap(data, r => Object.keys(r.triggers || {}))))

    getTriggers(data)
    setData(_.groupBy(data, x => x.currentGoalId))
  }

  const getTriggers = (rows: NduLog[]) => {
    const triggerIds = _.uniq(_.flatMap(rows, r => Object.keys(r.triggers || {})))
    const triggers = triggerIds.map(id => ({
      id,
      goal: _.get(rows.find(x => x.triggers && x.triggers[id]), `triggers['${id}'].goal`)
    }))

    setTriggers(triggers)
  }

  const goalRows = Object.keys(data).filter(x => x !== 'null')
  const outOfGoalRows = Object.keys(data).filter(x => x === 'null')

  return (
    <Container sidePanelHidden={true}>
      <div />
      <div className={style.container}>
        <h4>Goals</h4>
        <table>
          <tr>
            <th>Preview</th>
            {triggers.map(t => (
              <th key={t.id}>
                {t.goal.replace('.flow.json', '')}
                <br /> <small>{t.id}</small>
              </th>
            ))}
          </tr>

          {goalRows.map((key, idx) => (
            <Conversation key={idx} idx={idx} logs={data[key]} triggers={triggers} />
          ))}
        </table>

        <h4>Out of goals</h4>

        {outOfGoalRows.map((key, idx) => {
          return (
            <div key={idx}>
              {data[key].map(x => (
                <LogRow logs={[x]} triggers={triggers} />
              ))}
            </div>
          )
        })}
      </div>
    </Container>
  )
}

export default FullView
