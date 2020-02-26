import { Button, HTMLTable, Intent } from '@blueprintjs/core'
import React from 'react'

import { DbFlaggedEvent } from '../../../types'
import style from '../style.scss'
import { RESOLUTION } from '../util'

interface Props {
  events: DbFlaggedEvent[]
  resetEvent?: (id: string) => Promise<void>
}

const ResolvedEventsList = ({ events, resetEvent }: Props) =>
  events &&
  !!events.length && (
    <HTMLTable className={style.mainViewTable} condensed interactive striped>
      <thead>
        <tr>
          <th className={style.thPhrase}>Phrase</th>
          <th>Resolution</th>
          <th className={style.thUpdated}>Updated</th>
          <th className={style.thAction} />
        </tr>
      </thead>
      <tbody>
        {events.map((event, i) => (
          <tr key={i}>
            <td>{event.preview}</td>
            <td>
              {RESOLUTION[event.resolutionType]} <strong>{event.resolution}</strong>
              {event.resolutionParams && (
                <pre>
                  <code>{JSON.stringify(event.resolutionParams, null, 2)}</code>
                </pre>
              )}
            </td>
            <td>{event.updatedAt}</td>
            <td>
              <Button onClick={() => resetEvent('' + event.id)} small icon="refresh" intent={Intent.PRIMARY}>
                Reset
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </HTMLTable>
  )

export default ResolvedEventsList
