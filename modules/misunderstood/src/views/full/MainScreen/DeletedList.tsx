import { Button, HTMLTable, Intent } from '@blueprintjs/core'
import React from 'react'

import { DbFlaggedEvent } from '../../../types'
import style from '../style.scss'

interface Props {
  events: DbFlaggedEvent[]
  totalEventsCount: number
  undeleteEvent: (id: string) => void
}

const DeletedList = ({ events, totalEventsCount, undeleteEvent }: Props) => (
  <>
    <h3>Ignored Misunderstood ({totalEventsCount})</h3>
    {events && !!events.length && (
      <HTMLTable className={style.mainViewTable} condensed interactive striped>
        <thead>
          <tr>
            <th>Phrase</th>
            <th className={style.thUpdated}>Deleted</th>
            <th className={style.thAction}>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, i) => (
            <tr key={i}>
              <td>{event.preview}</td>
              <td>{event.updatedAt}</td>
              <td>
                <Button onClick={() => undeleteEvent('' + event.id)} small icon="refresh" intent={Intent.PRIMARY}>
                  Restore
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </HTMLTable>
    )}
  </>
)

export default DeletedList
