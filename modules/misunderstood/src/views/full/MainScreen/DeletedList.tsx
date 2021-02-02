import { Button, HTMLTable, Intent } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React from 'react'

import { DbFlaggedEvent } from '../../../types'
import style from '../style.scss'

interface Props {
  events: DbFlaggedEvent[]
  totalEventsCount: number
  undeleteEvent: (id: number) => void
}

const DeletedList = ({ events, totalEventsCount, undeleteEvent }: Props) => (
  <>
    <h3>{lang.tr('module.misunderstood.ignoredMisunderstood', { count: totalEventsCount })}</h3>
    {events && !!events.length && (
      <HTMLTable className={style.mainViewTable} condensed interactive striped>
        <thead>
          <tr>
            <th>{lang.tr('module.misunderstood.phrase')}</th>
            <th className={style.thUpdated}>{lang.tr('module.misunderstood.deleted')}</th>
            <th className={style.thAction}>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, i) => (
            <tr key={i}>
              <td>{event.preview}</td>
              <td>{event.updatedAt}</td>
              <td>
                <Button onClick={() => undeleteEvent(event.id)} small icon="refresh" intent={Intent.PRIMARY}>
                  {lang.tr('module.misunderstood.restore')}
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
